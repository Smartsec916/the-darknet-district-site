// World objects: platforms, elevators, doors, pickups, terminals, checkpoints and every hazard.
import { Plat, Body, overlap } from "./physics";
import { sfx } from "../engine/audio";
import { drawText } from "../engine/font";
import { drawGlow } from "./fx";
import { T } from "../world/level";
import type { World } from "./world";
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export abstract class Thing {
  id?: string; dead = false; x = 0; y = 0;
  update(_w: World, _dt: number): void {}
  draw(_c: Ctx, _w: World, _cx: number, _cy: number): void {}
  trigger(_w: World): void {}
  hazard = false;
}

// ---------------- platforms ----------------
export class MPlat extends Thing implements Plat {
  w: number; h = 6; dx = 0; dy = 0; oneWay = true; active = true;
  x0: number; y0: number; rx: number; ry: number; speed: number; t: number; skin: string;
  constructor(e: any) { super(); this.x0 = this.x = e.x; this.y0 = this.y = e.y; this.w = e.w * T; this.rx = (e.dx || 0) * T; this.ry = -(e.dy || 0) * T; this.speed = e.speed || 25; this.t = (e.phase || 0) * 2; this.skin = e.skin || "plat"; }
  override update(_w: World, dt: number): void {
    const len = Math.max(Math.abs(this.rx), Math.abs(this.ry), 1);
    this.t += (dt * this.speed) / len;
    const s = this.t % 2, p = s < 1 ? s : 2 - s, e = p * p * (3 - 2 * p);
    const nx = this.x0 + this.rx * e, ny = this.y0 + this.ry * e;
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy); const P = w.L.theme.tile;
    R(c, x, y, this.w, 2, P.hi); R(c, x, y + 2, this.w, 3, P.base); R(c, x, y + 5, this.w, 1, P.line);
    for (let i = 2; i < this.w - 2; i += 6) R(c, x + i, y + 3, 2, 1, w.L.theme.light);
    R(c, x + this.w / 2 - 3, y + 6, 6, 3, P.lo);
    if (this.ry) { R(c, x + this.w / 2 - 1, y - 200, 1, 200, "#2a2e36"); }
    if (this.skin === "lift") { R(c, x, y - 8, 1, 8, P.hi); R(c, x + this.w - 1, y - 8, 1, 8, P.hi); R(c, x, y - 8, this.w, 1, P.hi); }
  }
}

export class Collapse extends Thing implements Plat {
  w: number; h = 6; dx = 0; dy = 0; oneWay = true; active = true; x0: number; y0: number;
  st: "idle" | "shake" | "fall" | "gone" = "idle"; t = 0; vy = 0; respawn: number;
  constructor(e: any) { super(); this.x = this.x0 = e.x; this.y = this.y0 = e.y; this.w = e.w * T; this.respawn = e.respawn || 3.5; }
  onStand = (_b: Body) => { if (this.st === "idle") { this.st = "shake"; this.t = 0; sfx("rumble", 0.4); } };
  override update(w: World, dt: number): void {
    this.t += dt; this.dy = 0; this.dx = 0;
    if (this.st === "shake") { if (this.t > 0.5) { this.st = "fall"; this.t = 0; this.active = false; sfx("crash", 0.5); w.fx.debris(this.x + this.w / 2, this.y + 3, 6, w.L.theme.tile.base); } }
    else if (this.st === "fall") { this.vy += 600 * dt; this.y += this.vy * dt; if (this.t > 1.2) { this.st = "gone"; this.t = 0; } }
    else if (this.st === "gone" && this.t > this.respawn) {
      const p = w.player; if (!overlap(p.x - 5, p.y - 26, 10, 26, this.x0, this.y0 - 4, this.w, 10)) { this.st = "idle"; this.y = this.y0; this.vy = 0; this.active = true; w.fx.burst(this.x + this.w / 2, this.y, 6, "#48E6E0", 30, 0.4, 0); }
    }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    if (this.st === "gone") { if (this.t > this.respawn - 0.8) { c.globalAlpha = 0.3; R(c, this.x0 - cx, this.y0 - cy, this.w, 2, "#48E6E0"); c.globalAlpha = 1; } return; }
    const sh = this.st === "shake" ? (Math.random() - 0.5) * 2 : 0;
    const x = Math.round(this.x - cx + sh), y = Math.round(this.y - cy); const P = w.L.theme.tile;
    if (this.st === "fall") c.globalAlpha = Math.max(0, 1 - this.t);
    R(c, x, y, this.w, 2, P.hi); R(c, x, y + 2, this.w, 3, P.base);
    for (let i = 3; i < this.w; i += 7) R(c, x + i, y, 1, 5, P.line);
    R(c, x + 1, y + 5, this.w - 2, 1, "#FFB44A"); R(c, x + 4, y + 6, 2, 2, P.lo); R(c, x + this.w - 6, y + 6, 2, 2, P.lo);
    c.globalAlpha = 1;
  }
}

export class Hidden extends Thing implements Plat {
  w: number; h = 6; dx = 0; dy = 0; oneWay = true; active = false; fade = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.w = e.w * T; this.id = e.id; }
  override trigger(w: World): void { if (!this.active) { this.active = true; w.fx.burst(this.x + this.w / 2, this.y, 12, "#48E6E0", 40, 0.6, 0); } }
  override update(_w: World, dt: number): void { if (this.active) this.fade = Math.min(1, this.fade + dt * 2); }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (!this.active) { if (Math.random() < 0.02) { c.globalAlpha = 0.25; R(c, x, y, this.w, 1, "#48E6E0"); c.globalAlpha = 1; } return; }
    c.globalAlpha = this.fade * (0.75 + 0.15 * Math.sin(performance.now() / 150));
    R(c, x, y, this.w, 4, "rgba(72,230,224,0.35)"); R(c, x, y, this.w, 1, "#9ffaf4"); R(c, x, y + 3, this.w, 1, "#48E6E0");
    for (let i = 0; i < this.w; i += 3) R(c, x + i, y + 1, 1, 2, "#48E6E0");
    c.globalAlpha = 1;
  }
}

