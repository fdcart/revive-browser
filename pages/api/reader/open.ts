import type { NextApiRequest, NextApiResponse } from 'next';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { extractReaderContent } from '../../../lib/readerService';
import { isAppLikeSite, validateTargetUrl } from '../../../lib/urlGuard';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!enforceRateLimit(req, res)) return;
  try {
    const target = await validateTargetUrl(String(req.body?.url || ''));
    if (isAppLikeSite(target.hostname)) {
      return res.json({
        ok: false,
        url: target.toString(),
        error: 'This URL is app-like and works better in Live Mode.',
        suggestLiveMode: true
      });
    }
    const result = await extractReaderContent(target.toString());
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e instanceof Error ? e.message : 'Invalid URL', suggestLiveMode: true });
  }
}
