// Neon Bazaar residents: four distinct women with their own routines and reactions to danger.
import { SHEETS, drawSheet, animDone } from "../art/humanoid";
import { solidPx } from "./physics";
import { drawFemale, femaleReady } from "../art/female";
import type { World } from "./world";
const STYLES = ["npcA", "npcB", "npcC", "npcD"];
const PERS = ["stroller", "idler", "talker", "runner"] as const;
type Pers = (typeof PERS)[number];
let counter = 0;

export class NPC {
  x: number; y: number; style: string; pers: Pers; face = 1; st = "walk"; t = 0; animT = 0; anim = "walk";
  minX: number; maxX: number; speed: number; danger = 0; dangerX = 0; pause = 0; next = 2;
  constructor(w: World, x: number, y: number, style?: string) {
    const i = counter++;
    this.style = style || (w.L.theme.female ? "female" : STYLES[i % 4]);
    this.pers = PERS[(i + Math.floor(i / 4)) % 4];
    this.x = x; this.y = y;
    this.face = i % 2 ? 1 : -1;
    this.speed = this.pers === "runner" ? 34 : this.pers === "stroller" ? 18 : 14;
    // walkable bounds on the surface she stands on
    let a = x, b = x;
    while (a > x - 130 && solidPx(w.L, a - 6, y + 2) && !solidPx(w.L, a - 6, y - 6)) a -= 4;
    while (b < x + 130 && solidPx(w.L, b + 6, y + 2) && !solidPx(w.L, b + 6, y - 6)) b += 4;
    this.minX = a + 4; this.maxX = b - 4;
    this.st = this.pers === "idler" ? "idle" : "walk"; this.next = 1 + (i % 3);
  }
  setAnim(a: string): void { if (a !== this.anim) { this.anim = a; this.animT = 0; } }
  update(w: World, dt: number): void {
    this.t += dt; this.animT += dt; this.next -= dt;
    // danger: enemies close by, recent gunfire or explosions
    const thr = w.threatNear(this.x, this.y);
    if (thr !== null && this.danger <= 0 && this.st !== "run" && this.st !== "hide") { this.danger = 3.5; this.dangerX = thr; this.st = "react"; this.t = 0; }
    if (this.danger > 0) this.danger -= dt;
    switch (this.st) {
      case "react": this.setAnim("react"); this.face = this.dangerX > this.x ? 1 : -1; if (this.t > 0.6) { this.st = this.pers === "idler" || this.pers === "talker" ? "hide" : "run"; this.t = 0; } break;
      case "run": {
        this.setAnim("run"); const dir = this.x < this.dangerX ? -1 : 1; this.face = dir;
        this.x += dir * 70 * dt;
        if (this.x < this.minX || this.x > this.maxX) { this.x = Math.max(this.minX, Math.min(this.maxX, this.x)); this.st = "hide"; this.t = 0; }
        if (this.t > 2.2) { this.st = "hide"; this.t = 0; }
        break;
      }
      case "hide": this.setAnim("hide"); if (this.t > 2.5 && this.danger <= 0) { this.st = "idle"; this.t = 0; this.next = 1.5; } break;
      case "walk": {
        this.setAnim(this.pers === "runner" ? "run" : "walk");
        this.x += this.face * (this.pers === "runner" ? 46 : this.speed) * dt;
        if (this.x <= this.minX || this.x >= this.maxX) { this.x = Math.max(this.minX, Math.min(this.maxX, this.x)); this.st = "turn"; this.t = 0; }
        if (this.next <= 0) { this.st = this.pers === "stroller" ? "look" : this.pers === "talker" ? "talk" : "idle"; this.t = 0; this.next = 2 + Math.random() * 3; }
        const mate = w.npcNear(this);
        if (this.pers === "talker" && mate && Math.abs(mate.x - this.x) < 22) { this.st = "talk"; this.t = 0; this.face = mate.x > this.x ? 1 : -1; this.next = 4 + Math.random() * 3; }
        break;
      }
      case "turn": this.setAnim("turn"); if (this.style === "female" ? this.animT > 0.28 : animDone(SHEETS[this.style], "turn", this.animT)) { this.face = -this.face; this.st = "walk"; this.t = 0; } break;
      case "look": this.setAnim("look"); if (this.next <= 0) { this.st = "walk"; this.next = 3 + Math.random() * 4; } break;
      case "talk": { this.setAnim("talk"); const mate = w.npcNear(this); if (mate) this.face = mate.x > this.x ? 1 : -1; if (this.next <= 0) { this.st = "walk"; this.next = 3 + Math.random() * 3; } break; }
      case "idle": default: this.setAnim(Math.floor(this.t / 3) % 2 ? "look" : "idle"); if (this.next <= 0) { this.st = this.pers === "idler" ? "look" : "walk"; this.next = this.pers === "idler" ? 3 + Math.random() * 3 : 3 + Math.random() * 4; } break;
    }
  }
  draw(c: CanvasRenderingContext2D, cx: number, cy: number): void {
    if (this.style === "female" && femaleReady()) drawFemale(c, this.anim, this.animT, this.x - cx, this.y - cy, this.face < 0);
    else drawSheet(c, SHEETS[this.style === "female" ? "npcA" : this.style], this.anim, this.animT, this.x - cx, this.y - cy, this.face < 0);
    if (this.st === "react") { c.fillStyle = "#FFB44A"; c.fillRect(Math.round(this.x - cx), Math.round(this.y - cy - 36), 1, 4); c.fillRect(Math.round(this.x - cx), Math.round(this.y - cy - 31), 1, 1); }
  }
}
