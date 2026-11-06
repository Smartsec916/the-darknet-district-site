// Gangs, thieves, robots, drones and turrets, plus every projectile in flight.
import { Body, Plat, moveBody, solidPx } from "./physics";
import { SHEETS, drawSheet } from "../art/humanoid";
import { sfx } from "../engine/audio";
import { drawGlow } from "./fx";
import type { World } from "./world";
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

interface Def { hp: number; spd: number; chase: number; dmg: number; w: number; h: number; sheet?: string; human?: boolean; elec?: boolean; range: number; kind: "melee" | "shoot" | "slam" | "steal" | "fly" | "ram" | "turret"; btc: number; score: number; alert?: boolean }
export const DEFS: Record<string, Def> = {
  rat: { hp: 1, spd: 26, chase: 60, dmg: 12, w: 10, h: 24, sheet: "rat", human: true, range: 90, kind: "melee", btc: 1, score: 100 },
  saint: { hp: 2, spd: 38, chase: 92, dmg: 14, w: 10, h: 25, sheet: "saint", human: true, range: 130, kind: "melee", btc: 1, score: 150, alert: true },
  thief: { hp: 1, spd: 34, chase: 130, dmg: 0, w: 10, h: 24, sheet: "thief", human: true, range: 110, kind: "steal", btc: 0, score: 150 },
  bot: { hp: 4, spd: 24, chase: 52, dmg: 18, w: 12, h: 28, sheet: "bot", elec: true, range: 110, kind: "melee", btc: 2, score: 200 },
  armed: { hp: 4, spd: 20, chase: 30, dmg: 12, w: 12, h: 28, sheet: "armed", elec: true, range: 150, kind: "shoot", btc: 2, score: 250, alert: true },
  heavy: { hp: 10, spd: 15, chase: 26, dmg: 22, w: 16, h: 36, sheet: "heavy", elec: true, range: 110, kind: "slam", btc: 4, score: 400 },
  stealth: { hp: 4, spd: 30, chase: 70, dmg: 18, w: 12, h: 27, sheet: "stealth", elec: true, range: 90, kind: "melee", btc: 2, score: 300 },
  drone: { hp: 2, spd: 40, chase: 70, dmg: 10, w: 12, h: 10, elec: true, range: 130, kind: "fly", btc: 1, score: 150 },
  fast: { hp: 1, spd: 50, chase: 125, dmg: 14, w: 10, h: 8, elec: true, range: 150, kind: "ram", btc: 1, score: 150 },
  turret: { hp: 4, spd: 0, chase: 0, dmg: 12, w: 12, h: 12, elec: true, range: 160, kind: "turret", btc: 2, score: 200 },
};

export class Proj {
  x: number; y: number; vx: number; vy: number; dmg: number; mine: boolean; life = 2.2; kind: string; dead = false;
  constructor(x: number, y: number, vx: number, vy: number, dmg: number, mine: boolean, kind = "bolt") { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.dmg = dmg; this.mine = mine; this.kind = kind; if (kind === "wave") this.life = 1.3; }
  update(w: World, dt: number): void {
    this.life -= dt; if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.kind === "wave") {
      if (!solidPx(w.L, this.x, this.y + 2) || solidPx(w.L, this.x, this.y - 4)) { this.dead = true; return; }
      if (Math.random() < dt * 30) w.fx.p(this.x, this.y - 2, 0, -40, 0.3, "#FFB44A", 1, 0, true);
    } else if (solidPx(w.L, this.x, this.y) === 1) { this.dead = true; w.fx.sparks(this.x, this.y, 4); return; }
    if (this.mine) { if (w.hitEnemies(this)) { this.dead = true; } }
    else {
      const p = w.player;
      const hh = this.kind === "wave" ? 10 : 4;
      if (Math.abs(p.x - this.x) < 6 && this.y > p.y - 26 && this.y - hh < p.y) { p.hurt(w, this.dmg, this.x - this.vx, "hit"); this.dead = true; }
    }
    w.fx.lights.push({ x: this.x, y: this.y, r: 14, a: 0.5 });
  }
  draw(c: Ctx, cx: number, cy: number): void {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (this.kind === "wave") { R(c, x - 4, y - 8, 8, 8, "rgba(255,180,74,0.35)"); R(c, x - 2, y - 10, 4, 10, "#FFB44A"); drawGlow(c, x, y - 4, 12, "#FFB44A", 0.5); return; }
    const col = this.mine ? "#48E6E0" : "#F04455";
    const d = Math.sign(this.vx) || 1;
    if (this.mine) { R(c, x - 4 * d, y, 6, 1, "#d8ffff"); R(c, x - 6 * d, y, 3, 1, col); }
    else { R(c, x - 1, y - 1, 3, 3, col); R(c, x, y, 1, 1, "#ffffff"); }
    drawGlow(c, x, y, 7, col, 0.7);
  }
}

