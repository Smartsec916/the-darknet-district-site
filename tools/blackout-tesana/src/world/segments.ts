// Reusable level segments. Coordinates: x in tiles from the segment's left edge, `up` in tiles above street level.
// Physics budget (see player.ts): comfortable jump = 5 tiles up / 6 tiles across.
import { B, M } from "./level";

type SegFn = (b: B, p: any) => void;
const ad = (b: B, i: number) => b.th.ads[i % b.th.ads.length];
const neon = (b: B, i: number) => b.th.neon[i % b.th.neon.length];

function start(b: B): void {
  b.width(24); b.floor(0, 24);
  b.e("spawn", 3, 0);
  b.fac(b.th.indoor ? "wall" : "building", 0, 0, 24, 11, { seed: 1 });
  b.deco("sign", 12, 9, { text: `SECTOR ${String(b.cfg.num).padStart(2, "0")}`, col: neon(b, 0) });
  b.block(15, 2, 4, 2, M.CONTAINER);
  b.coins(8, 0, 3);
  if (b.cfg.num === 1) { b.deco("hint", 7, 4, { text: "MOVE" }); b.deco("hint", 17, 5, { text: "JUMP" }); }
  if (b.cfg.tip) b.deco("hint", 12, 6, { text: b.cfg.tip, small: true });
}
function cp(b: B): void {
  b.width(12); b.floor(0, 12);
  b.fac(b.th.indoor ? "wall" : "building", 0, 0, 12, 8, { seed: 2 });
  b.e("checkpoint", 6, 0, { id: b.id("cp") });
}
function exit(b: B): void {
  b.width(22); b.floor(0, 22);
  b.fac("exitgate", 10, 0, 9, 9);
  b.e("exit", 14.5, 0);
  b.block(20, 40, 2, 40, M.METAL);
}
function steps(b: B): void {
  b.width(32); b.floor(0, 32);
  b.fac(b.th.indoor ? "wall" : "building", 1, 0, 30, 13, { seed: 3 });
  b.ledge(4, 2, 4); b.ledge(9, 4, 4, M.PIPE); b.ledge(14, 6, 5);
  b.block(21, 3, 3, 3, M.AC); b.ledge(26, 5, 4, M.PIPE);
  b.ledge(17, 10, 4, M.BEAM);
  b.coins(4.5, 2, 2); b.coins(9.5, 4, 2); b.coins(15, 6, 3);
  b.shard(18.5, 10, 2); b.shard(27.5, 5, 0.5);
  b.spot(24, 0); b.spot(29, 0); b.air(20, 9);
}
function gaps(b: B, p: any): void {
  const n = p.n ?? 2 + b.rr(0, 2); const gw = p.gw ?? 2 + b.rr(0, 3);
  b.floor(0, 6); let x = 6;
  b.fac(b.th.indoor ? "wall" : "ruin", 0, 0, 6, 10, { seed: 4 });
  for (let i = 0; i < n; i++) {
    const wide = (p.mplat ?? b.d > 0.4) && i === n - 1;
    if (wide) { b.e("mplat", x + 1, 0, { w: 3, dx: 5, dy: 0, speed: 24 + 20 * b.d, skin: "lift" }); x += 10; }
    else x += Math.min(6, gw + (i % 2));
    const isl = 5 + b.rng.int(0, 3); const up = (i % 2 === 1 && b.d > 0.25) ? 2 : 0;
    b.floor(x, x + isl, up);
    b.fac(b.th.indoor ? "wall" : "ruin", x, up, isl, 8, { seed: 5 + i });
    b.coins(x + 1, up, 2);
    if (i > 0 || b.d > 0.3) b.spot(x + isl / 2, up);
    if (b.d > 0.55) b.air(x + isl / 2, up + 7);
    x += isl;
  }
  b.floor(x, x + 4); b.width(x + 4);
}
function elevatorIntro(b: B): void {
  b.width(28); b.floor(0, 28);
  b.fac("shaft", 8, 0, 5, 21);
  b.e("elevator", 9, 0, { id: b.id("el"), stops: [0, 16], style: "freight" });
  b.slab(12, 16, 14, M.CONCRETE, 2);
  b.fac(b.th.indoor ? "wall" : "building", 12, 16, 14, 12, { seed: 6 });
  b.deco("railing", 14, 16, { w: 12 });
  b.coins(14, 16, 5);
  b.shard(23, 16, 2);
  b.deco("hint", 10.5, 5, { text: "RIDE: HACK" });
  b.zone("balcony", 12, 16, 14, 14);
  b.spot(20, 0);
}
function tower(b: B): void {
  b.width(36); b.floor(0, 36);
  b.fac("tower", 5, 0, 27, 30, { seed: 7 });
  const col = b.d > 0.55;
  b.ledge(6, 5, 8);
  if (col) b.e("collapse", 17, 10, { w: 5 }); else b.ledge(17, 10, 8);
  b.ledge(7, 15, 8);
  if (col) b.e("collapse", 18, 20, { w: 5 }); else b.ledge(18, 20, 8);
  b.ledge(7, 25, 8);
  b.ledge(5, 30, 27, M.CONCRETE);
  for (const [x, up, w] of [[6, 5, 8], [17, 10, 8], [7, 15, 8], [18, 20, 8], [7, 25, 8]]) b.deco("railing", x, up, { w, back: true });
  b.deco("railing", 5, 30, { w: 27 });
  b.fac("shaft", 31, 0, 5, 33);
  b.e("elevator", 32, 0, { id: b.id("el"), stops: [0, 30], style: "glass" });
  b.coins(8, 30, 6, 3); b.coins(19, 10, 3); b.coins(9, 15, 3);
  b.shard(20, 30, 3);
  b.deco("antenna", 12, 30); b.deco("acunit", 24, 30);
  b.zone("balcony", 5, 30, 31, 16);
  b.spot(10, 0); b.air(20, 17); b.spot(26, 30);
}
function rooftops(b: B): void {
  const g = 3 + b.rr(0, 3);
  let x = 4;
  b.floor(0, 4);
  b.fac("shaft", 0, 0, 5, 21);
  b.e("elevator", 1, 0, { id: b.id("el"), stops: [0, 18], style: "exterior" });
  const roofs: [number, number][] = [[18, 11], [20, 10], [17, 10]];
  let first = true;
  for (const [up, w] of roofs) {
    if (!first) x += g;
    b.slab(x, up, w, M.CONCRETE, 2);
    b.fac("building", x, 0, w, up, { seed: 8 + x, arcade: true });
    b.deco("railing", x, up, { w, back: true });
    b.coins(x + 2, up, 3, 2);
    b.air(x + w / 2, up + 6);
    if (up === 20) b.shard(x + w / 2, up, 2);
    if (first) b.deco("acunit", x + 7, up);
    x += w; first = false;
  }
  b.ledge(x, 12, 4); b.ledge(x + 5, 7, 4);
  x += 10;
  b.floor(4, x);
  b.spot(10, 0); b.spot(25, 0); b.spot(38, 0);
  b.zone("balcony", 4, 17, x - 4, 16);
  b.width(x);
}
function underpass(b: B): void {
  b.width(40);
  b.floor(0, 40, -10);
  b.slab(0, 0, 6, b.th.mats.ground, 3); b.slab(10, 0, 18, b.th.mats.ground, 3); b.slab(31, 0, 9, b.th.mats.ground, 3);
  b.block(16, 40, 3, 40, M.BRICK);
  b.fac(b.th.indoor ? "wall" : "building", 10, 0, 6, 14, { seed: 9 });
  b.fac("tunnel", 0, -3, 40, 7);
  b.deco("hint", 8, 4, { text: "MAINTENANCE" });
  b.deco("arrowDown", 8, 2);
  b.fac("shaft", 27, -10, 5, 12);
  b.e("elevator", 28, -10, { id: b.id("el"), stops: [-10, 0], style: "maint" });
  b.e("lamp", 12, -4, { col: "#FFB44A" }); b.e("lamp", 24, -4, { col: "#FFB44A" });
  b.coins(11, -10, 5);
  b.spot(20, -10); b.shard(4, -10, 1.5);
  b.zone("dim", 0, -3, 40, 8);
}
function terminalDoor(b: B): void {
  b.width(26); b.floor(0, 26);
  b.fac(b.th.indoor ? "wall" : "building", 0, 0, 16, 12, { seed: 10 });
  b.block(17, 40, 2, 34, M.METAL);
  const id = b.id("door");
  b.e("door", 17, 0, { id, w: 2, h: 6 });
  const links = [id];
  if (b.d > 0.45) { const tid = b.id("tur"); b.enemySpots.push({ x: b.px(15.5), y: b.py(10), kind: "wall", force: "turret" }); b.L.ents.push({ t: "linkTurret", x: b.px(15.5), y: b.py(10), id: tid }); links.push(tid); }
  b.e("terminal", 11, 0, { links, label: "SECURITY DOOR" });
  b.coins(4, 0, 3); b.spot(7, 0);
}
function laserHall(b: B): void {
  b.width(38); b.floor(0, 38);
  b.slab(3, 8, 32, b.th.mats.slab, 2);
  b.fac("wall", 3, 0, 32, 6, { seed: 11, interior: true });
  b.ledge(0, 5, 3, M.PIPE);
  const ids: string[] = [];
  const xs = b.d > 0.35 ? [9, 14, 19, 24, 29, 33] : [10, 17, 24, 31];
  xs.forEach((x, i) => { const id = b.id("las"); ids.push(id); b.e("laser", x, 0, { id, h: 6, period: 2.8 - b.d * 0.6, on: 1.0 + b.d * 0.3, phase: i * 0.45 }); });
  b.e("terminal", 5.5, 0, { links: ids, label: "LASER GRID" });
  b.coins(12, 0, 6, 3);
  b.shard(18, 8, 2); b.air(14, 12); b.air(26, 12);
}
function steamWorks(b: B): void {
  b.width(38); b.floor(0, 38);
  b.fac(b.th.indoor ? "wall" : "factory", 0, 0, 38, 14, { seed: 12 });
  [8, 14, 20, 26, 32].forEach((x, i) => b.e("steam", x, 0, { dir: "up", h: 5, period: 2.9 - b.d * 0.6, phase: i * 0.55 }));
  b.ledge(10, 6, 6, M.PIPE); b.ledge(22, 6, 6, M.PIPE);
  b.coins(11, 6, 3); b.coins(23, 6, 3);
  b.spot(17, 0); b.spot(35, 0); b.shard(25, 6, 1);
}
function moving(b: B): void {
  b.width(38);
  b.floor(0, 6);
  const sp = 22 + b.d * 18;
  b.e("mplat", 7, 0, { w: 4, dx: 6, dy: 0, speed: sp });
  b.block(20, 2, 3, 99, M.METAL);
  b.e("mplat", 25, 1, { w: 3, dx: 0, dy: 5, speed: sp * 0.8, phase: 0.5 });
  b.block(30, 4, 4, 99, M.METAL);
  b.floor(34, 38);
  b.coins(21, 2, 1); b.coins(31, 4, 2);
  if (b.d > 0.5) b.air(21, 9);
  b.fac(b.th.indoor ? "wall" : "ruin", 0, 0, 6, 9, { seed: 13 });
}
function collapse(b: B): void {
  const sp = b.d > 0.5 ? 6 : 5;
  b.floor(0, 4);
  const ups = [0, 1, 0, 2, 1];
  let x = 5;
  for (let i = 0; i < 5; i++) { b.e("collapse", x, ups[i], { w: 3 }); b.coins(x + 1, ups[i], 1); x += sp; }
  x += 0;
  b.floor(x, x + 4); b.width(x + 4);
  b.deco("hint", 3, 5, { text: "UNSTABLE", small: true });
}
function pistons(b: B): void {
  b.width(38); b.floor(0, 38);
  b.slab(2, 7, 34, b.th.mats.slab, 2);
  b.fac("wall", 2, 0, 34, 5, { seed: 14, interior: true });
  [8, 15, 22, 29].forEach((x, i) => b.e("piston", x, 5, { w: 3, h: 5, period: 2.7 - b.d * 0.5, phase: i * 0.7 }));
  b.coins(12, 0, 2); b.coins(19, 0, 2); b.coins(26, 0, 2);
}
function vertShaft(b: B): void {
  b.width(32); b.floor(0, 32);
  b.fac("shaftwall", 0, 0, 32, 36, { seed: 15 });
  b.block(24, 32, 3, 32, M.METAL);
  b.ledge(2, 5, 7); b.ledge(12, 10, 7); b.ledge(3, 15, 7);
  if (b.d > 0.5) b.e("mplat", 12, 20, { w: 4, dx: 4, dy: 0, speed: 20 + b.d * 10 }); else b.ledge(13, 20, 6);
  b.ledge(4, 25, 7); b.ledge(14, 30, 7);
  if (b.d > 0.5) { b.e("arc", 12, 12, { w: 7, period: 3.2, on: 1.0, phase: 0 }); b.e("arc", 4, 27, { w: 7, period: 3.2, on: 1.0, phase: 1.6 }); }
  b.coins(5, 15, 3); b.coins(15, 30, 3);
  b.shard(25, 32, 2);
  b.air(9, 20); b.air(18, 27);
  b.deco("hint", 20, 4, { text: "CLIMB", small: true });
}
function balcony(b: B, p: any): void {
  b.width(30); b.floor(0, 30);
  b.fac("tower", 2, 0, 26, 30, { seed: 16 });
  b.fac("shaft", 2, 0, 5, 25);
  b.e("elevator", 3, 0, { id: b.id("el"), stops: [0, 22], style: "glass" });
  b.slab(6, 22, 20, M.GLASS);
  b.deco("railing", 6, 22, { w: 20 });
  b.deco("sign", 16, 27, { text: ad(b, 2), col: neon(b, 1), big: true });
  b.zone("balcony", 2, 22, 28, 18, { vista: true });
  b.coins(8, 22, 5, 3);
  if (p.shard !== false) b.shard(22, 22, 1.5);
  b.npc(12, 22); b.npc(19, 22);
}
function bazaarStreet(b: B): void {
  b.width(50); b.floor(0, 50);
  b.fac("building", 0, 5, 50, 24, { seed: 17, dense: true });
  const stores = [[1, 10], [13, 10], [27, 10], [39, 10]];
  stores.forEach(([x, w], i) => { b.fac("store", x, 0, w, 5, { text: ad(b, b.segIndex * 2 + i), col: neon(b, i) }); b.ledge(x + 1, 5, w - 2, M.AWNING); });
  b.ledge(0, 10, 22, M.CATWALK); b.ledge(28, 10, 22, M.CATWALK);
  b.deco("railing", 0, 10, { w: 22, back: true }); b.deco("railing", 28, 10, { w: 22, back: true });
  b.fac("shaft", 22, 0, 5, 20);
  b.e("elevator", 23, 0, { id: b.id("el"), stops: [0, 10, 17], style: "glass" });
  b.ledge(9, 14, 4, M.SIGN); b.ledge(38, 14, 4, M.SIGN);
  b.deco("sign", 11, 15.5, { text: ad(b, b.segIndex + 3), col: neon(b, 2), hang: true });
  b.deco("sign", 40, 15.5, { text: ad(b, b.segIndex + 4), col: neon(b, 3), hang: true });
  b.ledge(6, 17, 15, M.CATWALK); b.ledge(29, 17, 16, M.CATWALK);
  b.deco("railing", 6, 17, { w: 15, back: true }); b.deco("railing", 29, 17, { w: 16, back: true });
  b.deco("vsign", 26.5, 24, { text: ad(b, b.segIndex + 1), col: neon(b, 0) });
  b.deco("vent", 12, 0); b.deco("vent", 35, 0);
  b.npc(5, 0); b.npc(19, 0); b.npc(33, 0); b.npc(46, 0); b.npc(10, 10); b.npc(36, 10); b.npc(14, 17);
  b.spot(15, 0); b.spot(42, 0); b.spot(12, 10);
  b.coins(8, 17, 4, 3); b.coins(31, 17, 4, 3);
  b.shard(41, 17, 2);
  b.zone("balcony", 6, 17, 40, 12);
}
function shop(b: B): void {
  b.width(22); b.floor(0, 22);
  b.fac("shopfront", 4, 0, 14, 10);
  b.e("shop", 11, 0);
  b.coins(2, 0, 2);
}
function trainLane(b: B): void {
  b.width(50); b.floor(0, 7); b.floor(7, 43, -4); b.floor(43, 50);
  b.fac("station", 0, 0, 7, 12); b.fac("station", 43, 0, 7, 12);
  b.fac("tracks", 7, -4, 36, 12);
  [10, 19, 28, 37].forEach((x) => { b.ledge(x, 2, 4, M.CATWALK); b.deco("chains", x, 2, { w: 4 }); });
  b.e("train", 7, -4, { span: 36, period: 7.5 - b.d * 1.5, phase: 3 });
  b.e("shockfloor", 7, -4, { w: 36, period: 4.2, on: 1.2, phase: 0, rails: true });
  b.coins(11, 2, 2); b.coins(29, 2, 2);
  b.deco("hint", 3, 5, { text: "TRAINS!", small: true });
}
function trainCars(b: B): void {
  b.width(46); b.floor(0, 6); b.floor(6, 40, -4); b.floor(40, 46);
  b.fac("tracks", 6, -4, 34, 10);
  b.block(8, 2, 8, 6, M.TRAIN); b.block(21, 2, 8, 6, M.TRAIN); b.block(34, 2, 6, 6, M.TRAIN);
  b.e("shockfloor", 6, -4, { w: 34, period: 3.6, on: 1.3, phase: 1, rails: true });
  b.ledge(12, 9, 10, M.BEAM);
  b.shard(17, 9, 2);
  b.spot(11, 2); b.spot(24, 2); b.coins(9, 2, 3); b.coins(22, 2, 3);
}
function lifts(b: B): void {
  b.width(36); b.floor(0, 4);
  b.fac("shaftwall", 0, -6, 36, 30, { seed: 18 });
  [5, 12, 19, 26].forEach((x, i) => b.e("mplat", x, -5, { w: 3, dx: 0, dy: 11, speed: 20 + b.d * 12, phase: i * 0.27, skin: "lift" }));
  b.block(31, 6, 5, 99, M.METAL);
  b.coins(13, 4, 1); b.coins(27, 6, 1);
  b.air(16, 10);
}
function serverAisles(b: B): void {
  b.width(50);
  b.floor(0, 9); b.floor(13, 22); b.floor(26, 35); b.floor(39, 50);
  b.fac("serverwall", 0, 0, 50, 16, { seed: 19 });
  b.block(4, 4, 3, 4, M.SERVER); b.block(16, 5, 3, 5, M.SERVER); b.block(29, 4, 3, 4, M.SERVER); b.block(44, 5, 3, 5, M.SERVER);
  b.ledge(18, 9, 8, M.GRATE); b.ledge(27, 13, 4, M.GRATE);
  b.e("lamp", 10.5, 6, { col: "#F04455" }); b.e("lamp", 24, 5, { col: "#F04455" }); b.e("lamp", 37, 6, { col: "#F04455" });
  const zid = b.id("lit");
  b.zone("lit", 0, -2, 50, 18, { id: zid });
  b.e("terminal", 2, 0, { links: [zid], label: "AISLE POWER" });
  b.e("sparker", 22, 8); b.e("sparker", 41, 7);
  b.shard(28.5, 13, 2);
  b.spot(20, 0); b.spot(42, 0); b.air(31, 8);
  b.coins(14, 0, 3); b.coins(19, 9, 3);
}
function darkLift(b: B): void {
  b.width(34); b.floor(0, 20); b.floor(24, 34);
  b.fac("serverwall", 0, 0, 34, 26, { seed: 20 });
  b.fac("shaft", 2, 0, 5, 22);
  const eid = b.id("el"), hid = b.id("hid");
  b.e("elevator", 3, 0, { id: eid, stops: [0, 18], style: "maint", locked: true });
  b.slab(6, 18, 10, M.METAL);
  b.e("hidden", 18, 19, { w: 3, id: hid }); b.e("hidden", 24, 20, { w: 3, id: hid });
  b.ledge(29, 20, 4, M.GRATE);
  b.e("terminal", 8.5, 0, { links: [eid, hid], label: "LIFT POWER" });
  b.e("lamp", 22, 5, { col: "#F04455" });
  b.coins(8, 18, 3); b.shard(30.5, 20, 3);
  b.spot(28, 0); b.air(12, 10);
}
function fans(b: B): void {
  b.width(44); b.floor(0, 8); b.floor(8, 20, -2); b.floor(20, 44);
  b.fac("wall", 0, 0, 44, 18, { seed: 21 });
  b.e("shockfloor", 8, -2, { w: 12, period: 3.6, on: 1.2, phase: 0, water: true });
  b.ledge(10, 3, 3, M.PIPE); b.ledge(15, 3, 3, M.PIPE);
  b.e("rotor", 30, 4, { len: 26, speed: 1.0 + b.d * 0.5 });
  b.e("updraft", 36, 0, { w: 3, h: 16 });
  b.ledge(38, 14, 5, M.CATWALK);
  b.shard(40, 14, 2); b.coins(39, 14, 2);
  b.spot(23, 0);
}
function conveyor(b: B): void {
  b.width(40); b.floor(0, 40);
  b.fill(4, b.G, 15, 1, 1, M.CONV_R); b.fill(22, b.G, 15, 1, 1, M.CONV_L);
  b.slab(20, 8, 18, b.th.mats.slab, 2);
  b.fac("wall", 0, 0, 40, 10, { seed: 22, interior: true });
  b.e("steam", 12, 0, { dir: "up", h: 5, period: 2.6, phase: 0 });
  b.e("piston", 30, 6, { w: 3, h: 6, period: 2.6 - b.d * 0.4, phase: 0.8 });
  b.coins(6, 0, 3); b.coins(23, 0, 3);
  b.spot(26, 0);
}
function arcFence(b: B): void {
  b.width(40); b.floor(0, 40);
  b.fac("fence", 0, 0, 40, 6);
  b.e("arc", 6, 1, { w: 4, period: 2.4, on: 0.9, phase: 0 });
  b.e("arc", 16, 0, { vert: true, h: 6, period: 2.6, on: 1.0, phase: 0.6 });
  b.slab(15, 7, 3, M.METAL, 1);
  b.ledge(20, 5, 10, M.CATWALK);
  b.e("steam", 24, 5, { dir: "up", h: 4, period: 2.8, phase: 1 });
  b.e("arc", 32, 1, { w: 4, period: 2.2, on: 0.9, phase: 1.2 });
  b.coins(21, 5, 4, 2); b.spot(12, 0); b.spot(36, 0);
}
function bossArena(b: B, p: any): void {
  b.width(46); b.floor(0, 46);
  b.fac("arena", 3, 0, 41, 30);
  b.block(3, 40, 2, 33, M.METAL); b.block(42, 40, 2, 33, M.METAL);
  b.e("arenaDoor", 3, 0, { id: "adL", h: 7, open: true });
  b.e("arenaDoor", 42, 0, { id: "adR", h: 7, open: false });
  b.ledge(10, 5, 6, M.CATWALK); b.ledge(30, 5, 6, M.CATWALK); b.ledge(19, 10, 8, M.CATWALK);
  b.e("boss", 26, 0, { kind: p.boss || "warden" });
  b.zone("arena", 5, 0, 37, 30);
  b.e("medkit", 23, 10);
}
function overseerArena(b: B): void {
  b.width(48); b.floor(0, 48);
  b.fac("arena", 3, 0, 42, 40);
  b.block(3, 40, 2, 33, M.METAL); b.block(45, 40, 2, 33, M.METAL);
  b.e("arenaDoor", 3, 0, { id: "adL", h: 7, open: true });
  b.e("arenaDoor", 45, 0, { id: "adR", h: 7, open: false });
  b.ledge(6, 5, 7, M.CATWALK); b.ledge(36, 5, 7, M.CATWALK);
  b.ledge(13, 10, 6, M.CATWALK); b.ledge(30, 10, 6, M.CATWALK);
  b.ledge(20, 15, 9, M.CATWALK); b.ledge(6, 15, 7, M.CATWALK); b.ledge(36, 15, 7, M.CATWALK);
  b.e("collapse", 13, 20, { w: 4 }); b.e("collapse", 32, 20, { w: 4 });
  b.e("terminal", 9, 15, { mode: "boss", label: "SHIELD NODE" }); b.e("terminal", 39.5, 15, { mode: "boss", label: "SHIELD NODE" }); b.e("terminal", 24.5, 15, { mode: "boss", label: "SHIELD NODE" });
  b.e("boss", 24.5, 24, { kind: "overseer" });
  b.zone("arena", 5, 0, 40, 40);
  b.e("medkit", 14.5, 10); b.e("medkit", 32.5, 10);
}
function armoryPickup(b: B): void {
  b.width(30); b.floor(0, 30);
  b.fac("armory", 0, 0, 30, 12);
  b.block(14, 1, 3, 1, M.METAL);
  b.e("sidearm", 15.5, 1);
  b.air(25, 5, "drone");
  b.coins(4, 0, 3);
}
function ambush(b: B): void {
  b.width(32); b.floor(0, 32);
  b.fac(b.th.indoor ? "wall" : "building", 0, 0, 32, 14, { seed: 23 });
  b.ledge(6, 5, 5); b.ledge(22, 5, 5);
  b.e("ambush", 16, 0, { count: 2 + b.rr(0, 2) });
  b.coins(13, 0, 3);
}
function camerasHall(b: B): void {
  b.width(44); b.floor(0, 44);
  b.slab(2, 9, 40, b.th.mats.slab, 2);
  b.fac("wall", 2, 0, 40, 7, { seed: 24, interior: true });
  b.ledge(0, 5, 2, M.PIPE);
  const ids: string[] = [];
  [10, 22, 34].forEach((x) => { const id = b.id("cam"); ids.push(id); b.e("camera", x, 7, { id }); });
  [16, 28].forEach((x, i) => { const id = b.id("las"); ids.push(id); b.e("laser", x, 0, { id, h: 7, period: 2.6, on: 1.1, phase: i * 1.3 }); });
  b.e("terminal", 5, 0, { links: ids, label: "SURVEILLANCE" });
  b.coins(12, 0, 5, 4); b.shard(22, 9, 1.5); b.air(20, 13); b.spot(38, 0);
}
function debrisRun(b: B): void {
  b.width(40); b.floor(0, 12); b.floor(16, 27); b.floor(31, 40);
  b.fac("serverwall", 0, 0, 40, 14, { seed: 25, broken: true });
  [8, 20, 34].forEach((x) => b.e("debris", x, 12));
  b.e("steam", 22, 0, { dir: "up", h: 4, period: 2.4, phase: 0.4, fire: true });
  b.e("collapse", 12.5, 3, { w: 3 });
  b.coins(13, 3, 1); b.spot(25, 0); b.air(18, 9);
}
function damagedElevator(b: B): void {
  b.width(34); b.floor(0, 34);
  b.fac("shaft", 7, 0, 5, 28);
  b.block(12, 23, 2, 23, M.METAL);
  const eid = b.id("el");
  b.e("elevator", 8, 0, { id: eid, stops: [0, 12, 24], style: "damaged", fault: 12 });
  b.ledge(3, 12, 5, M.GRATE);
  b.e("terminal", 5, 12, { links: [eid], label: "LIFT POWER" });
  b.slab(11, 24, 10, M.METAL);
  b.deco("railing", 14, 24, { w: 7 });
  b.coins(15, 24, 3); b.spot(28, 0);
}
function catwalks(b: B): void {
  b.width(40); b.floor(0, 6); b.floor(6, 34, -2); b.floor(34, 40);
  b.fac(b.th.indoor ? "wall" : "factory", 0, 0, 40, 16, { seed: 26 });
  b.e("shockfloor", 6, -2, { w: 28, period: 3.0, on: 1.4, phase: 0.5, water: b.th.key === "cooling" });
  b.ledge(5, 3, 8, M.CATWALK); b.ledge(15, 6, 6, M.CATWALK); b.ledge(23, 3, 8, M.CATWALK);
  b.ledge(16, 12, 4, M.BEAM); b.shard(17.5, 12, 1.5);
  b.coins(16, 6, 3); b.air(19, 10); b.spot(37, 0);
}

export const SEGMENTS: Record<string, SegFn> = {
  start, cp, exit, steps, gaps, elevatorIntro, tower, rooftops, underpass, terminalDoor, laserHall, steamWorks, moving,
  collapse, pistons, vertShaft, balcony, bazaarStreet, shop, trainLane, trainCars, lifts, serverAisles, darkLift, fans,
  conveyor, arcFence, bossArena, overseerArena, armoryPickup, ambush, camerasHall, debrisRun, damagedElevator, catwalks,
};
