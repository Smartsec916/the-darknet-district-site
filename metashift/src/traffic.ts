import * as THREE from 'three';
import { City, P, HALF_ROAD, LANE, NN, nodePos, edgeKey, obbOverlap, type OBB } from './city';

interface TCar {
  a: number; b: number; s: number; mode: 0 | 1; // 0 edge, 1 turning
  c: number; p0: THREE.Vector2; p1: THREE.Vector2; p2: THREE.Vector2; u: number; len: number;
  v: number; vmax: number; x: number; z: number; h: number; hit: number; stuck: number; color: THREE.Color; active: boolean;
}

const S_IN = HALF_ROAD + 1, S_STOP = P - HALF_ROAD - 1.5;

export class Traffic {
  cars: TCar[] = [];
  body: THREE.InstancedMesh; cabin: THREE.InstancedMesh; lights: THREE.InstancedMesh;
  max = 40; count = 0; speed = 11;
  private m = new THREE.Matrix4(); private q = new THREE.Quaternion(); private v3 = new THREE.Vector3(); private s3 = new THREE.Vector3(1, 1, 1);
  private Y = new THREE.Vector3(0, 1, 0);
  private R = Math.random;

  constructor(private city: City, scene: THREE.Scene) {
    const bg = new THREE.BoxGeometry(1.9, 0.8, 4.3); bg.translate(0, 0.75, 0);
    const cg = new THREE.BoxGeometry(1.7, 0.62, 2.2); cg.translate(0, 1.45, -0.3);
    const lg = new THREE.BoxGeometry(0.35, 0.16, 0.06);
    this.body = new THREE.InstancedMesh(bg, new THREE.MeshLambertMaterial({ color: 0xffffff }), this.max);
    this.cabin = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ color: 0x1b2430, emissive: 0x05080c }), this.max);
    this.lights = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.max * 4);
    for (const im of [this.body, this.cabin, this.lights]) { im.frustumCulled = false; im.count = 0; scene.add(im); }
    const pal = [0xff4f6d, 0x5ff2ff, 0xa77bff, 0xffd23f, 0x3fbf6a, 0xf2f2f2, 0x2a2a2a, 0xff8a3a, 0x3f8cff, 0xd64fd0];
    for (let i = 0; i < this.max; i++) {
      this.cars.push({ a: 0, b: 1, s: 0, mode: 0, c: 0, p0: new THREE.Vector2(), p1: new THREE.Vector2(), p2: new THREE.Vector2(), u: 0, len: 1,
        v: 0, vmax: 10, x: 0, z: 0, h: 0, hit: 0, stuck: 0, color: new THREE.Color(pal[i % pal.length]), active: false });
      this.body.setColorAt(i, this.cars[i].color);
    }
    for (let i = 0; i < this.max; i++) {
      const w = new THREE.Color(0xfff6d8), r = new THREE.Color(0xff2020);
      this.lights.setColorAt(i * 4, w); this.lights.setColorAt(i * 4 + 1, w); this.lights.setColorAt(i * 4 + 2, r); this.lights.setColorAt(i * 4 + 3, r);
    }
  }

  setup(count: number, speed: number, tx: number, tz: number) {
    this.count = Math.min(this.max, count); this.speed = speed;
    for (let i = 0; i < this.max; i++) {
      const c = this.cars[i]; c.active = i < this.count;
      if (c.active) this.spawn(c, tx, tz, 25, 260);
    }
    this.body.count = this.cabin.count = this.count; this.lights.count = this.count * 4;
  }

  private edgeDir(a: number, b: number) { const A = nodePos(a), B = nodePos(b); return { dx: Math.sign(B.x - A.x), dz: Math.sign(B.z - A.z), A, B }; }
  private place(c: TCar) {
    const { dx, dz, A } = this.edgeDir(c.a, c.b);
    c.x = A.x + dx * c.s - dz * LANE; c.z = A.z + dz * c.s + dx * LANE; c.h = Math.atan2(dz, dx);
  }

  private spawn(c: TCar, tx: number, tz: number, rmin: number, rmax: number) {
    for (let tries = 0; tries < 40; tries++) {
      const a = Math.floor(this.R() * NN * NN); const nb = this.city.adj[a]; const b = nb[Math.floor(this.R() * nb.length)];
      if (this.city.blocked.has(edgeKey(a, b))) continue;
      c.a = a; c.b = b; c.s = S_IN + this.R() * (S_STOP - S_IN - 4); c.mode = 0; this.place(c);
      const d = Math.hypot(c.x - tx, c.z - tz);
      if (d < rmin || d > rmax) continue;
      let ok = true;
      for (const o of this.cars) if (o !== c && o.active && Math.hypot(o.x - c.x, o.z - c.z) < 12) { ok = false; break; }
      if (!ok) continue;
      c.v = this.speed * 0.6; c.vmax = this.speed * (0.8 + this.R() * 0.4); c.hit = 0; c.stuck = 0;
      return;
    }
  }

  private startTurn(c: TCar) {
    const nb = this.city.adj[c.b].filter(n => n !== c.a && !this.city.blocked.has(edgeKey(c.b, n)));
    const next = nb.length ? nb[Math.floor(this.R() * nb.length)] : c.a;
    const d1 = this.edgeDir(c.a, c.b), d2 = this.edgeDir(c.b, next);
    const B = d1.B;
    c.p0.set(B.x - d1.dx * (P - S_STOP) - d1.dz * LANE, B.z - d1.dz * (P - S_STOP) + d1.dx * LANE);
    c.p2.set(B.x + d2.dx * S_IN - d2.dz * LANE, B.z + d2.dz * S_IN + d2.dx * LANE);
    const dot = d1.dx * d2.dx + d1.dz * d2.dz;
    if (dot > 0.5) c.p1.copy(c.p0).add(c.p2).multiplyScalar(0.5);
    else if (dot < -0.5) c.p1.set(B.x + d1.dx * 6, B.z + d1.dz * 6);
    else c.p1.set(B.x - d1.dz * LANE - d2.dz * LANE, B.z + d1.dx * LANE + d2.dx * LANE);
    c.len = c.p0.distanceTo(c.p1) + c.p1.distanceTo(c.p2);
    c.c = next; c.u = 0; c.mode = 1;
  }

  update(dt: number, t: number, truckObbs: OBB[], tx: number, tz: number) {
    for (let i = 0; i < this.count; i++) {
      const c = this.cars[i];
      const ch = Math.cos(c.h), sh = Math.sin(c.h);
      let target = c.vmax;
      if (c.hit > 0) { c.hit -= dt; target = 0; }
      // light ahead
      if (c.mode === 0) {
        const dist = S_STOP - c.s;
        const { dx } = this.edgeDir(c.a, c.b);
        const st = this.city.lightState(c.b, dx !== 0 ? 0 : 1, t);
        if (st === 2 || (st === 1 && dist > 7)) target = Math.min(target, Math.sqrt(Math.max(0, 2 * 3.5 * (dist - 0.5))));
      }
      // car ahead
      for (let j = 0; j < this.count; j++) {
        if (j === i) continue; const o = this.cars[j];
        const rx = o.x - c.x, rz = o.z - c.z;
        const along = rx * ch + rz * sh; if (along < 0 || along > 16) continue;
        const lat = Math.abs(-rx * sh + rz * ch); if (lat > 2.2) continue;
        target = Math.min(target, Math.max(0, (along - 6.5) * 1.2));
      }
      // truck ahead
      const probe: OBB = { x: c.x + ch * 7.5, z: c.z + sh * 7.5, hx: 5.5, hz: 1.4, c: ch, s: sh };
      for (const ob of truckObbs) if (obbOverlap(probe, ob)) { target = 0; break; }
      // integrate speed
      const acc = target > c.v ? 2.5 : -7;
      c.v += acc * dt; if ((acc > 0 && c.v > target) || (acc < 0 && c.v < target)) c.v = target;
      c.v = Math.max(0, c.v);
      c.stuck = c.v < 0.2 ? c.stuck + dt : 0;
      const ds = c.v * dt;
      if (c.mode === 0) {
        c.s += ds;
        if (c.s >= S_STOP) { c.s = S_STOP; this.startTurn(c); }
        else this.place(c);
      }
      if (c.mode === 1) {
        c.u += ds / c.len;
        if (c.u >= 1) { c.a = c.b; c.b = c.c; c.s = S_IN; c.mode = 0; this.place(c); }
        else {
          const u = c.u, iu = 1 - u;
          const x = iu * iu * c.p0.x + 2 * iu * u * c.p1.x + u * u * c.p2.x;
          const z = iu * iu * c.p0.y + 2 * iu * u * c.p1.y + u * u * c.p2.y;
          const tx2 = 2 * iu * (c.p1.x - c.p0.x) + 2 * u * (c.p2.x - c.p1.x);
          const tz2 = 2 * iu * (c.p1.y - c.p0.y) + 2 * u * (c.p2.y - c.p1.y);
          c.x = x; c.z = z; if (tx2 * tx2 + tz2 * tz2 > 1e-6) c.h = Math.atan2(tz2, tx2);
        }
      }
      const d = Math.hypot(c.x - tx, c.z - tz);
      if (d > 280 || (c.stuck > 30 && d > 60)) this.spawn(c, tx, tz, 90, 240);
      // matrices
      this.q.setFromAxisAngle(this.Y, Math.PI / 2 - c.h);
      this.m.compose(this.v3.set(c.x, 0, c.z), this.q, this.s3);
      this.body.setMatrixAt(i, this.m); this.cabin.setMatrixAt(i, this.m);
      for (let k = 0; k < 4; k++) {
        const lx = k % 2 === 0 ? 0.65 : -0.65, lz = k < 2 ? 2.17 : -2.17;
        const wx = c.x + ch * lz - sh * -lx, wz = c.z + sh * lz + ch * -lx;
        this.m.compose(this.v3.set(wx, 0.85, wz), this.q, this.s3); this.lights.setMatrixAt(i * 4 + k, this.m);
      }
    }
    this.body.instanceMatrix.needsUpdate = true; this.cabin.instanceMatrix.needsUpdate = true; this.lights.instanceMatrix.needsUpdate = true;
  }

  obb(i: number): OBB { const c = this.cars[i]; return { x: c.x, z: c.z, hx: 2.15, hz: 0.95, c: Math.cos(c.h), s: Math.sin(c.h) }; }
  bump(i: number) { this.cars[i].hit = 3; this.cars[i].v = 0; }
}
