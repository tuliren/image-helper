import { estimateBytesFromDimensions, qualifiesForToolbar } from '../imageQualify';

const THRESHOLD_BYTES = 100 * 1024; // 102,400

describe('estimateBytesFromDimensions', () => {
  it.each([
    { width: 1000, height: 1000, expected: 300000, name: '1000x1000 megapixel image' },
    { width: 900, height: 1200, expected: 324000, name: 'real 900x1200 sample' },
    { width: 100, height: 50, expected: 1500, name: 'small image' },
    { width: 0, height: 0, expected: 0, name: 'unloaded image is zero' },
  ])('$name', ({ width, height, expected }) => {
    expect(estimateBytesFromDimensions(width, height)).toBe(expected);
  });
});

describe('qualifiesForToolbar', () => {
  describe('known byte size gates strictly on the threshold', () => {
    it.each([
      { bytes: THRESHOLD_BYTES + 1, expected: true, name: 'above threshold qualifies' },
      { bytes: THRESHOLD_BYTES, expected: true, name: 'exactly at threshold qualifies' },
      { bytes: THRESHOLD_BYTES - 1, expected: false, name: 'below threshold is excluded' },
      { bytes: 0, expected: false, name: 'zero bytes is excluded' },
    ])('$name', ({ bytes, expected }) => {
      // Dimensions are large to prove they are ignored when the real size is known.
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

  describe('unknown byte size estimates from dimensions against the same threshold', () => {
    it.each([
      {
        width: 900,
        height: 1200,
        expected: true,
        name: 'real 900x1200 sample (~324 KB) qualifies',
      },
      { width: 600, height: 600, expected: true, name: '600x600 (~108 KB) just clears threshold' },
      { width: 500, height: 500, expected: false, name: '500x500 (~75 KB) is below threshold' },
      { width: 16, height: 16, expected: false, name: 'tiny icon is excluded' },
      { width: 0, height: 0, expected: false, name: 'not-yet-loaded image is excluded' },
    ])('$name', ({ width, height, expected }) => {
      expect(
        qualifiesForToolbar({
          bytes: null,
          naturalWidth: width,
          naturalHeight: height,
          thresholdBytes: THRESHOLD_BYTES,
        })
      ).toBe(expected);
    });
  });
});
