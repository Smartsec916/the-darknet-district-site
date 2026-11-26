import './style.css';
import * as THREE from 'three';
import { City, P, HALF_ROAD, LANE, NN, nodePos, edgeKey, dirOf, obbOverlap, rectToOBB, type Lot, type OBB } from './city';
import { Truck } from './truck';
import { Traffic } from './traffic';
import { Crowd, Character, PLAYER_NAMES } from './avatars';
import { Audio } from './audio';
import { Input } from './input';
import { Director, lerp } from './director';
import { Apartment } from './apartment';
import { LEVELS, RENT, BASE_PAY, type Level } from './levels';

// ------------------------------------------------------------------ platform
type AnyObj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const W = window as unknown as AnyObj;
const tes = (): AnyObj | undefined => W.Tesana;
async function tesanaClient(): Promise<AnyObj | null> {
  try { return await Promise.race([W.__TESANA_READY__ ?? Promise.resolve(W.Tesana), new Promise(r => setTimeout(() => r(null), 3000))]) as AnyObj | null; } catch { return null; }
}

// ------------------------------------------------------------------ UI scaffold
const uiRoot = document.getElementById('ui')!;
uiRoot.innerHTML = `
<div id="hud" class="hidden">
  <div id="gps" class="card"><canvas id="mini" width="184" height="184"></canvas><div id="gpsText"><div id="gpsTitle">METASHIFT GPS</div><div id="gpsArrow"></div><div id="gpsInstr">—</div><div id="gpsDist"></div></div></div>
  <div id="clock" class="card"><div id="pauseBtn">II</div><div><div id="clockDay">DAY 1</div><div id="clockTime">0:00</div><div id="clockStore"></div><div id="clockPen"></div></div></div>
  <div id="toasts"></div>
  <div id="status" class="hidden"></div>
  <div id="hint" class="hidden"></div>
  <div id="dashInfo" class="card"><div><div id="spd">0</div><div id="spdU">KM/H</div></div><div id="gear">D</div><div id="fuelBox"><div id="fuelLbl">FUEL</div><div id="fuelBar"><div id="fuelFill"></div></div></div><div id="radioBtn" class="mini card on">♪<span>RADIO</span></div></div>
</div>
<div id="sub" class="hidden"><div class="who"></div><div class="line"></div></div>
<div id="daycard" class="hidden"></div>
<div id="note" class="hidden"><div class="ic">M</div><div><b></b><span></span></div></div>
<div id="loading" class="hidden"><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div><div id="loadBar"><div id="loadFill"></div></div><div id="loadMsg"></div><div class="legal">© MetaShift Workforce Platform · Worker ID 4471 · Shift data is monitored for quality</div></div>
<div id="finalCard" class="hidden"><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div></div>
<div id="title" class="hidden">
  <div class="top"><div class="cab">THE DARKNET DISTRICT · ARCADE</div><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div></div>
  <div id="attract"></div>
  <div id="titleBtns"><button class="btn" id="startBtn">START SHIFT</button><button class="btn alt hidden" id="contBtn">CONTINUE</button><button class="btn alt" id="badgeBtn">BADGES</button><div class="blink">INSERT COIN · TAP TO START</div></div>
</div>
<div id="summary" class="panel hidden"></div>
<div id="results" class="panel hidden"></div>
<div id="pause" class="panel hidden"><h2>PAUSED</h2><h1>Shift on hold</h1>
  <button class="btn" id="resumeBtn">RESUME</button><button class="btn alt" id="restartBtn">RESTART THIS DAY</button><button class="btn alt" id="radioBtn2">RADIO: ON</button><button class="btn alt" id="badgeBtn2">BADGES</button><button class="btn alt" id="quitBtn">QUIT TO TITLE</button>
  <div class="small">Keyboard: W/S or ↑/↓ gas & brake (hold brake to reverse) · A/D or ←/→ steer · H horn · R radio · Esc pause<br>Controller: RT gas · LT brake/reverse · stick steer · B horn · Y radio · Start pause</div></div>
<div id="badges" class="panel hidden"><h2>BADGES</h2><h1>Worker achievements</h1><div id="badgeList"><div class="small">Loading…</div></div><button class="btn" id="badgeClose">CLOSE</button></div>
<div id="skip" class="hidden">SKIP »</div>
<div id="fade"></div>`;
const $ = (id: string) => document.getElementById(id)!;
const show = (id: string, v: boolean) => $(id).classList.toggle('hidden', !v);

// ------------------------------------------------------------------ renderer
const host = document.getElementById('game')!;
let renderer: THREE.WebGLRenderer | null = null;
let VW = 1, VH = 1;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1500);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x4a4a40, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dd, 1.6); sun.position.set(300, 500, 150); scene.add(sun);
scene.fog = new THREE.Fog(0xb8cfe0, 80, 380);
const skyGeo = new THREE.SphereGeometry(1300, 16, 10);
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color(0x5d9be0) }, bot: { value: new THREE.Color(0xcfe2f2) } },
  vertexShader: 'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float vY; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(-0.05, 0.5, vY)), 1.0); }',
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const sky = new THREE.Mesh(skyGeo, skyMat); sky.renderOrder = -1; scene.add(sky);

const city = new City(); scene.add(city.group);
const baseSolids = city.solids.length;
const truck = new Truck(); scene.add(truck.tractor, truck.trailer);
const traffic = new Traffic(city, scene);
const crowd = new Crowd(city, scene);
const audio = new Audio();
const input = new Input(uiRoot);
const D = new Director();
const apt = new Apartment();

