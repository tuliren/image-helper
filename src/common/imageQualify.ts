/**
 * Rough estimate of compressed bytes per pixel for a typical photographic image
 * (JPEG/WebP at moderate quality). Real density varies a lot with format,
 * quality, and content, so this is only an approximation used when the host
 * won't give us a real `Content-Length` — enough to tell a downloadable photo
 * from a small icon, not an exact figure.
 *
 * Calibrated against a real sample (a 900×1200 JPEG measured at 0.317 B/px).
 */
export const ESTIMATED_BYTES_PER_PIXEL = 0.3;

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
 * Approximate an image's byte size from its pixel area. Returns 0 for an
 * unloaded image (`naturalWidth`/`naturalHeight` are 0 until it decodes), which
 * keeps such images below any positive threshold.
 */
export const estimateBytesFromDimensions = (naturalWidth: number, naturalHeight: number): number =>
  Math.round(naturalWidth * naturalHeight * ESTIMATED_BYTES_PER_PIXEL);

/**
 * Decide whether an image is large enough to show the toolbar / enable the
 * middle-click shortcut.
 *
 * When the byte size is known we gate strictly on it. When it's unknown (HEAD
 * blocked, no `Content-Length`, etc.) we fail open and estimate the size from
 * the rendered dimensions, then apply the *same* threshold — so one KB setting
 * governs both paths and the extension still works on hosts that won't expose a
 * measurable size.
 */
export const qualifiesForToolbar = ({
  bytes,
  naturalWidth,
  naturalHeight,
  thresholdBytes,
}: QualifyImageInput): boolean => {
  const effectiveBytes = bytes ?? estimateBytesFromDimensions(naturalWidth, naturalHeight);
  return effectiveBytes >= thresholdBytes;
};