export class Enemy implements Body {
  x: number; y: number; w: number; h: number; vx = 0; vy = 0; onGround = false; ground: Plat | null = null; hitWall = 0; hitHead = false;
  kind: string; d: Def; hp: number; face = -1; st = "patrol"; t = 0; stun = 0; flash = 0; anim = "idle"; animT = 0; dead = false; deadT = 0;
  x0: number; y0: number; home: number; loot = 0; seenT = 0; cool = 0; burst = 0; aimA = 0; id?: string; off = false; spd: number; chase: number; diff: number;
  alpha = 1; servoT = Math.random() * 2; drop = false;
  constructor(kind: string, x: number, y: number, diff: number) {
    this.kind = kind; this.d = DEFS[kind] || DEFS.rat; this.x = this.x0 = this.home = x; this.y = this.y0 = y; this.w = this.d.w; this.h = this.d.h; this.hp = this.d.hp;
    this.diff = diff; this.spd = this.d.spd * (1 + 0.35 * diff); this.chase = this.d.chase * (1 + 0.3 * diff);
    if (this.d.kind === "fly" || this.d.kind === "ram") this.y0 = y;
    if (kind === "turret") this.face = -1;
    this.face = Math.random() < 0.5 ? -1 : 1;
  }
  get flying(): boolean { return this.d.kind === "fly" || this.d.kind === "ram" || this.d.kind === "turret"; }
  get harmless(): boolean { return this.dead || this.stun > 0 || this.off; }
  hit(w: World, dmg: number, how: string, fromX: number): void {
    if (this.dead) return;
    if (this.kind === "turret" && how === "stomp") return;
    this.hp -= dmg; this.flash = 0.1;
    if (!this.flying && how !== "stomp") this.vx = (this.x < fromX ? -1 : 1) * 40;
    w.fx.sparks(this.x, this.y - this.h / 2, this.d.elec ? 6 : 3);
    sfx("hit", 0.7);
    if (this.st === "patrol") { this.st = "chase"; this.face = fromX > this.x ? 1 : -1; }
    if (this.hp <= 0) this.kill(w);
  }
  kill(w: World): void {
    this.dead = true; this.deadT = 0; this.anim = "death"; this.animT = 0; this.vx = 0;
    w.onEnemyKilled(this);
    if (this.d.elec) { w.fx.debris(this.x, this.y - this.h / 2, 10, "#6a7384"); w.fx.burst(this.x, this.y - this.h / 2, 16, "#FFB44A", 90, 0.6); sfx("explode", this.flying ? 0.5 : 0.8); w.fx.shake(2, 0.2); }
    if (this.loot > 0) { w.dropCoins(this.x, this.y - 10, this.loot); w.fx.text(this.x, this.y - 30, "BTC RECOVERED", "#FFB44A"); this.loot = 0; }
  }
  update(w: World, dt: number): void {
    this.t += dt; this.flash -= dt; this.cool -= dt; this.animT += dt;
    const p = w.player;
    if (this.dead) { this.deadT += dt; if (!this.flying) { this.vy += 900 * dt; moveBody(w.L, this, dt, null); } else { this.vy += 500 * dt; this.y += this.vy * dt; } if (this.deadT > 1.6) this.alpha = Math.max(0, 1 - (this.deadT - 1.6) * 2); return; }
    if (this.off) { this.anim = "idle"; return; }
    if (this.stun > 0) { this.stun -= dt; this.vx = 0; if (this.d.elec && Math.random() < dt * 8) w.fx.sparks(this.x + (Math.random() - 0.5) * 8, this.y - this.h * Math.random(), 2); if (!this.flying) { this.vy += 900 * dt; moveBody(w.L, this, dt, null); } this.anim = "hurt"; return; }
    const dx = p.x - this.x, dy = (p.y - 13) - (this.y - this.h / 2); const adx = Math.abs(dx);
    const sees = p.state !== "dead" && adx < this.d.range * (1 + 0.25 * this.diff) && Math.abs(dy) < (this.flying ? 90 : 40) && (adx < 40 || Math.sign(dx) === this.face || this.st !== "patrol");
    if (this.kind === "stealth" || this.kind === "heavy" || this.kind === "bot") { this.servoT -= dt; if (this.servoT < 0 && adx < 140) { this.servoT = 0.7 + Math.random(); w.sfxAt("servo", this.x, this.y, this.kind === "stealth" ? 1.4 : 0.6); } }
    switch (this.d.kind) {
      case "melee": case "steal": case "slam": case "shoot": this.ground_ai(w, dt, dx, sees); break;
      case "fly": this.fly_ai(w, dt, dx, dy, sees); break;
      case "ram": this.ram_ai(w, dt, dx, dy, sees); break;
      case "turret": this.turret_ai(w, dt, dx, dy, sees); break;
    }
    // stomp + contact
    if (p.state === "play" || p.state === "hack") {
      const top = this.y - this.h;
      if (Math.abs(dx) < (this.w + p.w) / 2 && p.y > top - 2 && p.y - p.h < this.y) {
        if (p.vy > 30 && p.y - top < 9 && this.kind !== "turret") { this.hit(w, 2, "stomp", p.x); p.vy = -240; p.y = top - 1; sfx("land"); w.fx.ring(p.x, top, 12, "#ffffff"); }
        else if (this.d.kind === "steal") { if (this.st !== "flee") this.steal(w); }
        else if (this.d.kind === "ram" || this.d.elec) { p.hurt(w, Math.round(this.d.dmg * 0.7), this.x, "hit"); if (this.d.kind === "ram") { this.vx = -Math.sign(dx) * 120; this.vy = -60; this.cool = 1.3; } }
      }
    }
  }
  canStep(w: World, dir: number): boolean {
    const fx = this.x + dir * (this.w / 2 + 3);
    if (solidPx(w.L, fx, this.y - 6) === 1 || solidPx(w.L, fx, this.y - this.h + 2) === 1) return false;
    return solidPx(w.L, fx, this.y + 3) !== 0 || solidPx(w.L, fx, this.y + 11) !== 0;
  }
  ground_ai(w: World, dt: number, dx: number, sees: boolean): void {
    const p = w.player; const D = this.d;
    let move = 0;
    if (this.st === "patrol") {
      move = this.face * this.spd;
      if (!this.canStep(w, this.face) || Math.abs(this.x - this.home) > 70 && Math.sign(this.x - this.home) === this.face) { this.face = -this.face as any; move = 0; }
      if (this.t % 4 > 3.2) move = 0;
      if (sees) { this.st = D.kind === "steal" ? "chase" : "chase"; this.seenT = 0; if (D.alert) w.alertNear(this); if (D.kind !== "steal") w.fx.text(this.x, this.y - this.h - 8, "!", "#F04455"); }
    } else if (this.st === "chase") {
      this.face = dx > 0 ? 1 : -1;
      if (!sees) { this.seenT += dt; if (this.seenT > 2.5) { this.st = "patrol"; this.home = this.x; } } else this.seenT = 0;
      if (D.kind === "shoot") {
        if (Math.abs(dx) < D.range && this.cool <= 0 && sees) { this.st = "aim"; this.t = 0; this.burst = 1 + Math.floor(this.diff * 2.2); }
        else if (Math.abs(dx) > 90) move = this.face * this.chase;
      } else if (D.kind === "slam") {
        if (Math.abs(dx) < 80 && this.cool <= 0) { this.st = "windup"; this.t = 0; sfx("servo"); }
        else move = this.face * this.chase;
      } else {
        if (Math.abs(dx) < 16 && Math.abs(p.y - this.y) < 26 && D.kind === "melee" && this.cool <= 0) { this.st = "windup"; this.t = 0; }
        else move = this.face * this.chase;
      }
      if (move && !this.canStep(w, this.face)) {
        if (this.diff > 0.6 && this.onGround && solidPx(w.L, this.x + this.face * 9, this.y - 6) && !solidPx(w.L, this.x + this.face * 9, this.y - 20)) this.vy = -250;
        else move = 0;
      }
    } else if (this.st === "windup") {
      const wt = (D.kind === "slam" ? 0.8 : 0.42) - this.diff * 0.1;
      if (this.t > wt) { this.st = "attack"; this.t = 0;
        if (D.kind === "slam") { w.fx.shake(4, 0.3); sfx("piston"); w.enemyShot(this.x - 10, this.y - 1, -130, 0, D.dmg, "wave"); w.enemyShot(this.x + 10, this.y - 1, 130, 0, D.dmg, "wave"); }
        else sfx("hit", 0.5);
      }
    } else if (this.st === "attack") {
      if (D.kind === "melee" && this.t < 0.15) { const hx = this.x + this.face * 12; if (Math.abs(p.x - hx) < 12 && Math.abs(p.y - this.y) < 26) p.hurt(w, D.dmg, this.x, "hit"); }
      if (this.t > (D.kind === "slam" ? 0.6 : 0.45)) { this.st = "chase"; this.cool = D.kind === "slam" ? 2.2 - this.diff * 0.6 : 0.6; this.t = 0; }
    } else if (this.st === "aim") {
      this.face = dx > 0 ? 1 : -1;
      if (this.t > 0.75 - this.diff * 0.2) { this.st = "fire"; this.t = 0; }
    } else if (this.st === "fire") {
      if (this.t > 0.16) { this.t = 0; this.burst--; const by = this.y - 17; w.enemyShot(this.x + this.face * 14, by, this.face * (150 + this.diff * 50), 0, D.dmg); sfx("eshoot", 0.7); w.noise(this.x, this.y, 100); if (this.burst <= 0) { this.st = "chase"; this.cool = 1.3 - this.diff * 0.4; } }
    } else if (this.st === "flee") {
      const away = Math.sign(this.x - p.x) || 1; this.face = away; move = away * this.chase * 1.25;
      if (!this.canStep(w, this.face)) { move = 0; if (this.onGround) this.vy = -280; }
      if (this.t > 4.5) { this.alpha -= dt * 2; if (this.alpha <= 0) { this.dead = true; this.deadT = 10; w.fx.text(this.x, this.y - 30, "THIEF ESCAPED", "#9a7aff"); } }
    }
    if (D.kind === "steal" && this.st === "chase" && Math.abs(dx) < 10 && Math.abs(p.y - this.y) < 20) this.steal(w);
    this.vx += (move - this.vx) * Math.min(1, dt * 10);
    this.vy = Math.min(this.vy + 900 * dt, 400);
    moveBody(w.L, this, dt, w.solidPlats);
    if (this.y > w.L.H * 8 + 20) { this.dead = true; this.deadT = 10; }
    const a = this.st === "windup" ? (D.kind === "slam" ? "slam" : "attack") : this.st === "attack" ? (D.kind === "slam" ? "slam" : "attack") : this.st === "aim" ? "aim" : this.st === "fire" ? "fire" : Math.abs(this.vx) > this.spd * 1.3 ? "run" : Math.abs(this.vx) > 3 ? "walk" : "idle";
    if (a !== this.anim) { this.anim = a; this.animT = a === "attack" && this.st === "attack" ? 0.2 : 0; }
  }
  steal(w: World): void {
    const n = Math.min(w.btc(), 2 + Math.floor(this.diff * 4));
    this.st = "flee"; this.t = 0;
    if (n > 0) { w.addBtc(-n); this.loot = n; sfx("steal"); w.fx.text(this.x, this.y - 32, `-${n} BTC`, "#9a7aff"); } else w.fx.text(this.x, this.y - 32, "BROKE?!", "#9a7aff");
  }
  fly_ai(w: World, dt: number, dx: number, dy: number, sees: boolean): void {
    const p = w.player;
    let tx = this.x0 + Math.sin(this.t * 0.7) * 30, ty = this.y0 + Math.sin(this.t * 1.7) * 6;
    if (sees || this.st === "chase" || this.st === "aim") {
      if (this.st === "patrol") { this.st = "chase"; w.fx.text(this.x, this.y - 14, "!", "#F04455"); }
      tx = p.x - Math.sign(dx || 1) * 56; ty = p.y - 64 + Math.sin(this.t * 2) * 6;
      if (this.st === "chase" && this.cool <= 0 && Math.abs(dx) < 120) { this.st = "aim"; this.t = 0; }
      if (this.st === "aim") { tx = this.x; ty = this.y; if (this.t > 0.6 - this.diff * 0.15) { const a = Math.atan2(p.y - 14 - this.y, p.x - this.x); w.enemyShot(this.x, this.y + 3, Math.cos(a) * 125, Math.sin(a) * 125, this.d.dmg); sfx("eshoot", 0.5); this.st = "chase"; this.cool = 1.9 - this.diff * 0.6; } }
    }
    this.vx += (Math.sign(tx - this.x) * Math.min(this.chase, Math.abs(tx - this.x) * 2) - this.vx) * Math.min(1, dt * 3);
    this.vy += (Math.sign(ty - this.y) * Math.min(this.chase, Math.abs(ty - this.y) * 2) - this.vy) * Math.min(1, dt * 3);
    this.x += this.vx * dt; this.y += this.vy * dt; this.face = dx > 0 ? 1 : -1;
    if (Math.random() < dt * 0.6 && Math.abs(dx) < 160) w.sfxAt("drone", this.x, this.y);
  }
  ram_ai(w: World, dt: number, dx: number, dy: number, sees: boolean): void {
    if (sees || this.st === "chase") {
      this.st = "chase";
      if (this.cool <= 0) { const a = Math.atan2(dy, dx); const sp = this.chase; this.vx += (Math.cos(a) * sp - this.vx) * Math.min(1, dt * 2.6); this.vy += (Math.sin(a) * sp - this.vy) * Math.min(1, dt * 2.6); }
      else { this.vx *= 1 - dt * 2; this.vy *= 1 - dt * 2; }
      if (Math.random() < dt * 40) w.fx.p(this.x - this.vx * 0.05, this.y, -this.vx * 0.2, -this.vy * 0.2, 0.35, "#3a8aff", 2, 0, true);
    } else { this.vx = Math.sin(this.t) * 20; this.vy = Math.cos(this.t * 1.3) * 10; }
    this.x += this.vx * dt; this.y += this.vy * dt; this.face = this.vx > 0 ? 1 : -1;
  }
  turret_ai(w: World, dt: number, dx: number, dy: number, sees: boolean): void {
    const p = w.player;
    const want = Math.atan2(dy, dx);
    if (sees) {
      this.aimA += (want - this.aimA) * Math.min(1, dt * 3);
      if (this.st === "patrol" && this.cool <= 0) { this.st = "aim"; this.t = 0; }
      if (this.st === "aim" && this.t > 0.7 - this.diff * 0.15) { this.st = "fire"; this.t = 0; this.burst = 2; }
      if (this.st === "fire" && this.t > 0.15) { this.t = 0; this.burst--; w.enemyShot(this.x + Math.cos(this.aimA) * 8, this.y - 6 + Math.sin(this.aimA) * 8, Math.cos(this.aimA) * 140, Math.sin(this.aimA) * 140, this.d.dmg); sfx("eshoot", 0.6); if (this.burst <= 0) { this.st = "patrol"; this.cool = 2.0 - this.diff * 0.5; } }
    } else { this.st = "patrol"; this.aimA = Math.PI / 2 + Math.sin(this.t) * 0.6 + (this.x > p.x ? Math.PI / 2 : -Math.PI / 2) * 0.5; }
  }
  draw(c: Ctx, w: World, cx: number, cy: number): void {
    if (this.alpha <= 0) return;
    c.globalAlpha = this.alpha;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const fl = this.flash > 0;
    if (this.d.sheet) {
      drawSheet(c, SHEETS[this.d.sheet], this.anim, this.animT, x, y, this.face < 0, fl);
      if (this.st === "aim" && !this.dead && this.stun <= 0) { c.globalAlpha = 0.5 + Math.random() * 0.3; R(c, this.face > 0 ? x + 14 : x - 14 - 120, y - 17, 120, 1, "#F04455"); c.globalAlpha = this.alpha; }
      if (this.st === "windup" && !this.dead) { R(c, x - 1, y - this.h - 10, 2, 5, "#F04455"); R(c, x - 1, y - this.h - 4, 2, 2, "#F04455"); }
      if (this.d.elec && !this.dead) drawGlow(c, x + this.face * 3, y - this.h + 4, this.kind === "stealth" ? 5 : 8, "#F04455", this.kind === "stealth" ? 0.35 : 0.6);
      if (this.loot > 0) { R(c, x - 2, y - this.h - 6, 4, 4, "#FFB44A"); }
    } else if (this.d.kind === "turret") {
      R(c, x - 6, y - 12, 12, 12, "#3a404c"); R(c, x - 6, y - 12, 12, 1, "#5a6270"); R(c, x - 3, y - 9, 6, 6, "#22262e");
      c.strokeStyle = fl ? "#ffffff" : "#5a6270"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + Math.cos(this.aimA) * 10, y - 6 + Math.sin(this.aimA) * 10); c.stroke();
      R(c, x - 1, y - 7, 2, 2, this.off ? "#2a2e36" : "#F04455");
      if (this.st === "aim" && !this.off) { c.globalAlpha = 0.5; c.strokeStyle = "#F04455"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + Math.cos(this.aimA) * 160, y - 6 + Math.sin(this.aimA) * 160); c.stroke(); c.globalAlpha = this.alpha; }
    } else drawDrone(c, x, y, this.kind === "fast", this.st === "aim", fl, this.t, this.face, this.dead);
    if (this.stun > 0 && !this.dead) { for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; R(c, x + Math.cos(a) * 7, y - this.h - 4 + Math.sin(a) * 2, 1, 1, "#48E6E0"); } }
    c.globalAlpha = 1;
    void w;
  }
}

