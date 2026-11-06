// Multi-layer parallax backgrounds, painted procedurally per theme, plus live sky effects.
import { makeCanvas, view } from "../engine/view";
import { RNG, hashStr } from "../engine/rng";
import { Theme, LayerSpec } from "../world/themes";
import { drawText } from "../engine/font";
import { shade } from "./tiles";

type Ctx = CanvasRenderingContext2D;
const LW = 512;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
interface Meta { blink: { x: number; y: number; c: string; p: number; s: number }[]; boards: { x: number; y: number; w: number; h: number; c: string; text: string }[]; fans: { x: number; y: number; r: number; c: string; s: number }[]; stacks: { x: number; y: number }[]; lights: { x: number; y: number }[]; screens: { x: number; y: number; w: number; h: number; c: string; k: number }[] }
interface Layer { spec: LayerSpec; img: HTMLCanvasElement; meta: Meta; h: number }

function wrapR(c: Ctx, x: number, y: number, w: number, h: number, col: string): void { R(c, x, y, w, h, col); if (x + w > LW) R(c, x - LW, y, w, h, col); if (x < 0) R(c, x + LW, y, w, h, col); }

function paint(spec: LayerSpec, th: Theme, seed: number): Layer {
  const H = spec.h || 220;
  const [img, c] = makeCanvas(LW, H);
  const rng = new RNG(seed);
  const meta: Meta = { blink: [], boards: [], fans: [], stacks: [], lights: [], screens: [] };
  const col = spec.col, hi = spec.hi, dens = spec.dens ?? 0.6;
  const win = (x: number, y: number, w: number, h: number, step: number, p: number, cols: string[]) => {
    for (let yy = y + 2; yy < y + h - 1; yy += step) for (let xx = x + 1; xx < x + w - 1; xx += step) if (rng.next() < p) wrapR(c, xx, yy, 1, 1, rng.pick(cols));
  };
  const lightCols = [hi, shade(hi, 0.3), "#FFB44A", "#ffd890", shade(hi, -0.2)];
  switch (spec.p) {
    case "mistcity": {
      // Hazy towers with spires and only a few dim lit windows.
      for (let i = 0; i < 12; i++) {
        const w = rng.int(22, 48), h = rng.int(H * 0.35, H * 0.88), x = rng.int(0, LW);
        const cc = shade(col, rng.range(-0.08, 0.1));
        wrapR(c, x, H - h, w, h, cc); wrapR(c, x + 4, H - h - 6, w - 8, 6, cc); wrapR(c, x + w / 2 - 4, H - h - 12, 8, 6, cc);
        if (rng.next() < 0.6) { const sp = rng.int(14, 40); wrapR(c, x + w / 2, H - h - 12 - sp, 1, sp, cc); if (rng.next() < 0.5) meta.blink.push({ x: x + w / 2, y: H - h - 12 - sp, c: "#c03a50", p: rng.next() * 6, s: 0.6 }); }
        wrapR(c, x + w - 3, H - h, 3, h, shade(cc, -0.25));
        for (let yy = H - h + 10; yy < H - 6; yy += 6) for (let xx = x + 4; xx < x + w - 5; xx += 4) if (rng.next() < 0.07 * (dens + 0.3)) wrapR(c, xx, yy, 2, 1, shade(hi, -0.3));
        // occasional distant animated billboard
        if (th.ads.length && i % 4 === 1 && w > 30) { const text = th.ads[i % th.ads.length]; meta.boards.push({ x: x + 3, y: H - h + rng.int(10, 30), w: Math.min(w - 6, text.length * 6 + 4), h: 11, c: shade(th.neon[(i >> 2) % th.neon.length], -0.15), text }); }
      }
      break;
    }
    case "containers": {
      // Rusted shipping-container shanty: stacks, corrugation, dim windows, amber doors, graffiti.
      const pal = ["#6a3022", "#1f4a58", "#7a4a22", "#2a3e4a", "#58281e"];
      let x = -rng.int(0, 30);
      while (x < LW) {
        const cw = rng.int(46, 64), stack = rng.int(1, 3);
        for (let s = 0; s < stack; s++) {
          const ch = 22, cy = H - 8 - (s + 1) * ch, ox = s ? rng.int(-6, 6) : 0, bx = x + ox, base = pal[rng.int(0, pal.length - 1)];
          wrapR(c, bx, cy, cw, ch, base);
          for (let i = 2; i < cw - 2; i += 3) wrapR(c, bx + i, cy + 2, 1, ch - 4, shade(base, -0.28));
          wrapR(c, bx, cy, cw, 2, shade(base, 0.18)); wrapR(c, bx, cy + ch - 2, cw, 2, shade(base, -0.5));
          for (const [qx, qy] of [[0, 0], [cw - 3, 0], [0, ch - 3], [cw - 3, ch - 3]]) wrapR(c, bx + qx, cy + qy, 3, 3, shade(base, -0.45));
          for (let k = 0; k < 10; k++) wrapR(c, bx + rng.int(2, cw - 3), cy + rng.int(3, ch - 4), 1, 1, shade(base, -0.5));
          const r = rng.next();
          if (r < 0.5) { const wx = bx + rng.int(6, cw - 16); wrapR(c, wx, cy + 5, 10, 8, "#05070C"); const lit = rng.pick(["#2f7a7a", "#7a2f58", "#05070C", "#8a5a22"]); wrapR(c, wx + 1, cy + 6, 8, 6, lit); wrapR(c, wx + 4, cy + 6, 1, 6, "#05070C"); if (lit !== "#05070C") meta.blink.push({ x: wx + 2, y: cy + 7, c: lit, p: rng.next() * 6, s: 0.35 }); }
          else if (r < 0.7 && s === 0) { const dx = bx + rng.int(6, cw - 14); wrapR(c, dx, cy + 6, 8, ch - 8, "#05070C"); wrapR(c, dx + 1, cy + 7, 6, ch - 9, "#7a5a1e"); wrapR(c, dx + 1, cy + 7, 6, 1, "#c8923a"); }
          else if (r < 0.9) { const gx = bx + rng.int(4, cw - 18), gc = rng.pick(["#2f7a7a", "#7a2f58", "#8a5a22"]); for (let i = 0; i < 14; i++) wrapR(c, gx + i, cy + 10 + Math.round(Math.sin(i * 0.9 + gx) * 2), 1, 2, shade(gc, -0.2)); }
        }
        x += cw + rng.int(-4, 8);
      }
      break;
    }
    case "skyline": {
      for (let i = 0; i < 40; i++) {
        const w = rng.int(10, 34), h = rng.int(H * 0.25, H * 0.95), x = rng.int(0, LW);
        const cc = shade(col, rng.range(-0.15, 0.12));
        wrapR(c, x, H - h, w, h, cc);
        if (rng.next() < 0.4) { wrapR(c, x + w / 2, H - h - 10, 1, 10, cc); meta.blink.push({ x: x + w / 2, y: H - h - 11, c: "#F04455", p: rng.next() * 6, s: 1.2 }); }
        if (rng.next() < 0.3) wrapR(c, x + 2, H - h - 4, w - 4, 4, cc);
        win(x, H - h, w, h, 3, 0.35 * dens, lightCols);
      }
      break;
    }
    case "megatowers": {
      for (let i = 0; i < 5; i++) {
        const w = rng.int(36, 70), h = rng.int(H * 0.7, H), x = (i * LW) / 5 + rng.int(-10, 10);
        const cc = shade(col, rng.range(-0.1, 0.15));
        wrapR(c, x, H - h, w, h, cc);
        wrapR(c, x + 6, H - h - 12, w - 12, 12, cc); wrapR(c, x + w / 2 - 2, H - h - 34, 4, 22, cc);
        meta.blink.push({ x: x + w / 2, y: H - h - 35, c: "#F04455", p: rng.next() * 6, s: 0.8 });
        wrapR(c, x + 3, H - h, 1, h, shade(hi, -0.3)); wrapR(c, x + w - 4, H - h, 1, h, shade(hi, -0.5));
        win(x + 4, H - h + 14, w - 8, h - 14, 2, 0.25 * dens, lightCols);
        if (rng.next() < 0.85) { const bw = Math.min(w - 8, 46), bh = 18; meta.boards.push({ x: x + (w - bw) / 2, y: H - h + 24 + rng.int(0, 40), w: bw, h: bh, c: rng.pick(th.neon), text: rng.pick(th.ads) }); }
      }
      break;
    }
    case "buildings": case "bazaar": {
      const n = spec.p === "bazaar" ? 16 : 11;
      for (let i = 0; i < n; i++) {
        const w = rng.int(26, 58), h = rng.int(H * 0.35, H * 0.9), x = rng.int(0, LW);
        const cc = shade(col, rng.range(-0.1, 0.18));
        wrapR(c, x, H - h, w, h, cc); wrapR(c, x, H - h, w, 1, shade(cc, 0.2));
        for (let yy = H - h + 6; yy < H - 4; yy += 7) for (let xx = x + 3; xx < x + w - 4; xx += 6) if (rng.next() < 0.5 * dens) { const lc = rng.pick(lightCols); wrapR(c, xx, yy, 3, 2, shade(lc, -0.35)); wrapR(c, xx, yy, 3, 1, lc); }
        for (let b = 0; b < 3; b++) if (rng.next() < 0.5) { const by = H - h + rng.int(10, h - 10); wrapR(c, x - 2, by, w + 4, 1, shade(cc, 0.25)); wrapR(c, x - 2, by - 4, 1, 4, shade(cc, 0.25)); }
        if (rng.next() < (spec.p === "bazaar" ? 0.95 : 0.6)) {
          const sc = rng.pick(th.neon); const text = rng.pick(th.ads);
          if (rng.next() < 0.5) meta.boards.push({ x: x + 2, y: H - h + rng.int(8, Math.max(9, h / 2)), w: Math.min(w - 4, text.length * 6 + 4), h: 11, c: sc, text });
          else { const vx = x + rng.int(2, w - 8); meta.boards.push({ x: vx, y: H - h + 6, w: 8, h: Math.min(h - 10, text.length * 8 + 4), c: sc, text: "|" + text }); }
        }
        if (spec.p === "bazaar" && rng.next() < 0.6) { const ly = H - h + rng.int(15, 60); for (let k = 0; k < w + 30; k += 3) { const lx = x + k; const sag = Math.sin((k / (w + 30)) * Math.PI) * 6; wrapR(c, lx, ly + sag, 1, 1, "#2a1a2a"); if (k % 9 === 0) meta.blink.push({ x: lx, y: ly + sag + 1, c: rng.pick(th.neon), p: rng.next() * 6, s: 2 }); } }
      }
      break;
    }
    case "industrial": {
      for (let i = 0; i < 8; i++) {
        const w = rng.int(40, 80), h = rng.int(H * 0.25, H * 0.55), x = rng.int(0, LW);
        const cc = shade(col, rng.range(-0.1, 0.15));
        wrapR(c, x, H - h, w, h, cc);
        for (let k = 0; k < w; k += 10) wrapR(c, x + k, H - h - 5, 10, 5, k % 20 ? cc : shade(cc, 0.1));
        if (rng.next() < 0.8) { const sx = x + rng.int(4, w - 10), sh = rng.int(30, H * 0.4); wrapR(c, sx, H - h - sh, 6, sh, shade(cc, -0.1)); wrapR(c, sx - 1, H - h - sh, 8, 3, shade(cc, 0.2)); meta.stacks.push({ x: sx + 3, y: H - h - sh }); meta.blink.push({ x: sx + 3, y: H - h - sh + 4, c: "#F04455", p: rng.next() * 6, s: 1 }); }
        win(x, H - h, w, h, 4, 0.2, [hi, "#FFB44A"]);
        if (rng.next() < 0.6) { c.fillStyle = shade(cc, 0.05); c.beginPath(); c.arc(x + w / 2, H - h, 14, Math.PI, 0); c.fill(); }
      }
      break;
    }
    case "towers": case "fence": {
      if (spec.p === "fence") { R(c, 0, H - 40, LW, 40, col); for (let x = 0; x < LW; x += 3) for (let y = H - 70; y < H - 40; y += 3) R(c, x + ((y / 3) % 2), y, 1, 1, shade(col, 0.15)); for (let x = 0; x < LW; x += 32) { R(c, x, H - 76, 2, 36, shade(col, 0.2)); R(c, x - 6, H - 76, 14, 1, shade(col, 0.2)); } for (let x = 16; x < LW; x += 96) meta.blink.push({ x, y: H - 42, c: hi, p: x, s: 1.6 }); break; }
      for (let i = 0; i < 5; i++) {
        const x = (i * LW) / 5 + rng.int(0, 40), h = rng.int(H * 0.5, H * 0.95), w = 6;
        for (let y = H - h; y < H; y += 6) { wrapR(c, x, y, 1, 6, col); wrapR(c, x + w, y, 1, 6, col); wrapR(c, x, y + ((y / 6) % 2 ? 0 : 5), w, 1, col); }
        const cc = shade(col, 0.1);
        wrapR(c, x - 8, H - h - 10, w + 17, 10, cc); wrapR(c, x - 6, H - h - 7, w + 13, 3, shade(hi, -0.4));
        wrapR(c, x - 10, H - h - 12, w + 21, 2, cc);
        meta.lights.push({ x: x + 3, y: H - h - 6 });
        meta.blink.push({ x: x + 3, y: H - h - 14, c: "#F04455", p: rng.next() * 6, s: 1.5 });
      }
      break;
    }
    case "corridor": {
      R(c, 0, 0, LW, H, shade(col, -0.2));
      for (let bx = 0; bx < LW; bx += 128) {
        for (let k = 0; k < 5; k++) { const ins = k * 10; const cc = shade(col, 0.05 + k * 0.05); c.strokeStyle = cc; c.lineWidth = 2; c.strokeRect(bx + 14 + ins, 20 + ins, 100 - ins * 2, H - 30 - ins * 2); }
        R(c, bx + 58, 66, 12, 3, hi); meta.blink.push({ x: bx + 64, y: 70, c: hi, p: bx, s: 0.6 });
        R(c, bx, H - 30, 128, 2, shade(col, 0.2));
      }
      break;
    }
    case "machinery": case "turbines": {
      R(c, 0, H * 0.35, LW, H * 0.65, shade(col, -0.1));
      for (let i = 0; i < 6; i++) {
        const x = rng.int(0, LW), y = rng.int(H * 0.3, H * 0.8), r = rng.int(14, 34);
        if (spec.p === "turbines") { wrapR(c, x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8, shade(col, 0.1)); meta.fans.push({ x, y, r, c: shade(col, 0.3), s: rng.range(1, 3) }); }
        else {
          c.fillStyle = shade(col, 0.12); c.beginPath(); c.arc(x, y, r, 0, 6.29); c.fill();
          c.fillStyle = shade(col, -0.05); c.beginPath(); c.arc(x, y, r * 0.55, 0, 6.29); c.fill();
          for (let a = 0; a < 6.28; a += 0.5) R(c, x + Math.cos(a) * r - 2, y + Math.sin(a) * r - 2, 4, 4, shade(col, 0.12));
          meta.fans.push({ x, y, r: r * 0.5, c: shade(col, 0.2), s: rng.range(-0.6, 0.6) });
        }
      }
      for (let i = 0; i < 10; i++) { const x = rng.int(0, LW); const w = rng.int(6, 14); wrapR(c, x, rng.int(0, H * 0.4), w, H, shade(col, rng.range(-0.1, 0.1))); if (rng.next() < 0.5) meta.blink.push({ x: x + w / 2, y: rng.int(H * 0.4, H - 10), c: hi, p: rng.next() * 6, s: 1 }); }
      break;
    }
    case "racks": {
      for (let x = 0; x < LW; x += 44) { R(c, x + 4, H - 110, 36, 110, col); for (let y = H - 104; y < H; y += 18) { R(c, x + 4, y, 36, 2, shade(col, 0.2)); for (let k = 0; k < 4; k++) R(c, x + 7 + k * 8, y - 10, 5, 10, shade(col, 0.08)); } meta.blink.push({ x: x + 22, y: H - 114, c: hi, p: x, s: 1 }); }
      break;
    }
    case "conduits": case "core": {
      if (spec.p === "core") {
        for (let k = 0; k < 2; k++) {
          const cx = 128 + k * 256, w = 70;
          R(c, cx - w / 2, 0, w, H, shade(col, 0.1)); R(c, cx - w / 2 + 6, 0, w - 12, H, shade(col, -0.05));
          for (let y = 20; y < H; y += 26) { R(c, cx - w / 2 - 6, y, w + 12, 6, shade(col, 0.2)); meta.blink.push({ x: cx - w / 2 - 4, y: y + 2, c: hi, p: y * 0.1, s: 2 }); meta.blink.push({ x: cx + w / 2 + 3, y: y + 2, c: hi, p: y * 0.1 + 1, s: 2 }); }
          meta.screens.push({ x: cx - 10, y: 10, w: 20, h: H - 20, c: hi, k: 2 });
        }
      } else {
        for (let i = 0; i < 9; i++) { const x = rng.int(0, LW), w = rng.int(8, 18); wrapR(c, x, 0, w, H, shade(col, rng.range(0, 0.15))); wrapR(c, x + 2, 0, 1, H, shade(col, 0.3)); for (let y = rng.int(0, 30); y < H; y += rng.int(20, 50)) { wrapR(c, x - 2, y, w + 4, 4, shade(col, 0.25)); meta.blink.push({ x: x + w / 2, y: y + 1, c: hi, p: rng.next() * 6, s: 1.5 }); } }
      }
      break;
    }
    case "servers": {
      for (let x = 0; x < LW; x += 22) {
        const h = rng.int(H * 0.6, H * 0.95);
        R(c, x + 2, H - h, 18, h, col); R(c, x + 2, H - h, 18, 1, shade(col, 0.3));
        for (let y = H - h + 4; y < H - 2; y += 3) { R(c, x + 4, y, 14, 2, shade(col, 0.08)); if (rng.next() < 0.45) meta.blink.push({ x: x + 5 + rng.int(0, 11), y, c: rng.pick([hi, hi, "#F04455", "#7aff9a"]), p: rng.next() * 9, s: rng.range(1, 5) }); }
      }
      break;
    }
    case "fans": {
      R(c, 0, 0, LW, H, shade(col, -0.15));
      for (let i = 0; i < 3; i++) { const x = 85 + i * 170, y = H * 0.5, r = 44; R(c, x - r - 6, y - r - 6, r * 2 + 12, r * 2 + 12, shade(col, 0.08)); c.fillStyle = shade(col, -0.3); c.beginPath(); c.arc(x, y, r, 0, 6.29); c.fill(); meta.fans.push({ x, y, r: r - 2, c: shade(col, 0.25), s: 0.8 + i * 0.3 }); meta.blink.push({ x: x - r - 2, y: y - r - 2, c: hi, p: i, s: 1 }); }
      break;
    }
    case "tunnel": {
      R(c, 0, 0, LW, H, shade(col, -0.3));
      for (let x = 0; x < LW; x += 64) {
        c.fillStyle = col; c.beginPath(); c.arc(x + 32, H * 0.55, 30, Math.PI, 0); c.fill(); R(c, x + 2, H * 0.55, 60, H * 0.45, col);
        c.fillStyle = shade(col, -0.6); c.beginPath(); c.arc(x + 32, H * 0.55, 22, Math.PI, 0); c.fill(); R(c, x + 10, H * 0.55, 44, H * 0.45, shade(col, -0.6));
        meta.blink.push({ x: x + 32, y: H * 0.55 - 26, c: hi, p: x, s: 0.4 });
        R(c, x + 10, H - 8, 44, 1, "#3a3430"); R(c, x + 10, H - 4, 44, 1, "#3a3430");
      }
      break;
    }
    case "supports": {
      for (let x = 0; x < LW; x += 48) { R(c, x + 10, 0, 10, H, col); R(c, x + 10, 0, 2, H, shade(col, 0.2)); R(c, x, 24, 48, 5, col); for (let k = 0; k < 4; k++) R(c, x + 21 + k * 6, 29 + k * 6, 4, 2, col); }
      for (let i = 0; i < 6; i++) meta.blink.push({ x: rng.int(0, LW), y: 30, c: rng.next() < 0.5 ? hi : "#F04455", p: rng.next() * 9, s: 0.5 });
      break;
    }
    case "pipes": case "cables": {
      const n = spec.p === "pipes" ? 3 : 4;
      for (let i = 0; i < n; i++) {
        if (spec.p === "pipes") { const y = rng.int(30, H - 30), t = rng.int(5, 10); R(c, 0, y, LW, t, col); R(c, 0, y, LW, 1, shade(col, 0.18)); R(c, 0, y + t - 1, LW, 1, shade(col, -0.3)); for (let x = rng.int(0, 60); x < LW; x += rng.int(70, 140)) { R(c, x, y - 2, 4, t + 4, shade(col, 0.12)); if (rng.next() < 0.3) meta.blink.push({ x: x + 2, y: y - 3, c: hi, p: rng.next() * 6, s: 1 }); } }
        const x0 = rng.int(0, LW), span = rng.int(100, 220), y0 = rng.int(0, H * 0.35), sag = rng.int(12, 36);
        for (let k = 0; k <= span; k++) { const tt = k / span; wrapR(c, (x0 + k) % LW, y0 + Math.sin(tt * Math.PI) * sag, 1, 1, shade(col, 0.08)); }
      }
      if (spec.p === "pipes") for (let i = 0; i < 2; i++) { const x = rng.int(0, LW), w = rng.int(6, 12); wrapR(c, x, 0, w, H, shade(col, -0.05)); wrapR(c, x + 1, 0, 1, H, shade(col, 0.15)); }
      break;
    }
    case "displays": {
      for (let i = 0; i < 9; i++) {
        const w = rng.int(30, 60), h = rng.int(H * 0.4, H * 0.85), x = rng.int(0, LW);
        wrapR(c, x, H - h, w, h, shade(col, rng.range(-0.05, 0.1)));
        for (let yy = H - h + 6; yy < H - 20; yy += 18) for (let xx = x + 4; xx < x + w - 14; xx += 16) { wrapR(c, xx, yy, 12, 10, "#05070C"); meta.screens.push({ x: xx + 1, y: yy + 1, w: 10, h: 8, c: rng.pick([hi, "#F04455", "#48E6E0"]), k: rng.int(0, 3) }); }
      }
      break;
    }
  }
  // atmospheric haze at the base of each layer
  const g = c.createLinearGradient(0, H * 0.55, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, th.fog + "88");
  c.fillStyle = g; c.fillRect(0, 0, LW, H);
  return { spec, img, meta, h: H };
}

