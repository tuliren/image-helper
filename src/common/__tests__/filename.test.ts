import { deriveFilename } from '../filename';

describe('deriveFilename', () => {
  it.each([
    {
      name: 'plain url with extension',
      url: 'https://example.com/path/photo.jpg',
      subdir: 'pics',
      contentType: undefined,
      expected: 'pics/photo.jpg',
    },
    {
      name: 'query string is stripped',
      url: 'https://example.com/path/photo.png?w=100&h=200',
      subdir: 'image-downloads',
      contentType: undefined,
      expected: 'image-downloads/photo.png',
    },
    {
      name: 'no extension, content-type provides one',
      url: 'https://example.com/images/abc123',
      subdir: 'image-downloads',
      contentType: 'image/webp',
      expected: 'image-downloads/abc123.webp',
    },
    {
      name: 'no extension and no content type falls back to raw name',
      url: 'https://example.com/images/abc123',
      subdir: 'downloads',
      contentType: undefined,
      expected: 'downloads/abc123',
    },
    {
      name: 'content-type with charset suffix still maps',
      url: 'https://example.com/images/foo',
      subdir: 'pics',
      contentType: 'image/jpeg; charset=binary',
      expected: 'pics/foo.jpg',
    },
    {
      name: 'encoded characters are decoded',
      url: 'https://example.com/images/my%20photo.png',
      subdir: 'pics',
      contentType: undefined,
      expected: 'pics/my photo.png',
    },
    {
      name: 'empty subdir falls back to default',
      url: 'https://example.com/photo.png',
      subdir: '',
      contentType: undefined,
      expected: 'image-downloads/photo.png',
    },
    {
      name: 'subdir with leading slash is sanitized',
      url: 'https://example.com/photo.png',
      subdir: '/pics/cats/',
      contentType: undefined,
      expected: 'pics/cats/photo.png',
    },
    {
      name: 'invalid filename chars are replaced',
      url: 'https://example.com/a%3Fb%3Cc.png',
      subdir: 'pics',
      contentType: undefined,
      expected: 'pics/a_b_c.png',
    },
    {
      name: 'malformed url falls back to path parsing',
      url: 'not-a-url/photo.gif',
      subdir: 'pics',
      contentType: undefined,
      expected: 'pics/photo.gif',
    },
  ])('$name', ({ url, subdir, contentType, expected }) => {
    expect(deriveFilename({ url, subdir, contentType })).toBe(expected);
  });
});
