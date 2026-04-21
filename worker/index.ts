import express from 'express';
import { SessionStore } from './sessionStore';
import { secureUrl } from './security';

const app = express();
const store = new SessionStore();

app.use(express.json({ limit: '200kb' }));

app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));

app.post('/sessions/start', async (req, res) => {
  try {
    const url = await secureUrl(String(req.body?.url || ''));
    const session = await store.start(url, process.env.BROWSER_USER_AGENT || 'CloudBrowseWorker/1.0', Number(process.env.FRAME_WIDTH || 1024), Number(process.env.FRAME_HEIGHT || 1365), Number(process.env.BROWSER_TIMEOUT_MS || 25000));
    res.json({ ok: true, sessionId: session.id });
  } catch (e) {
    res.status(400).json({ ok: false, error: e instanceof Error ? e.message : 'start failed' });
  }
});

app.get('/sessions/:id/frame', async (req, res) => {
  try {
    const img = await store.frame(req.params.id, Number(req.query.q || 0));
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(img);
  } catch (e) {
    res.status(404).json({ ok: false, error: e instanceof Error ? e.message : 'frame failed' });
  }
});

app.get('/sessions/:id/info', (req, res) => {
  try { res.json({ ok: true, session: store.info(req.params.id) }); }
  catch (e) { res.status(404).json({ ok: false, error: e instanceof Error ? e.message : 'info failed' }); }
});

for (const action of ['click','scroll','type','navigate','back','forward','reload','close','quality'] as const) {
  app.post(`/sessions/:id/${action}`, async (req, res) => {
    try {
      const id = req.params.id;
      if (action === 'click') await store.click(id, Number(req.body?.x || 0), Number(req.body?.y || 0));
      if (action === 'scroll') await store.scroll(id, Number(req.body?.dy || 0));
      if (action === 'type') await store.type(id, String(req.body?.text || ''));
      if (action === 'navigate') await store.navigate(id, await secureUrl(String(req.body?.url || '')));
      if (action === 'back') await store.back(id);
      if (action === 'forward') await store.forward(id);
      if (action === 'reload') await store.reload(id);
      if (action === 'quality') store.setQuality(id, Number(req.body?.quality || 55));
      if (action === 'close') await store.close(id);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ ok: false, error: e instanceof Error ? e.message : `${action} failed` });
    }
  });
}

const port = Number(process.env.WORKER_PORT || 4000);
app.listen(port, '0.0.0.0', () => console.log(`CloudBrowse worker on :${port}`));