export class Door extends Thing implements Plat {
  w: number; h: number; dx = 0; dy = 0; oneWay = false; active = true; full: number; open = 0; opening = false; arena: boolean; bottom: number;
  constructor(e: any, arena = false) { super(); this.x = e.x; this.w = (e.w || 2) * T; this.full = this.h = e.h * T; this.bottom = e.y; this.y = e.y - this.h; this.id = e.id; this.arena = arena; if (e.open) { this.open = 1; this.h = 0; this.active = false; } }
  override trigger(w: World): void { if (!this.opening && this.open < 1) { this.opening = true; sfx("door"); w.fx.text(this.x + this.w / 2, this.y - 6, "UNLOCKED", "#48E6E0"); } }
  close(w: World): void { this.opening = false; this.open = 0; this.h = this.full; this.active = true; sfx("door"); w.fx.shake(2, 0.2); }
  override update(_w: World, dt: number): void {
    if (this.opening) { this.open = Math.min(1, this.open + dt * 1.2); this.h = this.full * (1 - this.open); if (this.open >= 1) { this.active = false; this.opening = false; } }
    this.y = this.bottom - this.full;
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 1, y - 2, this.w + 2, 2, "#22262e");
    if (this.h <= 0) return;
    R(c, x, y, this.w, this.h, "#30353f");
    for (let j = 0; j < this.h; j += 6) { R(c, x, y + j, this.w, 1, "#454b57"); R(c, x, y + j + 5, this.w, 1, "#1c1f25"); }
    R(c, x, y + this.h - 3, this.w, 3, "#FFB44A"); for (let i = 0; i < this.w; i += 4) R(c, x + i, y + this.h - 3, 2, 3, "#141414");
    const lc = this.arena ? "#F04455" : this.opening ? "#48E6E0" : "#F04455";
    R(c, x + this.w / 2 - 1, y + 4, 2, 2, lc);
  }
}

export class Elevator extends Thing implements Plat {
  w = 24; h = 6; dx = 0; dy = 0; oneWay = true; active = true;
  stops: number[]; cur = 0; target = -1; dir = 1; speed = 52; locked: boolean; fault: number | null; faulted = false; style: string; doors = 1; hum = 0; spark = 0;
  constructor(e: any) { super(); this.id = e.id; this.x = e.x; this.stops = (e.stops as number[]).map((u) => e.y - (u - e.stops[0]) * T); this.y = this.stops[0]; this.locked = !!e.locked; this.fault = e.fault != null ? e.y - (e.fault - e.stops[0]) * T : null; this.style = e.style || "freight"; }
  override trigger(w: World): void { this.locked = false; if (this.faulted) { this.faulted = false; this.fault = null; } w.fx.text(this.x + 12, this.y - 34, "LIFT ONLINE", "#48E6E0"); sfx("hackdone", 0.6); }
  riding(w: World): boolean { const p = w.player; return p.ground === this; }
  near(w: World): number {
    const p = w.player;
    if (Math.abs(p.x - (this.x + 12)) > 22) return -1;
    if (this.riding(w)) return -2;
    for (let i = 0; i < this.stops.length; i++) if (Math.abs(p.y - this.stops[i]) < 6) return i;
    return -1;
  }
  interact(w: World): boolean {
    const n = this.near(w); if (n === -1) return false;
    if (this.target >= 0) return true;
    if (this.locked) { w.fx.text(this.x + 12, this.y - 34, "LOCKED: FIND TERMINAL", "#F04455"); sfx("deny"); return true; }
    if (this.faulted) { w.fx.text(this.x + 12, this.y - 34, "NO POWER", "#F04455"); sfx("deny"); return true; }
    if (n === -2) {
      let nt = this.cur + this.dir; if (nt < 0 || nt >= this.stops.length) { this.dir *= -1; nt = this.cur + this.dir; }
      this.go(nt);
    } else if (n !== this.cur) this.go(n);
    else { w.fx.text(this.x + 12, this.y - 34, "STEP ON + HACK", "#FFB44A"); }
    return true;
  }
  go(i: number): void { this.target = i; this.dir = i > this.cur ? 1 : -1; sfx("elevator", 0.8); this.doors = 1; }
  override update(w: World, dt: number): void {
    this.dx = 0; this.dy = 0; this.spark -= dt;
    if (this.target >= 0) {
      this.doors = Math.max(0, this.doors - dt * 3);
      if (this.doors > 0) return;
      const ty = this.stops[this.target];
      const d = ty - this.y; const step = Math.sign(d) * Math.min(Math.abs(d), this.speed * dt);
      let ny = this.y + step;
      if (this.fault !== null && !this.faulted && ((this.y > this.fault && ny <= this.fault) || (this.y < this.fault && ny >= this.fault))) {
        ny = this.fault; this.faulted = true; this.target = -1; this.dy = ny - this.y; this.y = ny;
        const fi = this.stops.findIndex((s) => Math.abs(s - ny) < 1); if (fi >= 0) this.cur = fi;
        sfx("zap"); w.fx.sparks(this.x + 12, this.y - 28, 16); w.fx.shake(3, 0.3); w.fx.text(this.x + 12, this.y - 40, "POWER FAULT!", "#F04455");
        return;
      }
      this.dy = ny - this.y; this.y = ny; this.hum += dt;
      if (this.hum > 1.1) { this.hum = 0; sfx("elevator", 0.5); }
      if (Math.abs(ty - this.y) < 0.01) { this.cur = this.target; this.target = -1; sfx("ding", 0.7); }
    } else this.doors = Math.min(1, this.doors + dt * 3);
    if (this.style === "damaged" && Math.random() < dt * 0.8) { w.fx.sparks(this.x + Math.random() * 24, this.y - 28, 4); }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const st = this.style;
    const frame = st === "glass" ? "#7ad8e0" : st === "freight" ? "#c89a3a" : st === "exterior" ? "#8a94a6" : st === "damaged" ? "#7a5a4a" : "#5a606c";
    // cable
    R(c, x + 11, y - 400, 2, 372, "#1a1d24");
    if (st !== "maint") {
      R(c, x, y - 30, this.w, 2, frame); R(c, x, y - 30, 2, 30, frame); R(c, x + this.w - 2, y - 30, 2, 30, frame);
      if (st === "glass") { c.fillStyle = "rgba(120,220,240,0.12)"; c.fillRect(x + 2, y - 28, this.w - 4, 28); R(c, x + 4, y - 26, 1, 10, "rgba(220,255,255,0.4)"); }
      const dw = Math.round(9 * (1 - this.doors));
      if (dw > 0) { c.fillStyle = st === "glass" ? "rgba(120,220,240,0.35)" : frame; c.fillRect(x + 2, y - 28, dw, 28); c.fillRect(x + this.w - 2 - dw, y - 28, dw, 28); }
      const lit = this.locked || this.faulted ? "#F04455" : this.target >= 0 ? "#FFB44A" : "#48E6E0";
      R(c, x + 8, y - 36, 8, 5, "#05070C"); R(c, x + 9, y - 35, 6, 3, lit);
      if (this.target < 0 && !this.locked && !this.faulted) drawText(c, String(this.cur + 1), x + 10, y - 44, "#48E6E0", 1, "left", null);
    } else { R(c, x, y - 10, 1, 10, frame); R(c, x + this.w - 1, y - 10, 1, 10, frame); R(c, x, y - 10, this.w, 1, frame); }
    R(c, x, y, this.w, 2, "#9aa2b0"); R(c, x, y + 2, this.w, 4, "#3a404c");
    if (st === "freight") for (let i = 0; i < this.w; i += 4) R(c, x + i, y + 2, 2, 2, "#FFB44A");
    R(c, x + 2, y + 6, this.w - 4, 2, "#22262e");
    if (st === "damaged" && Math.random() < 0.1) R(c, x + 3, y - 29, this.w - 6, 1, "#FFB44A");
    // stop markers
    for (const sy of this.stops) { const yy = Math.round(sy - cy); R(c, x - 4, yy - 12, 3, 3, "#05070C"); R(c, x - 3, yy - 11, 1, 1, this.locked ? "#F04455" : "#48E6E0"); }
    void w;
  }
}

