import { ReactNode } from 'react';
import { AddressBar } from './AddressBar';
import { BrowserActions } from './BrowserActions';

type Props = {
  url: string;
  onUrlChange: (v: string) => void;
  onGo?: () => void;
  left?: ReactNode;
  right?: ReactNode;
};

export function TopNavBar({ url, onUrlChange, onGo, left, right }: Props) {
  return (
    <div className="topNav">
      <BrowserActions>{left}</BrowserActions>
      <AddressBar value={url} onChange={onUrlChange} onSubmit={onGo} />
      <BrowserActions>{right}</BrowserActions>
    </div>
  );
}
