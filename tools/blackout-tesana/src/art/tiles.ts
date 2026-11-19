// Renders a level's static world (facades, tiles, static decorations) into 256px-wide chunk canvases.
import { makeCanvas } from "../engine/view";
import { LevelData, M, T, isPitColumn } from "../world/level";
import { RNG } from "../engine/rng";
import { drawText } from "../engine/font";

export const CHUNK = 256;
const hsh = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return "#" + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
export { shade };

export interface WorldArt { chunks: HTMLCanvasElement[]; conveyors: { x: number; y: number; dir: number }[]; leds: { x: number; y: number; c: string; p: number }[]; windows: { x: number; y: number; c: string }[] }

export function renderWorld(L: LevelData): WorldArt {
  const W = L.W * T, H = L.H * T;
  const n = Math.ceil(W / CHUNK);
  const art: WorldArt = { chunks: [], conveyors: [], leds: [], windows: [] };
  const [big, bx] = makeCanvas(Math.min(W, 4096), H);
  // render in strips of up to 4096 px then slice into chunks
  for (let sx = 0; sx < W; sx += 4096) {
    const sw = Math.min(4096, W - sx);
    bx.clearRect(0, 0, big.width, big.height);
    bx.save(); bx.translate(-sx, 0);
    for (const f of L.facades) if (f.x < sx + sw && f.x + f.w > sx) { const fa = L.theme.facadeAlpha ?? (L.theme.gritty ? 0.8 : 1); const soft = (f.kind === "building" || f.kind === "ruin" || f.kind === "tower" || f.kind === "wall") ? fa : 1; bx.globalAlpha = soft; drawFacade(bx, f, L, art); if (L.theme.gritty) grime(bx, f); bx.globalAlpha = 1; }
    drawTiles(bx, L, Math.floor(sx / T), Math.ceil((sx + sw) / T), art);
    for (const d of L.decos) if (d.x > sx - 200 && d.x < sx + sw + 200) drawStaticDeco(bx, d, L);
    drawPitMarks(bx, L, Math.floor(sx / T), Math.ceil((sx + sw) / T));
    bx.restore();
    for (let cx = sx; cx < sx + sw; cx += CHUNK) {
      const [c, x] = makeCanvas(CHUNK, H);
      x.drawImage(big, cx - sx, 0, CHUNK, H, 0, 0, CHUNK, H);
      art.chunks[Math.floor(cx / CHUNK)] = c;
    }
  }
  void n;
  return art;
}