function drawBoard(c: Ctx, b: Meta["boards"][0], x: number, y: number, t: number, i: number): void {
  const flick = Math.sin(t * 3 + i * 7) > -0.92 ? 1 : 0.3;
  c.globalAlpha = flick;
  if (b.text.startsWith("|")) {
    const s = b.text.slice(1);
    R(c, x, y, b.w, b.h, "#07060c"); R(c, x, y, 1, b.h, b.c); R(c, x + b.w - 1, y, 1, b.h, b.c);
    for (let k = 0; k < s.length && k * 8 + 8 < b.h; k++) drawText(c, s[k], x + 2, y + 2 + k * 8, b.c, 1, "left", null);
  } else {
    R(c, x, y, b.w, b.h, "#07060c");
    R(c, x, y, b.w, 1, b.c); R(c, x, y + b.h - 1, b.w, 1, b.c);
    const sc = b.h >= 16 ? 1 : 1;
    const scroll = b.text.length * 6 > b.w - 4 ? Math.floor(t * 10) % (b.text.length * 6 + b.w) : 0;
    c.save(); c.beginPath(); c.rect(x + 1, y + 1, b.w - 2, b.h - 2); c.clip();
    drawText(c, b.text, scroll ? x + b.w - scroll : x + b.w / 2, y + Math.floor((b.h - 7) / 2), b.c, sc, scroll ? "left" : "center", null);
    if (b.h >= 16) { c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(x, y + ((t * 20) % b.h), b.w, 1); }
    c.restore();
  }
  c.globalAlpha = 1;
}

