export function StatusBanner({ message, type = 'info' }: { message: string; type?: 'info' | 'warn' | 'error' }) {
  return <div className={`statusBanner ${type}`}>{message}</div>;
}
