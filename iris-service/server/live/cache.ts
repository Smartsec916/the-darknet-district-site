// Small in-memory caches and rate budgets for the live-data providers. Only public data is cached here (places,
// weather by coordinates, earthquakes, headlines); no conversation text and nothing about a visitor is ever put in
// these maps, and keys never contain a session id.

export const timer = { now: (): number => Date.now() }; // replaced by tests

interface Entry<T> { value: T; at: number }

export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();
  private inflight = new Map<string, Promise<T>>();
  constructor(private max: number) {}

  peek(key: string): Entry<T> | undefined { return this.map.get(key); }
  set(key: string, value: T): void {
    this.map.delete(key);
    this.map.set(key, { value, at: timer.now() });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }

  // A fresh cached value; else the loader's (one call at a time per key); if the loader fails, a value up to
  // `staleMs` older than `ttlMs`, flagged stale. Returns where the value came from, for the usage log.
  async get(key: string, ttlMs: number, staleMs: number, loader: () => Promise<T>): Promise<{ value: T; source: "hit" | "miss" | "stale" }> {
    const cached = this.map.get(key);
    const age = cached ? timer.now() - cached.at : Infinity;
    if (cached && age < ttlMs) return { value: cached.value, source: "hit" };
    let pending = this.inflight.get(key);
    const owner = !pending;
    if (!pending) {
      pending = loader();
      this.inflight.set(key, pending);
      pending.then(() => this.inflight.delete(key), () => this.inflight.delete(key));
    }
    try {
      const value = await pending;
      if (owner) this.set(key, value);
      return { value, source: "miss" };
    } catch (error) {
      if (cached && age < ttlMs + staleMs) return { value: cached.value, source: "stale" };
      throw error;
    }
  }

  clear(): void { this.map.clear(); this.inflight.clear(); }
  get size(): number { return this.map.size; }
}

// At most `limit` calls in any `windowMs`: a ceiling on what one provider can be asked, however many visitors ask.
export class Budget {
  private stamps: number[] = [];
  constructor(private limit: number, private windowMs: number) {}
  take(): boolean {
    const now = timer.now();
    this.stamps = this.stamps.filter(t => now - t < this.windowMs);
    if (this.stamps.length >= this.limit) return false;
    this.stamps.push(now);
    return true;
  }
  reset(): void { this.stamps = []; }
}

// One request at a time with a minimum gap, for providers whose policy asks for it (Nominatim: one per second)
export class Spacer {
  private chain: Promise<void> = Promise.resolve();
  private last = 0;
  constructor(private gapMs: number, private sleep: (ms: number) => Promise<void> = ms => new Promise(r => setTimeout(r, ms))) {}
  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.chain.then(async () => {
      const wait = this.last + this.gapMs - timer.now();
      if (wait > 0) await this.sleep(wait);
      try { return await task(); } finally { this.last = timer.now(); }
    });
    this.chain = result.then(() => undefined, () => undefined);
    return result;
  }
}