// ---- original painted backdrops (assets/bg/{id}_far.webp, {id}_near.webp) ----
const BGIMG: Record<string, HTMLImageElement> = {};
let bgStarted = false;
export function loadBackdrops(): void {
  if (bgStarted) return; bgStarted = true;
  for (const id of ["01", "02", "03"]) for (const k of ["far", "near"]) {
    const i = new Image(); i.onload = () => { BGIMG[`${id}_${k}`] = i; }; i.src = `assets/bg/${id}_${k}.webp`;
  }
}
interface ImgBack { far: HTMLCanvasElement; near: HTMLCanvasElement }
function buildImgBack(id: string): ImgBack | null {
  const f = BGIMG[`${id}_far`], n = BGIMG[`${id}_near`]; if (!f || !n) return null;
  // far skyline is mirrored end to end so it repeats without a seam
  const [far, fx] = makeCanvas(f.naturalWidth * 2, f.naturalHeight);
  fx.drawImage(f, 0, 0); fx.save(); fx.translate(f.naturalWidth * 2, 0); fx.scale(-1, 1); fx.drawImage(f, 0, 0); fx.restore();
  const [near, nx] = makeCanvas(n.naturalWidth, n.naturalHeight); nx.drawImage(n, 0, 0);
  return { far, near };
}

