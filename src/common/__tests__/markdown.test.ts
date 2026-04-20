import { getHtmlMarkdown } from '../markdown';

describe('getHtmlMarkdown', () => {
  it('converts headings and paragraphs', () => {
    const html = '<h1>Hello</h1><p>world</p>';
    expect(getHtmlMarkdown(html)).toBe('# Hello\n\nworld');
  });

  it('uses atx headings and bullet markers', () => {
    const html = '<h2>Title</h2><ul><li>one</li><li>two</li></ul>';
    expect(getHtmlMarkdown(html)).toBe('## Title\n\n-   one\n-   two');
  });

  it('emits fenced code blocks for standalone pre', () => {
    const html = '<pre>const x = 1;</pre>';
    expect(getHtmlMarkdown(html)).toBe('```\nconst x = 1;\n```');
  });

  it('strips navigation and script tags', () => {
    const html = '<nav>skip</nav><p>keep</p><script>alert(1)</script>';
    expect(getHtmlMarkdown(html)).toBe('keep');
  });
});
