import { devLog } from './common/logging';
import {
  DownloadImageRequest,
  DownloadImageResponse,
  HeadImageRequest,
  HeadImageResponse,
  MessageType,
} from './common/messages';
import {
  ACTIVE_STATE_STORAGE_KEY,
  DEFAULT_OPTIONS,
  ExtensionOptions,
  OPTIONS_STORAGE_KEY,
  readActiveState,
  readOptions,
} from './common/options';
import { SizeCache } from './common/sizeCache';
// eslint-disable-next-line import-x/no-unresolved
import tailwindCss from './styles/tailwind.css?raw';

interface State {
  active: boolean;
  options: ExtensionOptions;
}

const state: State = {
  active: false,
  options: DEFAULT_OPTIONS,
};

const sizeCache = new SizeCache();
const qualifyingImages = new WeakSet<HTMLImageElement>();
const trackedImages = new Set<HTMLImageElement>();
const downloadedUrls = new Set<string>();

let intersectionObserver: IntersectionObserver | null = null;
let mutationObserver: MutationObserver | null = null;

const headImage = async (url: string): Promise<HeadImageResponse> => {
  const request: HeadImageRequest = { type: MessageType.HeadImage, url };
  return chrome.runtime.sendMessage(request);
};

const requestDownload = async (url: string): Promise<DownloadImageResponse> => {
  const request: DownloadImageRequest = { type: MessageType.DownloadImage, url };
  return chrome.runtime.sendMessage(request);
};

const resolveUrl = (image: HTMLImageElement): string | null => {
  const raw = image.currentSrc || image.src;
  if (raw == null || raw === '') {
    return null;
  }
  if (raw.startsWith('data:') || raw.startsWith('blob:')) {
    return null;
  }
  return raw;
};

const thresholdBytes = (): number => state.options.thresholdKb * 1024;

const isQualifyingSize = (bytes: number | null | undefined): boolean => {
  if (bytes == null) {
    return false;
  }
  return bytes >= thresholdBytes();
};

interface ToolbarHandle {
  host: HTMLDivElement;
  root: ShadowRoot;
  buttonOpen: HTMLButtonElement;
  buttonSave: HTMLButtonElement;
  spinner: HTMLSpanElement;
  saveLabel: HTMLSpanElement;
  saveIcon: HTMLSpanElement;
  attach(image: HTMLImageElement): void;
  hide(): void;
  reposition(): void;
  isHoveringToolbar(): boolean;
}

const TOOLBAR_OFFSET = 6;
const HIDE_DELAY_MS = 120;

let toolbar: ToolbarHandle | null = null;
let toolbarTimeout: number | null = null;

