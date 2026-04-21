export const appConfig = {
  workerUrl: process.env.REMOTE_BROWSER_WORKER_URL || '',
  browserTimeoutMs: Number(process.env.BROWSER_TIMEOUT_MS || 25000),
  maxReaderBytes: Number(process.env.MAX_READER_BYTES || 3000000),
  userAgent: process.env.BROWSER_USER_AGENT || 'CloudBrowseReader/1.0',
  allowDomains: (process.env.ALLOW_DOMAINS || '').split(',').map((v) => v.trim()).filter(Boolean),
  blockDomains: (process.env.BLOCK_DOMAINS || '').split(',').map((v) => v.trim()).filter(Boolean)
};

export const APP_NAME = 'CloudBrowse';
