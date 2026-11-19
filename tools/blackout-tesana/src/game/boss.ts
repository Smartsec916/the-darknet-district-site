// Boss machines: the WARDEN security mech (Sector 06 / 10) and the OVERSEER core (Sector 12).
import { sfx } from "../engine/audio";
import { drawGlow } from "./fx";
import { moveBody, Plat, Body } from "./physics";
import type { World } from "./world";
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export abstract class Boss {
  x: number; y: number; hp: number; max: number; name: string; awake = false; dead = false; deadT = 0; flash = 0; stun = 0; stunCool = 0; t = 0;
  constructor(x: number, y: number, hp: number, name: string) { this.x = x; this.y = y; this.hp = this.max = hp; this.name = name; }
  abstract update(w: World, dt: number): void;
  abstract draw(c: Ctx, w: World, cx: number, cy: number): void;
  abstract hitTest(x: number, y: number): boolean;
  damage(w: World, d: number): void { if (this.dead || !this.awake) return; this.hp -= d; this.flash = 0.08; sfx("hit", 0.6); if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 0; w.bossDefeated(this); } }
  emp(_w: World): void { if (this.stunCool > 0 || this.dead) return; this.stun = 2.2; this.stunCool = 7; }
  nodeHacked(_w: World): void {}
  shielded(): boolean { return false; }
  explodeTick(w: World, dt: number, cx: number, cy: number, r: number): void {
    this.deadT += dt;
    if (this.deadT < 2.2 && Math.random() < dt * 14) { const ex = cx + (Math.random() - 0.5) * r * 2, ey = cy + (Math.random() - 0.5) * r * 2; w.fx.burst(ex, ey, 10, Math.random() < 0.5 ? "#FFB44A" : "#F04455", 80, 0.5, 60); w.fx.lights.push({ x: ex, y: ey, r: 60, a: 1 }); sfx("explode", 0.5); w.fx.shake(3, 0.2); }
  }
}

