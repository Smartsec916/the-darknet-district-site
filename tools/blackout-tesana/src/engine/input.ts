import { toLogical, view } from "./view";

export type Btn = "left" | "right" | "up" | "down" | "jump" | "hack" | "emp" | "fire" | "pause" | "confirm" | "back";
const BTNS: Btn[] = ["left", "right", "up", "down", "jump", "hack", "emp", "fire", "pause", "confirm", "back"];

class Input {
  down: Record<Btn, boolean> = {} as any;
  prev: Record<Btn, boolean> = {} as any;
  keyDown: Record<Btn, boolean> = {} as any;
  touchDown: Record<Btn, boolean> = {} as any;
  latch: Record<Btn, boolean> = {} as any;
  taps: { x: number; y: number }[] = [];
  lastTouch = false;
  coarse = false;
  anyGesture = false;
  gestureCbs: (() => void)[] = [];
  constructor() { for (const b of BTNS) { this.down[b] = this.prev[b] = this.keyDown[b] = this.touchDown[b] = this.latch[b] = false; } }
  pressed(b: Btn): boolean { return this.down[b] && !this.prev[b]; }
  update(): void {
    for (const b of BTNS) { this.prev[b] = this.down[b]; this.down[b] = this.keyDown[b] || this.touchDown[b] || this.latch[b]; this.latch[b] = false; }
  }
  endFrame(): void { this.taps.length = 0; }
  gesture(): void {
    if (!this.anyGesture) { this.anyGesture = true; }
    for (const f of this.gestureCbs) f();
  }
}
export const input = new Input();

const KEYMAP: Record<string, Btn[]> = {
  ArrowLeft: ["left"], KeyA: ["left"], ArrowRight: ["right"], KeyD: ["right"],
  ArrowUp: ["up"], KeyW: ["up"], ArrowDown: ["down"], KeyS: ["down"],
  Space: ["jump"], Enter: ["hack", "confirm"], NumpadEnter: ["hack", "confirm"], KeyE: ["emp"],
  KeyF: ["fire"], KeyJ: ["fire"], Escape: ["pause", "back"], KeyP: ["pause"], Backspace: ["back"],
};

