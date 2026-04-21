import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { BrowserShell } from '../components/BrowserShell';
import { ReaderToolbar } from '../components/ReaderToolbar';
import { TopNavBar } from '../components/TopNavBar';
import { StatusBanner } from '../components/StatusBanner';

type ReaderPayload = { ok: boolean; title?: string; byline?: string; publishedTime?: string; contentHtml?: string; error?: string; suggestLiveMode?: boolean };

export default function ReaderPage() {
  const router = useRouter();
  const rawUrl = String(router.query.url || '');
  const [url, setUrl] = useState(rawUrl);
  const [data, setData] = useState<ReaderPayload | null>(null);
  const [font, setFont] = useState(18);
  const [dark, setDark] = useState(false);
  const [spaced, setSpaced] = useState(true);

  useEffect(() => setUrl(rawUrl), [rawUrl]);
  useEffect(() => {
    if (!rawUrl) return;
    fetch('/api/reader/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: rawUrl }) })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setData({ ok: false, error: String(e), suggestLiveMode: true }));
  }, [rawUrl]);

  const style = useMemo(() => ({ fontSize: `${font}px`, lineHeight: spaced ? 1.75 : 1.45 }), [font, spaced]);

  return (
    <>
      <Head><title>Reader Mode</title></Head>
      <BrowserShell title="Reader Tab">
        <TopNavBar url={url} onUrlChange={setUrl} onGo={() => router.replace(`/reader?url=${encodeURIComponent(url)}`)} />
        <ReaderToolbar url={rawUrl} onSmaller={() => setFont((v) => Math.max(13, v - 1))} onBigger={() => setFont((v) => Math.min(30, v + 1))} onTheme={() => setDark((v) => !v)} onSpacing={() => setSpaced((v) => !v)} />
        {data && !data.ok && (
          <StatusBanner type="warn" message={data.error || 'This page works better in Live Mode.'} />
        )}
        <main className={dark ? 'readerBody dark' : 'readerBody'} style={style}>
          {data?.ok ? (
            <article>
              <h1>{data.title}</h1>
              {(data.byline || data.publishedTime) && <p className="meta">{data.byline} {data.publishedTime ? `• ${data.publishedTime}` : ''}</p>}
              <div dangerouslySetInnerHTML={{ __html: data.contentHtml || '' }} />
            </article>
          ) : (
            <div>
              <p>Reader Mode is for article-style pages.</p>
              <p>ChatGPT and app-like pages are intended for Live Mode only.</p>
            </div>
          )}
        </main>
      </BrowserShell>
    </>
  );
}