// rain
const RAIN_N = 1400;
const rainGeo = new THREE.BufferGeometry();
{
  const seeds = new Float32Array(RAIN_N * 2 * 3), ends = new Float32Array(RAIN_N * 2), pos = new Float32Array(RAIN_N * 2 * 3);
  for (let i = 0; i < RAIN_N; i++) { const a = Math.random(), b = Math.random(), c = Math.random(); for (let k = 0; k < 2; k++) { seeds.set([a, b, c], (i * 2 + k) * 3); ends[i * 2 + k] = k; } }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3)); rainGeo.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
}
const rainMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
  vertexShader: `attribute vec3 aSeed; attribute float aEnd; uniform float uTime; uniform vec3 uCam;
    void main(){ vec3 b = aSeed * vec3(50.0, 26.0, 50.0); float y = mod(b.y - uTime*22.0, 26.0) - 8.0;
      vec3 p = vec3(mod(b.x - uCam.x, 50.0) - 25.0 + uCam.x + aEnd*0.15, y + uCam.y - aEnd*0.8, mod(b.z - uCam.z, 50.0) - 25.0 + uCam.z);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.75,0.8,0.9,0.45); }', transparent: true, depthWrite: false,
});
const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.visible = false; scene.add(rain);

// GPS ribbon
const chevCv = document.createElement('canvas'); chevCv.width = 64; chevCv.height = 64;
{ const c = chevCv.getContext('2d')!; c.clearRect(0, 0, 64, 64); c.strokeStyle = '#5ff2ff'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(14, 12); c.moveTo(12, 14); c.lineTo(32, 46); c.lineTo(52, 14); c.stroke(); }
const chevTex = new THREE.CanvasTexture(chevCv); chevTex.wrapS = chevTex.wrapT = THREE.RepeatWrapping;
const ribbonMat = new THREE.MeshBasicMaterial({ map: chevTex, transparent: true, opacity: 0.95, depthWrite: false, fog: false });
const ribbon = new THREE.Mesh(new THREE.BufferGeometry(), ribbonMat); ribbon.frustumCulled = false; scene.add(ribbon);

// destination & fuel markers
const destGroup = new THREE.Group(); scene.add(destGroup);
const conGroup = new THREE.Group(); scene.add(conGroup);

// mirrors
const mirrorRT = [new THREE.WebGLRenderTarget(128, 200), new THREE.WebGLRenderTarget(128, 200)];
const mirrorCam = [new THREE.PerspectiveCamera(32, 0.62, 0.5, 260), new THREE.PerspectiveCamera(32, 0.62, 0.5, 260)];
const hudScene = new THREE.Scene();
const hudCam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
const mirrorMesh: THREE.Mesh[] = []; const mirrorFrame: THREE.Mesh[] = [];
for (let i = 0; i < 2; i++) {
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x15181c })); fr.position.z = -1; hudScene.add(fr); mirrorFrame.push(fr);
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mirrorRT[i].texture, side: THREE.DoubleSide })); hudScene.add(mm); mirrorMesh.push(mm);
}
const mirrorRect = [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 0, w: 1, h: 1 }];

// ------------------------------------------------------------------ game state
type State = 'boot' | 'title' | 'morning' | 'loading' | 'drive' | 'deliver' | 'summary' | 'night' | 'final' | 'results';
let state: State = 'boot';
let paused = false;
let levelIdx = 0; let L: Level = LEVELS[0];
let destLot: Lot = city.stores[L.store];
let fuelLot: Lot | null = null; let needFuel = false; let refueled = false;
let dayTime = 0, penalties = 0, collisions = 0, violations = 0, limit = 120, parkT = 0, refuelT = 0;
let hitCool = 0, shake = 0, wasColliding = false, inBox = -1;
let grip = 1, isNight = false, isRain = false;
let deliverResolve: (() => void) | null = null;
let worldT = 0, lightT = 0;
let routeT = 0, toastT = 8, hintQueue: { t: number; text: string }[] = [], hintT = 0;
let attractT = 0, attractPanel = 0;
let lastHorn = false;
let odoStart = 0;

interface RunSave { saveVersion: number; day: number; times: number[]; pens: number[]; earned: number; collisions: number; violations: number }
const SAVE_KEY = 'metashift_run_v1';
function newRun(): RunSave { return { saveVersion: 1, day: 0, times: [], pens: [], earned: 0, collisions: 0, violations: 0 }; }
let run: RunSave = newRun();
function loadRun(): RunSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
    const o = JSON.parse(raw) as AnyObj; const d = newRun() as unknown as AnyObj;
    for (const k of Object.keys(d)) { const v = o[k]; if (Array.isArray(d[k]) ? Array.isArray(v) : typeof v === typeof d[k]) d[k] = v; }
    const r = d as unknown as RunSave;
    r.times = r.times.filter(n => typeof n === 'number'); r.pens = r.pens.filter(n => typeof n === 'number');
    if (r.day <= 0 || r.day >= LEVELS.length || r.times.length !== r.day) return null;
    return r;
  } catch { return null; }
}
function saveRun() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch { /* */ } }
function clearRun() { try { localStorage.removeItem(SAVE_KEY); } catch { /* */ } }

// ------------------------------------------------------------------ helpers
const fmt = (s: number) => { const neg = s < 0; s = Math.abs(s); const m = Math.floor(s / 60); const r = s - m * 60; return (neg ? '-' : '') + m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
const fmtShort = (s: number) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
function toast(text: string, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = text; $('toasts').prepend(t);
  const box = $('toasts'); while (box.children.length > 3) box.lastChild!.remove();
  setTimeout(() => t.remove(), 4200);
}
function setStatus(text: string | null) { const s = $('status'); if (!text) s.classList.add('hidden'); else { s.classList.remove('hidden'); if (s.textContent !== text) s.textContent = text; } }
function sub(who: string | null, text = '') { if (!who) { show('sub', false); return; } show('sub', true); ($('sub').querySelector('.who') as HTMLElement).textContent = who; ($('sub').querySelector('.line') as HTMLElement).textContent = text; }
function note(title: string, body: string) { const n = $('note'); (n.querySelector('b') as HTMLElement).textContent = title; (n.querySelector('span') as HTMLElement).textContent = body; show('note', true); audio.ding(); setTimeout(() => show('note', false), 3600); }
function fade(v: number) { $('fade').style.opacity = String(v); }
function inLot(l: Lot, x: number, z: number, m: number) { const r = l.rect; return x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m; }

// ------------------------------------------------------------------ routing
interface Route { pts: { x: number; z: number }[]; len: number; arrow: string; instr: string; dist: number }
function computeRoute(x: number, z: number, h: number, lot: Lot): Route {
  const [a, b, t] = city.nearestEdge(x, z);
  const A = nodePos(a), B = nodePos(b);
  const ex = (B.x - A.x) / P, ez = (B.z - A.z) / P;
  const fwdB = Math.cos(h) * ex + Math.sin(h) * ez > 0;
  const avoid = city.blocked;
  const dAB = dirOf(a, b), dBA = dirOf(b, a);
  const starts = [{ node: b, dir: dAB, cost: (1 - t) * P + (fwdB ? 0 : 160) }, { node: a, dir: dBA, cost: t * P + (fwdB ? 160 : 0) }];
  const avoid2 = new Set(avoid); avoid2.add(edgeKey(a, b));
  const { dist, prev } = city.routeStates(starts, avoid2);
  const [e0, e1] = lot.edge; const E0 = nodePos(e0), E1 = nodePos(e1);
  const d0 = Math.hypot(E0.x - lot.entry.x, E0.z - lot.entry.z), d1 = Math.hypot(E1.x - lot.entry.x, E1.z - lot.entry.z);
  let total = Infinity, lastState = -1;
  for (const [en, dd, toward] of [[e0, d0, dirOf(e0, e1)], [e1, d1, dirOf(e1, e0)]] as [number, number, number][]) {
    for (let din = 0; din < 4; din++) {
      if ((toward ^ 1) === din) continue;
      const c = dist[en * 4 + din] + dd + (din !== toward ? 14 : 0);
      if (c < total) { total = c; lastState = en * 4 + din; }
    }
  }
  let nodes: number[] = [];
  const sameEdge = edgeKey(a, b) === edgeKey(e0, e1);
  if (sameEdge) {
    const se = ((lot.entry.x - A.x) * ex + (lot.entry.z - A.z) * ez); const st = t * P;
    const ahead = fwdB ? se > st + 2 : se < st - 2;
    if (ahead) { total = Math.abs(se - st); lastState = -1; }
  }
  if (lastState >= 0) { let k = lastState; while (k >= 0) { nodes.unshift(k >> 2); k = prev[k]; } }
  if (!isFinite(total)) total = 9999;
  const pts: { x: number; z: number }[] = [{ x, z }];
  for (const n of nodes) pts.push(nodePos(n));
  pts.push({ x: lot.entry.x, z: lot.entry.z });
  pts.push({ x: lot.entry.x + lot.inward.x * (lot.kind === 'curb' || lot.kind === 'fuel' ? 3.5 : 14), z: lot.entry.z + lot.inward.z * (lot.kind === 'curb' || lot.kind === 'fuel' ? 3.5 : 14) });
  // instruction
  let arrow = 'straight', instr = 'Continue', dd = 0;
  let found = false;
  for (let i = 1; i < pts.length - 2 && !found; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    dd += Math.hypot(p1.x - p0.x, p1.z - p0.z);
    const ix = p1.x - p0.x, iz = p1.z - p0.z, ox = p2.x - p1.x, oz = p2.z - p1.z;
    const il = Math.hypot(ix, iz) || 1, ol = Math.hypot(ox, oz) || 1;
    const cross = (ix * oz - iz * ox) / (il * ol), dot = (ix * ox + iz * oz) / (il * ol);
    if (i === 1 && il < 2) continue;
    if (dot < -0.5) { arrow = 'uturn'; instr = 'Make a U-turn'; found = true; }
    else if (cross > 0.5) { arrow = 'right'; instr = 'Turn right'; found = true; }
    else if (cross < -0.5) { arrow = 'left'; instr = 'Turn left'; found = true; }
  }
  if (!found) {
    dd = 0; for (let i = 1; i < pts.length - 1; i++) dd += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    const n = pts.length; const px = pts[n - 2].x - pts[n - 3].x, pz = pts[n - 2].z - pts[n - 3].z;
    const rx = -pz, rz = px; const right = rx * lot.inward.x + rz * lot.inward.z > 0;
    arrow = right ? 'destR' : 'destL';
    instr = (lot.kind === 'fuel' ? 'Fuel station' : 'Destination') + (right ? ' on the right' : ' on the left');
  }
  return { pts, len: total, arrow, instr, dist: dd };
}
const ARROWS: Record<string, string> = {
  straight: 'M12 21V4M5 11l7-7 7 7',
  right: 'M6 21v-8a4 4 0 0 1 4-4h10M15 4l5 5-5 5',
  left: 'M18 21v-8a4 4 0 0 0-4-4H4M9 4L4 9l5 5',
  uturn: 'M7 21V10a5 5 0 0 1 10 0v6M13 12l4 4 4-4',
  destR: 'M5 21V5h9M10 1l4 4-4 4M17 13a3 3 0 1 0 0.01 0',
  destL: 'M19 21V5h-9M14 1l-4 4 4 4M7 13a3 3 0 1 0 0.01 0',
};
function arrowSvg(k: string) { return `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#5ff2ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ARROWS[k] || ARROWS.straight}"/></svg>`; }
let route: Route | null = null;