// ---------------- pickups & interactables ----------------
export class Pickup extends Thing {
  kind: string; t = Math.random() * 6; idx: number; taken = false;
  constructor(e: any, idx: number) { super(); this.x = e.x; this.y = e.y - (e.t === "shard" ? 0 : 4); this.kind = e.t; this.idx = e.idx ?? idx; }
  override update(w: World, dt: number): void {
    this.t += dt; if (this.taken) return;
    const p = w.player; if (p.state !== "play" && p.state !== "hack") return;
    if (Math.abs(p.x - this.x) < 9 && p.y > this.y - 6 && p.y - 26 < this.y + 6) { this.taken = true; this.dead = true; w.collect(this); }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), bob = Math.round(Math.sin(this.t * 3) * 1.5), y = Math.round(this.y - cy) + bob;
    if (this.kind === "btc") {
      const f = Math.floor(this.t * 8) % 4; const ww = [5, 3, 1, 3][f];
      R(c, x - ww / 2 - 0.5, y - 3, ww + 1, 6, "#b8741a"); R(c, x - ww / 2, y - 3, ww, 6, "#FFB44A"); if (ww >= 3) { R(c, x - 1, y - 2, 1, 4, "#7a4a0a"); R(c, x, y - 2, 1, 1, "#7a4a0a"); R(c, x, y, 1, 1, "#7a4a0a"); }
      R(c, x - 1, y - 3, 1, 1, "#fff0c0");
      drawGlow(c, x, y, 7, "#FFB44A", 0.35);
    } else if (this.kind === "shard") {
      const s = Math.sin(this.t * 2);
      drawGlow(c, x, y, 18, "#48E6E0", 0.5 + 0.2 * s);
      c.fillStyle = "#48E6E0"; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 4, y); c.lineTo(x, y + 7); c.lineTo(x - 4, y); c.closePath(); c.fill();
      c.fillStyle = "#d8ffff"; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 1.5, y); c.lineTo(x, y + 4); c.lineTo(x - 2, y); c.closePath(); c.fill();
      R(c, x - 6, y + 9, 12, 1, "#2a6a7a");
      if (Math.random() < 0.15) w.fx.p(this.x + (Math.random() - 0.5) * 10, this.y + 6, 0, -12, 0.8, "#48E6E0", 1, 0, true);
    } else if (this.kind === "medkit") {
      R(c, x - 5, y - 4, 10, 8, "#e8ecf4"); R(c, x - 1, y - 3, 2, 6, "#F04455"); R(c, x - 3, y - 1, 6, 2, "#F04455"); R(c, x - 5, y + 3, 10, 1, "#8a94a6");
      drawGlow(c, x, y, 10, "#F04455", 0.3);
    } else if (this.kind === "sidearm") {
      drawGlow(c, x, y, 22, "#FF4CA8", 0.5);
      R(c, x - 6, y - 3, 11, 3, "#2a2f3a"); R(c, x + 5, y - 2, 2, 1, "#16181e"); R(c, x - 5, y, 3, 4, "#1a1d24"); R(c, x - 1, y - 3, 2, 1, "#48E6E0"); R(c, x - 6, y - 4, 11, 1, "#5a606c");
      drawText(c, "SIDEARM", x, y - 16, "#FF4CA8", 1, "center");
    }
  }
}

