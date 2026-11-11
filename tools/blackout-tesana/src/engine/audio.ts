// Procedural Web Audio: sound effects, ambience beds and a light synth score.
let ctx: AudioContext | null = null;
let master: GainNode, sfxBus: GainNode, musBus: GainNode, ambBus: GainNode;
let noiseBuf: AudioBuffer;
export const audioState = { muted: false };

export function unlockAudio(): void {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = audioState.muted ? 0 : 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.22; musBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.35; ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
}
export function setMuted(m: boolean): void { audioState.muted = m; if (ctx) master.gain.value = m ? 0 : 0.8; }

function env(g: GainNode, t: number, a: number, peak: number, d: number): void {
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0, bus?: GainNode): void {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); env(g, t, 0.005, vol, dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur: number, vol: number, ftype: BiquadFilterType, f0: number, f1: number, delay = 0, q = 1, bus?: GainNode, attack = 0.005): void {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = ftype; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); env(g, t, attack, vol, dur);
  s.connect(f); f.connect(g); g.connect(bus || sfxBus);
  s.start(t, Math.random()); s.stop(t + dur + attack + 0.05);
}
const last: Record<string, number> = {};
export const sfxGate = { off: false };
export function sfx(name: string, vol = 1): void {
  if (sfxGate.off) return;
  if (!ctx || audioState.muted) return;
  const now = ctx.currentTime;
  if (last[name] && now - last[name] < 0.04) return;
  last[name] = now;
  const v = vol;
  switch (name) {
    case "jump": tone("square", 220, 520, 0.12, 0.12 * v); break;
    case "land": noise(0.08, 0.18 * v, "lowpass", 800, 200); break;
    case "step": noise(0.03, 0.05 * v, "bandpass", 1200, 700, 0, 2); break;
    case "shoot": tone("square", 1400, 300, 0.09, 0.12 * v); noise(0.06, 0.12 * v, "highpass", 3000, 1500); break;
    case "eshoot": tone("sawtooth", 700, 180, 0.14, 0.1 * v); break;
    case "emp": tone("sine", 90, 1800, 0.35, 0.3 * v); noise(0.5, 0.25 * v, "bandpass", 4000, 300, 0, 3); tone("square", 60, 40, 0.5, 0.15 * v); break;
    case "hit": tone("square", 300, 90, 0.1, 0.16 * v); noise(0.07, 0.15 * v, "lowpass", 3000, 500); break;
    case "hurt": tone("sawtooth", 400, 120, 0.22, 0.2 * v); noise(0.15, 0.15 * v, "bandpass", 1500, 400, 0, 2); break;
    case "die": tone("sawtooth", 500, 40, 0.9, 0.25 * v); noise(0.8, 0.2 * v, "lowpass", 2000, 100); break;
    case "coin": tone("square", 1318, 1318, 0.06, 0.08 * v); tone("square", 1760, 1760, 0.12, 0.08 * v, 0.06); break;
    case "shard": [880, 1108, 1318, 1760].forEach((f, i) => tone("triangle", f, f, 0.18, 0.15 * v, i * 0.07)); break;
    case "sync": [523, 659, 784, 1046, 1318].forEach((f, i) => tone("square", f, f, 0.2, 0.09 * v, i * 0.09)); break;
    case "beep": tone("square", 1200, 1200, 0.05, 0.07 * v); break;
    case "hackok": tone("square", 900, 1800, 0.08, 0.1 * v); break;
    case "hackbad": tone("sawtooth", 200, 120, 0.25, 0.15 * v); break;
    case "hackdone": [660, 880, 1320].forEach((f, i) => tone("square", f, f, 0.12, 0.1 * v, i * 0.08)); break;
    case "door": noise(0.6, 0.2 * v, "lowpass", 400, 150, 0, 1, undefined, 0.05); tone("sine", 80, 60, 0.6, 0.15 * v); break;
    case "elevator": tone("sawtooth", 55, 70, 1.2, 0.06 * v); noise(1.2, 0.08 * v, "lowpass", 300, 250, 0, 1, undefined, 0.2); break;
    case "ding": tone("sine", 1567, 1567, 0.4, 0.1 * v); tone("sine", 1244, 1244, 0.5, 0.08 * v, 0.15); break;
    case "hiss": noise(0.6, 0.12 * v, "highpass", 3000, 5000, 0, 1, undefined, 0.2); break;
    case "steam": noise(0.9, 0.25 * v, "highpass", 2000, 1200); break;
    case "spark": noise(0.12, 0.2 * v, "highpass", 5000, 2000); tone("square", 3000, 800, 0.05, 0.05 * v); break;
    case "zap": noise(0.4, 0.3 * v, "bandpass", 2500, 800, 0, 4); tone("sawtooth", 120, 60, 0.4, 0.12 * v); break;
    case "laser": tone("sine", 2000, 2400, 0.25, 0.05 * v); break;
    case "piston": noise(0.25, 0.4 * v, "lowpass", 600, 80); tone("sine", 70, 30, 0.3, 0.3 * v); break;
    case "rumble": noise(0.8, 0.25 * v, "lowpass", 200, 80, 0, 1, undefined, 0.1); break;
    case "crash": noise(0.5, 0.35 * v, "lowpass", 1500, 100); break;
    case "explode": noise(0.9, 0.45 * v, "lowpass", 2500, 60); tone("sine", 120, 30, 0.6, 0.3 * v); break;
    case "alarm": [0, 0.25].forEach((d) => tone("square", 880, 660, 0.22, 0.08 * v, d)); break;
    case "warn": tone("square", 520, 520, 0.08, 0.08 * v); tone("square", 520, 520, 0.08, 0.08 * v, 0.14); break;
    case "horn": tone("sawtooth", 233, 230, 0.9, 0.12 * v); tone("sawtooth", 293, 290, 0.9, 0.1 * v); break;
    case "train": noise(1.5, 0.4 * v, "lowpass", 900, 200, 0, 1, undefined, 0.2); break;
    case "servo": tone("square", 180, 260, 0.12, 0.04 * v); break;
    case "drone": tone("sawtooth", 140, 150, 0.2, 0.03 * v); break;
    case "steal": [900, 700, 500].forEach((f, i) => tone("square", f, f, 0.07, 0.09 * v, i * 0.06)); break;
    case "buy": [784, 1046, 1568].forEach((f, i) => tone("triangle", f, f, 0.15, 0.12 * v, i * 0.06)); break;
    case "deny": tone("square", 160, 140, 0.2, 0.1 * v); break;
    case "select": tone("square", 600, 900, 0.05, 0.06 * v); break;
    case "checkpoint": [523, 784, 1046].forEach((f, i) => tone("sine", f, f, 0.3, 0.14 * v, i * 0.1)); break;
    case "pickup": [440, 660, 880, 1320].forEach((f, i) => tone("square", f, f, 0.12, 0.1 * v, i * 0.08)); break;
    case "boss": tone("sawtooth", 60, 40, 1.4, 0.3 * v); noise(1.2, 0.2 * v, "lowpass", 500, 80); break;
    case "shield": tone("sine", 1200, 400, 0.2, 0.12 * v); break;
    case "fan": noise(0.4, 0.05 * v, "bandpass", 300, 250, 0, 3); break;
    case "victory": [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone("square", f, f, 0.2, 0.09 * v, i * 0.12)); break;
  }
}

