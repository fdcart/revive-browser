import { Browser, chromium, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

export type Session = { id: string; page: Page; lastActiveAt: number; quality: number };

export class SessionStore {
  private browser: Browser | null = null;
  private sessions = new Map<string, Session>();

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
      setInterval(() => this.cleanup().catch(() => undefined), 15000).unref();
    }
  }

  private touch(id: string) {
    const s = this.sessions.get(id);
    if (s) s.lastActiveAt = Date.now();
  }

  async start(url: string, userAgent: string, width: number, height: number, timeoutMs: number): Promise<Session> {
    await this.init();
    const context = await this.browser!.newContext({ userAgent, viewport: { width, height } });
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const session: Session = { id: uuidv4(), page, lastActiveAt: Date.now(), quality: 55 };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): Session {
    const s = this.sessions.get(id);
    if (!s) throw new Error('Session not found');
    this.touch(id);
    return s;
  }

  async frame(id: string, q?: number) { const s = this.get(id); return s.page.screenshot({ type: 'jpeg', quality: Math.max(25, Math.min(90, q || s.quality)) }); }
  async click(id: string, x: number, y: number) { await this.get(id).page.mouse.click(x, y); }
  async scroll(id: string, dy: number) { await this.get(id).page.mouse.wheel(0, dy); }
  async type(id: string, text: string) { await this.get(id).page.keyboard.type(text, { delay: 10 }); }
  async navigate(id: string, url: string) { await this.get(id).page.goto(url, { waitUntil: 'domcontentloaded' }); }
  async back(id: string) { await this.get(id).page.goBack({ waitUntil: 'domcontentloaded' }); }
  async forward(id: string) { await this.get(id).page.goForward({ waitUntil: 'domcontentloaded' }); }
  async reload(id: string) { await this.get(id).page.reload({ waitUntil: 'domcontentloaded' }); }
  setQuality(id: string, quality: number) { this.get(id).quality = Math.max(25, Math.min(90, quality)); }

  info(id: string) { const s = this.get(id); return { id: s.id, lastActiveAt: s.lastActiveAt, quality: s.quality }; }

  async close(id: string) {
    const s = this.sessions.get(id);
    if (!s) return;
    await s.page.context().close();
    this.sessions.delete(id);
  }

  private async cleanup() {
    const now = Date.now();
    for (const [id, s] of this.sessions.entries()) {
      if (now - s.lastActiveAt > Number(process.env.SESSION_IDLE_MS || 300000)) {
        await this.close(id);
      }
    }
  }
}
