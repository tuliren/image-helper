/**
 * Minimum rendered dimension (px, per side) used as a no-network proxy when an
 * image's byte size can't be determined — e.g. the host rejects HEAD requests
 * (405/403) or serves the image without a `Content-Length` header. In that case
 * we "fail open" rather than silently excluding the image, but still skip
 * obvious icons/sprites that fall below this size on either side.
 */
export const MIN_FALLBACK_DIMENSION_PX = 200;

export interface QualifyImageInput {
  /** Byte size from a successful HEAD, or `null` when the size is unknown. */
  bytes: number | null;
  /** Intrinsic width of the loaded image in px (`image.naturalWidth`). */
  naturalWidth: number;
  /** Intrinsic height of the loaded image in px (`image.naturalHeight`). */
  naturalHeight: number;
  /** Size gate in bytes derived from the user's `thresholdKb` option. */
  thresholdBytes: number;
}

/**
 * Decide whether an image is large enough to show the toolbar / enable the
 * middle-click shortcut.
 *
 * When the byte size is known we gate strictly on it. When it's unknown (HEAD
 * blocked, no `Content-Length`, etc.) we fail open and fall back to the
 * rendered dimensions so the extension still works on hosts that don't expose a
 * measurable size.
 */
export const qualifiesForToolbar = ({
  bytes,
  naturalWidth,
  naturalHeight,
  thresholdBytes,
}: QualifyImageInput): boolean => {
  if (bytes != null) {
    return bytes >= thresholdBytes;
  }
  return naturalWidth >= MIN_FALLBACK_DIMENSION_PX && naturalHeight >= MIN_FALLBACK_DIMENSION_PX;
};
