import * as THREE from 'three';
import { City, Rect } from './city';

export type Expr = 'neutral' | 'tired' | 'sad' | 'surprised' | 'smile' | 'annoyed' | 'closed';

export interface CharOpts {
  skin: number; shirt: number; pants: number; hair: number; shoes?: number;
  hat?: 'none' | 'cap' | 'ears' | 'halo' | 'crown' | 'visor' | 'antenna' | 'beanie';
  hatColor?: number; glow?: number; jacket?: number; name?: string; nameColor?: string; build?: number; longHair?: boolean;
}

const lam = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });

export class Character {
  root = new THREE.Group(); hips = new THREE.Group(); spine = new THREE.Group(); head = new THREE.Group();
  armL = new THREE.Group(); armR = new THREE.Group(); foreL = new THREE.Group(); foreR = new THREE.Group();
  legL = new THREE.Group(); legR = new THREE.Group(); shinL = new THREE.Group(); shinR = new THREE.Group();
  handR = new THREE.Object3D(); handL = new THREE.Object3D();
  browL!: THREE.Mesh; browR!: THREE.Mesh; mouth!: THREE.Mesh; eyeL!: THREE.Mesh; eyeR!: THREE.Mesh;
  tag?: THREE.Sprite;
  expr: Expr = 'neutral'; talking = false; talkT = 0; blinkT = 2; walkT = 0;