export class Warden extends Boss implements Body {
  w = 30; h = 46; vx = 0; vy = 0; onGround = false; ground: Plat | null = null; hitWall = 0; hitHead = false;
  st = "idle"; face = -1; mk2: boolean; step = 0; vent = 0; attacks = 0;
  constructor(x: number, y: number, mk2: boolean) { super(x, y, mk2 ? 64 : 42, mk2 ? "WARDEN MK-II" : "WARDEN-6"); this.mk2 = mk2; }
  override hitTest(x: number, y: number): boolean { return Math.abs(x - this.x) < this.w / 2 && y > this.y - this.h && y < this.y; }
  override damage(w: World, d: number): void { super.damage(w, this.vent > 0 || this.stun > 0 ? d * 2 : d); }
  override update(w: World, dt: number): void {
    this.t += dt; this.flash -= dt; this.stunCool -= dt; this.vent -= dt;
    const p = w.player; const dx = p.x - this.x;
    if (this.dead) { this.explodeTick(w, dt, this.x, this.y - 24, 22); return; }
    if (!this.awake) return;
    const rage = this.hp < this.max * 0.5 ? 1 : 0; const sp = (this.mk2 ? 1.25 : 1) * (1 + rage * 0.3);
    if (this.stun > 0) { this.stun -= dt; this.vx = 0; if (Math.random() < dt * 10) w.fx.sparks(this.x + (Math.random() - 0.5) * 24, this.y - Math.random() * 40, 3); }
    else switch (this.st) {
      case "idle": this.st = "walk"; this.step = 0; break;
      case "walk":
        this.face = dx > 0 ? 1 : -1; this.vx = this.face * 34 * sp; this.step += dt;
        if (Math.floor(this.t * 2.4) !== Math.floor((this.t - dt) * 2.4)) { sfx("piston", 0.35); w.fx.shake(1, 0.1); }
        if (this.step > 1.4 / sp) { this.vx = 0; this.attacks++; const k = this.attacks % (this.mk2 ? 4 : 3); this.st = k === 0 ? "summon" : k === 1 ? "stompW" : k === 2 ? "volleyW" : "dashW"; this.step = 0; sfx("warn"); }
        break;
      case "stompW": this.vx = 0; this.step += dt; if (this.step > 0.9 / sp) { this.st = "stomp"; this.step = 0; this.vy = -300; } break;
      case "stomp": this.step += dt; if (this.onGround && this.step > 0.15) { w.fx.shake(6, 0.4); sfx("piston"); w.enemyShot(this.x - 16, this.y - 1, -150 * sp, 0, 20, "wave"); w.enemyShot(this.x + 16, this.y - 1, 150 * sp, 0, 20, "wave"); if (rage) { w.enemyShot(this.x - 16, this.y - 1, -95, 0, 20, "wave"); w.enemyShot(this.x + 16, this.y - 1, 95, 0, 20, "wave"); } this.st = "walk"; this.step = -0.4; } break;
      case "volleyW": this.vx = 0; this.face = dx > 0 ? 1 : -1; this.step += dt; if (this.step > 0.8 / sp) { this.st = "volley"; this.step = 0; } break;
      case "volley": {
        const n = 3 + rage * 2 + (this.mk2 ? 1 : 0);
        for (let i = 0; i < n; i++) { const a = Math.atan2(p.y - 14 - (this.y - 38), dx) + (i - (n - 1) / 2) * 0.16; w.enemyShot(this.x + this.face * 14, this.y - 38, Math.cos(a) * 140, Math.sin(a) * 140, 12); }
        sfx("eshoot"); this.st = "walk"; this.step = 0; this.vent = 1.8; sfx("steam", 0.6); break;
      }
      case "summon": this.vx = 0; this.step += dt; if (this.step > 0.6) { if (w.aliveEnemies() < 4) { w.spawnEnemy(this.mk2 ? "fast" : "drone", this.x - 40, this.y - 70, false); w.spawnEnemy("drone", this.x + 40, this.y - 70, false); } this.st = "walk"; this.step = 0; } break;
      case "dashW": this.vx = 0; this.face = dx > 0 ? 1 : -1; this.step += dt; if (Math.random() < dt * 20) w.fx.smoke(this.x - this.face * 10, this.y, 1); if (this.step > 0.85) { this.st = "dash"; this.step = 0; sfx("alarm", 0.6); } break;
      case "dash": this.vx = this.face * 200; this.step += dt; if (this.hitWall || this.step > 1.2) { this.st = "walk"; this.step = -0.6; this.vx = 0; w.fx.shake(4, 0.3); this.vent = 1.2; } break;
    }
    this.vy = Math.min(this.vy + 900 * dt, 500);
    moveBody(w.L, this, dt, w.solidPlats);
    // contact
    if (Math.abs(dx) < this.w / 2 + 4 && p.y > this.y - this.h && p.y - p.h < this.y && this.stun <= 0) {
      if (p.vy > 30 && p.y - (this.y - this.h) < 10) { this.damage(w, 1); p.vy = -280; }
      else p.hurt(w, this.st === "dash" ? 26 : 16, this.x, "hit");
    }
    if (this.vent > 0 && Math.random() < dt * 20) w.fx.p(this.x - this.face * 10, this.y - 36, -this.face * 20, -30, 0.6, "rgba(220,230,240,0.5)", 2, 0, false, 1);
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy); const f = this.face;
    if (this.dead && this.deadT > 2.2) { R(c, x - 18, y - 10, 36, 10, "#2a2e36"); R(c, x - 12, y - 14, 20, 4, "#3a404c"); return; }
    const fl = this.flash > 0; const m = fl ? "#ffffff" : this.mk2 ? "#3e444f" : "#59606e", md = fl ? "#ffffff" : this.mk2 ? "#262a32" : "#3a404c", pl = fl ? "#ffffff" : this.mk2 ? "#7a2a30" : "#8a93a6";
    const bob = this.st === "walk" ? Math.round(Math.abs(Math.sin(this.t * 7.5)) * 2) : this.st === "stompW" ? 3 : 0;
    const legA = this.st === "walk" ? Math.sin(this.t * 7.5) * 5 : 0;
    // legs
    R(c, x - 12 + legA, y - 18, 8, 18, md); R(c, x - 14 + legA, y - 3, 12, 3, md);
    R(c, x + 4 - legA, y - 18, 8, 18, m); R(c, x + 2 - legA, y - 3, 12, 3, md); R(c, x + 6 - legA, y - 16, 2, 12, "#c8d0dc");
    // torso
    const ty = y - 44 + bob;
    R(c, x - 15, ty, 30, 26, m); R(c, x - 15, ty, 30, 2, pl); R(c, x - 13, ty + 22, 26, 4, md);
    for (let i = 0; i < 4; i++) R(c, x - 12 + i * 7, ty + 18, 4, 2, "#FFB44A");
    // core
    const coreC = this.vent > 0 || this.stun > 0 ? "#48E6E0" : "#F04455";
    R(c, x - 5, ty + 7, 10, 9, "#05070C"); R(c, x - 3, ty + 9, 6, 5, coreC); drawGlow(c, x, ty + 11, this.vent > 0 ? 22 : 12, coreC, 0.8);
    // shoulders + cannon
    R(c, x - 20, ty + 1, 8, 9, pl); R(c, x + 12, ty + 1, 8, 9, pl);
    R(c, x + (f > 0 ? 14 : -26), ty + 6, 12, 5, "#22262e"); R(c, x + (f > 0 ? 24 : -28), ty + 7, 4, 3, "#16181e");
    if (this.st === "volleyW") drawGlow(c, x + f * 26, ty + 8, 8 + this.step * 14, "#F04455", 0.9);
    // head
    R(c, x - 7, ty - 9, 14, 9, m); R(c, x - 7, ty - 9, 14, 1, pl); R(c, x - 5 + (f > 0 ? 3 : 0), ty - 6, 7, 3, "#05070C");
    R(c, x - 4 + (f > 0 ? 4 : 0), ty - 5, 4, 1, this.stun > 0 ? "#48E6E0" : "#ff3040"); drawGlow(c, x + f * 2, ty - 5, 9, "#ff3040", 0.7);
    R(c, x - 1, ty - 15, 2, 6, md); R(c, x - 1, ty - 16, 2, 1, Math.floor(this.t * 4) % 2 ? "#F04455" : "#5a1a1a");
    if (this.st === "stompW" || this.st === "dashW") { R(c, x - 1, ty - 26, 2, 6, "#F04455"); R(c, x - 1, ty - 19, 2, 2, "#F04455"); }
    void w;
  }
}

