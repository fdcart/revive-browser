import type { NextApiRequest, NextApiResponse } from 'next';

type Entry = { count: number; resetAt: number };
const map = new Map<string, Entry>();

export function enforceRateLimit(req: NextApiRequest, res: NextApiResponse, limit = 40, windowMs = 60_000): boolean {
  const key = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  const now = Date.now();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) {
    res.status(429).json({ ok: false, error: 'Too many requests. Slow down.' });
    return false;
  }
  current.count += 1;
  return true;
}
