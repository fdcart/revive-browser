# Revive Browser MVP

Revive Browser is a production-minded MVP for older phones (including Chrome on iOS 12) to open modern websites through a hosted modern browser.

It provides:

- **Reader Mode** for extracting clean, readable article content.
- **Live Mode** for fallback remote browsing using periodic screenshots from Playwright Chromium.

## What this app does

1. User enters a URL in `/`.
2. Reader mode calls `POST /api/reader/open`, fetches and parses the page using Mozilla Readability.
3. Live mode creates a server-side browser session via `POST /api/live/start`.
4. Client polls `GET /api/live/:sessionId/frame` for updated screenshots.
5. Basic controls send click/scroll/type/navigation commands.
6. On failure, APIs return an `errorId` that can be inspected at `GET /api/diagnostics/:errorId`.
7. Live sessions expose `GET /api/live/:sessionId/info` and `POST /api/live/:sessionId/quality` for basic diagnostics and JPEG quality tuning.

## Known limitations

- Not a full pixel-perfect browser for every site.
- Best for articles, blogs, news, docs, and basic forms/navigation.
- Highly interactive single-page apps, drag/drop UIs, media-heavy apps, and anti-bot-protected pages may only partially work or fail.
- Live mode uses screenshot polling, not low-latency video streaming.

## Security notes

Server-side protections in this MVP:

- URL validation and normalization.
- SSRF protections for localhost/private-network targets.
- HTTP/HTTPS only.
- Simple allow/block domain hooks.
- Rate limiting on `/api`.
- Request timeout defaults.
- Idle live-session cleanup.
- Server-side error log capture with retrievable diagnostic IDs.

## Why this works for iOS 12

- The client stays simple: plain HTML/CSS, classic form controls, basic React events.
- No Service Worker, WebRTC, or advanced browser-only APIs required.
- Live mode relies on image polling over normal HTTP.
- Reader mode renders lightweight sanitized HTML content.

## Local development

```bash
npm install
npx playwright install chromium
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm install
npm run build
npm run start
```

## Docker

```bash
docker build -t revive-browser .
docker run --rm -p 3000:3000 --env-file .env.example revive-browser
```

## Environment

Copy `.env.example` to `.env` and tune values as needed.

## Project structure

- `pages/` Next.js pages for `/`, `/reader`, `/live`.
- `components/` shared UI pieces.
- `server/` Express API, middleware, and service modules.
  - `services/urlGuard.ts` URL validation + SSRF controls
  - `services/readerService.ts` Readability extraction + sanitization
  - `services/liveSessionService.ts` Playwright session management
