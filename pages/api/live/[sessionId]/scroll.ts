import type { NextApiRequest, NextApiResponse } from 'next';
import { workerFetch } from '../../../../lib/workerClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const action = req.url?.split('/').pop()?.split('?')[0] || '';
    const response = await workerFetch(`/sessions/${req.query.sessionId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(503).json({ ok: false, error: e instanceof Error ? e.message : 'Worker unavailable' });
  }
}