export class Terminal extends Thing {
  links: string[]; label: string; done = false; mode: string; t = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.links = e.links || []; this.label = e.label || "TERMINAL"; this.mode = e.mode || "link"; }
  near(w: World): boolean { const p = w.player; return Math.abs(p.x - this.x) < 14 && Math.abs(p.y - this.y) < 10; }
  override update(_w: World, dt: number): void { this.t += dt; }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 6, y - 22, 12, 22, "#2a303c"); R(c, x - 6, y - 22, 12, 1, "#4a5266"); R(c, x - 7, y - 2, 14, 2, "#1a1e26");
    const sc = this.done ? "#48E6E0" : this.mode === "boss" ? "#F04455" : "#FFB44A";
    R(c, x - 4, y - 19, 8, 7, "#05070C"); R(c, x - 3, y - 18, 6, 5, sc + "55");
    if (!this.done) { R(c, x - 3, y - 18 + (Math.floor(this.t * 6) % 5), 6, 1, sc); }
    else { R(c, x - 2, y - 16, 1, 1, sc); R(c, x - 1, y - 15, 1, 1, sc); R(c, x, y - 16, 1, 1, sc); R(c, x + 1, y - 17, 1, 1, sc); }
    R(c, x - 4, y - 10, 8, 2, "#3a4252"); for (let i = 0; i < 4; i++) R(c, x - 4 + i * 2, y - 10, 1, 1, "#1a1e26");
    drawGlow(c, x, y - 15, 12, sc, 0.45);
    if (!this.done && this.near(w)) drawText(c, "HACK", x, y - 34 + Math.round(Math.sin(this.t * 5)), sc, 1, "center");
  }
}

export class Checkpoint extends Thing {
  on = false; t = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.id = e.id; }
  override update(w: World, dt: number): void { this.t += dt; const p = w.player; if (!this.on && p.state === "play" && Math.abs(p.x - this.x) < 10 && Math.abs(p.y - this.y) < 30) { this.on = true; w.checkpoint(this); } }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 1, y - 26, 3, 26, "#3a404c"); R(c, x - 4, y - 2, 9, 2, "#22262e");
    const col = this.on ? "#48E6E0" : "#F04455"; const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
    R(c, x - 3, y - 30, 7, 5, "#14181f"); R(c, x - 2, y - 29, 5, 3, col);
    drawGlow(c, x, y - 28, 14 + pulse * 6, col, 0.6);
    if (this.on) { c.globalAlpha = 0.25 * pulse; R(c, x - 6, y - 2, 13, 1, col); c.globalAlpha = 1; }
  }
}

export class Exit extends Thing {
  t = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; }
  override update(w: World, dt: number): void { this.t += dt; const p = w.player; if (p.state === "play" && Math.abs(p.x - this.x) < 12 && Math.abs(p.y - this.y) < 20) w.reachExit(); }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const open = w.exitOpen();
    for (let i = 0; i < 6; i++) { const yy = y - 50 + ((this.t * 30 + i * 9) % 50); c.globalAlpha = 0.5; R(c, x - 10, yy, 20, 1, open ? "#48E6E0" : "#F04455"); }
    c.globalAlpha = 1;
    drawGlow(c, x, y - 24, 34, open ? "#48E6E0" : "#F04455", 0.45);
  }
}

export class ShopKiosk extends Thing {
  t = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; }
  near(w: World): boolean { const p = w.player; return Math.abs(p.x - this.x) < 18 && Math.abs(p.y - this.y) < 10; }
  override update(_w: World, dt: number): void { this.t += dt; }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 8, y - 18, 16, 18, "#1a1e2a"); R(c, x - 8, y - 18, 16, 1, "#FF4CA8"); R(c, x - 6, y - 15, 12, 7, "#05070C");
    R(c, x - 5, y - 14, 10, 5, (Math.floor(this.t * 2) % 2) ? "#48E6E0" : "#2a8a8a"); R(c, x - 9, y - 1, 18, 1, "#48E6E0");
    drawGlow(c, x, y - 12, 16, "#FF4CA8", 0.5);
    if (this.near(w)) drawText(c, "SHOP: HACK", x, y - 30 + Math.round(Math.sin(this.t * 5)), "#FF4CA8", 1, "center");
  }
}

// ---------------- hazards ----------------
function cyc(t: number, period: number, on: number, warn: number): "idle" | "warn" | "on" {
  const m = ((t % period) + period) % period;
  if (m >= period - on) return "on";
  if (m >= period - on - warn) return "warn";
  return "idle";
}
abstract class Hazard extends Thing {
  override hazard = true; period: number; on: number; phase: number; disabledT = 0; off = false; last = "idle";
  constructor(e: any, period: number, on: number) { super(); this.x = e.x; this.y = e.y; this.id = e.id; this.period = e.period || period; this.on = e.on || on; this.phase = e.phase || 0; }
  state(w: World, warn: number): "idle" | "warn" | "on" { if (this.off || this.disabledT > 0) return "idle"; return cyc(w.time + this.phase, this.period, this.on, warn); }
  override trigger(_w: World): void { this.off = true; }
  abstract rect(): [number, number, number, number];
  emp(stun: number): void { this.disabledT = Math.max(this.disabledT, stun + 1.5); }
  tick(dt: number): void { this.disabledT -= dt; }
}

