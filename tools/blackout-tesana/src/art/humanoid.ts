// Parametric pixel-art humanoids: one skeleton, many outfits, every animation posed procedurally.
import { C, PixBuf, dark, light, mix, flashCopy } from "./pix";
import { makeCanvas } from "../engine/view";

export interface Pose {
  lean: number; bob: number; hipF: number; kneeF: number; hipB: number; kneeB: number;
  shF: number; elF: number; shB: number; elB: number; rot: number; headFlip: boolean; headTilt: number;
  prop: string; glow: number; dx: number;
}
const P = (o: Partial<Pose>): Pose => ({ lean: 0.04, bob: 0, hipF: 0.06, kneeF: 0.05, hipB: -0.05, kneeB: 0.05, shF: 0.12, elF: 0.3, shB: -0.1, elB: 0.25, rot: 0, headFlip: false, headTilt: 0, prop: "", glow: 0, dx: 0, ...o });

export interface Style {
  kind: "human" | "robot";
  skin: string; hair: string; hairHi?: string; hairStyle: "short" | "long" | "bob" | "asym" | "hood" | "mohawk" | "none";
  jacket: string; jacketLen: number; shirt: string; pants: string; lower?: string; boots: string; bootH: number; platform?: boolean;
  glove: string; accent: string; accent2?: string; belt?: string; knee?: string; skirt?: string;
  seams?: boolean; collar?: boolean; mask?: string; goggles?: string; halo?: boolean; implant?: string; earring?: string;
  backpack?: string; plates?: string; weapon?: string; wrist?: string; female?: boolean; scale?: number;
  rim: string; rimTop: string; eye?: string; armored?: boolean; heavy?: boolean; dim?: boolean;
}
interface V { x: number; y: number }
const FW = 48, FH = 48, BASE = 46;

function skel(p: Pose, st: Style) {
  const k = st.scale || 1;
  const L1 = 6 * k, L2 = 6.5 * k, T = 9 * k, A1 = 5 * k, A2 = 5 * k;
  const leg = (h: number, kn: number) => {
    const knee = { x: Math.sin(h) * L1, y: Math.cos(h) * L1 };
    const a = h - kn; const foot = { x: knee.x + Math.sin(a) * L2, y: knee.y + Math.cos(a) * L2 };
    return { knee, foot, a };
  };
  const lf = leg(p.hipF, p.kneeF), lb = leg(p.hipB, p.kneeB);
  const low = Math.max(lf.foot.y, lb.foot.y) + 2 * k;
  const hip = { x: 24 + p.dx, y: BASE - low };
  const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
  const neck = { x: hip.x + Math.sin(p.lean) * T, y: hip.y - Math.cos(p.lean) * T + p.bob };
  const head = { x: neck.x + Math.sin(p.lean + p.headTilt) * 4 * k, y: neck.y - Math.cos(p.lean + p.headTilt) * 4 * k };
  const shF = { x: neck.x + 0.5, y: neck.y + 1.5 }, shB = { x: neck.x - 1, y: neck.y + 1.5 };
  const arm = (s: V, a: number, e: number) => { const el = { x: s.x + Math.sin(a) * A1, y: s.y + Math.cos(a) * A1 }; const h = { x: el.x + Math.sin(a + e) * A2, y: el.y + Math.cos(a + e) * A2 }; return { el, h, fa: a + e }; };
  const af = arm(shF, p.shF, p.elF), ab = arm(shB, p.shB, p.elB);
  const pts: Record<string, V> = {
    hip, neck, head, shF, shB, elF: af.el, hF: af.h, elB: ab.el, hB: ab.h,
    kF: add(hip, lf.knee), fF: add(hip, lf.foot), kB: add({ x: hip.x - 1, y: hip.y }, lb.knee), fB: add({ x: hip.x - 1, y: hip.y }, lb.foot),
  };
  if (p.rot) {
    const cx = 24, cy = BASE; const c = Math.cos(p.rot), s = Math.sin(p.rot);
    for (const key in pts) { const q = pts[key]; const dx = q.x - cx, dy = q.y - cy; pts[key] = { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c }; }
  }
  return { ...pts, faF: af.fa, faB: ab.fa, k, lean: p.lean + p.rot } as any;
}

function boot(b: PixBuf, foot: V, col: number, k: number, platform?: boolean): void {
  b.rect(Math.round(foot.x - 1.5 * k), Math.round(foot.y - 1), Math.round(4.5 * k), 2, col);
  b.rect(Math.round(foot.x - 1), Math.round(foot.y - 2), 3, 1, col);
  if (platform) b.rect(Math.round(foot.x - 1.5 * k), Math.round(foot.y + 1), Math.round(4.5 * k), 1, mix(col, C("#FF4CA8"), 0.5));
}

