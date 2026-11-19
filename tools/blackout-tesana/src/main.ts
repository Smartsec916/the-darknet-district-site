// BLACKOUT PROTOCOL — boot, screen flow, menus and the Byte Bazaar.
import { initView, view, resize } from "./engine/view";
import { initInput, input, setTouchVisible } from "./engine/input";
import { unlockAudio, setMuted, sfx, playTheme, stopTheme } from "./engine/audio";
import { drawText, wrapText } from "./engine/font";
import { buildCast, SHEETS, drawSheet } from "./art/humanoid";
import { Background } from "./art/backgrounds";
import { THEMES } from "./world/themes";
import { LEVELS } from "./world/levels";
import { World, Summary } from "./game/world";
import { save, persist, resetSave, SHOP, tier, statOf, ShopItem } from "./game/state";
import { ui, panel, R, icon } from "./ui/ui";
import { drawGlow, desaturate } from "./game/fx";
import { Attract } from "./game/demo";
import { loadAdsFor } from "./art/ads";
import { loadBackdrops } from "./art/backgrounds";
import { loadFemale } from "./art/female";
import { hires } from "./engine/hires";
import { initIntegration, startTesanaRun, recordTesanaLevel } from "./integration";

type Screen = "title" | "map" | "play" | "results" | "ending" | "confirmNew";
let screen: Screen = "title";
let world: World | null = null;
let overlay: "none" | "pause" | "shop" | "options" = "none";
let shopFrom: "game" | "menu" = "menu";
let shopSel = 0; let shopConfirm: ShopItem | null = null; let shopMsg = ""; let shopMsgT = 0;
let summary: Summary | null = null;
let titleBg: Background; let cityBg: Background; let titleT = 0; let endT = 0;
let started = false;
const attract = new Attract();

