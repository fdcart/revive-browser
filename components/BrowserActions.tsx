import { ReactNode } from 'react';

export function BrowserActions({ children }: { children: ReactNode }) {
  return <div className="browserActions">{children}</div>;
}
