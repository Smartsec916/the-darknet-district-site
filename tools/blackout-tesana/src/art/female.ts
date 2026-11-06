// The original female character art (idle / walk / run poses) used for Neon Bazaar residents.
// Each pose is one image; motion (bob, squash, flip, crouch) is applied when drawing.
import { makeCanvas } from "../engine/view";

export const FEM_H = 36;
type Pose = "idle" | "walk" | "run";
const POSES: Partial<Record<Pose, HTMLCanvasElement>> = {};
let started = false, ready = false;

function shrink(img: HTMLImageElement, h: number): HTMLCanvasElement {
  const w = Math.round((img.naturalWidth / img.naturalHeight) * h);
  let src: CanvasImageSource = img, sw = img.naturalWidth, sh = img.naturalHeight;
  while (sh / 2 > h) { // halve in steps for a clean downscale
    const [c, x] = makeCanvas(Math.round(sw / 2), Math.round(sh / 2)); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, c.width, c.height); src = c; sw = c.width; sh = c.height;
  }
  const [out, ox] = makeCanvas(w, h); ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = "high";
  ox.drawImage(src, 0, 0, w, h); return out;
}
export function loadFemale(): void {
  if (started) return; started = true;
  const names: Pose[] = ["idle", "walk", "run"]; let n = 0;
  for (const p of names) {
    const i = new Image();
    i.onload = () => { POSES[p] = shrink(i, FEM_H); if (++n === names.length) ready = true; };
    i.src = `assets/female/${p}.webp`;
  }
}
export const femaleReady = () => ready;

/** Draws a female pose standing at (x, y) = feet. `t` is the animation clock for this anim. */
export function drawFemale(c: CanvasRenderingContext2D, anim: string, t: number, x: number, y: number, flip: boolean): void {
  let pose: Pose = "idle", bob = 0, sx = 1, sy = 1;
  switch (anim) {
    case "walk": pose = "walk"; bob = -Math.round(Math.abs(Math.sin(t * 9)) * 1.6); sx = 1 + Math.sin(t * 18) * 0.03; break;
    case "run": pose = "run"; bob = -Math.round(Math.abs(Math.sin(t * 14)) * 2.6); break;
    case "turn": pose = "walk"; sx = Math.cos(Math.min(1, t / 0.28) * Math.PI); break;
    case "react": pose = "idle"; bob = t < 0.25 ? -Math.round(Math.sin((t / 0.25) * Math.PI) * 4) : 0; break;
    case "hide": pose = "idle"; sy = 0.82; sx = 1.06; break;
    case "talk": pose = "idle"; bob = Math.floor(t * 4) % 2 ? -1 : 0; break;
    default: pose = "idle"; bob = Math.sin(t * 2.2) > 0.7 ? -1 : 0; // idle / look
  }
  const img = POSES[pose]; if (!img) return;
  const w = Math.round(img.width * Math.abs(sx)), h = Math.round(img.height * sy);
  const X = Math.round(x), Y = Math.round(y) + bob;
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(X - 7, Math.round(y), 14, 1);
  c.save(); c.translate(X, Y); if (flip !== sx < 0) c.scale(-1, 1);
  c.drawImage(img, -Math.round(w / 2), -h, w, h); c.restore();
}
