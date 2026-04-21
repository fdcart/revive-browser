import Link from 'next/link';

type Props = {
  url: string;
  onSmaller: () => void;
  onBigger: () => void;
  onTheme: () => void;
  onSpacing: () => void;
};

export function ReaderToolbar({ url, onSmaller, onBigger, onTheme, onSpacing }: Props) {
  return (
    <div className="miniToolbar">
      <Link href="/">Home</Link>
      <a href={url} target="_blank" rel="noreferrer">Open Original</a>
      <Link href={`/live?url=${encodeURIComponent(url)}`}>Open Live</Link>
      <button onClick={onSmaller}>A-</button>
      <button onClick={onBigger}>A+</button>
      <button onClick={onTheme}>Theme</button>
      <button onClick={onSpacing}>Spacing</button>
    </div>
  );
}
