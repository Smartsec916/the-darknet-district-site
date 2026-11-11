// A running sector: loads level data, owns every actor, runs the simulation and renders it.
import { LEVELS } from "../world/levels";
import { buildLevel, LevelData, T, isPitColumn, Ent } from "../world/level";
import { renderWorld, WorldArt, CHUNK } from "../art/tiles";
import { Background } from "../art/backgrounds";
import { view } from "../engine/view";
import { input } from "../engine/input";
import { sfx, playTheme } from "../engine/audio";
import { drawText, textWidth } from "../engine/font";
import { FX, drawGlow, desaturate } from "./fx";
import { ADS, loadAdsFor } from "../art/ads";
import { hires } from "../engine/hires";
import { Player } from "./player";
import { Plat } from "./physics";
import { Enemy, Proj } from "./enemies";
import { NPC } from "./npc";
import { Boss, Warden, Overseer } from "./boss";
import { save, persist, stats, statOf } from "./state";
import * as E from "./entities";
import { makeCanvas } from "../engine/view";
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const TES = () => (window as any).Tesana;

export interface Hooks { complete(sum: Summary): void; openShop(): void }
export interface Summary { idx: number; shards: number; btc: number; score: number; totalScore: number; time: number; first: boolean; events: Record<string, number> }
interface Hack { term: E.Terminal; nodes: number; idx: number; pos: number; dir: number; speed: number; ws: number; ww: number; traces: number; flash: number; done: number; fail: number }

let lightStamp: HTMLCanvasElement | null = null;
function stamp(): HTMLCanvasElement {
  if (lightStamp) return lightStamp;
  const [c, x] = makeCanvas(64, 64);
  for (let r = 32; r > 0; r--) { const t = r / 32; const a = t < 0.55 ? 1 : t < 0.72 ? 0.82 : t < 0.86 ? 0.55 : t < 0.95 ? 0.28 : 0.1; x.fillStyle = `rgba(0,0,0,${a})`; x.beginPath(); x.arc(32, 32, r, 0, Math.PI * 2); x.fill(); }
  lightStamp = c; return c;
}