function drawTiles(c: Ctx, L: LevelData, t0: number, t1: number, art: WorldArt): void {
  const P = L.theme.tile;
  const S = (x: number, y: number) => (x < 0 || x >= L.W || y < 0 || y >= L.H ? (y >= L.H ? 0 : 1) : L.solid[y * L.W + x]);
  const wet = L.theme.rain > 0;
  for (let ty = 0; ty < L.H; ty++) for (let tx = Math.max(0, t0); tx < Math.min(L.W, t1); tx++) {
    const s = L.solid[ty * L.W + tx]; if (!s) continue;
    const m = L.mat[ty * L.W + tx];
    const x = tx * T, y = ty * T, h = hsh(tx, ty);
    const top = S(tx, ty - 1) !== 1 && !(s === 1 && S(tx, ty - 1) === 1), bot = !S(tx, ty + 1), lf = !S(tx - 1, ty), rt = !S(tx + 1, ty);
    const mt = L.mat[Math.max(0, ty - 1) * L.W + tx];
    const exposedTop = S(tx, ty - 1) === 0 || (S(tx, ty - 1) === 2) || mt !== m && S(tx, ty - 1) !== 1;
    void top;
    switch (m) {
      case M.CONCRETE: case M.TILE: case M.ROCK: case M.CEIL: {
        const base = m === M.CEIL ? shade(P.lo, 0.05) : m === M.TILE ? P.base : P.base;
        R(c, x, y, 8, 8, base);
        if (h < 0.35) R(c, x + Math.floor(h * 20) % 7, y + Math.floor(h * 50) % 7, 1, 1, P.lo);
        if (h > 0.8) R(c, x + 2, y + 5, 3, 1, shade(base, -0.25));
        if (m === M.TILE) { R(c, x, y + 7, 8, 1, P.lo); R(c, x + 7, y, 1, 8, P.lo); }
        else if (tx % 4 === 0) R(c, x, y, 1, 8, shade(base, -0.2));
        if (exposedTop) {
          R(c, x, y, 8, 2, P.hi); R(c, x, y + 2, 8, 1, shade(P.base, -0.15));
          if (wet && h > 0.55) R(c, x + Math.floor(h * 13) % 6, y, 2, 1, L.theme.neon[Math.floor(h * 7) % L.theme.neon.length]);
          if (m === M.TILE && h > 0.7) R(c, x + 1, y + 3, 5, 1, shade(P.base, 0.08));
        }
        if (bot && m === M.CEIL) { R(c, x, y + 6, 8, 2, P.lo); if (tx % 6 === 0) R(c, x + 1, y + 7, 6, 1, L.theme.light); }
        if (lf) R(c, x, y, 1, 8, shade(P.hi, -0.2)); if (rt) R(c, x + 7, y, 1, 8, P.lo);
        break;
      }
      case M.BRICK: {
        R(c, x, y, 8, 8, shade(P.base, 0.04));
        const off = (ty % 2) * 4; c.fillStyle = P.lo;
        c.fillRect(x, y + 3, 8, 1); c.fillRect(x, y + 7, 8, 1); c.fillRect(x + ((off + 2) % 8), y, 1, 3); c.fillRect(x + ((off + 6) % 8), y + 4, 1, 3);
        if (h > 0.85) R(c, x + 2, y + 1, 3, 2, shade(P.accent2, -0.55));
        if (exposedTop) { R(c, x, y, 8, 1, P.hi); }
        if (lf) R(c, x, y, 1, 8, P.hi); if (rt) R(c, x + 7, y, 1, 8, P.line);
        break;
      }
      case M.METAL: case M.SERVER: case M.TRAIN: case M.AC: case M.CONTAINER: case M.GLASS: case M.HAZARD: {
        if (m === M.SERVER) {
          R(c, x, y, 8, 8, "#121722"); R(c, x, y, 1, 8, "#2a3346"); R(c, x + 7, y, 1, 8, "#0a0d14");
          R(c, x + 1, y + 1, 6, 2, "#1b2232"); R(c, x + 1, y + 4, 6, 2, "#1b2232");
          const lc = h > 0.6 ? "#48E6E0" : h > 0.3 ? "#3a8aff" : "#F04455";
          art.leds.push({ x: x + 2 + Math.floor(h * 4), y: y + 2, c: lc, p: h * 10 }); art.leds.push({ x: x + 5, y: y + 5, c: h > 0.5 ? "#48E6E0" : "#FFB44A", p: h * 7 + 1 });
          if (exposedTop) R(c, x, y, 8, 1, "#3a465e");
        } else if (m === M.TRAIN) {
          R(c, x, y, 8, 8, "#3a3f44"); const row = ty % 6;
          if (row === 1 || row === 2) { R(c, x + 1, y, 6, 8, "#14181c"); if (h > 0.6) R(c, x + 2, y + 2, 2, 3, "#2a3236"); }
          if (row === 3) R(c, x, y + 5, 8, 2, "#b84030");
          if (exposedTop) { R(c, x, y, 8, 2, "#5a6066"); R(c, x, y + 2, 8, 1, "#22262a"); }
          if (tx % 8 === 0) R(c, x, y, 1, 8, "#22262a");
          if (h > 0.9) R(c, x + 3, y + 3, 2, 1, "#FF4CA8");
        } else if (m === M.CONTAINER) {
          const cc = L.theme.key === "undergrid" ? "#7a3a28" : "#285a6a";
          R(c, x, y, 8, 8, cc); for (let i = 1; i < 8; i += 2) R(c, x + i, y, 1, 8, shade(cc, -0.3));
          if (exposedTop) R(c, x, y, 8, 1, shade(cc, 0.3)); if (bot) R(c, x, y + 7, 8, 1, shade(cc, -0.5));
          if (lf || rt) R(c, lf ? x : x + 7, y, 1, 8, shade(cc, -0.5));
        } else if (m === M.AC) {
          R(c, x, y, 8, 8, "#5a6270"); R(c, x, y + 7, 8, 1, "#2a2e36");
          if (exposedTop) R(c, x, y, 8, 1, "#8a94a6");
          R(c, x + 1, y + 2, 6, 4, "#2a2e36"); R(c, x + 2, y + 3, 4, 2, "#3a404a"); R(c, x + 3 + (tx % 2), y + 3, 1, 2, "#1a1d22");
        } else if (m === M.GLASS) {
          R(c, x, y, 8, 8, "#1a3a48"); R(c, x, y, 8, 1, "#9ffaf4"); R(c, x, y + 1, 8, 1, "#48E6E0"); R(c, x, y + 7, 8, 1, "#0a1a22");
          if (tx % 3 === 0) R(c, x + 3, y + 3, 2, 1, "#2a6a7a");
        } else if (m === M.HAZARD) {
          for (let i = 0; i < 8; i++) R(c, x + i, y, 1, 8, (i + ty) % 4 < 2 ? "#FFB44A" : "#141414");
        } else {
          R(c, x, y, 8, 8, P.base);
          R(c, x, y, 8, 1, shade(P.hi, -0.1)); R(c, x, y, 1, 8, shade(P.hi, -0.1)); R(c, x + 7, y, 1, 8, P.lo); R(c, x, y + 7, 8, 1, P.lo);
          if ((tx + ty) % 3 === 0) { R(c, x + 1, y + 1, 1, 1, P.hi); R(c, x + 6, y + 6, 1, 1, P.line); }
          if (h > 0.9) R(c, x + 2, y + 3, 4, 1, P.lo);
          if (exposedTop) { R(c, x, y, 8, 2, P.hi); if (L.theme.key === "perimeter" || L.theme.key === "armory") for (let i = 0; i < 8; i++) if ((tx * 8 + i) % 6 < 3) R(c, x + i, y + 2, 1, 1, P.accent); }
        }
        break;
      }
      case M.CONV_L: case M.CONV_R: {
        R(c, x, y, 8, 8, "#22262e"); R(c, x, y, 8, 3, "#3a3f48"); R(c, x, y + 3, 8, 1, "#101216");
        R(c, x + 3, y + 5, 2, 2, "#5a606a");
        art.conveyors.push({ x, y, dir: m === M.CONV_R ? 1 : -1 });
        break;
      }
      case M.GRATE: case M.CATWALK: {
        R(c, x, y, 8, 3, P.hi); R(c, x, y + 1, 8, 1, P.lo);
        for (let i = 1; i < 8; i += 2) R(c, x + i, y + 1, 1, 1, "#05070C");
        R(c, x, y + 3, 8, 1, P.line);
        if (m === M.CATWALK) { if (tx % 2 === 0) R(c, x + 3, y + 4, 2, 2, P.lo); R(c, x, y + 4, 8, 1, shade(P.lo, -0.3)); }
        else if (tx % 4 === 0) { R(c, x + 2, y + 4, 1, 4, P.lo); R(c, x + 3, y + 4, 3, 1, P.lo); }
        break;
      }
      case M.PIPE: {
        R(c, x, y, 8, 1, "#8a8f9a"); R(c, x, y + 1, 8, 2, "#5a606c"); R(c, x, y + 3, 8, 1, "#3a3e48"); R(c, x, y + 4, 8, 1, "#22252c");
        if (tx % 3 === 0) { R(c, x + 2, y - 1, 3, 6, "#6a707c"); R(c, x + 2, y + 4, 3, 1, "#2a2e36"); }
        break;
      }
      case M.SIGN: {
        const col = L.theme.neon[tx % L.theme.neon.length];
        R(c, x, y, 8, 5, "#14101e"); R(c, x, y, 8, 1, col); R(c, x, y + 4, 8, 1, shade(col, -0.4));
        if (h > 0.4) R(c, x + 2, y + 2, 4, 1, shade(col, -0.2));
        break;
      }
      case M.BEAM: case M.SCAFFOLD: {
        R(c, x, y, 8, 2, "#6a5a4a"); R(c, x, y + 2, 8, 1, "#3a3028"); R(c, x + 1, y + 3, 6, 1, "#4a3e34"); R(c, x, y + 4, 8, 1, "#2a221c");
        if (tx % 2) R(c, x + 3, y + 3, 2, 1, "#1a1410");
        break;
      }
      case M.AWNING: {
        const a = L.theme.neon[Math.floor(tx / 8) % L.theme.neon.length];
        for (let i = 0; i < 8; i++) R(c, x + i, y, 1, 3, ((tx * 8 + i) >> 1) % 2 ? a : shade(a, -0.55));
        R(c, x, y + 3, 8, 1, shade(a, -0.7)); for (let i = 0; i < 8; i += 2) R(c, x + i, y + 4, 1, 1, shade(a, -0.4));
        break;
      }
      default: R(c, x, y, 8, 8, P.base);
    }
    if (s === 1 && ty - L.G > 1 && m !== M.CEIL && S(tx, ty - 1) === 1) { c.fillStyle = "rgba(2,3,8," + Math.min(0.84, (ty - L.G - 1) * 0.15) + ")"; c.fillRect(x, y, 8, 8); if (ty - L.G === 4 && tx % 9 === 0) R(c, x, y + 3, 8, 2, "#1a1f2a"); if (ty - L.G === 6 && h > 0.93) R(c, x + 3, y + 3, 2, 2, L.theme.light); }
  }
}

