/* Sleeping Pod: occasional first-person exhaled smoke.
 * One full-screen WebGL fragment shader (domain-warped fbm) rendered at reduced resolution,
 * only while an exhalation is visible. Decorative: skipped for reduced motion or without WebGL. */
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

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var gl = null, prog = null, buf = null, uni = {}, disabled = false;
  var raf = 0, timer = 0, state = null, first = true, last = 0, slow = 0, quality = 1;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  function init() {
    if (gl) return true;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    if (!gl) { disabled = true; note('WebGL unavailable'); return false; }
    try { var dbg = gl.getExtension('WEBGL_debug_renderer_info'); glInfo = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { glInfo = ''; }
    var v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) { teardown(); disabled = true; note('shader compile failed'); return false; }
    prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { teardown(); disabled = true; note('shader link failed'); return false; }
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
      if (ext) ext.loseContext();
    } catch (e) { /* already gone */ }
    gl = prog = buf = null;
  }

  // Developer diagnostics: only active with ?smokedebug in the URL (add &force to ignore reduced motion).
  // Shows a status panel, logs to the console and exposes window.podSmoke.exhale(); press X to exhale.
  var params = new URLSearchParams(location.search);
  var debug = params.has('smokedebug'), force = debug && params.has('force');
  var hud = null, frames = 0, fpsAt = 0, fps = 0, lastReason = 'idle', glInfo = '';
  function reduced() { return mq.matches && !force; }
  function note(msg) { lastReason = msg; if (debug) console.info('[podSmoke] ' + msg); }
  function report() {
    if (!debug) return;
    if (!hud) {
      hud = document.createElement('pre');
      hud.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2000;margin:0;padding:6px 8px;background:rgba(0,0,0,.75);color:#7dffb0;font:11px/1.35 monospace;pointer-events:none;white-space:pre';
      document.body.appendChild(hud);
    }
    var rect = canvas.getBoundingClientRect();
    hud.textContent = [
      'podSmoke debug (X = exhale now)',
      'webgl: ' + (gl ? 'ok ' + glInfo : disabled ? 'FAILED' : 'not started'),
      'reduced-motion: ' + mq.matches + (force ? ' (forced on)' : ''),
      'hidden: ' + document.hidden + '  quality: ' + quality.toFixed(2),
      'canvas: ' + canvas.width + 'x' + canvas.height + ' display=' + canvas.style.display,
      'in viewport: ' + (rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight),
      'running: ' + !!state + (state ? '  age ' + state.age.toFixed(1) + '/' + state.dur.toFixed(1) + 's  fps ' + fps : ''),
      'next exhale timer: ' + (timer ? 'armed' : 'none'),
      'last: ' + lastReason
    ].join('\n');
  }
  if (debug) setInterval(report, 250);

  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight;
    var f = Math.min(0.4, Math.sqrt(300000 / Math.max(1, cw * ch))) * quality;
    canvas.width = Math.max(96, Math.round(cw * f));
    canvas.height = Math.max(96, Math.round(ch * f));
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function stopFrames() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function stopTimer() { if (timer) clearTimeout(timer); timer = 0; }

  function endExhale() {
    stopFrames(); state = null;
    canvas.style.display = 'none';
    if (gl) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    note('exhale finished');
    schedule();
  }

  function schedule(delaySeconds) {
    stopTimer();
    if (disabled || reduced() || document.hidden) { note(disabled ? 'disabled (no WebGL)' : reduced() ? 'paused: reduced motion' : 'paused: tab hidden'); return; }
    var delay = delaySeconds || (first ? rand(7, 13) : rand(20, 40));
    timer = setTimeout(startExhale, delay * 1000);
    note('next exhale in ' + Math.round(delay) + 's');
  }

  function startExhale() {
    timer = 0; first = false;
    if (disabled || reduced() || document.hidden) { schedule(); return; }
    if (!init()) { if (!disabled) schedule(10); return; }
    resize();
    state = {
      age: 0, dur: rand(8.5, 11.5), seed: [rand(0, 9), rand(0, 9)],
      drift: rand(-.08, .08), size: rand(.88, 1.15), twist: rand(.5, 1.1) * (Math.random() < .5 ? -1 : 1)
    };
    canvas.style.display = 'block';
    last = performance.now(); slow = 0; frames = 0; fpsAt = last;
    note('exhale started');
    raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;
    if (!state || !gl) return;
    var raw = (now - last) / 1000; last = now;
    frames++; if (now - fpsAt >= 1000) { fps = frames; frames = 0; fpsAt = now; }
    // Adaptive quality: slow GPUs get a smaller render target (the smoke is soft, so it still looks right).
    // Never switch the effect off because of speed: a slower, blurrier plume beats no plume.
    if (raw > 0.04) slow++; else if (slow > 0) slow--;
    if (slow > 12 && quality > 0.3) { slow = 0; quality *= 0.75; resize(); note('slow frames, quality ' + quality.toFixed(2)); }
    // Wall-clock aging keeps the exhale the same length even when frames are slow.
    state.age += Math.min(0.25, raw);
    if (state.age >= state.dur) { endExhale(); return; }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform2f(uni.uSeed, state.seed[0], state.seed[1]);
    gl.uniform1f(uni.uAge, state.age); gl.uniform1f(uni.uDur, state.dur);
    gl.uniform1f(uni.uDrift, state.drift); gl.uniform1f(uni.uSize, state.size); gl.uniform1f(uni.uTwist, state.twist);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  function abort() { stopFrames(); stopTimer(); state = null; canvas.style.display = 'none'; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopFrames(); stopTimer(); note('paused: tab hidden'); }
    else if (state) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else schedule();
  });
  var onMotion = function () { if (reduced()) abort(); else if (!state && !timer) schedule(); };
  if (mq.addEventListener) mq.addEventListener('change', onMotion); else if (mq.addListener) mq.addListener(onMotion);
  window.addEventListener('resize', function () { if (state) resize(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); abort(); gl = prog = buf = null; note('WebGL context lost'); });
  canvas.addEventListener('webglcontextrestored', function () { gl = prog = buf = null; note('WebGL context restored'); schedule(); });
  window.addEventListener('pagehide', function () { abort(); teardown(); });

  if (debug) {
    window.podSmoke = { exhale: function () { if (!state) { stopTimer(); startExhale(); } } };
    document.addEventListener('keydown', function (e) { if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey && !e.altKey) window.podSmoke.exhale(); });
  }

  schedule();
})();