function buildRibbon(pts: { x: number; z: number }[]) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  // offset into the right-hand lane
  const off: { x: number; z: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const o = i === 0 || i >= pts.length - 2 ? 0 : LANE;
    off.push({ x: pts[i].x - dz * o, z: pts[i].z + dx * o });
  }
  let along = 0;
  for (let i = 0; i < off.length; i++) {
    const a = off[Math.max(0, i - 1)], b = off[Math.min(off.length - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    if (i > 0) along += Math.hypot(off[i].x - off[i - 1].x, off[i].z - off[i - 1].z);
    const w = 1.3;
    pos.push(off[i].x - dz * w, 0.08, off[i].z + dx * w, off[i].x + dz * w, 0.08, off[i].z - dx * w);
    uv.push(0, -along / 3, 1, -along / 3);
    if (i > 0) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  ribbon.geometry.dispose(); ribbon.geometry = g;
}

// ------------------------------------------------------------------ minimap
const mini = $('mini') as HTMLCanvasElement; const mctx = mini.getContext('2d')!;
function drawMini() {
  const c = mctx, S = 184, sc = 0.55; c.save(); c.fillStyle = '#0a1420'; c.fillRect(0, 0, S, S);
  c.translate(S / 2, S * 0.62); c.rotate(-truck.h - Math.PI / 2); c.scale(sc, sc); c.translate(-truck.x, -truck.z);
  c.strokeStyle = '#2c3d50'; c.lineWidth = 14; c.lineCap = 'butt';
  c.beginPath(); for (let i = 0; i < NN; i++) { c.moveTo(i * P, 0); c.lineTo(i * P, (NN - 1) * P); c.moveTo(0, i * P); c.lineTo((NN - 1) * P, i * P); } c.stroke();
  c.strokeStyle = '#ff4040'; c.lineWidth = 10;
  for (const k of city.blocked) { const [a, b] = k.split(':').map(Number); const A = nodePos(a), B = nodePos(b); c.beginPath(); c.moveTo((A.x * 2 + B.x) / 3, (A.z * 2 + B.z) / 3); c.lineTo((A.x + B.x * 2) / 3, (A.z + B.z * 2) / 3); c.stroke(); }
  for (const f of city.fuel) { c.fillStyle = needFuel && !refueled ? '#ffcc00' : '#806a10'; c.fillRect(f.rect.x0, f.rect.z0, f.rect.x1 - f.rect.x0, f.rect.z1 - f.rect.z0); }
  c.fillStyle = '#6dffb6'; const r = destLot.rect; c.fillRect(r.x0 - 3, r.z0 - 3, r.x1 - r.x0 + 6, r.z1 - r.z0 + 6);
  if (route) { c.strokeStyle = '#5ff2ff'; c.lineWidth = 7; c.lineJoin = 'round'; c.beginPath(); route.pts.forEach((p, i) => i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)); c.stroke(); }
  c.fillStyle = '#ff7ad9'; for (const car of traffic.cars) if (car.active) c.fillRect(car.x - 3, car.z - 3, 6, 6);
  c.restore();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(S / 2, S * 0.62 - 11); c.lineTo(S / 2 - 7, S * 0.62 + 7); c.lineTo(S / 2 + 7, S * 0.62 + 7); c.closePath(); c.fill();
}

// ------------------------------------------------------------------ weather
function setWeather(w: Level['weather'] | 'title') {
  isNight = w === 'night' || w === 'dusk'; isRain = w === 'rain' || w === 'dusk';
  grip = w === 'rain' ? 0.55 : w === 'dusk' ? 0.72 : 1;
  const fog = scene.fog as THREE.Fog;
  const cfg = {
    clear: { top: 0x4f8fdc, bot: 0xd2e4f2, fog: 0xbcd2e3, near: 90, far: 420, hemi: 1.0, sun: 1.6, sunC: 0xfff1dd, night: 0 },
    title: { top: 0x3a5fa8, bot: 0xf2b8a0, fog: 0xc8b8c8, near: 120, far: 700, hemi: 0.95, sun: 1.3, sunC: 0xffd6b0, night: 0.25 },
    rain: { top: 0x55606e, bot: 0x8a95a2, fog: 0x7a8592, near: 20, far: 170, hemi: 0.7, sun: 0.4, sunC: 0xdde6f0, night: 0.35 },
    night: { top: 0x020510, bot: 0x14203a, fog: 0x0c1426, near: 30, far: 230, hemi: 0.22, sun: 0.08, sunC: 0x8899cc, night: 1 },
    dusk: { top: 0x2a2a5a, bot: 0xd8826a, fog: 0x6a5a6e, near: 30, far: 220, hemi: 0.5, sun: 0.6, sunC: 0xff9a6a, night: 0.75 },
  }[w];
  skyMat.uniforms.top.value.setHex(cfg.top); skyMat.uniforms.bot.value.setHex(cfg.bot);
  fog.color.setHex(cfg.fog); fog.near = cfg.near; fog.far = cfg.far;
  hemi.intensity = cfg.hemi; sun.intensity = cfg.sun; sun.color.setHex(cfg.sunC);
  city.nightU.value = cfg.night;
  rain.visible = isRain;
  (traffic.lights.material as THREE.MeshBasicMaterial).color.setScalar(isNight ? 1.6 : 0.8);
  audio.setRain(isRain ? (w === 'dusk' ? 0.6 : 1) : 0);
}

// ------------------------------------------------------------------ level setup
function zoneTexture(text: string, sub2: string) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const c = cv.getContext('2d')!;
  c.fillStyle = 'rgba(60,255,150,0.28)'; c.fillRect(0, 0, 256, 512);
  c.strokeStyle = 'rgba(160,255,200,0.95)'; c.lineWidth = 14; c.setLineDash([36, 20]); c.strokeRect(8, 8, 240, 496);
  c.fillStyle = 'rgba(220,255,235,0.95)'; c.font = 'bold 44px Arial'; c.textAlign = 'center';
  c.save(); c.translate(128, 256); c.rotate(-Math.PI / 2); c.fillText(text, 0, -10); c.font = 'bold 26px Arial'; c.fillText(sub2, 0, 34); c.restore();
  const t = new THREE.CanvasTexture(cv); return t;
}
function markLot(l: Lot, color: number, label: string, sub2: string) {
  const r = l.rect; const w = r.x1 - r.x0, d = r.z1 - r.z0;
  const long = l.kind === 'curb' || l.kind === 'fuel' ? (l.along.x !== 0) : (l.along.x !== 0);
  const pg = new THREE.PlaneGeometry(long ? d : w, long ? w : d);
  const mat = new THREE.MeshBasicMaterial({ map: zoneTexture(label, sub2), transparent: true, depthWrite: false, color });
  const m = new THREE.Mesh(pg, mat); m.rotation.x = -Math.PI / 2; if (long) m.rotation.z = Math.PI / 2;
  m.position.set((r.x0 + r.x1) / 2, 0.22, (r.z0 + r.z1) / 2); destGroup.add(m);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beacon.position.set((r.x0 + r.x1) / 2, 35, (r.z0 + r.z1) / 2); destGroup.add(beacon);
}

function placeConstruction(count: number, from: { x: number; z: number; h: number }, lot: Lot) {
  const rt = computeRoute(from.x, from.z, from.h, lot);
  // node ids along route (exclude first & last point)
  const ids: number[] = [];
  for (let i = 1; i < rt.pts.length - 2; i++) { const p = rt.pts[i]; ids.push(Math.round(p.x / P) + Math.round(p.z / P) * NN); }
  const cand: [number, number][] = [];
  for (let i = 0; i < ids.length - 1; i++) cand.push([ids[i], ids[i + 1]]);
  const protect = new Set([edgeKey(lot.edge[0], lot.edge[1]), ...city.fuel.map(f => edgeKey(f.edge[0], f.edge[1]))]);
  const pick: [number, number][] = [];
  const usable = cand.filter((e, i) => i > 0 && !protect.has(edgeKey(e[0], e[1])));
  for (let k = 0; k < count && usable.length; k++) { const idx = Math.floor((k + 0.5) / count * usable.length); const e = usable[Math.min(usable.length - 1, idx)]; if (!pick.includes(e)) pick.push(e); }
  const orange = new THREE.MeshLambertMaterial({ color: 0xff7a1a, emissive: 0x401800 }), white = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const coneG = new THREE.ConeGeometry(0.3, 0.8, 8); coneG.translate(0, 0.4, 0);
  const signCv = document.createElement('canvas'); signCv.width = 256; signCv.height = 128; const sc = signCv.getContext('2d')!;
  sc.fillStyle = '#ff7a1a'; sc.fillRect(0, 0, 256, 128); sc.fillStyle = '#111'; sc.font = 'bold 34px Arial'; sc.textAlign = 'center'; sc.fillText('ROAD WORK', 128, 52); sc.font = 'bold 26px Arial'; sc.fillText('DETOUR ⟲', 128, 98);
  const signMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCv), side: THREE.DoubleSide });
  for (const [a, b] of pick) {
    city.blocked.add(edgeKey(a, b));
    const A = nodePos(a), B = nodePos(b);
    const horiz = A.z === B.z;
    for (const endFrac of [0.2, 0.8]) {
      const cx = lerp(A.x, B.x, endFrac), cz = lerp(A.z, B.z, endFrac);
      const half = HALF_ROAD + 4;
      const rect = horiz ? { x0: cx - 1, x1: cx + 1, z0: cz - half, z1: cz + half } : { x0: cx - half, x1: cx + half, z0: cz - 1, z1: cz + 1 };
      city.addSolid(rect);
      for (let s = -half + 1; s <= half - 1; s += 2.6) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.5 : 2.4, 0.9, horiz ? 2.4 : 0.5), (Math.round(s / 2.6) % 2) ? orange : white);
        bar.position.set(horiz ? cx : cx + s, 0.45, horiz ? cz + s : cz); conGroup.add(bar);
      }
      for (let k = -2; k <= 2; k++) { const cone = new THREE.Mesh(coneG, orange); const o = (endFrac < 0.5 ? -3 : 3); cone.position.set(horiz ? cx + o + k * 0.0 : cx + k * 3, 0, horiz ? cz + k * 3 : cz + o); conGroup.add(cone); }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), signMat); sign.position.set(cx, 2.2, cz); sign.rotation.y = horiz ? Math.PI / 2 : 0; conGroup.add(sign);
    }
  }
}