function drawHuman(b: PixBuf, s: any, st: Style, p: Pose): void {
  const k = s.k as number;
  const skin = C(st.skin), hair = C(st.hair), jacket = C(st.jacket), shirt = C(st.shirt), pants = C(st.pants);
  const lower = C(st.lower || st.pants), boots = C(st.boots), glove = C(st.glove), acc = C(st.accent);
  const tr = (st.female ? 2.7 : 3.2) * k, lr = (st.female ? 1.45 : 1.7) * k, gr = (st.female ? 1.75 : 2.0) * k;
  const fwd = { x: Math.cos(s.lean), y: Math.sin(s.lean) };
  // back hair
  if (st.hairStyle === "long") { b.seg(s.head.x - 2, s.head.y, s.neck.x - 2.5 * fwd.x - 1, s.neck.y + 6, 2.4 * k, hair, 1.6 * k); }
  if (st.backpack) b.seg(s.neck.x - tr - 0.5, s.neck.y + 2, s.hip.x - tr, s.hip.y - 3, 2.6 * k, C(st.backpack));
  // back arm & leg
  b.seg(s.shB.x, s.shB.y, s.elB.x, s.elB.y, lr, dark(jacket));
  b.seg(s.elB.x, s.elB.y, s.hB.x, s.hB.y, lr * 0.9, dark(st.jacketLen < 0.5 ? skin : jacket));
  b.disc(s.hB.x, s.hB.y, 1.2 * k, dark(glove));
  b.seg(s.hip.x - 1, s.hip.y, s.kB.x, s.kB.y, gr, dark(pants));
  b.seg(s.kB.x, s.kB.y, s.fB.x, s.fB.y, gr * 0.85, dark(lower));
  if (st.bootH > 0) b.seg(s.kB.x + (s.fB.x - s.kB.x) * (1 - st.bootH), s.kB.y + (s.fB.y - s.kB.y) * (1 - st.bootH), s.fB.x, s.fB.y - 1, gr * 0.95, dark(boots));
  boot(b, s.fB, dark(boots), k, st.platform);
  // torso
  b.disc(s.hip.x, s.hip.y - 0.5, gr + 0.6, pants);
  const tx = (t: number) => s.hip.x + (s.neck.x - s.hip.x) * t, ty = (t: number) => s.hip.y + (s.neck.y - s.hip.y) * t;
  b.seg(tx(0.05), ty(0.05), tx(0.95), ty(0.95), tr, shirt, tr + 0.2);
  const jl = 1 - st.jacketLen;
  b.seg(tx(jl), ty(jl), tx(0.98), ty(0.98), tr + 0.4, jacket, tr + 0.6);
  if (st.jacketLen > 0.5) b.seg(tx(0.2) + fwd.x * tr * 0.7, ty(0.2), tx(0.9) + fwd.x * tr * 0.7, ty(0.9), 0.7, shirt);
  if (st.seams) for (let t = 0.1; t < 0.95; t += 0.08) b.set(tx(t) - fwd.x * (tr - 0.2), ty(t), acc);
  if (st.plates) { b.disc(tx(0.7) + 1, ty(0.7), 2.2 * k, C(st.plates)); b.disc(s.shF.x, s.shF.y, 2.4 * k, C(st.plates)); }
  if (st.belt) { b.seg(tx(0.12) - tr, ty(0.12), tx(0.12) + tr, ty(0.12), 0.8, C(st.belt)); b.set(tx(0.12) + tr - 1, ty(0.12), acc); b.set(tx(0.12) - 1, ty(0.12) + 1, C(st.belt)); }
  if (st.skirt) b.seg(s.hip.x - 0.5, s.hip.y - 1, s.hip.x + 0.5, s.hip.y + 3.5 * k, 3.1 * k, C(st.skirt), 3.6 * k);
  if (st.collar) b.disc(s.neck.x - 0.6, s.neck.y + 0.3, 2.2 * k, jacket);
  // front leg
  b.seg(s.hip.x, s.hip.y, s.kF.x, s.kF.y, gr, pants);
  b.seg(s.kF.x, s.kF.y, s.fF.x, s.fF.y, gr * 0.85, lower);
  if (st.bootH > 0) b.seg(s.kF.x + (s.fF.x - s.kF.x) * (1 - st.bootH), s.kF.y + (s.fF.y - s.kF.y) * (1 - st.bootH), s.fF.x, s.fF.y - 1, gr * 0.95, boots);
  if (st.knee) b.disc(s.kF.x + 0.6, s.kF.y, 1.4 * k, C(st.knee));
  boot(b, s.fF, boots, k, st.platform);
  if (st.skirt) b.seg(s.hip.x, s.hip.y - 1, s.hip.x + 1, s.hip.y + 3.5 * k, 2.6 * k, light(C(st.skirt), 0.08), 3.2 * k);
  // head
  const hx = s.head.x, hy = s.head.y, hr = 3.4 * k; const f = p.headFlip ? -1 : 1;
  b.disc(hx, hy + 0.3, hr, skin);
  b.set(hx + f * 2.6, hy + 2.6, dark(skin, 0.3));
  if (st.hairStyle === "hood") {
    b.disc(hx - f * 0.8, hy - 0.6, hr + 1.1, C(st.jacket)); b.disc(hx + f * 1.4, hy + 0.6, 2.1 * k, dark(skin, 0.15));
  } else if (st.hairStyle !== "none") {
    const hr2 = st.hairStyle === "bob" ? hr + 0.6 : hr * 0.98;
    b.disc(hx - f * 1.0, hy - 1.1, hr2, hair);
    if (st.hairStyle === "bob") b.seg(hx - f * 1.5, hy, hx - f * 0.8, hy + 3.2, 2.0, hair);
    if (st.hairStyle === "asym") { b.seg(hx + f * 1.5, hy - 2.6, hx + f * 3.2, hy + 1, 0.9, hair); b.set(hx + f * 0.5, hy - 4, hair); }
    if (st.hairStyle === "mohawk") { b.seg(hx - f * 2, hy - 3.6, hx + f * 1.5, hy - 4.2, 1, hair); }
    if (st.hairStyle === "long") b.seg(hx - f * 2.5, hy - 1, hx - f * 3, hy + 3, 1.8, hair);
    if (st.hairHi) { b.set(hx - f * 1, hy - 3.5, C(st.hairHi)); b.set(hx - f * 2.5, hy - 2, C(st.hairHi)); b.set(hx - f * 3, hy + 1, C(st.hairHi)); }
  }
  const eye = C(st.eye || "#0c0d12");
  if (st.goggles) { b.rect(Math.round(hx + f * 1), Math.round(hy - 0.5), 3, 2, C(st.goggles)); b.set(hx - f * 2.4, hy, dark(C(st.goggles))); }
  else b.set(hx + f * 2.1, hy, eye);
  if (st.implant) b.set(hx + f * 2.6, hy - 0.8, C(st.implant));
  if (st.earring) b.set(hx - f * 0.5, hy + 1.2, C(st.earring));
  if (st.mask) b.rect(Math.round(hx - 0.5 + (f > 0 ? 0 : -2)), Math.round(hy + 1.2), 4, 2, C(st.mask));
  if (st.halo) for (let a = 0; a < 6.28; a += 0.3) { const px = hx - 0.5 + Math.cos(a) * 4.2, py = hy - 5.5 + Math.sin(a) * 1.2; if (Math.floor(a * 3) % 3 !== 0) b.set(px, py, C(st.accent2 || st.accent)); }
  // front arm
  b.seg(s.shF.x, s.shF.y, s.elF.x, s.elF.y, lr, st.jacketLen < 0.3 ? skin : jacket);
  b.seg(s.elF.x, s.elF.y, s.hF.x, s.hF.y, lr * 0.9, st.jacketLen < 0.5 ? skin : jacket);
  b.disc(s.hF.x, s.hF.y, 1.2 * k, glove);
  if (st.wrist) b.set(s.hF.x - Math.sin(s.faF) * 1.6, s.hF.y - Math.cos(s.faF) * 1.6, C(st.wrist));
  drawProp(b, s, st, p);
}