export function drawDrone(c: Ctx, x: number, y: number, fast: boolean, aim: boolean, fl: boolean, t: number, face: number, dead: boolean): void {
  const body = fl ? "#ffffff" : fast ? "#2a3550" : "#3a404c", edge = fast ? "#4a6aa0" : "#6a7384";
  const by = y - 5 + Math.round(Math.sin(t * 6) * 1);
  // thrusters
  R(c, x - 8, by + 1, 3, 3, "#22262e"); R(c, x + 5, by + 1, 3, 3, "#22262e");
  if (!dead) { const fc = fast ? "#3a8aff" : "#FFB44A"; R(c, x - 8, by + 4, 3, 1 + (Math.floor(t * 20) % 2), fc); R(c, x + 5, by + 4, 3, 1 + (Math.floor(t * 20 + 1) % 2), fc); }
  // body
  R(c, x - 5, by - 3, 10, 7, body); R(c, x - 5, by - 3, 10, 1, edge); R(c, x - 6, by - 1, 12, 2, body);
  R(c, x - 3, by + 4, 6, 1, "#1a1d22");
  // antenna
  R(c, x - 3, by - 6, 1, 3, edge); R(c, x + 2, by - 5, 1, 2, edge); R(c, x - 3, by - 7, 1, 1, (Math.floor(t * 3) % 2) ? "#3a8aff" : "#F04455");
  // eye
  const ex = x + face * 1;
  R(c, ex - 2, by - 1, 4, 3, "#05070C"); R(c, ex - 1, by, 2, 1, dead ? "#2a1a1a" : aim ? "#ffffff" : "#F04455");
  if (!dead) drawGlow(c, ex, by, aim ? 12 : 7, "#F04455", aim ? 0.9 : 0.5);
}