function setupLevel(i: number) {
  levelIdx = i; L = LEVELS[i];
  destLot = city.stores[L.store];
  city.blocked.clear(); city.removeSolids(baseSolids);
  conGroup.clear(); destGroup.clear();
  const st = city.dcStarts[L.dc];
  truck.reset(st.x, st.z, st.h, L.fuel);
  if (L.construction) placeConstruction(L.construction, st, destLot);
  setWeather(L.weather);
  traffic.setup(L.traffic, L.trafficSpeed, st.x, st.z);
  crowd.reset(st.x, st.z);
  markLot(destLot, 0x6dffb6, destLot.kind === 'dock' ? 'BACK IN' : 'DELIVERY', destLot.kind === 'dock' ? 'trailer first' : 'stop inside');
  needFuel = L.fuelStop; refueled = false; fuelLot = null;
  let len: number;
  if (needFuel) {
    let best = Infinity;
    for (const f of city.fuel) { const a = computeRoute(st.x, st.z, st.h, f).len; const b = Math.abs(f.entry.x - destLot.entry.x) + Math.abs(f.entry.z - destLot.entry.z); if (a + b < best) { best = a + b; fuelLot = f; } }
    len = best * 1.1 + 25 * L.pace;
    for (const f of city.fuel) markLot(f, 0xffcc00, 'FUEL', 'stop to refuel');
  } else len = computeRoute(st.x, st.z, st.h, destLot).len;
  limit = Math.round(len / L.pace + 35);
  odoStart = truck.odo;
  dayTime = 0; penalties = 0; collisions = 0; violations = 0; parkT = 0; refuelT = 0; hitCool = 0; wasColliding = false; inBox = -1;
  routeT = 0; route = null; toastT = 6;
  hintQueue = [];
  if (i === 0) hintQueue = [{ t: 0.5, text: 'Hold GAS · follow the blue arrows' }, { t: 9, text: 'Swing wide on turns: the trailer cuts corners' }, { t: 20, text: 'Watch the mirrors to see your trailer' }];
  else hintQueue = [{ t: 0.5, text: L.challenge }];
  if (needFuel) hintQueue.push({ t: 6, text: 'Low fuel! Stop at a yellow GridFuel bay first' });
  if (destLot.kind === 'dock') hintQueue.push({ t: 12, text: 'Hold BRAKE when stopped to reverse into the dock' });
  if (L.construction) hintQueue.push({ t: 6, text: 'Road work ahead: the GPS will detour you' });
  hintT = 0;
  $('clockDay').textContent = `DAY ${L.day} / 10`; $('clockStore').textContent = L.title;
  truck.sync();
}

// ------------------------------------------------------------------ driving update
const tmpV = new THREE.Vector3();
function collides(): { hit: boolean; car: number } {
  const obbs = truck.obbs();
  for (const ob of obbs) {
    const rad = Math.hypot(ob.hx, ob.hz) + 1;
    const cells = new Set<number>();
    for (const dx of [-rad, rad]) for (const dz of [-rad, rad]) cells.add(city.cell(ob.x + dx, ob.z + dz));
    for (const c of cells) {
      for (const si of city.solidGrid[c]) if (obbOverlap(ob, rectToOBB(city.solids[si]))) return { hit: true, car: -1 };
      for (const pi of city.poleGrid[c]) { const p = city.poles[pi]; if (obbOverlap(ob, { x: p.x, z: p.z, hx: 0.25, hz: 0.25, c: 1, s: 0 })) return { hit: true, car: -1 }; }
    }
    for (let i = 0; i < traffic.count; i++) {
      const car = traffic.cars[i]; if (Math.abs(car.x - ob.x) > 12 || Math.abs(car.z - ob.z) > 12) continue;
      if (obbOverlap(ob, traffic.obb(i))) return { hit: true, car: i };
    }
  }
  return { hit: false, car: -1 };
}

function penalize(sec: number, text: string) {
  penalties += sec; toast(`${text}  +${sec}s`, 'pen'); $('clockPen').textContent = `penalties +${penalties}s`;
}

function updateDrive(dt: number) {
  dayTime += dt;
  const before = truck.snapshot();
  const speedBefore = Math.abs(truck.v);
  truck.step(dt, { throttle: input.throttle, brake: input.brake, steer: input.steer }, grip);
  const col = collides();
  if (col.hit) {
    if (!wasColliding) {
      truck.restore(before); truck.v = -truck.v * 0.15;
      if (hitCool <= 0 && speedBefore > 1.6) {
        collisions++; penalize(5, col.car >= 0 ? 'Collision with a player vehicle' : 'Collision'); audio.crash(); shake = Math.min(1, speedBefore / 10 + 0.3); hitCool = 1.5;
      } else if (speedBefore > 0.5) { audio.thud(); }
      if (col.car >= 0) traffic.bump(col.car);
      wasColliding = collides().hit;
    } else {
      truck.v = Math.max(-2, Math.min(2, truck.v));
    }
  } else wasColliding = false;
  hitCool -= dt;
  // red lights
  const f = truck.front();
  const ni = Math.round(f.x / P), nj = Math.round(f.z / P);
  const node = ni >= 0 && ni < NN && nj >= 0 && nj < NN ? ni + nj * NN : -1;
  const inside = node >= 0 && Math.abs(f.x - ni * P) < HALF_ROAD && Math.abs(f.z - nj * P) < HALF_ROAD;
  if (inside && inBox !== node && truck.v > 2.5) {
    const c = Math.cos(truck.h), s = Math.sin(truck.h);
    const axis: 0 | 1 = Math.abs(c) > Math.abs(s) ? 0 : 1;
    const dx = axis === 0 ? Math.sign(c) : 0, dz = axis === 1 ? Math.sign(s) : 0;
    if (city.hasLight.has(node + ',' + dx + ',' + dz) && city.lightState(node, axis, lightT) === 2) { violations++; penalize(10, 'Ran a red light'); audio.hiss(); }
  }
  inBox = inside ? node : -1;
  // fuel
  let status: string | null = null;
  if (truck.fuel <= 0) status = 'OUT OF FUEL · crawling on reserve';
  else if (truck.fuel < 0.12 && Math.floor(worldT * 2) % 2 === 0) status = 'FUEL LOW';
  const [tob, trob] = truck.obbs();
  for (const fl of city.fuel) {
    if (inLot(fl, tob.x, tob.z, 1.5)) {
      if (Math.abs(truck.v) < 0.5 && truck.fuel < 0.995) {
        truck.fuel = Math.min(1, truck.fuel + dt * 0.16); refuelT += dt;
        status = `REFUELING ${Math.round(truck.fuel * 100)}%`;
        if (truck.fuel > 0.6 && !refueled) { refueled = true; if (needFuel) { toast('Transaction confirmed: −38 CR fuel', 'cash'); route = null; routeT = 0; } }
      } else if (truck.fuel < 0.995) status = 'Stop in the bay to refuel';
    }
  }
  // parking
  const target = destLot;
  const tIn = inLot(target, tob.x, tob.z, 1.0), rIn = inLot(target, trob.x, trob.z, 1.0);
  const ft = { x: Math.cos(truck.ht), z: Math.sin(truck.ht) };
  const aligned = Math.abs(ft.x * target.along.x + ft.z * target.along.z) > 0.8;
  const backIn = target.kind !== 'dock' || (ft.x * target.inward.x + ft.z * target.inward.z) < -0.6;
  const near = Math.hypot(tob.x - target.entry.x, tob.z - target.entry.z) < 45;
  if (!(needFuel && !refueled)) {
    if (tIn && rIn && aligned && backIn) {
      if (Math.abs(truck.v) < 0.6) { parkT += dt; status = parkT > 0.3 ? 'PARKED · unloading…' : 'Hold still…'; }
      else { status = 'Stop the truck'; parkT = 0; }
      if (parkT > 1.1) { finishDrive(); return; }
    } else {
      parkT = 0;
      if (near && !status) {
        if (target.kind === 'dock' && (tIn || rIn) && !backIn) status = 'Back the trailer into the dock';
        else if (tIn || rIn) status = 'Pull the whole truck into the green bay';
        else if (dayTime > 3) status = target.kind === 'dock' ? 'Reverse the trailer into the green dock' : 'Pull into the green bay and stop';
      }
    }
  } else if (near && !status) status = 'Refuel first! Head to a yellow GridFuel bay';
  setStatus(status);
  // gps
  routeT -= dt;
  if (routeT <= 0) {
    routeT = 0.4;
    const goal = needFuel && !refueled && fuelLot ? nearestFuel() : destLot;
    route = computeRoute(truck.x + Math.cos(truck.h) * 2, truck.z + Math.sin(truck.h) * 2, truck.h, goal);
    buildRibbon(route.pts);
    if ($('gpsArrow').dataset.k !== route.arrow) { $('gpsArrow').dataset.k = route.arrow; $('gpsArrow').innerHTML = arrowSvg(route.arrow); }
    $('gpsInstr').textContent = route.instr;
    $('gpsDist').textContent = `in ${Math.max(0, Math.round(route.dist / 10) * 10)} m · ${(route.len / 1000).toFixed(2)} km left`;
    drawMini();
  }
  chevTex.offset.y -= dt * 0.8;
  // hints
  hintT += dt;
  if (hintQueue.length && hintT > hintQueue[0].t) { const h = hintQueue.shift()!; const el = $('hint'); el.textContent = h.text; show('hint', true); setTimeout(() => show('hint', false), 4500); }
  // toasts
  toastT -= dt;
  if (toastT < 0) { toastT = 11 + Math.random() * 9; toast(CORP[Math.floor(Math.random() * CORP.length)], Math.random() < 0.3 ? 'cash' : ''); }
  if (crowd.events.length) { const e = crowd.events.shift()!; if (Math.random() < 0.6) toast(e); crowd.events.length = 0; }
  // horn / radio keys
  if (input.horn !== lastHorn) { audio.horn(input.horn); lastHorn = input.horn; }
  if (input.hit('KeyR')) toggleRadio();
  if (input.hit('Escape', 'KeyP')) setPause(true);
  // clock
  const left = limit - dayTime;
  const ct = $('clockTime'); ct.textContent = left >= 0 ? fmtShort(left) : '+' + fmtShort(-left); ct.classList.toggle('late', left < 0);
  // dash
  $('spd').textContent = String(Math.round(Math.abs(truck.v) * 3.6));
  const g = $('gear'); g.textContent = truck.gear; g.classList.toggle('r', truck.gear === 'R');
  const ff = $('fuelFill'); ff.style.width = (truck.fuel * 100).toFixed(0) + '%'; ff.classList.toggle('low', truck.fuel < 0.15);
  audio.setEngine(Math.min(1, Math.abs(truck.v) / 24 + truck.throttleNow * 0.25), truck.throttleNow, true);
}
function nearestFuel(): Lot {
  let best = city.fuel[0], bd = Infinity;
  for (const f of city.fuel) { const d = Math.abs(f.entry.x - truck.x) + Math.abs(f.entry.z - truck.z); if (d < bd) { bd = d; best = f; } }
  return best;
}
const CORP = [
  'Shift performance: 94% · Keep it up!', 'Transaction confirmed: −2 CR road usage fee', 'Reminder: customer smiles are rated',
  'Priority Routes unlock at 98% shift score', 'MetaShift Workforce: 12,408 workers online', 'Now hiring: Night Greeters · 9 CR/hr',
  'Skyline Lofts: virtual penthouses 5% off today', 'Your headset battery: 61%', 'Idle detection active. Stay engaged!',
  'Tip: on-time deliveries protect your rating', 'Transaction confirmed: +0.40 CR mileage credit', 'New cosmetic drop: Aurora Jacket · 2,400 CR',
  'Weekly leaderboard resets in 2 days', 'Break eligibility: 0 min remaining',
];