function drawProp(b: PixBuf, s: any, st: Style, p: Pose): void {
  const hx = s.hF.x, hy = s.hF.y, a = s.faF;
  const dx = Math.sin(a), dy = Math.cos(a);
  const w = p.prop || st.weapon || "";
  if (w === "pistol") {
    b.seg(hx, hy, hx + 5, hy - 0.5, 0.9, C("#2a2f3a")); b.rect(Math.round(hx), Math.round(hy), 2, 2, C("#1a1d24")); b.set(hx + 3, hy - 1, C("#48E6E0"));
    if (p.glow > 0) { b.disc(hx + 7, hy - 0.5, 1.6 + p.glow, C("#fff4c0")); b.disc(hx + 7, hy - 0.5, 0.8 + p.glow * 0.5, C("#ffffff")); }
  } else if (w === "emp") {
    b.rect(Math.round(hx - 1), Math.round(hy - 2), 3, 3, C("#2a3040")); b.set(hx, hy - 1, C("#48E6E0"));
    if (p.glow > 0) b.disc(hx, hy - 2, 1.5 + p.glow * 1.8, C("#9ffaf4"));
  } else if (w === "wrist") {
    b.disc(hx - dx * 1.5, hy - dy * 1.5, 1.2, C("#48E6E0")); if (p.glow > 0) b.set(hx + 2, hy - 2, C("#d8ffff"));
  } else if (w === "club") {
    b.seg(hx, hy, hx + dy * 0 + Math.sin(a + 1.9) * 8, hy + Math.cos(a + 1.9) * 8, 0.9, C("#7a4a2a"), 1.2);
  } else if (w === "baton") {
    const ex = hx + Math.sin(a + 1.9) * 8, ey = hy + Math.cos(a + 1.9) * 8;
    b.seg(hx, hy, ex, ey, 0.8, C("#2a2440")); b.disc(ex, ey, 1.2, C(st.accent)); b.set(ex, ey, C("#ffffff"));
  } else if (w === "knife") {
    b.seg(hx, hy, hx + Math.sin(a + 1.6) * 4, hy + Math.cos(a + 1.6) * 4, 0.6, C("#b8c8ff"));
  }
}

