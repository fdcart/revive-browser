import { ReactNode } from 'react';

type Props = { title: string; children: ReactNode };

export function SimpleLayout({ title, children }: Props) {
  return (
    <div className="container">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