function applyFx(): void { view.fx = { ...save.fx }; resize(); }
function boot(): void {
  initView(); initInput(); applyFx();
  buildCast();
  hires.init(); loadBackdrops(); loadFemale(); void loadAdsFor("undergrid");
  setMuted(save.muted);
  titleBg = new Background(THEMES.title); cityBg = new Background(THEMES.bazaar);
  input.gestureCbs.push(() => { unlockAudio(); if (!started) { started = true; ui.reset(); if (screen === "title") playTheme(THEMES.bazaar.sound); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden && screen === "play" && overlay === "none") openPause(); });
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    input.update();
    frame(dt);
    input.endFrame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function go(s: Screen): void { screen = s; ui.reset(); }
function openPause(): void { overlay = "pause"; ui.reset(); }

function startLevel(idx: number, resume: boolean): void {
  attract.stop();
  world = new World(idx, { complete: onComplete, openShop: () => { overlay = "shop"; shopFrom = "game"; shopSel = 0; shopConfirm = null; ui.reset(); } }, resume);
  overlay = "none"; go("play");
}
function onComplete(s: Summary): void {
  summary = s; recordTesanaLevel(s);
  go("results");
}

function frame(dt: number): void {
  const c = view.ctx;
  hires.frameStart();
  ui.begin(dt);
  setTouchVisible(screen === "play" && overlay === "none", { fire: save.sidearm });
  switch (screen) {
    case "title": drawTitle(c, dt); break;
    case "confirmNew": drawTitle(c, dt, true); break;
    case "map": drawMap(c, dt); break;
    case "play": drawPlay(c, dt); break;
    case "results": drawResults(c, dt); break;
    case "ending": drawEnding(c, dt); break;
  }
  ui.end();
  hires.compose();
}

// ---------------- title ----------------
function cityBackdrop(c: CanvasRenderingContext2D, dt: number, dark = false): void {
  titleT += dt;
  if (dark) {
    titleBg.draw(c, titleT * 18, 300 + Math.sin(titleT * 0.2) * 20, 448, dt);
    desaturate(c, view.w, view.h, 0.35, 0.1);
    titleBg.drawRain(c, dt, 0.3);
    R(c, 0, view.h - 26, view.w, 26, "#07090c"); R(c, 0, view.h - 26, view.w, 1, "#5a3a22");
    for (let i = 0; i < view.w; i += 16) R(c, (i - titleT * 18) % view.w + (i - titleT * 18 < 0 ? view.w : 0), view.h - 25, 6, 1, "#1a1c20");
    const g = c.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.35, view.w / 2, view.h / 2, view.w * 0.7); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(2,4,8,0.6)"); c.fillStyle = g; c.fillRect(0, 0, view.w, view.h);
    return;
  }
  cityBg.draw(c, titleT * 18, 300 + Math.sin(titleT * 0.2) * 20, 448, dt);
  cityBg.drawRain(c, dt, 0.3);
  R(c, 0, view.h - 26, view.w, 26, "#0b0812"); R(c, 0, view.h - 26, view.w, 1, "#FF4CA8");
  for (let i = 0; i < view.w; i += 16) R(c, (i - titleT * 18) % view.w + (i - titleT * 18 < 0 ? view.w : 0), view.h - 25, 6, 1, "#3a1a3a");
}
function drawLogo(c: CanvasRenderingContext2D, y: number): void {
  const g = Math.random() < 0.04 ? (Math.random() - 0.5) * 6 : 0;
  drawGlow(c, view.w / 2, y + 12, 100, "#1a3a40", 0.3);
  drawText(c, "BLACKOUT", view.w / 2 + g + 1, y, "#7a3a2c", 4, "center", null);
  drawText(c, "BLACKOUT", view.w / 2 + g, y - 1, "#4f9a98", 4, "center", "#05070C");
  R(c, view.w / 2 - 92, y + 31, 184, 1, "#7a4a2a");
  drawText(c, "P R O T O C O L", view.w / 2, y + 35, "#8f9a9e", 1, "center");
}
function drawTitle(c: CanvasRenderingContext2D, dt: number, confirm = false): void {
  const t = titleT;
  if (attract.frame(c, dt, true)) {
    titleT += dt;
    // keep the menu readable over the live preview: top band behind the logo, soft column behind buttons, vignette
    const tg = c.createLinearGradient(0, 0, 0, 84); tg.addColorStop(0, "rgba(2,3,6,0.78)"); tg.addColorStop(1, "rgba(2,3,6,0)"); c.fillStyle = tg; c.fillRect(0, 0, view.w, 84);
    const cg = c.createLinearGradient(view.w / 2 - 110, 0, view.w / 2 + 110, 0); cg.addColorStop(0, "rgba(2,3,6,0)"); cg.addColorStop(0.3, "rgba(2,3,6,0.42)"); cg.addColorStop(0.7, "rgba(2,3,6,0.42)"); cg.addColorStop(1, "rgba(2,3,6,0)");
    c.fillStyle = cg; c.fillRect(view.w / 2 - 110, 74, 220, 112);
    const g = c.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.4, view.w / 2, view.h / 2, view.w * 0.72); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(2,4,8,0.55)"); c.fillStyle = g; c.fillRect(0, 0, view.w, view.h);
    drawText(c, "ATTRACT MODE", 6, view.h - 10, Math.floor(t * 1.5) % 2 ? "#5a6a6e" : "#3a4448", 1, "left");
  } else {
    cityBackdrop(c, dt, true);
    // cast line-up on the street (static fallback backdrop)
    const gy = view.h - 26;
    drawSheet(c, SHEETS.player, "idle", t, 36, gy, false);
    ["npcA", "npcB", "npcC", "npcD"].forEach((n, i) => drawSheet(c, SHEETS[n], i % 2 ? "talk" : "idle", t + i * 0.3, view.w - 110 + i * 24, gy, i < 2));
    drawSheet(c, SHEETS.bot, "walk", t, ((t * 20) % (view.w + 80)) - 40, gy, false);
  }
  drawLogo(c, 26);
  if (!started) { if (Math.floor(t * 2) % 2) drawText(c, input.coarse ? "TAP TO START" : "CLICK OR PRESS ANY KEY", view.w / 2, 128, "#b08a4a", 1, "center"); if (input.taps.length) { started = true; unlockAudio(); playTheme(THEMES.bazaar.sound); ui.reset(); } return; }
  const bw = 120, bx = view.w / 2 - bw / 2; let y = 86;
  if (confirm) {
    panel(c, view.w / 2 - 100, 90, 200, 70);
    drawText(c, "ERASE ALL PROGRESS?", view.w / 2, 100, "#F04455", 1, "center");
    if (ui.button(c, "YES, NEW GAME", view.w / 2 - 90, 120, 85, 16, { col: "#F04455" })) { resetSave(); applyFx(); startTesanaRun(); startLevel(0, false); }
    if (ui.button(c, "CANCEL", view.w / 2 + 5, 120, 85, 16) || ui.back()) go("title");
    return;
  }
  const hasProgress = !!save.resume || save.unlocked > 1;
  if (hasProgress) {
    const lbl = save.resume ? `CONTINUE  SECTOR ${String(save.resume.level + 1).padStart(2, "0")}` : "CONTINUE";
    if (ui.button(c, lbl, bx - 15, y, bw + 30, 15, { col: "#a8782c" })) { if (save.resume) startLevel(save.resume.level, true); else go("map"); }
    y += 19;
  }
  if (ui.button(c, "NEW GAME", bx, y, bw, 15, { col: "#3f8f8c" })) { if (hasProgress) go("confirmNew"); else { startTesanaRun(); startLevel(0, false); } }
  y += 19;
  if (ui.button(c, "SECTOR MAP", bx, y, bw, 15, { col: "#3f8f8c" })) go("map");
  y += 19;
  if (ui.button(c, "BYTE BAZAAR", bx, y, bw, 15, { col: "#8a4a56" })) { overlay = "shop"; shopFrom = "menu"; shopConfirm = null; ui.reset(); }
  y += 19;
  if (ui.button(c, "OPTIONS", bx, y, bw, 15, { col: "#3f8f8c" })) { overlay = "options"; ui.reset(); }
  y += 19;
  if (ui.button(c, "LEADERBOARD", bx, y, bw, 15, { col: "#3f8f8c" })) window.dispatchEvent(new Event('blackout-open-leaderboard'));
  drawText(c, `$${save.btc} BTC`, view.w - 6, 4, "#a8782c", 1, "right");
  if (overlay !== "none") drawOverlay(c);
}