  constructor(o: CharOpts) {
    const r = this.root; r.add(this.hips); this.hips.position.y = 0.95; this.hips.add(this.spine);
    const skin = lam(o.skin), shirt = lam(o.shirt, o.glow ?? 0), pants = lam(o.pants), hair = lam(o.hair), shoes = lam(o.shoes ?? 0x222222);
    const b = o.build ?? 1;
    const box = (w: number, h: number, d: number, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    box(0.36 * b, 0.16, 0.22, pants, this.hips, 0, 0.02, 0);
    box(0.4 * b, 0.52, 0.24 * b, shirt, this.spine, 0, 0.32, 0);
    if (o.jacket !== undefined) { box(0.42 * b, 0.36, 0.26 * b, lam(o.jacket), this.spine, 0, 0.42, 0); }
    // head
    this.head.position.y = 0.66; this.spine.add(this.head);
    box(0.09, 0.08, 0.09, skin, this.head, 0, -0.04, 0);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 10), skin); hm.scale.set(0.95, 1.12, 1); hm.position.y = 0.1; this.head.add(hm);
    const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.133, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hairM.scale.set(0.97, 1.1, 1.05); hairM.position.set(0, 0.11, -0.01); hairM.rotation.x = -0.25; this.head.add(hairM);
    if (o.longHair) { const lh = box(0.24, 0.26, 0.08, hair, this.head, 0, 0.0, -0.1); lh.rotation.x = 0.1; }
    const eyeM = lam(0x111111);
    this.eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeM); this.eyeL.position.set(0.045, 0.12, 0.112); this.head.add(this.eyeL);
    this.eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeM); this.eyeR.position.set(-0.045, 0.12, 0.112); this.head.add(this.eyeR);
    this.browL = box(0.05, 0.011, 0.01, hair, this.head, 0.047, 0.158, 0.118);
    this.browR = box(0.05, 0.011, 0.01, hair, this.head, -0.047, 0.158, 0.118);
    this.mouth = box(0.055, 0.012, 0.01, lam(0x5a2020), this.head, 0, 0.035, 0.118);
    box(0.02, 0.035, 0.02, skin, this.head, 0, 0.085, 0.125); // nose
    // hats / cosmetics
    const hc = lam(o.hatColor ?? 0xff4f6d, o.hatColor ? (o.hatColor & 0x3f3f3f) : 0);
    switch (o.hat) {
      case 'cap': { box(0.27, 0.08, 0.27, hc, this.head, 0, 0.22, 0); box(0.2, 0.02, 0.12, hc, this.head, 0, 0.19, 0.17); break; }
      case 'beanie': { const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hc); s.position.y = 0.15; this.head.add(s); break; }
      case 'ears': { for (const sx of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), hc); c.position.set(sx * 0.08, 0.27, 0); this.head.add(c); } break; }
      case 'halo': { const t = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 20), new THREE.MeshBasicMaterial({ color: o.hatColor ?? 0xffe066 })); t.rotation.x = Math.PI / 2; t.position.y = 0.33; this.head.add(t); break; }
      case 'crown': { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.08, 6, 1, true), lam(0xffcc33, 0x553300)); c.position.y = 0.26; this.head.add(c); break; }
      case 'visor': { box(0.25, 0.05, 0.04, new THREE.MeshBasicMaterial({ color: o.hatColor ?? 0x5ff2ff }), this.head, 0, 0.12, 0.13); break; }
      case 'antenna': { box(0.012, 0.2, 0.012, lam(0xdddddd), this.head, 0, 0.32, 0); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: o.hatColor ?? 0x6dffb6 })); ball.position.y = 0.43; this.head.add(ball); break; }
    }
    // arms
    const arm = (g: THREE.Group, fore: THREE.Group, hand: THREE.Object3D, sx: number) => {
      g.position.set(sx * 0.25 * b, 0.55, 0); this.spine.add(g);
      box(0.1, 0.3, 0.1, shirt, g, 0, -0.14, 0);
      fore.position.y = -0.29; g.add(fore);
      box(0.085, 0.27, 0.085, o.jacket !== undefined ? lam(o.jacket) : skin, fore, 0, -0.13, 0);
      box(0.08, 0.09, 0.08, skin, fore, 0, -0.3, 0);
      hand.position.y = -0.31; fore.add(hand);
    };
    arm(this.armL, this.foreL, this.handL, 1); arm(this.armR, this.foreR, this.handR, -1);
    const leg = (g: THREE.Group, shin: THREE.Group, sx: number) => {
      g.position.set(sx * 0.1, 0, 0); this.hips.add(g);
      box(0.14, 0.46, 0.15, pants, g, 0, -0.23, 0);
      shin.position.y = -0.45; g.add(shin);
      box(0.12, 0.44, 0.13, pants, shin, 0, -0.22, 0);
      box(0.13, 0.08, 0.24, shoes, shin, 0, -0.46, 0.05);
    };
    leg(this.legL, this.shinL, 1); leg(this.legR, this.shinR, -1);
    if (o.name) {
      this.tag = makeTag(o.name, o.nameColor ?? '#5ff2ff');
      this.tag.position.y = 2.1; r.add(this.tag);
    }
  }

  setExpr(e: Expr) { this.expr = e; }

  update(dt: number) {
    // expression
    const e = this.expr;
    let browY = 0.158, browRot = 0, mouthW = 1, mouthY = 0.035, mouthRot = 0, eyeS = 1;
    if (e === 'tired') { eyeS = 0.45; browRot = -0.15; mouthW = 0.8; }
    if (e === 'sad') { browRot = 0.35; mouthW = 0.8; mouthY = 0.03; }
    if (e === 'surprised') { browY = 0.175; eyeS = 1.3; mouthW = 0.6; }
    if (e === 'smile') { mouthW = 1.35; mouthY = 0.04; browY = 0.163; }
    if (e === 'annoyed') { browRot = -0.35; browY = 0.152; mouthW = 0.9; mouthRot = 0.15; }
    if (e === 'closed') { eyeS = 0.08; }
    this.browL.position.y = this.browR.position.y = browY;
    this.browL.rotation.z = browRot; this.browR.rotation.z = -browRot;
    this.blinkT -= dt;
    const blink = this.blinkT < 0.12 && this.blinkT > 0 ? 0.1 : 1;
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 3;
    this.eyeL.scale.y = this.eyeR.scale.y = eyeS * blink;
    this.mouth.position.y = mouthY; this.mouth.rotation.z = mouthRot;
    if (this.talking) { this.talkT += dt * 14; const o = 0.5 + 0.5 * Math.abs(Math.sin(this.talkT) * Math.sin(this.talkT * 0.37 + 1)); this.mouth.scale.set(mouthW * 0.9, 1 + o * 3.2, 1); }
    else this.mouth.scale.set(mouthW, 1, 1);
  }

  resetPose() {
    for (const g of [this.armL, this.armR, this.foreL, this.foreR, this.legL, this.legR, this.shinL, this.shinR, this.spine, this.head, this.hips]) g.rotation.set(0, 0, 0);
    this.hips.position.set(0, 0.95, 0);
    this.armL.rotation.z = 0.08; this.armR.rotation.z = -0.08;
  }
  walk(dt: number, speed: number) {
    this.walkT += dt * speed * 5.5;
    const s = Math.sin(this.walkT);
    this.legL.rotation.x = s * 0.5; this.legR.rotation.x = -s * 0.5;
    this.shinL.rotation.x = Math.max(0, -s) * 0.6; this.shinR.rotation.x = Math.max(0, s) * 0.6;
    this.armL.rotation.x = -s * 0.4; this.armR.rotation.x = s * 0.4;
    this.hips.position.y = 0.95 + Math.abs(Math.cos(this.walkT)) * 0.03;
  }
  idle(t: number) {
    this.spine.rotation.x = Math.sin(t * 1.3) * 0.015;
    this.armL.rotation.z = 0.08 + Math.sin(t * 1.1) * 0.02; this.armR.rotation.z = -0.08 - Math.sin(t * 1.1) * 0.02;
  }
  gesture(t: number) { // talking hand gesture
    this.armR.rotation.x = -0.5 + Math.sin(t * 2.2) * 0.15; this.foreR.rotation.x = -0.6 + Math.sin(t * 3.1) * 0.2;
  }
}

