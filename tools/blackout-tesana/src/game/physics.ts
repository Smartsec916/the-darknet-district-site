// One collision routine for everything that walks: tiles (solid + one-way) and dynamic platforms.
import { T, LevelData } from "../world/level";
export interface Plat { x: number; y: number; w: number; h: number; dx: number; dy: number; oneWay: boolean; active: boolean; onStand?: (b: Body) => void }
export interface Body { x: number; y: number; w: number; h: number; vx: number; vy: number; onGround: boolean; ground: Plat | null; hitWall: number; hitHead: boolean }

function S(L: LevelData, tx: number, ty: number): number {
  if (tx < 0 || tx >= L.W) return 1;
  if (ty < 0) return L.ceilRow >= 0 ? 1 : 0;
  if (ty >= L.H) return 0;
  return L.solid[ty * L.W + tx];
}
export function solidPx(L: LevelData, x: number, y: number): number { return S(L, Math.floor(x / T), Math.floor(y / T)); }

export function moveBody(L: LevelData, b: Body, dt: number, plats: Plat[] | null): void {
  b.hitWall = 0; b.hitHead = false;
  // ride platform
  if (b.ground && plats) {
    const p = b.ground;
    if (p.active && b.x + b.w / 2 > p.x && b.x - b.w / 2 < p.x + p.w) { b.x += p.dx; b.y = p.y; }
  }
  const hw = b.w / 2;
  // ---- horizontal
  let nx = b.x + b.vx * dt;
  const top = b.y - b.h + 1, bot = b.y - 1;
  const r0 = Math.floor(top / T), r1 = Math.floor(bot / T);
  if (nx > b.x) {
    const tx = Math.floor((nx + hw) / T);
    for (let r = r0; r <= r1; r++) if (S(L, tx, r) === 1) { nx = tx * T - hw - 0.01; b.hitWall = 1; break; }
  } else if (nx < b.x) {
    const tx = Math.floor((nx - hw) / T);
    for (let r = r0; r <= r1; r++) if (S(L, tx, r) === 1) { nx = (tx + 1) * T + hw + 0.01; b.hitWall = -1; break; }
  }
  if (plats) for (const p of plats) {
    if (!p.active || p.oneWay) continue;
    if (bot <= p.y || top >= p.y + p.h) continue;
    if (nx + hw > p.x && nx - hw < p.x + p.w) {
      if (b.x <= p.x + p.w / 2) { nx = p.x - hw - 0.01; b.hitWall = 1; } else { nx = p.x + p.w + hw + 0.01; b.hitWall = -1; }
    }
  }
  b.x = nx;
  // ---- vertical
  const y0 = b.y; let ny = b.y + b.vy * dt;
  const c0 = Math.floor((b.x - hw + 0.5) / T), c1 = Math.floor((b.x + hw - 0.5) / T);
  b.onGround = false; const prevGround = b.ground; b.ground = null;
  if (ny >= y0) {
    let best = Infinity; let bp: Plat | null = null;
    const rs = Math.ceil((y0 - 0.05) / T), re = Math.floor(ny / T);
    outer: for (let r = rs; r <= re; r++) for (let cx = c0; cx <= c1; cx++) {
      const s = S(L, cx, r);
      if (s === 1 || (s === 2 && y0 <= r * T + 0.05)) { best = r * T; break outer; }
    }
    if (plats) for (const p of plats) {
      if (!p.active) continue;
      if (b.x + hw <= p.x || b.x - hw >= p.x + p.w) continue;
      const tol = p === prevGround ? 3 : 0.6;
      if (y0 <= p.y + tol + Math.max(0, p.dy) && ny >= p.y && p.y <= best + 0.01) { best = p.y; bp = p; }
    }
    if (best <= ny + 0.001) { ny = best; b.vy = 0; b.onGround = true; b.ground = bp; if (bp && bp.onStand) bp.onStand(b); }
  } else {
    const t0 = y0 - b.h, t1 = ny - b.h;
    const rs = Math.floor((t0 + 0.05) / T) - 1, re = Math.floor(t1 / T);
    outer2: for (let r = rs; r >= re; r--) for (let cx = c0; cx <= c1; cx++) {
      if (S(L, cx, r) === 1 && (r + 1) * T <= t0 + 0.05) { ny = (r + 1) * T + b.h; b.vy = 0; b.hitHead = true; break outer2; }
    }
    if (plats) for (const p of plats) {
      if (!p.active || p.oneWay) continue;
      if (b.x + hw <= p.x || b.x - hw >= p.x + p.w) continue;
      const pb = p.y + p.h;
      if (t0 >= pb - 0.5 && ny - b.h < pb) { ny = pb + b.h; b.vy = 0; b.hitHead = true; }
    }
  }
  b.y = ny;
}
export function overlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