const createToolbar = (): ToolbarHandle => {
  const host = document.createElement('div');
  host.id = '__image-helper-toolbar-host__';
  host.style.cssText =
    'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = tailwindCss;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className =
    'pointer-events-auto inline-flex items-center gap-1 rounded-md bg-slate-900/90 p-1 font-sans text-xs text-white shadow-lg backdrop-blur fixed';
  container.style.position = 'fixed';

  const buttonBase =
    'inline-flex items-center gap-1 rounded px-2 py-1 font-medium transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400';

  const buttonOpen = document.createElement('button');
  buttonOpen.type = 'button';
  buttonOpen.className = buttonBase;
  buttonOpen.innerHTML = '<span aria-hidden="true">↗</span><span>Open</span>';
  buttonOpen.title = 'Open image in new tab';

  const buttonSave = document.createElement('button');
  buttonSave.type = 'button';
  buttonSave.className = buttonBase;
  const saveIcon = document.createElement('span');
  saveIcon.setAttribute('aria-hidden', 'true');
  saveIcon.textContent = '⬇';
  const saveLabel = document.createElement('span');
  saveLabel.textContent = 'Save';
  const spinner = document.createElement('span');
  spinner.className = 'hidden';
  spinner.textContent = '…';
  buttonSave.append(saveIcon, saveLabel, spinner);
  buttonSave.title = 'Download image';

  container.append(buttonOpen, buttonSave);
  shadow.appendChild(container);
  document.documentElement.appendChild(host);

  const handle: ToolbarHandle = {
    host,
    root: shadow,
    buttonOpen,
    buttonSave,
    spinner,
    saveLabel,
    saveIcon,
    attach() {},
    hide() {},
    reposition() {},
    isHoveringToolbar: () => host.matches(':hover') || container.matches(':hover'),
  };

  let currentImage: HTMLImageElement | null = null;
  let currentUrl: string | null = null;

  const updateSaveAppearance = () => {
    if (currentUrl != null && downloadedUrls.has(currentUrl)) {
      saveIcon.textContent = '✓';
      saveLabel.textContent = 'Saved';
      buttonSave.classList.add('bg-emerald-600/80', 'hover:bg-emerald-500');
      buttonSave.classList.remove('hover:bg-white/10');
    } else {
      saveIcon.textContent = '⬇';
      saveLabel.textContent = 'Save';
      buttonSave.classList.remove('bg-emerald-600/80', 'hover:bg-emerald-500');
      buttonSave.classList.add('hover:bg-white/10');
    }
  };

  const reposition = () => {
    if (currentImage == null || !currentImage.isConnected) {
      handle.hide();
      return;
    }
    const rect = currentImage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      handle.hide();
      return;
    }
    const top = Math.max(4, rect.top + TOOLBAR_OFFSET);
    const left = Math.max(4, rect.left + TOOLBAR_OFFSET);
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
  };

  const onScrollOrResize = () => reposition();

  buttonOpen.addEventListener('click', (event) => {
    event.stopPropagation();
    if (currentUrl != null) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  });

  buttonSave.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (currentUrl == null) {
      return;
    }
    spinner.classList.remove('hidden');
    buttonSave.setAttribute('disabled', 'true');
    const targetUrl = currentUrl;
    try {
      const response = await requestDownload(targetUrl);
      if (response?.ok) {
        downloadedUrls.add(targetUrl);
        if (currentUrl === targetUrl) {
          updateSaveAppearance();
        }
      } else {
        devLog('warn', 'Download failed', response?.error);
      }
    } finally {
      spinner.classList.add('hidden');
      buttonSave.removeAttribute('disabled');
    }
  });

  container.addEventListener('mouseenter', () => {
    if (toolbarTimeout != null) {
      window.clearTimeout(toolbarTimeout);
      toolbarTimeout = null;
    }
  });

  container.addEventListener('mouseleave', () => {
    handle.hide();
  });

  handle.attach = (image) => {
    currentImage = image;
    currentUrl = resolveUrl(image);
    if (currentUrl == null) {
      handle.hide();
      return;
    }
    updateSaveAppearance();
    container.style.visibility = 'visible';
    container.style.display = 'inline-flex';
    reposition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
  };

  handle.hide = () => {
    container.style.visibility = 'hidden';
    container.style.display = 'none';
    currentImage = null;
    currentUrl = null;
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
  };

  handle.reposition = reposition;
  handle.hide();
  return handle;
};

const ensureToolbar = (): ToolbarHandle => {
  if (toolbar == null) {
    toolbar = createToolbar();
  }
  return toolbar;
};

const scheduleHideToolbar = () => {
  if (toolbar == null) {
    return;
  }
  if (toolbarTimeout != null) {
    window.clearTimeout(toolbarTimeout);
  }
  toolbarTimeout = window.setTimeout(() => {
    toolbarTimeout = null;
    if (toolbar != null && !toolbar.isHoveringToolbar()) {
      toolbar.hide();
    }
  }, HIDE_DELAY_MS);
};

const showToolbarFor = (image: HTMLImageElement) => {
  if (!state.active || !qualifyingImages.has(image)) {
    return;
  }
  if (toolbarTimeout != null) {
    window.clearTimeout(toolbarTimeout);
    toolbarTimeout = null;
  }
  ensureToolbar().attach(image);
};

