import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---- City layout constants ----
export const P = 80;          // node pitch (block + road)
export const HALF_ROAD = 9;   // curb distance from road centreline
export const NB = 10;         // blocks per side
export const NN = NB + 1;     // nodes per side
export const INSET = 4;       // building inset from curb
export const LANE = 4;        // right-lane offset from centreline

export interface Rect { x0: number; z0: number; x1: number; z1: number }
export type Side = 'N' | 'S' | 'E' | 'W';
export type LotKind = 'curb' | 'alley' | 'dock' | 'fuel';

export interface Lot {
  id: string; kind: LotKind; bi: number; bj: number; side: Side;
  rect: Rect; inward: { x: number; z: number }; along: { x: number; z: number };
  entry: { x: number; z: number }; edge: [number, number];
  name: string; color: string;
}

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export const nodeId = (i: number, j: number) => i + j * NN;
export const nodePos = (id: number) => ({ x: (id % NN) * P, z: Math.floor(id / NN) * P });
export const edgeKey = (a: number, b: number) => (a < b ? a + ':' + b : b + ':' + a);

export function blockRect(bi: number, bj: number): Rect {
  return { x0: bi * P + HALF_ROAD, z0: bj * P + HALF_ROAD, x1: (bi + 1) * P - HALF_ROAD, z1: (bj + 1) * P - HALF_ROAD };
}

// ---- Static content tables ----
export const STORE_DEFS: { id: string; bi: number; bj: number; side: Side; kind: LotKind; name: string; color: string }[] = [
  { id: 'grocery', bi: 3, bj: 1, side: 'E', kind: 'curb', name: 'FRESHLOOP GROCERY', color: '#3fbf6a' },
  { id: 'electronics', bi: 4, bj: 3, side: 'S', kind: 'curb', name: 'VOLTAGE ELECTRONICS', color: '#3f8cff' },
  { id: 'clothing', bi: 5, bj: 6, side: 'W', kind: 'alley', name: 'THREADLINE CLOTHING', color: '#d64fd0' },
  { id: 'restaurant', bi: 4, bj: 5, side: 'N', kind: 'curb', name: "BYTE'S DINER", color: '#ff7a3a' },
  { id: 'furniture', bi: 9, bj: 0, side: 'N', kind: 'curb', name: 'NESTWELL FURNITURE', color: '#c9a35a' },
  { id: 'pharmacy', bi: 2, bj: 6, side: 'E', kind: 'curb', name: 'PIXELCARE PHARMACY', color: '#4fd6c8' },
  { id: 'convenience', bi: 3, bj: 7, side: 'S', kind: 'alley', name: 'QUIKLOG 24/7', color: '#ffd23f' },
  { id: 'hardware', bi: 8, bj: 6, side: 'W', kind: 'curb', name: 'BLOCKSMITH HARDWARE', color: '#e8553f' },
  { id: 'department', bi: 2, bj: 2, side: 'N', kind: 'dock', name: 'GRANDVIEW DEPARTMENT STORE', color: '#a77bff' },
  { id: 'supermarket', bi: 8, bj: 8, side: 'S', kind: 'curb', name: 'MEGAMART SUPERMARKET', color: '#ff4f6d' },
];
export const FUEL_DEFS: { bi: number; bj: number; side: Side }[] = [
  { bi: 2, bj: 4, side: 'S' }, { bi: 7, bj: 2, side: 'W' }, { bi: 5, bj: 8, side: 'E' }, { bi: 8, bj: 5, side: 'N' },
];
export const DC_DEFS = [{ bi: 0, bj: 2 }, { bi: 9, bj: 6 }, { bi: 6, bj: 9 }];
export const PLAZAS = [{ bi: 5, bj: 4 }, { bi: 1, bj: 7 }, { bi: 7, bj: 4 }];

export const ADS = [
  { t: 'METASHIFT', s: 'Your income stream.', bg: '#0b1d3a', fg: '#5ff2ff' },
  { t: 'VIRTUAL WORK.', s: 'Real income.', bg: '#1b0f33', fg: '#ff7ad9' },
  { t: 'TURN PLAYTIME', s: 'into payday.', bg: '#062d26', fg: '#6dffb6' },
  { t: 'YOUR NEXT OPPORTUNITY', s: 'is one login away.', bg: '#2d1405', fg: '#ffb347' },
  { t: 'WHY JUST PLAY', s: 'when you can earn?', bg: '#08243d', fg: '#ffe066' },
  { t: 'ANOTHER DAY.', s: 'Another opportunity.', bg: '#26093a', fg: '#c7a6ff' },
  { t: 'SKYLINE LOFTS', s: 'Virtual penthouses from 89,000 CR', bg: '#f2efe9', fg: '#1d2a44' },
  { t: 'NOW HIRING', s: 'Drivers · Cashiers · Greeters', bg: '#ffd23f', fg: '#1a1a1a' },
  { t: 'OWN YOUR DREAM HOME', s: 'Lakeside plots — limited release', bg: '#e7f6ff', fg: '#0d4a7a' },
  { t: 'SHIFT SCORE 98%?', s: 'Unlock Priority Routes', bg: '#101010', fg: '#5ff2ff' },
  { t: 'LOG IN. CLOCK IN.', s: 'MetaShift Workforce', bg: '#0b1d3a', fg: '#ffffff' },
  { t: 'NEW: HEADSET X', s: 'Play games inside your game', bg: '#151515', fg: '#ff4f6d' },
];

