# CloudBrowse (Revive Browser MVP)

CloudBrowse is a Vercel-deployable MVP that helps older devices (including Chrome on iOS 12) access modern websites by using server-side processing.

It offers two modes:
- **Reader Mode**: extracts lightweight article content.
- **Live Mode**: uses a separate remote Playwright worker and sends screenshot frames to the old device.

## Architecture (text diagram)

```text
[iOS 12 Chrome Client]
        |
        v
[Next.js on Vercel]
  - UI pages (/ /reader /live)
  - Reader API (/api/reader/open)
  - Live coordination APIs (/api/live/*)
        |
        v
[Remote Browser Worker (Railway/Fly/Render/VPS)]
  - Node + Express + Playwright
  - session lifecycle
  - frame capture
  - click/scroll/type/navigation
```

## What the app does

- Lets users enter a URL and choose Reader or Live mode.
- Reader mode runs fully from the Next.js/Vercel app.
- Live mode coordinates a persistent browser session in a separate worker service.
- Designed for compatibility and reading-first usage, not perfect support for every advanced web app.

## Why this works on iOS 12

- The client UI is intentionally lightweight (simple CSS/JS and standard form controls).
- No WebRTC required in v1.
- Live mode uses ordinary HTTP screenshot polling.
- Modern JS complexity runs in the remote Chromium worker, not on the old iOS browser.

## Why Live Mode is not hosted directly on Vercel

Vercel Serverless Functions are not ideal for long-lived browser sessions. Playwright sessions require persistent process/state and cleanup loops. This MVP keeps those in a separate worker service and uses Vercel only for frontend + lightweight coordination APIs.

## Using ChatGPT in Live Mode

- ChatGPT is intended for **Live Mode only**.
- The worker allows navigation to `chatgpt.com` by default.
- You can attempt login and basic usage through remote clicking, scrolling, and typing.
- This does **not** mean ChatGPT runs natively on iOS 12.
- Compatibility depends on worker session stability, cookies, JavaScript execution, and OpenAI security checks.
- Some advanced interactions may be partial or fail.

## Security notes

- URL normalization and SSRF checks.
- Blocks localhost/private network and metadata-like targets.
- Domain allow/block hooks via env vars.
- Request timeout and size caps for Reader Mode.
- API rate limiting.
- Worker session idle cleanup.

## Known limitations

- Not all websites will work perfectly.
- Best for articles, blogs, docs, and basic browsing.
- Highly interactive apps may partially work.
- Live mode frame polling is not low-latency video streaming.

## Project tree

```text
.
├── components/
├── lib/
├── pages/
│   ├── api/
│   ├── index.tsx
│   ├── reader.tsx
│   └── live.tsx
├── styles/
├── worker/
├── Dockerfile
├── .env.example
└── README.md
```

## Environment variables

See `.env.example`.

Required on Vercel:
- `REMOTE_BROWSER_WORKER_URL` (public HTTPS URL of deployed worker)

## Local run

### 1) Frontend (Next.js)

```bash
npm install
npm run dev
```

App: `http://localhost:3000`

### 2) Worker

```bash
npm run worker:dev
```

Worker: `http://localhost:4000`

Set `REMOTE_BROWSER_WORKER_URL=http://localhost:4000` in your environment.

## Deploy frontend to Vercel

1. Push this repo.
2. Import to Vercel.
3. Set `REMOTE_BROWSER_WORKER_URL` env var to your worker URL.
4. Deploy.

## Deploy worker separately

Use Railway/Fly/Render/VPS.

Worker Docker image:

```bash
docker build -t cloudbrowse-worker .
docker run --rm -p 4000:4000 --env-file .env.example cloudbrowse-worker
```

## API overview

Reader:
- `POST /api/reader/open`

Live coordination (Vercel):
- `POST /api/live/start`
- `GET /api/live/:sessionId/frame`
- `POST /api/live/:sessionId/click`
- `POST /api/live/:sessionId/scroll`
- `POST /api/live/:sessionId/type`
- `POST /api/live/:sessionId/navigate`
- `POST /api/live/:sessionId/close`
- `POST /api/live/:sessionId/back`
- `POST /api/live/:sessionId/forward`
- `POST /api/live/:sessionId/reload`
- `POST /api/live/:sessionId/quality`
- `GET /api/live/:sessionId/info`
- `GET /api/live/worker-health`
