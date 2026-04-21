import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

type ReaderPayload = {
  ok: boolean;
  title?: string;
  byline?: string;
  publishedTime?: string;
  contentHtml?: string;
  excerpt?: string;
  siteName?: string;
  url?: string;
  error?: string;
};

export default function ReaderPage() {
  const router = useRouter();
  const rawUrl = String(router.query.url || '');
  const [data, setData] = useState<ReaderPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [dark, setDark] = useState(false);
  const [spaced, setSpaced] = useState(true);

  useEffect(() => {
    if (!rawUrl) return;
    setLoading(true);
    fetch('/api/reader/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: rawUrl })
    })
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setData({ ok: false, error: String(err) }))
      .finally(() => setLoading(false));
  }, [rawUrl]);

  const articleStyle = useMemo(
    () => ({ fontSize: `${fontSize}px`, lineHeight: spaced ? 1.7 : 1.4 }),
    [fontSize, spaced]
  );

  return (
    <div className={dark ? 'themeDark' : 'themeLight'}>
      <Head><title>Reader Mode</title></Head>
      <div className="toolbar">
        <Link href="/">Home</Link>
        <a href={rawUrl} target="_blank" rel="noreferrer">Original</a>
        <Link href={`/live?url=${encodeURIComponent(rawUrl)}`}>Switch to Live Mode</Link>
        <button onClick={() => setFontSize((v) => Math.max(13, v - 1))}>A-</button>
        <button onClick={() => setFontSize((v) => Math.min(28, v + 1))}>A+</button>
        <button onClick={() => setDark((v) => !v)}>Theme</button>
        <button onClick={() => setSpaced((v) => !v)}>Spacing</button>
      </div>

      <main className="readerWrap" style={articleStyle}>
        {loading && <p>Loading reader view…</p>}
        {!loading && data && !data.ok && (
          <div>
            <h2>Reader Mode Failed</h2>
            <p>{data.error || 'Could not parse article.'}</p>
            <p>This page works better in Live Mode.</p>
            <Link href={`/live?url=${encodeURIComponent(rawUrl)}`}>Open Live Mode</Link>
          </div>
        )}
        {!loading && data && data.ok && (
          <article>
            <h1>{data.title}</h1>
            {(data.byline || data.publishedTime) && (
              <p className="meta">{data.byline} {data.publishedTime ? `• ${data.publishedTime}` : ''}</p>
            )}
            {data.excerpt && <p><em>{data.excerpt}</em></p>}
            <div dangerouslySetInnerHTML={{ __html: data.contentHtml || '' }} />
          </article>
        )}
      </main>
    </div>
  );
}
