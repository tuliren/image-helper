import { DEFAULT_DOWNLOAD_SUBDIR, sanitizeSubdir } from '../options';

describe('sanitizeSubdir', () => {
  it.each([
    { input: '', expected: DEFAULT_DOWNLOAD_SUBDIR, name: 'empty string uses default' },
    { input: '   ', expected: DEFAULT_DOWNLOAD_SUBDIR, name: 'whitespace only uses default' },
    { input: 'pics', expected: 'pics', name: 'single segment' },
    { input: 'pics/cats', expected: 'pics/cats', name: 'multi segment stays' },
    { input: '/pics/cats', expected: 'pics/cats', name: 'leading slash stripped' },
    { input: 'pics/cats/', expected: 'pics/cats', name: 'trailing slash stripped' },
    { input: 'pics//cats', expected: 'pics/cats', name: 'double slash collapsed' },
    { input: 'pics\\cats', expected: 'pics/cats', name: 'backslash normalized' },
    { input: '../etc', expected: 'etc', name: 'parent dir segment stripped' },
    { input: './pics', expected: 'pics', name: 'current dir segment stripped' },
    { input: '..', expected: DEFAULT_DOWNLOAD_SUBDIR, name: 'only parent dir uses default' },
    { input: ' pics / cats ', expected: 'pics/cats', name: 'inner segment whitespace trimmed' },
  ])('$name', ({ input, expected }) => {
    expect(sanitizeSubdir(input)).toBe(expected);
  });
});
