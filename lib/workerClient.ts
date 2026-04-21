import { appConfig } from './config';

function ensureWorker() {
  if (!appConfig.workerUrl) {
    throw new Error(
      'Live Mode setup missing: set REMOTE_BROWSER_WORKER_URL to your deployed worker URL (example: https://your-worker.example.com).'
    );
  }
  return appConfig.workerUrl.replace(/\/$/, '');
}

export async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = ensureWorker();
  return fetch(`${base}${path}`, init);
}
