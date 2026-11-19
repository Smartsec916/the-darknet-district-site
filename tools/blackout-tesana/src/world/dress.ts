// Set dressing for gritty themes: original ad posters on walls, lit doorways, machinery, puddles,
// steam pipes, fans, cameras, wall terminals, lit windows and cables. Purely visual decos;
// placement avoids solid tiles, signs/hints and interactive objects so gameplay reads clearly.
import { RNG, hashStr } from "../engine/rng";
import { LEVEL_ADS, AD_ASPECT } from "../art/ads";
import { LevelData, T } from "./level";

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: Box, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

export function dress(L: LevelData): void {
  const keys = LEVEL_ADS[L.cfg.id] || [];
  const full = !!L.theme.gritty; // gritty sectors also get street details, add-ons and cables
  if (!keys.length && !full) return;
  const rng = new RNG(hashStr(L.cfg.id + "/dress"));
  const G = L.G * T;
  const used: Box[] = [];
  for (const d of L.decos) {
    if (d.t === "sign" || d.t === "vsign") used.push({ x: d.x - 44, y: d.y - 34, w: 88, h: 40 });
    else if (d.t === "hint" || d.t === "arrowDown") used.push({ x: d.x - 34, y: d.y - 6, w: 68, h: 18 });
    else if (d.t === "railing") used.push({ x: d.x, y: d.y - 10, w: (d.w || 4) * T, h: 10 });
  }
  for (const e of L.ents) {
    if (e.t === "elevator") used.push({ x: e.x - 8, y: 0, w: 56, h: G + 8 });
    else if (["door", "terminal", "checkpoint", "exit", "shop", "kiosk", "spawn"].includes(e.t)) used.push({ x: e.x - 24, y: e.y - 56, w: 56, h: 58 });
    else if (!["btc", "shard", "medkit", "sidearm", "enemy", "npc", "linkTurret", "mplat", "collapse", "hidden", "boss"].includes(e.t)) used.push({ x: e.x - 20, y: e.y - 56, w: 40 + (e.w || 0) * T, h: 64 }); // hazards stay readable
  }
  for (const f of L.facades) if (f.kind === "shaft" || f.kind === "exitgate") used.push({ x: f.x - 6, y: f.y - f.h - 8, w: f.w + 12, h: f.h + 8 });
  const solidIn = (b: Box, pad = 2) => {
    const x0 = Math.floor((b.x - pad) / T), x1 = Math.floor((b.x + b.w + pad - 1) / T);
    const y0 = Math.floor((b.y - pad) / T), y1 = Math.floor((b.y + b.h + pad - 1) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || tx >= L.W || ty < 0 || ty >= L.H) return true;
      if (L.solid[ty * L.W + tx]) return true;
    }
    return false;
  };
  const free = (b: Box, pad = 4) => !solidIn(b) && !used.some((u) => hit(b, u, pad));
  const WALLS = ["building", "tower", "ruin", "wall", "factory", "armory", "station"];
  const walls = L.facades.filter((f) => WALLS.includes(f.kind)).sort((p, q) => p.x - q.x);
  const wallTop = (f: any) => f.y - f.h + (f.kind === "ruin" ? 16 : 6);

  // --- the level's original posters: each shown a couple of times, never the same one close together
  {
    const per = L.cfg.id === "bazaar" ? 3 : 2;
    const queue: string[] = [];
    for (let r = 0; r < per; r++) { const ks = keys.slice(); for (let i = ks.length - 1; i > 0; i--) { const j = rng.int(0, i); [ks[i], ks[j]] = [ks[j], ks[i]]; } queue.push(...ks); }
    const placed: { key: string; x: number }[] = [];
    const total = queue.length, span = L.W * T - 240;
    for (let i = 0; i < total && queue.length; i++) {
      const target = 120 + span * ((i + 0.5) / total);
      const near = walls.filter((f) => f.x - 150 < target && f.x + f.w + 150 > target).sort((p, q) => Math.abs(p.x + p.w / 2 - target) - Math.abs(q.x + q.w / 2 - target)).slice(0, 8);
      const qi = queue.findIndex((key) => placed.every((q) => q.key !== key || Math.abs(q.x - target) > 480));
      if (qi < 0) continue;
      const key = queue[qi], asp = AD_ASPECT[key];
      let done = false;
      for (const f of near) {
        for (let tries = 0; tries < 14 && !done; tries++) {
          const h = tries < 6 ? rng.pick([50, 62, 62, 74]) : tries < 10 ? 44 : 36, w = Math.round(h * asp);
          const lo = wallTop(f), hi = f.y - h - 6;
          if (hi < lo || f.w < w + 8) continue;
          const y = Math.round(rng.next() < 0.65 ? Math.max(lo, hi - rng.next() * 30) : lo + rng.next() * (hi - lo));
          const x = Math.round(Math.max(f.x + 4, Math.min(f.x + f.w - w - 4, target - w / 2 + (rng.next() - 0.5) * 60)));
          const b = { x, y, w, h };
          if (!free(b, 6)) continue;
          used.push(b);
          L.decos.push({ t: "poster", x, y, w, h, key, lit: rng.next() < 0.5, col: rng.pick(["#d89a40", "#38b0b0", "#c8404c", "#a04478"]), ph: rng.next() * 10 });
          placed.push({ key, x: x + w / 2 }); queue.splice(qi, 1); done = true;
        }
        if (done) break;
      }
    }
  }
  // every poster of the level appears at least once: place leftovers on any wall that has room
  for (const key of keys) {
    if (L.decos.some((d) => d.t === "poster" && d.key === key)) continue;
    const asp = AD_ASPECT[key]; let done = false;
    for (let tries = 0; tries < 80 && !done && walls.length; tries++) {
      const f = walls[rng.int(0, walls.length - 1)], h = rng.pick([36, 44, 50]), w = Math.round(h * asp);
      const lo = wallTop(f), hi = f.y - h - 6; if (hi < lo || f.w < w + 8) continue;
      const x = Math.round(f.x + 4 + rng.next() * (f.w - w - 8)), y = Math.round(lo + rng.next() * (hi - lo)), b = { x, y, w, h };
      if (!free(b, 4)) continue;
      used.push(b); L.decos.push({ t: "poster", x, y, w, h, key, lit: rng.next() < 0.5, col: "#38b0b0", ph: rng.next() * 10 }); done = true;
    }
  }
  if (!full) return;

  // --- street details on flat open ground in front of walls
  const kinds = ["doorway", "machine", "puddle", "pipesteam", "doorway", "puddle", "machine"];
  const doorCols = ["#d89a40", "#38b0b0", "#a04478", "#c8404c"];
  let ki = 0;
  const groundAt = (tx: number) => tx >= 0 && tx < L.W && L.solid[L.G * L.W + tx] === 1 && !L.solid[(L.G - 1) * L.W + tx];
  for (let tx = 10 + rng.int(0, 6); tx < L.W - 12; tx += 7 + rng.int(0, 9)) {
    if (!groundAt(tx - 1) || !groundAt(tx) || !groundAt(tx + 2)) continue;
    const kind = kinds[ki % kinds.length];
    const x = tx * T + 4;
    const wall = walls.some((f) => f.y === G && x > f.x + 10 && x < f.x + f.w - 10);
    const dims: Record<string, [number, number]> = { doorway: [16, 26], machine: [20, 15], puddle: [26, 2], pipesteam: [6, 44] };
    const [w, h] = dims[kind];
    if ((kind === "doorway" || kind === "pipesteam") && !wall) continue;
    const b = { x: x - w / 2, y: G - h, w, h };
    if (kind !== "puddle" && (solidIn({ x: b.x, y: G - h, w, h: h - 1 }, 0) || used.some((u) => hit(b, u, 3)))) continue;
    if (kind === "puddle" && used.some((u) => hit(b, u, 0) && u.h > 50)) continue;
    used.push(b);
    L.decos.push({ t: kind, x, y: G, w, h, col: doorCols[ki % doorCols.length], ph: rng.next() * 10, v: rng.int(0, 2) });
    ki++;
  }

  // --- wall add-ons
  const addOn = (t: string, count: number, hMin: number, hMax: number, w: number, h: number, extra: (o: any) => void = () => {}) => {
    let n = 0;
    for (let tries = 0; tries < count * 14 && n < count; tries++) {
      const f = rng.pick(walls); if (!f || f.w < w + 8) continue;
      const y = Math.round(f.y - hMin - rng.next() * (hMax - hMin));
      const x = Math.round(f.x + 4 + rng.next() * (f.w - w - 8));
      const b = { x, y: y - h, w, h };
      if (b.y < wallTop(f) || !free(b, 4)) continue;
      used.push(b);
      const o: any = { t, x: x + w / 2, y, w, h, ph: rng.next() * 10 };
      extra(o); L.decos.push(o); n++;
    }
  };
  addOn("litwindow", 8, 40, 120, 10, 12, (o) => { o.col = rng.pick(["#a8742c", "#8a5a22", "#2f7a7a", "#8a2a40", "#a8742c"]); });
  addOn("fan", 5, 30, 100, 13, 13);
  addOn("camera", 5, 46, 90, 10, 7, (o) => { o.dir = rng.chance(0.5) ? 1 : -1; });
  addOn("wallmon", 4, 22, 60, 15, 11, (o) => { o.col = rng.pick(["#38b0b0", "#d89a40", "#58a070"]); });
  addOn("wallpipe", 4, 30, 90, 44, 4);

  // --- sagging cables strung across open air
  let cables = 0; const cxs: number[] = [];
  for (let tries = 0; tries < 60 && cables < 9; tries++) {
    const len = 60 + rng.int(0, 90), x = rng.int(20, L.W * T - len - 20), y = G - 70 - rng.int(0, 70), sag = 8 + rng.int(0, 14);
    const b = { x, y, w: len, h: sag + 2 };
    if (cxs.some((q) => Math.abs(q - x) < 170) || solidIn(b, 0) || used.some((u) => hit(b, u, 0) && u.w < 200)) continue;
    cxs.push(x);
    L.decos.push({ t: "cable", x, y, len, sag, spark: rng.chance(0.3), ph: rng.next() * 10 });
    cables++;
  }
}