export class World {
  idx: number; L: LevelData; art: WorldArt; bg: Background; fx = new FX(); hooks: Hooks;
  player: Player; things: E.Thing[] = []; plats: Plat[] = []; solidPlats: Plat[] = []; enemies: Enemy[] = []; projs: Proj[] = []; npcs: NPC[] = []; boss: Boss | null = null;
  time = 0; cam = { x: 0, y: 0 }; look = 0; camDX = 0;
  hack: Hack | null = null; paused = false;
  cp: E.Checkpoint | null = null; spawn: { x: number; y: number };
  shards = [false, false, false]; coinsGot = new Set<number>(); levelBtc = 0; levelScore = 0; startScore = 0; startBtc = 0;
  scoreEvents: Record<string, number> = {coin: 0, shard: 0, relayBonus: 0, hack: 0, boss: 0, kill100: 0, kill150: 0, kill200: 0, kill250: 0, kill300: 0, kill400: 0};
  noises: { x: number; y: number; r: number; t: number }[] = []; lit: Record<string, number> = {};
  banners: { s: string; col: string; t: number }[] = []; intro = 3.2; completeT = -1; done = false; deaths = 0;
  edges: { x: number; y: number }[] = []; signs: { d: Ent; img: HTMLCanvasElement }[] = [];
  dark: number; darkNow = 0; arena: { x: number; y: number; w: number; h: number } | null = null; arenaDoors: E.Door[] = [];
  balcony = 0; alarmT = 0;
  demo = false;
  constructor(idx: number, hooks: Hooks, resume = false, demo?: { L: LevelData; art: WorldArt }) {
    this.idx = idx; this.hooks = hooks; this.demo = !!demo;
    const cfg = LEVELS[idx];
    this.L = demo ? demo.L : buildLevel(cfg);
    this.art = demo ? demo.art : renderWorld(this.L);
    void loadAdsFor(cfg.id);
    this.bg = new Background(this.L.theme);
    this.dark = cfg.dark || 0;
    const sp = this.L.ents.find((e) => e.t === "spawn");
    this.spawn = sp ? { x: sp.x, y: sp.y } : { x: 40, y: this.L.G * T };
    this.player = new Player(this.spawn.x, this.spawn.y);
    const az0 = this.L.zones.find((z) => z.kind === "arena"); if (az0) this.arena = az0;
    let coinIdx = 0;
    for (const e of this.L.ents) this.addEnt(e, e.t === "btc" ? coinIdx++ : -1);
    for (const e of this.L.ents) if (e.t === "linkTurret") { const tu = this.enemies.find((q) => q.kind === "turret" && Math.abs(q.x - e.x) < 2 && Math.abs(q.y - e.y) < 2); if (tu) tu.id = e.id; }
    for (const d of this.L.decos) if (d.t === "sign" || d.t === "vsign") this.signs.push({ d, img: this.signImg(d) });
    const az = this.L.zones.find((z) => z.kind === "arena"); if (az) this.arena = az;
    for (let tx = 1; tx < this.L.W - 1; tx++) { const p = isPitColumn(this.L, tx); if (p) for (const d of [-1, 1]) if (!isPitColumn(this.L, tx + d)) for (let j = this.L.G - 12; j < this.L.H; j++) if (this.L.solid[j * this.L.W + tx + d] === 1) { this.edges.push({ x: (tx + d) * T + (d < 0 ? 7 : 0), y: j * T }); break; } }
    this.startBtc = save.btc; this.startScore = save.score;
    if (resume && save.resume && save.resume.level === idx) {
      const r = save.resume;
      r.coins.forEach((i) => this.coinsGot.add(i)); this.shards = r.shards.slice();
      for (const t of this.things) if (t instanceof E.Pickup && ((t.kind === "btc" && this.coinsGot.has(t.idx)) || (t.kind === "shard" && this.shards[t.idx]))) { t.dead = true; t.taken = true; }
      const c = this.things.find((t) => t instanceof E.Checkpoint && t.id === r.cp) as E.Checkpoint | undefined;
      if (c) { c.on = true; this.cp = c; this.player.x = c.x; this.player.y = c.y; }
      this.startBtc = r.btc; this.startScore = r.score;
    } else if (!this.demo) { save.resume = { level: idx, cp: null, shards: [false, false, false], coins: [], btc: save.btc, score: save.score }; persist(); }
    if (this.demo) { this.intro = 0; this.camSnap(); return; }
    if (cfg.num >= 6 && !save.sidearm) save.sidearm = true;
    this.camSnap();
    playTheme(this.L.theme.sound);
    TES()?.gameplay?.levelStart({ levelId: cfg.id, levelIndex: idx });
    if (cfg.id === "bazaar") this.banner("WARNING: ENCOUNTERS CAN COST BTC", "#F04455", 6);
  }
  get cfg() { return LEVELS[this.idx]; }
  signImg(d: Ent): HTMLCanvasElement {
    const txt = String(d.text); const vert = d.t === "vsign"; const sc = d.big ? 2 : 1;
    const w = vert ? 10 : textWidth(txt, sc) + 6, h = vert ? txt.length * 8 + 4 : 7 * sc + 6;
    const [c, x] = makeCanvas(w, h);
    R(x, 0, 0, w, h, "#0a0710"); R(x, 0, 0, w, 1, d.col); R(x, 0, h - 1, w, 1, d.col); R(x, 0, 0, 1, h, d.col); R(x, w - 1, 0, 1, h, d.col);
    if (vert) for (let i = 0; i < txt.length; i++) drawText(x, txt[i], 2, 2 + i * 8, d.col, 1, "left", null);
    else drawText(x, txt, w / 2, 3, d.col, sc, "center", null);
    return c;
  }
  addEnt(e: Ent, coinIdx: number): void {
    const diff = this.cfg.diff;
    switch (e.t) {
      case "btc": case "shard": case "medkit": case "sidearm": { if (e.t === "sidearm" && save.sidearm) { this.things.push(new E.Pickup({ ...e, t: "medkit" }, -1)); break; } this.things.push(new E.Pickup(e, coinIdx)); break; }
      case "mplat": { const p = new E.MPlat(e); this.things.push(p); this.plats.push(p); break; }
      case "collapse": { const p = new E.Collapse(e); this.things.push(p); this.plats.push(p); break; }
      case "hidden": { const p = new E.Hidden(e); this.things.push(p); this.plats.push(p); break; }
      case "elevator": { const p = new E.Elevator(e); this.things.push(p); this.plats.push(p); break; }
      case "door": case "arenaDoor": { const p = new E.Door(e, e.t === "arenaDoor"); this.things.push(p); this.plats.push(p); this.solidPlats.push(p); if (e.t === "arenaDoor") this.arenaDoors.push(p); break; }
      case "terminal": this.things.push(new E.Terminal(e)); break;
      case "checkpoint": this.things.push(new E.Checkpoint(e)); break;
      case "exit": this.things.push(new E.Exit(e)); break;
      case "shop": this.things.push(new E.ShopKiosk(e)); break;
      case "steam": this.things.push(new E.Steam(e)); break;
      case "arc": this.things.push(new E.Arc(e)); break;
      case "laser": this.things.push(new E.Laser(e)); break;
      case "piston": this.things.push(new E.Piston(e)); break;
      case "rotor": this.things.push(new E.Rotor(e)); break;
      case "debris": this.things.push(new E.Debris(e)); break;
      case "shockfloor": this.things.push(new E.ShockFloor(e)); break;
      case "train": this.things.push(new E.Train(e)); break;
      case "updraft": this.things.push(new E.Updraft(e)); break;
      case "lamp": this.things.push(new E.Lamp(e)); break;
      case "sparker": this.things.push(new E.Sparker(e)); break;
      case "camera": this.things.push(new E.Camera(e)); break;
      case "ambush": this.things.push(new E.Ambush(e)); break;
      case "npc": this.npcs.push(new NPC(this, e.x, e.y, e.style)); break;
      case "enemy": { const en = new Enemy(e.kind, e.x, e.kind === "drone" || e.kind === "fast" ? e.y : e.y, diff); if (en.flying && e.kind !== "turret") { en.y = en.y0 = e.y; } this.enemies.push(en); break; }
      case "boss": {
        if (e.kind === "overseer") { const o = new Overseer(e.x, e.y); o.floorY = this.L.G * T; if (this.arena) { o.arenaX0 = this.arena.x; o.arenaX1 = this.arena.x + this.arena.w; } this.boss = o; }
        else this.boss = new Warden(e.x, e.y, e.kind === "warden2");
        break;
      }
    }
  }
  // ---------- services used by actors ----------
  sfxAt(name: string, x: number, y: number, v = 1): void { const d = Math.hypot(x - this.player.x, y - this.player.y); const vol = Math.max(0, 1 - d / 240); if (vol > 0.05) sfx(name, vol * v); }
  noise(x: number, y: number, r: number): void { this.noises.push({ x, y, r, t: 0.6 }); }
  btc(): number { return save.btc; }
  addBtc(n: number): void { if (this.demo) { this.levelBtc += n; return; } save.btc = Math.max(0, save.btc + n); this.levelBtc += n; }
  addScore(n: number, event?: string): void { if (this.demo) { this.levelScore += n; return; } save.score += n; this.levelScore += n; if (event) this.scoreEvents[event]++; }
  hazardNear(x: number, y: number): boolean { for (const t of this.things) if (t.hazard && Math.abs(t.x - x) < 28 && Math.abs(t.y - y) < 60) return true; return false; }
  hurtRect(r: [number, number, number, number], dmg: number, fromX: number, kind: string): void {
    const p = this.player; if (p.x + 4 > r[0] && p.x - 4 < r[0] + r[2] && p.y > r[1] && p.y - p.h + 3 < r[1] + r[3]) p.hurt(this, dmg, fromX, kind);
  }
  threatNear(x: number, y: number): number | null {
    for (const e of this.enemies) if (!e.harmless && e.kind !== "thief" && Math.abs(e.x - x) < 70 && Math.abs(e.y - y) < 40) return e.x;
    for (const e of this.enemies) if (e.kind === "thief" && e.st === "flee" && Math.abs(e.x - x) < 50) return e.x;
    for (const n of this.noises) if (Math.hypot(n.x - x, n.y - y) < n.r) return n.x;
    return null;
  }
  npcNear(me: NPC): NPC | null { for (const n of this.npcs) if (n !== me && Math.abs(n.y - me.y) < 4 && Math.abs(n.x - me.x) < 26) return n; return null; }
  alertNear(src: Enemy): void { for (const e of this.enemies) if (e !== src && !e.dead && e.st === "patrol" && Math.abs(e.x - src.x) < 130 && Math.abs(e.y - src.y) < 60) { e.st = "chase"; e.seenT = 0; } }
  aliveEnemies(): number { return this.enemies.filter((e) => !e.dead).length; }
  pickGround(): string { const g = this.cfg.enemies.ground; return g.length ? g[Math.floor(Math.random() * g.length)][0] : "bot"; }
  spawnEnemy(kind: string, x: number, y: number, drop: boolean): void {
    const e = new Enemy(kind, x, y, this.cfg.diff); e.st = "chase"; if (drop) { e.vy = 0; } this.enemies.push(e);
    this.fx.burst(x, y - 10, 10, "#F04455", 50, 0.5, 0);
  }
  enemyShot(x: number, y: number, vx: number, vy: number, dmg: number, kind = "bolt"): void { this.projs.push(new Proj(x, y, vx, vy, dmg, false, kind)); }
  shoot(x: number, y: number, vx: number, vy: number, dmg: number): void { this.projs.push(new Proj(x, y, vx, vy, dmg, true)); }
  hitEnemies(p: Proj): boolean {
    for (const e of this.enemies) { if (e.dead || e.off) continue; if (Math.abs(p.x - e.x) < e.w / 2 + 2 && p.y > e.y - e.h && p.y < e.y + (e.flying ? 6 : 0)) { e.hit(this, p.dmg, "shot", p.x - p.vx); return true; } }
    if (this.boss && !this.boss.dead && this.boss.hitTest(p.x, p.y)) { this.boss.damage(this, p.dmg); this.fx.sparks(p.x, p.y, 5); return true; }
    return false;
  }
  dropCoins(x: number, y: number, n: number): void { for (let i = 0; i < n; i++) { const c = new E.Pickup({ t: "btc", x: x + (i - n / 2) * 6, y: y + 4 }, -1); this.things.push(c); } }
  onEnemyKilled(e: Enemy): void {
    this.addScore(e.d.score, `kill${e.d.score}`);
    if (e.d.btc && Math.random() < 0.55) this.dropCoins(e.x, e.y - 6, e.d.btc);
    this.noise(e.x, e.y, 90);
  }
  emp(x: number, y: number, r: number, stun: number): void {
    sfx("emp"); this.fx.ring(x, y, r, "#48E6E0"); this.fx.flash("#48E6E0", 0.08); this.fx.burst(x, y, 24, "#9ffaf4", 120, 0.45, 0);
    this.fx.lights.push({ x, y, r: r * 1.4, a: 1 });
    for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - e.h / 2 - y) < r + 6) { e.stun = e.d.elec ? stun : 1.5; e.flash = 0.1; if (e.kind === "thief" && e.st !== "flee") e.st = "patrol"; }
    for (const t of this.things) { if ((t instanceof E.Laser || t instanceof E.Arc || t instanceof E.ShockFloor || t instanceof E.Rotor) && Math.hypot(t.x - x, t.y - y) < r + 40) t.emp(stun); if (t instanceof E.Camera && Math.hypot(t.x - x, t.y - y) < r + 30) t.emp(stun); }
    if (this.boss && this.boss.awake && Math.hypot(this.boss.x - x, this.boss.y - 20 - y) < r + 40) this.boss.emp(this);
    this.noise(x, y, 110);
  }
  alarm(x: number, y: number): void {
    sfx("alarm"); this.banner("DETECTED!", "#F04455", 1.2); this.alarmT = 1.5;
    for (const s of [-1, 1]) this.spawnEnemy("fast", this.player.x + s * 150, this.player.y - 70, false);
    void x; void y;
  }
  banner(s: string, col: string, t: number): void { this.banners.push({ s, col, t }); if (this.banners.length > 3) this.banners.shift(); }
  trigger(id: string): void {
    if (this.lit[id] !== undefined || this.L.zones.some((z) => z.kind === "lit" && z.id === id)) { this.lit[id] = 30; this.banner("POWER RESTORED", "#48E6E0", 1.5); }
    for (const t of this.things) if (t.id === id) t.trigger(this);
    for (const e of this.enemies) if (e.id === id) { e.off = true; this.fx.sparks(e.x, e.y - 6, 10); }
  }
  collect(p: E.Pickup): void {
    if (p.kind === "btc") { this.addBtc(1); this.addScore(10, "coin"); sfx("coin", 0.7); if (p.idx >= 0) this.coinsGot.add(p.idx); this.fx.text(p.x, p.y - 8, "+1", "#FFB44A"); }
    else if (p.kind === "shard") {
      this.shards[p.idx] = true; this.addScore(50, "shard"); sfx("shard"); this.fx.burst(p.x, p.y, 20, "#48E6E0", 70, 0.7, 0);
      const n = this.shards.filter(Boolean).length;
      this.banner(`RELAY SHARD ${n}/3`, "#48E6E0", 1.6);
      if (n === 3) {
        const st = this.demo ? { setBonus: true } : statOf(this.cfg.id);
        if (!st.setBonus) { st.setBonus = true; this.addBtc(9); this.addScore(250, "relayBonus"); this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15); sfx("sync"); this.banner("RELAY SYNCED  +9 BTC +250 +15 HP", "#FFB44A", 2.6); }
        else this.banner("RELAY SYNCED", "#FFB44A", 1.6);
      }
    } else if (p.kind === "medkit") { this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40); sfx("pickup"); this.fx.text(p.x, p.y - 8, "+40 HP", "#F04455"); }
    else if (p.kind === "sidearm") { save.sidearm = true; persist(); sfx("pickup"); this.banner("SIDEARM ACQUIRED", "#FF4CA8", 2.2); this.banner(input.coarse || input.lastTouch ? "TAP THE GUN BUTTON TO FIRE" : "PRESS F OR J TO FIRE", "#FF4CA8", 3); }
  }
  checkpoint(c: E.Checkpoint): void {
    this.cp = c; sfx("checkpoint"); this.banner("CHECKPOINT", "#48E6E0", 1.4); this.player.hp = Math.max(this.player.hp, Math.min(this.player.maxHp, this.player.hp + 20));
    if (this.demo) return;
    save.resume = { level: this.idx, cp: c.id || null, shards: this.shards.slice(), coins: [...this.coinsGot], btc: save.btc, score: save.score };
    save.shield = this.player.shield; persist();
    TES()?.gameplay?.checkpoint({ levelId: this.cfg.id, name: c.id });
  }
  exitOpen(): boolean { return !this.boss || this.boss.dead; }
  reachExit(): void {
    if (this.done) return;
    if (!this.exitOpen()) { if (Math.floor(this.time * 2) % 4 === 0) this.fx.text(this.player.x, this.player.y - 34, "LOCKED", "#F04455"); return; }
    this.done = true; this.player.state = "win"; this.player.animT = 0; this.completeT = 0; sfx("victory");
  }
  finish(): void {
    if (this.demo) return;
    const cfg = this.cfg; const st = statOf(cfg.id);
    const first = !st.done;
    st.done = true; st.shards = st.shards.map((v, i) => v || this.shards[i]);
    const time = this.time; const bonus = 1000 + Math.max(0, Math.round(600 - time * 2));
    this.addScore(bonus); st.best = Math.max(st.best, this.levelScore);
    save.unlocked = Math.max(save.unlocked, this.idx + 2); save.resume = null; save.shield = this.player.shield; persist();
    TES()?.gameplay?.levelComplete({ levelId: cfg.id });
    this.hooks.complete({ idx: this.idx, shards: this.shards.filter(Boolean).length, btc: save.btc - this.startBtc, score: this.levelScore, totalScore: save.score, time, first, events: {...this.scoreEvents} });
  }
  bossDefeated(b: Boss): void {
    this.addScore(5000, "boss"); this.banner(b.name + " DESTROYED", "#FFB44A", 3); sfx("boss"); this.fx.shake(8, 1.5);
    this.dropCoins(b.x, b.y - 30, 15);
    for (const e of this.enemies) if (!e.dead && (e.kind === "drone" || e.kind === "fast")) e.kill(this);
    setTimeout(() => { for (const d of this.arenaDoors) d.trigger(this); }, 2200);
  }
  onDeath(cause: string): void { this.deaths++; if (this.demo) return; TES()?.gameplay?.death({ levelId: this.cfg.id, x: Math.round(this.player.x), y: Math.round(this.player.y), name: cause }); }
  respawn(): void {
    const p = this.player; const s = stats();
    const at = this.cp ? { x: this.cp.x, y: this.cp.y } : this.spawn;
    p.x = at.x; p.y = at.y; p.vx = p.vy = 0; p.hp = s.maxHp; p.maxHp = s.maxHp; p.state = "play"; p.inv = 1.5; p.anim = "idle"; p.ground = null; p.safe = { ...at };
    p.emp = s.empMax;
    this.projs.length = 0; this.hack = null;
    if (this.boss && !this.boss.dead && this.boss.awake) {
      this.boss.awake = false; if (this.boss instanceof Warden) { this.boss.hp = this.boss.max; this.boss.x = this.L.ents.find((e) => e.t === "boss")!.x; this.boss.st = "idle"; } else this.boss.hp = Math.max(this.boss.hp, this.boss.max * 0.6);
      for (const d of this.arenaDoors) if (d.id === "adL") { d.open = 1; d.h = 0; d.active = false; }
      this.enemies = this.enemies.filter((e) => !(e.st === "chase" && (e.kind === "drone" || e.kind === "fast") && Math.abs(e.x - this.boss!.x) < 300));
    }
    this.camSnap();
  }
  camSnap(): void { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
  camTarget(): { x: number; y: number } {
    const p = this.player;
    let tx = p.x + this.look - view.w / 2, ty = p.y - view.h * 0.68;
    ty -= this.balcony * 64;
    if (p.ground instanceof E.Elevator && p.ground.target >= 0) ty += Math.sign(p.ground.stops[p.ground.target] - p.ground.y) * 40;
    if (this.boss && this.boss.awake && !this.boss.dead && this.arena) {
      const a = this.arena; tx = Math.max(a.x - 8, Math.min(a.x + a.w + 8 - view.w, tx));
      if (this.boss instanceof Overseer) ty = Math.min(ty, this.boss.y - 40);
    }
    const maxX = this.L.W * T - view.w, maxY = this.L.H * T - view.h;
    const minY = this.L.ceilRow >= 0 ? (this.L.ceilRow - 1) * T : -200;
    return { x: Math.max(0, Math.min(maxX, tx)), y: Math.max(minY, Math.min(maxY, ty)) };
  }
  interact(): void {
    const p = this.player;
    for (const t of this.things) if (t instanceof E.ShopKiosk && t.near(this) && !this.demo) { this.hooks.openShop(); sfx("select"); return; }
    for (const t of this.things) if (t instanceof E.Terminal && !t.done && t.near(this)) { this.startHack(t); return; }
    for (const t of this.things) if (t instanceof E.Elevator && t.interact(this)) return;
    for (const t of this.things) if (t instanceof E.Terminal && t.done && t.near(this)) { this.fx.text(p.x, p.y - 34, "ALREADY HACKED", "#48E6E0"); return; }
  }
  startHack(t: E.Terminal): void {
    const n = this.cfg.num; const s = stats();
    const nodes = t.mode === "boss" ? 3 : Math.min(5, 2 + Math.floor((n - 1) / 3));
    const ww = Math.max(0.11, 0.3 - n * 0.016) + s.hackWin;
    this.hack = { term: t, nodes, idx: 0, pos: 0, dir: 1, speed: (0.85 + n * 0.07) * s.hackSlow, ws: 0, ww, traces: 0, flash: 0, done: 0, fail: 0 };
    this.newWindow(); this.player.state = "hack"; this.player.vx = 0; sfx("beep");
  }
  newWindow(): void { const h = this.hack!; h.ws = 0.08 + Math.random() * (0.84 - h.ww); }
  updateHack(dt: number): void {
    const h = this.hack!;
    if (h.done > 0) { h.done -= dt; if (h.done <= 0) { this.hack = null; this.player.state = "play"; } return; }
    if (h.fail > 0) { h.fail -= dt; if (h.fail <= 0) { this.hack = null; this.player.state = "play"; } return; }
    h.flash -= dt;
    h.pos += h.dir * h.speed * (1 + h.idx * 0.1) * dt; if (h.pos > 1) { h.pos = 1; h.dir = -1; } if (h.pos < 0) { h.pos = 0; h.dir = 1; }
    const inp = this.player.ai || input;
    if (inp.pressed("back") || inp.pressed("pause")) { this.hack = null; this.player.state = "play"; return; }
    if (inp.pressed("hack") || inp.pressed("jump")) {
      if (h.pos >= h.ws && h.pos <= h.ws + h.ww) {
        h.idx++; sfx("hackok");
        if (h.idx >= h.nodes) {
          h.done = 0.6; sfx("hackdone"); h.term.done = true; this.addScore(150, "hack"); this.fx.burst(h.term.x, h.term.y - 15, 16, "#48E6E0", 60, 0.6, 0);
          if (h.term.mode === "boss" && this.boss) this.boss.nodeHacked(this);
          for (const id of h.term.links) this.trigger(id);
          if (h.term.label === "LASER GRID" || h.term.label === "SURVEILLANCE") this.banner(h.term.label + " OFFLINE", "#48E6E0", 1.5);
        } else this.newWindow();
      } else {
        h.traces++; h.flash = 0.25; sfx("hackbad");
        if (h.traces >= 3) { h.fail = 0.8; this.player.state = "play"; this.player.inv = 0; this.player.hurt(this, 8, this.player.x - this.player.face, "hack"); this.banner("TRACE COMPLETE - HACK FAILED", "#F04455", 1.4); }
      }
    }
  }
  // ---------- simulation ----------
  update(dt: number): void {
    if (this.intro > 0) this.intro -= dt;
    for (const b of this.banners) b.t -= dt; this.banners = this.banners.filter((b) => b.t > 0);
    if (this.hack) { this.updateHack(dt); const bossHack = !!(this.boss && this.boss.awake); if (!bossHack) { this.fx.update(dt * 0.2); return; } dt *= 0.25; }
    this.player.frameInput(this);
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))); const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
    this.post(dt);
  }
  step(dt: number): void {
    this.time += dt;
    for (const t of this.things) if (t instanceof E.MPlat || t instanceof E.Elevator || t instanceof E.Collapse || t instanceof E.Door) t.update(this, dt);
    this.player.update(this, dt);
    for (const e of this.enemies) e.update(this, dt);
    if (this.boss) this.boss.update(this, dt);
    for (const pr of this.projs) pr.update(this, dt);
  }
  post(dt: number): void {
    this.fx.lights.length = 0;
    for (const t of this.things) if (!(t instanceof E.MPlat || t instanceof E.Elevator || t instanceof E.Collapse || t instanceof E.Door)) t.update(this, dt);
    this.things = this.things.filter((t) => !t.dead);
    this.projs = this.projs.filter((p) => !p.dead);
    this.enemies = this.enemies.filter((e) => !(e.dead && e.alpha <= 0 && e.deadT > 2) && !(e.dead && e.deadT > 9));
    for (const n of this.npcs) n.update(this, dt);
    for (const n of this.noises) n.t -= dt; this.noises = this.noises.filter((n) => n.t > 0);
    for (const k in this.lit) this.lit[k] = Math.max(0, this.lit[k] - dt);
    this.fx.update(dt);
    this.alarmT -= dt;
    // boss arena trigger
    if (this.boss && !this.boss.awake && !this.boss.dead && this.arena && this.player.x > this.arena.x + 40 && this.player.state === "play") {
      this.boss.awake = true; sfx("boss"); this.fx.shake(5, 0.6); this.banner(this.boss.name, "#F04455", 2.2);
      for (const d of this.arenaDoors) if (d.id === "adL") d.close(this);
    }
    // zones
    const p = this.player; let inBal = 0, dim = 0;
    for (const z of this.L.zones) { if (p.x > z.x && p.x < z.x + z.w && p.y <= z.y + 2 && p.y > z.y - z.h) { if (z.kind === "balcony") inBal = 1; if (z.kind === "dim") dim = 0.55; } }
    if (this.L.zones.some((z) => z.kind === "dim" && p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h + 40)) dim = 0.55;
    this.balcony += (inBal - this.balcony) * Math.min(1, dt * 1.5);
    const targetDark = Math.max(this.dark, dim);
    this.darkNow += (targetDark - this.darkNow) * Math.min(1, dt * 2);
    // camera
    const want = p.face * 34 + p.vx * 0.15;
    this.look += (want - this.look) * Math.min(1, dt * 2.2);
    const t = this.camTarget(); const ox = this.cam.x;
    this.cam.x += (t.x - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (t.y - this.cam.y) * Math.min(1, dt * 3.6);
    this.camDX = this.cam.x - ox;
    // death & completion
    if (p.state === "dead" && p.deadT > 1.8) this.respawn();
    if (this.completeT >= 0) { this.completeT += dt; if (this.completeT > 1.6 && this.completeT < 100) { this.completeT = 999; this.finish(); } }
  }
  // ---------- rendering ----------
  draw(c: Ctx, dt: number): void {
    const sh = this.fx.shakeT > 0 ? this.fx.shakeA : 0;
    const cx = Math.round(this.cam.x + (Math.random() - 0.5) * sh), cy = Math.round(this.cam.y + (Math.random() - 0.5) * sh);
    this.bg.draw(c, cx, cy, this.L.G * T, this.hack && !(this.boss && this.boss.awake) ? 0 : dt);
    const c0 = Math.floor(cx / CHUNK), c1 = Math.floor((cx + view.w) / CHUNK);
    for (let i = c0; i <= c1; i++) { const ch = this.art.chunks[i]; if (ch) c.drawImage(ch, i * CHUNK - cx, -cy); }
    // animated LEDs / conveyors
    const tm = this.time;
    for (const l of this.art.leds) { const X = l.x - cx, Y = l.y - cy; if (X < -2 || X > view.w || Y < -2 || Y > view.h) continue; if (Math.sin(tm * 3 + l.p * 5) > -0.3) R(c, X, Y, 1, 1, l.c); }
    for (const v of this.art.conveyors) { const X = v.x - cx, Y = v.y - cy; if (X < -8 || X > view.w) continue; const o = ((Math.floor(tm * 20 * v.dir) % 4) + 4) % 4; R(c, X + o, Y + 1, 1, 1, "#FFB44A"); R(c, X + ((o + 4) % 8), Y + 1, 1, 1, "#FFB44A"); }
    this.drawDecos(c, cx, cy);
    if (this.L.theme.gritty) desaturate(c, view.w, view.h, 0.2, 0.08);
    this.drawDress(c, cx, cy);
    for (const t of this.things) if (!(t instanceof E.Pickup)) t.draw(c, this, cx, cy);
    for (const t of this.things) if (t instanceof E.Pickup) t.draw(c, this, cx, cy);
    for (const n of this.npcs) if (n.x > cx - 30 && n.x < cx + view.w + 30) n.draw(c, cx, cy);
    for (const e of this.enemies) if (e.x > cx - 40 && e.x < cx + view.w + 40) e.draw(c, this, cx, cy);
    if (this.boss) this.boss.draw(c, this, cx, cy);
    this.player.draw(c, cx, cy);
    for (const pr of this.projs) pr.draw(c, cx, cy);
    this.fx.draw(c, cx, cy);
    this.drawForeground(c, cx, cy, dt);
    if (this.darkNow > 0.02) this.drawDarkness(c, cx, cy);
    else if (this.L.theme.ambient > 0) { const g = c.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.4, view.w / 2, view.h / 2, view.w * 0.75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(3,4,8,${this.L.theme.ambient * 2.2})`); c.fillStyle = g; c.fillRect(0, 0, view.w, view.h); }
    if (!this.demo) this.fx.drawTexts(c, cx, cy);
    if (this.fx.flashT > 0) { c.globalAlpha = Math.min(0.35, this.fx.flashT * 2.5); c.fillStyle = this.fx.flashCol; c.fillRect(0, 0, view.w, view.h); c.globalAlpha = 1; }
    if (this.alarmT > 0 && Math.floor(this.alarmT * 6) % 2) { c.fillStyle = "rgba(240,68,85,0.12)"; c.fillRect(0, 0, view.w, view.h); }
    if (this.demo) return;
    this.drawHud(c);
    if (this.hack) this.drawHack(c);
  }
  drawDecos(c: Ctx, cx: number, cy: number): void {
    const tm = this.time;
    for (const s of this.signs) {
      const d = s.d; const X = Math.round(d.x - cx - s.img.width / 2), Y = Math.round(d.y - cy - s.img.height);
      if (X > view.w || X + s.img.width < 0 || Y > view.h || Y + s.img.height < 0) continue;
      const gr = !!this.L.theme.gritty;
      const fl = gr ? Math.sin(tm * 2.3 + d.x * 0.1) > -0.97 : Math.sin(tm * 2.3 + d.x * 0.1) > -0.9 || Math.random() < 0.5;
      if (d.hang) { R(c, X + 3, Y - 10, 1, 10, "#2a2e36"); R(c, X + s.img.width - 4, Y - 10, 1, 10, "#2a2e36"); }
      c.globalAlpha = fl ? 1 : 0.35; c.drawImage(s.img, X, Y); c.globalAlpha = 1;
      if (fl) drawGlow(c, X + s.img.width / 2, Y + s.img.height / 2, Math.max(s.img.width, s.img.height) * 0.75, d.col, gr ? 0.16 : 0.35);
    }
    for (const d of this.L.decos) {
      const X = d.x - cx, Y = d.y - cy; if (X < -80 || X > view.w + 80 || Y < -60 || Y > view.h + 60) continue;
      if (this.demo && (d.t === "hint" || d.t === "arrowDown")) continue;
      if (d.t === "hint") { c.globalAlpha = 0.65 + 0.35 * Math.sin(tm * 3); drawText(c, d.text, X, Y, "#FFB44A", 1, "center"); c.globalAlpha = 1; }
      else if (d.t === "arrowDown") { const b = Math.round(Math.abs(Math.sin(tm * 4)) * 3); for (let i = 0; i < 4; i++) R(c, X - 3 + i, Y + b + i, 7 - i * 2, 1, "#FFB44A"); }
      else if (d.t === "vent") { if (Math.random() < 0.3) this.fx.p(d.x + (Math.random() - 0.5) * 8, d.y - 2, (Math.random() - 0.5) * 6, -18, 1.4, "rgba(200,190,220,0.25)", 3, -2, false, 0.5); }
      else if (d.t === "antenna") { if (Math.floor(tm * 1.5) % 2) { R(c, X, Y - 31, 1, 1, "#F04455"); drawGlow(c, X, Y - 31, 5, "#F04455", 0.8); } }
    }
  }
  drawDress(c: Ctx, cx: number, cy: number): void {
    const tm = this.time;
    const fx = this.fx;
    for (const d of this.L.decos) {
      const t = d.t;
      if (t === "poster") {
        const X = Math.round(d.x - cx), Y = Math.round(d.y - cy);
        if (X > view.w || X + d.w < 0 || Y > view.h || Y + d.h < 0) continue;
        const a = ADS[d.key]; if (!a) continue;
        // lit posters hum under a small lamp and flicker now and then; unlit ones are a little dimmer
        let br = d.lit ? 1 : 0.82;
        if (d.lit) { const s = Math.sin(tm * 1.7 + d.ph) + Math.sin(tm * 7.3 + d.ph * 3) * 0.3; if (s < -1.15) br = 0.5; }
        const img = a.alt && Math.floor(tm * 1.6 + d.ph) % 2 ? a.alt : a.img;
        hires.poster(c, img, X, Y, d.w, d.h, br);
        if (d.lit) { const lx = X + Math.round(d.w / 2); R(c, lx - 5, Y - 4, 10, 2, "#262a30"); R(c, lx - 1, Y - 6, 2, 2, "#1a1d22"); R(c, lx - 4, Y - 2, 8, 1, br > 0.7 ? "#e8c890" : "#5a4a34"); }
        continue;
      }
      if (t === "cable") {
        const X = Math.round(d.x - cx), Y = Math.round(d.y - cy);
        if (X > view.w || X + d.len < 0 || Y > view.h + 10 || Y + d.sag < -10) continue;
        c.fillStyle = "#07090c";
        for (let i = 0; i <= d.len; i++) { const u = i / d.len; c.fillRect(X + i, Math.round(Y + d.sag * 4 * u * (1 - u)), 1, 1); }
        R(c, X - 1, Y - 1, 3, 3, "#1a1d22"); R(c, X + d.len - 1, Y - 1, 3, 3, "#1a1d22");
        if (d.spark && Math.sin(tm * 1.3 + d.ph) > 0.97) {
          const sx = d.x + d.len * 0.5, sy = d.y + d.sag;
          drawGlow(c, sx - cx, sy - cy, 7, "#9ad8ff", 0.5);
          if (Math.random() < 0.4) fx.p(sx, sy, (Math.random() - 0.5) * 40, -10 - Math.random() * 20, 0.35, "#cfeaff", 1, 300, true);
        }
        continue;
      }
      const X = Math.round(d.x - cx), Y = Math.round(d.y - cy);
      if (X < -40 || X > view.w + 40 || Y < -10 || Y - 50 > view.h) continue;
      if (t === "doorway") {
        const on = Math.sin(tm * 0.9 + d.ph) > -0.96;
        R(c, X - 9, Y - 28, 18, 28, "#15181d"); R(c, X - 7, Y - 26, 14, 26, "#05070a");
        c.globalAlpha = on ? 0.55 : 0.2; R(c, X - 7, Y - 26, 14, 26, d.col); c.globalAlpha = 1;
        c.globalAlpha = 0.6; R(c, X - 7, Y - 26, 14, 8, "#05070a"); c.globalAlpha = 1;
        if (d.v === 1) for (let j = 0; j < 11; j += 2) R(c, X - 7, Y - 26 + j, 14, 1, "#2a2e34");
        else if (d.v === 2) { R(c, X - 2, Y - 18, 4, 4, "#05070a"); R(c, X - 3, Y - 14, 6, 14, "#05070a"); }
        R(c, X - 6, Y - 32, 12, 3, "#0a0c10"); if (on) R(c, X - 5, Y - 31, 10, 1, d.col);
        if (on) { drawGlow(c, X, Y - 12, 18, d.col, 0.2); drawGlow(c, X, Y + 1, 16, d.col, 0.16); }
      } else if (t === "machine") {
        const j = Math.sin(tm * 40 + d.ph) > 0.6 ? 1 : 0;
        R(c, X - 10, Y - 15, 20, 15, "#191d22"); R(c, X - 10, Y - 15 - j, 20, 1, "#2e353c"); R(c, X - 10, Y - 15, 1, 15, "#262b31");
        for (let i = 0; i < 4; i++) R(c, X - 7, Y - 11 + i * 2, 9, 1, "#0b0d10");
        const cols = ["#58c070", "#d89a40", "#c8404c"];
        for (let i = 0; i < 3; i++) if (Math.floor(tm * (1.3 + i * 0.7) + d.ph + i) % 3) R(c, X + 4, Y - 12 + i * 3, 2, 1, cols[i]);
        R(c, X + 3, Y - 2, 6, 2, "#0b0d10"); R(c, X - 12, Y - 4, 2, 4, "#22272d");
        if (Math.floor(tm * 2 + d.ph) % 4 === 0) drawGlow(c, X + 5, Y - 9, 6, "#d89a40", 0.25);
      } else if (t === "puddle") {
        R(c, X - 13, Y, 26, 2, "rgba(8,16,22,0.85)"); R(c, X - 10, Y + 2, 20, 1, "rgba(8,16,22,0.6)");
        c.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) { const o = Math.floor((tm * 6 + i * 9 + d.ph * 3) % 22); R(c, X - 11 + o, Y, 3, 1, i === 1 ? "#c8904a" : "#6aa8b0"); }
        c.globalAlpha = 1;
        if (Math.random() < 0.04) fx.p(d.x - 10 + Math.random() * 20, d.y, 0, -12, 0.25, "rgba(160,200,210,0.6)", 1, 60);
      } else if (t === "pipesteam") {
        R(c, X - 2, Y - 44, 4, 44, "#262b31"); R(c, X - 2, Y - 44, 1, 44, "#3c444c");
        R(c, X - 2, Y - 46, 10, 4, "#262b31"); R(c, X - 3, Y - 30, 6, 2, "#3a4148"); R(c, X - 3, Y - 12, 6, 2, "#3a4148");
        R(c, X + 2, Y - 31, 3, 3, "#6a2a22");
        const cyc = (tm + d.ph) % 5;
        if (cyc < 1.6 && Math.random() < 0.6) fx.p(d.x + 4, d.y - 30, 14 + Math.random() * 14, -8 - Math.random() * 10, 1.1, "rgba(190,200,205,0.22)", 3, -6, false, 0.8);
      } else if (t === "fan") {
        const cx2 = X, cy2 = Y - 7;
        R(c, cx2 - 7, cy2 - 7, 14, 14, "#1d2127"); R(c, cx2 - 6, cy2 - 6, 12, 12, "#07090c");
        const an = tm * 5 + d.ph;
        c.fillStyle = "#3a4148";
        for (let k = 0; k < 4; k++) { const a = an + (k * Math.PI) / 2; for (let r = 1; r <= 5; r++) c.fillRect(Math.round(cx2 + Math.cos(a) * r - 0.5), Math.round(cy2 + Math.sin(a) * r - 0.5), 1, 1); }
        R(c, cx2 - 1, cy2 - 1, 2, 2, "#4a525a");
        for (let i = -6; i < 6; i += 3) R(c, cx2 + i, cy2 - 6, 1, 12, "rgba(30,34,40,0.6)");
      } else if (t === "camera") {
        const o = Math.round(Math.sin(tm * 0.6 + d.ph) * 1.5) * d.dir;
        R(c, X - 1, Y - 7, 2, 4, "#22272d"); R(c, X - 3, Y - 8, 6, 1, "#22272d");
        R(c, X - 5 + o, Y - 5, 10, 4, "#2a2f36"); R(c, X - 5 + o, Y - 5, 10, 1, "#3a4148");
        R(c, d.dir > 0 ? X + 4 + o : X - 6 + o, Y - 4, 2, 2, "#05070a");
        if ((tm + d.ph) % 1.4 < 0.7) { R(c, X - 3 + o, Y - 4, 1, 1, "#ff3040"); drawGlow(c, X - 3 + o, Y - 4, 4, "#ff3040", 0.4); }
      } else if (t === "wallmon") {
        R(c, X - 8, Y - 12, 16, 12, "#1a1e24"); R(c, X - 7, Y - 11, 14, 9, "#050c0e");
        const fr = Math.floor(tm * 2.5 + d.ph);
        c.globalAlpha = 0.75;
        for (let r = 0; r < 4; r++) { const w = 3 + ((fr * 7 + r * 13 + Math.floor(d.ph * 10)) % 9); R(c, X - 6, Y - 10 + r * 2, w, 1, d.col); }
        c.globalAlpha = 1;
        R(c, X - 1, Y - 1, 2, 3, "#1a1e24");
        drawGlow(c, X, Y - 7, 10, d.col, 0.13);
      } else if (t === "litwindow") {
        const on = Math.sin(tm * 0.5 + d.ph * 2) > -0.9 && !(Math.sin(tm * 11 + d.ph) > 0.97);
        R(c, X - 6, Y - 13, 12, 14, "#101318");
        c.globalAlpha = on ? 0.7 : 0.15; R(c, X - 5, Y - 12, 10, 12, d.col); c.globalAlpha = 1;
        R(c, X - 5, Y - 7, 10, 1, "#101318"); R(c, X, Y - 12, 1, 12, "#101318");
        if (on && d.ph > 6) { R(c, X - 4, Y - 5, 3, 3, "#0a0c10"); R(c, X - 5, Y - 2, 5, 2, "#0a0c10"); }
        if (on) drawGlow(c, X, Y - 6, 11, d.col, 0.12);
      } else if (t === "wallpipe") {
        R(c, X - 22, Y - 4, 44, 4, "#22272d"); R(c, X - 22, Y - 4, 44, 1, "#39414a");
        for (let i = -20; i < 22; i += 14) R(c, X + i, Y - 5, 2, 6, "#3a4148");
        if (Math.random() < 0.015) fx.p(d.x - 6 + Math.random() * 12, d.y - 4, (Math.random() - 0.5) * 8, -14, 1.2, "rgba(190,200,205,0.2)", 3, -4, false, 0.6);
      }
    }
  }
  drawForeground(c: Ctx, cx: number, cy: number, dt: number): void {
    const th = this.L.theme;
    if (th.fgCables) {
      c.strokeStyle = "#04060a"; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const span = 520; let x0 = ((i * 190 - cx * 1.3) % span + span) % span - 140; const y0 = -6 + ((i * 37) % 20) - (cy - this.L.G * T + 300) * 0.05;
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 110, y0 + 46 + i * 6, x0 + 220, y0 + 4); c.stroke();
        if (i === 1) { R(c, x0 + 104, y0 + 26, 1, 10, "#04060a"); R(c, x0 + 98, y0 + 36, 14, 8, "#04060a"); R(c, x0 + 100, y0 + 38, 10, 1, th.neon[1] || "#FF4CA8"); }
      }
    }
    this.bg.drawRain(c, dt, this.camDX);
    if (this.balcony > 0.05 && !th.indoor) { c.globalAlpha = this.balcony * 0.12; c.fillStyle = th.fog; c.fillRect(0, 0, view.w, view.h); c.globalAlpha = 1; }
    void cy;
  }
  darkCanvas: HTMLCanvasElement | null = null;
  drawDarkness(c: Ctx, cx: number, cy: number): void {
    if (!this.darkCanvas || this.darkCanvas.width !== view.w || this.darkCanvas.height !== view.h) this.darkCanvas = makeCanvas(view.w, view.h)[0];
    const d = this.darkCanvas.getContext("2d")!; d.imageSmoothingEnabled = false;
    d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, view.w, view.h);
    d.fillStyle = `rgba(2,3,7,${Math.min(0.97, this.darkNow * 0.97)})`; d.fillRect(0, 0, view.w, view.h);
    d.globalCompositeOperation = "destination-out";
    const st = stamp(); const s = stats();
    const L = (x: number, y: number, r: number, a: number) => { d.globalAlpha = Math.min(1, a); d.drawImage(st, Math.round(x - cx - r), Math.round(y - cy - r), Math.round(r * 2), Math.round(r * 2)); };
    const p = this.player;
    L(p.x, p.y - 14, s.lightR * (p.state === "dead" ? 0.6 : 1), 1);
    for (const l of this.fx.lights) L(l.x, l.y, l.r, l.a);
    for (const t of this.things) {
      if (t instanceof E.Terminal || t instanceof E.Checkpoint || t instanceof E.ShopKiosk) L(t.x, t.y - 14, 26, 0.7);
      if (t instanceof E.Exit) L(t.x, t.y - 20, 40, 0.8);
      if (t instanceof E.Elevator) L(t.x + 12, t.y - 16, 22, 0.5);
      if (t instanceof E.Pickup && t.kind === "shard") L(t.x, t.y, 20, 0.6);
    }
    for (const z of this.L.zones) if (z.kind === "lit" && z.id && this.lit[z.id] > 0) {
      const a = Math.min(1, this.lit[z.id] / 3) * (0.85 + Math.random() * 0.1); d.globalAlpha = a; d.fillStyle = "#000"; d.fillRect(Math.round(z.x - cx), Math.round(z.y - z.h - cy), z.w, z.h + 24);
    }
    for (const pr of this.projs) L(pr.x, pr.y, 16, 0.6);
    d.globalAlpha = 1; d.globalCompositeOperation = "source-over";
    c.drawImage(this.darkCanvas, 0, 0);
    // always-visible cues: enemy optics, pit edges near the player
    for (const e of this.enemies) if (!e.dead && e.d.elec) { const X = Math.round(e.x - cx + e.face * 3), Y = Math.round(e.y - cy - (e.flying ? 5 : e.h - 4)); if (X > 0 && X < view.w && Y > 0 && Y < view.h) { R(c, X, Y, 1, 1, e.kind === "stealth" ? "#a01828" : "#ff3040"); if (e.kind !== "stealth") drawGlow(c, X, Y, 4, "#ff3040", 0.5); } }
    const blink = 0.35 + 0.25 * Math.sin(this.time * 4);
    for (const ed of this.edges) { if (Math.abs(ed.x - p.x) > 150 || Math.abs(ed.y - p.y) > 120) continue; c.globalAlpha = blink; R(c, ed.x - cx - 1, ed.y - cy, 2, 1, "#FFB44A"); R(c, ed.x - cx, ed.y - cy - 3, 1, 3, "#FFB44A"); c.globalAlpha = 1; }
  }
  drawHud(c: Ctx): void {
    const p = this.player; const s = stats();
    // HP
    R(c, 4, 4, 66, 9, "#05070Ccc"); R(c, 5, 5, 64, 7, "#2a0a12");
    const hw = Math.max(0, Math.round((p.hp / p.maxHp) * 62)); R(c, 6, 6, hw, 5, p.hp / p.maxHp < 0.3 ? "#F04455" : "#48E6E0"); R(c, 6, 6, hw, 1, "#d8ffff");
    drawText(c, String(Math.max(0, Math.ceil(p.hp))), 72, 5, "#e8f4ff");
    for (let i = 0; i < p.shield; i++) R(c, 6 + i * 6, 14, 4, 3, "#9ffaf4");
    // EMP charges
    const ey = p.shield > 0 ? 19 : 15;
    for (let i = 0; i < s.empMax; i++) { const on = i < p.emp; R(c, 5 + i * 9, ey, 7, 7, "#05070Ccc"); R(c, 6 + i * 9, ey + 1, 5, 5, on ? "#48E6E0" : "#14303a"); if (!on && i === p.emp) R(c, 6 + i * 9, ey + 6 - Math.round(p.empCharge * 5), 5, Math.round(p.empCharge * 5), "#2a7a80"); R(c, 8 + i * 9, ey + 2, 1, 3, on ? "#05070C" : "#0a1a20"); }
    if (save.sidearm) { const gx = 7 + s.empMax * 9; R(c, gx, ey + 1, 8, 3, "#FF4CA8"); R(c, gx, ey + 4, 3, 3, "#FF4CA8"); }
    // shards
    for (let i = 0; i < 3; i++) { const x = view.w / 2 - 12 + i * 12, y = 9; const got = this.shards[i]; c.fillStyle = got ? "#48E6E0" : "#14303a"; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 3, y); c.lineTo(x, y + 5); c.lineTo(x - 3, y); c.closePath(); c.fill(); if (got) drawGlow(c, x, y, 8, "#48E6E0", 0.5); }
    // BTC & score
    drawText(c, `$${save.btc}`, view.w - 5, 5, "#FFB44A", 1, "right");
    drawText(c, String(save.score).padStart(7, "0"), view.w - 5, 15, "#e8f4ff", 1, "right");
    // level name + intro
    if (this.intro > 0) {
      const a = Math.min(1, this.intro, 3.2 - this.intro + 0.3); c.globalAlpha = Math.max(0, a);
      R(c, 0, view.h / 2 - 26, view.w, 44, "rgba(5,7,12,0.8)"); R(c, 0, view.h / 2 - 26, view.w, 1, "#48E6E0"); R(c, 0, view.h / 2 + 17, view.w, 1, "#FF4CA8");
      drawText(c, `SECTOR ${String(this.cfg.num).padStart(2, "0")}`, view.w / 2, view.h / 2 - 21, "#FF4CA8", 1, "center");
      drawText(c, this.cfg.name, view.w / 2, view.h / 2 - 11, "#48E6E0", this.cfg.name.length > 25 ? 1 : 2, "center");
      drawText(c, this.cfg.intro, view.w / 2, view.h / 2 + 6, "#c8d0e0", 1, "center");
      c.globalAlpha = 1;
    }
    // banners
    this.banners.forEach((b, i) => { c.globalAlpha = Math.min(1, b.t * 3); const y = 40 + i * 12; const w = textWidth(b.s) + 10; R(c, view.w / 2 - w / 2, y - 2, w, 11, "rgba(5,7,12,0.75)"); drawText(c, b.s, view.w / 2, y, b.col, 1, "center"); c.globalAlpha = 1; });
    // boss bar
    if (this.boss && this.boss.awake && !this.boss.dead) {
      const bw = 160, x = view.w / 2 - bw / 2, y = view.h - 14;
      R(c, x - 1, y - 1, bw + 2, 7, "#05070C"); R(c, x, y, bw, 5, "#2a0a12"); R(c, x, y, Math.round((this.boss.hp / this.boss.max) * bw), 5, "#F04455");
      if (this.boss.shielded()) R(c, x, y, bw, 2, "#48E6E0");
      drawText(c, this.boss.name, view.w / 2, y - 10, "#F04455", 1, "center");
    }
    // context prompt
    if (this.player.state === "dead") { drawText(c, "SIGNAL LOST", view.w / 2, view.h / 2 - 4, "#F04455", 2, "center"); }
  }
  drawHack(c: Ctx): void {
    const h = this.hack!; const w = Math.min(240, view.w - 20), x = Math.round(view.w / 2 - w / 2), y = Math.round(view.h * 0.62);
    R(c, x, y, w, 58, "rgba(5,7,12,0.92)"); R(c, x, y, w, 1, "#48E6E0"); R(c, x, y + 57, w, 1, "#FF4CA8"); R(c, x, y, 1, 58, "#48E6E0"); R(c, x + w - 1, y, 1, 58, "#FF4CA8");
    drawText(c, `BREACH: ${h.term.label}`, x + 6, y + 5, "#48E6E0");
    drawText(c, `NODE ${Math.min(h.idx + 1, h.nodes)}/${h.nodes}`, x + w - 6, y + 5, "#FFB44A", 1, "right");
    const bx = x + 8, by = y + 20, bw = w - 16;
    R(c, bx, by, bw, 12, h.flash > 0 ? "#3a0a12" : "#0e1624"); R(c, bx + Math.round(h.ws * bw), by, Math.round(h.ww * bw), 12, "#1f6e5a"); R(c, bx + Math.round(h.ws * bw), by, Math.round(h.ww * bw), 1, "#7affc8");
    for (let i = 0; i < bw; i += 8) R(c, bx + i, by + 12, 1, 2, "#2a3446");
    const px = bx + Math.round(h.pos * bw); R(c, px - 1, by - 3, 3, 18, "#ffffff"); drawGlow(c, px, by + 6, 10, "#48E6E0", 0.7);
    for (let i = 0; i < h.nodes; i++) R(c, x + 8 + i * 10, y + 38, 7, 4, i < h.idx ? "#48E6E0" : "#1a2a36");
    for (let i = 0; i < 3; i++) R(c, x + w - 12 - i * 10, y + 38, 7, 4, i < h.traces ? "#F04455" : "#2a1a20");
    drawText(c, "TRACE", x + w - 40, y + 46, "#F04455");
    const msg = h.done > 0 ? "ACCESS GRANTED" : h.fail > 0 ? "TRACED!" : (input.coarse || input.lastTouch ? "TAP HACK IN THE GREEN" : "ENTER/SPACE IN THE GREEN");
    drawText(c, msg, x + 8, y + 46, h.done > 0 ? "#7affc8" : h.fail > 0 ? "#F04455" : "#c8d0e0");
  }
}
