import * as THREE from 'three';
import type { OBB } from './city';

export const WHEELBASE = 4.0;
export const HITCH = 0.4;       // fifth wheel ahead of rear axle
export const TRAILER_L = 10.5;  // kingpin -> trailer axle
const VMAX = 24;

export interface DriveInput { throttle: number; brake: number; steer: number }

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export class Truck {
  x = 0; z = 0; h = 0; v = 0; delta = 0; ht = 0;
  gear: 'D' | 'R' = 'D'; holdT = 0; fuel = 1; throttleNow = 0; brakeNow = 0;
  latAcc = 0; lonAcc = 0; odo = 0;
  tractor = new THREE.Group();
  trailer = new THREE.Group();
  wheelPivot = new THREE.Group();
  frontWheels: THREE.Object3D[] = [];
  allWheels: THREE.Object3D[] = [];
  freshener!: THREE.Object3D;
  wiper!: THREE.Object3D;
  rainGlass!: THREE.Mesh;
  dashCanvas: HTMLCanvasElement; dashCtx: CanvasRenderingContext2D; dashTex: THREE.CanvasTexture;
  headlight: THREE.SpotLight;
  brakeLightMat: THREE.MeshBasicMaterial;
  interior = new THREE.Group();
  camAnchor = new THREE.Object3D();
  mirrorL = new THREE.Object3D(); mirrorR = new THREE.Object3D();
  freshAng = 0; freshVel = 0; wiperT = 0;

  constructor() {
    this.dashCanvas = document.createElement('canvas'); this.dashCanvas.width = 512; this.dashCanvas.height = 128;
    this.dashCtx = this.dashCanvas.getContext('2d')!;
    this.dashTex = new THREE.CanvasTexture(this.dashCanvas); this.dashTex.colorSpace = THREE.SRGBColorSpace;
    this.brakeLightMat = new THREE.MeshBasicMaterial({ color: 0x661010 });
    this.headlight = new THREE.SpotLight(0xfff2d0, 0, 90, 0.55, 0.5, 1.2);
    this.buildTractor(); this.buildTrailer();
  }

  reset(x: number, z: number, h: number, fuel: number) {
    this.x = x; this.z = z; this.h = h; this.ht = h; this.v = 0; this.delta = 0; this.gear = 'D'; this.fuel = fuel; this.holdT = 0;
    this.sync();
  }

  snapshot() { return [this.x, this.z, this.h, this.ht, this.v, this.delta]; }
  restore(s: number[]) { [this.x, this.z, this.h, this.ht, this.v, this.delta] = s; }

  step(dt: number, inp: DriveInput, grip: number) {
    const av = Math.abs(this.v);
    // gear logic: hold brake at a stop to reverse; press throttle to go forward
    if (this.gear === 'D' && inp.brake > 0.2 && av < 0.4 && inp.throttle < 0.1) { this.holdT += dt; if (this.holdT > 0.35) { this.gear = 'R'; this.holdT = 0; } }
    else if (this.gear === 'R' && inp.throttle > 0.2 && av < 0.4) { this.holdT += dt; if (this.holdT > 0.2) { this.gear = 'D'; this.holdT = 0; } }
    else this.holdT = 0;
    const fwd = this.gear === 'D';
    const go = fwd ? inp.throttle : inp.brake;
    const stop = fwd ? inp.brake : inp.throttle;
    this.throttleNow = go; this.brakeNow = stop;
    const vmax = this.fuel > 0 ? VMAX : 3;
    let acc = 0;
    if (fwd) acc += go * 2.1 * Math.max(0, 1 - this.v / vmax);
    else acc -= go * 1.3 * Math.max(0, 1 + this.v / 4.5);
    const brakeDec = stop * 6.5 * grip + 0.25 + 0.0022 * this.v * this.v;
    if (this.v > 0) { acc -= brakeDec; } else if (this.v < 0) { acc += brakeDec; }
    const nv = this.v + acc * dt;
    if (this.v !== 0 && Math.sign(nv) !== Math.sign(this.v) && go < 0.05) this.v = 0; else this.v = nv;
    if (Math.abs(this.v) < 0.02 && go < 0.05) this.v = 0;
    this.lonAcc = acc;
    // steering: heavy, speed-sensitive
    const dmax = 0.6 / (1 + Math.abs(this.v) * 0.075);
    const target = inp.steer * dmax;
    const rate = 1.5 * dt;
    this.delta += Math.max(-rate, Math.min(rate, target - this.delta));
    // fuel
    const dist = Math.abs(this.v) * dt;
    this.odo += dist;
    this.fuel = Math.max(0, this.fuel - dist * (0.00012 + go * 0.00008));
    // kinematics (2 substeps)
    const n = 2, sdt = dt / n;
    for (let i = 0; i < n; i++) {
      const hd = this.v / WHEELBASE * Math.tan(this.delta);
      const c = Math.cos(this.h), s = Math.sin(this.h);
      // hitch velocity = v f + hd * HITCH * nrm
      const vhx = this.v * c + hd * HITCH * -s, vhz = this.v * s + hd * HITCH * c;
      const ntx = -Math.sin(this.ht), ntz = Math.cos(this.ht);
      const htd = (vhx * ntx + vhz * ntz) / TRAILER_L;
      this.x += this.v * c * sdt; this.z += this.v * s * sdt;
      this.h += hd * sdt; this.ht += htd * sdt;
      this.latAcc = this.v * hd;
    }
    const phi = wrap(this.h - this.ht);
    const lim = 1.3;
    if (Math.abs(phi) > lim) { this.ht = this.h - Math.sign(phi) * lim; this.v *= 0.9; }
    this.h = wrap(this.h); this.ht = wrap(this.ht);
  }

  kingpin() { return { x: this.x + Math.cos(this.h) * HITCH, z: this.z + Math.sin(this.h) * HITCH }; }
  obbs(): [OBB, OBB] {
    const c = Math.cos(this.h), s = Math.sin(this.h);
    const k = this.kingpin(); const ct = Math.cos(this.ht), st = Math.sin(this.ht);
    return [
      { x: this.x + c * 2.0, z: this.z + s * 2.0, hx: 3.45, hz: 1.27, c, s },
      { x: k.x - ct * 5.6, z: k.z - st * 5.6, hx: 6.8, hz: 1.3, c: ct, s: st },
    ];
  }
  trailerRear() { const k = this.kingpin(); return { x: k.x - Math.cos(this.ht) * 12.4, z: k.z - Math.sin(this.ht) * 12.4 }; }
  front() { return { x: this.x + Math.cos(this.h) * 5.6, z: this.z + Math.sin(this.h) * 5.6 }; }

  sync() {
    this.tractor.position.set(this.x, 0, this.z); this.tractor.rotation.y = Math.PI / 2 - this.h;
    const k = this.kingpin();
    this.trailer.position.set(k.x, 0, k.z); this.trailer.rotation.y = Math.PI / 2 - this.ht;
  }

  animate(dt: number, rain: boolean, night: boolean) {
    this.sync();
    this.wheelPivot.rotation.z = -this.delta * 15;
    for (const w of this.frontWheels) w.rotation.y = -this.delta;
    const spin = this.v * dt / 0.52;
    for (const w of this.allWheels) w.rotation.x += spin;
    // air freshener swings with lateral accel
    const target = Math.max(-0.7, Math.min(0.7, -this.latAcc * 0.08));
    this.freshVel += ((target - this.freshAng) * 30 - this.freshVel * 3) * dt;
    this.freshAng += this.freshVel * dt;
    this.freshener.rotation.z = this.freshAng;
    this.freshener.rotation.x = Math.max(-0.5, Math.min(0.5, this.lonAcc * 0.05));
    this.wiper.visible = rain; this.rainGlass.visible = rain;
    if (rain) { this.wiperT += dt * 2.4; this.wiper.rotation.z = -0.1 + Math.abs(Math.sin(this.wiperT)) * 1.9; }
    this.headlight.intensity = night ? 60 : 0;
    this.brakeLightMat.color.setHex(this.brakeNow > 0.1 || this.gear === 'R' ? 0xff2020 : 0x661010);
  }

  drawDash(timeLeft: string, radioOn: boolean, station: string, fuelLow: boolean) {
    const c = this.dashCtx; const W = 512;
    c.fillStyle = '#05080c'; c.fillRect(0, 0, W, 128);
    // left: speed / gear / fuel
    c.fillStyle = '#5ff2ff'; c.font = 'bold 64px Arial'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillText(String(Math.round(Math.abs(this.v) * 3.6)), 150, 74);
    c.font = 'bold 20px Arial'; c.textAlign = 'left'; c.fillText('KM/H', 156, 74);
    c.fillStyle = this.gear === 'R' ? '#ff5050' : '#9cff9c'; c.font = 'bold 44px Arial'; c.fillText(this.gear, 214, 70);
    c.fillStyle = '#233'; c.fillRect(20, 92, 220, 18);
    c.fillStyle = fuelLow ? '#ff4040' : '#ffcc33'; c.fillRect(20, 92, 220 * this.fuel, 18);
    c.fillStyle = '#ccc'; c.font = 'bold 14px Arial'; c.fillText('FUEL', 24, 106);
    c.fillStyle = '#7a8a99'; c.font = '16px Arial'; c.fillText(timeLeft, 20, 26);
    // right: radio
    c.fillStyle = '#0c1410'; c.fillRect(268, 8, 236, 112);
    c.strokeStyle = '#2b3b33'; c.lineWidth = 3; c.strokeRect(268, 8, 236, 112);
    c.fillStyle = radioOn ? '#7dff9a' : '#335544'; c.font = 'bold 30px Arial'; c.textAlign = 'center';
    c.fillText(radioOn ? station : 'RADIO OFF', 386, 58);
    c.font = '16px Arial'; c.fillText(radioOn ? '♪ SHIFT FM · Electro Hits' : 'tap to turn on', 386, 92);
    this.dashTex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ models
  private buildTractor() {
    const t = this.tractor;
    const lam = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
    const paint = lam(0x1d4fa8), chrome = lam(0xc8ccd2, 0x222222), black = lam(0x161616), dark = lam(0x2b2c30);
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = t) => {
      const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    // chassis
    add(new THREE.BoxGeometry(1.2, 0.35, 7.2), black, 0, 0.9, 1.9);
    // cab
    add(new THREE.BoxGeometry(2.5, 2.4, 2.9), paint, 0, 2.45, 2.2);
    add(new THREE.BoxGeometry(2.5, 0.9, 1.4), paint, 0, 3.9, 1.3); // sleeper roof fairing
    // hood
    const hood = add(new THREE.BoxGeometry(2.0, 0.95, 1.55), paint, 0, 1.47, 4.35);
    add(new THREE.BoxGeometry(0.08, 0.02, 1.5), lam(0xd8dde3, 0x333333), 0, 1.955, 4.35); // hood stripe
    add(new THREE.BoxGeometry(0.12, 0.12, 0.12), chrome, 0, 2.0, 5.0); // ornament
    hood.scale.set(1, 1, 1);
    add(new THREE.BoxGeometry(1.7, 0.85, 0.08), chrome, 0, 1.42, 5.15); // grille
    add(new THREE.BoxGeometry(2.5, 0.35, 0.3), chrome, 0, 0.9, 5.3); // bumper
    const hl = lam(0xffffee, 0x888866);
    add(new THREE.BoxGeometry(0.35, 0.2, 0.05), hl, 0.85, 1.25, 5.17); add(new THREE.BoxGeometry(0.35, 0.2, 0.05), hl, -0.85, 1.25, 5.17);
    add(new THREE.BoxGeometry(0.8, 0.25, 0.1), lam(0xffcc33, 0x553300), 0, 2.75, 5.5).visible = false;
    // fenders
    add(new THREE.BoxGeometry(0.4, 0.3, 1.5), paint, 1.1, 1.35, 4.0); add(new THREE.BoxGeometry(0.4, 0.3, 1.5), paint, -1.1, 1.35, 4.0);
    // stacks
    const stack = new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8);
    add(stack, chrome, 1.15, 3.1, 0.6); add(stack, chrome, -1.15, 3.1, 0.6);
    // fuel tanks
    const tank = new THREE.CylinderGeometry(0.42, 0.42, 1.6, 10); tank.rotateX(Math.PI / 2);
    add(tank, chrome, 1.05, 1.0, 1.4); add(tank, chrome, -1.05, 1.0, 1.4);
    // fifth wheel
    add(new THREE.BoxGeometry(1.6, 0.15, 1.4), dark, 0, 1.15, HITCH);
    // mirrors (exterior)
    for (const sx of [1, -1]) {
      add(new THREE.BoxGeometry(0.05, 0.05, 0.6), dark, sx * 1.35, 2.9, 3.45);
      add(new THREE.BoxGeometry(0.12, 0.7, 0.32), dark, sx * 1.6, 2.85, 3.3);
    }
    // wheels
    const wg = new THREE.CylinderGeometry(0.52, 0.52, 0.4, 12); wg.rotateZ(Math.PI / 2);
    const wm = lam(0x111111);
    const hub = new THREE.CylinderGeometry(0.25, 0.25, 0.42, 8); hub.rotateZ(Math.PI / 2);
    const mkWheel = (x: number, z: number, front: boolean) => {
      const piv = new THREE.Group(); piv.position.set(x, 0.52, z); t.add(piv);
      const w = new THREE.Group(); piv.add(w);
      w.add(new THREE.Mesh(wg, wm)); w.add(new THREE.Mesh(hub, chrome));
      if (front) this.frontWheels.push(piv);
      this.allWheels.push(w);
    };
    mkWheel(1.05, 4.0, true); mkWheel(-1.05, 4.0, true);
    for (const z of [0.0, -1.3]) { mkWheel(1.0, z, false); mkWheel(-1.0, z, false); }
    // brake lights
    add(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.brakeLightMat, 0.9, 1.2, -1.75); add(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.brakeLightMat, -0.9, 1.2, -1.75);

    // headlight spotlight
    this.headlight.position.set(0, 1.6, 5.6);
    const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 30); t.add(tgt); this.headlight.target = tgt; t.add(this.headlight);

    // ---------------- interior (visible from the driver seat)
    const I = this.interior; t.add(I);
    const plastic = lam(0x26272b), plastic2 = lam(0x34363b), trim = lam(0x4a4d55);
    // dashboard
    add(new THREE.BoxGeometry(2.4, 0.45, 0.9), plastic, 0, 1.85, 3.35, I);
    const dashTop = add(new THREE.BoxGeometry(2.4, 0.08, 0.7), plastic2, 0, 2.1, 3.3, I); dashTop.rotation.x = -0.12;
    // gauge binnacle behind the wheel
    const binn = add(new THREE.BoxGeometry(0.66, 0.2, 0.22), plastic, 0.47, 2.22, 3.42, I); binn.rotation.x = 0.5;
    // screen (speed/fuel/radio)
    const scr = new THREE.PlaneGeometry(0.58, 0.145);
    const scrMesh = add(scr, new THREE.MeshBasicMaterial({ map: this.dashTex }), 0.47, 2.28, 3.31, I);
    scrMesh.rotation.y = Math.PI; scrMesh.rotation.x = 0.5;
    // radio knobs
    for (const kx of [0.12, 0.82]) { const k = add(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 10), trim, kx, 2.27, 3.33, I); k.rotation.x = Math.PI / 2 - 0.5; }
    // pillars & header
    for (const sx of [1, -1]) {
      const p = add(new THREE.BoxGeometry(0.16, 1.45, 0.16), plastic, sx * 1.18, 3.0, 3.6, I); p.rotation.x = 0.18;
    }
    add(new THREE.BoxGeometry(2.5, 0.22, 0.4), plastic, 0, 3.66, 3.45, I);
    add(new THREE.BoxGeometry(0.9, 0.03, 0.42), lam(0x4b4038), 0.55, 3.52, 3.35, I); // sun visor
    // window frame bottom
    add(new THREE.BoxGeometry(2.4, 0.06, 0.08), trim, 0, 2.15, 3.62, I);
    // steering wheel
    this.wheelPivot.position.set(0.55, 2.12, 2.92);
    this.wheelPivot.rotation.order = 'XYZ';
    const col = new THREE.Group(); col.position.copy(this.wheelPivot.position); col.rotation.x = 0.8; I.add(col);
    this.wheelPivot.position.set(0, 0, 0); col.add(this.wheelPivot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 6, 24), lam(0x1a1a1a)); this.wheelPivot.add(rim);
    const spokeG = new THREE.BoxGeometry(0.46, 0.04, 0.03);
    const s1 = new THREE.Mesh(spokeG, trim); this.wheelPivot.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.03), trim); s2.position.y = -0.12; this.wheelPivot.add(s2);
    const hubm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), lam(0x1d4fa8)); hubm.rotation.x = Math.PI / 2; hubm.position.z = -0.01; this.wheelPivot.add(hubm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), lam(0xff4f6d)); knob.position.set(0.24, 0, -0.03); this.wheelPivot.add(knob);
    // air freshener (MetaShift logo tree)
    const fr = new THREE.Group(); fr.position.set(0.3, 3.53, 3.35); I.add(fr);
    const str = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.18, 0.006), lam(0xdddddd)); str.position.y = -0.09; fr.add(str);
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 3), lam(0x5ff2ff, 0x1a5560)); tree.position.y = -0.24; fr.add(tree);
    this.freshener = fr;
    // wiper and rain glass
    const wp = new THREE.Group(); wp.position.set(0.35, 2.18, 3.66); I.add(wp);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.0, 0.02), lam(0x111111)); blade.position.y = 0.5; wp.add(blade);
    this.wiper = wp;
    this.rainGlass = add(new THREE.PlaneGeometry(2.3, 1.3), new THREE.MeshBasicMaterial({ map: makeDropTex(), transparent: true, opacity: 0.55, depthWrite: false }), 0, 3.0, 3.68, I);
    this.rainGlass.rotation.y = Math.PI;
    // camera & mirror anchors
    this.camAnchor.position.set(0.55, 2.95, 2.35); t.add(this.camAnchor);
    this.mirrorL.position.set(1.62, 2.85, 3.0); t.add(this.mirrorL);
    this.mirrorR.position.set(-1.62, 2.85, 3.0); t.add(this.mirrorR);
  }

  private buildTrailer() {
    const t = this.trailer;
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const c = cv.getContext('2d')!;
    c.fillStyle = '#eef1f4'; c.fillRect(0, 0, 1024, 256);
    c.fillStyle = '#0b1d3a'; c.fillRect(0, 196, 1024, 60);
    c.fillStyle = '#5ff2ff'; c.fillRect(0, 190, 1024, 6);
    c.fillStyle = '#0b1d3a'; c.font = '900 92px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('METASHIFT', 512, 92);
    c.font = 'italic 34px Arial'; c.fillStyle = '#3a4a60'; c.fillText('FREIGHT · Your income stream.', 512, 156);
    c.fillStyle = '#ffffff'; c.font = 'bold 26px Arial'; c.fillText('UNIT 4471 · VIRTUAL WORK. REAL INCOME.', 512, 226);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const side = new THREE.MeshLambertMaterial({ map: tex });
    const plain = new THREE.MeshLambertMaterial({ color: 0xe6e9ec });
    const back = new THREE.MeshLambertMaterial({ color: 0xb9bec4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.56, 2.9, 13.6), [side, side, plain, plain, plain, back]);
    body.position.set(0, 2.65, -5.6); t.add(body);
    const black = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 13), black); frame.position.set(0, 1.05, -5.8); t.add(frame);
    const wg = new THREE.CylinderGeometry(0.52, 0.52, 0.4, 12); wg.rotateZ(Math.PI / 2);
    for (const z of [-9.9, -11.2]) for (const x of [1.0, -1.0]) {
      const w = new THREE.Mesh(wg, black); w.position.set(x, 0.52, z); t.add(w); this.allWheels.push(w);
    }
    const leg = new THREE.BoxGeometry(0.15, 1.1, 0.15);
    for (const x of [0.8, -0.8]) { const l = new THREE.Mesh(leg, black); l.position.set(x, 0.65, -2.2); t.add(l); }
    for (const x of [1.0, -1.0]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), this.brakeLightMat); l.position.set(x, 1.25, -12.42); t.add(l); }
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.15), black); bumper.position.set(0, 0.75, -12.3); t.add(bumper);
  }
}

function makeDropTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d')!;
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 256, y = Math.random() * 128, r = 0.8 + Math.random() * 2.2;
    c.fillStyle = `rgba(200,220,255,${0.25 + Math.random() * 0.35})`; c.beginPath(); c.ellipse(x, y, r, r * 1.3, 0, 0, Math.PI * 2); c.fill();
  }
  return new THREE.CanvasTexture(cv);
}