function toggleRadio() {
  audio.radioOn = !audio.radioOn; audio.click(); audio.setRadio(state === 'drive');
  $('radioBtn').classList.toggle('on', audio.radioOn); $('radioBtn2').textContent = 'RADIO: ' + (audio.radioOn ? 'ON' : 'OFF');
  toast(audio.radioOn ? '♪ SHIFT FM 98.6 · Electro Hits, all day' : 'Radio off');
}

function finishDrive() {
  setStatus(null); show('hint', false);
  audio.horn(false); lastHorn = false; audio.hiss();
  truck.v = 0; truck.throttleNow = 0; truck.brakeNow = 1;
  T_levelComplete();
  const r = deliverResolve; deliverResolve = null; r?.();
}
function T_levelComplete() { tes()?.gameplay?.levelComplete({ levelId: 'day-' + L.day }); }

// ------------------------------------------------------------------ pause
function setPause(v: boolean) {
  if (state !== 'drive') v = false;
  paused = v; show('pause', v);
  if (v) { audio.setRadio(false); audio.setEngine(0, 0, false); audio.horn(false); }
  else audio.setRadio(state === 'drive');
}
$('pauseBtn').addEventListener('click', () => setPause(true));
$('resumeBtn').addEventListener('click', () => setPause(false));
$('radioBtn').addEventListener('click', () => toggleRadio());
$('radioBtn2').addEventListener('click', () => toggleRadio());
$('restartBtn').addEventListener('click', () => {
  tes()?.gameplay?.levelFail('day-' + L.day, 'restart');
  setPause(false); setupLevel(levelIdx); tes()?.gameplay?.levelStart({ levelId: 'day-' + L.day, levelIndex: levelIdx }); $('clockPen').textContent = '';
});
$('quitBtn').addEventListener('click', () => {
  tes()?.gameplay?.levelFail('day-' + L.day, 'quit');
  setPause(false); deliverResolve = null; enterTitle();
});

// ------------------------------------------------------------------ skip
let canSkip = false;
function setSkippable(v: boolean) { canSkip = v; show('skip', v); }
$('skip').addEventListener('click', e => { e.stopPropagation(); if (canSkip) { D.skip(); audio.hush(); } });

// ------------------------------------------------------------------ speech
const VOICE = 'assets/audio/voice/';
function lineFile(day: number, i: number, who: 'D' | 'E') { return who === 'D' ? `${VOICE}driver/voice_d${day}_${i}.mp3` : `${VOICE}day${day}/voice_l${i}.mp3`; }
function preloadDay(day: number) { LEVELS[day - 1]?.lines.forEach((ln, i) => audio.preload(lineFile(day, i, ln.who))); }
async function say(label: string, text: string, ch: Character | null, voice: 'driver' | 'system' | number, file?: string) {
  sub(label, text);
  if (ch) ch.talking = true;
  let done = false;
  audio.speak(text, voice, () => { done = true; }, file);
  await D.until(() => done);
  if (D.skipping) audio.hush();
  if (ch) ch.talking = false;
}

// ------------------------------------------------------------------ cinematics
let cineChars: Character[] = [];
let cineCam: { pos: THREE.Vector3; look: THREE.Vector3; tags: boolean } | null = null;
let cineTime = 0;
let lastCine: { pos: THREE.Vector3; look: THREE.Vector3; tags: boolean } | null = null;
function freePoint(x: number, z: number) {
  const c = city.cell(x, z);
  for (const si of city.solidGrid[c]) { const r = city.solids[si]; if (x > r.x0 - 0.6 && x < r.x1 + 0.6 && z > r.z0 - 0.6 && z < r.z1 + 0.6) return false; }
  return true;
}
async function deliveryScene() {
  const h = truck.h; const fx = Math.cos(h), fz = Math.sin(h); const lx = Math.sin(h), lz = -Math.cos(h);
  const at = (f: number, l: number) => new THREE.Vector3(truck.x + fx * f + lx * l, 0.15, truck.z + fz * f + lz * l);
  const driver = new Character({ skin: 0xe8b890, shirt: 0x1d4fa8, pants: 0x1b2433, hair: 0x2a1d14, hat: 'cap', hatColor: 0x5ff2ff, glow: 0x0a1a40, name: 'WORKER_4471 (you)', nameColor: '#5ff2ff' });
  const emp = new Character({ ...L.employee });
  scene.add(driver.root, emp.root); cineChars = [driver, emp];
  // choose meeting spot with free space
  const options: [number, number, number, number][] = [[8.0, 0.4, 9.7, -0.4], [2.0, 3.6, 2.4, 5.2], [2.0, -3.6, 2.4, -5.2], [-3, 3.6, -3, 5.2]];
  let meet = options[0];
  for (const o of options) { const a = at(o[0], o[1]), b = at(o[2], o[3]); if (freePoint(a.x, a.z) && freePoint(b.x, b.z)) { meet = o; break; } }
  const door = at(2.6, 1.9); const M = at(meet[0], meet[1]); const E = at(meet[2], meet[3]);
  driver.root.position.copy(door); driver.resetPose(); emp.resetPose();
  emp.root.position.copy(E);
  const face = (ch: Character, tgt: THREE.Vector3) => { ch.root.rotation.y = Math.atan2(tgt.x - ch.root.position.x, tgt.z - ch.root.position.z); };
  face(emp, M);
  emp.setExpr('neutral'); driver.setExpr('neutral');
  // shot 1: wide establishing, from whichever side has a clear view
  const clearLine = (p: THREE.Vector3, q: THREE.Vector3) => { for (let k = 0; k <= 8; k++) { const x = lerp(p.x, q.x, k / 8), z = lerp(p.z, q.z, k / 8); if (!freePoint(x, z)) return false; } return true; };
  const wideOpts = [at(15, 8), at(15, -8), at(18, 2), at(-6, 9), at(-6, -9), at(9, 4)];
  const wide = (wideOpts.find(p => clearLine(p, door)) ?? wideOpts[2]).clone().setY(5);
  cineCam = { pos: wide, look: door.clone().setY(1.4), tags: true };
  await D.wait(0.6);
  audio.thud();
  // walk
  const path = meet === options[0] ? [door, at(7.2, 2.0), M] : [door, M];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1].clone(), b = path[i]; face(driver, b);
    const dur = a.distanceTo(b) / 1.5;
    let stepAcc = 0;
    await D.tween(dur, p => {
      driver.root.position.lerpVectors(a, b, p); driver.walk(1 / 60, 1.5);
      stepAcc += 1; if (stepAcc % 22 === 0) audio.step();
      cineCam!.look.lerp(driver.root.position.clone().setY(1.3), 0.08);
    });
  }
  driver.resetPose(); face(driver, E);
  // two-shot setup
  const mid = M.clone().add(E).multiplyScalar(0.5);
  const dir = E.clone().sub(M).normalize(); const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const sideSign = freePoint(mid.x + side.x * 4, mid.z + side.z * 4) ? 1 : -1;
  const twoShot = () => { cineCam = { pos: mid.clone().addScaledVector(side, 4.4 * sideSign).setY(1.8), look: mid.clone().setY(1.45), tags: true }; };
  const ots = (listener: THREE.Vector3, speaker: THREE.Vector3) => {
    const d = speaker.clone().sub(listener).normalize(); const sd = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(0.85 * sideSign);
    cineCam = { pos: listener.clone().addScaledVector(d, -1.7).add(sd).setY(1.95), look: speaker.clone().setY(1.5), tags: false };
  };
  twoShot();
  await D.wait(0.4);
  const empVoice = levelIdx;
  for (let i = 0; i < L.lines.length; i++) {
    const ln = L.lines[i];
    const spk = ln.who === 'D' ? driver : emp, lis = ln.who === 'D' ? emp : driver;
    if (i === 0 || i === L.lines.length - 1) twoShot();
    else if (i % 3 === 2) twoShot();
    else ots(lis.root.position, spk.root.position);
    if (ln.face) emp.setExpr(ln.face);
    if (ln.dface) driver.setExpr(ln.dface);
    await say(ln.who === 'D' ? 'WORKER_4471 (you)' : L.empName, ln.text, spk, ln.who === 'D' ? 'driver' : empVoice, lineFile(L.day, i, ln.who));
    await D.wait(ln.pause ?? 0.35);
  }
  sub(null);
  twoShot();
  emp.setExpr('neutral'); driver.setExpr('neutral');
  audio.ding(); toast('Delivery confirmed · signature received', 'cash');
  await D.wait(1.0);
}
function clearCine() { for (const c of cineChars) scene.remove(c.root); cineChars = []; cineCam = null; sub(null); }

