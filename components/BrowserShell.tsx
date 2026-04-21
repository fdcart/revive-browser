import { ReactNode } from 'react';
import { TabStrip } from './TabStrip';

type Props = { title: string; children: ReactNode };

export function BrowserShell({ title, children }: Props) {
  return (
    <div className="browserShell">
      <TabStrip title={title} />
      {children}
    </div>
  );
}
