import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { Readability } from '@mozilla/readability';
import { config } from '../config';

export type ReaderResult = {
  ok: boolean;
  title?: string;
  byline?: string;
  publishedTime?: string;
  contentHtml?: string;
  excerpt?: string;
  siteName?: string;
  url: string;
  error?: string;
};

function pickPublished(document: Document): string | undefined {
  const node = document.querySelector('meta[property="article:published_time"], meta[name="date"], time[datetime]');
  if (!node) {
    return undefined;
  }
  if (node.tagName.toLowerCase() === 'meta') {
    return node.getAttribute('content') || undefined;
  }
  return node.getAttribute('datetime') || undefined;
}

function sanitize(html: string): string {
  const dom = new JSDOM('');
  const DOMPurify = createDOMPurify(dom.window as unknown as Parameters<typeof createDOMPurify>[0]);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'img', 'figure',
      'figcaption', 'strong', 'em', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'time', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'datetime', 'target', 'rel']
  });
}

export async function extractReader(url: string): Promise<ReaderResult> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), config.browserTimeoutMs);
  try {
    const response = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': config.userAgent }
    });
    if (!response.ok) {
      return { ok: false, url, error: `Fetch failed: ${response.status}` };
    }
    const text = await response.text();
    if (text.length > config.maxReaderBytes) {
      return { ok: false, url, error: 'Content too large for reader mode.' };
    }
    const dom = new JSDOM(text, { url: response.url });
    const article = new Readability(dom.window.document).parse();
    if (!article || !article.content) {
      return { ok: false, url, error: 'Reader extraction failed.' };
    }

    const contentHtml = sanitize(article.content);
    return {
      ok: true,
      url: response.url,
      title: article.title,
      byline: article.byline,
      excerpt: article.excerpt,
      siteName: article.siteName,
      contentHtml,
      publishedTime: pickPublished(dom.window.document)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown reader error.';
    return { ok: false, url, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
