// Fixed 320x240 (4:3) arcade screen, scaled to fit and centred inside a cabinet frame.
import { drawText } from "./font";
export const view = {
  w: 320, h: 240, scale: 2,
  canvas: null as unknown as HTMLCanvasElement,
  ctx: null as unknown as CanvasRenderingContext2D,
  portrait: true,
  safe: { top: 0, bottom: 0, left: 0, right: 0 },
  screen: { x: 0, y: 0, w: 320, h: 240 }, // CSS px rect of the game screen
  onResize: [] as (() => void)[],
  fx: { scanlines: true, glow: true, grid: false, cabinet: true },
};

export function initView(): void {
  const scr = document.getElementById("screen")!;
  const c = document.createElement("canvas");
  scr.insertBefore(c, scr.firstChild);
  c.width = view.w; c.height = view.h;
  view.canvas = c;
  view.ctx = c.getContext("2d")!;
  view.ctx.imageSmoothingEnabled = false;
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 200));
}

let marqueeDrawn = false;
function drawMarquee(): void {
  const m = document.getElementById("marquee") as HTMLCanvasElement;
  if (!m || marqueeDrawn) return;
  marqueeDrawn = true;
  m.width = 160; m.height = 12;
  const x = m.getContext("2d")!; x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, 160, 12);
  drawText(x, "BLACKOUT", 80 - 3 - 47, 2, "#48E6E0", 1, "left", "#0a3a44");
  drawText(x, "PROTOCOL", 80 + 3, 2, "#FF4CA8", 1, "left", "#4a1030");
}

export function resize(): void {
  const W = Math.max(100, window.innerWidth), H = Math.max(100, window.innerHeight);
  view.portrait = H > W * 1.05;
  const sa = document.getElementById("sa");
  if (sa) {
    const cs = getComputedStyle(sa);
    view.safe.top = parseFloat(cs.paddingTop || "0") || 0; view.safe.bottom = parseFloat(cs.paddingBottom || "0") || 0;
    view.safe.left = parseFloat(cs.paddingLeft || "0") || 0; view.safe.right = parseFloat(cs.paddingRight || "0") || 0;
  }
  const cab = view.fx.cabinet;
  const bezel = cab ? 10 : 0, marq = cab ? 26 : 0;
  let availW: number, availH: number, top: number;
  if (view.portrait) {
    availW = W - view.safe.left - view.safe.right - bezel * 2 - 8;
    availH = H * 0.55 - view.safe.top - marq - bezel * 2;
    top = view.safe.top + 6 + marq + bezel;
  } else {
    const coarse = matchMedia("(pointer: coarse)").matches;
    const side = coarse ? Math.min(W * 0.2, 190) : 0;
    availW = W - side * 2 - view.safe.left - view.safe.right - bezel * 2 - 8;
    availH = H - view.safe.top - view.safe.bottom - marq - bezel * 2 - 8;
    top = 0;
  }
  const fit = Math.max(0.25, Math.min(availW / view.w, availH / view.h));
  const intS = Math.floor(fit);
  const s = intS >= 1 && intS >= fit * 0.8 ? intS : fit;
  view.scale = s; (window as any).__viewScale = s;
  const sw = Math.round(view.w * s), sh = Math.round(view.h * s);
  const sx = Math.round((W - sw) / 2);
  const sy = view.portrait ? Math.round(Math.max(top, H * 0.36 - sh / 2)) : Math.round(view.safe.top + (H - view.safe.top - view.safe.bottom - sh - marq) / 2 + marq);
  view.screen = { x: sx, y: sy, w: sw, h: sh };
  const scr = document.getElementById("screen")!;
  Object.assign(scr.style, { left: sx + "px", top: sy + "px", width: sw + "px", height: sh + "px" });
  scr.style.setProperty("--px", s + "px");
  scr.classList.toggle("glow", view.fx.glow);
  (document.getElementById("scan")!).style.display = view.fx.scanlines && s >= 1.5 ? "block" : "none";
  (document.getElementById("grid")!).style.display = view.fx.grid && s >= 2 ? "block" : "none";
  (document.getElementById("vign")!).style.display = view.fx.glow ? "block" : "none";
  const cabEl = document.getElementById("cab")!;
  const m = document.getElementById("marquee") as HTMLCanvasElement;
  cabEl.style.display = cab ? "block" : "none"; m.style.display = cab ? "block" : "none";
  if (cab) {
    const deck = view.portrait ? 34 : 0;
    Object.assign(cabEl.style, { left: sx - bezel + "px", top: sy - bezel - marq + "px", width: sw + bezel * 2 + "px", height: sh + bezel * 2 + marq + deck + "px" });
    let dk = document.getElementById("deck");
    if (!dk) { dk = document.createElement("div"); dk.id = "deck"; cabEl.appendChild(dk); }
    Object.assign(dk.style, { position: "absolute", left: "12%", right: "12%", bottom: "10px", height: deck ? "14px" : "0px", display: deck ? "block" : "none", borderRadius: "3px", background: "repeating-linear-gradient(90deg, #070a11 0 3px, #1c2333 3px 6px)", boxShadow: "0 0 0 1px #2a3346" });
    if (!cabEl.childElementCount) {
      for (const [l, t] of [["6px", "6px"], ["calc(100% - 11px)", "6px"], ["6px", "calc(100% - 11px)"], ["calc(100% - 11px)", "calc(100% - 11px)"]]) {
        const b = document.createElement("div"); b.className = "bolt"; b.style.left = l; b.style.top = t; cabEl.appendChild(b);
      }
      const st = document.createElement("div"); st.className = "stripe"; st.style.bottom = "3px"; cabEl.appendChild(st);
    }
    drawMarquee();
    const ms = Math.max(1, Math.min(3, Math.floor((marq - 6) / 12 * 2) / 2 || 1));
    const mw = 160 * ms * 1.4, mh = 12 * ms * 1.4;
    Object.assign(m.style, { width: mw + "px", height: mh + "px", left: Math.round(W / 2 - mw / 2) + "px", top: Math.round(sy - bezel - marq + (marq - mh) / 2 + 2) + "px" });
  }
  for (const f of view.onResize) f();
}

export function toLogical(clientX: number, clientY: number): { x: number; y: number } {
  const r = view.canvas.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * view.w, y: ((clientY - r.top) / r.height) * view.h };
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  return [c, x];
}