export class Steam extends Hazard {
  h: number; fire: boolean;
  constructor(e: any) { super(e, 2.8, 1.0); this.h = (e.h || 5) * T; this.fire = !!e.fire; }
  override rect(): [number, number, number, number] { return [this.x - 5, this.y - this.h, 10, this.h]; }
  override update(w: World, dt: number): void {
    const s = this.state(w, 0.8);
    if (s !== this.last) { if (s === "warn") w.sfxAt(this.fire ? "spark" : "hiss", this.x, this.y); if (s === "on") w.sfxAt(this.fire ? "zap" : "steam", this.x, this.y); this.last = s; }
    const col = this.fire ? "#FFB44A" : "rgba(220,230,240,0.55)";
    if (s === "warn" && Math.random() < dt * 20) w.fx.p(this.x + (Math.random() - 0.5) * 4, this.y - 2, 0, -25, 0.4, this.fire ? "#F04455" : "rgba(220,230,240,0.4)", 2, 0, false);
    if (s === "on") { for (let i = 0; i < 3; i++) w.fx.p(this.x + (Math.random() - 0.5) * 6, this.y - 2, (Math.random() - 0.5) * 20, -this.h * 2.2 * (0.6 + Math.random() * 0.5), 0.5, col, 3, 0, this.fire, 1.5); w.hurtRect(this.rect(), 15, this.x, "hazard"); }
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 6, y - 2, 12, 2, "#22262e"); for (let i = -5; i < 6; i += 2) R(c, x + i, y - 2, 1, 1, "#05070C");
    R(c, x - 7, y - 3, 14, 1, this.fire ? "#F04455" : "#FFB44A");
    if (this.fire) drawGlow(c, x, y - 4, 10, "#F04455", 0.4);
  }
}

export class Arc extends Hazard {
  len: number; vert: boolean;
  constructor(e: any) { super(e, 2.6, 0.9); this.vert = !!e.vert; this.len = (this.vert ? e.h : e.w) * T; }
  override rect(): [number, number, number, number] { return this.vert ? [this.x - 3, this.y - this.len, 6, this.len] : [this.x, this.y - 3, this.len, 6]; }
  override update(w: World, dt: number): void {
    this.tick(dt);
    const s = this.state(w, 0.7);
    if (s !== this.last) { if (s === "warn") w.sfxAt("spark", this.x, this.y); if (s === "on") w.sfxAt("zap", this.x, this.y); this.last = s; }
    if (s === "warn" && Math.random() < dt * 14) { const [ex, ey] = this.vert ? [this.x, this.y - (Math.random() < 0.5 ? 0 : this.len)] : [this.x + (Math.random() < 0.5 ? 0 : this.len), this.y]; w.fx.sparks(ex, ey, 2); }
    if (s === "on") { w.hurtRect(this.rect(), 18, this.x + (this.vert ? 0 : this.len / 2), "hazard"); w.fx.lights.push({ x: this.x + (this.vert ? 0 : this.len / 2), y: this.y - (this.vert ? this.len / 2 : 0), r: 50, a: 0.8 }); }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const s = this.state(w, 0.7);
    const post = (px: number, py: number) => { R(c, px - 2, py - 4, 4, 5, "#3a404c"); R(c, px - 1, py - 5, 2, 1, s === "idle" ? "#5a2a2a" : "#FFB44A"); };
    if (this.vert) { post(x, y); post(x, y - this.len + 5); } else { post(x, y); post(x + this.len, y); }
    if (s === "on") {
      c.strokeStyle = "#bff8ff"; c.lineWidth = 1; c.beginPath();
      const n = Math.max(3, Math.floor(this.len / 5));
      for (let i = 0; i <= n; i++) { const t = i / n; const j = i === 0 || i === n ? 0 : (Math.random() - 0.5) * 6; if (this.vert) c.lineTo(x + j, y - t * this.len); else c.lineTo(x + t * this.len, y + j); }
      c.stroke();
      drawGlow(c, this.vert ? x : x + this.len / 2, this.vert ? y - this.len / 2 : y, this.len / 2 + 10, "#48E6E0", 0.5);
    } else if (s === "warn") { c.globalAlpha = 0.35; if (this.vert) R(c, x, y - this.len, 1, this.len, "#48E6E0"); else R(c, x, y, this.len, 1, "#48E6E0"); c.globalAlpha = 1; }
  }
}

export class Laser extends Hazard {
  h: number;
  constructor(e: any) { super(e, 2.8, 1.0); this.h = e.h * T; }
  override rect(): [number, number, number, number] { return [this.x + 2, this.y - this.h, 4, this.h]; }
  override update(w: World, dt: number): void {
    this.tick(dt);
    const s = this.state(w, 0.55);
    if (s !== this.last) { if (s === "on" && Math.abs(w.player.x - this.x) < 160) w.sfxAt("laser", this.x, this.y); this.last = s; }
    if (s === "on") w.hurtRect(this.rect(), 20, this.x + 4, "hazard");
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx) + 4, y = Math.round(this.y - cy);
    const s = this.state(w, 0.55);
    R(c, x - 3, y - this.h, 6, 3, "#2a2e36"); R(c, x - 3, y - 2, 6, 2, "#2a2e36");
    R(c, x - 1, y - this.h + 3, 2, 1, this.off ? "#2a4a2a" : s === "idle" ? "#5a1a22" : "#F04455");
    if (s === "on") { R(c, x - 1, y - this.h + 3, 2, this.h - 5, "#F04455"); R(c, x, y - this.h + 3, 1, this.h - 5, "#ffd0d8"); drawGlow(c, x, y - this.h / 2, this.h / 2, "#F04455", 0.35); }
    else if (s === "warn") { for (let j = 3; j < this.h - 2; j += 4) R(c, x, y - this.h + j, 1, 2, "rgba(240,68,85,0.6)"); }
  }
}

