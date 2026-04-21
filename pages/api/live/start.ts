import type { NextApiRequest, NextApiResponse } from 'next';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { validateTargetUrl } from '../../../lib/urlGuard';
import { workerFetch } from '../../../lib/workerClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!enforceRateLimit(req, res)) return;
  try {
    const target = await validateTargetUrl(String(req.body?.url || ''));
    const response = await workerFetch('/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target.toString() })
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(503).json({ ok: false, error: e instanceof Error ? e.message : 'Live worker unavailable' });
  }
}
