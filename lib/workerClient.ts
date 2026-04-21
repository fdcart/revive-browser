import { appConfig } from './config';

function ensureWorker() {
  if (!appConfig.workerUrl) throw new Error('Remote browser worker is not configured.');
  return appConfig.workerUrl.replace(/\/$/, '');
}

export async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = ensureWorker();
  return fetch(`${base}${path}`, init);
}