function drawRobot(b: PixBuf, s: any, st: Style, p: Pose, frame: number): void {
  const k = s.k as number;
  const m = C(st.jacket), md = dark(m, 0.4), plate = C(st.plates || st.jacket), joint = C(st.shirt), eye = C(st.eye || "#ff3040");
  const acc = C(st.accent);
  const lr = 2.1 * k, gr = 2.5 * k, tr = 4.4 * k;
  b.seg(s.shB.x, s.shB.y, s.elB.x, s.elB.y, lr, md); b.disc(s.elB.x, s.elB.y, 1.6 * k, dark(joint));
  b.seg(s.elB.x, s.elB.y, s.hB.x, s.hB.y, lr * 1.05, md); b.disc(s.hB.x, s.hB.y, 1.8 * k, dark(md));
  b.seg(s.hip.x - 1, s.hip.y, s.kB.x, s.kB.y, gr, md); b.disc(s.kB.x, s.kB.y, 1.7 * k, dark(joint));
  b.seg(s.kB.x, s.kB.y, s.fB.x, s.fB.y, gr * 0.9, md);
  b.rect(Math.round(s.fB.x - 2 * k), Math.round(s.fB.y - 1.5), Math.round(6 * k), 2, dark(md));
  // torso
  b.disc(s.hip.x, s.hip.y - 1, 2.8 * k, joint);
  const tx = (t: number) => s.hip.x + (s.neck.x - s.hip.x) * t, ty = (t: number) => s.hip.y + (s.neck.y - s.hip.y) * t;
  b.seg(tx(0.15), ty(0.15), tx(0.5), ty(0.5), 2.2 * k, joint);
  b.seg(tx(0.45), ty(0.45), tx(0.95), ty(0.95), tr * 0.9, m, tr);
  b.disc(tx(0.7) + 1.2, ty(0.7), 2.8 * k, plate);
  if (st.armored) { b.disc(tx(0.6) + 1.5, ty(0.6) + 1, 3 * k, light(plate, 0.1)); b.rect(Math.round(tx(0.7)) - 3, Math.round(ty(0.7)) + 1, 2, 2, C("#FFB44A")); }
  // cables/pistons
  b.line(tx(0.5) - 2, ty(0.5), s.hip.x - 2, s.hip.y - 1, C("#14161c"));
  // head
  const hx = Math.round(s.head.x), hy = Math.round(s.head.y);
  b.rect(hx - 3, hy - 3, 6, 6, m); b.rect(hx - 3, hy - 3, 6, 1, light(m, 0.15)); b.rect(hx + 1, hy - 1, 3, 2, C("#0a0b10"));
  b.set(hx + 2, hy - 1, eye); b.set(hx + 3, hy - 1, eye); if (!st.dim) b.set(hx + 3, hy, mix(eye, C("#000000"), 0.4));
  b.line(hx - 2, hy - 4, hx - 2, hy - 6, md); b.set(hx - 2, hy - 7, (frame % 2) ? acc : dark(acc));
  // front leg
  b.seg(s.hip.x, s.hip.y, s.kF.x, s.kF.y, gr, m); b.disc(s.kF.x + 0.5, s.kF.y, 1.9 * k, joint);
  b.line(s.hip.x + 1.5, s.hip.y, s.kF.x + 1.5, s.kF.y, light(m, 0.2));
  b.seg(s.kF.x, s.kF.y, s.fF.x, s.fF.y, gr * 0.9, plate);
  b.rect(Math.round(s.fF.x - 2 * k), Math.round(s.fF.y - 1.5), Math.round(6 * k), 2, md);
  // shoulder & front arm
  b.disc(s.shF.x - 0.5, s.shF.y, 3.3 * k, plate); b.set(s.shF.x - 1, s.shF.y - 2.5 * k, (frame % 3 === 0) ? C("#ffb44a") : dark(C("#ffb44a")));
  b.seg(s.shF.x, s.shF.y, s.elF.x, s.elF.y, lr, m); b.disc(s.elF.x, s.elF.y, 1.6 * k, joint);
  b.seg(s.elF.x, s.elF.y, s.hF.x, s.hF.y, lr * 1.1, plate); b.disc(s.hF.x, s.hF.y, 1.8 * k, md);
  if (st.weapon === "rifle") {
    const hx2 = s.hF.x, hy2 = s.hF.y;
    b.rect(Math.round(hx2 - 3), Math.round(hy2 - 2), 12, 3, C("#22262e")); b.rect(Math.round(hx2 + 9), Math.round(hy2 - 1), 3, 1, C("#16181e"));
    b.set(hx2 + 2, hy2 - 2, C("#ff3040")); b.rect(Math.round(hx2 - 2), Math.round(hy2 + 1), 3, 2, C("#ffb44a"));
    if (p.glow > 0) { b.disc(hx2 + 13, hy2 - 0.5, 1.5 + p.glow, C("#ffd0a0")); b.disc(hx2 + 13, hy2 - 0.5, 0.8 + p.glow * 0.4, C("#ffffff")); }
  }
}

