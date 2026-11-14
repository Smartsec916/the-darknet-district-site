// Particles, floating text, light sources and screen shake.
import { drawText } from "../engine/font";
type Ctx = CanvasRenderingContext2D;
export interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; s: number; g: number; add: boolean; drag: number }
export interface Light { x: number; y: number; r: number; a: number; col?: string }
export class FX {
  parts: Part[] = [];
  texts: { x: number; y: number; s: string; col: string; life: number }[] = [];
  rings: { x: number; y: number; r: number; max: number; life: number; col: string }[] = [];
  lights: Light[] = [];
  shakeT = 0; shakeA = 0; flashT = 0; flashCol = "#ffffff";
  p(x: number, y: number, vx: number, vy: number, life: number, col: string, s = 1, g = 0, add = false, drag = 0): void {
    if (this.parts.length > 700) this.parts.shift();
    this.parts.push({ x, y, vx, vy, life, max: life, col, s, g, add, drag });
  }
  burst(x: number, y: number, n: number, col: string, spd = 60, life = 0.5, g = 120, add = true): void {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = spd * (0.3 + Math.random()); this.p(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.5 + Math.random() * 0.7), col, Math.random() < 0.3 ? 2 : 1, g, add); }
  }
  sparks(x: number, y: number, n = 8): void { this.burst(x, y, n, Math.random() < 0.5 ? "#FFB44A" : "#fff4c0", 90, 0.4, 260); }
  debris(x: number, y: number, n = 10, col = "#5a606c"): void { for (let i = 0; i < n; i++) this.p(x, y, (Math.random() - 0.5) * 140, -Math.random() * 160, 0.9 + Math.random() * 0.5, col, 2, 420, false); }
  smoke(x: number, y: number, n = 4, col = "rgba(90,90,100,0.5)"): void { for (let i = 0; i < n; i++) this.p(x + (Math.random() - 0.5) * 6, y, (Math.random() - 0.5) * 20, -20 - Math.random() * 20, 0.8 + Math.random() * 0.6, col, 3, -10, false, 1); }
  text(x: number, y: number, s: string, col = "#ffffff"): void { this.texts.push({ x, y, s, col, life: 1.1 }); }
  ring(x: number, y: number, max: number, col = "#48E6E0"): void { this.rings.push({ x, y, r: 4, max, life: 0.45, col }); }
  shake(a: number, t = 0.25): void { this.shakeA = Math.max(this.shakeA, a); this.shakeT = Math.max(this.shakeT, t); }
  flash(col: string, t = 0.12): void { this.flashCol = col; this.flashT = t; }
  update(dt: number): void {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life -= dt; if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; } p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y -= dt * 18; if (t.life <= 0) this.texts.splice(i, 1); }
    for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.life -= dt; r.r += (r.max - r.r) * Math.min(1, dt * 12); if (r.life <= 0) this.rings.splice(i, 1); }
    if (this.shakeT > 0) this.shakeT -= dt; else this.shakeA = 0;
    if (this.flashT > 0) this.flashT -= dt;
  }
  draw(c: Ctx, cx: number, cy: number): void {
    for (const p of this.parts) {
      const a = Math.min(1, p.life / (p.max * 0.5));
      c.globalAlpha = a; if (p.add) c.globalCompositeOperation = "lighter";
      c.fillStyle = p.col; c.fillRect(Math.round(p.x - cx - p.s / 2), Math.round(p.y - cy - p.s / 2), p.s, p.s);
      c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
    for (const r of this.rings) {
      c.globalAlpha = Math.max(0, r.life / 0.45); c.strokeStyle = r.col; c.lineWidth = 2;
      c.beginPath(); c.arc(Math.round(r.x - cx), Math.round(r.y - cy), r.r, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1; c.strokeStyle = "#ffffff"; c.beginPath(); c.arc(Math.round(r.x - cx), Math.round(r.y - cy), r.r * 0.8, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
  }
  drawTexts(c: Ctx, cx: number, cy: number): void {
    for (const t of this.texts) { c.globalAlpha = Math.min(1, t.life * 2); drawText(c, t.s, t.x - cx, t.y - cy, t.col, 1, "center"); }
    c.globalAlpha = 1;
  }
}
// cached radial glow sprite per colour
const glowCache: Record<string, HTMLCanvasElement> = {};
export function glow(col: string): HTMLCanvasElement {
  let g = glowCache[col]; if (g) return g;
  g = document.createElement("canvas"); g.width = g.height = 64;
  const x = g.getContext("2d")!; const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, col); gr.addColorStop(0.25, col + "88"); gr.addColorStop(1, col + "00");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowCache[col] = g; return g;
}
export function drawGlow(c: Ctx, x: number, y: number, r: number, col: string, a = 1): void {
  c.globalAlpha = a; c.globalCompositeOperation = "lighter";
  c.drawImage(glow(col), Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
  c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
}

/** Pull colour out of whatever is already drawn (used for the gritty themes). */
export function desaturate(c: CanvasRenderingContext2D, w: number, h: number, amount: number, dim = 0): void {
  c.globalCompositeOperation = "saturation"; c.globalAlpha = amount; c.fillStyle = "#808080"; c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  if (dim > 0) { c.globalAlpha = dim; c.fillStyle = "#03070b"; c.fillRect(0, 0, w, h); }
  c.globalAlpha = 1;
}
