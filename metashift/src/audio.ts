// All sound is synthesized: corporate jingle, SHIFT FM electro radio, engine, rain, sfx. Voices use the device's speech engine.
export class Audio {
  ctx: AudioContext | null = null;
  master!: GainNode; music!: GainNode; sfx!: GainNode; radioBus!: GainNode; radioFilter!: BiquadFilterNode;
  engOsc: OscillatorNode[] = []; engGain!: GainNode; engFilter!: BiquadFilterNode;
  rainGain!: GainNode; noiseBuf!: AudioBuffer;
  radioOn = true; radioPlaying = false; titleMode = false; private nextNote = 0; private seqStep = 0; private timer = 0;
  private radioLP!: BiquadFilterNode; private pump!: GainNode; private delaySend!: GainNode;
  voices: SpeechSynthesisVoice[] = [];

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(); this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    // music bus: track -> (cab speaker tone) -> glue compressor -> music
    this.radioFilter = ctx.createBiquadFilter(); this.radioFilter.type = 'highpass'; this.radioFilter.frequency.value = 90;
    this.radioLP = ctx.createBiquadFilter(); this.radioLP.type = 'lowpass'; this.radioLP.frequency.value = 7500;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.15;
    this.radioBus = ctx.createGain(); this.radioBus.gain.value = 0;
    this.radioBus.connect(this.radioFilter); this.radioFilter.connect(this.radioLP); this.radioLP.connect(comp);
    const makeup = ctx.createGain(); makeup.gain.value = 2.6; comp.connect(makeup); makeup.connect(this.music);
    // sidechain "pump" for bass + pads, ducked on every kick
    this.pump = ctx.createGain(); this.pump.connect(this.radioBus);
    // tempo-synced echo for arps & lead
    const dl = ctx.createDelay(1); dl.delayTime.value = (60 / 118) * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.34; const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2800;
    this.delaySend = ctx.createGain(); this.delaySend.gain.value = 0.3;
    this.delaySend.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(this.radioBus);
    // noise buffer
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    // engine
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    this.engFilter = ctx.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 400;
    for (const [type, mul] of [['sawtooth', 1], ['square', 0.5], ['sine', 2]] as const) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = 40 * mul; const g = ctx.createGain(); g.gain.value = type === 'sine' ? 0.4 : 0.25;
      o.connect(g); g.connect(this.engFilter); o.start(); this.engOsc.push(o);
    }
    this.engFilter.connect(this.engGain); this.engGain.connect(this.sfx);
    // rain
    const rs = ctx.createBufferSource(); rs.buffer = nb; rs.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 1200;
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
    rs.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(this.sfx); rs.start();
    this.timer = window.setInterval(() => this.schedule(), 60);
    const loadV = () => { this.voices = (window.speechSynthesis?.getVoices() || []).filter(v => /^en/i.test(v.lang)); };
    loadV(); if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadV;
    this.setRadio(this.radioPlaying, this.titleMode);
  }

  setEngine(rpm: number, load: number, on: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 34 + rpm * 46;
    this.engOsc[0].frequency.setTargetAtTime(f, t, 0.08);
    this.engOsc[1].frequency.setTargetAtTime(f * 0.5, t, 0.08);
    this.engOsc[2].frequency.setTargetAtTime(f * 2, t, 0.08);
    this.engFilter.frequency.setTargetAtTime(250 + load * 500 + rpm * 300, t, 0.1);
    this.engGain.gain.setTargetAtTime(on ? 0.16 + load * 0.12 : 0, t, 0.15);
  }
  setRain(v: number) { if (this.ctx) this.rainGain.gain.setTargetAtTime(v * 0.14, this.ctx.currentTime, 0.4); }
  /** playing: music on; title: full-range attract-mode mix (ignores the in-cab radio switch) */
  setRadio(playing: boolean, title = false) {
    this.radioPlaying = playing; this.titleMode = title;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const on = playing && (title || this.radioOn);
    if (on && this.seqIdle) { this.seqStep = 0; }
    this.radioBus.gain.setTargetAtTime(on ? (title ? 0.42 : 0.5) : 0, t, 0.08);
    this.radioLP.frequency.setTargetAtTime(title ? 16000 : 7500, t, 0.1);
  }
  private seqIdle = true;

  // ---- SHIFT FM: upbeat electro track (A minor, vi–IV–I–V, 118 bpm, 32-bar arrangement) ----
  private schedule() {
    const ctx = this.ctx; if (!ctx) return;
    if (!this.radioPlaying || !(this.radioOn || this.titleMode)) { this.nextNote = ctx.currentTime + 0.05; this.seqIdle = true; return; }
    this.seqIdle = false;
    const s16 = 60 / 118 / 4;
    if (this.nextNote < ctx.currentTime) this.nextNote = ctx.currentTime + 0.05;
    while (this.nextNote < ctx.currentTime + 0.3) {
      this.playStep(this.seqStep, this.nextNote, s16);
      this.nextNote += s16; this.seqStep = (this.seqStep + 1) % 512;
    }
  }
  private playStep(step: number, t: number, s16: number) {
    const bar = Math.floor(step / 16), s = step % 16, ch = bar % 4;
    const roots = [45, 41, 48, 43];
    const chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
    const LEAD = [
      [76, 0, 0, 76, 0, 74, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0],
      [72, 0, 0, 72, 0, 71, 72, 0, 74, 0, 72, 0, 69, 0, 0, 0],
      [72, 0, 0, 72, 0, 74, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0],
      [74, 0, 0, 0, 76, 0, 74, 0, 71, 0, 0, 0, 67, 0, 0, 0],
      [76, 0, 0, 76, 0, 74, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0],
      [72, 0, 0, 72, 0, 71, 72, 0, 74, 0, 72, 0, 69, 0, 0, 0],
      [76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 76, 0, 79, 0],
      [83, 0, 0, 81, 0, 79, 0, 0, 74, 0, 0, 0, 76, 0, 0, 0],
    ];
    // arrangement
    const intro = bar < 4, groove = bar >= 4, breakdown = bar >= 24 && bar < 28, drop = bar >= 28;
    const hasKick = groove && !breakdown, hasBass = bar >= 2 && !breakdown, hasArp = bar >= 8;
    const hasLead = (bar >= 16 && bar < 24) || breakdown || drop;
    const bus = this.radioBus;
    // crash at section starts
    if (s === 0 && (bar === 4 || bar === 8 || bar === 16 || bar === 28)) this.noise(t, 1.4, 0.07, bus, 'highpass', 6000);
    // kick + sidechain pump
    if (hasKick && s % 4 === 0) {
      this.kick(t, bus);
      this.pump.gain.setValueAtTime(0.25, t); this.pump.gain.linearRampToValueAtTime(1, t + s16 * 3.2);
    }
    // clap on 2 & 4
    if (hasKick && (s === 4 || s === 12)) this.clap(t, bus);
    // hats
    if (!intro || s % 2 === 0) {
      if (s % 4 === 2) this.noise(t, 0.16, breakdown ? 0.025 : 0.045, bus, 'highpass', 8000);
      else this.noise(t, 0.035, (s % 2 ? 0.03 : 0.018) * (breakdown ? 0.6 : 1), bus, 'highpass', 9500);
    }
    // breakdown riser
    if (bar === 27 && s === 0) this.riser(t, s16 * 16, bus);
    // pad (supersaw chord, held for the bar)
    if (s === 0) {
      const cut = intro ? 700 + bar * 250 : breakdown ? 2600 : 1700;
      for (const n of chords[ch]) for (const det of [-9, 0, 9]) this.voice(n, t, s16 * 16, 'sawtooth', breakdown ? 0.024 : 0.016, this.pump, cut, 0, det, 0.25, 0.4);
    }
    // rolling bass between the kicks
    if (hasBass && s % 4 !== 0) {
      const n = roots[ch] - 12 + (s % 4 === 2 ? 12 : 0);
      this.voice(n, t, s16 * 0.9, 'sawtooth', 0.11, this.pump, 380, 900, 0, 0.004, 0.03);
    }
    // plucky arpeggio
    if (hasArp && !(drop && s % 2 === 1)) {
      const c = chords[ch]; const tones = [c[0], c[1], c[2], c[0] + 12, c[1] + 12, c[2] + 12];
      const pat = [0, 2, 4, 5, 3, 1, 2, 4, 0, 2, 4, 5, 4, 2, 1, 3];
      const n = tones[pat[s]] + 12;
      const v = this.voice(n, t, s16 * 0.8, 'square', breakdown ? 0.035 : 0.026, bus, 900, 2600, 0, 0.003, 0.05);
      v.connect(this.delaySend);
    }
    // lead
    if (hasLead) {
      const row = LEAD[bar % 8]; const n = row[s];
      if (n) {
        let len = 1; while (s + len < 16 && row[s + len] === 0 && len < 6) len++;
        const vol = breakdown ? 0.04 : 0.055;
        const v1 = this.voice(n, t, s16 * len * 0.95, 'sawtooth', vol, bus, 1800, 2200, -6, 0.01, 0.12, true);
        const v2 = this.voice(n + 12, t, s16 * len * 0.95, 'square', vol * 0.35, bus, 2500, 1500, 6, 0.01, 0.12, true);
        v1.connect(this.delaySend); v2.connect(this.delaySend);
      }
    }
  }
  /** one synth note: osc -> envelope filter -> amp envelope; returns the amp node */
  private voice(midi: number, t: number, dur: number, type: OscillatorType, vol: number, out: AudioNode, cut: number, envAmt: number, detune = 0, atk = 0.005, rel = 0.08, vib = false) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); o.type = type;
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12); o.detune.value = detune;
    if (vib) { const l = ctx.createOscillator(); l.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(9, t + 0.25); l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + dur + rel + 0.05); }
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(cut + envAmt, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, cut), t + Math.min(dur, 0.18) + 0.02);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol, t + Math.max(atk, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(atk, dur) + rel);
    o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + Math.max(atk, dur) + rel + 0.05);
    return g;
  }
  private riser(t: number, dur: number, out: AudioNode) {
    const ctx = this.ctx!; const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
    src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.05);
  }
  private tone(midi: number, t: number, dur: number, type: OscillatorType, vol: number, out: AudioNode, lp = 4000, vib = false) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); o.type = type;
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    if (vib) { const l = ctx.createOscillator(); l.frequency.value = 5.5; const lg = ctx.createGain(); lg.gain.value = 4; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(t: number, dur: number, vol: number, out: AudioNode, type: BiquadFilterType, freq: number) {
    const ctx = this.ctx!; const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  private kick(t: number, out: AudioNode) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.34);
    this.noise(t, 0.012, 0.12, out, 'highpass', 3000); // click
  }
  private clap(t: number, out: AudioNode) {
    for (const d of [0, 0.011, 0.022]) this.noise(t + d, 0.02, 0.09, out, 'bandpass', 1500);
    this.noise(t + 0.03, 0.16, 0.1, out, 'bandpass', 1300);
  }

  // ---- jingle & sfx ----
  jingle() {
    const ctx = this.ctx; if (!ctx) return; const t = ctx.currentTime + 0.05;
    const seq = [[72, 0], [76, 0.14], [79, 0.28], [84, 0.42], [83, 0.7], [84, 0.84]];
    for (const [n, dt] of seq) { this.bell(n, t + dt, 0.9, 0.12); }
    for (const n of [60, 64, 67, 72, 76]) this.bell(n, t + 0.84, 2.2, 0.05);
    this.tone(48, t + 0.84, 1.6, 'sine', 0.2, this.music, 600);
  }
  private bell(midi: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx!; const f = 440 * Math.pow(2, (midi - 69) / 12);
    for (const [mul, v] of [[1, 1], [2.01, 0.35], [3.98, 0.12]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  crash() {
    const ctx = this.ctx; if (!ctx) return; const t = ctx.currentTime;
    this.noise(t, 0.5, 0.6, this.sfx, 'lowpass', 900); this.noise(t, 0.25, 0.3, this.sfx, 'bandpass', 3000);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.3);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.4);
  }
  horn(on: boolean) {
    const ctx = this.ctx; if (!ctx) return;
    if (on && !this.hornNodes) {
      const g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.12, ctx.currentTime, 0.02); g.connect(this.sfx);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.connect(g);
      const os = [233, 277, 349].map(fr => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
      this.hornNodes = { g, os };
    } else if (!on && this.hornNodes) {
      const h = this.hornNodes; this.hornNodes = null;
      h.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04); h.os.forEach(o => o.stop(ctx.currentTime + 0.3));
    }
  }
  private hornNodes: { g: GainNode; os: OscillatorNode[] } | null = null;
  hiss() { if (this.ctx) this.noise(this.ctx.currentTime, 0.6, 0.12, this.sfx, 'highpass', 3000); }
  ding() { if (!this.ctx) return; const t = this.ctx.currentTime; this.bell(84, t, 0.6, 0.1); this.bell(91, t + 0.1, 0.8, 0.08); }
  beep() { if (!this.ctx) return; const t = this.ctx.currentTime; for (let i = 0; i < 3; i++) this.tone(88, t + i * 0.22, 0.12, 'square', 0.05, this.sfx, 5000); }
  click() { if (this.ctx) this.noise(this.ctx.currentTime, 0.05, 0.25, this.sfx, 'bandpass', 2500); }
  thud() { if (this.ctx) this.noise(this.ctx.currentTime, 0.2, 0.4, this.sfx, 'lowpass', 300); }
  step() { if (this.ctx) this.noise(this.ctx.currentTime, 0.06, 0.08, this.sfx, 'lowpass', 600); }

  // ---- voices ----
  private bufs = new Map<string, Promise<AudioBuffer | null>>();
  private voiceSrc: AudioBufferSourceNode | null = null;
  preload(path: string) {
    if (!this.ctx || this.bufs.has(path)) return this.bufs.get(path) ?? Promise.resolve(null);
    const ctx = this.ctx;
    const p = fetch(path).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))).then(ab => new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(ab, res, rej))).catch(() => null);
    this.bufs.set(path, p); return p;
  }
  speak(text: string, who: 'driver' | 'system' | number, onEnd: () => void, file?: string) {
    if (file && this.ctx) {
      let done = false; const finish = () => { if (!done) { done = true; onEnd(); } };
      const est = 900 + text.length * 62;
      const guard = window.setTimeout(() => { if (!started) { done = true; this.speakSynth(text, who, onEnd); } }, 1800);
      let started = false;
      this.preload(file).then(buf => {
        if (done) return;
        if (!buf || !this.ctx) { window.clearTimeout(guard); done = true; this.speakSynth(text, who, onEnd); return; }
        started = true; window.clearTimeout(guard);
        this.hush();
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain(); g.gain.value = 1.15; src.connect(g); g.connect(this.sfx);
        src.onended = () => { if (this.voiceSrc === src) this.voiceSrc = null; window.setTimeout(finish, 120); };
        src.start(); this.voiceSrc = src;
        window.setTimeout(finish, buf.duration * 1000 + 1500);
      });
      void est;
      return;
    }
    this.speakSynth(text, who, onEnd);
  }
  private speakSynth(text: string, who: 'driver' | 'system' | number, onEnd: () => void) {
    const ss = window.speechSynthesis;
    let done = false; const finish = () => { if (!done) { done = true; onEnd(); } };
    const est = 900 + text.length * 62;
    window.setTimeout(finish, est + 2500);
    if (!ss || typeof SpeechSynthesisUtterance === 'undefined') { window.setTimeout(finish, est); return; }
    try {
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const vs = this.voices;
      if (who === 'driver') { u.pitch = 0.8; u.rate = 0.92; u.voice = pick(vs, /(daniel|alex|fred|male|guy|david|google uk english male|aaron|arthur)/i, 0); }
      else if (who === 'system') { u.pitch = 1.45; u.rate = 1.04; u.voice = pick(vs, /(samantha|female|zira|google us english|karen|moira|victoria)/i, 1); }
      else { const pitches = [1.15, 0.95, 1.25, 1.05, 0.9, 1.2, 1.3, 0.85, 1.1, 1.0]; u.pitch = pitches[who % 10]; u.rate = 0.98; if (vs.length) u.voice = vs[(who * 3 + 2) % vs.length]; }
      u.volume = 1; u.onend = () => window.setTimeout(finish, 150); u.onerror = () => window.setTimeout(finish, est);
      ss.speak(u);
    } catch { window.setTimeout(finish, est); }
  }
  hush() {
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
    if (this.voiceSrc) { try { this.voiceSrc.stop(); } catch { /* */ } this.voiceSrc = null; }
  }
}
function pick(vs: SpeechSynthesisVoice[], re: RegExp, fallback: number) {
  return vs.find(v => re.test(v.name)) || vs[Math.min(fallback, vs.length - 1)] || null;
}