export interface Car { x: number; z: number; h: number; hw: number; hl: number; hit: number }

export class City {
  solids: Rect[] = [];
  solidGrid: number[][] = [];
  poles: { x: number; z: number }[] = [];
  poleGrid: number[][] = [];
  lots: Lot[] = [];
  stores: Record<string, Lot> = {};
  fuel: Lot[] = [];
  dcStarts: { x: number; z: number; h: number }[] = [];
  adj: number[][] = [];
  blocked = new Set<string>();
  group = new THREE.Group();
  nightU = { value: 0 };
  lampMesh!: THREE.InstancedMesh;
  lampInfo: { node: number; axis: 0 | 1; color: 0 | 1 | 2 }[] = [];
  lastLampKey = '';
  hasLight = new Set<string>();
  walkPaths: Rect[] = [];
  plazaCenters: { x: number; z: number }[] = [];
  buildingTops: { x: number; z: number; h: number }[] = [];

  constructor() {
    for (let k = 0; k < 13 * 13; k++) { this.solidGrid.push([]); this.poleGrid.push([]); }
    for (let id = 0; id < NN * NN; id++) {
      const i = id % NN, j = Math.floor(id / NN), a: number[] = [];
      if (i > 0) a.push(nodeId(i - 1, j)); if (i < NB) a.push(nodeId(i + 1, j));
      if (j > 0) a.push(nodeId(i, j - 1)); if (j < NB) a.push(nodeId(i, j + 1));
      this.adj.push(a);
    }
    this.makeLots();
    this.build();
  }

  cell(x: number, z: number) {
    const cx = Math.max(0, Math.min(12, Math.floor((x + P) / P)));
    const cz = Math.max(0, Math.min(12, Math.floor((z + P) / P)));
    return cx + cz * 13;
  }
  addSolid(r: Rect) {
    const idx = this.solids.length; this.solids.push(r);
    const c0x = Math.max(0, Math.floor((r.x0 + P) / P)), c1x = Math.min(12, Math.floor((r.x1 + P) / P));
    const c0z = Math.max(0, Math.floor((r.z0 + P) / P)), c1z = Math.min(12, Math.floor((r.z1 + P) / P));
    for (let cx = c0x; cx <= c1x; cx++) for (let cz = c0z; cz <= c1z; cz++) this.solidGrid[cx + cz * 13].push(idx);
    return idx;
  }
  removeSolids(from: number) {
    this.solids.length = from;
    for (const g of this.solidGrid) { for (let k = g.length - 1; k >= 0; k--) if (g[k] >= from) g.splice(k, 1); }
  }

  private lotFor(bi: number, bj: number, side: Side, kind: LotKind): Omit<Lot, 'id' | 'name' | 'color'> {
    const b = blockRect(bi, bj);
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const long = kind === 'curb' || kind === 'fuel' ? 30 : 32;
    const depth = kind === 'curb' ? 7 : kind === 'fuel' ? 9 : 0;
    const width = kind === 'alley' ? 9 : kind === 'dock' ? 13 : 0;
    let rect: Rect, inward: { x: number; z: number }, along: { x: number; z: number }, entry: { x: number; z: number }, edge: [number, number];
    const parallel = kind === 'curb' || kind === 'fuel';
    if (side === 'S' || side === 'N') {
      const zc = side === 'S' ? b.z0 : b.z1; const s = side === 'S' ? 1 : -1;
      inward = { x: 0, z: s };
      if (parallel) { rect = { x0: cx - long / 2, x1: cx + long / 2, z0: Math.min(zc, zc + s * depth), z1: Math.max(zc, zc + s * depth) }; along = { x: 1, z: 0 }; }
      else { rect = { x0: cx - width / 2, x1: cx + width / 2, z0: Math.min(zc, zc + s * long), z1: Math.max(zc, zc + s * long) }; along = { x: 0, z: 1 }; }
      entry = { x: cx, z: zc };
      const j = side === 'S' ? bj : bj + 1; edge = [nodeId(bi, j), nodeId(bi + 1, j)];
    } else {
      const xc = side === 'W' ? b.x0 : b.x1; const s = side === 'W' ? 1 : -1;
      inward = { x: s, z: 0 };
      if (parallel) { rect = { z0: cz - long / 2, z1: cz + long / 2, x0: Math.min(xc, xc + s * depth), x1: Math.max(xc, xc + s * depth) }; along = { x: 0, z: 1 }; }
      else { rect = { z0: cz - width / 2, z1: cz + width / 2, x0: Math.min(xc, xc + s * long), x1: Math.max(xc, xc + s * long) }; along = { x: 1, z: 0 }; }
      entry = { x: xc, z: cz };
      const i = side === 'W' ? bi : bi + 1; edge = [nodeId(i, bj), nodeId(i, bj + 1)];
    }
    return { kind, bi, bj, side, rect, inward, along, entry, edge };
  }