// ---------- animations ----------
type AnimFn = (i: number, n: number) => Pose;
const TAU = Math.PI * 2;
const walkP = (amp: number, kneeA: number, lean: number, arm: number): AnimFn => (i, n) => {
  const t = (i / n) * TAU, s = Math.sin(t);
  return P({ lean, hipF: s * amp, hipB: -s * amp, kneeF: 0.1 + Math.max(0, Math.sin(t + 1.3)) * kneeA, kneeB: 0.1 + Math.max(0, Math.sin(t + 1.3 + Math.PI)) * kneeA, shF: -s * arm, shB: s * arm, elF: 0.3 + arm * 0.6, elB: 0.3 + arm * 0.6 });
};
export const ANIMS: Record<string, { n: number; fps: number; loop: boolean; f: AnimFn }> = {
  idle: { n: 4, fps: 4, loop: true, f: (i) => P({ bob: i === 1 || i === 2 ? 1 : 0, shF: 0.14 + (i === 2 ? 0.04 : 0) }) },
  walk: { n: 8, fps: 10, loop: true, f: walkP(0.45, 0.7, 0.06, 0.4) },
  run: { n: 8, fps: 14, loop: true, f: walkP(0.85, 1.4, 0.24, 0.9) },
  jump: { n: 2, fps: 8, loop: false, f: (i) => P({ lean: 0.1, hipF: 0.7 + i * 0.1, kneeF: 1.2, hipB: -0.25, kneeB: 0.7, shF: 2.4, elF: 0.4, shB: -0.9, elB: 0.6 }) },
  fall: { n: 2, fps: 6, loop: true, f: (i) => P({ lean: 0.05, hipF: 0.35, kneeF: 0.35, hipB: -0.35, kneeB: 0.6, shF: 1.9 + i * 0.15, elF: 0.3, shB: -1.5 - i * 0.15, elB: 0.4 }) },
  land: { n: 2, fps: 12, loop: false, f: (i) => P({ lean: 0.3 - i * 0.12, hipF: 1.0 - i * 0.4, kneeF: 1.8 - i * 0.7, hipB: 0.6 - i * 0.3, kneeB: 1.7 - i * 0.7, shF: 0.6, elF: 0.6, shB: 0.4, elB: 0.5 }) },
  hack: { n: 4, fps: 8, loop: true, f: (i) => P({ lean: 0.08, shF: 1.35, elF: 0.35 + (i % 2) * 0.1, shB: 1.0, elB: 1.4 + (i % 2) * 0.15, prop: "wrist", glow: i % 2 }) },
  emp: { n: 4, fps: 10, loop: false, f: (i) => P({ lean: -0.05, shF: 1.6 + i * 0.4, elF: 0.2, shB: -0.4, elB: 0.6, prop: "emp", glow: i }) },
  shoot: { n: 3, fps: 16, loop: false, f: (i) => P({ lean: 0.05 - (i === 1 ? 0.04 : 0), shF: 1.57 + (i === 1 ? 0.18 : 0), elF: 0, shB: 1.35, elB: 0.35, prop: "pistol", glow: i === 1 ? 1.4 : i === 0 ? 0.6 : 0 }) },
  aimrun: { n: 8, fps: 14, loop: true, f: (i, n) => { const p = walkP(0.85, 1.4, 0.2, 0.9)(i, n); p.shF = 1.57; p.elF = 0; p.prop = "pistol"; return p; } },
  hurt: { n: 2, fps: 10, loop: false, f: (i) => P({ lean: -0.3 - i * 0.05, shF: -0.6, elF: 1.1, shB: 0.9, elB: 0.8, hipF: 0.3, kneeF: 0.4, headTilt: -0.3 }) },
  death: { n: 7, fps: 9, loop: false, f: (i) => { const t = i / 6; return P({ lean: -0.2 * t, hipF: 0.5 + t * 0.6, kneeF: 0.6 + t * 1.6, hipB: 0.3 + t * 0.5, kneeB: 0.8 + t * 1.4, shF: 0.5 + t, elF: 0.8, shB: 0.6, elB: 0.6, rot: -Math.max(0, t - 0.35) * 2.2, headTilt: -0.4 * t }); } },
  victory: { n: 4, fps: 6, loop: true, f: (i) => P({ lean: -0.04, shF: 2.9 + (i % 2) * 0.08, elF: 0.15, shB: 0.5, elB: 1.8, bob: i === 1 ? -1 : 0, hipF: 0.15, hipB: -0.15 }) },
  look: { n: 4, fps: 2, loop: true, f: (i) => P({ headFlip: i === 1 || i === 2, headTilt: i === 2 ? -0.15 : 0, shF: 0.15, shB: -0.15 }) },
  react: { n: 3, fps: 8, loop: true, f: (i) => P({ lean: -0.18, shF: 2.2 + (i % 2) * 0.2, elF: 1.0, shB: 2.0, elB: 1.1, hipF: 0.2, kneeF: 0.3, headFlip: i === 1 }) },
  talk: { n: 4, fps: 5, loop: true, f: (i) => P({ shF: 0.7 + [0, 0.35, 0.15, 0.5][i], elF: 1.3, shB: -0.1, headTilt: i % 2 ? 0.08 : -0.05 }) },
  turn: { n: 2, fps: 10, loop: false, f: (i) => P({ headFlip: i === 0, shF: 0.0, shB: 0.0, hipF: 0, hipB: 0 }) },
  hide: { n: 2, fps: 4, loop: true, f: (i) => P({ lean: 0.5, hipF: 1.2, kneeF: 2.1, hipB: 0.9, kneeB: 2.2, shF: 2.6, elF: 1.6 + i * 0.1, shB: 2.4, elB: 1.7, headTilt: 0.4 }) },
  attack: { n: 4, fps: 10, loop: false, f: (i) => { const w = [-1.5, -2.2, 1.3, 1.6][i]; return P({ lean: [-0.05, -0.12, 0.25, 0.2][i], shF: w, elF: i < 2 ? 1.2 : 0.2, shB: -0.3, elB: 0.6, hipF: 0.3, kneeF: 0.3, hipB: -0.3, kneeB: 0.2 }); } },
  aim: { n: 2, fps: 4, loop: true, f: (i) => P({ lean: 0.02, shF: 1.5, elF: 0.05, shB: 1.25, elB: 0.4, hipF: 0.25, hipB: -0.25, bob: i }) },
  fire: { n: 2, fps: 12, loop: false, f: (i) => P({ lean: -0.04 * (1 - i), shF: 1.55 + (i ? 0 : 0.12), elF: 0.05, shB: 1.25, elB: 0.4, hipF: 0.25, hipB: -0.25, glow: i ? 0 : 1.5 }) },
  slam: { n: 4, fps: 8, loop: false, f: (i) => P({ lean: [0, -0.15, 0.3, 0.3][i], shF: [1, 3.0, 0.6, 0.6][i], shB: [1, 2.8, 0.5, 0.5][i], elF: 0.3, elB: 0.3, hipF: [0.2, 0, 0.9, 0.9][i], kneeF: [0.2, 0, 1.4, 1.4][i], hipB: [0.2, 0, 0.7, 0.7][i], kneeB: [0.2, 0, 1.5, 1.5][i] }) },
};