export class Background {
  layers: Layer[]; th: Theme; t = 0;
  flyers: { x: number; y: number; vx: number; layer: number; c: string }[] = [];
  rain: { x: number; y: number; l: number }[] = [];
  flash = 0; nextFlash = 6;
  smoke: { x: number; y: number; a: number; r: number; layer: number }[] = [];
  imgBack: ImgBack | null = null;
  constructor(th: Theme) {
    this.th = th;
    this.layers = th.img ? [] : th.layers.map((s, i) => paint(s, th, hashStr(th.key + i)));
    const rng = new RNG(hashStr(th.key + "fly"));
    for (let i = 0; i < th.flyers; i++) this.flyers.push({ x: rng.range(0, LW), y: rng.range(20, 120), vx: rng.range(14, 40) * (rng.next() < 0.5 ? -1 : 1), layer: rng.int(0, 2), c: rng.pick(th.neon) });
    for (let i = 0; i < Math.floor(160 * th.rain); i++) this.rain.push({ x: rng.range(0, 400), y: rng.range(0, 260), l: rng.range(3, 7) });
  }
  layerBottom(f: number, groundSY: number, off: number): number { return (view.h * 0.88) * (1 - f) + (groundSY + 30) * f + off; }
  draw(c: Ctx, camX: number, camY: number, groundWorldY: number, dt: number): void {
    this.t += dt; const t = this.t; const th = this.th;
    const g = c.createLinearGradient(0, 0, 0, view.h);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.6, th.sky[1]); g.addColorStop(1, th.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, view.w, view.h);
    if (!th.indoor) { for (let i = 0; i < 40; i++) { const sx = (i * 97 + 13) % view.w, sy = (i * 53) % (view.h * 0.5); if ((i + Math.floor(t * 2)) % 9) R(c, sx, sy, 1, 1, "rgba(200,210,255,0.35)"); } }
    if (this.flash > 0) { c.fillStyle = `rgba(180,190,255,${this.flash * 0.35})`; c.fillRect(0, 0, view.w, view.h); this.flash -= dt * 2.5; }
    if (th.lightning) { this.nextFlash -= dt; if (this.nextFlash < 0) { this.flash = 1; this.nextFlash = 7 + Math.random() * 10; } }
    const groundSY = groundWorldY - camY;
    if (th.img) {
      if (!this.imgBack) this.imgBack = buildImgBack(th.img.id);
      const b = this.imgBack, im = th.img;
      if (b) {
        // far skyline (slow), anchored high on the screen
        const fb = this.layerBottom(im.farF, groundSY, im.farY || 0), ft = Math.round(fb - b.far.height), fw = b.far.width;
        const fo = -(((camX * im.farF) % fw) + fw) % fw;
        for (let x = Math.round(fo); x < view.w; x += fw) c.drawImage(b.far, x, ft);
        if (fb < view.h) { c.fillStyle = "#05060c"; c.fillRect(0, Math.round(fb), view.w, view.h - Math.round(fb)); }
        // near buildings: stand on the street line, scroll slower than the street
        const per = b.near.width + im.nearGap, nb = Math.round(groundSY + (im.nearDrop ?? 6)), nt = nb - b.near.height;
        const no = -(((camX * im.nearF) % per) + per) % per;
        if (nb > 0 && nt < view.h) for (let x = Math.round(no); x < view.w; x += per) c.drawImage(b.near, x, nt);
        if (nb < view.h) { c.fillStyle = "#07080e"; c.fillRect(0, nb, view.w, view.h - nb); }
      }
    }
    this.layers.forEach((L, li) => {
      const f = L.spec.f;
      const bottom = this.layerBottom(f, groundSY, L.spec.y || 0);
      const top = Math.round(bottom - L.h);
      const ox = -(((camX * f) % LW) + LW) % LW;
      for (let x = Math.round(ox); x < view.w; x += LW) c.drawImage(L.img, x, top);
      if (bottom < view.h) R(c, 0, bottom, view.w, view.h - bottom, shade(L.spec.col, -0.2));
      // animated parts
      const sx = (x: number) => { let v = x + ox; while (v < -60) v += LW; while (v > view.w + 60) v -= LW; return v; };
      for (const b of L.meta.blink) { const on = Math.sin(t * b.s + b.p) > 0.2; if (on) { const X = sx(b.x), Y = top + b.y; R(c, X, Y, 1, 1, b.c); c.fillStyle = b.c + "55"; c.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 3, 3); } }
      L.meta.boards.forEach((b, i) => { const X = sx(b.x); if (X > -b.w - 4 && X < view.w + 4) drawBoard(c, b, Math.round(X), top + b.y, t, i + li * 10); });
      for (const fn of L.meta.fans) { const X = sx(fn.x), Y = top + fn.y; if (X < -fn.r - 4 || X > view.w + fn.r + 4) continue; const a0 = t * fn.s; for (let k = 0; k < 4; k++) { const a = a0 + (k * Math.PI) / 2; c.strokeStyle = fn.c; c.lineWidth = Math.max(2, fn.r * 0.3); c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(a) * fn.r, Y + Math.sin(a) * fn.r); c.stroke(); } R(c, X - 2, Y - 2, 4, 4, shade(fn.c, 0.3)); }
      for (const s of L.meta.screens) { const X = Math.round(sx(s.x)), Y = top + s.y; if (X < -s.w || X > view.w) continue; if (s.k === 0) { for (let k = 0; k < s.w; k++) R(c, X + k, Y + s.h / 2 + Math.sin(t * 3 + k * 0.8 + s.x) * (s.h / 2 - 1), 1, 1, s.c); } else if (s.k === 1) { R(c, X, Y + ((t * 8 + s.x) % s.h), s.w, 1, s.c); R(c, X + s.w / 2 - 1, Y + s.h / 2 - 1, 2, 2, s.c); } else if (s.k === 2) { const p = (Math.sin(t * 2 + s.x) + 1) / 2; c.fillStyle = s.c + "44"; c.fillRect(X, Y, s.w, s.h); R(c, X, Y + (1 - p) * s.h, s.w, 2, s.c); } else { for (let k = 0; k < 3; k++) R(c, X + 1, Y + 1 + k * 3, Math.floor((Math.sin(t + k + s.x) + 1) * (s.w - 2) / 2), 1, s.c); } }
      for (const st of L.meta.stacks) { if (Math.random() < dt * 3) this.smoke.push({ x: st.x, y: st.y, a: 0.4, r: 2, layer: li }); }
      // smoke of this layer
      for (const sm of this.smoke) if (sm.layer === li) { c.fillStyle = `rgba(60,50,60,${sm.a})`; const X = sx(sm.x), Y = top + sm.y; c.fillRect(Math.round(X - sm.r), Math.round(Y - sm.r), Math.round(sm.r * 2), Math.round(sm.r * 2)); }
      if (li === 0) { for (const s of this.layers[0].meta.lights.concat(this.layers[1]?.meta.lights || [])) void s; }
      // searchlights from tower layers
      if (th.searchlights && L.spec.p === "towers") {
        c.globalCompositeOperation = "lighter";
        L.meta.lights.forEach((lp, i) => {
          if (i >= th.searchlights) return;
          const X = sx(lp.x), Y = top + lp.y; const a = -Math.PI / 2 + Math.sin(t * 0.4 + i * 1.7) * 0.9;
          const len = 260; const spread = 0.08;
          const gr = c.createLinearGradient(X, Y, X + Math.cos(a) * len, Y + Math.sin(a) * len);
          gr.addColorStop(0, "rgba(160,200,255,0.22)"); gr.addColorStop(1, "rgba(160,200,255,0)");
          c.fillStyle = gr; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(a - spread) * len, Y + Math.sin(a - spread) * len); c.lineTo(X + Math.cos(a + spread) * len, Y + Math.sin(a + spread) * len); c.closePath(); c.fill();
        });
        c.globalCompositeOperation = "source-over";
      }
      // flyers between layers
      for (const fl of this.flyers) if (fl.layer === li) {
        const X = (((fl.x - camX * (f + 0.03)) % (view.w + 80)) + view.w + 80) % (view.w + 80) - 40, Y = top + fl.y * 0.6 + 10;
        const d = fl.vx > 0 ? 1 : -1;
        R(c, X - 4, Y, 9, 2, "#1a1e2a"); R(c, X - 2, Y - 1, 5, 1, "#2a3040"); R(c, X + d * 4, Y, 1, 1, "#ffffff"); R(c, X - d * 5, Y + 1, 1, 1, "#F04455");
        c.fillStyle = fl.c + "66"; c.fillRect(Math.round(X - 3), Math.round(Y + 2), 7, 1);
      }
    });
    for (const fl of this.flyers) { fl.x += fl.vx * dt; }
    for (let i = this.smoke.length - 1; i >= 0; i--) { const s = this.smoke[i]; s.y -= dt * 8; s.x += dt * 5; s.r += dt * 2; s.a -= dt * 0.08; if (s.a <= 0) this.smoke.splice(i, 1); }
  }
  drawRain(c: Ctx, dt: number, camDX: number): void {
    if (!this.rain.length) return;
    c.fillStyle = "rgba(150,180,230,0.35)";
    for (const r of this.rain) {
      r.y += dt * 260; r.x -= dt * 40 + camDX * 0.6;
      if (r.y > view.h) { r.y -= view.h + 10; r.x = Math.random() * (view.w + 40); }
      if (r.x < -5) r.x += view.w + 10; if (r.x > view.w + 5) r.x -= view.w + 10;
      c.fillRect(Math.round(r.x), Math.round(r.y), 1, Math.round(r.l));
    }
  }
}
