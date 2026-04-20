import { sanitizeSubdir } from './options';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
};

// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

const sanitizeBase = (name: string): string => {
  const cleaned = name.replace(INVALID_FILENAME_CHARS, '_').trim();
  return cleaned.length === 0 ? 'image' : cleaned;
};

const extensionFromContentType = (contentType: string | undefined): string | null => {
  if (contentType == null) {
    return null;
  }
  const primary = contentType.split(';')[0].trim().toLowerCase();
  return EXTENSION_BY_CONTENT_TYPE[primary] ?? null;
};

export interface DeriveFilenameInput {
  url: string;
  subdir: string;
  contentType?: string;
}

export const deriveFilename = ({ url, subdir, contentType }: DeriveFilenameInput): string => {
  const safeSubdir = sanitizeSubdir(subdir);

  let pathname = '';
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }

  const rawSegment = decodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? '');
  let base = sanitizeBase(rawSegment);

  const dotIndex = base.lastIndexOf('.');
  const hasExtension = dotIndex > 0 && dotIndex < base.length - 1;

  if (!hasExtension) {
    const ext = extensionFromContentType(contentType);
    if (ext != null) {
      base = `${base}.${ext}`;
    }
  }

  return `${safeSubdir}/${base}`;
};
