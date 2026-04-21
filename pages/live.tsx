import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';

type ApiPayload = { ok: boolean; sessionId?: string; error?: string; errorId?: string };

export default function LivePage() {
  const router = useRouter();
  const initialUrl = String(router.query.url || '');
  const [url, setUrl] = useState(initialUrl);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [errorId, setErrorId] = useState('');
  const [quality, setQuality] = useState('55');
  const [idleHint, setIdleHint] = useState('');
  const frameRef = useRef<HTMLImageElement>(null);

  useEffect(() => setUrl(initialUrl), [initialUrl]);

  useEffect(() => {
    if (!initialUrl) return;
    fetch('/api/live/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: initialUrl })
    })
      .then((res) => res.json())
      .then((json: ApiPayload) => {
        if (!json.ok || !json.sessionId) {
          setError(json.error || 'Could not start session.');
          setErrorId(json.errorId || '');
          return;
        }
        setError('');
        setErrorId('');
        setSessionId(json.sessionId);
      })
      .catch((err) => setError(String(err)));
  }, [initialUrl]);

  useEffect(() => {
    if (!sessionId) return;
    const handle = window.setInterval(() => {
      if (frameRef.current) {
        frameRef.current.src = `/api/live/${sessionId}/frame?t=${Date.now()}&q=${quality}`;
      }
    }, 1400);
    return () => window.clearInterval(handle);
  }, [quality, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const handle = window.setInterval(() => {
      fetch(`/api/live/${sessionId}/info`)
        .then((res) => res.json())
        .then((json) => {
          if (json.ok && json.session) {
            const last = Number(json.session.lastActiveAt || Date.now());
            const seconds = Math.round((Date.now() - last) / 1000);
            setIdleHint(`Last input ${seconds}s ago`);
          }
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(handle);
  }, [sessionId]);

  const post = (path: string, body: object = {}) =>
    fetch(`/api/live/${sessionId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json()).then((json: ApiPayload) => {
      if (!json.ok) {
        setError(json.error || 'Operation failed');
        setErrorId(json.errorId || '');
      }
      return json;
    });

  const onFrameClick = (event: MouseEvent<HTMLImageElement>) => {
    if (!sessionId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = event.currentTarget.naturalWidth / rect.width;
    const scaleY = event.currentTarget.naturalHeight / rect.height;
    const x = Math.round((event.clientX - rect.left) * scaleX);
    const y = Math.round((event.clientY - rect.top) * scaleY);
    post('click', { x, y }).catch((err) => setError(String(err)));
  };

  const onNavigate = (event: FormEvent) => {
    event.preventDefault();
    post('navigate', { url }).catch((err) => setError(String(err)));
  };

  const terminate = () => {
    post('close').finally(() => setSessionId(''));
  };

  const updateQuality = (value: string) => {
    setQuality(value);
    if (!sessionId) return;
    post('quality', { quality: Number(value) }).catch((err) => setError(String(err)));
  };

  return (
    <>
      <Head><title>Live Mode</title></Head>
      <div className="toolbar">
        <Link href="/">Home</Link>
        <Link href={`/reader?url=${encodeURIComponent(url)}`}>Switch to Reader</Link>
        <button onClick={() => post('back')}>Back</button>
        <button onClick={() => post('forward')}>Forward</button>
        <button onClick={() => post('reload')}>Reload</button>
        <button onClick={() => post('scroll', { dy: -450 })}>Scroll Up</button>
        <button onClick={() => post('scroll', { dy: 450 })}>Scroll Down</button>
      </div>
      <form className="row" onSubmit={onNavigate}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        <button type="submit">Navigate</button>
        <input placeholder="Type text" onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            post('type', { text: (e.target as HTMLInputElement).value }).catch((err) => setError(String(err)));
            (e.target as HTMLInputElement).value = '';
          }
        }} />
        <label>JPEG
          <select value={quality} onChange={(e) => updateQuality(e.target.value)}>
            <option value="35">Low</option>
            <option value="55">Medium</option>
            <option value="75">High</option>
          </select>
        </label>
        <button type="button" onClick={terminate}>Terminate</button>
        <button type="button" onClick={() => router.replace(`/live?url=${encodeURIComponent(url)}`)}>Retry</button>
      </form>
      {error && <p className="error">{error} {errorId ? `(Error ID: ${errorId})` : ''}</p>}
      {!sessionId && !error && <p>Starting remote browser…</p>}
      {sessionId && (
        <div className="frameWrap">
          <img ref={frameRef} alt="Remote page" onClick={onFrameClick} src={`/api/live/${sessionId}/frame`} />
          <p className="small">Tap screenshot to click. Session auto-closes after idle timeout.</p>
          {idleHint && <p className="small">{idleHint}</p>}
        </div>
      )}
    </>
  );
}
