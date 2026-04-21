import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { BrowserShell } from '../components/BrowserShell';
import { TopNavBar } from '../components/TopNavBar';
import { LiveViewport } from '../components/LiveViewport';
import { StatusBanner } from '../components/StatusBanner';

type ApiPayload = { ok: boolean; sessionId?: string; error?: string; session?: { lastActiveAt: number } };

export default function LivePage() {
  const router = useRouter();
  const initialUrl = String(router.query.url || 'https://chatgpt.com');
  const [url, setUrl] = useState(initialUrl);
  const [sessionId, setSessionId] = useState('');
  const [frameUrl, setFrameUrl] = useState('');
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('55');
  const [helperText, setHelperText] = useState('');
  const [idleLabel, setIdleLabel] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => setUrl(initialUrl), [initialUrl]);
  useEffect(() => {
    fetch('/api/live/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: initialUrl }) })
      .then((r) => r.json())
      .then((d: ApiPayload) => {
        if (!d.ok || !d.sessionId) return setError(d.error || 'Could not start live session');
        setSessionId(d.sessionId);
      })
      .catch((e) => setError(String(e)));
  }, [initialUrl]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => setFrameUrl(`/api/live/${sessionId}/frame?t=${Date.now()}&q=${quality}`), 1300);
    return () => window.clearInterval(timer);
  }, [sessionId, quality]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      fetch(`/api/live/${sessionId}/info`).then((r) => r.json()).then((d: ApiPayload) => {
        if (d.ok && d.session) {
          const secs = Math.round((Date.now() - d.session.lastActiveAt) / 1000);
          const left = Math.max(0, 300 - secs);
          setIdleLabel(`Idle timeout in about ${left}s`);
        }
      }).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  const post = (path: string, body: object = {}) => fetch(`/api/live/${sessionId}/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then((r) => r.json()).then((d: ApiPayload) => {
    if (!d.ok) setError(d.error || 'Operation failed');
    return d;
  });

  const clickFrame = (e: MouseEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (el.naturalWidth / rect.width));
    const y = Math.round((e.clientY - rect.top) * (el.naturalHeight / rect.height));
    post('click', { x, y }).catch(() => undefined);
  };

  const navigate = (ev?: FormEvent) => {
    if (ev) ev.preventDefault();
    post('navigate', { url }).catch(() => undefined);
  };

  return (
    <>
      <Head><title>Live Mode</title></Head>
      <BrowserShell title="Live Tab">
        <TopNavBar
          url={url}
          onUrlChange={setUrl}
          onGo={() => navigate()}
          left={<><button onClick={() => post('back')}>◀</button><button onClick={() => post('forward')}>▶</button><button onClick={() => post('reload')}>⟳</button></>}
          right={<><button onClick={() => post('scroll', { dy: -480 })}>↑</button><button onClick={() => post('scroll', { dy: 480 })}>↓</button><button>⋮</button></>}
        />
        <div className="miniToolbar">
          <Link href="/">Home</Link>
          <Link href={`/reader?url=${encodeURIComponent(url)}`}>Reader Mode</Link>
          <button onClick={() => post('quality', { quality: Number(quality) })}>Apply Quality</button>
          <select value={quality} onChange={(e) => setQuality(e.target.value)}>
            <option value="35">Low</option><option value="55">Medium</option><option value="75">High</option>
          </select>
          <button onClick={() => post('close').finally(() => setSessionId(''))}>Terminate</button>
        </div>
        {error && <StatusBanner type="error" message={error} />}
        {error && error.toLowerCase().includes('remote_browser_worker_url') && (
          <StatusBanner
            type="warn"
            message="Fix: add REMOTE_BROWSER_WORKER_URL in your Vercel project settings, and make sure that worker endpoint is online."
          />
        )}
        <StatusBanner message="For ChatGPT use Live Mode only. Login depends on remote session cookies, JavaScript, and security checks." type="info" />
        <StatusBanner message="How to use Live Mode: (1) Tap screenshot to click, (2) use arrows to scroll, (3) type in the helper box then press Send Text." type="info" />
        {idleLabel && <StatusBanner message={idleLabel} type="warn" />}
        <div className="livePanel">
          {sessionId ? <LiveViewport src={frameUrl || `/api/live/${sessionId}/frame`} onClick={clickFrame} /> : <p>Starting session…</p>}
        </div>
        <form className="row" onSubmit={navigate}>
          <input value={helperText} onChange={(e) => setHelperText(e.target.value)} placeholder="Type helper for focused field" />
          <button type="submit">Navigate</button>
          <button type="button" onClick={() => post('type', { text: helperText })}>Send Text</button>
          <button type="button" onClick={() => router.replace(`/live?url=${encodeURIComponent(url)}`)}>Retry</button>
        </form>
      </BrowserShell>
    </>
  );
}