const measureImage = async (image: HTMLImageElement): Promise<void> => {
  const url = resolveUrl(image);
  if (url == null) {
    return;
  }
  const cached = sizeCache.get(url);
  const result =
    cached ??
    (await sizeCache.fetch(url, async (u) => {
      const response = await headImage(u);
      return { bytes: response?.ok ? (response.bytes ?? null) : null };
    }));
  if (isQualifyingSize(result.bytes)) {
    qualifyingImages.add(image);
  }
};

const onImageEnter = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement;
  if (!state.active) {
    return;
  }
  if (qualifyingImages.has(image)) {
    showToolbarFor(image);
    return;
  }
  measureImage(image).then(() => {
    if (state.active && qualifyingImages.has(image) && image.matches(':hover')) {
      showToolbarFor(image);
    }
  });
};

const onImageLeave = () => {
  scheduleHideToolbar();
};

const trackImage = (image: HTMLImageElement) => {
  if (trackedImages.has(image)) {
    return;
  }
  trackedImages.add(image);
  image.addEventListener('mouseenter', onImageEnter);
  image.addEventListener('mouseleave', onImageLeave);
  if (intersectionObserver != null) {
    intersectionObserver.observe(image);
  }
};

const scanAllImages = () => {
  document.querySelectorAll('img').forEach((image) => trackImage(image as HTMLImageElement));
};

const setupIntersectionObserver = () => {
  if (intersectionObserver != null) {
    return;
  }
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          measureImage(image);
        }
      });
    },
    { rootMargin: '200px' }
  );
};

const setupMutationObserver = () => {
  if (mutationObserver != null) {
    return;
  }
  mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) {
          trackImage(node);
        } else if (node instanceof Element) {
          node.querySelectorAll('img').forEach((image) => trackImage(image as HTMLImageElement));
        }
      });
    }
  });
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
};

const handleMiddleClick = (event: MouseEvent) => {
  if (!state.active || event.button !== 1) {
    return;
  }
  const action = state.options.middleClickAction;
  if (action === 'none') {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (!(target instanceof HTMLImageElement)) {
    return;
  }
  if (!qualifyingImages.has(target)) {
    measureImage(target);
    return;
  }
  const url = resolveUrl(target);
  if (url == null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (action === 'open') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  if (action === 'save') {
    requestDownload(url).then((response) => {
      if (response?.ok) {
        downloadedUrls.add(url);
      }
    });
  }
};

const start = () => {
  setupIntersectionObserver();
  setupMutationObserver();
  scanAllImages();
  trackedImages.forEach((image) => intersectionObserver?.observe(image));
  document.addEventListener('mousedown', handleMiddleClick, true);
  document.addEventListener('auxclick', handleMiddleClick, true);
};

const stop = () => {
  if (intersectionObserver != null) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
  if (mutationObserver != null) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  document.removeEventListener('mousedown', handleMiddleClick, true);
  document.removeEventListener('auxclick', handleMiddleClick, true);
  if (toolbar != null) {
    toolbar.hide();
  }
};

const applyActive = (active: boolean) => {
  const wasActive = state.active;
  state.active = active;
  if (active && !wasActive) {
    start();
  } else if (!active && wasActive) {
    stop();
  }
};

const bootstrap = async () => {
  const [options, active] = await Promise.all([readOptions(), readActiveState()]);
  state.options = options;
  applyActive(active);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[OPTIONS_STORAGE_KEY] != null) {
      const next = changes[OPTIONS_STORAGE_KEY].newValue as Partial<ExtensionOptions> | undefined;
      state.options = { ...DEFAULT_OPTIONS, ...(next ?? {}) };
    }
    if (areaName === 'local' && changes[ACTIVE_STATE_STORAGE_KEY] != null) {
      applyActive(Boolean(changes[ACTIVE_STATE_STORAGE_KEY].newValue));
    }
  });
};

void bootstrap();
