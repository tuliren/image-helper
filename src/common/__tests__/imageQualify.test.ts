import { MIN_FALLBACK_DIMENSION_PX, qualifiesForToolbar } from '../imageQualify';

const THRESHOLD_BYTES = 100 * 1024;

describe('qualifiesForToolbar', () => {
  describe('known byte size gates strictly on the threshold', () => {
    it.each([
      { bytes: THRESHOLD_BYTES + 1, expected: true, name: 'above threshold qualifies' },
      { bytes: THRESHOLD_BYTES, expected: true, name: 'exactly at threshold qualifies' },
      { bytes: THRESHOLD_BYTES - 1, expected: false, name: 'below threshold is excluded' },
      { bytes: 0, expected: false, name: 'zero bytes is excluded' },
    ])('$name', ({ bytes, expected }) => {
      // Dimensions are intentionally large to prove they are ignored when bytes are known.
      expect(
        qualifiesForToolbar({
          bytes,
          naturalWidth: 4000,
          naturalHeight: 4000,
          thresholdBytes: THRESHOLD_BYTES,
        })
      ).toBe(expected);
    });
  });

  describe('unknown byte size fails open using rendered dimensions', () => {
    it.each([
      {
        naturalWidth: MIN_FALLBACK_DIMENSION_PX + 1,
        naturalHeight: MIN_FALLBACK_DIMENSION_PX + 1,
        expected: true,
        name: 'large on both sides qualifies',
      },
      {
        naturalWidth: MIN_FALLBACK_DIMENSION_PX,
        naturalHeight: MIN_FALLBACK_DIMENSION_PX,
        expected: true,
        name: 'exactly at the minimum on both sides qualifies',
      },
      {
        naturalWidth: MIN_FALLBACK_DIMENSION_PX - 1,
        naturalHeight: MIN_FALLBACK_DIMENSION_PX,
        expected: false,
        name: 'too narrow is excluded',
      },
      {
        naturalWidth: MIN_FALLBACK_DIMENSION_PX,
        naturalHeight: MIN_FALLBACK_DIMENSION_PX - 1,
        expected: false,
        name: 'too short is excluded',
      },
      {
        naturalWidth: 16,
        naturalHeight: 16,
        expected: false,
        name: 'tiny icon is excluded',
      },
      {
        naturalWidth: 0,
        naturalHeight: 0,
        expected: false,
        name: 'not-yet-loaded image is excluded',
      },
    ])('$name', ({ naturalWidth, naturalHeight, expected }) => {
      expect(
        qualifiesForToolbar({
          bytes: null,
          naturalWidth,
          naturalHeight,
          thresholdBytes: THRESHOLD_BYTES,
        })
      ).toBe(expected);
    });
  });
});