export class Overseer extends Boss {
  shields = 3; phase = 1; st = "idle"; step = 0; atk = 0; laserY = 0; laserOn = 0; cols: number[] = []; colT = 0; floorT = 0; floorOn = 0; eyeA = 0; baseY: number; arenaX0 = 0; arenaX1 = 0; floorY = 0;
  constructor(x: number, y: number) { super(x, y, 70, "THE OVERSEER"); this.baseY = y; }
  override shielded(): boolean { return this.shields > 0; }
  override hitTest(x: number, y: number): boolean { return Math.hypot(x - this.x, y - this.y) < 18; }
  override damage(w: World, d: number): void { if (this.shields > 0) { w.fx.text(this.x, this.y - 30, "SHIELDED - HACK NODES", "#48E6E0"); sfx("shield", 0.4); return; } super.damage(w, this.stun > 0 ? d * 2 : d); }
  override nodeHacked(w: World): void {
    if (this.shields <= 0) return;
    this.shields--; sfx("boss"); w.fx.shake(5, 0.5); w.fx.ring(this.x, this.y, 60, "#48E6E0");
    w.banner(this.shields > 0 ? `SHIELD NODE DOWN  ${3 - this.shields}/3` : "SHIELD DOWN! SHOOT THE EYE", "#48E6E0", 2);
    if (this.shields === 0) this.phase = 2;
  }
  override update(w: World, dt: number): void {
    this.t += dt; this.flash -= dt; this.stunCool -= dt;
    const p = w.player;
    if (this.dead) { this.explodeTick(w, dt, this.x, this.y, 40); return; }
    if (!this.awake) return;
    if (this.phase === 2 && this.hp < this.max * 0.5) { this.phase = 3; w.banner("CORE OVERLOAD", "#F04455", 2); sfx("boss"); }
    const sp = this.phase === 3 ? 1.35 : 1;
    const ty = this.phase === 1 ? this.baseY : this.baseY + 24 + Math.sin(this.t * 0.8) * 10;
    this.y += (ty - this.y) * Math.min(1, dt * 1.5);
    this.x += (((this.arenaX0 + this.arenaX1) / 2 + Math.sin(this.t * 0.5) * (this.phase === 3 ? 70 : 40)) - this.x) * Math.min(1, dt);
    this.eyeA = Math.atan2(p.y - 14 - this.y, p.x - this.x);
    if (this.stun > 0) { this.stun -= dt; if (Math.random() < dt * 12) w.fx.sparks(this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 30, 3); }
    else {
      this.step += dt * sp;
      if (this.st === "idle" && this.step > 1.6) {
        this.atk++; this.step = 0;
        const opts = this.phase === 1 ? ["laser", "drones", "ring", "laser"] : this.phase === 2 ? ["burst", "cols", "laser", "floor"] : ["cols", "burst", "floor", "ring", "laser"];
        this.st = opts[this.atk % opts.length];
        if (this.st === "laser") { const lv = [5, 10, 15, 0]; this.laserY = this.floorY - lv[Math.floor(Math.random() * lv.length)] * 8 - 10; if (Math.abs(this.laserY - (p.y - 12)) > 60) this.laserY = p.y - 12; this.laserOn = 0; sfx("warn"); }
        if (this.st === "cols") { this.cols = [p.x, p.x - 70 - Math.random() * 40, p.x + 70 + Math.random() * 40].map((v) => Math.max(this.arenaX0 + 8, Math.min(this.arenaX1 - 8, v))); this.colT = 0; sfx("warn"); }
        if (this.st === "floor") { this.floorT = 0; sfx("alarm", 0.6); w.banner("FLOOR CHARGING - CLIMB!", "#FFB44A", 1.2); }
      }
      if (this.st === "laser") { this.laserOn += dt * sp; if (this.laserOn > 1.1 && this.laserOn < 1.7) { if (Math.abs(p.y - 12 - this.laserY) < 8) p.hurt(w, 22, p.x - 1, "hazard"); if (this.laserOn - dt * sp <= 1.1) sfx("zap"); w.fx.lights.push({ x: p.x, y: this.laserY, r: 60, a: 0.6 }); } if (this.laserOn > 1.8) { this.st = "idle"; this.step = 0; } }
      if (this.st === "drones") { if (w.aliveEnemies() < 4) { w.spawnEnemy("drone", this.x - 60, this.y + 10, false); w.spawnEnemy("fast", this.x + 60, this.y + 10, false); } this.st = "idle"; this.step = -0.5; }
      if (this.st === "ring") { const n = this.phase === 3 ? 14 : 10; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + this.t; w.enemyShot(this.x, this.y, Math.cos(a) * 90, Math.sin(a) * 90, 10); } sfx("eshoot"); this.st = "idle"; this.step = 0; }
      if (this.st === "burst") { this.step += 0; if (Math.floor(this.t * 5) !== Math.floor((this.t - dt) * 5)) { const a = this.eyeA + (Math.random() - 0.5) * 0.2; w.enemyShot(this.x + Math.cos(a) * 16, this.y + Math.sin(a) * 16, Math.cos(a) * 150, Math.sin(a) * 150, 12); sfx("eshoot", 0.5); } if (this.step > 1.2) { this.st = "idle"; this.step = 0; } }
      if (this.st === "cols") { this.colT += dt * sp; if (this.colT > 1.0 && this.colT < 1.5) { for (const cx of this.cols) if (Math.abs(p.x - cx) < 8) p.hurt(w, 22, cx, "hazard"); if (this.colT - dt * sp <= 1.0) { sfx("zap"); w.fx.shake(3, 0.2); } } if (this.colT > 1.6) { this.st = "idle"; this.step = 0; } }
      if (this.st === "floor") { this.floorT += dt; this.floorOn = this.floorT > 1.4 && this.floorT < 3.0 ? 1 : 0; if (this.floorOn && p.onGround && p.y >= this.floorY - 1) p.hurt(w, 16, p.x - 1, "hazard"); if (this.floorOn && Math.random() < dt * 40) w.fx.sparks(this.arenaX0 + Math.random() * (this.arenaX1 - this.arenaX0), this.floorY - 2, 1); if (this.floorT > 3.1) { this.st = "idle"; this.step = 0; this.floorOn = 0; } }
    }
    w.fx.lights.push({ x: this.x, y: this.y, r: 90, a: 0.8 });
  }
  override draw(c: Ctx, w: World, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (this.dead && this.deadT > 2.2) return;
    // cables
    for (let i = -3; i <= 3; i++) { c.strokeStyle = "#1a1d26"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + i * 10, y - 300); c.quadraticCurveTo(x + i * 14, y - 60, x + i * 6, y - 22); c.stroke(); }
    // frame ring
    const fl = this.flash > 0;
    c.fillStyle = fl ? "#ffffff" : "#262b38"; c.beginPath(); c.arc(x, y, 30, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 8; i++) { const a = this.t * (this.phase === 3 ? 1.6 : 0.6) + (i * Math.PI) / 4; R(c, x + Math.cos(a) * 26 - 3, y + Math.sin(a) * 26 - 3, 6, 6, i % 2 ? "#3a4256" : "#F04455"); }
    c.fillStyle = "#0a0c14"; c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.fill();
    // eye
    const col = this.stun > 0 ? "#48E6E0" : "#F04455";
    c.fillStyle = "#e8e0e8"; c.beginPath(); c.ellipse(x, y, 16, 11, 0, 0, Math.PI * 2); c.fill();
    const ix = x + Math.cos(this.eyeA) * 6, iy = y + Math.sin(this.eyeA) * 4;
    c.fillStyle = col; c.beginPath(); c.arc(ix, iy, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#05070C"; c.beginPath(); c.arc(ix, iy, 3, 0, Math.PI * 2); c.fill(); R(c, ix - 3, iy - 4, 2, 2, "#ffffff");
    drawGlow(c, x, y, 50, col, 0.6);
    if (this.shields > 0) {
      c.globalAlpha = 0.35 + 0.1 * Math.sin(this.t * 4); c.strokeStyle = "#48E6E0"; c.lineWidth = 2;
      for (let s = 0; s < this.shields; s++) { c.beginPath(); c.arc(x, y, 36 + s * 6, 0, Math.PI * 2); c.stroke(); }
      c.globalAlpha = 1;
    }
    // attack telegraphs
    if (this.st === "laser") {
      const ly = Math.round(this.laserY - cy);
      if (this.laserOn < 1.1) { c.globalAlpha = 0.4 + Math.random() * 0.3; for (let i = Math.round(this.arenaX0 - cx); i < this.arenaX1 - cx; i += 6) R(c, i, ly, 3, 1, "#F04455"); c.globalAlpha = 1; }
      else if (this.laserOn < 1.7) { R(c, Math.round(this.arenaX0 - cx), ly - 2, this.arenaX1 - this.arenaX0, 5, "#F04455"); R(c, Math.round(this.arenaX0 - cx), ly, this.arenaX1 - this.arenaX0, 1, "#ffffff"); }
    }
    if (this.st === "cols") for (const cxw of this.cols) {
      const X = Math.round(cxw - cx);
      if (this.colT < 1.0) { c.globalAlpha = 0.5; R(c, X - 6, Math.round(this.floorY - cy) - 2, 12, 2, "#FFB44A"); for (let j = 0; j < 240; j += 8) R(c, X, Math.round(this.floorY - cy) - j, 1, 4, "#F04455"); c.globalAlpha = 1; }
      else if (this.colT < 1.5) { R(c, X - 4, y, 8, Math.round(this.floorY - cy) - y, "#F04455"); R(c, X - 1, y, 2, Math.round(this.floorY - cy) - y, "#ffffff"); drawGlow(c, X, Math.round(this.floorY - cy) - 20, 30, "#F04455", 0.6); }
    }
    if (this.st === "floor") { const fy = Math.round(this.floorY - cy); const on = this.floorOn > 0; R(c, Math.round(this.arenaX0 - cx), fy - 1, this.arenaX1 - this.arenaX0, 2, on ? "#bff8ff" : (Math.floor(w.time * 8) % 2 ? "#FFB44A" : "#5a3a1a")); }
  }
}
