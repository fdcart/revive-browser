import { Router } from 'express';
import { extractReader } from './services/readerService';
import { liveSessionStore } from './services/liveSessionService';
import { validateTargetUrl } from './services/urlGuard';
import { errorLogStore } from './services/errorLogService';

function errorPayload(scope: string, error: unknown) {
  const log = errorLogStore.add(scope, error);
  return { ok: false, error: log.message, errorId: log.id };
}

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

apiRouter.post('/reader/open', async (req, res) => {
  try {
    const target = await validateTargetUrl(String(req.body?.url || ''));
    const result = await extractReader(target.toString());
    res.json(result);
  } catch (error) {
    res.status(400).json(errorPayload('reader.open', error));
  }
});

apiRouter.post('/live/start', async (req, res) => {
  try {
    const target = await validateTargetUrl(String(req.body?.url || ''));
    const session = await liveSessionStore.start(target.toString());
    res.json({ ok: true, sessionId: session.id });
  } catch (error) {
    res.status(400).json(errorPayload('live.start', error));
  }
});

apiRouter.get('/live/:sessionId/frame', async (req, res) => {
  try {
    const qualityParam = Number(req.query.q || 0);
    const frame = await liveSessionStore.frame(req.params.sessionId, Number.isFinite(qualityParam) ? qualityParam : undefined);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(frame);
  } catch (error) {
    res.status(404).json(errorPayload('live.frame', error));
  }
});

apiRouter.get('/live/:sessionId/info', async (req, res) => {
  try {
    const info = liveSessionStore.getSessionInfo(req.params.sessionId);
    res.json({ ok: true, session: info });
  } catch (error) {
    res.status(404).json(errorPayload('live.info', error));
  }
});

apiRouter.post('/live/:sessionId/quality', async (req, res) => {
  try {
    const quality = Number(req.body?.quality);
    if (!Number.isFinite(quality)) {
      res.status(400).json({ ok: false, error: 'quality must be a number' });
      return;
    }
    liveSessionStore.setFrameQuality(req.params.sessionId, quality);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.quality', error));
  }
});

apiRouter.post('/live/:sessionId/click', async (req, res) => {
  try {
    const { x, y } = req.body as { x: number; y: number };
    await liveSessionStore.click(req.params.sessionId, x, y);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.click', error));
  }
});

apiRouter.post('/live/:sessionId/scroll', async (req, res) => {
  try {
    const { dy } = req.body as { dy: number };
    await liveSessionStore.scroll(req.params.sessionId, dy);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.scroll', error));
  }
});

apiRouter.post('/live/:sessionId/type', async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    await liveSessionStore.type(req.params.sessionId, text || '');
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.type', error));
  }
});

apiRouter.post('/live/:sessionId/navigate', async (req, res) => {
  try {
    const target = await validateTargetUrl(String(req.body?.url || ''));
    await liveSessionStore.navigate(req.params.sessionId, target.toString());
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.navigate', error));
  }
});

apiRouter.post('/live/:sessionId/back', async (req, res) => {
  try {
    await liveSessionStore.back(req.params.sessionId);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.back', error));
  }
});

apiRouter.post('/live/:sessionId/forward', async (req, res) => {
  try {
    await liveSessionStore.forward(req.params.sessionId);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.forward', error));
  }
});

apiRouter.post('/live/:sessionId/reload', async (req, res) => {
  try {
    await liveSessionStore.reload(req.params.sessionId);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.reload', error));
  }
});

apiRouter.post('/live/:sessionId/close', async (req, res) => {
  try {
    await liveSessionStore.close(req.params.sessionId);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json(errorPayload('live.close', error));
  }
});

apiRouter.get('/diagnostics/:errorId', (req, res) => {
  const item = errorLogStore.get(req.params.errorId);
  if (!item) {
    res.status(404).json({ ok: false, error: 'Diagnostic record not found.' });
    return;
  }
  res.json({ ok: true, log: item });
});