// ------------------------------------------------------------------ summary
function summary(dayTotal: number, pay: number, bonus: number, late: boolean): Promise<void> {
  const perf = Math.max(40, Math.round(100 - collisions * 6 - violations * 8 - (late ? 12 : 0)));
  const stars = perf >= 95 ? 5 : perf >= 85 ? 4 : perf >= 72 ? 3 : perf >= 58 ? 2 : 1;
  const remaining = Math.max(0, RENT - run.earned);
  const el = $('summary');
  el.innerHTML = `<h2>SHIFT SUMMARY · DAY ${L.day}</h2><h1>Delivery completed</h1>
    <div class="row"><span>${destLot.name}</span><b class="pos">Delivered</b></div>
    <div class="row"><span>Delivery time</span><b>${fmt(dayTime)}${late ? ' <span class="neg">(late)</span>' : ''}</b></div>
    <div class="row"><span>Collision penalties</span><b class="${collisions ? 'neg' : ''}">${collisions} × 5s</b></div>
    <div class="row"><span>Driving violations</span><b class="${violations ? 'neg' : ''}">${violations} × 10s</b></div>
    <div class="row"><span>Leaderboard time today</span><b>${fmt(dayTotal)}</b></div>
    <div class="row"><span>Credits earned</span><b class="pos">${pay} CR</b></div>
    <div class="row"><span>Remaining rent balance</span><b>${remaining > 0 ? money(remaining) : 'Covered'}</b></div>
    <div class="row"><span>Overall performance</span><b>${perf}% <span class="stars">${starSvg(stars)}</span></b></div>
    <div class="txn">Transaction confirmed · ${BASE_PAY} CR base + ${bonus} CR performance → ${money(pay)} transferred to your real-world account.</div>
    <div id="sumBadges"></div>
    <button class="btn" id="clockOut">CLOCK OUT</button>`;
  show('summary', true); audio.ding();
  return new Promise(res => {
    const go = () => { show('summary', false); res(); };
    ($('clockOut') as HTMLElement).addEventListener('click', go);
    summaryKey = go;
  });
}
let summaryKey: (() => void) | null = null;

// ------------------------------------------------------------------ results / leaderboard
async function results() {
  state = 'results';
  const total = run.times.reduce((a, b) => a + b, 0);
  const ms = Math.round(total * 1000);
  const el = $('results');
  const rows = run.times.map((t, i) => `<div class="row"><span>Day ${i + 1} · ${LEVELS[i].title}</span><b>${fmt(t)}</b></div>`).join('');
  el.innerHTML = `<h2>TEN-DAY SHIFT COMPLETE</h2><h1>Total time ${fmt(total)}</h1>
    ${rows}
    <div class="row"><span>Collisions / violations</span><b>${run.collisions} / ${run.violations}</b></div>
    <div class="row"><span>Earned</span><b class="pos">${money(run.earned)} · rent covered</b></div>
    <div id="resBadges"></div>
    <h2 style="margin-top:14px">TOP DRIVERS</h2><div class="lb" id="lb"><div class="small">Loading leaderboard…</div></div>
    <button class="btn" id="againBtn">START A NEW SHIFT</button><button class="btn alt" id="titleBtn">TITLE SCREEN</button>`;
  show('results', true);
  showEarned('resBadges', earnedThisRun.filter(id => id === 'rent-covered' || id === 'model-worker'));
  $('againBtn').addEventListener('click', () => { show('results', false); startRun(newRun()); });
  $('titleBtn').addEventListener('click', () => { show('results', false); enterTitle(); });
  tes()?.gameplay?.score({ value: ms });
  const t = await tesanaClient();
  let rankText = '';
  try {
    if (t?.scores) {
      const r = await t.scores.submit('total-shift-time', ms);
      if (r?.improved) rankText = '<div class="small" style="color:#6dffb6">New personal best!</div>';
    }
  } catch (e) { console.warn('score not sent', e); }
  await drawBoard($('lb'), rankText);
}
async function drawBoard(box: HTMLElement, extra = '') {
  const t = await tesanaClient();
  let entries: AnyObj[] = [];
  try { if (t?.scores) entries = (await t.scores.top('total-shift-time', { limit: 10 }))?.entries || []; } catch { entries = []; }
  let mine = '';
  try { if (t?.scores) { const b = await t.scores.best('total-shift-time'); if (b) mine = `<div class="row you"><span>Your best</span><b>${fmt(b.score / 1000)}</b></div>`; } } catch { /* */ }
  const you = entries.find(e => e.you);
  box.innerHTML = extra + (entries.length ? entries.map(e => `<div class="row ${e.you ? 'you' : ''}"><span>#${e.rank} ${escapeHtml(String(e.displayName))}</span><b>${fmt(e.score / 1000)}</b></div>`).join('') : '<div class="small">No shifts ranked yet. Be the first!</div>')
    + (you ? `<div class="small" style="color:#5ff2ff">Your rank: #${you.rank}</div>` : mine);
}
function starSvg(n: number) { let o = ''; for (let i = 0; i < 5; i++) o += `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z" fill="${i < n ? '#ffd23f' : 'none'}" stroke="#ffd23f" stroke-width="1.5"/></svg>`; return o; }
function escapeHtml(s: string) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

// ------------------------------------------------------------------ achievements
const BADGE_NAMES: Record<string, string> = {
  'first-delivery': 'First Shift', 'deliveries-10': 'Regular Worker', 'deliveries-30': 'Company Lifer', 'clean-5': 'Spotless Record',
  'ontime-10': 'Punctual', 'long-haul': 'Long Haul', 'dock-master': 'Back It In', 'rent-covered': 'Rent Covered', 'model-worker': 'Model Worker',
};
let earnedThisRun: string[] = [];
function showEarned(slot: string, ids: string[]) {
  if (!ids.length) return;
  const el = document.getElementById(slot); if (!el) return;
  el.innerHTML += ids.map(id => `<div class="txn badge-earned">Badge earned · ${escapeHtml(BADGE_NAMES[id] ?? id)}</div>`).join('');
}
async function reportDelivery(onTime: boolean, clean: boolean, meters: number, dock: boolean) {
  const t = await tesanaClient(); const a = t?.achievements; if (!a) return;
  const got: string[] = [];
  const add = (r: AnyObj | null | undefined, id?: string) => { if (r?.unlocked === true && id) got.push(id); if (Array.isArray(r?.unlocked)) got.push(...r!.unlocked); };
  try {
    add(await a.unlock('first-delivery'), 'first-delivery');
    add(await a.progress('deliveries', 1));
    if (clean) add(await a.progress('clean_deliveries', 1));
    if (onTime) add(await a.progress('ontime_deliveries', 1));
    if (meters > 0) add(await a.progress('meters', meters));
    if (dock) add(await a.unlock('dock-master'), 'dock-master');
  } catch (e) { console.warn('badge', e); }
  earnedThisRun.push(...got);
  if (state === 'summary') showEarned('sumBadges', got);
}
async function reportRunEnd(perfect: boolean) {
  const t = await tesanaClient(); const a = t?.achievements; if (!a) return;
  const got: string[] = [];
  try {
    if ((await a.unlock('rent-covered'))?.unlocked === true) got.push('rent-covered');
    if (perfect && (await a.unlock('model-worker'))?.unlocked === true) got.push('model-worker');
  } catch (e) { console.warn('badge', e); }
  if (state === 'results') showEarned('resBadges', got); else earnedThisRun.push(...got);
}
async function openBadges() {
  show('badges', true);
  const box = $('badgeList'); box.innerHTML = '<div class="small">Loading…</div>';
  const t = await tesanaClient();
  let items: AnyObj[] = [];
  try { if (t?.achievements) items = await t.achievements.list() || []; } catch { items = []; }
  if (!items.length) { box.innerHTML = '<div class="small">Badges are unavailable right now. Try again later.</div>'; return; }
  box.innerHTML = items.map(a => {
    const hide = a.secret && !a.unlocked;
    const name = hide ? '???' : escapeHtml(String(a.name ?? a.id));
    const desc = hide ? 'A secret badge. Keep working.' : escapeHtml(String(a.description ?? ''));
    let bar = '';
    if (a.target && !a.unlocked) {
      const p = Math.max(0, Math.min(1, (Number(a.progress) || 0) / a.target));
      const shown = a.stat === 'meters' || a.id === 'long-haul' ? `${((Number(a.progress) || 0) / 1000).toFixed(1)} / ${(a.target / 1000).toFixed(0)} km` : `${Math.min(a.target, Number(a.progress) || 0)} / ${a.target}`;
      bar = `<div class="bbar"><div style="width:${(p * 100).toFixed(1)}%"></div></div><div class="bnum">${shown}</div>`;
    }
    return `<div class="badge ${a.unlocked ? 'got' : ''}"><div class="bic">${a.unlocked ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6dffb6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : hide ? '?' : ''}</div><div class="btx"><b>${name}</b><span>${desc}</span>${bar}</div></div>`;
  }).join('');
}

