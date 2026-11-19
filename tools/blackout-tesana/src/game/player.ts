// The operative: movement (coyote time + jump buffer), EMP, sidearm, damage and animation.
import { Body, Plat, moveBody, solidPx } from "./physics";
import { input } from "../engine/input";
import { sfx } from "../engine/audio";
import { SHEETS, drawSheet, animDone } from "../art/humanoid";
import { save, stats } from "./state";
import { T, M, matAt } from "../world/level";
import type { World } from "./world";
/** Input source for the attract-mode autopilot (same shape the player reads from the real input). */
export interface PilotInput { down: { [k: string]: boolean }; pressed(b: any): boolean }

export const PHYS = { run: 100, accG: 900, accA: 620, fric: 1100, grav: 980, jump: 335, cut: 130, maxFall: 420, coyote: 0.1, buffer: 0.13 };

export class Player implements Body {
  x = 0; y = 0; w = 10; h = 26; vx = 0; vy = 0; onGround = false; ground: Plat | null = null; hitWall = 0; hitHead = false;
  face = 1; hp = 100; maxHp = 100; inv = 0; shield = 0;
  coyote = 0; jumpBuf = 0; jumpHeld = false;
  anim = "idle"; animT = 0; landT = 0; hurtT = 0; shootT = 0; empT = 0;
  state: "play" | "hack" | "dead" | "win" = "play";
  deadT = 0; emp = 2; empCharge = 0; fireCd = 0;
  safe = { x: 0, y: 0 }; safeT = 0; stepT = 0; airT = 0; noGunT = 0;
  extVx = 0;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.safe = { x, y }; const s = stats(); this.maxHp = s.maxHp; this.hp = s.maxHp; this.emp = s.empMax; this.shield = save.shield; }

  ai: PilotInput | null = null;
  frameInput(w: World): void {
    if (this.state !== "play") return;
    const inp = this.ai || input;
    if (inp.pressed("jump")) this.jumpBuf = PHYS.buffer;
    this.jumpHeld = inp.down.jump;
    if (inp.pressed("hack")) w.interact();
    if (inp.pressed("emp")) this.fireEmp(w);
    if (inp.down.fire) this.fire(w);
  }
  fireEmp(w: World): void {
    if (this.emp <= 0) { w.fx.text(this.x, this.y - 34, "EMP CHARGING", "#48E6E0"); sfx("deny", 0.6); return; }
    this.emp--; this.empT = 0.4;
    const s = stats();
    w.emp(this.x, this.y - 14, s.empRadius, s.empStun);
  }
  fire(w: World): void {
    if (this.fireCd > 0) return;
    if (!save.sidearm) { if (this.noGunT <= 0) { w.fx.text(this.x, this.y - 34, "NO SIDEARM YET", "#FF4CA8"); this.noGunT = 1.2; } return; }
    const s = stats(); this.fireCd = s.fireCd; this.shootT = 0.2;
    const hx = this.x + this.face * 11, hy = this.y - 16;
    w.shoot(hx, hy, this.face * 300, 0, s.dmg);
    sfx("shoot", 0.8);
    w.fx.p(hx + this.face * 2, hy, this.face * 30, 0, 0.06, "#fff4c0", 3, 0, true);
    w.noise(this.x, this.y, 120);
  }
  hurt(w: World, dmg: number, fromX: number, kind = "hit"): void {
    if (this.state === "dead" || this.state === "win" || this.inv > 0 || w.demo) return;
    if (kind === "hazard") dmg *= stats().hazard;
    if (this.shield > 0) { this.shield--; save.shield = this.shield; this.inv = 0.7; sfx("shield"); w.fx.ring(this.x, this.y - 13, 20, "#9ffaf4"); w.fx.text(this.x, this.y - 34, "SHIELD", "#9ffaf4"); return; }
    this.hp -= Math.round(dmg); this.inv = 1.0; this.hurtT = 0.3;
    this.vx = (this.x < fromX ? -1 : 1) * 120; this.vy = Math.min(this.vy, -150); this.onGround = false; this.ground = null;
    sfx("hurt"); w.fx.shake(3, 0.2); w.fx.flash("#F04455", 0.1); w.fx.burst(this.x, this.y - 14, 8, "#F04455", 60, 0.4);
    if (this.hp <= 0) this.die(w, kind);
  }
  die(w: World, cause: string): void {
    if (this.state === "dead") return;
    this.hp = 0; this.state = "dead"; this.deadT = 0; this.anim = "death"; this.animT = 0; this.vx = 0;
    sfx("die"); w.onDeath(cause);
  }
  update(w: World, dt: number): void {
    const L = w.L;
    this.inv = Math.max(0, this.inv - dt); this.hurtT -= dt; this.shootT -= dt; this.empT -= dt; this.landT -= dt; this.fireCd -= dt; this.noGunT -= dt;
    const s = stats();
    if (this.emp < s.empMax) { this.empCharge += dt / s.empRecharge; if (this.empCharge >= 1) { this.empCharge = 0; this.emp++; } } else this.empCharge = 0;
    if (this.state === "dead") { this.deadT += dt; this.vx = 0; this.vy = Math.min(this.vy + PHYS.grav * dt, PHYS.maxFall); moveBody(L, this, dt, w.plats); this.animT += dt; return; }
    if (this.state === "win") { this.vx *= 0.8; this.vy = Math.min(this.vy + PHYS.grav * dt, PHYS.maxFall); moveBody(L, this, dt, w.plats); this.animT += dt; this.anim = "victory"; return; }
    let ax = 0;
    if (this.state === "play") { const inp = this.ai || input; if (inp.down.left) ax -= 1; if (inp.down.right) ax += 1; }
    const target = ax * PHYS.run;
    const acc = this.onGround ? PHYS.accG : PHYS.accA;
    if (ax !== 0) { this.face = ax; if (Math.abs(this.vx - target) < acc * dt) this.vx = target; else this.vx += Math.sign(target - this.vx) * acc * dt; }
    else { const f = (this.onGround ? PHYS.fric : PHYS.accA * 0.5) * dt; if (Math.abs(this.vx) <= f) this.vx = 0; else this.vx -= Math.sign(this.vx) * f; }
    // conveyor
    this.extVx = 0;
    if (this.onGround && !this.ground) { const m = matAt(L, Math.floor(this.x / T), Math.floor((this.y + 1) / T)); if (m === M.CONV_L) this.extVx = -40; else if (m === M.CONV_R) this.extVx = 40; }
    // jump
    if (this.onGround) { this.coyote = PHYS.coyote; this.airT = 0; } else { this.coyote -= dt; this.airT += dt; }
    this.jumpBuf -= dt;
    if (this.jumpBuf > 0 && this.coyote > 0 && this.state === "play") { this.vy = -PHYS.jump; this.jumpBuf = 0; this.coyote = 0; this.onGround = false; this.ground = null; sfx("jump", 0.7); w.fx.smoke(this.x, this.y, 3, "rgba(160,170,190,0.4)"); }
    if (!this.jumpHeld && this.vy < -PHYS.cut) this.vy = -PHYS.cut;
    this.vy = Math.min(this.vy + PHYS.grav * dt, PHYS.maxFall);
    const wasGround = this.onGround; const fallV = this.vy;
    const vxSave = this.vx; this.vx += this.extVx;
    moveBody(L, this, dt, w.plats);
    this.vx = this.hitWall ? 0 : vxSave;
    if (!wasGround && this.onGround && fallV > 150) { this.landT = 0.12; sfx("land", 0.6); w.fx.smoke(this.x, this.y, 4, "rgba(160,170,190,0.45)"); }
    // safe spot memory
    this.safeT -= dt;
    if (this.onGround && !this.ground && this.safeT <= 0 && this.inv <= 0) {
      const l = solidPx(L, this.x - 6, this.y + 2), r = solidPx(L, this.x + 6, this.y + 2);
      if (l && r && !w.hazardNear(this.x, this.y)) { this.safe = { x: this.x, y: this.y }; this.safeT = 0.25; }
    }
    // fell into a pit
    if (this.y > L.H * T + 24) {
      if (this.hp > 20) { this.hp -= 20; this.x = this.safe.x; this.y = this.safe.y; this.vx = this.vy = 0; this.inv = 1.2; sfx("hurt"); w.fx.text(this.x, this.y - 30, "-20", "#F04455"); w.camSnap(); }
      else this.die(w, "fall");
    }
    // animation
    let a = "idle";
    if (this.state === "hack") a = "hack";
    else if (this.hurtT > 0) a = "hurt";
    else if (this.empT > 0) a = "emp";
    else if (!this.onGround && this.airT > 0.05) a = this.vy < 0 ? "jump" : "fall";
    else if (this.landT > 0) a = "land";
    else if (this.shootT > 0) a = Math.abs(this.vx) > 20 ? "aimrun" : "shoot";
    else if (Math.abs(this.vx) > 70) a = "run";
    else if (Math.abs(this.vx) > 4) a = "walk";
    if (a !== this.anim) { if (!(this.anim === "shoot" && a === "shoot")) this.animT = 0; this.anim = a; }
    this.animT += dt;
    if ((a === "run" || a === "walk") && this.onGround) { this.stepT -= dt; if (this.stepT <= 0) { this.stepT = a === "run" ? 0.28 : 0.4; sfx("step", 0.6); } }
  }
  draw(c: CanvasRenderingContext2D, cx: number, cy: number): void {
    if (this.inv > 0 && this.state === "play" && Math.floor(this.inv * 20) % 2 === 0 && this.hurtT < 0) return;
    const sh = SHEETS.player;
    let t = this.animT;
    if (this.anim === "shoot" && animDone(sh, "shoot", t)) t = 0.13;
    drawSheet(c, sh, this.anim, t, this.x - cx, this.y - cy, this.face < 0, this.hurtT > 0.22);
    if (this.shield > 0 && this.state === "play") {
      c.globalAlpha = 0.25 + 0.1 * Math.sin(performance.now() / 120); c.strokeStyle = "#9ffaf4"; c.lineWidth = 1;
      c.beginPath(); c.ellipse(Math.round(this.x - cx), Math.round(this.y - cy - 14), 11, 17, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    }
  }
}
