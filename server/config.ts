export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  maxReaderBytes: Number(process.env.MAX_READER_BYTES || 3_000_000),
  browserTimeoutMs: Number(process.env.BROWSER_TIMEOUT_MS || 25_000),
  sessionIdleMs: Number(process.env.SESSION_IDLE_MS || 5 * 60 * 1000),
  frameQuality: Number(process.env.FRAME_QUALITY || 55),
  frameWidth: Number(process.env.FRAME_WIDTH || 1024),
  frameHeight: Number(process.env.FRAME_HEIGHT || 1365),
  userAgent:
    process.env.BROWSER_USER_AGENT ||
    'ReviveBrowserBot/0.1 (+https://example.invalid/revive-browser)',
  allowDomains: (process.env.ALLOW_DOMAINS || '').split(',').map((v) => v.trim()).filter(Boolean),
  blockDomains: (process.env.BLOCK_DOMAINS || '').split(',').map((v) => v.trim()).filter(Boolean)
};
