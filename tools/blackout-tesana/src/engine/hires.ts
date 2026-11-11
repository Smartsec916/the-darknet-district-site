// Screen-resolution layer for crisp advertisement posters, and the final composited picture.
// Where a poster belongs, a hole is punched in the 320x240 pixel canvas and the poster is drawn at full
// display resolution on this canvas. At the end of each frame the whole pixel canvas is scaled (nearest
// neighbour) on top, so characters, rain and HUD still cover posters correctly. This canvas is the one
// the player sees (and the one screenshots capture); the pixel canvas underneath is invisible but still
// receives pointer input.
import { view } from "./view";

export const hires = {
  canvas: null as unknown as HTMLCanvasElement,
  ctx: null as unknown as CanvasRenderingContext2D,
  S: 3,            // device pixels per logical pixel
  dirty: false,
  init(): void {
    const scr = document.getElementById("screen")!;
    const c = document.createElement("canvas");
    c.id = "hires"; c.style.imageRendering = "auto"; c.style.pointerEvents = "none";
    scr.insertBefore(c, view.canvas.nextSibling); // above the pixel canvas, below the CRT overlays
    view.canvas.style.opacity = "0";
    this.canvas = c; this.ctx = c.getContext("2d")!;
    this.fit(); view.onResize.push(() => this.fit());
  },
  fit(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(view.screen.w * dpr);
    const maxW = 1600; if (w > maxW) w = maxW;
    w = Math.max(320, w);
    const h = Math.round(w * view.h / view.w);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.S = w / view.w;
    this.ctx.imageSmoothingEnabled = true; this.ctx.imageSmoothingQuality = "high";
  },
  /** Call once at the start of every frame. */
  frameStart(): void {
    const g = this.ctx; g.globalAlpha = 1; g.fillStyle = "#000"; g.fillRect(0, 0, this.canvas.width, this.canvas.height); this.dirty = false;
  },
  /** Call once at the end of every frame: lays the finished pixel picture over the posters. */
  compose(): void {
    const g = this.ctx; g.globalAlpha = 1; g.imageSmoothingEnabled = false;
    g.drawImage(view.canvas, 0, 0, this.canvas.width, this.canvas.height);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  },
  /**
   * Shows `img` in the logical rect (x, y, w, h) at display resolution on a dark backing panel.
   * `bright` dims the artwork (flicker / unlit posters). The image keeps its own aspect ratio.
   */
  poster(main: CanvasRenderingContext2D, img: CanvasImageSource & { naturalWidth: number; naturalHeight: number }, x: number, y: number, w: number, h: number, bright: number): void {
    main.clearRect(x, y, w, h);
    const S = this.S, g = this.ctx;
    const px = Math.floor(x * S) - 1, py = Math.floor(y * S) - 1, pw = Math.ceil(w * S) + 2, ph = Math.ceil(h * S) + 2;
    g.globalAlpha = 1; g.fillStyle = "#05070b"; g.fillRect(px, py, pw, ph);
    const pad = 1.5 * S, iw = pw - 2 * pad - 2, ih = ph - 2 * pad - 2;
    const sc = Math.min(iw / img.naturalWidth, ih / img.naturalHeight);
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    g.globalAlpha = bright; g.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); g.globalAlpha = 1;
    this.dirty = true;
  },
};