// ------------------------------------------------------------------ flow
let runToken = 0;
async function startRun(r: RunSave) {
  audio.init();
  audio.preload(VOICE + 'system/voice_welcome.mp3'); audio.preload(VOICE + 'driver/voice_apt_rent.mp3'); audio.preload(VOICE + 'driver/voice_apt_work.mp3');
  run = r; const tok = ++runToken; earnedThisRun = [];
  audio.setRadio(false);
  show('title', false);
  for (let d = run.day; d < LEVELS.length; d++) {
    await runDay(d, tok);
    if (tok !== runToken) return;
  }
  // final
  if (tok !== runToken) return;
  clearRun();
  reportRunEnd(run.collisions === 0 && run.violations === 0);
  state = 'final'; show('finalCard', true); fade(0); audio.jingle();
  setSkippable(true); D.reset();
  await D.wait(3.6);
  setSkippable(false); D.reset();
  show('finalCard', false); fade(0);
  results();
}

async function runDay(d: number, tok: number) {
  const last = d === LEVELS.length - 1;
  setupLevel(d);
  // --- morning
  state = 'morning'; D.reset(); setSkippable(true);
  fade(1); await D.wait(0.2); fade(0);
  preloadDay(L.day);
  await apt.morning(D, L.day, (_w, text, ch) => say('Driver', text, ch, 'driver', text.startsWith('Oh') ? VOICE + 'driver/voice_apt_rent.mp3' : VOICE + 'driver/voice_apt_work.mp3'), audio, s => { const c = $('daycard'); c.textContent = s; show('daycard', true); setTimeout(() => show('daycard', false), 2600); });
  if (tok !== runToken) return;
  D.reset(); fade(1); await D.wait(0.7);
  // --- loading
  state = 'loading'; show('loading', true); fade(0); D.reset();
  audio.jingle();
  const msgs = ['Verifying worker ID #4471…', 'Syncing shift contract…', 'Assigning delivery route…', 'Loading MetaShift City…'];
  let spoke = false;
  audio.speak('Welcome to MetaShift. Your income stream.', 'system', () => { spoke = true; }, VOICE + 'system/voice_welcome.mp3');
  sub('MetaShift', 'Welcome to MetaShift. Your income stream.');
  await D.tween(4.2, p => { ($('loadFill') as HTMLElement).style.width = (p * 100).toFixed(0) + '%'; $('loadMsg').textContent = msgs[Math.min(3, Math.floor(p * 4))]; });
  await D.until(() => spoke || D.time > 0);
  audio.hush(); sub(null);
  if (tok !== runToken) return;
  fade(1); await D.wait(0.35); show('loading', false); setSkippable(false); D.reset();
  // --- drive
  setupLevel(d);
  state = 'drive'; show('hud', true); input.touchUI.classList.add('active'); layout(); $('clockPen').textContent = '';
  $('toasts').innerHTML = '';
  fade(0);
  audio.setRadio(true);
  tes()?.gameplay?.levelStart({ levelId: 'day-' + L.day, levelIndex: d });
  toast(`Shift started · Deliver to ${destLot.name}`);
  await new Promise<void>(res => { deliverResolve = res; });
  if (tok !== runToken) return;
  // --- delivered
  const late = dayTime > limit;
  const dayTotal = dayTime + penalties;
  const bonus = Math.max(0, 15 - collisions * 3 - violations * 3 - (late ? 8 : 0));
  const pay = BASE_PAY + bonus;
  run.times.push(dayTotal); run.pens.push(penalties); run.collisions += collisions; run.violations += violations;
  state = 'deliver'; show('hud', false); input.touchUI.classList.remove('active'); audio.setRadio(false); audio.setEngine(0, 0, false);
  D.reset(); setSkippable(true);
  await deliveryScene();
  setSkippable(false); D.reset();
  run.earned = Math.min(RENT, run.earned + pay);
  reportDelivery(!late, collisions === 0 && violations === 0, Math.round(truck.odo - odoStart), destLot.kind === 'dock');
  state = 'summary';
  await summary(dayTotal, pay, bonus, late);
  clearCine();
  if (tok !== runToken) return;
  summaryKey = null;
  run.day = d + 1;
  if (!last) saveRun();
  // --- night
  fade(1); await D.wait(0.5);
  state = last ? 'final' : 'night'; D.reset(); setSkippable(true); fade(0);
  if (last) state = 'night';
  await apt.night(D, last, (t, b) => note(t, b), audio, last ? '' : `Payout received · rent balance ${money(Math.max(0, RENT - run.earned))} remaining`);
  D.reset(); setSkippable(false);
  fade(1); await D.wait(1.0);
}

function enterTitle() {
  runToken++;
  state = 'title'; paused = false;
  show('hud', false); show('summary', false); show('results', false); show('loading', false); show('pause', false); show('finalCard', false);
  setSkippable(false); sub(null); setStatus(null); input.touchUI.classList.remove('active');
  audio.setRadio(true, true); audio.setEngine(0, 0, false); audio.setRain(0); audio.hush();
  clearCine(); city.blocked.clear(); city.removeSolids(baseSolids); conGroup.clear(); destGroup.clear(); ribbon.geometry = new THREE.BufferGeometry();
  setWeather('title');
  traffic.setup(34, 10, 400, 400); crowd.reset(400, 400);
  truck.reset(city.dcStarts[0].x, city.dcStarts[0].z, city.dcStarts[0].h, 1);
  const saved = loadRun();
  const cb = $('contBtn'); cb.classList.toggle('hidden', !saved); if (saved) cb.textContent = `CONTINUE · DAY ${saved.day + 1}`;
  show('title', true); fade(0);
  attractT = 0; attractPanel = -1; nextAttract();
}
function nextAttract() {
  attractPanel = (attractPanel + 1) % 3;
  const box = $('attract');
  if (attractPanel === 0) box.innerHTML = `<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">TEN DAYS · TEN DELIVERIES</h2><div class="keys">Drive an 18-wheeler through MetaShift City. Make your deliveries, get paid, cover the rent.<br>Fastest total time across all ten days tops the board.</div></div>`;
  else if (attractPanel === 1) { box.innerHTML = `<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">TOP DRIVERS</h2><div id="tlb"><div class="small">Loading…</div></div></div>`; drawBoard($('tlb')); }
  else box.innerHTML = `<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">HOW TO DRIVE</h2><div class="keys"><b>Touch:</b> drag the wheel · GAS / BRAKE pedals (hold BRAKE when stopped to reverse)<br><b>Keys:</b> W/S gas & brake · A/D steer · H horn · R radio · Esc pause<br><b>Pad:</b> RT gas · LT brake · stick steer</div></div>`;
}
$('badgeBtn').addEventListener('click', e => { e.stopPropagation(); openBadges(); });
$('badgeBtn2').addEventListener('click', () => openBadges());
$('badgeClose').addEventListener('click', e => { e.stopPropagation(); show('badges', false); });
$('badges').addEventListener('click', e => e.stopPropagation());
$('startBtn').addEventListener('click', e => { e.stopPropagation(); clearRun(); startRun(newRun()); });
$('contBtn').addEventListener('click', e => { e.stopPropagation(); const s = loadRun(); startRun(s ?? newRun()); });
$('title').addEventListener('click', () => { if (state === 'title' && !loadRun()) startRun(newRun()); });

