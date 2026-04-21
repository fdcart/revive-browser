import express from 'express';
import next from 'next';
import { apiLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev, hostname: config.host, port: config.port });
  const nextHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));
  app.use('/api', apiLimiter, apiRouter);

  app.all('*', (req, res) => nextHandler(req, res));

  app.listen(config.port, config.host, () => {
    // eslint-disable-next-line no-console
    console.log(`Revive Browser on http://${config.host}:${config.port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', error);
  process.exit(1);
});