function drawPitMarks(c: Ctx, L: LevelData, t0: number, t1: number): void {
  for (let tx = Math.max(1, t0); tx < Math.min(L.W - 1, t1); tx++) {
    const pit = isPitColumn(L, tx);
    if (!pit) continue;
    // abyss glow at bottom
    c.fillStyle = "rgba(240,68,85,0.10)"; c.fillRect(tx * T, (L.H - 3) * T, T, 3 * T);
    for (const d of [-1, 1]) {
      const nx = tx + d; if (isPitColumn(L, nx)) continue;
      // find surface row of neighbour
      for (let j = L.G - 12; j < L.H; j++) if (L.solid[j * L.W + nx] === 1) {
        const x = nx * T, y = j * T;
        for (let i = 0; i < 8; i++) R(c, x + i, y + 2, 1, 1, (i >> 1) % 2 ? "#FFB44A" : "#141414");
        R(c, d < 0 ? x + 7 : x, y - 4, 1, 4, "#FFB44A");
        break;
      }
    }
  }
}

// ---------- facades ----------
function windowsGrid(c: Ctx, x: number, y: number, w: number, h: number, rng: RNG, cols: string[], dens: number, art: WorldArt, cell = 8): void {
  for (let yy = y + 4; yy < y + h - 6; yy += cell) for (let xx = x + 3; xx < x + w - 5; xx += cell) {
    const lit = rng.next() < dens; const col = lit ? rng.pick(cols) : "#0a0d16";
    R(c, xx, yy, 3, 4, lit ? shade(col, -0.62) : col); if (lit) { R(c, xx, yy, 3, 1, shade(col, -0.25)); art.windows.push({ x: xx, y: yy, c: col }); }
    R(c, xx, yy + 4, 3, 1, "#05070C");
    if (lit && rng.next() < 0.3) R(c, xx + 1, yy + 1, 1, 3, "#05070C");
  }
}
function drawFacade(c: Ctx, f: any, L: LevelData, art: WorldArt): void {
  const P = L.theme.tile, th = L.theme;
  const rng = new RNG((f.seed || 1) * 977 + f.x);
  const x = f.x, y = f.y - f.h, w = f.w, h = f.h;
  const wall = shade(P.base, -0.58), wall2 = shade(P.base, -0.68);
  switch (f.kind) {
    case "building": case "tower": case "ruin": {
      const top = f.kind === "ruin" ? y + 8 : y;
      R(c, x, top, w, h - (top - y), wall);
      for (let i = x; i < x + w; i += 24) R(c, i, top, 1, h, wall2);
      if (f.kind === "ruin") for (let i = 0; i < w; i += 4) R(c, x + i, top - Math.floor(rng.next() * 8), 4, 8, wall);
      const wc = th.windows || ["#FFB44A", "#ffd890", ...th.neon];
      windowsGrid(c, x + 2, top + (f.arcade ? 40 : 4), w - 4, h - (f.arcade ? 44 : 14), rng, wc, f.dense ? 0.3 : 0.2, art, f.kind === "tower" ? 10 : 8);
      if (f.arcade) { for (let i = x + 4; i < x + w - 4; i += 16) { R(c, i, y + h - 40, 4, 40, shade(P.base, -0.2)); } R(c, x, y + h - 42, w, 3, P.hi); R(c, x + 2, y + h - 38, w - 4, 38, "rgba(5,7,12,0.55)"); }
      if (f.kind === "tower") for (let i = x + 6; i < x + w; i += 30) { R(c, i, y + 10, 2, h - 20, shade(th.neon[(i >> 4) % th.neon.length], -0.3)); }
      // pipes and graffiti
      R(c, x + 5 + Math.floor(rng.next() * (w - 10)), top, 2, h, shade(P.base, -0.3));
      if (!th.indoor) for (let g = 0; g < w / 90; g++) {
        const gx = x + 4 + rng.next() * (w - 30), gy = y + h - 12 - rng.next() * 6, gc = rng.pick(["#FF4CA8", "#48E6E0", "#FFB44A", "#9a7aff", "#F04455"]);
        const tag = rng.pick(["RR", "GS", "X7", "NO", "RAT", "ZZ", "404", "UP"]);
        drawText(c, tag, gx, gy, shade(gc, -0.4), 1, "left", null);
        R(c, gx + 2, gy + 7, 1, 2 + Math.floor(rng.next() * 3), shade(gc, -0.5));
      }
      break;
    }
    case "wall": case "shaftwall": case "serverwall": case "arena": case "armory": case "factory": case "fence": case "station": case "tunnel": case "tracks": {
      const base = f.kind === "serverwall" ? "#0b0f18" : f.kind === "tunnel" || f.kind === "tracks" ? shade(P.base, -0.7) : wall;
      if (f.kind !== "fence") R(c, x, y, w, h, base);
      if (f.kind === "fence") {
        for (let i = x; i < x + w; i += 3) for (let j = y + 4; j < y + h; j += 3) R(c, i + ((j / 3) % 2), j, 1, 1, "#3a404a");
        for (let i = x; i < x + w; i += 24) R(c, i, y, 2, h, "#4a505a");
        for (let i = x; i < x + w; i += 2) R(c, i, y + 1 + (i % 4 === 0 ? 1 : 0), 1, 1, "#7a808a");
        for (let i = x + 10; i < x + w; i += 64) { R(c, i, y + 14, 12, 8, "#FFB44A"); R(c, i + 5, y + 15, 2, 4, "#141414"); R(c, i + 5, y + 20, 2, 1, "#141414"); }
        break;
      }
      // panels
      for (let i = x; i < x + w; i += 32) { R(c, i, y, 1, h, shade(base, 0.12)); R(c, i + 1, y, 1, h, shade(base, -0.3)); }
      for (let j = y + h - 4; j > y; j -= 40) R(c, x, j, w, 1, shade(base, 0.1));
      if (f.kind === "serverwall") {
        for (let i = x + 4; i < x + w - 10; i += 14) { R(c, i, y + 6, 10, h - 6, "#101624"); R(c, i, y + 6, 10, 1, "#1e2838"); for (let j = y + 10; j < y + h - 4; j += 4) { R(c, i + 1, j, 8, 2, "#151c2c"); if (rng.next() < 0.4) art.leds.push({ x: i + 2 + Math.floor(rng.next() * 6), y: j, c: rng.pick(["#48E6E0", "#3a8aff", "#F04455", "#7aff9a"]), p: rng.next() * 10 }); } if (f.broken && rng.next() < 0.4) R(c, i + 2, y + h / 2, 6, 10, "#05070C"); }
      }
      if (f.kind === "tunnel" || f.kind === "tracks") {
        for (let i = x; i < x + w; i += 40) { c.fillStyle = shade(P.base, -0.5); c.fillRect(i, y, 6, h); c.fillRect(i - 4, y + 6, 14, 3); }
        for (let i = x; i < x + w; i += 8) for (let j = y; j < y + h; j += 4) if (((i + j) >> 2) % 3 === 0) R(c, i, j, 7, 1, shade(P.base, -0.6));
        if (f.kind === "tracks") { R(c, x, y + h - 3, w, 1, "#5a5048"); R(c, x, y + h - 6, w, 1, "#3a3430"); }
      }
      if (f.kind === "station") { R(c, x, y + h - 30, w, 12, "#d8d0b8"); for (let i = x; i < x + w; i += 4) R(c, i, y + h - 30, 1, 12, "#a8a088"); R(c, x, y + h - 26, w, 3, "#b84030"); }
      if (f.kind === "shaftwall") { for (let i = x + 8; i < x + w; i += 48) { R(c, i, y, 4, h, shade(P.base, -0.2)); for (let j = y; j < y + h; j += 6) R(c, i - 3, j, 10, 1, shade(P.base, -0.1)); } }
      if (f.kind === "arena") { for (let i = x; i < x + w; i += 48) { R(c, i + 6, y, 12, h, shade(base, 0.08)); for (let j = y; j < y + h; j += 16) R(c, i + 6, j, 12, 2, P.accent2); } }
      if (f.kind === "armory") { for (let i = x + 6; i < x + w - 20; i += 26) { R(c, i, y + h - 50, 20, 44, "#22262c"); R(c, i, y + h - 50, 20, 2, "#4a505a"); for (let j = 0; j < 3; j++) { R(c, i + 3, y + h - 44 + j * 12, 14, 2, "#3a3e46"); R(c, i + 4, y + h - 46 + j * 12, 10, 2, "#111318"); } } }
      if (f.kind === "factory") { for (let i = x + 10; i < x + w; i += 50) { R(c, i, y + 10, 20, h - 10, shade(P.base, -0.3)); c.fillStyle = shade(P.base, -0.15); c.beginPath(); c.arc(i + 10, y + 12, 10, Math.PI, 0); c.fill(); } }
      // pipes along top
      R(c, x, y + 6, w, 3, shade(P.base, -0.15)); R(c, x, y + 6, w, 1, shade(P.base, 0.1));
      // lamps
      for (let i = x + 16; i < x + w; i += 64) { R(c, i, y + 12, 6, 2, "#22262e"); R(c, i + 1, y + 14, 4, 1, th.light); }
      if (f.interior) { R(c, x, y, w, 2, "#05070C"); }
      break;
    }
    case "shaft": {
      R(c, x, y, w, h, "rgba(5,7,12,0.75)");
      R(c, x, y, 2, h, "#3a404c"); R(c, x + w - 2, y, 2, h, "#3a404c");
      for (let j = y + 4; j < y + h; j += 24) { c.strokeStyle = "#262b36"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, j); c.lineTo(x + w - 2, j + 22); c.moveTo(x + w - 2, j); c.lineTo(x + 2, j + 22); c.stroke(); }
      R(c, x + 5, y, 1, h, "#5a606c"); R(c, x + w - 6, y, 1, h, "#5a606c");
      break;
    }
    case "store": {
      const col = f.col || "#FF4CA8";
      R(c, x, y, w, h, "#120c18"); R(c, x + 2, y + 10, w - 4, h - 10, shade(col, -0.72));
      for (let i = x + 4; i < x + w - 4; i += 6) R(c, i, y + 12 + ((i >> 1) % 3), 3, 6 + ((i >> 2) % 5), shade(col, -0.4));
      R(c, x + w / 2 - 4, y + h - 16, 8, 16, "#08060c"); R(c, x + w / 2 - 4, y + h - 16, 8, 1, col);
      R(c, x + 1, y + 1, w - 2, 8, "#08060c"); R(c, x + 1, y + 1, w - 2, 1, col); R(c, x + 1, y + 8, w - 2, 1, col);
      drawText(c, String(f.text || "OPEN").slice(0, Math.floor((w - 4) / 6)), x + w / 2, y + 2, col, 1, "center", null);
      R(c, x, y + h - 1, w, 1, col);
      break;
    }
    case "shopfront": {
      R(c, x, y, w, h, "#0c0e16"); R(c, x, y, w, 2, "#48E6E0"); R(c, x, y + h - 2, w, 2, "#FF4CA8"); R(c, x, y, 2, h, "#48E6E0"); R(c, x + w - 2, y, 2, h, "#FF4CA8");
      R(c, x + 6, y + 6, w - 12, 12, "#05070C"); R(c, x + 6, y + 6, w - 12, 1, "#FF4CA8"); R(c, x + 6, y + 17, w - 12, 1, "#48E6E0");
      drawText(c, "BYTE BAZAAR", x + w / 2, y + 9, "#48E6E0", 1, "center", "#3a0a2a");
      for (let i = 0; i < 6; i++) { const ix = x + 10 + i * ((w - 20) / 6); R(c, ix, y + 30, 10, 12, "#151a28"); R(c, ix + 2, y + 33, 6, 6, i % 2 ? "#48E6E0" : "#FF4CA8"); R(c, ix + 3, y + 34, 4, 4, "#05070C"); }
      R(c, x + 8, y + h - 20, w - 16, 3, "#2a3040");
      break;
    }
    case "exitgate": {
      R(c, x, y, w, h, "#0e121c"); R(c, x + 4, y + 8, w - 8, h - 8, "#05070C");
      R(c, x, y, w, 3, "#48E6E0"); R(c, x, y, 3, h, "#2a3a4a"); R(c, x + w - 3, y, 3, h, "#2a3a4a");
      for (let j = y + 12; j < y + h; j += 6) R(c, x + 6, j, w - 12, 1, "#0a2a30");
      drawText(c, "UPLINK", x + w / 2, y + 4 - 10, "#48E6E0", 1, "center");
      break;
    }
  }
}

