import Head from 'next/head';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SimpleLayout } from '../components/SimpleLayout';

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem('recent_urls');
    if (raw) {
      setRecent(JSON.parse(raw));
    }
  }, []);

  const saveRecent = (value: string) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 8);
    setRecent(next);
    window.localStorage.setItem('recent_urls', JSON.stringify(next));
  };

  const go = (mode: 'reader' | 'live') => {
    if (!url.trim()) return;
    saveRecent(url.trim());
    router.push(`/${mode}?url=${encodeURIComponent(url.trim())}`);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go('reader');
  };

  return (
    <>
      <Head>
        <title>Revive Browser</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SimpleLayout title="Revive Browser">
        <p>Open modern pages from older phones in Reader or Live Mode.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="url">Website URL</label>
          <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          <div className="row">
            <button type="button" onClick={() => go('reader')}>Open in Reader Mode</button>
            <button type="button" onClick={() => go('live')}>Open in Live Mode</button>
          </div>
        </form>
        {recent.length > 0 && (
          <div>
            <h2>Recent URLs</h2>
            <ul>
              {recent.map((item) => (
                <li key={item}><button className="linkButton" onClick={() => setUrl(item)}>{item}</button></li>
              ))}
            </ul>
          </div>
        )}
      </SimpleLayout>
    </>
  );
}
