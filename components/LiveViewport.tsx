import { MouseEvent } from 'react';

type Props = { src: string; onClick: (e: MouseEvent<HTMLImageElement>) => void };

export function LiveViewport({ src, onClick }: Props) {
  return <img className="liveViewport" src={src} alt="Remote live frame" onClick={onClick} />;
}