// ---------------- sector map ----------------
function drawMap(c: CanvasRenderingContext2D, dt: number): void {
  cityBackdrop(c, dt);
  R(c, 0, 0, view.w, view.h, "rgba(5,7,12,0.6)");
  drawText(c, "SECTOR MAP", 8, 6, "#48E6E0", 2);
  drawText(c, `$${save.btc} BTC   SCORE ${save.score}`, view.w - 8, 10, "#FFB44A", 1, "right");
  const colW = (view.w - 24) / 2;
  const rows = Math.ceil(LEVELS.length / 2);
  const rh = Math.min(28, (view.h - 62) / rows);
  LEVELS.forEach((L, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    const x = 8 + col * (colW + 8), y = 28 + row * rh;
    const locked = i + 1 > save.unlocked; const st = statOf(L.id);
    const name = `${String(L.num).padStart(2, "0")} ${L.name.replace("DATA CENTER: ", "")}`;
    if (ui.button(c, "", x, y, colW, rh - 3, { col: locked ? "#3a4252" : st.done ? "#48E6E0" : "#FFB44A", disabled: locked })) { const res = !!(save.resume && save.resume.level === i); startLevel(i, res); }
    drawText(c, name.slice(0, Math.floor((colW - 30) / 6)), x + 5, y + 3, locked ? "#4a5262" : "#e8f4ff");
    if (locked) drawText(c, "LOCKED", x + 5, y + 12, "#4a5262");
    else { for (let k = 0; k < 3; k++) { const sx = x + 8 + k * 8, sy = y + 15; c.fillStyle = st.shards[k] ? "#48E6E0" : "#1a3a44"; c.beginPath(); c.moveTo(sx, sy - 3); c.lineTo(sx + 2, sy); c.lineTo(sx, sy + 3); c.lineTo(sx - 2, sy); c.fill(); } if (st.done) drawText(c, `BEST ${st.best}`, x + colW - 5, y + 12, "#7a8aa0", 1, "right"); else if (save.resume && save.resume.level === i) drawText(c, "RESUME", x + colW - 5, y + 12, "#FFB44A", 1, "right"); }
  });
  if (ui.button(c, "BACK", 8, view.h - 20, 60, 14) || ui.back()) go("title");
  if (ui.button(c, "BYTE BAZAAR", view.w - 98, view.h - 20, 90, 14, { col: "#FF4CA8" })) { overlay = "shop"; shopFrom = "menu"; shopConfirm = null; ui.reset(); }
  if (overlay !== "none") drawOverlay(c);
}