export function initInput(): void {
  input.coarse = matchMedia("(pointer: coarse)").matches;
  window.addEventListener("keydown", (e) => {
    const m = KEYMAP[e.code]; input.gesture();
    if (m) { for (const b of m) { if (!input.keyDown[b]) input.latch[b] = true; input.keyDown[b] = true; } e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => { const m = KEYMAP[e.code]; if (m) for (const b of m) input.keyDown[b] = false; });
  window.addEventListener("blur", () => { for (const b of BTNS) { input.keyDown[b] = false; input.touchDown[b] = false; } });
  view.canvas.addEventListener("pointerdown", (e) => {
    input.gesture();
    if (e.pointerType === "touch") input.lastTouch = true;
    const p = toLogical(e.clientX, e.clientY);
    input.taps.push(p);
  });
  buildTouch();
}

// ---------- touch controls ----------
let touchRoot: HTMLDivElement;
const btnEls: Partial<Record<string, HTMLDivElement>> = {};
function icon(kind: string, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = 16; c.height = 16;
  const x = c.getContext("2d")!; x.fillStyle = color;
  const px = (a: number, b: number, w = 1, h = 1) => x.fillRect(a, b, w, h);
  if (kind === "left" || kind === "right") {
    for (let i = 0; i < 6; i++) px(kind === "left" ? 4 + i : 11 - i, 8 - i, 1, i * 2 + 1);
    px(kind === "left" ? 9 : 3, 6, 4, 5);
  } else if (kind === "jump") {
    for (let i = 0; i < 6; i++) px(8 - i, 3 + i, i * 2 + 1, 1);
    px(5, 9, 7, 2); px(6, 12, 5, 2);
  } else if (kind === "fire") {
    px(2, 5, 11, 4); px(13, 6, 2, 2); px(3, 9, 4, 5); px(8, 9, 2, 2); x.fillStyle = "#ffffff"; px(10, 6, 2, 1);
  } else if (kind === "emp") {
    px(8, 1, 3, 1); px(7, 2, 3, 2); px(6, 4, 3, 2); px(5, 6, 7, 2); px(8, 8, 3, 2); px(7, 10, 3, 2); px(6, 12, 2, 2); px(5, 14, 2, 1);
  } else if (kind === "hack") {
    px(2, 2, 12, 9); x.clearRect(3, 3, 10, 7); px(4, 4, 3, 1); px(4, 6, 5, 1); px(4, 8, 2, 1); px(6, 11, 4, 2); px(4, 13, 8, 1);
  } else if (kind === "pause") {
    px(4, 3, 3, 10); px(9, 3, 3, 10);
  }
  return c;
}
interface TB { id: string; btn: Btn; cls: string; }
const LAYOUT: TB[] = [
  { id: "jump", btn: "jump", cls: "" }, { id: "fire", btn: "fire", cls: "mag" }, { id: "emp", btn: "emp", cls: "" },
  { id: "hack", btn: "hack", cls: "amb" }, { id: "pause", btn: "pause", cls: "" },
];
function buildTouch(): void {
  touchRoot = document.getElementById("touch") as HTMLDivElement;
  // left/right slide zone
  const pad = document.createElement("div");
  pad.className = "tbtn"; pad.style.background = "transparent"; pad.style.border = "none"; pad.style.boxShadow = "none";
  const l = document.createElement("div"); l.className = "tbtn"; l.appendChild(icon("left", "#48E6E0"));
  const r = document.createElement("div"); r.className = "tbtn"; r.appendChild(icon("right", "#48E6E0"));
  l.style.pointerEvents = r.style.pointerEvents = "none";
  pad.appendChild(l); pad.appendChild(r);
  touchRoot.appendChild(pad);
  btnEls["pad"] = pad; btnEls["left"] = l; btnEls["right"] = r;
  const padPointers = new Map<number, number>();
  const evalPad = () => {
    let L = false, R = false;
    const rect = pad.getBoundingClientRect();
    for (const x of padPointers.values()) { if (x < rect.left + rect.width / 2) L = true; else R = true; }
    input.touchDown.left = L; input.touchDown.right = R;
    l.classList.toggle("down", L); r.classList.toggle("down", R);
  };
  pad.addEventListener("pointerdown", (e) => { input.gesture(); input.lastTouch = true; pad.setPointerCapture(e.pointerId); padPointers.set(e.pointerId, e.clientX); evalPad(); e.preventDefault(); });
  pad.addEventListener("pointermove", (e) => { if (padPointers.has(e.pointerId)) { padPointers.set(e.pointerId, e.clientX); evalPad(); } });
  const up = (e: PointerEvent) => { padPointers.delete(e.pointerId); evalPad(); };
  pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
  for (const t of LAYOUT) {
    const el = document.createElement("div"); el.className = "tbtn " + t.cls;
    el.appendChild(icon(t.id, t.cls === "mag" ? "#FF4CA8" : t.cls === "amb" ? "#FFB44A" : "#48E6E0"));
    touchRoot.appendChild(el); btnEls[t.id] = el;
    const ids = new Set<number>();
    el.addEventListener("pointerdown", (e) => { input.gesture(); input.lastTouch = true; el.setPointerCapture(e.pointerId); ids.add(e.pointerId); input.touchDown[t.btn] = true; input.latch[t.btn] = true; if (t.btn === "hack" || t.btn === "jump") input.touchDown.confirm = true; el.classList.add("down"); e.preventDefault(); e.stopPropagation(); });
    const rel = (e: PointerEvent) => { ids.delete(e.pointerId); if (ids.size === 0) { input.touchDown[t.btn] = false; input.touchDown.confirm = false; el.classList.remove("down"); } };
    el.addEventListener("pointerup", rel); el.addEventListener("pointercancel", rel);
  }
  layoutTouch();
  view.onResize.push(layoutTouch);
}
function layoutTouch(): void {
  const W = window.innerWidth, H = window.innerHeight;
  const sc = view.screen;
  const sb = view.safe.bottom + 14, sl = view.safe.left + 12, sr = view.safe.right + 12;
  let u: number;
  if (view.portrait) { const below = H - (sc.y + sc.h) - sb - 16; u = Math.max(48, Math.min(92, below / 2.3, W * 0.2)); }
  else { const side = Math.max(sc.x - sl, W - sc.x - sc.w - sr); u = Math.max(46, Math.min(84, side / 2.4, H * 0.2)); }
  const set = (id: string, x: number, y: number, w: number, h: number, fromRight = false) => {
    const el = btnEls[id]!; el.style.width = w + "px"; el.style.height = h + "px";
    el.style.top = y + "px";
    if (fromRight) { el.style.right = x + "px"; el.style.left = ""; } else { el.style.left = x + "px"; el.style.right = ""; }
  };
  const padW = u * 2.3, padH = u * 1.05;
  set("pad", sl, H - sb - padH, padW, padH);
  const l = btnEls["left"]!, r = btnEls["right"]!;
  for (const [el, x] of [[l, 0], [r, padW - u * 1.1]] as [HTMLDivElement, number][]) {
    el.style.position = "absolute"; el.style.left = x + "px"; el.style.top = "0px"; el.style.width = u * 1.1 + "px"; el.style.height = padH + "px";
  }
  const j = u * 1.12;
  set("jump", sr, H - sb - j, j, j, true);
  set("fire", sr + j + 10, H - sb - u * 0.92, u * 0.92, u * 0.92, true);
  set("hack", sr + 4, H - sb - j - u * 0.9 - 10, u * 0.86, u * 0.86, true);
  set("emp", sr + j + 14, H - sb - u * 0.92 - u * 0.84 - 10, u * 0.84, u * 0.84, true);
  if (view.portrait) set("pause", sr, sc.y + sc.h + (view.fx.cabinet ? 54 : 12), 44, 44, true);
  else set("pause", sr, view.safe.top + 10, 44, 44, true);
}
export function setTouchVisible(on: boolean, opts?: { fire?: boolean }): void {
  if (!touchRoot) return;
  const show = on && (input.coarse || input.lastTouch);
  touchRoot.classList.toggle("on", show);
  if (opts && btnEls["fire"]) btnEls["fire"]!.classList.toggle("off", !opts.fire);
  if (!show) for (const b of BTNS) input.touchDown[b] = false;
}
