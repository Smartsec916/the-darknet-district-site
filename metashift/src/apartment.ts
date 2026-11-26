import * as THREE from 'three';
import { Character } from './avatars';
import { Director, lerp } from './director';

const lam = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });

export class Apartment {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
  guy: Character;
  headset: THREE.Group;
  lamp: THREE.PointLight; fill!: THREE.DirectionalLight; lampShade: THREE.Mesh; windowLight: THREE.DirectionalLight; amb: THREE.HemisphereLight;
  windowMat: THREE.MeshBasicMaterial; clockCtx: CanvasRenderingContext2D; clockTex: THREE.CanvasTexture;
  camTarget = new THREE.Vector3(-1.6, 0.8, -0.9); camPos = new THREE.Vector3(1.6, 1.55, 1.7);
  private lyingQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  private sitQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  private nightstandTop = new THREE.Vector3(-1.05, 0.6, -1.7);
  t = 0;

  constructor() {
    const s = this.scene; s.background = new THREE.Color(0x0b0d12);
    this.amb = new THREE.HemisphereLight(0xb8c4d6, 0x4a4036, 1.3); s.add(this.amb);
    this.fill = new THREE.DirectionalLight(0xdfe6f2, 1.0); this.fill.position.set(2, 2.4, 3); s.add(this.fill);
    this.windowLight = new THREE.DirectionalLight(0xbfd2ff, 1.2); this.windowLight.position.set(0.8, 2.2, -4); s.add(this.windowLight);
    this.lamp = new THREE.PointLight(0xffc27a, 6, 6, 1.6); this.lamp.position.set(-1.0, 1.1, -1.7); s.add(this.lamp);
    // room
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), lam(0x5a4636)); floor.rotation.x = -Math.PI / 2; s.add(floor);
    const wallM = lam(0x8e8a7c), wallM2 = lam(0x7d796c);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.7), wallM); back.position.set(0, 1.35, -2); s.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.7), wallM2); left.rotation.y = Math.PI / 2; left.position.set(-2.5, 1.35, 0); s.add(left);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), lam(0x6d6a62)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.7; s.add(ceil);
    // water stain + peeling poster
    const stain = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), lam(0x6f6a5a)); stain.position.set(1.6, 2.3, -1.99); s.add(stain);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75), new THREE.MeshLambertMaterial({ map: canvasTex(256, 352, (c) => {
      c.fillStyle = '#28324a'; c.fillRect(0, 0, 256, 352); c.fillStyle = '#e8d8a8'; c.font = 'bold 34px Arial'; c.textAlign = 'center';
      c.fillText('PARADISE', 128, 70); c.fillText('ISLAND', 128, 110); c.fillStyle = '#e09a4a'; c.beginPath(); c.arc(128, 220, 60, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3a8a8a'; c.fillRect(0, 260, 256, 92); c.fillStyle = '#ffffff'; c.font = '16px Arial'; c.fillText('someday', 128, 330);
    }) }));
    poster.position.set(-2.49, 1.6, 0.6); poster.rotation.y = Math.PI / 2; poster.rotation.z = 0.04; s.add(poster);
    // rent calendar
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshLambertMaterial({ map: canvasTex(200, 250, (c) => {
      c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 200, 250); c.fillStyle = '#b03030'; c.fillRect(0, 0, 200, 46);
      c.fillStyle = '#fff'; c.font = 'bold 24px Arial'; c.textAlign = 'center'; c.fillText('NOVEMBER', 100, 32);
      c.fillStyle = '#333'; c.font = '14px Arial';
      for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 22 + (i % 7) * 26, 72 + Math.floor(i / 7) * 34);
      c.strokeStyle = '#d02020'; c.lineWidth = 3; c.beginPath(); c.arc(126, 208, 16, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#d02020'; c.font = 'bold 16px Arial'; c.fillText('RENT $1500', 100, 244);
    }) }));
    cal.position.set(0.0, 1.55, -1.99); s.add(cal);
    // window with blinds
    this.windowMat = new THREE.MeshBasicMaterial({ color: 0x9db4d8 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), this.windowMat); win.position.set(1.1, 1.55, -1.98); s.add(win);
    for (let i = 0; i < 9; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.04), lam(0xd8d4c8)); sl.position.set(1.1, 1.1 + i * 0.11, -1.95); sl.rotation.x = 0.6; s.add(sl); }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.1), lam(0xcfcac0)); frame.position.set(1.1, 0.98, -1.95); s.add(frame);
    // bed
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 2.0), lam(0x4a3a2c)); bedFrame.position.set(-1.9, 0.15, -0.9); s.add(bedFrame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 1.95), lam(0xd8d8d0)); mattress.position.set(-1.9, 0.41, -0.9); s.add(mattress);
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 1.2), lam(0x5a6a8a)); blanket.position.set(-1.9, 0.53, -0.4); s.add(blanket);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.35), lam(0xeeeeee)); pillow.position.set(-1.9, 0.57, -1.7); s.add(pillow);
    // nightstand, lamp, clock
    const ns = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.58, 0.4), lam(0x5f4a38)); ns.position.set(-1.05, 0.29, -1.7); s.add(ns);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 8), lam(0x333333)); lampBase.position.set(-0.95, 0.73, -1.8); s.add(lampBase);
    this.lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 0.16, 12, 1, true), lam(0xf0e0c0, 0xffb060)); this.lampShade.position.set(-0.95, 0.92, -1.8); s.add(this.lampShade);
    const clockCv = document.createElement('canvas'); clockCv.width = 128; clockCv.height = 64; this.clockCtx = clockCv.getContext('2d')!;
    this.clockTex = new THREE.CanvasTexture(clockCv);
    const clock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.07), [lam(0x111111), lam(0x111111), lam(0x111111), lam(0x111111), new THREE.MeshBasicMaterial({ map: this.clockTex }), lam(0x111111)]);
    clock.position.set(-1.15, 0.63, -1.6); clock.rotation.y = 0.6; s.add(clock);
    // desk with old PC, laundry pile, mug
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), lam(0x6b5a48)); desk.position.set(1.7, 0.75, -1.6); s.add(desk);
    for (const x of [1.15, 2.25]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.55), lam(0x4b3a2c)); lg.position.set(x, 0.375, -1.6); s.add(lg); }
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.08), lam(0x1a1a1a)); mon.position.set(1.7, 1.0, -1.75); s.add(mon);
    const bills = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.22), lam(0xf4f0e0)); bills.position.set(1.35, 0.79, -1.45); bills.rotation.y = 0.3; s.add(bills);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), lam(0xb03a3a)); mug.position.set(2.05, 0.82, -1.45); s.add(mug);
    for (let i = 0; i < 5; i++) { const cl = new THREE.Mesh(new THREE.BoxGeometry(0.4 - i * 0.05, 0.08, 0.3), lam([0x445566, 0x8a6a4a, 0x333333, 0x6a4a6a, 0x557755][i])); cl.position.set(1.5 + i * 0.03, 0.04 + i * 0.07, 0.9); cl.rotation.y = i * 0.7; s.add(cl); }
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), lam(0x777777)); chair.position.set(1.6, 0.45, -1.0); s.add(chair);
    // character (real life)
    this.guy = new Character({ skin: 0xd9a77e, shirt: 0x5c6066, pants: 0x2e3440, hair: 0x2a1d14, shoes: 0x3a3a3a });
    s.add(this.guy.root);
    // headset
    this.headset = new THREE.Group();
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.14), lam(0x1b1d22)); this.headset.add(hb);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x5ff2ff })); visor.position.set(0, 0, 0.075); this.headset.add(visor);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.015, 4, 16, Math.PI), lam(0x222222)); strap.rotation.x = Math.PI / 2; strap.rotation.z = Math.PI; strap.position.z = -0.0; this.headset.add(strap);
    s.add(this.headset);
  }

  setTime(night: boolean, lampOn: boolean, clock: string) {
    this.windowMat.color.setHex(night ? 0x1a2238 : 0x9db4d8);
    this.windowLight.intensity = night ? 0.15 : 1.1;
    this.amb.intensity = night ? (lampOn ? 0.45 : 0.1) : 1.3;
    this.fill.intensity = night ? (lampOn ? 0.25 : 0.05) : 1.0;
    this.lamp.intensity = lampOn ? 6 : 0;
    (this.lampShade.material as THREE.MeshLambertMaterial).emissive.setHex(lampOn ? 0xffb060 : 0x000000);
    const c = this.clockCtx; c.fillStyle = '#050505'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#ff3030'; c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(clock, 64, 34);
    this.clockTex.needsUpdate = true;
  }

  // pose: 0 lying, 1 sitting on edge
  pose(p: number) {
    const g = this.guy; g.resetPose();
    g.root.quaternion.slerpQuaternions(this.lyingQ, this.sitQ, p);
    // lying: root at (-1.9,0.62,0.1); sitting: root at (-1.55,-0.4,-0.85)
    g.root.position.set(lerp(-1.9, -1.6, p), lerp(0.64, -0.4, p), lerp(0.08, -0.85, p));
    g.legL.rotation.x = g.legR.rotation.x = lerp(0, -Math.PI / 2, p);
    g.shinL.rotation.x = g.shinR.rotation.x = lerp(0, Math.PI / 2, p);
    g.armL.rotation.z = lerp(0.12, 0.1, p); g.armR.rotation.z = -0.12;
    g.spine.rotation.x = lerp(0, 0.18, p);
  }
  headsetAt(where: 'stand' | 'head' | 'handL', p = 1, from?: THREE.Vector3) {
    const target = new THREE.Vector3(); const q = new THREE.Quaternion();
    if (where === 'stand') { target.copy(this.nightstandTop).add(new THREE.Vector3(0.05, 0.06, 0.12)); q.setFromEuler(new THREE.Euler(0, 0.4, 0)); }
    else if (where === 'head') { this.guy.root.updateMatrixWorld(true); this.guy.head.localToWorld(target.set(0, 0.13, 0.09)); this.guy.head.getWorldQuaternion(q); }
    else { this.guy.root.updateMatrixWorld(true); this.guy.handL.getWorldPosition(target); this.guy.head.getWorldQuaternion(q); }
    if (from) target.lerpVectors(from, target, p);
    this.headset.position.copy(target); this.headset.quaternion.copy(q);
  }

  update(dt: number, aspect: number) {
    this.t += dt;
    this.guy.update(dt);
    const portrait = aspect < 1;
    this.camera.aspect = aspect;
    this.camera.fov = portrait ? 62 : 46;
    const cp = portrait ? new THREE.Vector3(1.2, 1.7, 2.6) : this.camPos;
    this.camera.position.set(cp.x + Math.sin(this.t * 0.2) * 0.04, cp.y + Math.sin(this.t * 0.31) * 0.02, cp.z);
    this.camera.lookAt(this.camTarget);
    this.camera.updateProjectionMatrix();
  }

  // --------------------------------------------------------------- sequences
  async morning(D: Director, day: number, say: (who: 'D', text: string, ch: Character) => Promise<void>, sfx: { beep(): void; click(): void }, dayCard: (s: string) => void) {
    this.setTime(false, false, ['6:47', '6:52', '6:45', '6:58', '6:41', '6:50', '6:47', '6:44', '6:49', '6:46'][day - 1] || '6:47');
    this.pose(0); this.guy.setExpr('closed'); this.headsetAt('stand');
    this.camTarget.set(-1.7, 0.7, -0.9);
    dayCard(`DAY ${day}`);
    await D.wait(0.6); sfx.beep(); await D.wait(1.0);
    this.guy.setExpr('tired');
    await D.wait(0.6);
    await D.tween(1.8, p => { this.pose(p); this.camTarget.set(-1.7, lerp(0.7, 1.1, p), -0.9); });
    await D.wait(0.5);
    if (day === 1) {
      this.guy.setExpr('sad');
      await say('D', "Oh, man. I'm short on rent.", this.guy);
      await D.wait(0.4);
      await say('D', 'I need to go to work.', this.guy);
    } else {
      await D.wait(1.0);
    }
    this.guy.setExpr('neutral');
    // reach for the headset (left arm points toward -z where the nightstand is)
    await D.tween(0.9, p => { this.pose(1); this.guy.armL.rotation.x = lerp(0, -0.9, p); this.guy.armL.rotation.z = lerp(0.1, 0.9, p); this.guy.spine.rotation.y = lerp(0, 0.4, p); });
    const from = this.headset.position.clone();
    await D.tween(0.5, p => { this.pose(1); this.guy.armL.rotation.set(-0.9, 0, 0.9); this.guy.spine.rotation.y = 0.4; this.headsetAt('handL', p, from); });
    sfx.click();
    await D.tween(1.1, p => {
      this.pose(1);
      this.guy.spine.rotation.y = lerp(0.4, 0, p);
      this.guy.armL.rotation.set(lerp(-0.9, -2.5, p), 0, lerp(0.9, 0.3, p)); this.guy.foreL.rotation.x = lerp(0, -1.2, p);
      this.guy.armR.rotation.set(lerp(0, -2.5, p), 0, lerp(-0.1, -0.3, p)); this.guy.foreR.rotation.x = lerp(0, -1.2, p);
      this.headsetAt('handL'); const hp = this.headset.position.clone(); this.headsetAt('head', p, hp);
    });
    this.headsetAt('head');
    await D.tween(0.6, p => { this.camTarget.set(lerp(-1.7, -1.6, p), lerp(1.1, 1.45, p), -0.85); });
    await D.wait(0.3);
  }

  async night(D: Director, final: boolean, note: (title: string, body: string) => void, sfx: { click(): void }, balance = '') {
    this.setTime(true, true, final ? '11:58' : ['10:41', '11:05', '10:52', '11:30', '10:12', '11:21', '11:47', '10:33', '11:15'][Math.floor(Math.random() * 9)]);
    this.pose(1); this.guy.setExpr('tired');
    this.headsetAt('head');
    this.camTarget.set(-1.6, 1.3, -0.85);
    await D.wait(0.8);
    // remove headset
    await D.tween(1.0, p => {
      this.pose(1);
      this.guy.armL.rotation.set(lerp(0, -2.5, p), 0, 0.3); this.guy.foreL.rotation.x = lerp(0, -1.2, p);
      this.guy.armR.rotation.set(lerp(0, -2.5, p), 0, -0.3); this.guy.foreR.rotation.x = lerp(0, -1.2, p);
      this.headsetAt('head');
    });
    const from = this.headset.position.clone();
    await D.tween(1.0, p => {
      this.pose(1);
      this.guy.armL.rotation.set(lerp(-2.5, -0.9, p), 0, lerp(0.3, 0.9, p)); this.guy.foreL.rotation.x = lerp(-1.2, 0, p);
      this.guy.armR.rotation.set(lerp(-2.5, 0, p), 0, -0.1); this.guy.foreR.rotation.x = lerp(-1.2, 0, p);
      this.guy.spine.rotation.y = lerp(0, 0.4, p);
      this.headsetAt('handL'); const hp = this.headset.position.clone();
      this.headset.position.lerpVectors(from, hp, p);
    });
    const from2 = this.headset.position.clone();
    await D.tween(0.5, p => { this.pose(1); this.guy.armL.rotation.set(-0.9, 0, 0.9); this.guy.spine.rotation.y = 0.4; this.headsetAt('stand', p, from2); });
    sfx.click();
    await D.tween(0.6, p => { this.pose(1); this.guy.armL.rotation.set(lerp(-0.9, 0, p), 0, lerp(0.9, 0.1, p)); this.guy.spine.rotation.y = lerp(0.4, 0, p); });
    if (final) { note('MetaShift Payout', 'Earnings transferred. Rent: covered.'); await D.wait(3.2); }
    else { if (balance) note('MetaShift Pay', balance); await D.wait(2.2); }
    // light off
    await D.tween(0.6, p => { this.pose(1); this.guy.armL.rotation.set(lerp(0, -0.9, p), 0, lerp(0.1, 0.9, p)); this.guy.spine.rotation.y = lerp(0, 0.5, p); });
    sfx.click(); this.setTime(true, false, final ? '11:59' : '11:59');
    await D.tween(0.5, p => { this.pose(1); this.guy.armL.rotation.set(lerp(-0.9, 0, p), 0, lerp(0.9, 0.1, p)); this.guy.spine.rotation.y = lerp(0.5, 0, p); });
    // lie down
    await D.tween(1.8, p => { this.pose(1 - p); this.camTarget.set(-1.7, lerp(1.3, 0.7, p), -0.9); });
    this.guy.setExpr('closed');
    await D.wait(final ? 3.0 : 1.6);
  }
}

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
