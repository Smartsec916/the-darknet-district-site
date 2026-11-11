// Level data, the segment builder used to author sectors, and the assembler.
import { RNG, hashStr } from "../engine/rng";
import { THEMES, Theme } from "./themes";
import { SEGMENTS } from "./segments";
import { dress } from "./dress";

export const T = 8;          // tile size in px
export const G_ROW = 56;     // ground surface row
export const H_ROWS = 68;    // world height in tiles
export const MAXW = 2400;

export const M = {
  NONE: 0, CONCRETE: 1, METAL: 2, BRICK: 3, GRATE: 4, PIPE: 5, CONTAINER: 6, AC: 7, SIGN: 8, SCAFFOLD: 9,
  BEAM: 10, CATWALK: 11, SERVER: 12, GLASS: 13, CONV_L: 14, CONV_R: 15, TRAIN: 16, CEIL: 17, TILE: 18, ROCK: 19, HAZARD: 20, AWNING: 21,
};

export interface Ent { t: string; x: number; y: number; id?: string; [k: string]: any }
export interface Rect { x: number; y: number; w: number; h: number; kind: string; [k: string]: any }

export interface EnemyPool { ground: [string, number][]; air: [string, number][]; density: number }
export interface LevelCfg {
  id: string; num: number; name: string; theme: string; diff: number;
  segments: (string | [string, any])[];
  enemies: EnemyPool; npcs?: boolean; dark?: number; boss?: string;
  intro: string; tip?: string; ads?: string[]; indoor?: boolean;
}

export interface LevelData {
  cfg: LevelCfg; theme: Theme; W: number; H: number; G: number;
  solid: Uint8Array; mat: Uint8Array;
  ents: Ent[]; facades: Rect[]; decos: Ent[]; zones: Rect[];
  spawn: { x: number; y: number };
  ceilRow: number; segX: number[];
}

export class B {
  x0 = 0; w = 0; G = G_ROW; d: number; cfg: LevelCfg; rng: RNG; th: Theme; L: LevelData;
  shardSpots: { x: number; y: number; w: number }[] = [];
  enemySpots: { x: number; y: number; kind: string; force?: string }[] = [];
  segIndex = 0; uid = 0;
  constructor(L: LevelData, rng: RNG) { this.L = L; this.cfg = L.cfg; this.d = L.cfg.diff; this.rng = rng; this.th = L.theme; }
  width(n: number): void { this.w = n; }
  px(x: number): number { return (this.x0 + x) * T; }
  py(up: number): number { return (this.G - up) * T; }
  fill(x: number, row: number, w: number, h: number, s: number, mat: number): void {
    for (let j = row; j < row + h; j++) for (let i = this.x0 + x; i < this.x0 + x + w; i++) {
      if (i < 0 || i >= MAXW || j < 0 || j >= H_ROWS) continue;
      this.L.solid[j * MAXW + i] = s; this.L.mat[j * MAXW + i] = s ? mat : 0;
    }
  }
  clear(x: number, up: number, w: number, h: number): void { this.fill(x, this.G - up, w, h, 0, 0); }
  floor(a: number, b: number, up = 0, mat = this.th.mats.ground): void { this.fill(a, this.G - up, b - a, H_ROWS, 1, mat); }
  block(x: number, up: number, w: number, h = 99, mat = this.th.mats.block): void { this.fill(x, this.G - up, w, h, 1, mat); }
  slab(x: number, up: number, w: number, mat = this.th.mats.slab, h = 1): void { this.fill(x, this.G - up, w, h, 1, mat); }
  ledge(x: number, up: number, w: number, mat = this.th.mats.ledge): void { this.fill(x, this.G - up, w, 1, 2, mat); }
  id(p: string): string { return `${p}${this.segIndex}_${this.uid++}`; }
  e(t: string, x: number, up: number, p: any = {}): Ent { const en: Ent = { t, x: this.px(x), y: this.py(up), ...p }; this.L.ents.push(en); return en; }
  fac(kind: string, x: number, up: number, w: number, h: number, p: any = {}): void { this.L.facades.push({ kind, x: this.px(x), y: this.py(up), w: w * T, h: h * T, ...p }); }
  deco(kind: string, x: number, up: number, p: any = {}): void { this.L.decos.push({ t: kind, x: this.px(x), y: this.py(up), ...p }); }
  zone(kind: string, x: number, up: number, w: number, h: number, p: any = {}): void { this.L.zones.push({ kind, x: this.px(x), y: this.py(up), w: w * T, h: h * T, ...p }); }
  coins(x: number, up: number, n: number, step = 2): void { for (let i = 0; i < n; i++) this.e("btc", x + i * step, up + 1); }
  spot(x: number, up = 0, force?: string): void { this.enemySpots.push({ x: this.px(x), y: this.py(up), kind: "ground", force }); }
  air(x: number, up: number, force?: string): void { this.enemySpots.push({ x: this.px(x), y: this.py(up), kind: "air", force }); }
  shard(x: number, up: number, w = 1): void { this.shardSpots.push({ x: this.px(x), y: this.py(up + 1.5), w }); }
  npc(x: number, up: number, style?: string): void { if (this.cfg.npcs) this.e("npc", x, up, { style }); }
  rr(a: number, b: number): number { return Math.round(a + (b - a) * this.d); }
}

