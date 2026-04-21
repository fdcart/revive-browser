import { Browser, chromium, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export type LiveSession = {
  id: string;
  page: Page;
  createdAt: number;
  lastActiveAt: number;
};

class LiveSessionStore {
  private browser: Browser | null = null;
  private readonly sessions = new Map<string, LiveSession>();

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
      setInterval(() => this.cleanupIdle().catch(() => undefined), 15_000).unref();
    }
  }

  private touch(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActiveAt = Date.now();
    }
  }

  async start(url: string): Promise<LiveSession> {
    await this.init();
    if (!this.browser) {
      throw new Error('Browser not initialized.');
    }
    const context = await this.browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: config.frameWidth, height: config.frameHeight }
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(config.browserTimeoutMs);
    page.setDefaultTimeout(config.browserTimeoutMs);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const id = uuidv4();
    const session: LiveSession = { id, page, createdAt: Date.now(), lastActiveAt: Date.now() };
    this.sessions.set(id, session);
    return session;
  }

  get(sessionId: string): LiveSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found.');
    }
    this.touch(sessionId);
    return session;
  }

  async frame(sessionId: string): Promise<Buffer> {
    const session = this.get(sessionId);
    return session.page.screenshot({ type: 'jpeg', quality: config.frameQuality, fullPage: false });
  }

  async click(sessionId: string, x: number, y: number): Promise<void> {
    const session = this.get(sessionId);
    await session.page.mouse.click(x, y);
  }

  async scroll(sessionId: string, dy: number): Promise<void> {
    const session = this.get(sessionId);
    await session.page.mouse.wheel(0, dy);
  }

  async type(sessionId: string, text: string): Promise<void> {
    const session = this.get(sessionId);
    await session.page.keyboard.type(text, { delay: 10 });
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    const session = this.get(sessionId);
    await session.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async back(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    await session.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  async forward(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    await session.page.goForward({ waitUntil: 'domcontentloaded' });
  }

  async reload(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    await session.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async close(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    await session.page.context().close();
    this.sessions.delete(sessionId);
  }

  private async cleanupIdle(): Promise<void> {
    const now = Date.now();
    const ids = [...this.sessions.keys()];
    for (const id of ids) {
      const session = this.sessions.get(id);
      if (!session) {
        continue;
      }
      if (now - session.lastActiveAt > config.sessionIdleMs) {
        await this.close(id);
      }
    }
  }
}

export const liveSessionStore = new LiveSessionStore();