  private makeLots() {
    for (const s of STORE_DEFS) {
      const l: Lot = { id: s.id, name: s.name, color: s.color, ...this.lotFor(s.bi, s.bj, s.side, s.kind) };
      this.lots.push(l); this.stores[s.id] = l;
    }
    FUEL_DEFS.forEach((f, k) => {
      const l: Lot = { id: 'fuel' + k, name: 'GRIDFUEL', color: '#ffcc00', ...this.lotFor(f.bi, f.bj, f.side, 'fuel') };
      this.lots.push(l); this.fuel.push(l);
    });
    for (const d of DC_DEFS) this.dcStarts.push({ x: (d.bi + 1) * P - LANE, z: d.bj * P + 32, h: Math.PI / 2 });
  }

  lightState(node: number, axis: 0 | 1, t: number): 0 | 1 | 2 { // 0 green 1 yellow 2 red
    const i = node % NN, j = Math.floor(node / NN);
    const ph = (t + (i * 5 + j * 3) % 22) % 22;
    if (axis === 0) return ph < 9 ? 0 : ph < 11 ? 1 : 2;
    return ph < 11 ? 2 : ph < 20 ? 0 : 1;
  }

  // ---------------------------------------------------------------- geometry
  private build() {
    const R = rng(7);
    const g = this.group;
    const plazaSet = new Set(PLAZAS.map(p => p.bi + ',' + p.bj));
    const dcSet = new Set(DC_DEFS.map(p => p.bi + ',' + p.bj));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshLambertMaterial({ color: 0x3c4a3f }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(400, -0.05, 400); g.add(ground);
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(NB * P + 2 * HALF_ROAD + 8, NB * P + 2 * HALF_ROAD + 8), new THREE.MeshLambertMaterial({ color: 0x2b2e34 }));
    asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(NB * P / 2, 0, NB * P / 2); g.add(asphalt);

    // sidewalks
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const sw = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0x8d9097 }), NB * NB);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const v = new THREE.Vector3(); const sc = new THREE.Vector3();
    let k = 0;
    for (let bi = 0; bi < NB; bi++) for (let bj = 0; bj < NB; bj++) {
      const b = blockRect(bi, bj);
      m.compose(v.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2), q.identity(), sc.set(b.x1 - b.x0, 0.15, b.z1 - b.z0));
      sw.setMatrixAt(k++, m);
      this.walkPaths.push({ x0: b.x0 + 1.8, z0: b.z0 + 1.8, x1: b.x1 - 1.8, z1: b.z1 - 1.8 });
    }
    g.add(sw);

    // buildings
    const bmat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const nightU = this.nightU;
    bmat.onBeforeCompile = (sh) => {
      sh.uniforms.uNight = nightU;
      sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp4 = modelMatrix * instanceMatrix * vec4(transformed,1.0); vWP = wp4.xyz;
        vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);`);
      sh.fragmentShader = 'varying vec3 vWP; varying vec3 vWN; uniform float uNight;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wall = 1.0 - step(0.9, abs(vWN.y));
          vec2 gg = vec2((abs(vWN.x) > 0.5 ? vWP.z : vWP.x) / 3.2, vWP.y / 3.6);
          vec2 ff = fract(gg);
          float win = wall * step(0.2, ff.x) * step(ff.x, 0.8) * step(0.28, ff.y) * step(ff.y, 0.82) * step(3.6, vWP.y);
          float rnd = fract(sin(dot(floor(gg), vec2(12.9898,78.233))) * 43758.5453);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20,0.27,0.36) + 0.08*rnd, win*0.9);
          diffuseColor.rgb *= mix(1.0, 0.55, step(0.9, vWN.y));`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += win * step(0.5, rnd) * uNight * vec3(1.0,0.82,0.5) * 0.85;`);
    };
    const bList: { r: Rect; h: number; c: THREE.Color }[] = [];
    const palette = [0x7d8794, 0x9aa3ad, 0x6f7a8a, 0xb3a58f, 0x8b7f73, 0x5f6b7a, 0xa5b3c2, 0x8f9fae, 0xc2b8a3];
    const lotsByBlock = new Map<string, Lot[]>();
    for (const l of this.lots) { const key = l.bi + ',' + l.bj; if (!lotsByBlock.has(key)) lotsByBlock.set(key, []); lotsByBlock.get(key)!.push(l); }
    for (let bi = 0; bi < NB; bi++) for (let bj = 0; bj < NB; bj++) {
      const key = bi + ',' + bj;
      const b = blockRect(bi, bj);
      const foot: Rect = { x0: b.x0 + INSET, z0: b.z0 + INSET, x1: b.x1 - INSET, z1: b.z1 - INSET };
      if (plazaSet.has(key)) { this.plazaCenters.push({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 }); continue; }
      const centre = 1 - Math.hypot(bi - 4.5, bj - 4.5) / 7;
      if (dcSet.has(key)) {
        bList.push({ r: { x0: foot.x0 + 4, z0: foot.z0, x1: foot.x1, z1: foot.z1 }, h: 11, c: new THREE.Color(0xd8dde3) });
        continue;
      }
      let pieces: Rect[] = [foot];
      const lots = lotsByBlock.get(key) || [];
      for (const l of lots) {
        const hole = { x0: l.rect.x0 - 1, z0: l.rect.z0 - 1, x1: l.rect.x1 + 1, z1: l.rect.z1 + 1 };
        pieces = pieces.flatMap(p => subtract(p, hole));
      }
      // split large pieces
      const out: Rect[] = [];
      const split = (r: Rect, depth: number) => {
        const w = r.x1 - r.x0, d = r.z1 - r.z0;
        if (depth > 0 && Math.max(w, d) > 26 && R() < 0.85) {
          const t = 0.35 + R() * 0.3;
          if (w > d) { const xm = r.x0 + w * t; split({ ...r, x1: xm - 0.5 }, depth - 1); split({ ...r, x0: xm + 0.5 }, depth - 1); }
          else { const zm = r.z0 + d * t; split({ ...r, z1: zm - 0.5 }, depth - 1); split({ ...r, z0: zm + 0.5 }, depth - 1); }
        } else out.push(r);
      };
      pieces.filter(p => p.x1 - p.x0 > 2 && p.z1 - p.z0 > 2).forEach(p => split(p, lots.length ? 1 : 2));
      for (const r of out) {
        const h = lots.length ? 9 + R() * 8 : 10 + R() * (18 + 55 * Math.max(0, centre)) ;
        bList.push({ r, h, c: new THREE.Color(palette[Math.floor(R() * palette.length)]) });
      }
    }
    const bm = new THREE.InstancedMesh(box, bmat, bList.length);
    bList.forEach((b, i) => {
      m.compose(v.set((b.r.x0 + b.r.x1) / 2, 0, (b.r.z0 + b.r.z1) / 2), q.identity(), sc.set(b.r.x1 - b.r.x0, b.h, b.r.z1 - b.r.z0));
      bm.setMatrixAt(i, m); bm.setColorAt(i, b.c); this.addSolid(b.r);
      this.buildingTops.push({ x: (b.r.x0 + b.r.x1) / 2, z: (b.r.z0 + b.r.z1) / 2, h: b.h });
    });
    g.add(bm);

    // distant skyline (decor only)
    const sky = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0x6b7686 }), 90);
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2, rr = 820 + R() * 200;
      m.compose(v.set(400 + Math.cos(a) * rr, 0, 400 + Math.sin(a) * rr), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), sc.set(40 + R() * 40, 30 + R() * 120, 40 + R() * 40));
      sky.setMatrixAt(i, m);
    }
    g.add(sky);

    // boundary walls (virtual zone edge)
    const lim = NB * P;
    this.addSolid({ x0: -60, z0: -60, x1: lim + 60, z1: -HALF_ROAD - 2 });
    this.addSolid({ x0: -60, z0: lim + HALF_ROAD + 2, x1: lim + 60, z1: lim + 60 });
    this.addSolid({ x0: -60, z0: -60, x1: -HALF_ROAD - 2, z1: lim + 60 });
    this.addSolid({ x0: lim + HALF_ROAD + 2, z0: -60, x1: lim + 60, z1: lim + 60 });
    const gridTex = makeGridTexture();
    const wallMat = new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: true });
    const L = lim + 2 * HALF_ROAD + 4;
    for (let s = 0; s < 4; s++) {
      const pg = new THREE.PlaneGeometry(L, 8); const mesh = new THREE.Mesh(pg, wallMat);
      gridTex.repeat.set(L / 8, 1);
      const o = -HALF_ROAD - 2, e = lim + HALF_ROAD + 2;
      if (s === 0) mesh.position.set(lim / 2, 4, o);
      if (s === 1) mesh.position.set(lim / 2, 4, e);
      if (s === 2) { mesh.position.set(o, 4, lim / 2); mesh.rotation.y = Math.PI / 2; }
      if (s === 3) { mesh.position.set(e, 4, lim / 2); mesh.rotation.y = Math.PI / 2; }
      g.add(mesh);
    }

    // road markings
    const quads: number[] = [];
    const quad = (x0: number, z0: number, x1: number, z1: number) => quads.push(x0, z0, x1, z1);
    const white: number[] = [];
    for (let i = 0; i < NN; i++) for (let j = 0; j < NN; j++) {
      const a = nodePos(nodeId(i, j));
      if (i < NB) for (let d = HALF_ROAD + 4; d < P - HALF_ROAD - 4; d += 6) quad(a.x + d, a.z - 0.12, a.x + d + 3, a.z + 0.12);
      if (j < NB) for (let d = HALF_ROAD + 4; d < P - HALF_ROAD - 4; d += 6) quad(a.x - 0.12, a.z + d, a.x + 0.12, a.z + d + 3);
      // stop lines (on the right half for each approach)
      const sl = HALF_ROAD + 1.5;
      if (i > 0) white.push(a.x - sl - 0.4, a.z + 0.3, a.x - sl, a.z + HALF_ROAD);
      if (i < NB) white.push(a.x + sl, a.z - HALF_ROAD, a.x + sl + 0.4, a.z - 0.3);
      if (j > 0) white.push(a.x - HALF_ROAD, a.z - sl - 0.4, a.x - 0.3, a.z - sl);
      if (j < NB) white.push(a.x + 0.3, a.z + sl, a.x + HALF_ROAD, a.z + sl + 0.4);
    }
    g.add(quadMesh(quads, 0.02, 0xe8c547));
    g.add(quadMesh(white, 0.02, 0xe8e8e8));

    // traffic lights: pole at near-right corner of each approach, mast arm over the lane
    const poleG = new THREE.CylinderGeometry(0.18, 0.22, 6.4, 6); poleG.translate(0, 3.2, 0);
    const armG = new THREE.BoxGeometry(0.16, 0.16, 1); armG.translate(0, 0, 0.5);
    const headG = new THREE.BoxGeometry(0.5, 1.5, 0.45);
    const lampG = new THREE.SphereGeometry(0.17, 8, 6);
    const appro: { node: number; axis: 0 | 1; cx: number; cz: number; dx: number; dz: number }[] = [];
    for (let i = 0; i < NN; i++) for (let j = 0; j < NN; j++) {
      const id = nodeId(i, j); const a = nodePos(id); const c = HALF_ROAD + 1.4;
      // lights hang on the FAR side of the junction (so they stay in view from the stop line):
      // heading +x: far-right corner (+c,+c), arm back over the lane toward -z; the others mirror that
      if (i > 0 && j < NB) appro.push({ node: id, axis: 0, cx: a.x + c, cz: a.z + c, dx: 1, dz: 0 });
      if (i < NB && j > 0) appro.push({ node: id, axis: 0, cx: a.x - c, cz: a.z - c, dx: -1, dz: 0 });
      if (j > 0 && i > 0) appro.push({ node: id, axis: 1, cx: a.x - c, cz: a.z + c, dx: 0, dz: 1 });
      if (j < NB && i < NB) appro.push({ node: id, axis: 1, cx: a.x + c, cz: a.z - c, dx: 0, dz: -1 });
    }
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2a2d31 });
    const poles = new THREE.InstancedMesh(poleG, darkMat, appro.length);
    const arms = new THREE.InstancedMesh(armG, darkMat, appro.length);
    const heads = new THREE.InstancedMesh(headG, new THREE.MeshLambertMaterial({ color: 0x1b1d20 }), appro.length);
    this.lampMesh = new THREE.InstancedMesh(lampG, new THREE.MeshBasicMaterial({ color: 0xffffff }), appro.length * 3);
    const Y = new THREE.Vector3(0, 1, 0);
    appro.forEach((p, n) => {
      m.compose(v.set(p.cx, 0, p.cz), q.identity(), sc.set(1, 1, 1)); poles.setMatrixAt(n, m);
      this.hasLight.add(p.node + ',' + p.dx + ',' + p.dz);
      this.poles.push({ x: p.cx, z: p.cz });
      // arm points toward road centre perpendicular to traffic direction (traffic dir dx,dz ; arm = left of traffic = (dz,-dx))
      const ax = p.dz, az = -p.dx; const len = HALF_ROAD + 1.4 - LANE + 0.6;
      const yaw = Math.atan2(ax, az);
      m.compose(v.set(p.cx, 6.2, p.cz), q.setFromAxisAngle(Y, yaw), sc.set(1, 1, len)); arms.setMatrixAt(n, m);
      const hx = p.cx + ax * len, hz = p.cz + az * len;
      const faceYaw = Math.atan2(-p.dx, -p.dz);
      m.compose(v.set(hx, 5.3, hz), q.setFromAxisAngle(Y, faceYaw), sc.set(1, 1, 1)); heads.setMatrixAt(n, m);
      for (let c = 0; c < 3; c++) {
        m.compose(v.set(hx - p.dx * 0.25, 5.8 - c * 0.48, hz - p.dz * 0.25), q.identity(), sc.set(1, 1, 1));
        this.lampMesh.setMatrixAt(n * 3 + c, m);
        this.lampInfo.push({ node: p.node, axis: p.axis, color: c as 0 | 1 | 2 });
      }
    });
    for (let n = 0; n < this.poles.length; n++) { const p = this.poles[n]; this.poleGrid[this.cell(p.x, p.z)].push(n); }
    g.add(poles, arms, heads, this.lampMesh);
    this.updateLights(0);

    // trees around plazas & a few streets
    const trunkG = new THREE.CylinderGeometry(0.2, 0.3, 3, 5); trunkG.translate(0, 1.5, 0);
    const crownG = new THREE.IcosahedronGeometry(2.2, 0); crownG.translate(0, 4.4, 0);
    const treePos: { x: number; z: number }[] = [];
    for (const pc of PLAZAS) {
      const b = blockRect(pc.bi, pc.bj);
      for (let t = 0; t < 14; t++) treePos.push({ x: b.x0 + 4 + R() * (b.x1 - b.x0 - 8), z: b.z0 + 4 + R() * (b.z1 - b.z0 - 8) });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(b.x1 - b.x0 - 4, b.z1 - b.z0 - 4), new THREE.MeshLambertMaterial({ color: 0x4f8f4a }));
      pl.rotation.x = -Math.PI / 2; pl.position.set((b.x0 + b.x1) / 2, 0.17, (b.z0 + b.z1) / 2); g.add(pl);
      const stage = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.5, 20), new THREE.MeshLambertMaterial({ color: 0x8a5cff, emissive: 0x2a1060 }));
      stage.position.set((b.x0 + b.x1) / 2, 0.3, (b.z0 + b.z1) / 2); g.add(stage);
    }
    const trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshLambertMaterial({ color: 0x5a4030 }), treePos.length);
    const crowns = new THREE.InstancedMesh(crownG, new THREE.MeshLambertMaterial({ color: 0x3f8f4f }), treePos.length);
    treePos.forEach((t, i) => {
      m.compose(v.set(t.x, 0.15, t.z), q.identity(), sc.setScalar(0.8 + R() * 0.5)); trunks.setMatrixAt(i, m); crowns.setMatrixAt(i, m);
      crowns.setColorAt(i, new THREE.Color().setHSL(0.28 + R() * 0.12, 0.5, 0.35 + R() * 0.1));
    });
    g.add(trunks, crowns);

    // lots + signs
    this.buildLots(R);
    this.buildBillboards(R);
  }

  private buildLots(R: () => number) {
    const g = this.group;
    const signCanvas = document.createElement('canvas'); signCanvas.width = 1024; signCanvas.height = 1024;
    const sc = signCanvas.getContext('2d')!;
    const cells: { tex: number }[] = [];
    const signGeos: THREE.BufferGeometry[] = [];
    const drawSign = (cell: number, text: string, color: string, sub: string) => {
      const cx = (cell % 2) * 512, cy = Math.floor(cell / 2) * 128;
      sc.fillStyle = '#14161c'; sc.fillRect(cx, cy, 512, 128);
      sc.fillStyle = color; sc.fillRect(cx, cy + 112, 512, 16);
      sc.fillStyle = color; sc.font = 'bold 44px Arial'; sc.textAlign = 'center'; sc.textBaseline = 'middle';
      let fs = 44; while (sc.measureText(text).width > 480 && fs > 18) { fs -= 2; sc.font = `bold ${fs}px Arial`; }
      sc.fillText(text, cx + 256, cy + 48);
      sc.fillStyle = '#cfd6e0'; sc.font = '22px Arial'; sc.fillText(sub, cx + 256, cy + 92);
      cells.push({ tex: cell });
    };
    const addSign = (cell: number, x: number, z: number, y: number, yaw: number, w: number) => {
      const pg = new THREE.PlaneGeometry(w, w / 4);
      const uv = pg.attributes.uv as THREE.BufferAttribute;
      const u0 = (cell % 2) * 0.5, v0 = 1 - (Math.floor(cell / 2) + 1) / 8;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * 0.5, v0 + uv.getY(i) / 8);
      pg.rotateY(yaw); pg.translate(x, y, z); signGeos.push(pg);
    };
    let cell = 0;
    const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x34373d });
    for (const l of this.lots) {
      const r = l.rect;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), asphaltMat);
      pl.rotation.x = -Math.PI / 2; pl.position.set((r.x0 + r.x1) / 2, 0.17, (r.z0 + r.z1) / 2); g.add(pl);
      // sign on the building face behind the lot
      const isFuel = l.kind === 'fuel';
      const deep = l.kind === 'curb' || isFuel ? (isFuel ? 9 : 7) + 1.05 : 33.05;
      const facing = Math.atan2(-l.inward.x, -l.inward.z);
      const sx = l.entry.x + l.inward.x * deep, sz = l.entry.z + l.inward.z * deep;
      drawSign(cell, l.name, l.color, isFuel ? 'FUEL · 24H · CR ACCEPTED' : l.kind === 'dock' ? 'RECEIVING DOCK — BACK IN' : 'DELIVERIES · RECEIVING');
      addSign(cell, sx, sz, isFuel ? 4.5 : 6.5, facing, 12);
      cell++;
      if (isFuel) {
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0 + 2, 0.6, r.z1 - r.z0 + 2), new THREE.MeshLambertMaterial({ color: 0xf1f1f1, emissive: 0x222222 }));
        canopy.position.set((r.x0 + r.x1) / 2, 6.6, (r.z0 + r.z1) / 2); g.add(canopy);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0 + 2.1, 0.25, r.z1 - r.z0 + 2.1), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        stripe.position.copy(canopy.position); g.add(stripe);
        for (let p = -1; p <= 1; p += 2) {
          const pump = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.7), new THREE.MeshLambertMaterial({ color: 0xd23a3a }));
          const ax = l.along.x * p * 8, az = l.along.z * p * 8;
          pump.position.set(l.entry.x + l.inward.x * 8.2 + ax, 0.9, l.entry.z + l.inward.z * 8.2 + az); g.add(pump);
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.4, 0.3), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
          post.position.set(l.entry.x + l.inward.x * 8.6 + ax, 3.3, l.entry.z + l.inward.z * 8.6 + az); g.add(post);
        }
      }
    }
    // DC signs
    for (const d of DC_DEFS) {
      const b = blockRect(d.bi, d.bj);
      drawSign(cell, 'METASHIFT DISTRIBUTION', '#5ff2ff', 'DC-' + (d.bi + 1) + (d.bj + 1) + ' · OUTBOUND FREIGHT');
      addSign(cell, b.x1 - INSET + 0.06, (b.z0 + b.z1) / 2, 8, Math.PI / 2, 16);
      cell++;
    }
    const tex = new THREE.CanvasTexture(signCanvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const signMesh = new THREE.Mesh(mergeGeometries(signGeos), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    g.add(signMesh);
  }

  private buildBillboards(R: () => number) {
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
    const c = cv.getContext('2d')!;
    ADS.forEach((ad, i) => {
      const x = (i % 4) * 512, y = Math.floor(i / 4) * 256;
      const grd = c.createLinearGradient(x, y, x + 512, y + 256); grd.addColorStop(0, ad.bg); grd.addColorStop(1, shade(ad.bg));
      c.fillStyle = grd; c.fillRect(x, y, 512, 256);
      c.strokeStyle = ad.fg; c.lineWidth = 6; c.strokeRect(x + 10, y + 10, 492, 236);
      c.fillStyle = ad.fg; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 56; c.font = `900 ${fs}px Arial`; while (c.measureText(ad.t).width > 460) { fs -= 2; c.font = `900 ${fs}px Arial`; }
      c.fillText(ad.t, x + 256, y + 100);
      c.font = '30px Arial'; let f2 = 30; while (c.measureText(ad.s).width > 460) { f2 -= 2; c.font = `${f2}px Arial`; }
      c.fillText(ad.s, x + 256, y + 165);
      c.font = 'bold 16px Arial'; c.globalAlpha = 0.7; c.fillText('◆ METASHIFT', x + 256, y + 222); c.globalAlpha = 1;
    });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const geos: THREE.BufferGeometry[] = [];
    const backs: THREE.BufferGeometry[] = [];
    const tops = this.buildingTops.filter(t => t.h > 14);
    const n = Math.min(46, tops.length);
    for (let i = 0; i < n; i++) {
      const t = tops[Math.floor(R() * tops.length)];
      // face the nearest road axis
      const fx = t.x / P - Math.floor(t.x / P), fz = t.z / P - Math.floor(t.z / P);
      const dx = fx < 0.5 ? -1 : 1, dz = fz < 0.5 ? -1 : 1;
      const useX = Math.abs(fx - 0.5) > Math.abs(fz - 0.5);
      const yaw = useX ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI);
      const ad = Math.floor(R() * ADS.length);
      const w = 14 + R() * 6;
      const pg = new THREE.PlaneGeometry(w, w / 2);
      const uv = pg.attributes.uv as THREE.BufferAttribute;
      const u0 = (ad % 4) / 4, v0 = 1 - (Math.floor(ad / 4) + 1) / 4;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / 4, v0 + uv.getY(k) / 4);
      pg.rotateY(yaw); pg.translate(t.x + (useX ? dx : 0) * 2, t.h + w / 4 + 1.5, t.z + (useX ? 0 : dz) * 2);
      geos.push(pg);
      const bg = new THREE.BoxGeometry(w + 0.6, w / 2 + 0.6, 0.4); bg.translate(0, 0, -0.25); bg.rotateY(yaw);
      bg.translate(t.x + (useX ? dx : 0) * 2, t.h + w / 4 + 1.5, t.z + (useX ? 0 : dz) * 2); backs.push(bg);
    }
    // street-level ad screens at plazas
    for (const pc of this.plazaCenters) {
      for (let s = 0; s < 4; s++) {
        const ad = (s * 3 + Math.floor(pc.x)) % ADS.length; const w = 9;
        const pg = new THREE.PlaneGeometry(w, w / 2);
        const uv = pg.attributes.uv as THREE.BufferAttribute;
        const u0 = (ad % 4) / 4, v0 = 1 - (Math.floor(ad / 4) + 1) / 4;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / 4, v0 + uv.getY(k) / 4);
        const yaw = s * Math.PI / 2;
        pg.translate(0, 0, 0.26); pg.rotateY(yaw); pg.translate(pc.x + Math.sin(yaw) * 24, 5.5, pc.z + Math.cos(yaw) * 24); geos.push(pg);
        const bg = new THREE.BoxGeometry(w + 0.5, w / 2 + 0.5, 0.4); bg.rotateY(yaw); bg.translate(pc.x + Math.sin(yaw) * 24, 5.5, pc.z + Math.cos(yaw) * 24); backs.push(bg);
        const post = new THREE.BoxGeometry(0.4, 3.4, 0.4); post.translate(pc.x + Math.sin(yaw) * 24, 1.7, pc.z + Math.cos(yaw) * 24); backs.push(post);
      }
    }
    this.group.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ map: tex })));
    this.group.add(new THREE.Mesh(mergeGeometries(backs), new THREE.MeshLambertMaterial({ color: 0x23262c })));
  }

  updateLights(t: number) {
    const key = '' + Math.floor(t);
    if (key === this.lastLampKey) return; this.lastLampKey = key;
    const on = [new THREE.Color(0x30ff6a), new THREE.Color(0xffc21a), new THREE.Color(0xff2a2a)];
    const off = new THREE.Color(0x202020);
    // order of lamp spheres top->bottom: red, yellow, green
    const map = [2, 1, 0];
    for (let n = 0; n < this.lampInfo.length; n++) {
      const li = this.lampInfo[n];
      const st = this.lightState(li.node, li.axis, t);
      this.lampMesh.setColorAt(n, map[li.color] === st ? on[st] : off);
    }
    if (this.lampMesh.instanceColor) this.lampMesh.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- routing
  shortest(startCosts: Map<number, number>, avoid: Set<string>): { dist: Float64Array; prev: Int32Array } {
    const n = NN * NN; const dist = new Float64Array(n).fill(Infinity); const prev = new Int32Array(n).fill(-1);
    const done = new Uint8Array(n);
    for (const [k, c] of startCosts) dist[k] = c;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0) break; done[u] = 1;
      for (const w of this.adj[u]) {
        if (avoid.has(edgeKey(u, w))) continue;
        const nd = dist[u] + P;
        if (nd < dist[w]) { dist[w] = nd; prev[w] = u; }
      }
    }
    return { dist, prev };
  }

  /** direction-aware search: state = node*4+arrivalDir; no U-turns at junctions, small penalty per turn */
  routeStates(starts: { node: number; dir: number; cost: number }[], avoid: Set<string>) {
    const n = NN * NN * 4; const dist = new Float64Array(n).fill(Infinity); const prev = new Int32Array(n).fill(-1); const done = new Uint8Array(n);
    for (const st of starts) { const k = st.node * 4 + st.dir; if (st.cost < dist[k]) dist[k] = st.cost; }
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0) break; done[u] = 1;
      const node = u >> 2, din = u & 3;
      for (const w of this.adj[node]) {
        if (avoid.has(edgeKey(node, w))) continue;
        const dout = dirOf(node, w);
        if ((dout ^ 1) === din) continue;
        const k = w * 4 + dout; const nd = dist[u] + P + (dout !== din ? 14 : 0);
        if (nd < dist[k]) { dist[k] = nd; prev[k] = u; }
      }
    }
    return { dist, prev };
  }

  nearestEdge(x: number, z: number): [number, number, number] { // a, b, t along
    const i = Math.round(x / P), j = Math.round(z / P);
    const dxr = Math.abs(x - i * P), dzr = Math.abs(z - j * P);
    if (dzr <= dxr) { // on horizontal road z=j*P
      const jj = Math.max(0, Math.min(NB, j)); const ii = Math.max(0, Math.min(NB - 1, Math.floor(x / P)));
      return [nodeId(ii, jj), nodeId(ii + 1, jj), (x - ii * P) / P];
    } else {
      const ii = Math.max(0, Math.min(NB, i)); const jj = Math.max(0, Math.min(NB - 1, Math.floor(z / P)));
      return [nodeId(ii, jj), nodeId(ii, jj + 1), (z - jj * P) / P];
    }
  }
}

export function dirOf(a: number, b: number) { // 0:+x 1:-x 2:+z 3:-z
  const d = b - a; return d === 1 ? 0 : d === -1 ? 1 : d > 0 ? 2 : 3;
}

function subtract(r: Rect, h: Rect): Rect[] {
  if (h.x1 <= r.x0 || h.x0 >= r.x1 || h.z1 <= r.z0 || h.z0 >= r.z1) return [r];
  const out: Rect[] = [];
  if (h.z0 > r.z0) out.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: h.z0 });
  if (h.z1 < r.z1) out.push({ x0: r.x0, x1: r.x1, z0: h.z1, z1: r.z1 });
  const z0 = Math.max(r.z0, h.z0), z1 = Math.min(r.z1, h.z1);
  if (h.x0 > r.x0) out.push({ x0: r.x0, x1: h.x0, z0, z1 });
  if (h.x1 < r.x1) out.push({ x0: h.x1, x1: r.x1, z0, z1 });
  return out;
}

function quadMesh(q: number[], y: number, color: number) {
  const pos: number[] = []; const idx: number[] = [];
  for (let i = 0; i < q.length; i += 4) {
    const [x0, z0, x1, z1] = [q[i], q[i + 1], q[i + 2], q[i + 3]]; const b = pos.length / 3;
    pos.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1); idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color }));
}

function shade(hex: string) {
  const c = new THREE.Color(hex); c.multiplyScalar(0.55); return '#' + c.getHexString();
}

function makeGridTexture() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d')!;
  c.fillStyle = 'rgba(60,220,255,0.10)'; c.fillRect(0, 0, 64, 64);
  c.strokeStyle = 'rgba(95,242,255,0.9)'; c.lineWidth = 2; c.strokeRect(1, 1, 62, 62);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---- generic rectangle SAT test (oriented boxes) ----
export interface OBB { x: number; z: number; hx: number; hz: number; c: number; s: number } // axes: u=(c,s) half hx ; v=(-s,c) half hz
export function obbOverlap(a: OBB, b: OBB): boolean {
  const axes = [[a.c, a.s], [-a.s, a.c], [b.c, b.s], [-b.s, b.c]];
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const [ax, az] of axes) {
    const ra = a.hx * Math.abs(a.c * ax + a.s * az) + a.hz * Math.abs(-a.s * ax + a.c * az);
    const rb = b.hx * Math.abs(b.c * ax + b.s * az) + b.hz * Math.abs(-b.s * ax + b.c * az);
    if (Math.abs(dx * ax + dz * az) > ra + rb) return false;
  }
  return true;
}
export function rectToOBB(r: Rect): OBB { return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, hx: (r.x1 - r.x0) / 2, hz: (r.z1 - r.z0) / 2, c: 1, s: 0 }; }
