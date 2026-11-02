/* Sleeping Pod: occasional first-person exhaled smoke.
 *
 * Desktop: one full-screen WebGL fragment shader (domain-warped fbm) rendered at reduced resolution, only while an exhalation is visible.
 * That path is unchanged. Around it:
 *   - If WebGL is missing, fails to compile, is lost, or "works" but draws nothing (a driver fault the page cannot otherwise see), the smoke is
 *     drawn by a lightweight Canvas 2D version of the same plume (soft sprites, no shader) instead of being switched off.
 *   - On phones the plume is drawn at 30 frames a second, not at the screen's 90 or 120, which saves battery and heat; it is a slow plume.
 *   - With the reduced-motion setting on, nothing moves: one still, soft haze fades in and out (opacity only, no frame loop).
 *   - A page restored from the back/forward cache starts again (it used to stay dead until reloaded).
 *   - While the Iris chat window is open on a phone, where it covers the screen, a new plume waits; it starts again when the window closes.
 * Decorative. ?smokedebug (add &force to ignore reduced motion, &renderer=2d to force the Canvas 2D version) shows what it is doing. */
(function () {
  'use strict';
  var canvas = document.getElementById('podSmoke');
  if (!canvas) return;

  var VERT = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'varying vec2 vUv;',
    'uniform vec2 uRes,uSeed;uniform float uAge,uDur,uDrift,uSize,uTwist;',
    'float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'const mat2 R=mat2(.8,.6,-.6,.8);',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=R*p*2.03+vec2(7.1,3.7);a*=.5;}return v;}',
    'void main(){',
    ' float asp=uRes.x/uRes.y,a=uAge,life=a/uDur;',
    ' float amp=smoothstep(0.,2.,a)*(1.-smoothstep(.5,1.,life));',
    ' if(amp<=.001){gl_FragColor=vec4(0.);return;}',
    // Plume geometry: wide soft region centred low on screen, rising and widening as it recedes.
    ' float cy=.04+.62*(1.-exp(-a*.4));',
    ' float rx=(.24+.24*pow(life,.7))*uSize;float ry=(.26+.3*life)*uSize;',
    ' float xn=vUv.x-.5-uDrift*life;',
    ' float ex=exp(-pow(abs(xn/rx),2.3));',
    ' float ey=vUv.y<cy?1.:exp(-pow((vUv.y-cy)/ry,2.));',
    ' float env=ex*ey;',
    ' vec2 p=vec2(vUv.x*asp,vUv.y),c=vec2((.5+uDrift*life)*asp,cy);',
    ' vec2 d=p-c;float rr=length(d);float ang=uTwist*sin(a*.45+uSeed.x)*exp(-rr*1.6);',
    ' d=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*d;',
    ' vec2 q=(c+d)*2.7/(1.+.07*a)+uSeed;',
    ' q.y-=a*.3;',
    ' vec2 w=vec2(fbm(q*.8+vec2(0.,-a*.07)),fbm(q*.8+vec2(5.2,1.3)+vec2(a*.05,0.)));',
    ' float n=fbm(q+3.4*(w-.5));',
    ' float big=fbm(q*.42+w);',
    ' float field=mix(n,big,.45);',
    ' float dens=smoothstep(.2,.5,field*1.6*env+env*.1);',
    ' float shade=clamp(dens*.55+(big-n)*.7+.12,0.,1.);',
    ' vec3 col=mix(vec3(.96,.91,.97),vec3(.5,.45,.62),shade);',
    ' float al=dens*amp*.85;',
    ' al+=(hash(gl_FragCoord.xy)-.5)/255.;',
    ' al=clamp(al,0.,1.);',
    ' gl_FragColor=vec4(col*al,al);',
    '}'
  ].join('\n');

  var params = new URLSearchParams(location.search);
  var debug = params.has('smokedebug'), force = debug && params.has('force');
  var force2d = debug && params.get('renderer') === '2d';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var phoneMq = window.matchMedia ? window.matchMedia('(max-width: 720px), (pointer: coarse)') : { matches: false };
  var gl = null, prog = null, buf = null, uni = {}, webglBroken = false;
  var canvas2d = null, ctx2d = null, sprites = null;
  var raf = 0, timer = 0, stillTimers = [], state = null, first = true, last = 0, lastDraw = 0, slow = 0, quality = 1;
  var verified = false, checks = 0, chatOpen = false, intentionalLoss = false;
  var renderer = 'none'; // which drawing path the current or last plume used: webgl | 2d | still

  function rand(a, b) { return a + Math.random() * (b - a); }
  function reduced() { return mq.matches && !force; }
  function phone() { return phoneMq.matches; }

  // ---------------------------------------------------------------------------------------------- diagnostics (?smokedebug)
  var hud = null, frames = 0, fpsAt = 0, fps = 0, lastReason = 'idle', glInfo = '', lastAlpha = -1;
  function note(msg) { lastReason = msg; if (debug) console.info('[podSmoke] ' + msg); }
  function report() {
    if (!debug) return;
    if (!hud) {
      hud = document.createElement('pre');
      hud.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2000;margin:0;padding:6px 8px;background:rgba(0,0,0,.75);color:#7dffb0;font:11px/1.35 monospace;pointer-events:none;white-space:pre';
      document.body.appendChild(hud);
    }
    var shown = visibleCanvas();
    var rect = shown.getBoundingClientRect();
    hud.textContent = [
      'podSmoke debug (X = exhale now)',
      'renderer: ' + renderer + (webglBroken ? ' (WebGL failed, using Canvas 2D)' : ''),
      'webgl: ' + (gl ? 'ok ' + glInfo : webglBroken ? 'FAILED' : 'not started'),
      'reduced-motion: ' + mq.matches + (force ? ' (forced off)' : ''),
      'phone layout: ' + phone() + '  chat open: ' + chatOpen,
      'hidden: ' + document.hidden + '  quality: ' + quality.toFixed(2),
      'canvas: ' + shown.width + 'x' + shown.height + ' display=' + shown.style.display + ' opacity=' + (shown.style.opacity || '1'),
      'in viewport: ' + (rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight),
      'running: ' + !!state + (state ? '  age ' + state.age.toFixed(1) + '/' + state.dur.toFixed(1) + 's  fps ' + fps : '') + '  pixels drawn: ' + (lastAlpha < 0 ? 'not checked' : lastAlpha > 0 ? 'yes' : 'NO'),
      'next exhale timer: ' + (timer ? 'armed' : 'none'),
      'last: ' + lastReason
    ].join('\n');
  }
  if (debug) setInterval(report, 250);
  function visibleCanvas() { return renderer === '2d' || renderer === 'still' ? (canvas2d || canvas) : canvas; }

  // ---------------------------------------------------------------------------------------------- WebGL (desktop path, unchanged)
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  function init() {
    if (gl) return true;
    if (webglBroken || force2d) return false;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    if (!gl) { webglBroken = true; note('WebGL unavailable: using Canvas 2D'); return false; }
    try { var dbg = gl.getExtension('WEBGL_debug_renderer_info'); glInfo = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { glInfo = ''; }
    var v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) { teardown(); webglBroken = true; note('shader compile failed: using Canvas 2D'); return false; }
    prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { teardown(); webglBroken = true; note('shader link failed: using Canvas 2D'); return false; }
    gl.useProgram(prog);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uSeed', 'uAge', 'uDur', 'uDrift', 'uSize', 'uTwist'].forEach(function (n) { uni[n] = gl.getUniformLocation(prog, n); });
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  function teardown() {
    if (!gl) return;
    try {
      if (prog) gl.deleteProgram(prog);
      if (buf) gl.deleteBuffer(buf);
      var ext = gl.getExtension('WEBGL_lose_context');
      if (ext) { intentionalLoss = true; ext.loseContext(); } // our own tidy-up also fires the lost event: it is not a fault
    } catch (e) { /* already gone */ }
    gl = prog = buf = null;
  }

  // A driver can hand back a working context that draws nothing. Read a grid of pixels straight after a frame in which the plume is dense; if
  // every one is empty several times in a row, WebGL is not showing anything on this device and the Canvas 2D version takes over.
  var probe = new Uint8Array(4);
  function drewSomething() {
    for (var yi = 1; yi <= 5; yi++) for (var xi = 1; xi <= 5; xi++) {
      gl.readPixels(Math.floor(canvas.width * (0.25 + xi * 0.08)), Math.floor(canvas.height * (0.12 + yi * 0.09)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probe);
      if (probe[3] > 0) return true;
    }
    return false;
  }

  function sizeCanvas(target) {
    var cw = window.innerWidth, ch = window.innerHeight;
    var f = Math.min(0.4, Math.sqrt(300000 / Math.max(1, cw * ch))) * quality;
    target.width = Math.max(96, Math.round(cw * f));
    target.height = Math.max(96, Math.round(ch * f));
  }

  function resize() {
    sizeCanvas(renderer === '2d' || renderer === 'still' ? canvas2d : canvas);
    if (gl && renderer === 'webgl') gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // ---------------------------------------------------------------------------------------------- Canvas 2D (lightweight path and fallback)
  function makeSprite(light) {
    var s = document.createElement('canvas'); s.width = s.height = 64;
    var c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (light) { g.addColorStop(0, 'rgba(246,235,249,0.80)'); g.addColorStop(0.45, 'rgba(226,210,238,0.42)'); g.addColorStop(1, 'rgba(200,185,220,0)'); }
    else { g.addColorStop(0, 'rgba(160,145,190,0.70)'); g.addColorStop(0.45, 'rgba(128,115,158,0.36)'); g.addColorStop(1, 'rgba(110,98,140,0)'); }
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    return s;
  }

  // The second canvas: a canvas that has given out a WebGL context can never give out a 2D one, so the 2D version has its own element, made the first time it is needed
  function use2d() {
    if (!canvas2d) {
      canvas2d = canvas.cloneNode(false);
      canvas2d.id = 'podSmoke2d';
      canvas2d.style.display = 'none';
      canvas.parentNode.insertBefore(canvas2d, canvas.nextSibling);
      canvas2d.style.filter = canvas.style.filter; // the page's "dim the lights" filter
    }
    if (!ctx2d) ctx2d = canvas2d.getContext('2d');
    if (!ctx2d) return false;
    if (!sprites) sprites = [makeSprite(true), makeSprite(false)];
    return true;
  }

  function makePuffs() {
    var puffs = [];
    for (var i = 0; i < 26; i++) {
      puffs.push({ ox: rand(-0.16, 0.16), lift: rand(0.55, 1.15), r0: rand(0.08, 0.15), delay: rand(0, 1.8), wob: rand(0, 6.28), wobAmp: rand(0.008, 0.035), dark: Math.random() < 0.38 });
    }
    return puffs;
  }
  function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  // The same plume as the shader, as soft overlapping puffs: it rises and widens as it recedes and fades out in the second half of its life
  function draw2d(st, age) {
    var w = canvas2d.width, h = canvas2d.height, life = age / st.dur;
    var amp = smooth(0, 2, age) * (1 - smooth(0.5, 1, life));
    ctx2d.clearRect(0, 0, w, h);
    if (amp <= 0.001) return;
    var cy = 0.04 + 0.62 * (1 - Math.exp(-age * 0.4));
    var spread = (0.5 + 0.5 * Math.pow(life, 0.7)) * st.size;
    for (var i = 0; i < st.puffs.length; i++) {
      var p = st.puffs[i], pa = age - p.delay;
      if (pa <= 0) continue;
      var x = 0.5 + st.drift * life + p.ox * spread + Math.sin(age * 0.5 + p.wob) * p.wobAmp;
      var y = 0.04 + (cy - 0.04) * p.lift + 0.05 * Math.min(1, pa / 3) + 0.04 * life; // fraction of the height, from the bottom
      var r = (0.17 + p.r0 + 0.16 * Math.pow(life, 0.7)) * w * st.size;
      ctx2d.globalAlpha = Math.min(0.5, amp * smooth(0, 1.4, pa) * (p.dark ? 0.34 : 0.4));
      ctx2d.drawImage(sprites[p.dark ? 1 : 0], x * w - r, (1 - y) * h - r, r * 2, r * 2);
    }
    ctx2d.globalAlpha = 1;
    // Read straight back only when something is watching (the diagnostics and the tests); the plume itself never reads pixels
    if (debug) { var d = ctx2d.getImageData(Math.floor(w * 0.3), Math.floor(h * 0.3), Math.max(1, Math.floor(w * 0.4)), Math.max(1, Math.floor(h * 0.4))).data, m = 0; for (var k = 3; k < d.length; k += 4) if (d[k] > m) m = d[k]; lastAlpha = m; }
  }

  // ---------------------------------------------------------------------------------------------- the exhale
  function stopFrames() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function stopTimer() { if (timer) clearTimeout(timer); timer = 0; }
  function stopStill() { stillTimers.forEach(clearTimeout); stillTimers = []; }

  function hideAll() {
    canvas.style.display = 'none';
    if (canvas2d) { canvas2d.style.display = 'none'; canvas2d.style.opacity = ''; canvas2d.style.transition = ''; }
  }

  function endExhale() {
    stopFrames(); stopStill(); state = null;
    hideAll();
    if (gl) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    note('exhale finished');
    schedule();
  }

  function schedule(delaySeconds) {
    stopTimer();
    if (document.hidden) { note('paused: tab hidden'); return; }
    var delay = delaySeconds || (first ? rand(7, 13) : reduced() ? rand(30, 55) : rand(20, 40));
    timer = setTimeout(startExhale, delay * 1000);
    note('next exhale in ' + Math.round(delay) + 's' + (reduced() ? ' (reduced motion: a still haze, no movement)' : ''));
  }

  function newState() {
    return { age: 0, dur: rand(8.5, 11.5), seed: [rand(0, 9), rand(0, 9)], drift: rand(-0.08, 0.08), size: rand(0.88, 1.15), twist: rand(0.5, 1.1) * (Math.random() < 0.5 ? -1 : 1), puffs: makePuffs() };
  }

  function startExhale() {
    timer = 0; first = false;
    if (document.hidden) { schedule(); return; }
    // A phone's chat window covers the screen: a new plume waits until it is closed (a plume already running just finishes)
    if (chatOpen && phone()) { note('chat open: waiting'); schedule(6); return; }
    stopFrames(); stopStill();

    if (reduced()) { startStill(); return; }

    if (!force2d && init()) {
      renderer = 'webgl'; verified = false; checks = 0;
    } else if (use2d()) {
      renderer = '2d';
    } else { note('no drawing available'); schedule(30); return; }
    state = newState();
    resize();
    var shown = renderer === 'webgl' ? canvas : canvas2d;
    shown.style.display = 'block';
    last = performance.now(); lastDraw = 0; slow = 0; frames = 0; fpsAt = last; lastAlpha = -1;
    note('exhale started (' + renderer + ')');
    raf = requestAnimationFrame(frame);
  }

  // Reduced motion: nothing moves. One still, soft haze fades in and out (opacity only), with no frame loop at all.
  function startStill() {
    if (!use2d()) { schedule(30); return; }
    renderer = 'still';
    var st = newState(); st.dur = 10; // a settled moment of the plume
    state = { age: 0, dur: 6.5, still: true };
    sizeCanvas(canvas2d);
    draw2d(st, 3.6);
    canvas2d.style.transition = 'none'; canvas2d.style.opacity = '0'; canvas2d.style.display = 'block';
    void canvas2d.offsetWidth; // let the starting opacity take hold before it changes
    canvas2d.style.transition = 'opacity 3s ease-in-out, filter 1.5s ease';
    stillTimers.push(setTimeout(function () { canvas2d.style.opacity = '0.8'; }, 30));
    stillTimers.push(setTimeout(function () { canvas2d.style.opacity = '0'; }, 3300));
    stillTimers.push(setTimeout(endExhale, 6500));
    note('still haze (reduced motion)');
  }

  function frame(now) {
    raf = 0;
    if (!state) return;
    var raw = (now - last) / 1000;
    // On phones, draw at 30 frames a second: the plume is slow, and the screen may refresh at 90 or 120
    if (phone() && now - lastDraw < 30) { raf = requestAnimationFrame(frame); return; }
    lastDraw = now; last = now;
    frames++; if (now - fpsAt >= 1000) { fps = frames; frames = 0; fpsAt = now; }
    // Adaptive quality: slow GPUs get a smaller render target (the smoke is soft, so it still looks right).
    // Never switch the effect off because of speed: a slower, blurrier plume beats no plume.
    if (raw > 0.04) slow++; else if (slow > 0) slow--;
    if (slow > 12 && quality > 0.3) { slow = 0; quality *= 0.75; resize(); note('slow frames, quality ' + quality.toFixed(2)); }
    // Wall-clock aging keeps the exhale the same length even when frames are slow.
    state.age += Math.min(0.25, raw);
    if (state.age >= state.dur) { endExhale(); return; }

    if (renderer === '2d') {
      draw2d(state, state.age);
    } else {
      if (!gl) { raf = 0; return; }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uni.uRes, canvas.width, canvas.height);
      gl.uniform2f(uni.uSeed, state.seed[0], state.seed[1]);
      gl.uniform1f(uni.uAge, state.age); gl.uniform1f(uni.uDur, state.dur);
      gl.uniform1f(uni.uDrift, state.drift); gl.uniform1f(uni.uSize, state.size); gl.uniform1f(uni.uTwist, state.twist);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!verified && state.age > 2.2 && frames % 4 === 0) {
        if (drewSomething()) { verified = true; lastAlpha = 1; }
        else if (++checks >= 5) { switchTo2d(); return; }
      }
    }
    raf = requestAnimationFrame(frame);
  }

  // WebGL gave a context but no pixels: carry on with the same plume in Canvas 2D, and use that from now on
  function switchTo2d() {
    webglBroken = true; lastAlpha = 0;
    note('WebGL drew nothing on this device: continuing in Canvas 2D');
    teardown(); canvas.style.display = 'none';
    if (!use2d()) { abort(); return; }
    renderer = '2d';
    if (!state.puffs) state.puffs = makePuffs();
    sizeCanvas(canvas2d);
    canvas2d.style.display = 'block';
    last = performance.now(); lastDraw = 0;
    raf = requestAnimationFrame(frame);
  }

  function abort() { stopFrames(); stopTimer(); stopStill(); state = null; hideAll(); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopFrames(); stopTimer(); note('paused: tab hidden'); }
    else if (state && !state.still) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!state) schedule();
  });
  var onMotion = function () { abort(); first = true; schedule(); };
  if (mq.addEventListener) mq.addEventListener('change', onMotion); else if (mq.addListener) mq.addListener(onMotion);
  window.addEventListener('resize', function () { if (state && !state.still) resize(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (intentionalLoss) { intentionalLoss = false; return; } abort(); gl = prog = buf = null; note('WebGL context lost'); schedule(5); });
  canvas.addEventListener('webglcontextrestored', function () { gl = prog = buf = null; note('WebGL context restored'); schedule(); });
  window.addEventListener('pagehide', function () { abort(); teardown(); });
  // Coming back through the browser's back/forward cache: nothing reloaded, so nothing restarted by itself
  window.addEventListener('pageshow', function (e) { if (e.persisted) { gl = prog = buf = null; state = null; hideAll(); first = true; note('restored from the back/forward cache'); schedule(); } });

  // The Iris chat (iris-chat.js) says when its window opens and closes
  var chatBox = document.getElementById('chatContainer');
  chatOpen = Boolean(chatBox && chatBox.style.display === 'block');
  document.addEventListener('iris-chat-toggle', function (e) {
    var open = Boolean(e.detail && e.detail.open);
    chatOpen = open;
    note(open ? 'chat opened' : 'chat closed');
    if (!open && !state && !timer) schedule(4);
  });

  if (debug) {
    window.podSmoke = {
      exhale: function () { if (!state) { stopTimer(); startExhale(); } },
      state: function () { return { renderer: renderer, running: Boolean(state), age: state ? state.age : 0, webglBroken: webglBroken, hasGl: Boolean(gl), alpha: lastAlpha, timer: Boolean(timer), chatOpen: chatOpen, frames: frames, fps: fps, display: visibleCanvas().style.display, opacity: visibleCanvas().style.opacity, reason: lastReason }; }
    };
    document.addEventListener('keydown', function (e) { if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey && !e.altKey) window.podSmoke.exhale(); });
  }

  schedule();
})();
