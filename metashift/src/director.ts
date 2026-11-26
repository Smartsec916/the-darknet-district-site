// Tiny async timeline: wait/tween driven by the game clock, with instant skipping.
type Waiter = { until: number; res: () => void };
type Tween = { t: number; dur: number; fn: (p: number) => void; res: () => void };

export class Director {
  time = 0; skipping = false;
  private waits: Waiter[] = []; private tweens: Tween[] = [];
  update(dt: number) {
    this.time += dt;
    for (const tw of this.tweens.slice()) {
      tw.t += dt; const p = this.skipping ? 1 : Math.min(1, tw.t / tw.dur);
      tw.fn(ease(p));
      if (p >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.res(); }
    }
    for (const w of this.waits.slice()) if (this.skipping || this.time >= w.until) { this.waits.splice(this.waits.indexOf(w), 1); w.res(); }
  }
  wait(s: number) { return new Promise<void>(res => { if (this.skipping) { res(); return; } this.waits.push({ until: this.time + s, res }); }); }
  tween(dur: number, fn: (p: number) => void) {
    return new Promise<void>(res => { if (this.skipping) { fn(1); res(); return; } this.tweens.push({ t: 0, dur, fn, res }); });
  }
  until(cond: () => boolean) {
    return new Promise<void>(res => { const tick = () => { if (this.skipping || cond()) res(); else this.waits.push({ until: this.time, res: tick }); }; tick(); });
  }
  skip() { this.skipping = true; }
  reset() { this.skipping = false; }
}
export function ease(p: number) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