export interface Sheet { img: HTMLCanvasElement; flash: HTMLCanvasElement; anims: Record<string, { s: number; n: number; fps: number; loop: boolean }>; fw: number; fh: number }

export function buildSheet(st: Style, animNames: string[]): Sheet {
  let total = 0; for (const a of animNames) total += ANIMS[a].n;
  const [c, x] = makeCanvas(total * FW, FH);
  const anims: Sheet["anims"] = {};
  let fi = 0;
  const rim = C(st.rim), rimTop = C(st.rimTop), outline = C("#04060b");
  for (const a of animNames) {
    const A = ANIMS[a]; anims[a] = { s: fi, n: A.n, fps: A.fps, loop: A.loop };
    for (let i = 0; i < A.n; i++) {
      const pose = A.f(i, A.n);
      if (a === "shoot" || a === "aimrun") pose.prop = pose.prop || "pistol";
      if ((a === "attack") && st.weapon) pose.prop = st.weapon;
      const b = new PixBuf(FW, FH);
      const s = skel(pose, st);
      if (st.kind === "robot") drawRobot(b, s, st, pose, i); else drawHuman(b, s, st, pose);
      b.rim(rim, rimTop, st.dim ? 0.15 : 0.38, st.dim ? 0.1 : 0.22);
      b.outline(outline);
      b.put(x, fi * FW, 0);
      fi++;
    }
  }
  return { img: c, flash: flashCopy(c), anims, fw: FW, fh: FH };
}

