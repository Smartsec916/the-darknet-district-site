// Tiny pixel buffer used to paint sprites procedurally, with rim light + outline passes.
export function C(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
}
export function mix(a: number, b: number, t: number): number {
  const ar = a & 255, ag = (a >>> 8) & 255, ab = (a >>> 16) & 255;
  const br = b & 255, bg = (b >>> 8) & 255, bb = (b >>> 16) & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (0xff000000 | (bl << 16) | (g << 8) | r) >>> 0;
}
export const BLACK = C("#000000");
export const dark = (c: number, t = 0.35) => mix(c, BLACK, t);
export const light = (c: number, t = 0.3) => mix(c, C("#ffffff"), t);

export class PixBuf {
  w: number; h: number; d: Uint32Array;
  constructor(w: number, h: number) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  set(x: number, y: number, c: number): void {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x: number, y: number): number { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[y * this.w + x]; }
  disc(cx: number, cy: number, r: number, c: number): void {
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) this.set(x, y, c);
      }
  }
  seg(x0: number, y0: number, x1: number, y1: number, r0: number, c: number, r1 = r0): void {
    const len = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.ceil(len * 2));
    for (let i = 0; i <= n; i++) { const t = i / n; this.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t, c); }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number): void {
    const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); const n = Math.max(1, Math.ceil(len));
    for (let i = 0; i <= n; i++) { const t = i / n; this.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, c); }
  }
  rect(x: number, y: number, w: number, h: number, c: number): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** Rim light: pixels exposed on the left (behind) pick up `back`, exposed on top pick up `top`. */
  rim(back: number, top: number, tb = 0.4, tt = 0.25): void {
    const src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x; const c = src[i]; if (!c) continue;
      const L = x > 0 ? src[i - 1] : 0, U = y > 0 ? src[i - this.w] : 0;
      let o = c;
      if (!L) o = mix(o, back, tb);
      if (!U) o = mix(o, top, tt);
      this.d[i] = o;
    }
  }
  outline(c: number): void {
    const src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x; if (src[i]) continue;
      if ((x > 0 && src[i - 1]) || (x < this.w - 1 && src[i + 1]) || (y > 0 && src[i - this.w]) || (y < this.h - 1 && src[i + this.w])) this.d[i] = c;
    }
  }
  put(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    ctx.putImageData(img, ox, oy);
  }
}
export function flashCopy(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const x = c.getContext("2d")!;
  x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#ffffff"; x.fillRect(0, 0, c.width, c.height);
  return c;
}