function drawStaticDeco(c: Ctx, d: any, L: LevelData): void {
  const P = L.theme.tile;
  switch (d.t) {
    case "railing": {
      const w = d.w * T, x = d.x, y = d.y;
      const col = d.back ? shade(P.hi, -0.2) : P.hi;
      R(c, x, y - 9, w, 1, col); R(c, x, y - 5, w, 1, shade(col, -0.3));
      for (let i = 0; i <= w; i += 8) R(c, x + Math.min(i, w - 1), y - 9, 1, 9, shade(col, -0.2));
      if (L.theme.key === "bazaar" || L.theme.key === "neonbazaar" || L.theme.key === "watcher") R(c, x, y - 1, w, 1, L.theme.neon[0]);
      break;
    }
    case "antenna": { R(c, d.x, d.y - 30, 1, 30, "#5a606c"); R(c, d.x - 4, d.y - 22, 9, 1, "#5a606c"); R(c, d.x - 3, d.y - 14, 7, 1, "#5a606c"); break; }
    case "acunit": { R(c, d.x, d.y - 10, 14, 10, "#5a6270"); R(c, d.x, d.y - 10, 14, 1, "#8a94a6"); c.fillStyle = "#2a2e36"; c.beginPath(); c.arc(d.x + 7, d.y - 5, 3.5, 0, 6.3); c.fill(); break; }
    case "chains": { for (const ox of [2, d.w * T - 3]) for (let j = 0; j < 40; j += 2) R(c, d.x + ox, d.y - 40 + j, 1, 1, "#4a4a44"); break; }
    case "vent": { R(c, d.x - 6, d.y - 1, 12, 1, "#05070C"); for (let i = -5; i < 6; i += 2) R(c, d.x + i, d.y - 1, 1, 1, "#4a505a"); break; }
  }
}

/** Weathering pass for gritty themes: rust streaks, damp stains and dark grime at the edges. */
function grime(c: Ctx, f: any): void {
  if (f.kind === "exitgate" || f.kind === "shopfront" || f.kind === "shaft") return;
  const x = f.x, y = f.y - f.h, w = f.w, h = f.h, rng = new RNG(Math.floor(f.x) * 7 + 13);
  for (let i = 0; i < w / 12; i++) { const sx = x + rng.next() * w, len = 8 + rng.next() * h * 0.6; c.fillStyle = `rgba(110,52,24,${0.1 + rng.next() * 0.12})`; c.fillRect(Math.round(sx), Math.round(y + rng.next() * h * 0.3), 1 + rng.int(0, 1), Math.round(len)); }
  for (let i = 0; i < w / 40; i++) { c.fillStyle = "rgba(10,20,22,0.28)"; c.fillRect(Math.round(x + rng.next() * w), Math.round(y + h * (0.55 + rng.next() * 0.4)), 8 + rng.int(0, 16), 3 + rng.int(0, 3)); }
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(0,0,0,0.35)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.32)");
  c.fillStyle = g; c.fillRect(x, y, w, h);
}