export function frameOf(sh: Sheet, anim: string, t: number): number {
  const a = sh.anims[anim] || sh.anims["idle"];
  const i = Math.floor(t * a.fps);
  return a.s + (a.loop ? i % a.n : Math.min(a.n - 1, i));
}
export function animDone(sh: Sheet, anim: string, t: number): boolean { const a = sh.anims[anim]; return !a || t * a.fps >= a.n; }
/** Draw a sheet frame with feet at (x, y). */
export function drawSheet(ctx: CanvasRenderingContext2D, sh: Sheet, anim: string, t: number, x: number, y: number, flip: boolean, flash = false): void {
  const f = frameOf(sh, anim, t);
  const img = flash ? sh.flash : sh.img;
  const dx = Math.round(x - sh.fw / 2), dy = Math.round(y - BASE);
  if (flip) {
    ctx.save(); ctx.translate(dx + sh.fw, dy); ctx.scale(-1, 1);
    ctx.drawImage(img, f * sh.fw, 0, sh.fw, sh.fh, 0, 0, sh.fw, sh.fh); ctx.restore();
  } else ctx.drawImage(img, f * sh.fw, 0, sh.fw, sh.fh, dx, dy, sh.fw, sh.fh);
}

// ---------- the cast ----------
const RIM = "#FF4CA8", TOP = "#48E6E0";
export const STYLES: Record<string, Style> = {
  player: { kind: "human", skin: "#c8987a", hair: "#16161e", hairStyle: "short", jacket: "#2c313b", jacketLen: 1, shirt: "#101218", pants: "#121319", boots: "#0b0c10", bootH: 0.35, glove: "#23262d", accent: "#48E6E0", belt: "#3b3128", knee: "#3c4454", seams: true, collar: true, implant: "#48E6E0", wrist: "#48E6E0", rim: RIM, rimTop: TOP },
  npcA: { kind: "human", female: true, skin: "#d6a888", hair: "#1c1426", hairHi: "#8a46d8", hairStyle: "long", jacket: "#15151c", jacketLen: 0.55, shirt: "#ff4ca8", pants: "#20142a", lower: "#2a1a36", boots: "#0b0b10", bootH: 0.25, glove: "#d6a888", accent: "#FF4CA8", belt: "#FF4CA8", wrist: "#ff7ac4", rim: "#ff4ca8", rimTop: "#c48cff" },
  npcB: { kind: "human", female: true, skin: "#e2b89a", hair: "#dfe3ee", hairHi: "#9ff2ff", hairStyle: "bob", jacket: "#2c2646", jacketLen: 0.5, shirt: "#1d1a2a", pants: "#191623", skirt: "#221c34", lower: "#d0a084", boots: "#0b0b12", bootH: 0.7, glove: "#e2b89a", accent: "#48E6E0", earring: "#48E6E0", belt: "#FF4CA8", wrist: "#FF4CA8", rim: "#48E6E0", rimTop: "#ff8acb" },
  npcC: { kind: "human", female: true, skin: "#a87458", hair: "#2fb8aa", hairStyle: "asym", jacket: "#3b4139", jacketLen: 0.9, shirt: "#22252a", pants: "#5b616b", boots: "#2a2522", bootH: 0.4, glove: "#2b2b2b", accent: "#FFB44A", belt: "#6a5030", knee: "#4a4f56", wrist: "#48E6E0", rim: "#FFB44A", rimTop: "#48E6E0" },
  npcD: { kind: "human", female: true, skin: "#e8c0a4", hair: "#8e1e2c", hairHi: "#d8405a", hairStyle: "long", jacket: "#3e2f8c", jacketLen: 0.75, shirt: "#141020", pants: "#16121e", boots: "#1e1c28", bootH: 0.3, platform: true, glove: "#e8c0a4", accent: "#FFB44A", earring: "#FFB44A", wrist: "#FFB44A", rim: "#6828B8", rimTop: "#ff7ac4" },
  rat: { kind: "human", skin: "#9a7058", hair: "#3a2a20", hairStyle: "mohawk", jacket: "#4b3427", jacketLen: 1, shirt: "#2a2622", pants: "#2b2b30", boots: "#3a2a1e", bootH: 0.45, glove: "#2a221c", accent: "#FFB44A", plates: "#9a4a22", mask: "#5a3a2a", goggles: "#FFB44A", weapon: "club", belt: "#5a3a2a", knee: "#7a3a1a", rim: "#F04455", rimTop: "#FFB44A" },
  saint: { kind: "human", skin: "#b898a8", hair: "#1c1430", hairStyle: "hood", jacket: "#1e1534", jacketLen: 1, shirt: "#3a2266", pants: "#140f22", boots: "#0b0a12", bootH: 0.4, glove: "#c8ccd8", accent: "#48E6E0", accent2: "#b070ff", plates: "#c8ccd8", mask: "#d8dce8", halo: true, weapon: "baton", eye: "#48E6E0", rim: "#b070ff", rimTop: "#48E6E0" },
  thief: { kind: "human", skin: "#a07a66", hair: "#191c2a", hairStyle: "hood", jacket: "#191c2c", jacketLen: 1, shirt: "#2a2050", pants: "#151826", boots: "#0c0d14", bootH: 0.2, glove: "#1a1a22", accent: "#6a4ad0", mask: "#22243a", backpack: "#2c2440", eye: "#9a7aff", weapon: "knife", female: true, rim: "#6a4ad0", rimTop: "#4a7aff" },
  bot: { kind: "robot", skin: "#000000", hair: "#000000", hairStyle: "none", jacket: "#6b7487", jacketLen: 1, shirt: "#2c313c", pants: "#000000", boots: "#000000", bootH: 0, glove: "#000000", accent: "#F04455", plates: "#8a93a6", eye: "#ff3040", rim: "#F04455", rimTop: "#9ab0d0", scale: 1.08 },
  armed: { kind: "robot", skin: "#000000", hair: "#000000", hairStyle: "none", jacket: "#3e444f", jacketLen: 1, shirt: "#22262e", pants: "#000000", boots: "#000000", bootH: 0, glove: "#000000", accent: "#FFB44A", plates: "#5a6170", eye: "#ff2a3a", armored: true, weapon: "rifle", rim: "#F04455", rimTop: "#7a8aa0", scale: 1.1 },
  heavy: { kind: "robot", skin: "#000000", hair: "#000000", hairStyle: "none", jacket: "#565c68", jacketLen: 1, shirt: "#2a2d34", pants: "#000000", boots: "#000000", bootH: 0, glove: "#000000", accent: "#F04455", plates: "#9a7a3a", eye: "#ff5020", armored: true, heavy: true, rim: "#FFB44A", rimTop: "#c0c8d8", scale: 1.38 },
  stealth: { kind: "robot", skin: "#000000", hair: "#000000", hairStyle: "none", jacket: "#1b1e26", jacketLen: 1, shirt: "#101217", pants: "#000000", boots: "#000000", bootH: 0, glove: "#000000", accent: "#5a1018", plates: "#252a34", eye: "#a01828", dim: true, rim: "#3a2a5a", rimTop: "#2a3a4a", scale: 1.05 },
};
export const SHEETS: Record<string, Sheet> = {};
export function buildCast(): void {
  SHEETS.player = buildSheet(STYLES.player, ["idle", "walk", "run", "jump", "fall", "land", "hack", "emp", "shoot", "aimrun", "hurt", "death", "victory"]);
  for (const n of ["npcA", "npcB", "npcC", "npcD"]) SHEETS[n] = buildSheet(STYLES[n], ["idle", "walk", "run", "look", "react", "talk", "turn", "hide"]);
  for (const n of ["rat", "saint", "thief"]) SHEETS[n] = buildSheet(STYLES[n], ["idle", "walk", "run", "attack", "hurt", "death"]);
  for (const n of ["bot", "heavy", "stealth"]) SHEETS[n] = buildSheet(STYLES[n], ["idle", "walk", "run", "attack", "slam", "hurt", "death"]);
  SHEETS.armed = buildSheet(STYLES.armed, ["idle", "walk", "run", "aim", "fire", "hurt", "death"]);
}
