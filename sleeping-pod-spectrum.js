/* Sleeping Pod: real-time LED spectrum analyzer.
 * Reads genuine frequency data from the page's <audio> element through one AnalyserNode.
 * Nothing here is simulated: with no audio signal every column settles to zero. */
(function (root) {
  'use strict';

  var BANDS = 24, ROWS = 16;
  var F_LOW = 45, F_HIGH = 16000;
  var ATTACK_TAU = 0.04, RELEASE_TAU = 0.18; // seconds
  var PEAK_HOLD = 0.55, PEAK_FALL = 1.6;      // seconds, rows-of-height per second squared
  var GREEN_ROWS = 9, YELLOW_ROWS = 4;        // rows 0-8 green, 9-12 yellow, 13-15 red
  var COLORS = ['53,255,120', '255,226,74', '255,61,79'];

  function rowColor(r) { return COLORS[r < GREEN_ROWS ? 0 : r < GREEN_ROWS + YELLOW_ROWS ? 1 : 2]; }

  function createPodSpectrum(canvas, audio) {
    var g = canvas.getContext('2d');
    var ctx = null, analyser = null, data = null, failed = false;
    var ranges = [], levels = [], peaks = [], holds = [], velocities = [];
    var running = false, raf = 0, last = 0, w = 0, h = 0, dpr = 1;
    for (var i = 0; i < BANDS; i++) { levels.push(0); peaks.push(0); holds.push(0); velocities.push(0); }

    function sameOrigin() {
      try { return new URL(audio.currentSrc || audio.src, location.href).origin === location.origin; }
      catch (e) { return false; }
    }

    function buildBands() {
      var bw = ctx.sampleRate / analyser.fftSize, hi = Math.min(F_HIGH, ctx.sampleRate / 2 * 0.9);
      ranges = [];
      for (var b = 0; b < BANDS; b++) {
        var f0 = F_LOW * Math.pow(hi / F_LOW, b / BANDS), f1 = F_LOW * Math.pow(hi / F_LOW, (b + 1) / BANDS);
        var lo = Math.max(1, Math.floor(f0 / bw)), up = Math.max(lo + 1, Math.ceil(f1 / bw));
        ranges.push([lo, Math.min(up, analyser.frequencyBinCount)]);
      }
    }

    // Must run inside a user gesture (the Play click). Safe to call repeatedly.
    function connect() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(function () {}); return; }
      if (failed) return;
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC || !/^https?:$/.test(location.protocol) || !sameOrigin()) { failed = true; return; }
      try {
        ctx = new AC();
        var src = ctx.createMediaElementSource(audio);
        // Route to the speakers first, so playback can never go silent if the analyser fails.
        src.connect(ctx.destination);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.4;
        analyser.minDecibels = -88;
        analyser.maxDecibels = -18;
        src.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
        buildBands();
        ctx.addEventListener('statechange', function () {
          if (ctx.state === 'suspended' && !audio.paused) ctx.resume().catch(function () {});
        });
        if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      } catch (e) {
        failed = true; analyser = null;
      }
    }

    function resize() {
      dpr = Math.min(root.devicePixelRatio || 1, 2);
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      w = canvas.width = Math.round(cw * dpr);
      h = canvas.height = Math.round(ch * dpr);
      draw();
    }

    function sample(dt) {
      var live = analyser && !audio.paused && ctx.state === 'running';
      if (live) analyser.getByteFrequencyData(data);
      var ka = 1 - Math.exp(-dt / ATTACK_TAU), kr = 1 - Math.exp(-dt / RELEASE_TAU);
      for (var b = 0; b < BANDS; b++) {
        var target = 0;
        if (live) {
          var lo = ranges[b][0], hi = ranges[b][1], sum = 0, max = 0;
          for (var k = lo; k < hi; k++) { sum += data[k]; if (data[k] > max) max = data[k]; }
          var v = (0.5 * sum / (hi - lo) + 0.5 * max) / 255;
          // Mild treble tilt: music carries far less energy up high, so balance the columns.
          target = Math.min(1, Math.pow(v, 1.2) * (0.95 + 0.55 * b / (BANDS - 1)));
        }
        levels[b] += (target - levels[b]) * (target > levels[b] ? ka : kr);
        if (levels[b] < 0.002) levels[b] = 0;
        if (levels[b] >= peaks[b]) { peaks[b] = levels[b]; holds[b] = PEAK_HOLD; velocities[b] = 0; }
        else if (holds[b] > 0) holds[b] -= dt;
        else { velocities[b] += PEAK_FALL * dt; peaks[b] = Math.max(0, peaks[b] - velocities[b] * dt); }
      }
    }

    function draw() {
      if (!w) return;
      g.clearRect(0, 0, w, h);
      var pad = 3 * dpr, gap = 2 * dpr;
      var cw = (w - pad * 2) / BANDS, rh = (h - pad * 2) / ROWS;
      var segW = Math.max(1, cw - gap), segH = Math.max(1, rh - gap);
      for (var b = 0; b < BANDS; b++) {
        var x = pad + b * cw + gap / 2, lit = levels[b] * ROWS;
        var peakRow = Math.min(ROWS - 1, Math.floor(peaks[b] * ROWS));
        for (var r = 0; r < ROWS; r++) {
          var y = h - pad - (r + 1) * rh + gap / 2;
          var a = Math.max(0.12, Math.min(1, (lit - r) * 2));
          var color = rowColor(r);
          if (lit - r <= 0 && peaks[b] > 0.02 && r === peakRow) a = 0.95;
          g.fillStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
          g.fillRect(x, y, segW, segH);
        }
      }
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      if (!canvas.offsetParent || document.hidden) { running = false; return; }
      var dt = Math.min(0.1, (now - last) / 1000 || 0.016);
      last = now;
      sample(dt);
      draw();
      var settled = true;
      for (var b = 0; b < BANDS; b++) if (levels[b] > 0 || peaks[b] > 0.002) { settled = false; break; }
      if (settled && (audio.paused || !analyser)) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) return;
      running = true; last = performance.now();
      if (!w) resize();
      raf = requestAnimationFrame(frame);
    }

    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    ['play', 'playing', 'pause', 'ended'].forEach(function (ev) { audio.addEventListener(ev, function () {
      if (ev === 'play' && ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
      start();
    }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    if (root.ResizeObserver) new ResizeObserver(resize).observe(canvas); else root.addEventListener('resize', resize);
    draw();

    return { connect: connect, start: start, stop: stop };
  }

  root.createPodSpectrum = createPodSpectrum;
})(window);