// ---------------- gameplay ----------------
function drawPlay(c: CanvasRenderingContext2D, dt: number): void {
  if (!world) return;
  if (overlay === "none") {
    if (input.pressed("pause") && !world.hack) { openPause(); }
    else world.update(dt);
  }
  world.draw(c, overlay === "none" ? dt : 0);
  if (overlay !== "none") drawOverlay(c);
}
function drawOverlay(c: CanvasRenderingContext2D): void {
  if (overlay === "pause") drawPause(c);
  else if (overlay === "shop") drawShop(c);
  else if (overlay === "options") drawOptions(c);
}
function drawPause(c: CanvasRenderingContext2D): void {
  R(c, 0, 0, view.w, view.h, "rgba(5,7,12,0.7)");
  const w = 200, x = view.w / 2 - w / 2, y = 30;
  panel(c, x, y, w, 172);
  drawText(c, "PAUSED", view.w / 2, y + 7, "#48E6E0", 2, "center");
  let by = y + 28;
  if (ui.button(c, "RESUME", x + 15, by, w - 30, 15) || ui.back()) { overlay = "none"; ui.reset(); return; } by += 19;
  if (ui.button(c, "RESTART FROM CHECKPOINT", x + 15, by, w - 30, 15)) { overlay = "none"; world!.respawn(); ui.reset(); return; } by += 19;
  if (ui.button(c, "SECTOR MAP", x + 15, by, w - 30, 15)) { overlay = "none"; persist(); world = null; stopTheme(); playTheme(THEMES.bazaar.sound); go("map"); return; } by += 19;
  if (ui.button(c, "OPTIONS", x + 15, by, w - 30, 15)) { overlay = "options"; ui.reset(); return; } by += 22;
  const help = input.coarse || input.lastTouch ? ["PAD: MOVE   ARROW: JUMP", "SCREEN: HACK / LIFTS", "BOLT: EMP   GUN: FIRE"] : ["ARROWS/A-D: MOVE  SPACE: JUMP", "ENTER: HACK / RIDE LIFTS", "E: EMP  F/J: FIRE  ESC: PAUSE"];
  help.forEach((h, i) => drawText(c, h, view.w / 2, by + i * 10, "#8a9ab0", 1, "center"));
}
function drawOptions(c: CanvasRenderingContext2D): void {
  R(c, 0, 0, view.w, view.h, "rgba(5,7,12,0.75)");
  const w = 190, x = view.w / 2 - w / 2, y = 24;
  panel(c, x, y, w, 190);
  drawText(c, "OPTIONS", view.w / 2, y + 7, "#48E6E0", 2, "center");
  const rows: [string, boolean, () => void][] = [
    ["SOUND", !save.muted, () => { save.muted = !save.muted; setMuted(save.muted); }],
    ["CRT SCANLINES", save.fx.scanlines, () => { save.fx.scanlines = !save.fx.scanlines; applyFx(); }],
    ["SCREEN GLOW", save.fx.glow, () => { save.fx.glow = !save.fx.glow; applyFx(); }],
    ["PIXEL GRID", save.fx.grid, () => { save.fx.grid = !save.fx.grid; applyFx(); }],
    ["ARCADE CABINET", save.fx.cabinet, () => { save.fx.cabinet = !save.fx.cabinet; applyFx(); }],
  ];
  let by = y + 28;
  for (const [n, on, fn] of rows) { if (ui.button(c, `${n}: ${on ? "ON" : "OFF"}`, x + 15, by, w - 30, 15, { col: on ? "#48E6E0" : "#7a8aa0" })) { fn(); persist(); } by += 19; }
  by += 6;
  if (ui.button(c, "BACK", x + 15, by, w - 30, 15) || ui.back()) { overlay = screen === "play" ? "pause" : "none"; ui.reset(); }
}