export function makeTag(text: string, color: string) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 40; const c = cv.getContext('2d')!;
  c.font = 'bold 22px Arial'; const w = Math.min(250, c.measureText(text).width + 22);
  c.fillStyle = 'rgba(8,12,20,0.72)'; roundRect(c, 128 - w / 2, 4, w, 32, 10); c.fill();
  c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 128, 21);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sp.scale.set(1.4, 0.22, 1); return sp;
}
function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// ------------------------------------------------------------ crowd
export const PLAYER_NAMES = [
  'xX_NeonKaiju_Xx', 'LunaByte', 'drift_queen', 'PixelPapa', 'ZeroLatency', 'mochi.exe', 'SirLagsAlot', 'StarlitVex', 'Glitchcat', 'bigtipper99',
  'kawaii_tank', 'NightOwl_77', 'VaporRick', 'cloud_nine', 'Captain_AFK', 'jellybeam', 'DJ_Respawn', 'ok_boomerang', 'Fizzwhistle', 'NoobMaster420',
  'velvetvoid', 'Hex_Ana', 'TacoTuesday', 'quietstorm', 'Rainbow_Dash_IRL', 'meta_marco', 'sk8rgrl', 'Lord_Ping', 'bubbletea4ever', 'Orbit',
  'lofi_larry', 'PrincessPayday', 'catgpt', 'TurboTurtle', 'snowcone', 'Mx_Mirage', 'DeltaFox', 'hyperpop_hal', 'Juniper', 'B0ss_Baby',
  'WORKER_2291', 'WORKER_7713', 'Courier_5520', 'Greeter_0148', 'Cashier_3307', 'Janitor_8812', 'Builder_6604', 'Barista_4120',
];

interface Walker { x: number; z: number; h: number; mode: 0 | 1; rect: Rect; p: number; dir: number; px: number; pz: number; scale: number; fade: number; name: number; phase: number; worker: boolean }

