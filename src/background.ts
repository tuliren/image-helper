import { deriveFilename } from './common/filename';
import {
  ACTIVE_STATE_STORAGE_KEY,
  readActiveState,
  readOptions,
  writeActiveState,
} from './common/options';
import {
  DownloadImageRequest,
  DownloadImageResponse,
  HeadImageRequest,
  HeadImageResponse,
  MessageType,
  RequestMessage,
} from './common/messages';

const ICONS_ACTIVE = {
  '16': 'icons/icon-16-active.png',
  '48': 'icons/icon-48-active.png',
  '128': 'icons/icon-128-active.png',
};

const ICONS_INACTIVE = {
  '16': 'icons/icon-16.png',
  '48': 'icons/icon-48.png',
  '128': 'icons/icon-128.png',
};

const BADGE_ACTIVE_TEXT = 'ON';
const BADGE_ACTIVE_COLOR = '#0284c7';
const BADGE_INACTIVE_TEXT = '';

const log = (...data: unknown[]) => {
  console.log('[image-helper]', ...data);
};

const applyVisualState = async (active: boolean): Promise<void> => {
  log('applyVisualState', { active });
  try {
    await chrome.action.setIcon({ path: active ? ICONS_ACTIVE : ICONS_INACTIVE });
  } catch (error) {
    console.warn('[image-helper] setIcon failed', error);
  }
  try {
    await chrome.action.setTitle({
      title: active ? 'Image Helper (active — click to disable)' : 'Image Helper (click to enable)',
    });
  } catch (error) {
    console.warn('[image-helper] setTitle failed', error);
  }
  try {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_ACTIVE_COLOR });
    await chrome.action.setBadgeText({ text: active ? BADGE_ACTIVE_TEXT : BADGE_INACTIVE_TEXT });
  } catch (error) {
    console.warn('[image-helper] setBadge failed', error);
  }
};

const toggleActive = async (): Promise<void> => {
  const current = await readActiveState();
  const next = !current;
  log('toggleActive', { current, next });
  await writeActiveState(next);
  await applyVisualState(next);
};

const handleHeadImage = async (request: HeadImageRequest): Promise<HeadImageResponse> => {
  try {
    const response = await fetch(request.url, { method: 'HEAD', credentials: 'include' });
    if (!response.ok) {
      return { ok: false, error: `HEAD ${response.status}` };
    }
    const lengthHeader = response.headers.get('content-length');
    const bytes = lengthHeader == null ? undefined : Number(lengthHeader);
    return { ok: true, bytes: Number.isFinite(bytes) ? bytes : undefined };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
};

const handleDownloadImage = async (
  request: DownloadImageRequest
): Promise<DownloadImageResponse> => {
  try {
    const options = await readOptions();
    let contentType: string | undefined;
    try {
      const head = await fetch(request.url, { method: 'HEAD', credentials: 'include' });
      contentType = head.headers.get('content-type') ?? undefined;
    } catch {
      contentType = undefined;
    }

    const filename = deriveFilename({
      url: request.url,
      subdir: options.downloadSubdir,
      contentType,
    });

    const downloadId = await chrome.downloads.download({
      url: request.url,
      filename,
      conflictAction: 'uniquify',
      saveAs: false,
    });

    if (downloadId == null) {
      return { ok: false, error: 'downloads.download returned no id' };
    }

    return { ok: true, filename };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
};

chrome.runtime.onInstalled.addListener(async (details) => {
  log('onInstalled', details);
  await applyVisualState(await readActiveState());
});

chrome.runtime.onStartup.addListener(async () => {
  log('onStartup');
  await applyVisualState(await readActiveState());
});

chrome.action.onClicked.addListener((tab) => {
  log('action.onClicked', { tabId: tab.id });
  toggleActive().catch((error) => console.error('[image-helper] toggle failed', error));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[ACTIVE_STATE_STORAGE_KEY] != null) {
    const nextValue = Boolean(changes[ACTIVE_STATE_STORAGE_KEY].newValue);
    log('storage.onChanged ACTIVE_STATE', { nextValue });
    applyVisualState(nextValue).catch((error) =>
      console.error('[image-helper] applyVisualState failed', error)
    );
  }
});

chrome.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
  const message = rawMessage as RequestMessage | undefined;
  if (message == null) {
    return false;
  }
  if (message.type === MessageType.HeadImage) {
    handleHeadImage(message).then(sendResponse);
    return true;
  }
  if (message.type === MessageType.DownloadImage) {
    handleDownloadImage(message).then(sendResponse);
    return true;
  }
  return false;
});

void (async () => {
  log('service worker boot');
  await applyVisualState(await readActiveState());
})();
