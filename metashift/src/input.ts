// One input state, fed by keyboard, gamepad and on-screen touch controls.
export class Input {
  throttle = 0; brake = 0; steer = 0; horn = false;
  private keys = new Set<string>();
  private pressed = new Set<string>();
  touchSteer = 0; touchGas = false; touchBrake = false; touchHorn = false;
  touchUI: HTMLElement; wheelEl: HTMLElement; touchVisible = false;
  private padPrev: boolean[] = [];
  private kbSteer = 0;
  onAnyPress: (() => void) | null = null;

  constructor(root: HTMLElement) {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code); this.onAnyPress?.();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    // touch layer
    const ui = document.createElement('div'); ui.id = 'touch'; root.appendChild(ui); this.touchUI = ui;
    ui.innerHTML = `
      <div class="steer-zone" id="steerZone"><div class="wheel" id="wheel"><div class="spoke"></div><div class="spoke v"></div><div class="hubc"></div></div><div class="steer-hint">◀ drag to steer ▶</div></div>
      <div class="pedals"><div class="pedal brake" id="brakeBtn"><span>BRAKE</span><small>hold = reverse</small></div><div class="pedal gas" id="gasBtn"><span>GAS</span></div></div>
      <div class="hornbtn" id="hornBtn">HORN</div>`;
    this.wheelEl = ui.querySelector('#wheel') as HTMLElement;
    const zone = ui.querySelector('#steerZone') as HTMLElement;
    let sid = -1, sx = 0;
    zone.addEventListener('pointerdown', e => { sid = e.pointerId; sx = e.clientX; zone.setPointerCapture(e.pointerId); this.touchSteer = 0; e.preventDefault(); });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== sid) return;
      const range = Math.max(60, zone.clientWidth * 0.42);
      this.touchSteer = Math.max(-1, Math.min(1, (e.clientX - sx) / range));
    });
    const endS = (e: PointerEvent) => { if (e.pointerId === sid) { sid = -1; this.touchSteer = 0; } };
    zone.addEventListener('pointerup', endS); zone.addEventListener('pointercancel', endS);
    const hold = (id: string, set: (v: boolean) => void) => {
      const el = ui.querySelector(id) as HTMLElement;
      el.addEventListener('pointerdown', e => { set(true); el.classList.add('on'); el.setPointerCapture(e.pointerId); e.preventDefault(); });
      const up = () => { set(false); el.classList.remove('on'); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    };
    hold('#gasBtn', v => this.touchGas = v); hold('#brakeBtn', v => this.touchBrake = v); hold('#hornBtn', v => this.touchHorn = v);

    // show/hide the touch layer by the device in use
    const coarse = matchMedia('(pointer: coarse)').matches, fine = matchMedia('(any-pointer: fine)').matches;
    this.setTouch(navigator.maxTouchPoints > 0 && coarse && !fine);
    window.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') this.setTouch(true);
      else if (e.pointerType === 'mouse' && matchMedia('(any-pointer: fine)').matches) this.setTouch(false);
      this.onAnyPress?.();
    }, true);
  }

  setTouch(v: boolean) { this.touchVisible = v; document.body.classList.toggle('touchmode', v); }

  down(code: string) { return this.keys.has(code); }
  /** true once per key press */
  hit(...codes: string[]) { let r = false; for (const c of codes) if (this.pressed.has(c)) { this.pressed.delete(c); r = true; } return r; }
  clearPressed() { this.pressed.clear(); }

  update(dt: number) {
    const k = (a: string, b: string) => this.keys.has(a) || this.keys.has(b);
    let thr = k('KeyW', 'ArrowUp') ? 1 : 0, brk = k('KeyS', 'ArrowDown') ? 1 : 0;
    let kbs = (k('KeyD', 'ArrowRight') ? 1 : 0) - (k('KeyA', 'ArrowLeft') ? 1 : 0);
    // keyboard steering ramps like turning a wheel
    if (kbs !== 0) this.kbSteer = Math.max(-1, Math.min(1, this.kbSteer + kbs * dt * 2.2));
    else this.kbSteer -= Math.sign(this.kbSteer) * Math.min(Math.abs(this.kbSteer), dt * 3);
    let steer = this.kbSteer;
    let horn = this.keys.has('KeyH');
    // gamepad
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const ax = p.axes[0] || 0; if (Math.abs(ax) > 0.12) steer = ax;
      const rt = p.buttons[7]?.value || 0, lt = p.buttons[6]?.value || 0;
      thr = Math.max(thr, rt); brk = Math.max(brk, lt);
      if (p.buttons[12]?.pressed) thr = 1; if (p.buttons[13]?.pressed) brk = 1;
      if (p.buttons[1]?.pressed) horn = true;
      // edge-triggered buttons mapped to keys
      const map: [number, string][] = [[0, 'Enter'], [9, 'Escape'], [3, 'KeyR'], [8, 'KeyR'], [2, 'KeyX']];
      for (const [bi, code] of map) { const pr = !!p.buttons[bi]?.pressed; if (pr && !this.padPrev[bi]) { this.pressed.add(code); this.onAnyPress?.(); } this.padPrev[bi] = pr; }
      break;
    }
    if (this.touchGas) thr = 1; if (this.touchBrake) brk = 1;
    if (Math.abs(this.touchSteer) > 0.02) steer = this.touchSteer;
    if (this.touchHorn) horn = true;
    this.throttle = thr; this.brake = brk; this.steer = steer; this.horn = horn;
    this.wheelEl.style.transform = `rotate(${steer * 120}deg)`;
  }
}