export class Piston extends Hazard {
  w: number; travel: number; ext = 0; slammed = false;
  constructor(e: any) { super(e, 2.7, 1.0); this.w = e.w * T; this.travel = e.h * T; }
  override rect(): [number, number, number, number] { return [this.x + 1, this.y, this.w - 2, this.ext]; }
  override update(w: World, dt: number): void {
    const m = (((w.time + this.phase) % this.period) + this.period) % this.period;
    const P = this.period; const tw = P - 1.6;
    let ext = 0, vib = false;
    if (m < tw) { ext = 0; vib = m > tw - 0.6; }
    else if (m < tw + 0.12) ext = (m - tw) / 0.12;
    else if (m < tw + 0.6) ext = 1;
    else ext = Math.max(0, 1 - (m - tw - 0.6) / 1.0);
    if (vib && !this.slammed && m > tw - 0.6 && m < tw - 0.55) w.sfxAt("warn", this.x, this.y, 0.5);
    if (ext >= 1 && !this.slammed) { this.slammed = true; w.sfxAt("piston", this.x, this.y); if (Math.abs(w.player.x - this.x) < 120) w.fx.shake(2, 0.15); w.fx.smoke(this.x + this.w / 2, this.y + this.travel, 5); }
    if (ext < 0.5) this.slammed = false;
    this.ext = ext * this.travel; (this as any).vib = vib;
    if (ext > 0.3 && m >= tw && m < tw + 0.6) w.hurtRect(this.rect(), 30, this.x + this.w / 2, "hazard");
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const vib = (this as any).vib ? (Math.random() - 0.5) * 2 : 0;
    const x = Math.round(this.x - cx + vib), y = Math.round(this.y - cy);
    R(c, x + this.w / 2 - 3, y, 6, this.ext, "#8a94a6"); R(c, x + this.w / 2 - 1, y, 1, this.ext, "#c8d0dc");
    R(c, x, y + this.ext - 1, this.w, 6, "#4a505c"); R(c, x, y + this.ext - 1, this.w, 1, "#6a7280");
    for (let i = 0; i < this.w; i += 4) R(c, x + i, y + this.ext + 3, 2, 2, "#FFB44A");
    R(c, x - 1, y - 2, this.w + 2, 3, "#2a2e36");
  }
}

export class Rotor extends Hazard {
  len: number; speed: number; a = 0;
  constructor(e: any) { super(e, 1, 1); this.len = e.len || 26; this.speed = e.speed || 1.2; }
  override rect(): [number, number, number, number] { return [this.x - this.len, this.y - this.len, this.len * 2, this.len * 2]; }
  override update(w: World, dt: number): void {
    this.tick(dt);
    this.a += dt * this.speed * (this.disabledT > 0 ? 0.15 : 1);
    if (Math.random() < dt * 2) w.sfxAt("fan", this.x, this.y, 0.6);
    const p = w.player;
    for (let k = 0; k < 2; k++) {
      const a = this.a + k * Math.PI; const ex = this.x + Math.cos(a) * this.len, ey = this.y + Math.sin(a) * this.len;
      for (const py of [p.y - 4, p.y - 13, p.y - 22]) {
        const d = distSeg(p.x, py, this.x, this.y, ex, ey);
        if (d < 6) { w.player.hurt(w, 20, this.x, "hazard"); return; }
      }
    }
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    c.strokeStyle = "#22262e"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, this.len + 2, 0, Math.PI * 2); c.stroke();
    for (let k = 0; k < 2; k++) {
      const a = this.a + k * Math.PI;
      c.strokeStyle = "#5a6474"; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * this.len, y + Math.sin(a) * this.len); c.stroke();
      c.strokeStyle = "#FFB44A"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + Math.cos(a) * this.len * 0.6, y + Math.sin(a) * this.len * 0.6); c.lineTo(x + Math.cos(a) * this.len, y + Math.sin(a) * this.len); c.stroke();
    }
    R(c, x - 4, y - 4, 8, 8, "#3a404c"); R(c, x - 1, y - 1, 2, 2, "#F04455");
    R(c, x - 2, y + 4, 4, 200, "#1e2228");
  }
}
function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy; let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export class Debris extends Thing {
  override hazard = true; st: "wait" | "warn" | "fall" | "cool" = "wait"; t = 0; fy = 0; vy = 0; top: number;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y + 12 * T; this.top = e.y; }
  override update(w: World, dt: number): void {
    this.t += dt; const p = w.player;
    if (this.st === "wait" && Math.abs(p.x - this.x) < 56 && p.y > this.top) { this.st = "warn"; this.t = 0; w.sfxAt("rumble", this.x, this.y); }
    else if (this.st === "warn") { if (Math.random() < dt * 25) w.fx.p(this.x + (Math.random() - 0.5) * 14, this.top + 2, 0, 40, 0.6, "#8a7a6a", 1, 200); if (this.t > 0.9) { this.st = "fall"; this.fy = this.top; this.vy = 0; } }
    else if (this.st === "fall") {
      this.vy += 700 * dt; this.fy += this.vy * dt;
      w.hurtRect([this.x - 7, this.fy - 6, 14, 12], 18, this.x, "hazard");
      if (this.fy >= this.y - 6 || this.fy > w.L.H * T) { this.st = "cool"; this.t = 0; w.sfxAt("crash", this.x, this.y); w.fx.debris(this.x, this.y - 4, 12, "#6a5a50"); w.fx.shake(2, 0.2); }
    } else if (this.st === "cool" && this.t > 4) this.st = "wait";
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx);
    R(c, x - 9, Math.round(this.top - cy) - 3, 18, 3, "#3a3030");
    if (this.st === "warn") { const sh = (Math.random() - 0.5) * 2; R(c, x - 7 + sh, Math.round(this.top - cy), 14, 10, "#5a4a44"); R(c, x - 2, Math.round(this.y - cy) - 1, 4, 1, "#F04455"); }
    if (this.st === "fall") { const y = Math.round(this.fy - cy); R(c, x - 7, y - 6, 14, 12, "#5a4a44"); R(c, x - 7, y - 6, 14, 2, "#7a6a60"); R(c, x - 3, y, 4, 3, "#2a2020"); }
    if (this.st === "wait" || this.st === "cool") R(c, x - 7, Math.round(this.top - cy), 14, 3, "#4a3a34");
  }
}

