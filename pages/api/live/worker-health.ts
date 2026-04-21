import type { NextApiRequest, NextApiResponse } from 'next';
import { workerFetch } from '../../../lib/workerClient';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await workerFetch('/health');
    const data = await response.json();
    return res.status(200).json({ ok: true, worker: data });
  } catch {
    return res.status(200).json({ ok: false, worker: { status: 'offline' } });
  }
}