export class Crowd {
  walkers: Walker[] = [];
  bodies: THREE.InstancedMesh; heads: THREE.InstancedMesh; hats: THREE.InstancedMesh;
  tagGeo: THREE.InstancedBufferGeometry; tagMesh: THREE.Mesh; tagPos: THREE.InstancedBufferAttribute; tagA: THREE.InstancedBufferAttribute;
  pillars: THREE.InstancedMesh; pillarT: number[] = []; pillarP: THREE.Vector3[] = [];
  events: string[] = [];
  private m = new THREE.Matrix4(); private q = new THREE.Quaternion(); private v = new THREE.Vector3(); private s = new THREE.Vector3(); private Y = new THREE.Vector3(0, 1, 0);
  private evT = 6;
  N = 60;

  constructor(private city: City, scene: THREE.Scene) {
    const bodyG = new THREE.CapsuleGeometry(0.24, 0.9, 3, 8); bodyG.translate(0, 0.75, 0);
    const headG = new THREE.SphereGeometry(0.17, 10, 8); headG.translate(0, 1.52, 0);
    const hatG = new THREE.ConeGeometry(0.16, 0.3, 6); hatG.translate(0, 1.78, 0);
    this.bodies = new THREE.InstancedMesh(bodyG, lam(0xffffff, 0x111111), this.N);
    this.heads = new THREE.InstancedMesh(headG, lam(0xffffff), this.N);
    this.hats = new THREE.InstancedMesh(hatG, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.N);
    const neon = [0xff4f6d, 0x5ff2ff, 0xa77bff, 0xffd23f, 0x6dffb6, 0xff7ad9, 0xffffff, 0xff8a3a];
    const skins = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x9fe2ff, 0xb9ffb0, 0xd7b8ff];
    const R = Math.random;
    for (let i = 0; i < this.N; i++) {
      const worker = i % 5 === 0;
      this.bodies.setColorAt(i, new THREE.Color(worker ? 0x2f3a4a : neon[i % neon.length]).multiplyScalar(worker ? 1 : 0.85));
      this.heads.setColorAt(i, new THREE.Color(skins[Math.floor(R() * skins.length)]));
      this.hats.setColorAt(i, new THREE.Color(neon[(i * 3 + 1) % neon.length]));
      const plaza = i < 30;
      const w: Walker = { x: 0, z: 0, h: 0, mode: plaza ? 1 : 0, rect: city.walkPaths[0], p: 0, dir: 1, px: 0, pz: 0, scale: 1, fade: 0, name: i % PLAYER_NAMES.length, phase: R() * 10, worker };
      if (plaza) { const pc = city.plazaCenters[i % city.plazaCenters.length]; const a = R() * Math.PI * 2, rr = 4 + R() * 14; w.px = pc.x + Math.cos(a) * rr; w.pz = pc.z + Math.sin(a) * rr; w.x = w.px; w.z = w.pz; w.h = R() * 6; }
      this.walkers.push(w);
    }
    for (const im of [this.bodies, this.heads, this.hats]) { im.frustumCulled = false; scene.add(im); }
    // name tags (one draw call, billboarded)
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d')!;
    PLAYER_NAMES.forEach((n, k) => {
      const x = (k % 4) * 256, y = Math.floor(k / 4) * 32;
      const worker = /^(WORKER|Courier|Greeter|Cashier|Janitor|Builder|Barista)/.test(n);
      c.font = 'bold 19px Arial'; const w = Math.min(250, c.measureText(n).width + 18);
      c.fillStyle = 'rgba(8,12,20,0.7)'; roundRect(c, x + 128 - w / 2, y + 3, w, 26, 8); c.fill();
      c.fillStyle = worker ? '#ffd23f' : '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, x + 128, y + 17);
    });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const base = new THREE.PlaneGeometry(1, 1);
    this.tagGeo = new THREE.InstancedBufferGeometry(); this.tagGeo.index = base.index;
    this.tagGeo.setAttribute('position', base.attributes.position); this.tagGeo.setAttribute('uv', base.attributes.uv);
    this.tagPos = new THREE.InstancedBufferAttribute(new Float32Array(this.N * 3), 3);
    this.tagA = new THREE.InstancedBufferAttribute(new Float32Array(this.N), 1);
    const cells = new Float32Array(this.N * 2);
    for (let i = 0; i < this.N; i++) { const k = this.walkers[i].name; cells[i * 2] = k % 4; cells[i * 2 + 1] = Math.floor(k / 4); }
    this.tagGeo.setAttribute('aPos', this.tagPos); this.tagGeo.setAttribute('aA', this.tagA);
    this.tagGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2));
    this.tagGeo.instanceCount = this.N;
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uR: { value: new THREE.Vector3(1, 0, 0) }, uU: { value: new THREE.Vector3(0, 1, 0) } },
      vertexShader: `attribute vec3 aPos; attribute vec2 aCell; attribute float aA; uniform vec3 uR; uniform vec3 uU; varying vec2 vUv; varying float vA;
        void main(){ vec3 wp = aPos + uR*position.x*1.9 + uU*position.y*0.24; float d = distance(aPos, cameraPosition);
          vA = aA * (1.0 - smoothstep(35.0, 55.0, d));
          vUv = vec2((aCell.x + uv.x)/4.0, 1.0 - (aCell.y + 1.0 - uv.y)/32.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(wp,1.0); }`,
      fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vA; void main(){ vec4 c = texture2D(map, vUv); c.a *= vA; if (c.a < 0.02) discard; gl_FragColor = c; }`,
      transparent: true, depthWrite: false,
    });
    this.tagMesh = new THREE.Mesh(this.tagGeo, mat); this.tagMesh.frustumCulled = false;
    this.tagMesh.onBeforeRender = (_r, _s, cam) => {
      const e = cam.matrixWorld.elements;
      mat.uniforms.uR.value.set(e[0], e[1], e[2]).normalize(); mat.uniforms.uU.value.set(e[4], e[5], e[6]).normalize();
    };
    scene.add(this.tagMesh);
    // login / logout light pillars
    const pg = new THREE.CylinderGeometry(0.6, 0.6, 6, 12, 1, true); pg.translate(0, 3, 0);
    this.pillars = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ color: 0x5ff2ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 6);
    this.pillars.frustumCulled = false;
    for (let i = 0; i < 6; i++) { this.pillarT.push(0); this.pillarP.push(new THREE.Vector3()); }
    scene.add(this.pillars);
  }

  private placeWalker(w: Walker, tx: number, tz: number) {
    const near = this.city.walkPaths.filter(r => Math.hypot((r.x0 + r.x1) / 2 - tx, (r.z0 + r.z1) / 2 - tz) < 160);
    w.rect = near.length ? near[Math.floor(Math.random() * near.length)] : this.city.walkPaths[Math.floor(Math.random() * this.city.walkPaths.length)];
    w.p = Math.random(); w.dir = Math.random() < 0.5 ? 1 : -1;
  }

  reset(tx: number, tz: number) {
    for (const w of this.walkers) if (w.mode === 0) { this.placeWalker(w, tx, tz); w.scale = 1; w.fade = 0; }
  }

  private perim(r: Rect, p: number) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, L = 2 * (w + d); let s = ((p % 1) + 1) % 1 * L;
    if (s < w) return { x: r.x0 + s, z: r.z0, h: 0 }; s -= w;
    if (s < d) return { x: r.x1, z: r.z0 + s, h: Math.PI / 2 }; s -= d;
    if (s < w) return { x: r.x1 - s, z: r.z1, h: Math.PI }; s -= w;
    return { x: r.x0, z: r.z1 - s, h: -Math.PI / 2 };
  }

  private pillar(x: number, z: number) {
    let k = this.pillarT.findIndex(t => t <= 0); if (k < 0) k = 0;
    this.pillarT[k] = 1; this.pillarP[k].set(x, 0, z);
  }

  update(dt: number, t: number, tx: number, tz: number) {
    const R = Math.random;
    this.evT -= dt;
    if (this.evT < 0) {
      this.evT = 4 + R() * 6;
      // pick someone near the truck to log out / in
      const cand = this.walkers.filter(w => w.fade === 0 && Math.hypot(w.x - tx, w.z - tz) < 70);
      if (cand.length) { const w = cand[Math.floor(R() * cand.length)]; w.fade = -1; this.pillar(w.x, w.z); this.events.push(PLAYER_NAMES[w.name] + ' logged out'); }
    }
    for (let i = 0; i < this.N; i++) {
      const w = this.walkers[i];
      if (w.mode === 0) {
        const r = w.rect; const L = 2 * (r.x1 - r.x0 + r.z1 - r.z0);
        w.p += w.dir * dt * 1.3 / L;
        const pp = this.perim(r, w.p); w.x = pp.x; w.z = pp.z; w.h = pp.h + (w.dir < 0 ? Math.PI : 0);
        if (Math.hypot(w.x - tx, w.z - tz) > 170 && w.fade === 0) this.placeWalker(w, tx, tz);
      } else {
        w.x = w.px + Math.sin(t * 0.3 + w.phase) * 0.6; w.z = w.pz + Math.cos(t * 0.25 + w.phase) * 0.6; w.h += dt * 0.3 * Math.sin(w.phase);
      }
      if (w.fade < 0) { w.scale -= dt * 1.6; if (w.scale <= 0) { w.scale = 0; w.fade = 1; if (w.mode === 0) this.placeWalker(w, tx, tz); const pp = w.mode === 0 ? this.perim(w.rect, w.p) : { x: w.px, z: w.pz }; this.pillar(pp.x, pp.z); this.events.push(PLAYER_NAMES[(w.name + 7) % PLAYER_NAMES.length] + ' logged in'); w.name = (w.name + 7) % PLAYER_NAMES.length; } }
      else if (w.fade > 0) { w.scale += dt * 1.6; if (w.scale >= 1) { w.scale = 1; w.fade = 0; } }
      const bounce = w.mode === 1 ? Math.abs(Math.sin(t * 4 + w.phase)) * 0.25 : Math.abs(Math.sin(t * 7 + w.phase)) * 0.04;
      this.q.setFromAxisAngle(this.Y, Math.PI / 2 - w.h);
      this.m.compose(this.v.set(w.x, 0.15 + bounce, w.z), this.q, this.s.set(w.scale, w.scale, w.scale));
      this.bodies.setMatrixAt(i, this.m); this.heads.setMatrixAt(i, this.m);
      if (w.worker) this.m.compose(this.v.set(0, -100, 0), this.q, this.s.set(0, 0, 0));
      this.hats.setMatrixAt(i, this.m);
      this.tagPos.setXYZ(i, w.x, 2.15 + bounce, w.z); this.tagA.setX(i, w.scale);
    }
    this.bodies.instanceMatrix.needsUpdate = this.heads.instanceMatrix.needsUpdate = this.hats.instanceMatrix.needsUpdate = true;
    this.tagPos.needsUpdate = true; this.tagA.needsUpdate = true;
    for (let k = 0; k < 6; k++) {
      if (this.pillarT[k] > 0) this.pillarT[k] -= dt * 1.2;
      const s = Math.max(0, this.pillarT[k]);
      this.m.compose(this.v.copy(this.pillarP[k]), this.q.identity(), this.s.set(s, s > 0 ? 1 : 0, s)); this.pillars.setMatrixAt(k, this.m);
    }
    this.pillars.instanceMatrix.needsUpdate = true;
  }
}