// ---------- ambience + score ----------
export interface SoundTheme { drone: number; noiseF: number; noiseV: number; root: number; scale: number[]; bpm: number; arp: boolean; mood: number }
let ambNodes: AudioNode[] = [];
let seqTimer: number | null = null;
let current: SoundTheme | null = null;
export function playTheme(t: SoundTheme | null): void {
  stopTheme();
  current = t;
  if (!ctx || !t) return;
  const now = ctx.currentTime;
  const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = t.drone;
  const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = t.drone * 1.005;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220; lp.Q.value = 4;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 120;
  lfo.connect(lg); lg.connect(lp.frequency);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 2);
  o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(ambBus);
  const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = t.noiseF; nf.Q.value = 0.7;
  const ng = ctx.createGain(); ng.gain.value = t.noiseV;
  ns.connect(nf); nf.connect(ng); ng.connect(ambBus);
  o1.start(); o2.start(); lfo.start(); ns.start();
  ambNodes = [o1, o2, lfo, ns, g, ng];
  let step = 0; let nextT = ctx.currentTime + 0.1;
  const spb = 60 / t.bpm / 2;
  seqTimer = window.setInterval(() => {
    if (!ctx || !current) return;
    while (nextT < ctx.currentTime + 0.25) {
      seqStep(current, step, nextT, spb);
      step++; nextT += spb;
    }
  }, 80);
}
function note(f: number, t: number, dur: number, type: OscillatorType, vol: number, cutoff: number): void {
  if (!ctx) return;
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
  const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(musBus); o.start(t); o.stop(t + dur + 0.05);
}
function seqStep(t: SoundTheme, s: number, time: number, spb: number): void {
  const bar = Math.floor(s / 16) % 4;
  const prog = [0, 5, 3, 4][bar];
  const sc = t.scale; const deg = (d: number) => t.root * Math.pow(2, (sc[((d % sc.length) + sc.length) % sc.length] + 12 * Math.floor(d / sc.length)) / 12);
  const i = s % 16;
  if (i % 4 === 0 || (t.mood > 0.5 && i % 4 === 3)) note(deg(prog) / 2, time, spb * 1.6, "sawtooth", 0.22, 380);
  if (t.arp && i % 2 === 0) { const a = [0, 2, 4, 7, 4, 2, 0, 4][(i / 2) % 8]; note(deg(prog + a) * 2, time, spb * 1.2, "square", 0.05, 1800); }
  if (i === 0 && s % 32 === 0) note(deg(prog + 4) * 2, time, spb * 14, "triangle", 0.07, 1200);
  if (t.mood > 0.3 && (i === 4 || i === 12)) { noiseHit(time, 0.08); }
  if (i % 4 === 0) kick(time);
}
function kick(t: number): void {
  if (!ctx) return;
  const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(musBus); o.start(t); o.stop(t + 0.2);
}
function noiseHit(t: number, v: number): void {
  if (!ctx) return;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000;
  const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  s.connect(f); f.connect(g); g.connect(musBus); s.start(t, Math.random()); s.stop(t + 0.12);
}
export function stopTheme(): void {
  if (seqTimer !== null) { clearInterval(seqTimer); seqTimer = null; }
  for (const n of ambNodes) { try { (n as any).stop?.(); } catch { /* */ } try { n.disconnect(); } catch { /* */ } }
  ambNodes = []; current = null;
}
export function resumeThemeIfNeeded(t: SoundTheme | null): void { if (ctx && t && current !== t) playTheme(t); }
