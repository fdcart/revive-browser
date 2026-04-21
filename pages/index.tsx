import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { APP_NAME } from '../lib/config';
import { BrowserShell } from '../components/BrowserShell';
import { TopNavBar } from '../components/TopNavBar';
import { StatusBanner } from '../components/StatusBanner';

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem('cloudbrowse_recent_urls');
    if (raw) setRecent(JSON.parse(raw));
    fetch('/api/live/worker-health').then((r) => r.json()).then((d) => setWorkerOnline(Boolean(d.ok))).catch(() => setWorkerOnline(false));
  }, []);

  const saveRecent = (value: string) => {
    const next = [value, ...recent.filter((x) => x !== value)].slice(0, 8);
    setRecent(next);
    window.localStorage.setItem('cloudbrowse_recent_urls', JSON.stringify(next));
  };

  const go = (mode: 'reader' | 'live') => {
    if (!url.trim()) return;
    saveRecent(url.trim());
    router.push(`/${mode}?url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <>
      <Head><title>{APP_NAME}</title></Head>
      <BrowserShell title={`${APP_NAME} Start` }>
        <TopNavBar url={url} onUrlChange={setUrl} />
        {workerOnline === false && <StatusBanner type="warn" message="Live worker offline. Reader Mode still works." />}
        <div className="homePanel">
          <h1>{APP_NAME}</h1>
          <p>A simple cloud browser for older devices.</p>
          <div className="beginnerBox">
            <h2>First time here? Do this:</h2>
            <ol>
              <li>Type a website in the big bar (example: <code>wikipedia.org</code>).</li>
              <li>Tap <strong>Open in Reader Mode</strong> for easy reading pages.</li>
              <li>If a site looks broken, tap <strong>Open in Live Mode</strong>.</li>
              <li>In Live Mode, tap the page image to click buttons and links.</li>
              <li>Use <strong>Send Text</strong> to type into login boxes or chat fields.</li>
            </ol>
            <p className="smallText">Tip: ChatGPT should be opened in Live Mode, not Reader Mode.</p>
          </div>
          <div className="row">
            <button onClick={() => go('reader')}>Open in Reader Mode</button>
            <button onClick={() => go('live')}>Open in Live Mode</button>
            <button onClick={() => setUrl('https://chatgpt.com')}>Try ChatGPT URL</button>
          </div>
          {!!recent.length && (
            <div>
              <h3>Recent</h3>
              <ul>
                {recent.map((r) => <li key={r}><button className="linkButton" onClick={() => setUrl(r)}>{r}</button></li>)}
              </ul>
            </div>
          )}
        </div>
      </BrowserShell>
    </>
  );
}
