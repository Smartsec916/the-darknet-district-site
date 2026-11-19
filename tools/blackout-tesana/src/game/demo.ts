// Attract mode: a self-playing, save-safe run of Sector 1 shown behind the title menu.
// The demo World never writes the save, reports analytics, plays music or reads the real input.
import { World } from "./world";
import { PilotInput } from "./player";
import { buildLevel, LevelData, T } from "../world/level";
import { LEVELS } from "../world/levels";
import { renderWorld, WorldArt } from "../art/tiles";
import { save, persistGate } from "./state";
import { sfxGate } from "../engine/audio";
import { solidPx } from "./physics";
import * as E from "./entities";
import { view } from "../engine/view";

const LOOP = 26;     // seconds per loop
const FADE = 0.7;

class Pilot implements PilotInput {
  down: { [k: string]: boolean } = { left: false, right: false, jump: false, fire: false };
  tap = new Set<string>();
  holdJ = 0; empUsed = false; passed = 0; seen = new Set<object>(); lastX = 0; stuckT = 0; waitT = 0;
  pressed(b: string): boolean { return this.tap.has(b); }
  think(w: World, dt: number): void {
    const p = w.player; this.tap.clear();
    this.down.right = true; this.down.left = false;
    if (this.holdJ > 0) { this.holdJ -= dt; this.down.jump = this.holdJ > 0; } else this.down.jump = false;
    const jump = (hold = 0.22) => { if (p.onGround && this.holdJ <= 0) { this.tap.add("jump"); this.holdJ = hold; this.down.jump = true; } };
    if (w.hack) { const h = w.hack; if (h.pos >= h.ws + h.ww * 0.3 && h.pos <= h.ws + h.ww * 0.7 && h.flash <= 0) this.tap.add("hack"); this.down.right = false; return; }
    // locked door ahead: hack its terminal, then wait for it to open
    for (const t of w.things) if (t instanceof E.Door && t.active && t.x > p.x && t.x - p.x < 70 && Math.abs(t.bottom - p.y) < 12) {
      const term = w.things.find((q) => q instanceof E.Terminal && !q.done && Math.abs(q.x - p.x) < 90) as E.Terminal | undefined;
      if (term) { if (Math.abs(term.x - p.x) < 6) { this.down.right = false; this.tap.add("hack"); } else { this.down.right = term.x > p.x; this.down.left = term.x < p.x; } }
      else this.down.right = t.x - p.x > 16;
      return;
    }
    // enemies: try to stomp the first one, EMP the next one that gets close
    for (const e of w.enemies) {
      if (e.dead || e.flying) continue;
      const dx = e.x - p.x;
      if (dx < -14 && dx > -40 && !this.seen.has(e)) { this.seen.add(e); this.passed++; }
      if (dx > 0 && dx < 70 && Math.abs(e.y - p.y) < 14) {
        if (this.passed > 0 && !this.empUsed && dx < 58 && p.emp > 0) { this.tap.add("emp"); this.empUsed = true; }
        if (e.stun > 0) { if (dx < 30) jump(0.3); }
        else if (dx < 46) jump(0.2);
      }
    }
    // airborne over an awake enemy: steer onto it for a stomp
    if (!p.onGround && p.vy > -60) for (const e of w.enemies) {
      if (e.dead || e.flying || e.stun > 0 || Math.abs(e.y - p.y) > 60 || Math.abs(e.x - p.x) > 44) continue;
      this.down.right = e.x > p.x + 2; this.down.left = e.x < p.x - 2; break;
    }
    // walls and pits ahead
    const ax = p.x + 12, fy = p.y;
    const wall = solidPx(w.L, ax, fy - 4) === 1 || solidPx(w.L, ax, fy - 12) === 1;
    let pit = true; for (let k = 0; k < 6; k++) if (solidPx(w.L, p.x + 10, fy + 2 + k * T)) { pit = false; break; }
    if (pit && p.onGround) { const plat = w.plats.some((q) => q.active !== false && p.x + 10 >= q.x && p.x + 10 <= q.x + q.w && q.y >= fy - 2 && q.y < fy + 40); if (plat) pit = false; }
    if (wall || pit) jump(wall ? 0.3 : 0.24);
    if (Math.abs(p.x - this.lastX) < 0.2 && !w.hack) { this.stuckT += dt; if (this.stuckT > 0.6) { jump(0.3); this.stuckT = 0; } } else this.stuckT = 0;
    this.lastX = p.x;
  }
}

export class Attract {
  pre: { L: LevelData; art: WorldArt } | null = null;
  world: World | null = null; pilot: Pilot | null = null;
  t = 0; slowT = 0; frames = 0; off = false;
  private start(): void {
    if (!this.pre) { const L = buildLevel(LEVELS[0]); this.pre = { L, art: renderWorld(L) }; }
    this.guard(() => {
      this.world = new World(0, { complete: () => {}, openShop: () => {} }, false, this.pre!);
      this.pilot = new Pilot(); this.world.player.ai = this.pilot;
    });
    this.t = 0;
  }
  /** Run fn with saving and sound effects disabled; any accidental save mutation is rolled back. */
  private guard(fn: () => void): void {
    const snap = JSON.stringify(save);
    persistGate.off = true; sfxGate.off = true;
    try { fn(); } finally {
      persistGate.off = false; sfxGate.off = false;
      if (JSON.stringify(save) !== snap) { const s = save as any; for (const k of Object.keys(s)) delete s[k]; Object.assign(s, JSON.parse(snap)); }
    }
  }
  stop(): void { this.world = null; this.pilot = null; }
  /** Draws one demo frame; returns false when the demo is unavailable (fallback backdrop should be drawn). */
  frame(c: CanvasRenderingContext2D, dt: number, simulate: boolean): boolean {
    if (this.off) return false;
    // lightweight fallback: if the device cannot keep up, switch to the static backdrop for good
    this.frames++;
    if (this.frames > 90) { if (dt > 1 / 26) this.slowT += dt; else this.slowT = Math.max(0, this.slowT - dt * 0.5); if (this.slowT > 2.5) { this.off = true; this.stop(); return false; } }
    if (!this.world) this.start();
    const w = this.world!;
    this.guard(() => {
      if (simulate) { this.pilot!.think(w, dt); w.update(dt); }
      w.draw(c, simulate ? dt : 0);
    });
    if (simulate) this.t += dt;
    const fade = this.t < FADE ? 1 - this.t / FADE : this.t > LOOP - FADE ? (this.t - (LOOP - FADE)) / FADE : 0;
    if (fade > 0) { c.globalAlpha = Math.min(1, fade); c.fillStyle = "#020306"; c.fillRect(0, 0, view.w, view.h); c.globalAlpha = 1; }
    if ((w.done || w.player.x > w.L.W * T - 230) && this.t < LOOP - FADE) this.t = LOOP - FADE; // reached the end: fade out early
    if (this.t >= LOOP) this.start();
    return true;
  }
}