export class ShockFloor extends Hazard {
  w: number; water: boolean;
  constructor(e: any) { super(e, 4, 1.2); this.w = e.w * T; this.water = !!e.water; }
  override rect(): [number, number, number, number] { return [this.x, this.y - 6, this.w, 6]; }
  override update(w: World, dt: number): void {
    this.tick(dt);
    const s = this.state(w, 0.8);
    const p = w.player; const inside = p.x > this.x && p.x < this.x + this.w && Math.abs(p.y - this.y) < 4;
    if (s !== this.last) { if (s === "warn" && Math.abs(p.x - this.x - this.w / 2) < this.w / 2 + 120) w.sfxAt("spark", p.x, this.y); if (s === "on" && Math.abs(p.x - this.x - this.w / 2) < this.w / 2 + 120) w.sfxAt("zap", p.x, this.y, 0.7); this.last = s; }
    if (s === "on") { if (inside) p.hurt(w, 18, p.x + 1, "hazard"); if (Math.random() < dt * 30) w.fx.sparks(this.x + Math.random() * this.w, this.y - 2, 1); w.fx.lights.push({ x: this.x + this.w / 2, y: this.y, r: this.w / 2, a: 0.4 }); }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const s = this.state(w, 0.8);
    if (this.water) {
      c.fillStyle = s === "on" ? "rgba(120,240,255,0.55)" : "rgba(40,110,160,0.5)"; c.fillRect(x, y - 10, this.w, 10);
      for (let i = 0; i < this.w; i += 6) R(c, x + i + Math.round(Math.sin(w.time * 2 + i) * 2), y - 10, 3, 1, s === "warn" ? "#FFB44A" : "#9ae6ff");
    } else {
      R(c, x, y - 2, this.w, 1, s === "idle" ? "#5a5048" : s === "warn" ? "#FFB44A" : "#bff8ff");
      R(c, x, y - 5, this.w, 1, s === "idle" ? "#3a3430" : s === "warn" ? "#b8741a" : "#48E6E0");
      for (let i = 4; i < this.w; i += 12) R(c, x + i, y - 6, 3, 6, "#2a2420");
    }
    if (s === "on") { c.strokeStyle = "#bff8ff"; c.beginPath(); for (let i = 0; i < this.w; i += 4) c.lineTo(x + i, y - 3 - Math.random() * 5); c.stroke(); }
  }
}

export class Train extends Thing {
  override hazard = true; x1: number; x2: number; period: number; phase: number; tx = -999; dir = 1; st = "idle"; len = 190; warnPlayed = false;
  constructor(e: any) { super(); this.x1 = e.x; this.x2 = e.x + e.span * T; this.y = e.y; this.period = e.period || 7; this.phase = e.phase || 0; }
  override update(w: World, dt: number): void {
    const m = (((w.time + this.phase) % this.period) + this.period) % this.period;
    const span = this.x2 - this.x1 + this.len * 2; const speed = 320; const runT = span / speed;
    const startT = this.period - runT;
    const cycleN = Math.floor((w.time + this.phase) / this.period); this.dir = cycleN % 2 ? -1 : 1;
    if (m < startT - 1.8) { this.st = "idle"; this.warnPlayed = false; this.tx = -999; }
    else if (m < startT) { this.st = "warn"; if (!this.warnPlayed) { this.warnPlayed = true; if (Math.abs(w.player.x - (this.x1 + this.x2) / 2) < 300) { w.sfxAt("horn", w.player.x, this.y); } } }
    else { if (this.st !== "run" && Math.abs(w.player.x - (this.x1 + this.x2) / 2) < 300) { w.sfxAt("train", w.player.x, this.y); w.fx.shake(2, 1); } this.st = "run"; const prog = (m - startT) * speed; this.tx = this.dir > 0 ? this.x1 - this.len + prog : this.x2 - prog; }
    if (this.st === "run") {
      const rx = Math.max(this.x1, this.tx), rw = Math.min(this.x2, this.tx + this.len) - rx;
      if (rw > 0) { const p = w.player; if (p.x > rx && p.x < rx + rw && p.y > this.y - 42 && p.y - 26 < this.y) { p.hurt(w, 35, p.x - this.dir * 10, "hazard"); p.vy = -300; p.vx = this.dir * 160; } }
    }
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const y = Math.round(this.y - cy);
    // tunnel mouths
    for (const mx of [this.x1, this.x2]) { const x = Math.round(mx - cx); R(c, x - 3, y - 44, 6, 44, "#0a0a0c"); }
    if (this.st === "warn") { const hx = this.dir > 0 ? this.x1 : this.x2; drawGlow(c, hx - cx, y - 18, 30 + Math.random() * 6, "#ffe8a0", 0.6); if (Math.floor(w.time * 6) % 2) R(c, Math.round(hx - cx) - 2, y - 52, 4, 4, "#F04455"); }
    if (this.st !== "run") return;
    c.save(); c.beginPath(); c.rect(Math.round(this.x1 - cx), y - 60, this.x2 - this.x1, 60); c.clip();
    const x = Math.round(this.tx - cx);
    R(c, x, y - 40, this.len, 38, "#6a7078"); R(c, x, y - 40, this.len, 3, "#9aa2aa"); R(c, x, y - 14, this.len, 4, "#b84030");
    for (let i = 8; i < this.len - 10; i += 22) { R(c, x + i, y - 34, 14, 12, "#1a2028"); R(c, x + i + 1, y - 33, 5, 10, "#ffe8a0"); }
    for (let i = 10; i < this.len; i += 46) { R(c, x + i, y - 4, 10, 4, "#14161a"); R(c, x + i + 26, y - 4, 10, 4, "#14161a"); }
    const front = this.dir > 0 ? x + this.len - 4 : x; R(c, front, y - 30, 4, 6, "#ffffff");
    c.restore();
    drawGlow(c, (this.dir > 0 ? this.tx + this.len : this.tx) - cx, y - 26, 40, "#ffe8a0", 0.6);
  }
}

