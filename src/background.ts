import { deriveFilename } from './common/filename';
import { devLog } from './common/logging';
import {
  DownloadImageRequest,
  DownloadImageResponse,
  HeadImageRequest,
  HeadImageResponse,
  MessageType,
  RequestMessage,
} from './common/messages';
import { readActiveState, readOptions, writeActiveState } from './common/options';

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

const applyIcon = async (active: boolean): Promise<void> => {
  try {
    await chrome.action.setIcon({ path: active ? ICONS_ACTIVE : ICONS_INACTIVE });
  } catch (error) {
    devLog('warn', 'Failed to set action icon', error);
  }
  try {
    await chrome.action.setTitle({
      title: active ? 'Image Helper (active — click to disable)' : 'Image Helper (click to enable)',
    });
  } catch (error) {
    devLog('warn', 'Failed to set action title', error);
  }
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

chrome.runtime.onInstalled.addListener(async () => {
  const active = await readActiveState();
  await applyIcon(active);
});

chrome.runtime.onStartup.addListener(async () => {
  const active = await readActiveState();
  await applyIcon(active);
});

chrome.action.onClicked.addListener(async () => {
  const current = await readActiveState();
  const next = !current;
  await writeActiveState(next);
  await applyIcon(next);
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