// ---------------- Byte Bazaar ----------------
function priceOf(it: ShopItem): number | null { const t = it.consumable ? 0 : tier(it.id); return t < it.prices.length ? it.prices[t] : null; }
function drawShop(c: CanvasRenderingContext2D): void {
  R(c, 0, 0, view.w, view.h, "rgba(5,7,12,0.82)");
  panel(c, 4, 4, view.w - 8, view.h - 8, "#48E6E0", "#FF4CA8");
  R(c, 5, 5, view.w - 10, 16, "#120a1c"); R(c, 5, 21, view.w - 10, 1, "#FF4CA8");
  drawText(c, "BYTE BAZAAR", 10, 9, "#FF4CA8", 1); drawText(c, "// BLACK MARKET HARDWARE", 80, 9, "#5a4a6a");
  drawText(c, `$${save.btc} BTC`, view.w - 10, 9, "#FFB44A", 1, "right");
  const lx = 9, ly = 26, lw = 138;
  SHOP.forEach((it, i) => {
    const y = ly + i * 17;
    const p = priceOf(it); const t = tier(it.id);
    if (ui.button(c, "", lx, y, lw, 15, { col: i === shopSel ? "#FF4CA8" : "#2a3a4a" })) { shopSel = i; shopConfirm = null; }
    if (ui.focus === i && shopSel !== i && !shopConfirm) shopSel = i;
    icon(c, it.icon, lx + 3, y + 2);
    drawText(c, it.name, lx + 18, y + 4, i === shopSel ? "#ffffff" : "#c8d0e0");
    drawText(c, p === null ? "MAX" : `$${p}`, lx + lw - 4, y + 4, p === null ? "#48E6E0" : p <= save.btc ? "#FFB44A" : "#7a5a3a", 1, "right");
    if (!it.consumable) for (let k = 0; k < it.prices.length; k++) R(c, lx + 18 + k * 5, y + 12, 3, 1, k < t ? "#48E6E0" : "#2a3446");
  });
  const it = SHOP[shopSel]; const dx = 154, dw = view.w - dx - 10;
  panel(c, dx, 26, dw, 150, "#2a3a4a", "#2a3a4a");
  R(c, dx + 6, 32, 28, 28, "#0a0e18"); R(c, dx + 6, 32, 28, 1, "#FF4CA8");
  c.save(); c.translate(dx + 8, 34); c.scale(2, 2); icon(c, it.icon, 0, 0); c.restore();
  drawText(c, it.name, dx + 40, 34, "#ffffff"); drawText(c, it.cat, dx + 40, 44, "#FF4CA8");
  const t = tier(it.id); if (!it.consumable) drawText(c, `TIER ${t}/${it.prices.length}`, dx + 40, 54, "#48E6E0");
  wrapText(it.desc, Math.floor((dw - 12) / 6)).forEach((l, i) => drawText(c, l, dx + 6, 68 + i * 9, "#a8b4c8"));
  const p = priceOf(it); const need = it.needs ? it.needs() : null;
  drawText(c, p === null ? "FULLY UPGRADED" : it.stat(t), dx + 6, 118, "#7affc8");
  if (need) drawText(c, need, dx + 6, 130, "#F04455");
  if (it.id === "medkit" && shopFrom !== "game") drawText(c, "ONLY USABLE IN A SECTOR", dx + 6, 130, "#F04455");
  const can = p !== null && !need && save.btc >= p && !(it.id === "medkit" && (shopFrom !== "game" || !world || world.player.hp >= world.player.maxHp));
  if (shopConfirm) {
    panel(c, dx + 4, 138, dw - 8, 34, "#FFB44A", "#FFB44A");
    drawText(c, `BUY FOR $${p}?`, dx + dw / 2, 142, "#FFB44A", 1, "center");
    if (ui.button(c, "CONFIRM", dx + 8, 154, (dw - 24) / 2, 14, { col: "#7affc8" })) { buy(shopConfirm); shopConfirm = null; }
    if (ui.button(c, "CANCEL", dx + 16 + (dw - 24) / 2, 154, (dw - 24) / 2, 14, { col: "#F04455" })) shopConfirm = null;
  } else if (ui.button(c, p === null ? "MAXED" : save.btc < (p || 0) ? "NOT ENOUGH BTC" : "PURCHASE", dx + 6, 150, dw - 12, 16, { col: "#FFB44A", disabled: !can })) { shopConfirm = it; ui.focus = SHOP.length + 1; }
  if (shopMsgT > 0) { shopMsgT -= 1 / 60; drawText(c, shopMsg, dx + dw / 2, 182, "#7affc8", 1, "center"); }
  if (ui.button(c, "EXIT BAZAAR", view.w - 100, view.h - 22, 90, 14) || ui.back()) { if (shopConfirm) shopConfirm = null; else { overlay = "none"; persist(); ui.reset(); } }
}
function buy(it: ShopItem): void {
  const p = priceOf(it); if (p === null || save.btc < p) { sfx("deny"); return; }
  save.btc -= p;
  if (it.id === "shield") { save.shield = Math.min(6, save.shield + 2); if (world) world.player.shield = save.shield; }
  else if (it.id === "medkit") { if (world) world.player.hp = Math.min(world.player.maxHp, world.player.hp + 50); }
  else { save.up[it.id] = tier(it.id) + 1; if (world && it.id === "armor") { world.player.maxHp += 20; world.player.hp += 20; } if (world && it.id === "empcap") world.player.emp++; }
  persist(); sfx("buy"); shopMsg = `${it.name} INSTALLED`; shopMsgT = 1.6;
}

