/* One audio owner: persistent categories, procedural beds, spatial SFX and voice. */
(function(root) {
  const key = 'void-runner-audio-v1',
    defaults = {
      master: .6,
      music: .45,
      effects: .45,
      voice: .8,
      voiceEnabled: true,
      enabled: true
    };
  const content = typeof module !== 'undefined' ? require('./story-content.js') : root.VoidStoryContent,
    profiles = content.voices;
  const musicProfiles = {
    menu: {
      root: 55,
      chord: [1, 1.5, 1.189],
      pulse: .7,
      wave: 'sine',
      ambient: 31
    },
    flight: {
      root: 49,
      chord: [1, 1.5, 2],
      pulse: .45,
      wave: 'sine',
      ambient: 26
    },
    meridian: {
      root: 65.4,
      chord: [1, 1.25, 1.5],
      pulse: 1,
      wave: 'triangle',
      ambient: 40
    },
    undertow: {
      root: 46.25,
      chord: [1, 1.189, 1.5],
      pulse: 1.3,
      wave: 'sawtooth',
      ambient: 29
    },
    kepler: {
      root: 55,
      chord: [1, 1.5, 2],
      pulse: 1.15,
      wave: 'triangle',
      ambient: 45
    },
    foundry: {
      root: 36.7,
      chord: [1, 1.5, 2],
      pulse: .8,
      wave: 'sawtooth',
      ambient: 24
    },
    bar: {
      root: 55,
      chord: [1, 1.189, 1.5],
      pulse: .55,
      wave: 'sine',
      ambient: 38
    }
  };
  const effects = {
    laser: [620, .08, 'sawtooth', .035],
    enemyFire: [390, .12, 'triangle', .035],
    missile: [160, .5, 'sawtooth', .07],
    shield: [260, .15, 'triangle', .04],
    hull: [55, .22, 'square', .035],
    lock: [660, .15, 'sine', .025],
    warning: [150, .2, 'triangle', .025],
    charge: [90, .5, 'triangle', .03],
    warp: [260, .7, 'sawtooth', .035],
    exit: [180, .4, 'triangle', .03],
    explosion: [65, .8, 'sawtooth', .15],
    dock: [70, .5, 'triangle', .06],
    door: [120, .16, 'triangle', .02],
    cycle: [380, .06, 'sine', .015],
    dry: [85, .09, 'triangle', .02],
    confirm: [520, .08, 'sine', .015],
    boost: [120, .35, 'sawtooth', .035]
  };

  function clean(raw) {
    const s = {
      ...defaults
    };
    for (const k of ['master', 'music', 'effects', 'voice'])
      if (Number.isFinite(raw?.[k])) s[k] = Math.max(0, Math.min(1, raw[k]));
    for (const k of ['enabled', 'voiceEnabled'])
      if (typeof raw?.[k] === 'boolean') s[k] = raw[k];
    return s;
  }
  let settings = {
    ...defaults
  };
  try {
    const old = JSON.parse(root.localStorage?.getItem(key) || 'null');
    settings = clean(old);
    if (old?.voiceEnabled === false) settings.voice = 0;
    if (settings.master === 0) {
      settings.enabled = false;
      settings.master = defaults.master;
    }
  } catch {}
  let context, buses, engine, engineGain, sub, subGain, bed, ambient, tension, speaking = false,
    speechTimer, token = 0,
    activated = false,
    voiceProvider = null,
    profile = 'menu',
    combat = false,
    danger = false,
    beat = 0,
    voices = [];

  function target(param, value, seconds = .2) {
    param?.setTargetAtTime(value, context.currentTime, seconds);
  }

  function mix() {
    if (!context) return;
    target(buses.master.gain, settings.enabled ? settings.master : 0, .05);
    target(buses.music.gain, settings.music * (speaking ? .4 : 1));
    target(buses.effects.gain, settings.effects);
    target(buses.voice.gain, settings.voice);
  }

  function cancel() {
    token++;
    speaking = false;
    clearTimeout(speechTimer);
    try {
      root.speechSynthesis?.cancel();
      voiceProvider?.cancel?.();
    } catch {}
    mix();
  }

  function set(values) {
    if (values.voice !== undefined && values.voice !== settings.voice) cancel();
    settings = clean({
      ...settings,
      ...values
    });
    try {
      root.localStorage?.setItem(key, JSON.stringify(settings));
    } catch {}
    if (!settings.voiceEnabled || !settings.enabled || !settings.voice) cancel();
    mix();
    return settings;
  }

  function ensureContext() {
    if (!settings.enabled || !activated) return;
    try {
      const Audio = root.AudioContext || root.webkitAudioContext;
      if (!Audio) return;
      if (!context) {
        context = new Audio();
        buses = {};
        for (const id of ['master', 'music', 'effects', 'voice']) buses[id] = context.createGain();
        buses.master.connect(context.destination);
        for (const id of ['music', 'effects', 'voice']) buses[id].connect(buses.master);
        mix();
      }
    } catch {
      context = null;
    }
  }

  function unlock() {
    activated = true;
    ensureContext();
    try {
      if (context?.state === 'suspended') context.resume()?.catch(() => {});
    } catch {}
  }

  function spatial(position, basis) {
    if (!position) return {
      volume: 1,
      pan: 0
    };
    const distance = Math.hypot(position.x || 0, position.y || 0, position.z || 0),
      right = basis?.r || {
        x: 1,
        y: 0,
        z: 0
      };
    return {
      volume: distance >= 2000 ? 0 : 1 / (1 + (distance / 120) ** 2),
      pan: distance ? Math.max(-.8, Math.min(.8, ((position.x || 0) * right.x + (position.y || 0) * right
        .y + (position.z || 0) * right.z) / distance)) * .8 : 0
    };
  }

  function tone(freq, duration, type = 'sine', volume = .025, position = null, basis = null, category =
    'effects') {
    ensureContext();
    if (!settings.enabled || !context || context.state !== 'running') return;
    try {
      const attenuation = spatial(position, basis);
      if (attenuation.volume < .001) return;
      const o = context.createOscillator(),
        g = context.createGain(),
        pan = context.createStereoPanner?.(),
        now = context.currentTime;
      o.type = type;
      o.frequency.setValueAtTime(freq, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * .45), now + duration);
      g.gain.setValueAtTime(.00001, now);
      g.gain.exponentialRampToValueAtTime(Math.max(.00001, volume * attenuation.volume), now + .012);
      g.gain.exponentialRampToValueAtTime(.00001, now + duration);
      o.connect(g);
      if (pan) {
        pan.pan.value = attenuation.pan;
        g.connect(pan);
        pan.connect(buses[category]);
      } else g.connect(buses[category]);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
        pan?.disconnect();
      };
      o.start();
      o.stop(now + duration);
    } catch {}
  }
  let noiseBuffer;

  function noise(duration, volume, position, basis) {
    if (!context || context.state !== 'running' || !settings.enabled) return;
    try {
      if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let seed = 7123;
        for (let i = 0; i < data.length; i++) {
          seed = seed * 16807 % 2147483647;
          data[i] = (seed / 2147483647 * 2 - 1) * .6;
        }
      }
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        gain = context.createGain(),
        pan = context.createStereoPanner?.(),
        s = spatial(position, basis),
        now = context.currentTime;
      source.buffer = noiseBuffer;
      source.loop = true;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + duration);
      gain.gain.setValueAtTime(Math.max(.00001, volume * s.volume), now);
      gain.gain.exponentialRampToValueAtTime(.00001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      if (pan) {
        pan.pan.value = s.pan;
        gain.connect(pan);
        pan.connect(buses.effects);
      } else gain.connect(buses.effects);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        pan?.disconnect();
      };
      source.start();
      source.stop(now + duration);
    } catch {}
  }

  function event(name, ship, position, basis) {
    if (effects[name]) tone(...effects[name], position, basis);
    if (['explosion', 'missile', 'hull', 'dock', 'boost', 'door'].includes(name)) noise(name ===
      'explosion' ? 1 : .35, name === 'explosion' ? .22 : .06, position, basis);
  }

  function oscillator(wave, freq, bus, level = 0) {
    const o = context.createOscillator(),
      g = context.createGain(),
      filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    g.gain.value = level;
    o.type = wave;
    o.frequency.value = freq;
    o.connect(filter);
    filter.connect(g);
    g.connect(buses[bus]);
    o.start();
    return {
      o,
      g,
      filter
    };
  }

  function scene(name, urgent = false, lowHealth = false) {
    profile = musicProfiles[name] ? name : 'flight';
    combat = urgent;
    danger = lowHealth;
  }

  let mediaPlaying = false;
  function tick(dt) {
    ensureContext();
    if (!context || context.state !== 'running') return;
    mix();
    const p = musicProfiles[profile];
    if (!bed) {
      bed = p.chord.map(n => oscillator(p.wave, p.root * n, 'music'));
      ambient = oscillator('triangle', p.ambient, 'effects');
      tension = oscillator('sine', p.root * 2.01, 'music');
    }
    bed.forEach((v, i) => {
      v.o.type = p.wave;
      target(v.o.frequency, p.root * p.chord[i], 1.5);
      target(v.g.gain, mediaPlaying ? 0 : (i ? .012 : .018) * (profile === 'bar' ? .65 : 1), 1.2);
      target(v.filter.frequency, profile === 'bar' ? 180 : p.wave === 'sawtooth' ? 260 : 600, 1);
    });
    target(ambient.o.frequency, p.ambient, 1.5);
    target(ambient.g.gain, profile === 'menu' ? 0 : profile === 'flight' ? .003 : .008, 1.2);
    target(tension.g.gain, !mediaPlaying && (combat || danger) ? (danger ? .012 : .007) : 0, 1);
    target(tension.o.frequency, p.root * (danger ? 2.12 : 2.01), 1);
    beat -= Math.min(.2, dt);
    if (beat <= 0) {
      beat = 1 / (p.pulse * (combat ? 2 : 1));
      if (!mediaPlaying) tone(p.root * 4, .45, 'sine', combat ? .028 : .01, null, null, 'music');
      if (combat && !mediaPlaying) tone(54, .15, 'triangle', .025, null, null, 'music');
      if (danger) tone(220, .18, 'sine', .012);
    }
  }

  function update(ship, throttle, turn, phase, active) {
    ensureContext();
    if (!context || context.state !== 'running') return;
    if (!engine) {
      const a = oscillator('sine', 42, 'effects'),
        b = oscillator('sine', 21, 'effects');
      engine = a.o;
      engineGain = a.g;
      sub = b.o;
      subGain = b.g;
    }
    const p = ship?.audio || {
      frequency: 42,
      wave: 'sine',
      roughness: .2
    };
    engine.type = p.wave;
    target(engine.frequency, p.frequency * (1 + throttle * .8 + turn * .12) * (phase === 'warp' ? 2.2 : 1),
      .12);
    target(sub.frequency, p.frequency * .51, .2);
    const v = active ? (.008 + throttle * .012) * (speaking ? .3 : 1) : 0;
    target(engineGain.gain, v, .12);
    target(subGain.gain, v * p.roughness, .12);
  }

  function refreshVoices() {
    try {
      voices = (root.speechSynthesis?.getVoices() || []).filter(v => /^en(?:-|_)/i.test(v.lang)).sort((a,
        b) => a.name.localeCompare(b.name));
    } catch {
      voices = [];
    }
  }
  root.speechSynthesis?.addEventListener?.('voiceschanged', refreshVoices);
  refreshVoices();

  function speak(id, text) {
    cancel();
    if (!settings.enabled || !settings.voiceEnabled || !settings.voice) return false;
    const p = profiles[content.characters[id]?.voiceProfile || id] || profiles.rook;
    if (voiceProvider) {
      try {
        speaking = true;
        mix();
        const current = token;
        Promise.resolve(voiceProvider.speak({
          characterId: id,
          text,
          profile: p,
          volume: settings.master * settings.voice,
          bus: buses?.voice
        })).catch(() => {}).finally(() => {
          if (token === current) {
            speaking = false;
            mix();
          }
        });
        return true;
      } catch {
        speaking = false;
        return false;
      }
    }
    if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) return false;
    try {
      refreshVoices();
      const u = new root.SpeechSynthesisUtterance(text),
        pool = voices.filter(v => v.localService).length ? voices.filter(v => v.localService) : voices;
      u.voice = pool.find(v => v.voiceURI === p.voiceId || v.name === p.voiceId) || pool[(p.variant || 0) %
        pool.length] || null;
      u.lang = u.voice?.lang || 'en-US';
      u.pitch = p.pitch;
      u.rate = p.rate;
      u.volume = settings.master * settings.voice * p.volume;
      speaking = true;
      mix();
      const current = token;
      u.onend = u.onerror = () => {
        if (current === token) {
          speaking = false;
          clearTimeout(speechTimer);
          mix();
        }
      };
      root.speechSynthesis.speak(u);
      speechTimer = setTimeout(() => {
        if (current === token) cancel();
      }, Math.min(45000, 5000 + text.length * 100));
      return true;
    } catch {
      speaking = false;
      return false;
    }
  }

  function suspend() {
    cancel();
    try {
      context?.suspend()?.catch(() => {});
    } catch {}
  }
  const api = {
    get ready() { return !!context && context.state === 'running'; },
    mediaActive(value) { mediaPlaying = value === true; },
    // Locally hosted tracks share the gesture gate, master/category gain and pause lifecycle.
    connectMedia(element, category = 'music') {
      ensureContext();
      if (!context || !buses[category]) return null;
      const source = context.createMediaElementSource(element), gain = context.createGain();
      source.connect(gain); gain.connect(buses[category]);
      return {gain, context, dispose(){source.disconnect();gain.disconnect();}};
    },
    defaults,
    profiles,
    musicProfiles,
    effects,
    clean,
    spatial,
    get settings() {
      return settings;
    },
    set,
    unlock,
    tone,
    event,
    scene,
    tick,
    update,
    speak,
    cancel,
    suspend,
    setVoiceProvider(provider) {
      cancel();
      voiceProvider = provider;
    }
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidAudio = api;
})(globalThis);