export function buildLevel(cfg: LevelCfg): LevelData {
  const theme = THEMES[cfg.theme];
  const L: LevelData = {
    cfg, theme, W: 0, H: H_ROWS, G: G_ROW, solid: new Uint8Array(MAXW * H_ROWS), mat: new Uint8Array(MAXW * H_ROWS),
    ents: [], facades: [], decos: [], zones: [], spawn: { x: 40, y: G_ROW * T }, ceilRow: cfg.indoor ? G_ROW - 44 : -1, segX: [],
  };
  const rng = new RNG(hashStr(cfg.id + "/v1"));
  const b = new B(L, rng);
  // left boundary landing
  let x = 0;
  for (const s of cfg.segments) {
    const [name, params] = typeof s === "string" ? [s, {}] : s;
    const fn = SEGMENTS[name];
    if (!fn) { console.warn("unknown segment", name); continue; }
    b.x0 = x; b.w = 0; L.segX.push(x);
    fn(b, params || {});
    x += b.w; b.segIndex++;
  }
  L.W = x;
  // crop arrays to width
  const solid = new Uint8Array(L.W * H_ROWS), mat = new Uint8Array(L.W * H_ROWS);
  for (let j = 0; j < H_ROWS; j++) for (let i = 0; i < L.W; i++) { solid[j * L.W + i] = L.solid[j * MAXW + i]; mat[j * L.W + i] = L.mat[j * MAXW + i]; }
  L.solid = solid; L.mat = mat;
  // indoor ceiling
  if (L.ceilRow > 0) for (let j = 0; j <= L.ceilRow; j++) for (let i = 0; i < L.W; i++) if (!solid[j * L.W + i]) { solid[j * L.W + i] = 1; mat[j * L.W + i] = M.CEIL; }
  dress(L);
  // shards: best spot in each third of the level
  const spots = b.shardSpots.slice().sort((p, q) => p.x - q.x);
  const picked: { x: number; y: number }[] = [];
  for (let k = 0; k < 3; k++) {
    const lo = (L.W * T * k) / 3, hi = (L.W * T * (k + 1)) / 3;
    const inThird = spots.filter((s) => s.x >= lo && s.x < hi && !picked.includes(s));
    const pool = inThird.length ? inThird : spots.filter((s) => !picked.includes(s));
    if (!pool.length) break;
    let best = pool[0]; let bs = -1;
    for (const s of pool) { const sc = s.w + rng.next() * 0.9; if (sc > bs) { bs = sc; best = s; } }
    picked.push(best);
  }
  while (picked.length < 3) picked.push({ x: (L.W * T * (picked.length + 0.5)) / 3, y: (G_ROW - 2) * T });
  picked.forEach((p, i) => L.ents.push({ t: "shard", x: p.x, y: p.y, idx: i }));
  // enemies
  const E = cfg.enemies;
  const weighted = (arr: [string, number][]) => { let tot = 0; for (const a of arr) tot += a[1]; let r = rng.next() * tot; for (const a of arr) { r -= a[1]; if (r <= 0) return a[0]; } return arr[0][0]; };
  for (const s of b.enemySpots) {
    if (s.force) { L.ents.push({ t: "enemy", kind: s.force, x: s.x, y: s.y }); continue; }
    const arr = s.kind === "air" ? E.air : E.ground;
    if (!arr.length) continue;
    if (rng.next() > E.density) continue;
    L.ents.push({ t: "enemy", kind: weighted(arr), x: s.x, y: s.y });
  }
  return L;
}

export function solidAt(L: LevelData, tx: number, ty: number): number {
  if (tx < 0 || tx >= L.W) return 1;
  if (ty < 0) return L.ceilRow >= 0 ? 1 : 0;
  if (ty >= L.H) return 0;
  return L.solid[ty * L.W + tx];
}
export function matAt(L: LevelData, tx: number, ty: number): number {
  if (tx < 0 || tx >= L.W || ty < 0 || ty >= L.H) return 0;
  return L.mat[ty * L.W + tx];
}
export function isPitColumn(L: LevelData, tx: number): boolean {
  for (let j = L.G; j < L.H; j++) if (L.solid[j * L.W + tx]) return false;
  return true;
}