// ---------------- results & ending ----------------
function drawResults(c: CanvasRenderingContext2D, dt: number): void {
  if (world) world.draw(c, dt * 0.3);
  R(c, 0, 0, view.w, view.h, "rgba(5,7,12,0.75)");
  const s = summary!; const L = LEVELS[s.idx];
  const w = 220, x = view.w / 2 - w / 2, y = 24;
  panel(c, x, y, w, 186);
  drawText(c, "SECTOR CLEARED", view.w / 2, y + 8, "#48E6E0", 2, "center");
  drawText(c, L.name, view.w / 2, y + 28, "#FF4CA8", 1, "center");
  const lines: [string, string, string][] = [["RELAY SHARDS", `${s.shards}/3`, "#48E6E0"], ["BTC EARNED", `${s.btc >= 0 ? "+" : ""}${s.btc}`, "#FFB44A"], ["SECTOR SCORE", String(s.score), "#e8f4ff"], ["TIME", `${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, "0")}`, "#e8f4ff"], ["TOTAL BTC", String(save.btc), "#FFB44A"]];
  lines.forEach(([a, b, col], i) => { drawText(c, a, x + 16, y + 44 + i * 11, "#8a9ab0"); drawText(c, b, x + w - 16, y + 44 + i * 11, col, 1, "right"); });
  const last = s.idx >= LEVELS.length - 1;
  let by = y + 106;
  if (ui.button(c, last ? "FINAL TRANSMISSION" : "NEXT SECTOR", x + 20, by, w - 40, 15, { col: "#FFB44A" })) { if (last) { endT = 0; save.finished = true; persist(); go("ending"); } else startLevel(s.idx + 1, false); } by += 19;
  if (ui.button(c, "BYTE BAZAAR", x + 20, by, w - 40, 15, { col: "#FF4CA8" })) { overlay = "shop"; shopFrom = "menu"; shopConfirm = null; ui.reset(); } by += 19;
  if (ui.button(c, "SECTOR MAP", x + 20, by, w - 40, 15)) { world = null; stopTheme(); playTheme(THEMES.bazaar.sound); go("map"); }
  if (overlay !== "none") drawOverlay(c);
}
const ENDING = [
  "THE OVERSEER GOES DARK.", "", "ACROSS THE MEGACITY, TEN THOUSAND", "CAMERAS BLINK AND DIE.", "", "FOR ONE NIGHT, NOBODY IS WATCHING.", "",
  "BUT THE CORPORATIONS HAVE BACKUPS.", "NEW SECTORS ARE COMING ONLINE.", "", "THE PROTOCOL CONTINUES...", "", "", "BLACKOUT PROTOCOL", "", "THANK YOU FOR PLAYING",
];
function drawEnding(c: CanvasRenderingContext2D, dt: number): void {
  endT += dt; cityBackdrop(c, dt);
  R(c, 0, 0, view.w, view.h, `rgba(5,7,12,${Math.min(0.8, endT * 0.3)})`);
  ENDING.forEach((l, i) => { const y = view.h - endT * 14 + i * 12 + 20; if (y > -10 && y < view.h + 10) drawText(c, l, view.w / 2, y, i >= 13 ? "#48E6E0" : "#e8f4ff", 1, "center"); });
  drawSheet(c, SHEETS.player, "victory", endT, view.w / 2, view.h - 26, false);
  if (endT > 4 && ui.button(c, "SECTOR MAP", view.w / 2 - 50, 8, 100, 14)) { world = null; go("map"); }
}

void initIntegration().finally(boot);
(window as any).__BP = { start: (i: number) => { started = true; startLevel(i, false); }, get world() { return world; }, save: () => save, input, get screen() { return screen; }, attract };
