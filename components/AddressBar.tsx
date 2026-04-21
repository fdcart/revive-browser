import { FormEvent } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
};

export function AddressBar({ value, onChange, onSubmit }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };
  return (
    <form onSubmit={submit} className="addressWrap">
      <input className="omnibox" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Enter URL" />
    </form>
  );
}
