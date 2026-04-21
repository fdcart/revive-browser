import type { NextApiRequest, NextApiResponse } from 'next';
import { workerFetch } from '../../../../lib/workerClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId, q } = req.query;
  try {
    const response = await workerFetch(`/sessions/${sessionId}/frame${q ? `?q=${encodeURIComponent(String(q))}` : ''}`);
    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (e) {
    return res.status(503).json({ ok: false, error: e instanceof Error ? e.message : 'Worker unavailable' });
  }
}