export class Updraft extends Thing {
  w: number; h: number;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.w = e.w * T; this.h = e.h * T; }
  override update(w: World, dt: number): void {
    const p = w.player;
    if (p.x > this.x && p.x < this.x + this.w && p.y > this.y - this.h && p.y <= this.y + 1) { p.vy = Math.max(-210, p.vy - 1700 * dt); p.onGround = false; p.ground = null; p.airT = 1; }
    if (Math.random() < dt * 25) w.fx.p(this.x + Math.random() * this.w, this.y - 2, 0, -140, this.h / 140, "rgba(180,240,255,0.5)", 1, 0, false);
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 2, y - 3, this.w + 4, 3, "#2a3a44");
    for (let i = 0; i < this.w; i += 3) R(c, x + i, y - 3, 1, 3, (Math.floor(w.time * 20) + i) % 2 ? "#48E6E0" : "#14262c");
  }
}

export class Lamp extends Thing {
  col: string; t = Math.random() * 6;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.col = e.col || "#F04455"; }
  override update(w: World, dt: number): void { this.t += dt; w.fx.lights.push({ x: this.x, y: this.y, r: 44 + Math.sin(this.t * 3) * 8, a: 0.75 }); }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 3, y - 3, 6, 4, "#2a2e36"); R(c, x - 2, y + 1, 4, 2, this.col);
    drawGlow(c, x, y + 2, 24 + Math.sin(this.t * 3) * 4, this.col, 0.6);
  }
}
export class Sparker extends Thing {
  t = 2 + Math.random() * 3; flash = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; }
  override update(w: World, dt: number): void {
    this.t -= dt; this.flash -= dt;
    if (this.t <= 0) { this.t = 2 + Math.random() * 3.5; this.flash = 0.3; w.fx.sparks(this.x, this.y, 14); w.sfxAt("spark", this.x, this.y); }
    if (this.flash > 0) w.fx.lights.push({ x: this.x, y: this.y, r: 70, a: 1 });
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void { const x = Math.round(this.x - cx), y = Math.round(this.y - cy); R(c, x - 4, y - 3, 8, 6, "#2a2e36"); R(c, x - 3, y - 2, 6, 1, this.flash > 0 ? "#ffffff" : "#5a3a2a"); }
}

export class Camera extends Thing {
  a = 0; t = Math.random() * 6; seen = 0; cool = 0; disabledT = 0; off = false; range = 96;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.id = e.id; }
  override trigger(_w: World): void { this.off = true; }
  emp(stun: number): void { this.disabledT = stun + 2; }
  override update(w: World, dt: number): void {
    this.t += dt; this.cool -= dt; this.disabledT -= dt;
    if (this.off || this.disabledT > 0) { this.seen = 0; return; }
    this.a = Math.PI / 2 + Math.sin(this.t * 0.9) * 0.75;
    const p = w.player; const dx = p.x - this.x, dy = p.y - 13 - this.y; const d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    let da = Math.abs(ang - this.a); if (da > Math.PI) da = Math.PI * 2 - da;
    if (d < this.range && da < 0.28 && p.state === "play") { this.seen += dt; if (this.seen > 0.35 && this.cool <= 0) { this.cool = 8; w.alarm(this.x, this.y); } } else this.seen = Math.max(0, this.seen - dt);
  }
  override draw(c: Ctx, _w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    R(c, x - 1, y - 2, 2, 3, "#3a404c"); R(c, x - 4, y, 8, 4, "#4a505c");
    const on = !this.off && this.disabledT <= 0;
    R(c, x + Math.round(Math.cos(this.a) * 3) - 1, y + 3, 2, 2, on ? (this.seen > 0 ? "#ffffff" : "#F04455") : "#2a2e36");
    if (!on) return;
    c.globalAlpha = this.seen > 0 ? 0.32 : 0.16; c.fillStyle = this.seen > 0 ? "#F04455" : "#ff8a6a";
    c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x + Math.cos(this.a - 0.28) * this.range, y + 3 + Math.sin(this.a - 0.28) * this.range); c.lineTo(x + Math.cos(this.a + 0.28) * this.range, y + 3 + Math.sin(this.a + 0.28) * this.range); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }
}

export class Ambush extends Thing {
  count: number; fired = false; t = 0;
  constructor(e: any) { super(); this.x = e.x; this.y = e.y; this.count = e.count || 2; }
  override update(w: World, dt: number): void {
    if (!this.fired && w.player.x > this.x - 30 && Math.abs(w.player.y - this.y) < 60) { this.fired = true; this.t = 0; w.sfxAt("alarm", this.x, this.y); w.banner("! AMBUSH !", "#F04455", 1.2); }
    if (this.fired && this.t >= 0) { this.t += dt; if (this.t > 1.0) { this.t = -1; for (let i = 0; i < this.count; i++) w.spawnEnemy(w.pickGround(), this.x + (i - (this.count - 1) / 2) * 34, this.y - 110, true); } }
  }
}
