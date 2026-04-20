export type MiddleClickAction = 'none' | 'open' | 'save';

export interface ExtensionOptions {
  thresholdKb: number;
  downloadSubdir: string;
  middleClickAction: MiddleClickAction;
}

export const DEFAULT_DOWNLOAD_SUBDIR = 'image-downloads';

export const DEFAULT_OPTIONS: ExtensionOptions = {
  thresholdKb: 100,
  downloadSubdir: DEFAULT_DOWNLOAD_SUBDIR,
  middleClickAction: 'none',
};

export const OPTIONS_STORAGE_KEY = 'extension_options';
export const ACTIVE_STATE_STORAGE_KEY = 'image_helper_active';

export const sanitizeSubdir = (input: string): string => {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') {
    return DEFAULT_DOWNLOAD_SUBDIR;
  }
  const segments = trimmed
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  const safe = segments.filter((segment) => segment !== '..' && segment !== '.');
  if (safe.length === 0) {
    return DEFAULT_DOWNLOAD_SUBDIR;
  }
  return safe.join('/');
};

export const readOptions = async (): Promise<ExtensionOptions> => {
  if (chrome?.storage?.sync == null) {
    return DEFAULT_OPTIONS;
  }
  const result = await chrome.storage.sync.get(OPTIONS_STORAGE_KEY);
  const stored = result[OPTIONS_STORAGE_KEY] as Partial<ExtensionOptions> | undefined;
  return { ...DEFAULT_OPTIONS, ...(stored ?? {}) };
};

export const writeOptions = async (options: ExtensionOptions): Promise<void> => {
  if (chrome?.storage?.sync == null) {
    return;
  }
  await chrome.storage.sync.set({ [OPTIONS_STORAGE_KEY]: options });
};

export const readActiveState = async (): Promise<boolean> => {
  if (chrome?.storage?.local == null) {
    return false;
  }
  const result = await chrome.storage.local.get(ACTIVE_STATE_STORAGE_KEY);
  return Boolean(result[ACTIVE_STATE_STORAGE_KEY]);
};

export const writeActiveState = async (active: boolean): Promise<void> => {
  if (chrome?.storage?.local == null) {
    return;
  }
  await chrome.storage.local.set({ [ACTIVE_STATE_STORAGE_KEY]: active });
};