// ------------------------------------------------------------------ layout
function layout() {
  // 4:3 arcade stage on wide screens (letterboxed); portrait phones keep filling the screen
  const winW = window.innerWidth, winH = window.innerHeight;
  if (winW >= 2 && winH >= 2) {
    let sw = winW, sh = winH;
    if (winW / winH >= 1) { sw = Math.min(winW, winH * 4 / 3); sh = sw * 3 / 4; }
    const l = Math.round((winW - sw) / 2), t = Math.round((winH - sh) / 2);
    for (const el of [host, uiRoot]) { el.style.left = l + 'px'; el.style.top = t + 'px'; el.style.width = Math.round(sw) + 'px'; el.style.height = Math.round(sh) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; }
    uiRoot.style.setProperty('--vw', (sw / 100) + 'px'); uiRoot.style.setProperty('--vh', (sh / 100) + 'px');
  }
  const w = host.clientWidth, h = host.clientHeight;
  if (w < 2 || h < 2) return;
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(DPR); renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
  }
  VW = w; VH = h;
  renderer.setSize(w, h);
  const aspect = w / h;
  const vfov = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(64) / 2) / aspect) * 180 / Math.PI, 50, 96);
  camera.fov = vfov; camera.aspect = aspect; camera.updateProjectionMatrix();
  hudCam.left = 0; hudCam.right = w; hudCam.top = 0; hudCam.bottom = -h; hudCam.updateProjectionMatrix();
  // HUD element positions
  const gps = $('gps').getBoundingClientRect(), clk = $('clock').getBoundingClientRect();
  const portrait = aspect < 1;
  const top = Math.max(gps.bottom, clk.bottom) - host.getBoundingClientRect().top + 8;
  let mh = Math.min(h * 0.21, 190), mw = Math.round(mh * 0.6);
  const sl = 3, sr = 3; // mirrors sit on the very outer edges of the screen, like real door mirrors
  if (portrait) { const maxB = h / 2 - 70; if (top + mh > maxB) { mh = Math.max(80, maxB - top); mw = Math.round(mh * 0.6); } }
  mirrorRect[0] = { x: sl, y: top, w: mw, h: mh };
  mirrorRect[1] = { x: w - sr - mw, y: top, w: mw, h: mh };
  for (let i = 0; i < 2; i++) {
    const r = mirrorRect[i];
    mirrorMesh[i].scale.set(-r.w, r.h, 1); mirrorMesh[i].position.set(r.x + r.w / 2, -(r.y + r.h / 2), 0);
    mirrorFrame[i].scale.set(r.w + 8, r.h + 8, 1); mirrorFrame[i].position.set(r.x + r.w / 2, -(r.y + r.h / 2), -1);
    mirrorCam[i].aspect = r.w / r.h; mirrorCam[i].updateProjectionMatrix();
    mirrorRT[i].setSize(Math.round(r.w * DPR * 0.8), Math.round(r.h * DPR * 0.8));
  }
  const tb = $('toasts'); tb.style.top = (top + 4) + 'px'; tb.style.width = Math.max(140, w - 2 * (mw + 22)) + 'px';
  $('status').style.top = (top + mh + 14) + 'px';
  const touch = document.body.classList.contains('touchmode');
  $('dashInfo').style.bottom = touch ? `calc(66px + var(--sb))` : `calc(12px + var(--sb))`;
  if (touch && portrait) { $('dashInfo').style.bottom = `calc(196px + var(--sb))`; }
  $('hint').style.bottom = touch && portrait ? `calc(262px + var(--sb))` : touch ? `calc(128px + var(--sb))` : `calc(80px + var(--sb))`;
}
new ResizeObserver(() => layout()).observe(host);
window.addEventListener('resize', layout);
const mo = new MutationObserver(() => layout()); mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// ------------------------------------------------------------------ main loop
let lastT = performance.now();
let mirrorFlip = 0, dashT = 0;
const camPos = new THREE.Vector3();
function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (!renderer) { layout(); if (!renderer) return; }
  input.update(dt);
  // global keys
  if (canSkip && input.hit('Enter', 'Space', 'KeyX')) { D.skip(); audio.hush(); }
  if (state === 'summary' && summaryKey && input.hit('Enter', 'Space')) summaryKey();
  if (state === 'title' && input.hit('Enter', 'Space')) { const sv = loadRun(); startRun(sv ?? newRun()); }
  if (paused && input.hit('Escape', 'KeyP', 'Enter')) setPause(false);
  if (state !== 'drive') input.hit('KeyR', 'Escape', 'KeyP');

  if (!paused) {
    worldT += dt; lightT += dt;
    D.update(dt);
    city.updateLights(lightT);
  }
  const r = renderer;
  if (state === 'morning' || state === 'night') {
    apt.update(dt, VW / VH);
    r.setRenderTarget(null); r.autoClear = true;
    r.render(apt.scene, apt.camera);
    return;
  }
  if (state === 'loading' || state === 'final' || state === 'boot') { if (state === 'boot') return; return; }

  // city world
  if (!paused) {
    if (state === 'drive') updateDrive(dt);
    const obbs: OBB[] = state === 'title' ? [] : truck.obbs();
    const fx = state === 'title' ? camera.position.x : truck.x, fz = state === 'title' ? camera.position.z : truck.z;
    traffic.update(dt, lightT, obbs, fx, fz);
    crowd.update(dt, worldT, fx, fz);
    truck.animate(dt, isRain, isNight);
    rainMat.uniforms.uTime.value = worldT;
    for (const c of cineChars) { c.update(dt); }
    if (cineChars.length) { cineTime += dt; cineChars[1]?.idle(cineTime); if (cineChars[1]?.talking) cineChars[1].gesture(cineTime); if (cineChars[0]?.talking) cineChars[0].gesture(cineTime * 0.9); }
  }
  // camera
  if (state === 'title') {
    const a = worldT * 0.04;
    camera.fov = THREE.MathUtils.clamp(camera.fov, 50, 80); camera.updateProjectionMatrix();
    camera.position.set(400 + Math.cos(a) * 330, 95 + Math.sin(a * 2) * 20, 400 + Math.sin(a) * 330);
    camera.lookAt(400 + Math.cos(a + 0.8) * 120, 10, 400 + Math.sin(a + 0.8) * 120);
    attractT += dt; if (attractT > 7) { attractT = 0; nextAttract(); }
  } else if (cineCam && (state === 'deliver' || state === 'summary')) {
    const cf = VW / VH < 1 ? 54 : 40;
    if (camera.fov !== cf) { camera.fov = cf; camera.aspect = VW / VH; camera.updateProjectionMatrix(); }
    if (cineCam !== lastCine) { camera.position.copy(cineCam.pos); lastCine = cineCam; for (const c of cineChars) if (c.tag) c.tag.visible = cineCam.tags; }
    camera.lookAt(cineCam.look);
  } else {
    layoutCamFov();
    truck.tractor.updateMatrixWorld(true);
    truck.camAnchor.getWorldPosition(camPos);
    shake = Math.max(0, shake - dt * 2.5);
    const sx = (Math.random() - 0.5) * shake * 0.15, sy = (Math.random() - 0.5) * shake * 0.1;
    camera.position.set(camPos.x + sx, camPos.y + sy + Math.sin(worldT * 9) * Math.min(0.012, Math.abs(truck.v) * 0.0008), camPos.z);
    const yaw = Math.PI / 2 - truck.h + Math.PI - truck.delta * 0.35;
    camera.rotation.set(-0.11 + truck.lonAcc * 0.004, yaw, -truck.latAcc * 0.002, 'YXZ');
  }
  sky.position.copy(camera.position);
  rainMat.uniforms.uCam.value.copy(camera.position);
  truck.interior.visible = state === 'drive';
  ribbon.visible = state === 'drive';
  if (state === 'drive') {
    dashT -= dt;
    if (dashT < 0) { dashT = 0.15; const left = limit - dayTime; truck.drawDash(`DAY ${L.day} · ${left >= 0 ? fmtShort(left) : 'LATE'}`, audio.radioOn, '98.6 FM', truck.fuel < 0.15); }
  }
  // mirrors (alternate each frame)
  r.autoClear = true;
  if (state === 'drive') {
    const i = mirrorFlip++ % 2;
    const anchor = i === 0 ? truck.mirrorL : truck.mirrorR;
    anchor.getWorldPosition(tmpV);
    const mc = mirrorCam[i];
    mc.position.copy(tmpV);
    const fx = Math.cos(truck.h), fz = Math.sin(truck.h); const lx = Math.sin(truck.h), lz = -Math.cos(truck.h);
    const out = i === 0 ? 1 : -1;
    mc.lookAt(tmpV.x - fx * 30 + lx * out * 2.2, tmpV.y - 1.6, tmpV.z - fz * 30 + lz * out * 2.2);
    r.setRenderTarget(mirrorRT[i]); r.render(scene, mc); r.setRenderTarget(null);
  }
  r.render(scene, camera);
  if (state === 'drive') { r.autoClear = false; r.clearDepth(); r.render(hudScene, hudCam); r.autoClear = true; }
}
function layoutCamFov() {
  const aspect = VW / VH;
  const vfov = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(64) / 2) / aspect) * 180 / Math.PI, 50, 96);
  if (Math.abs(camera.fov - vfov) > 0.01 || camera.aspect !== aspect) { camera.fov = vfov; camera.aspect = aspect; camera.updateProjectionMatrix(); }
}

// boot
input.onAnyPress = () => audio.init();
layout();
enterTitle();
requestAnimationFrame(frame);
(W as AnyObj).__ms = { audio, forceRefuel() { refueled = true; }, get info() { return renderer ? { calls: renderer.info.render.calls, tris: renderer.info.render.triangles } : null; }, truck, city, traffic, computeRoute, get route() { return route; }, get state() { return state; }, setupLevel, finishDrive, startRun, newRun, LEVELS, D, PLAYER_NAMES };
