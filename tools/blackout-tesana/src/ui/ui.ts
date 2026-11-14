// Immediate-mode pixel UI: buttons, panels and icons usable by tap or keyboard.
import { input } from "../engine/input";
import { drawText, textWidth } from "../engine/font";
import { sfx } from "../engine/audio";
type Ctx = CanvasRenderingContext2D;
export const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export function panel(c: Ctx, x: number, y: number, w: number, h: number, a = "#48E6E0", b = "#FF4CA8"): void {
  R(c, x, y, w, h, "rgba(8,12,22,0.94)"); R(c, x + 1, y + 1, w - 2, h - 2, "rgba(20,26,40,0.6)");
  R(c, x, y, w, 1, a); R(c, x, y + h - 1, w, 1, b); R(c, x, y, 1, h, a); R(c, x + w - 1, y, 1, h, b);
  R(c, x + 2, y + 2, 3, 1, a); R(c, x + w - 5, y + h - 3, 3, 1, b);
}
class UI {
  n = 0; focus = 0; lock = 0; lastCount = 0; rects: [number, number, number, number, boolean][] = []; pending = -1;
  begin(dt: number): void { this.lastCount = this.n; this.n = 0; this.lock -= dt; this.rects = []; }
  reset(): void { this.focus = 0; this.lock = 0.18; this.pending = -1; }
  end(): void {
    // resolve taps to the nearest button (generous touch targets), applied next frame
    if (this.lock <= 0 && input.taps.length && this.rects.length) {
      const pad = Math.max(3, (42 / Math.max(0.5, (window as any).__viewScale || 1) - 14) / 2);
      for (const t of input.taps) {
        let best = -1, bd = 1e9;
        this.rects.forEach(([x, y, w, h, dis], i) => { if (dis) return; if (t.x >= x - pad && t.x < x + w + pad && t.y >= y - pad && t.y < y + h + pad) { const dx = Math.max(0, x - t.x, t.x - (x + w)), dy = Math.max(0, y - t.y, t.y - (y + h)); const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } } });
        if (best >= 0) this.pending = best;
      }
    }
    if (this.lock > 0 || this.lastCount === 0) return;
    if (input.pressed("down") || input.pressed("right")) { this.focus = (this.focus + 1) % this.n; sfx("select", 0.5); }
    if (input.pressed("up") || input.pressed("left")) { this.focus = (this.focus - 1 + this.n) % this.n; sfx("select", 0.5); }
  }
  hitTap(x: number, y: number, w: number, h: number): boolean { if (this.lock > 0) return false; for (const t of input.taps) if (t.x >= x && t.x < x + w && t.y >= y && t.y < y + h) return true; return false; }
  button(c: Ctx, label: string, x: number, y: number, w: number, h = 14, opt: { col?: string; disabled?: boolean; small?: boolean } = {}): boolean {
    const i = this.n++;
    const foc = i === this.focus;
    const col = opt.disabled ? "#3a4252" : opt.col || "#48E6E0";
    R(c, x, y, w, h, foc ? "rgba(72,230,224,0.16)" : "rgba(10,14,24,0.9)");
    R(c, x, y, w, 1, col); R(c, x, y + h - 1, w, 1, foc ? col : "#1a2232"); R(c, x, y, 1, h, foc ? col : "#1a2232"); R(c, x + w - 1, y, 1, h, foc ? col : "#1a2232");
    if (foc) { R(c, x - 4, y + h / 2 - 2, 2, 4, col); R(c, x + w + 2, y + h / 2 - 2, 2, 4, col); }
    drawText(c, label, x + w / 2, y + Math.floor((h - 7) / 2), opt.disabled ? "#5a6272" : foc ? "#ffffff" : col, 1, "center");
    this.rects.push([x, y, w, h, !!opt.disabled]);
    if (this.lock > 0 || opt.disabled) return false;
    if (this.pending === i) { this.pending = -1; this.focus = i; sfx("select"); return true; }
    if (foc && (input.pressed("confirm") || input.pressed("jump"))) { sfx("select"); return true; }
    return false;
  }
  back(): boolean { return this.lock <= 0 && (input.pressed("back") || input.pressed("pause")); }
}
export const ui = new UI();
export function centerText(c: Ctx, s: string, x: number, y: number, col: string, scale = 1): void { drawText(c, s, x, y, col, scale, "center"); }
export { textWidth };

export function icon(c: Ctx, k: string, x: number, y: number): void {
  const P = (a: number, b: number, w: number, h: number, col: string) => R(c, x + a, y + b, w, h, col);
  switch (k) {
    case "armor": P(2, 1, 8, 9, "#5a6272"); P(3, 2, 6, 7, "#2c313b"); P(5, 3, 2, 5, "#48E6E0"); P(4, 10, 4, 1, "#5a6272"); break;
    case "emp": P(3, 3, 6, 6, "#2a3040"); P(5, 5, 2, 2, "#48E6E0"); P(1, 5, 1, 2, "#9ffaf4"); P(10, 5, 1, 2, "#9ffaf4"); P(5, 1, 2, 1, "#9ffaf4"); P(5, 10, 2, 1, "#9ffaf4"); break;
    case "bolt": P(6, 0, 3, 1, "#FFB44A"); P(5, 1, 3, 3, "#FFB44A"); P(3, 4, 6, 2, "#FFB44A"); P(5, 6, 3, 3, "#FFB44A"); P(4, 9, 2, 2, "#FFB44A"); break;
    case "gun": P(1, 4, 9, 3, "#5a6070"); P(10, 5, 1, 1, "#2a2e36"); P(2, 7, 3, 4, "#3a404c"); P(6, 4, 2, 1, "#48E6E0"); break;
    case "ammo": for (let i = 0; i < 3; i++) { P(2 + i * 3, 3, 2, 7, "#FFB44A"); P(2 + i * 3, 2, 2, 1, "#48E6E0"); } break;
    case "shield": P(2, 1, 8, 6, "#48E6E0"); P(3, 7, 6, 2, "#48E6E0"); P(5, 9, 2, 2, "#48E6E0"); P(4, 3, 4, 4, "#0a3a44"); break;
    case "chip": P(2, 2, 8, 8, "#2a3040"); P(4, 4, 4, 4, "#FFB44A"); for (let i = 0; i < 4; i++) { P(3 + i * 2, 0, 1, 2, "#8a94a6"); P(3 + i * 2, 10, 1, 2, "#8a94a6"); } break;
    case "light": P(4, 1, 4, 5, "#FFB44A"); P(3, 2, 6, 3, "#ffe8a0"); P(5, 6, 2, 3, "#5a6070"); P(4, 9, 4, 1, "#5a6070"); break;
    case "boot": P(3, 1, 4, 7, "#3a404c"); P(3, 7, 7, 3, "#3a404c"); P(2, 10, 9, 1, "#FFB44A"); break;
    case "med": P(1, 2, 10, 8, "#e8ecf4"); P(5, 3, 2, 6, "#F04455"); P(3, 5, 6, 2, "#F04455"); break;
  }
}
