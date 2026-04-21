import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { Readability } from '@mozilla/readability';
import { appConfig } from './config';

export type ReaderResult = {
  ok: boolean;
  url: string;
  title?: string;
  byline?: string;
  publishedTime?: string;
  excerpt?: string;
  contentHtml?: string;
  error?: string;
  suggestLiveMode?: boolean;
};

function sanitize(html: string): string {
  const dom = new JSDOM('');
  const DOMPurify = createDOMPurify(dom.window as unknown as Parameters<typeof createDOMPurify>[0]);
  return DOMPurify.sanitize(html);
}

function findPublished(document: Document): string | undefined {
  const node = document.querySelector('meta[property="article:published_time"],meta[name="date"],time[datetime]');
  if (!node) return undefined;
  if (node.tagName.toLowerCase() === 'meta') return node.getAttribute('content') || undefined;
  return node.getAttribute('datetime') || undefined;
}

export async function extractReaderContent(url: string): Promise<ReaderResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), appConfig.browserTimeoutMs);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': appConfig.userAgent } });
    if (!resp.ok) return { ok: false, url, error: `Fetch failed (${resp.status})`, suggestLiveMode: true };
    const html = await resp.text();
    if (html.length > appConfig.maxReaderBytes) return { ok: false, url, error: 'Page too large for Reader Mode.', suggestLiveMode: true };
    const dom = new JSDOM(html, { url: resp.url });
    const parsed = new Readability(dom.window.document).parse();
    if (!parsed || !parsed.content) return { ok: false, url, error: 'Could not extract article content.', suggestLiveMode: true };
    return {
      ok: true,
      url: resp.url,
      title: parsed.title,
      byline: parsed.byline,
      excerpt: parsed.excerpt,
      contentHtml: sanitize(parsed.content),
      publishedTime: findPublished(dom.window.document)
    };
  } catch (e) {
    return { ok: false, url, error: e instanceof Error ? e.message : 'Unknown error', suggestLiveMode: true };
  } finally {
    clearTimeout(timer);
  }
}
