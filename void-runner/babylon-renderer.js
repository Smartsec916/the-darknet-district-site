/* Presentation only. The caller owns physics, combat, campaign and animation timing. */
(function(root) {
  const base = new URL('.', document.currentScript.src);
  const presets = {
    low: {
      scale: 1.5,
      rocks: 18,
      stars: 180,
      fragments: 60
    },
    medium: {
      scale: 1,
      rocks: 34,
      stars: 360,
      fragments: 120
    },
    high: {
      scale: .8,
      rocks: 48,
      stars: 600,
      fragments: 220
    }
  };
  let engine, scene, camera, surface, loadPromise, spaceRoot, roomRoot, planet, station, sky, rockSource, cockpit, rocks = [],
    ships = new Map(),
    pools = {},
    poolSources = {},
    effects = new Map(),
    signs = [];
  let activeLocation = null,
    room = null,
    quality = 'medium',
    materials = {},
    lastWidth = 0,
    lastHeight = 0;
  const diagnostics = {
    ready: false,
    location: null,
    preparations: 0,
    frames: 0,
    meshCount: 0,
    exteriorReady: false
  };
  const B = () => root.BABYLON;
  const vector = o => new(B().Vector3)(o.x, -o.y, o.z);

  function color(hex) {
    return B().Color3.FromHexString(hex);
  }

  // Station window glass: almost clear, with faint scratches and scuffs and a little specular glint, so the view
  // outside reads true instead of through a green-teal tint (David, 2026-10-23).
  function windowGlass(){
    if(materials['window-glass-clear'])return materials['window-glass-clear'];
    const b=B(),t=new b.DynamicTexture('window-scratches',{width:512,height:512},scene,true),g=t.getContext();let seed=11;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    g.clearRect(0,0,512,512);g.fillStyle='rgba(200,220,230,.035)';g.fillRect(0,0,512,512);
    for(let i=0;i<70;i++){const x=rnd()*512,y=rnd()*512,a=(rnd()-.5)*.6+(i%3?0:Math.PI/2),l=20+rnd()*140;g.strokeStyle='rgba(235,245,250,'+(.08+rnd()*.22)+')';g.lineWidth=.6+rnd()*.9;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
    for(let i=0;i<14;i++){const x=rnd()*512,y=rnd()*512,r=10+rnd()*36,s=g.createRadialGradient(x,y,0,x,y,r);s.addColorStop(0,'rgba(220,230,235,.07)');s.addColorStop(1,'rgba(220,230,235,0)');g.fillStyle=s;g.fillRect(x-r,y-r,r*2,r*2);}
    t.update();t.hasAlpha=true;t.uScale=4;t.vScale=1;
    const m=new b.StandardMaterial('window-glass-clear',scene);m.diffuseTexture=t;m.useAlphaFromDiffuseTexture=true;m.diffuseColor=new b.Color3(.85,.92,.96);m.specularColor=new b.Color3(.55,.6,.65);m.specularPower=96;m.backFaceCulling=false;
    return materials['window-glass-clear']=m;
  }
  function material(name, hex, emissive = false, alpha = 1) {
    const key = name + hex + alpha;
    if (materials[key]) return materials[key];
    const m = new(B().StandardMaterial)(name, scene);
    m.diffuseColor = color(hex);
    m.specularColor = new(B().Color3)(.16, .19, .22);
    m.alpha = alpha;
    if (emissive) {
      m.emissiveColor = color(hex);
      m.disableLighting = true;
    } else if (['rock', 'hull', 'station', 'concrete', 'floor'].includes(name)) {
      const t = new(B().DynamicTexture)(name + '-surface', {
          width: 128,
          height: 128
        }, scene, false),
        g = t.getContext();
      g.fillStyle = '#c4c4c4';
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) {
        const x = (i * 73) % 128,
          y = (i * 37 + Math.floor(i / 128) * 11) % 128;
        g.fillStyle = i % 3 ? '#80808030' : '#ffffff30';
        g.fillRect(x, y, 1 + i % 4, 1);
      }
      if (name !== 'rock') {
        g.strokeStyle = '#33333390';
        g.strokeRect(1, 1, 126, 126);
        g.strokeRect(7, 7, 114, 114);
      }
      t.update();
      m.diffuseTexture = t;
    }
    return materials[key] = m;
  }

  function box(name, size, pos, mat, parent) {
    const m = B().MeshBuilder.CreateBox(name, {
      width: size[0],
      height: size[1],
      depth: size[2]
    }, scene);
    m.position.set(...pos);
    m.material = mat;
    m.parent = parent;
    return m;
  }

  function effectMaterial(kind) {
    const key = 'effect-' + kind;
    if (materials[key]) return materials[key];
    const b = B(),
      t = new b.DynamicTexture(key, {
        width: 128,
        height: 128
      }, scene, false),
      g = t.getContext(),
      r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (kind === 'ring') {
      r.addColorStop(0, '#ffd69c00');
      r.addColorStop(.76, '#ffd69c00');
      r.addColorStop(.84, '#ffd69caa');
      r.addColorStop(.94, '#ffd69c00');
      r.addColorStop(1, '#ffd69c00');
    } else {
      const c = kind === 'smoke' ? '#4e4b51' : kind === 'impact' ? '#8cdeff' : '#ff9e51';
      r.addColorStop(0, kind === 'smoke' ? c + '70' : '#fff5d8ff');
      r.addColorStop(.16, c + 'ec');
      r.addColorStop(.5, c + '65');
      r.addColorStop(1, c + '00');
    }
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    t.hasAlpha = true;
    t.update();
    const m = new b.StandardMaterial(key, scene);
    m.diffuseTexture = t;
    m.emissiveColor = new b.Color3(1, 1, 1);
    m.disableLighting = true;
    m.useAlphaFromDiffuseTexture = true;
    m.backFaceCulling = false;
    m.disableDepthWrite = true;
    m.alphaMode = kind === 'smoke' ? b.Engine.ALPHA_COMBINE : b.Engine.ALPHA_ADD;
    return materials[key] = m;
  }

  function effectPlane(kind) {
    const m = B().MeshBuilder.CreatePlane(kind, {
      size: 1
    }, scene);
    m.parent = spaceRoot;
    m.billboardMode = B().Mesh.BILLBOARDMODE_ALL;
    m.material = effectMaterial(kind);
    return m;
  }

  function disposeNode(node) {
    if (node) node.dispose(false, false);
  }

  function loadEngineOnce(task) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.dataset.voidRetry = 'engine';
      s.src = new URL('vendor/babylon-8.26.0.js', base);
      let done = false;
      const finish = error => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        task.signal.removeEventListener('abort', abort);
        if (error) { s.remove(); reject(error); }
        else resolve();
      };
      const abort = () => finish(task.signal.reason);
      const timer = setTimeout(() => finish(Error('Babylon download timed out.')), 60000);
      task.signal.addEventListener('abort', abort, {once:true});
      s.onload = () => finish(root.BABYLON?.Engine ? null : Error('Babylon script loaded without an engine.'));
      s.onerror = () => finish(Error('Babylon download failed.'));
      document.head.append(s);
    });
  }
  async function script(task) {
    if (root.BABYLON?.Engine) return;
    for (let attempt = 1; attempt <= 3; attempt++) {
      task.check();
      if(root.BABYLON?.Engine)return;
      VoidLoading.stage('core', attempt === 1 ? 'INITIALIZING ENGINE' : 'RETRYING ENGINE DOWNLOAD · '+attempt+'/3');
      try { await loadEngineOnce(task); return; }
      catch (error) {
        if (task.signal.aborted) throw error;
        console.warn('[VOID//RUNNER startup] engine download', {attempt, reason:error.message});
        if (attempt === 3) { const failure = Error('Babylon engine unavailable after 3 attempts. Check the connection, then retry.'); failure.phase='module'; throw failure; }
        await new Promise((resolve,reject) => {
          const abort=()=>{clearTimeout(timer);reject(task.signal.reason);};
          const timer=setTimeout(()=>{task.signal.removeEventListener('abort',abort);resolve();}, 700*2**(attempt-1)+Math.random()*300);
          task.signal.addEventListener('abort',abort,{once:true});
        });
      }
    }
  }
  function checkGraphics() {
    const probe=document.createElement('canvas');
    let context=null;
    try { context=probe.getContext('webgl2')||probe.getContext('webgl')||probe.getContext('experimental-webgl'); } catch {}
    if (!context) { const error=Error('WebGL could not start in this browser. Check graphics drivers and hardware acceleration, then retry.'); error.phase='graphics'; throw error; }
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
  // Shared camera look: ACES tone mapping, anti-aliasing, bloom and emissive glow.
  // Low quality keeps only tone mapping so slower devices pay no extra passes.
  // Reflection environment for PBR materials (imported models need one to show their detail).
  // Built in code, no downloads: a dim industrial room (gradient dome plus overhead strip lights),
  // captured once into a small cube map in a separate helper scene and shared with the game scene.
  const reflections = {
    helper: null, cube: null,
    apply(target, intensity = .7) {
      const b = B();
      if (!this.cube) {
        const s = this.helper = new b.Scene(target.getEngine());s.autoClear = true;
        const cam = new b.FreeCamera('env-camera', b.Vector3.Zero(), s);s.activeCamera = cam;
        const dome = b.MeshBuilder.CreateSphere('env-dome', {diameter: 400, segments: 16, sideOrientation: b.Mesh.BACKSIDE}, s);
        const tex = new b.DynamicTexture('env-gradient', {width: 8, height: 256}, s, false), g = tex.getContext(), grad = g.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#9aa6b4');grad.addColorStop(.45, '#4a5360');grad.addColorStop(.55, '#2a2f36');grad.addColorStop(1, '#0c0e11');g.fillStyle = grad;g.fillRect(0, 0, 8, 256);tex.update();
        const domeMat = new b.StandardMaterial('env-dome', s);domeMat.emissiveTexture = tex;domeMat.disableLighting = true;dome.material = domeMat;
        const probe = new b.ReflectionProbe('env-probe', 128, s);probe.refreshRate = b.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;probe.renderList.push(dome);
        for (let i = 0; i < 4; i++) {
          const strip = b.MeshBuilder.CreatePlane('env-strip', {width: 120, height: 10}, s), a = i * Math.PI / 2;
          strip.position.set(Math.cos(a) * 150, 90, Math.sin(a) * 150);strip.lookAt(b.Vector3.Zero());
          const m = new b.StandardMaterial('env-strip', s);m.emissiveColor = new b.Color3(1.6, 1.55, 1.45);m.disableLighting = true;strip.material = m;probe.renderList.push(strip);
        }
        this.cube = probe.cubeTexture;this.probe = probe;s.render();
        // A lost graphics context empties the cube; draw it again on restore.
        target.getEngine().onContextRestoredObservable.add(() => {probe.refreshRate = b.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;this.helper.render();});
      }
      target.environmentTexture = this.cube;target.environmentIntensity = intensity;
    }
  };
  const look = {
    apply(targetScene, targetCamera, level = quality) {
      const b = B(), ip = targetScene.imageProcessingConfiguration, state = targetScene.metadata ??= {};
      ip.toneMappingEnabled = true;
      ip.toneMappingType = b.ImageProcessingConfiguration.TONEMAPPING_ACES;
      ip.exposure = 1.55;
      ip.contrast = 1.06;
      ip.vignetteEnabled = level !== 'low';
      ip.vignetteWeight = .7;
      ip.vignetteStretch = .9;
      ip.vignetteColor = new b.Color4(0, 0, 0, 0);
      ip.vignetteBlendMode = b.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
      if (level === 'low') { state.lookPipeline?.dispose(); state.lookPipeline = null; }
      else if (!state.lookPipeline) {
        try {
          const pipeline = new b.DefaultRenderingPipeline('void-look', true, targetScene, [targetCamera]);
          pipeline.fxaaEnabled = true;
          pipeline.bloomEnabled = true;
          pipeline.bloomThreshold = .78;
          pipeline.bloomWeight = .32;
          pipeline.bloomKernel = 48;
          pipeline.bloomScale = .5;
          pipeline.imageProcessingEnabled = true;
          state.lookPipeline = pipeline;
        } catch (error) { console.warn('Post-processing unavailable; continuing without it.', error); state.lookPipeline = null; }
      }
      if (level !== 'high') { state.lookGlow?.dispose(); state.lookGlow = null; }
      else if (!state.lookGlow) {
        try {
          const glow = new b.GlowLayer('void-glow', targetScene, { mainTextureRatio: .5, blurKernelSize: 32 });
          glow.intensity = .45;
          state.lookGlow = glow;
        } catch (error) { state.lookGlow = null; }
      }
    }
  };
  root.VoidLook = look;
  async function initialize(task) {
    if (!task) return VoidPreparation.run(t=>initialize(t));
    if (engine && diagnostics.ready) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      checkGraphics();
      await task.wait('module',()=>script(task),new URL('vendor/babylon-8.26.0.js',base).href);
      task.check();
      const b = B();
      surface = document.createElement('canvas');
      surface.setAttribute('aria-hidden', 'true');
      // No second audio context and no second animation loop.
      try { engine = new b.Engine(surface, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        audioEngine: false
      }); } catch(cause) {
        const error=Error('WebGL engine could not start. Check graphics drivers and browser hardware acceleration.');
        error.phase='graphics';error.cause=cause;throw error;
      }
      scene = new b.Scene(engine);
      scene.clearColor = new b.Color4(.008, .018, .035, 1);
      camera = new b.FreeCamera('presentation-camera', b.Vector3.Zero(), scene);
      camera.minZ = .1;
      camera.maxZ = 3500;
      camera.inputs.clear();
      const hemi = new b.HemisphericLight('ambient', new b.Vector3(0, 1, 0), scene);
      hemi.intensity = .48;
      hemi.groundColor = new b.Color3(.12, .15, .21);
      const sun = new b.DirectionalLight('sun', new b.Vector3(.6, -.7, .4), scene);
      sun.intensity = 1.5;
      look.apply(scene, camera);
      reflections.apply(scene);
      diagnostics.ready = true;
      engine.onContextLostObservable.add(() => {
        diagnostics.ready = false;
        diagnostics.exteriorReady = false;
        VoidLoading.graphicsState?.('lost');
      });
      engine.onContextRestoredObservable.add(() => {
        diagnostics.ready = true;
        VoidLoading.graphicsState?.('restored');
      });
    })().catch(error => {
      scene?.dispose(); engine?.dispose();
      scene=engine=camera=surface=null;
      diagnostics.ready=false;
      loadPromise = null;
      throw error;
    });
    return loadPromise;
  }

  // Faction ships (design doc 08). The Communion builds smooth, pale, automated hulls with cyan
  // light; the Natural Order builds boxy, plated, crewed hulls with exposed pipes and amber burners.
  // Imported models registered as 'ship:<name>' replace these through the asset hook above.
  function factionShipModel(name, parent) {
    const b = B(), node = new b.TransformNode(name, scene), heavy = /warden|hauler/.test(name);node.parent = parent;
    const ellipsoid = (id, scale, pos, mat, rot) => {const m = b.MeshBuilder.CreateSphere(id, {diameter: 1, segments: 10}, scene);m.parent = node;m.scaling.set(...scale);m.position.set(...pos);if (rot) m.rotation.set(...rot);m.material = mat;return m;};
    const tube = (id, height, diameter, pos, mat) => {const m = b.MeshBuilder.CreateCylinder(id, {height, diameter, tessellation: 10}, scene);m.parent = node;m.rotation.x = Math.PI / 2;m.position.set(...pos);m.material = mat;return m;};
    if (name.startsWith('communion-')) {
      const shell = material('communion-shell', '#e2e8ec'), silver = material('communion-silver', '#a9b6c1'), glow = material('communion-glow', '#7fe6ff', true), eye = material('communion-eye', '#24425c');
      shell.emissiveColor = new b.Color3(.12, .13, .14);silver.emissiveColor = new b.Color3(.06, .07, .08);
      const span = heavy ? 3.6 : 2.8;
      ellipsoid('communion-fuselage', [heavy ? 1.15 : .9, .55, heavy ? 5.2 : 4.6], [0, 0, 0], shell);
      ellipsoid('communion-prow', [.5, .34, 1.5], [0, .02, 2.05], silver);
      ellipsoid('communion-sensor', [.42, .16, .9], [0, .24, .95], eye);
      for (const side of [-1, 1]) {
        ellipsoid('communion-blade', [span, .08, 1.25], [side * (span * .45), -.05, -.45], silver, [0, side * .38, side * -.06]);
        const tip = b.MeshBuilder.CreateSphere('communion-tip-light', {diameter: .16, segments: 6}, scene);tip.parent = node;tip.position.set(side * span * .86, -.05, -.95);tip.material = glow;
      }
      box('communion-spine-light', [.06, .04, 3.1], [0, .29, -.2], glow, node);
      for (const z of heavy ? [-2.35, -1.75] : [-2.3]) {
        const halo = b.MeshBuilder.CreateTorus('communion-halo', {diameter: heavy ? 1.4 : 1.1, thickness: .11, tessellation: 24}, scene);halo.parent = node;halo.rotation.x = Math.PI / 2;halo.position.set(0, 0, z);halo.material = glow;
      }
      const burn = b.MeshBuilder.CreateDisc('communion-drive', {radius: heavy ? .5 : .4, tessellation: 20}, scene);burn.parent = node;burn.position.set(0, 0, heavy ? -2.6 : -2.35);burn.rotation.y = Math.PI;burn.material = glow;
      if (heavy) ellipsoid('communion-keel', [.12, .9, 2.2], [0, -.45, -.6], silver);
    } else {
      const steel = material('order-steel', '#2c2e31'), plate = material('order-plate', '#4b4944'), vent = material('order-vent', '#121314'), orange = material('order-stripe', '#a8602a'), pipe = material('order-pipe', '#55524c'), amber = material('order-burn', '#ffa640', true), glass = material('order-glass', '#3a2c16');
      steel.emissiveColor = new b.Color3(.03, .03, .03);plate.emissiveColor = new b.Color3(.04, .04, .035);steel.specularColor = plate.specularColor = new b.Color3(.07, .07, .07);glass.emissiveColor = new b.Color3(.16, .1, .03);
      const w = heavy ? 2.2 : 1.6, h = heavy ? 1.1 : .9, l = heavy ? 4.6 : 3.8;
      box('order-hull', [w, h, l], [0, 0, 0], steel, node);
      const nose = box('order-nose', [w * .7, h * .66, 1], [0, -.05, l / 2 + .35], plate, node);nose.rotation.x = .12;
      box('order-dorsal-plate', [w * .75, .12, l * .55], [0, h / 2 + .06, -.1], plate, node);
      box('order-stripe', [w + .04, .14, .32], [0, .05, l * .32], orange, node);
      box('order-canopy', [.62, .3, .72], [0, h / 2 + .2, l * .28], glass, node);
      for (const side of [-1, 1]) {
        box('order-side-armor', [.12, h * .8, l * .7], [side * (w / 2 + .06), 0, -.1], plate, node);
        // Worn, repairable plating: seams, a service band, intake vents and underside pipework.
        for (let k = 0; k < 4; k++) box('order-seam', [.14, h * .82, .06], [side * (w / 2 + .07), 0, -l * .3 + k * l * .2], steel, node);
        box('order-side-band', [.15, .2, l * .36], [side * (w / 2 + .08), h * .18, l * .08], orange, node);
        box('order-vent', [.15, .2, .8], [side * (w / 2 + .08), -h * .22, -l * .28], vent, node);
        tube('order-under-pipe', l * .75, .13, [side * w * .34, -h / 2 - .08, -.15], pipe);
        box('order-nose-lamp', [.08, .08, .1], [side * w * .3, .05, l / 2 + .86], amber, node);
        box('order-stub-wing', [1.3, .16, 1.1], [side * (w / 2 + .65), -.15, -.5], steel, node);
        tube('order-cannon', 1.5, .15, [side * (w / 2 + 1.1), -.15, .45], pipe);
        tube('order-pipe', l * .8, .11, [side * w * .3, h / 2 + .1, -.2], pipe);
        tube('order-engine', 1.25, .62, [side * w * .3, -.05, -l / 2 - .45], plate);
        const burn = b.MeshBuilder.CreateDisc('order-burner', {radius: .25, tessellation: 14}, scene);burn.parent = node;burn.position.set(side * w * .3, -.05, -l / 2 - 1.09);burn.rotation.y = Math.PI;burn.material = amber;
        box('order-lamp', [.1, .08, .12], [side * (w / 2 + 1.25), -.15, -.95], amber, node);
      }
      if (heavy) {box('order-turret', [.7, .4, .8], [0, h / 2 + .32, -.9], plate, node);tube('order-turret-gun', 1.3, .13, [0, h / 2 + .38, -.1], pipe);tube('order-engine', 1.25, .7, [0, .25, -l / 2 - .45], plate);}
    }
    node.metadata = {placeholder: true, faction: name.startsWith('communion-') ? 'communion' : 'natural-order'};
    return node;
  }
  // Tessaly police cutter (Admin's sealed-cargo patrols): navy and white hull, red and blue light bar.
  function policeShipModel(parent) {
    const b = B(), node = new b.TransformNode('police-cutter', scene);node.parent = parent;
    const white = material('police-white', '#d9dee4'), navy = material('police-navy', '#1d2b45'), dark = material('police-dark', '#10151d'), red = material('police-red', '#ff3b3b', true), blue = material('police-blue', '#3b7bff', true), burn = material('police-burn', '#7fb4ff', true);
    white.emissiveColor = new b.Color3(.1, .11, .12);navy.emissiveColor = new b.Color3(.03, .04, .07);
    box('police-hull', [1.3, .7, 4.2], [0, 0, 0], navy, node);
    const nose = box('police-nose', [.9, .5, 1.2], [0, -.05, 2.5], white, node);nose.rotation.x = .18;
    box('police-dorsal', [1.1, .12, 2.6], [0, .41, .3], white, node);
    box('police-canopy', [.6, .28, .8], [0, .55, 1.2], dark, node);
    box('police-lightbar-red', [.34, .14, .3], [-.22, .68, .2], red, node);box('police-lightbar-blue', [.34, .14, .3], [.22, .68, .2], blue, node);
    for (const side of [-1, 1]) {
      const wing = box('police-wing', [1.8, .1, 1.4], [side * 1.4, -.1, -.6], white, node);wing.rotation.y = side * .25;
      const stripe = box('police-wing-stripe', [1.6, .11, .2], [side * 1.45, -.09, -.25], blue, node);stripe.rotation.y = side * .25;
      const pod = b.MeshBuilder.CreateCylinder('police-engine', {height: 1.4, diameter: .55, tessellation: 12}, scene);pod.parent = node;pod.rotation.x = Math.PI / 2;pod.position.set(side * .75, -.05, -2);pod.material = dark;
      const glow = b.MeshBuilder.CreateDisc('police-burn', {radius: .24, tessellation: 16}, scene);glow.parent = node;glow.position.set(side * .75, -.05, -2.72);glow.rotation.y = Math.PI;glow.material = burn;
    }
    return node;
  }
  function shipModel(name, allegiance, parent, opts = {}) {
    const model = VoidAssets.instance('ship:' + name, parent);
    if (model) return model;
    if (/^(communion|order)-/.test(name)) return factionShipModel(name, parent);
    if (name === 'police-cutter') return policeShipModel(parent);
    const b = B(),
      node = new b.TransformNode(name, scene),
      metal = material('hull', name==='starter'?'#a8a299':'#465964'),
      dark = material('hull-dark', '#202e36'),
      light = material('engine', allegiance === 'hostile' ? '#ed765b' : '#60d7d0', true);
    node.parent = parent;
    if(name==='starter'){
      const positions=[],indices=[],normals=[],uvs=[],rings=[[-2,.52,.22],[-1.3,.78,.34],[.65,.64,.32],[2.15,.16,.12]];
      for(const [z,w,h]of rings)for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;positions.push(Math.cos(a)*w,Math.sin(a)*h,z);uvs.push(i/8,(z+2)/4.15);}
      for(let r=0;r<3;r++)for(let i=0;i<8;i++){const a=r*8+i,c=r*8+(i+1)%8;indices.push(a,c,c+8,a,c+8,a+8);}for(let i=1;i<7;i++){indices.push(0,i+1,i,24,24+i,24+i+1);}
      for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];b.VertexData.ComputeNormals(positions,indices,normals);const hull=new b.Mesh('kestrel-hull',scene),data=new b.VertexData();Object.assign(data,{positions,indices,normals,uvs});data.applyToMesh(hull);hull.parent=node;hull.material=metal;hull.convertToFlatShadedMesh();
      // Sleek flanks (David, 2026-10-23): no service stripes, vents, side panels or cheek plates; the cargo is carried inside.
      const armor=material('kestrel-armor','#a5a297'),panel=material('kestrel-panel','#727a76'),wingMat=material('kestrel-wing','#a8a39b'),rust=material('kestrel-rust','#9d6550');
      if(!armor.diffuseTexture){armor.diffuseTexture=new b.Texture(new URL('art/vesper-weathered-panels.webp',base).href,scene,true,false);armor.diffuseTexture.uScale=2;armor.diffuseTexture.vScale=2;armor.diffuseColor=b.Color3.White();}
      // The landing-pad view sees the working ship from below; retain readable hull panels in shade.
      armor.emissiveColor=new b.Color3(.16,.15,.13);wingMat.emissiveColor=new b.Color3(.20,.19,.16);metal.emissiveColor=new b.Color3(.23,.22,.19);
      function plate(name,footprint,y,thickness,mat){const ps=[],ids=[],normals=[],uv=[];for(const h of [y-thickness/2,y+thickness/2])for(const [x,z] of footprint){ps.push(x,h,z);uv.push(x,z);}const n=footprint.length;for(let i=1;i<n-1;i++){ids.push(n,n+i,n+i+1,0,i+1,i);}for(let i=0;i<n;i++){const j=(i+1)%n;ids.push(i,j,n+j,i,n+j,n+i);}b.VertexData.ComputeNormals(ps,ids,normals);const mesh=new b.Mesh(name,scene),data=new b.VertexData();Object.assign(data,{positions:ps,indices:ids,normals,uvs:uv});data.applyToMesh(mesh);mesh.parent=node;mesh.material=mat;return mesh;}
      plate('kestrel-dorsal-armor',[[-.54,-1.53],[.54,-1.53],[.62,.45],[.42,1.24],[-.42,1.24],[-.62,.45]],.36,.075,armor);
      plate('kestrel-ventral-armor',[[-.52,-1.56],[.52,-1.56],[.60,.20],[.29,1.54],[-.29,1.54],[-.60,.20]],-.44,.055,wingMat);
      plate('kestrel-nose-armor',[[-.42,1.20],[.42,1.20],[.26,2.12],[-.26,2.12]],.14,.06,panel);
      for(const side of [-1,1]){
        const wing=plate('kestrel-swept-wing',[[side*.52,.20],[side*2.45,-.65],[side*2.75,-1.28],[side*1.15,-1.62]],-.13,.15,wingMat);wing.material.backFaceCulling=false;
        
        const border=box('kestrel-wing-edge',[1.45,.075,.10],[side*1.7,-.04,-1.20],dark,node);border.rotation.y=side*.35;
        
        box('kestrel-weapon-pylon',[.25,.18,1.18],[side*2.35,-.28,-.98],dark,node);
        const cannon=b.MeshBuilder.CreateCylinder('kestrel-laser-barrel',{height:1.25,diameter:.105,tessellation:10},scene);cannon.parent=node;cannon.rotation.x=Math.PI/2;cannon.position.set(side*2.35,-.30,-.04);cannon.material=panel;
        box('kestrel-empty-missile-rail',[.16,.08,.72],[side*1.45,-.31,-.88],dark,node);
        const intake=b.MeshBuilder.CreateCylinder('kestrel-engine-cowl',{height:1.20,diameter:.72,tessellation:12},scene);intake.parent=node;intake.rotation.x=Math.PI/2;intake.position.set(side*1.06,-.03,-1.50);intake.material=panel;
        const ring=b.MeshBuilder.CreateTorus('kestrel-exhaust-ring',{diameter:.60,thickness:.07,tessellation:16},scene);ring.parent=node;ring.position.set(side*1.06,-.03,-2.22);ring.material=armor;
        
        
      }
      box('kestrel-canopy-rear-frame',[.91,.06,.06],[0,.60,.14],armor,node);
      box('kestrel-canopy-front-frame',[.69,.06,.06],[0,.56,1.28],armor,node);
      // Reference-art details: red service stripe, swept tail fin, chin guns, orange
      // engine glow and amber running lights.
      const red=material('kestrel-red','#8e2c26');
      box('kestrel-dorsal-stripe',[.16,.012,2.3],[.22,.405,-.35],red,node);
      {const fin=new b.Mesh('kestrel-tail-fin',scene),ps=[],ids=[],ns=[],pts=[[-1.05,.40],[-1.95,.40],[-2.25,1.45],[-1.80,1.45]];for(const x of [-.04,.04])for(const [z,y] of pts)ps.push(x,y,z);ids.push(0,1,2,0,2,3,4,6,5,4,7,6);for(let i=0;i<4;i++){const j=(i+1)%4;ids.push(i,j,4+j,i,4+j,4+i);}b.VertexData.ComputeNormals(ps,ids,ns);const d=new b.VertexData();Object.assign(d,{positions:ps,indices:ids,normals:ns});d.applyToMesh(fin);fin.parent=node;fin.material=armor;armor.backFaceCulling=false;
       box('kestrel-fin-stripe',[.09,.16,.62],[0,1.18,-1.95],red,node).rotation.x=-.3;}
      for(const side of [-1,1]){const gun=b.MeshBuilder.CreateCylinder('kestrel-chin-gun',{height:.7,diameter:.06,tessellation:8},scene);gun.parent=node;gun.rotation.x=Math.PI/2;gun.position.set(side*.12,-.40,1.95);gun.material=dark;}
      const amberLamp=material('kestrel-lamp','#ffb14a',true);for(const side of [-1,1]){box('kestrel-nose-lamp',[.14,.05,.03],[side*.2,-.1,2.1],amberLamp,node);box('kestrel-wingtip-lamp',[.06,.06,.12],[side*2.7,-.12,-1.25],amberLamp,node);}
    }else box('hull', [1.4, .65, 4], [0, 0, 0], metal, node);
    const canopyMaterial=name==='starter'?material('kestrel-glass', '#344c55'):material('glass', '#182b3c');
    if(name==='starter')canopyMaterial.emissiveColor=new b.Color3(.035,.065,.075);
    box('canopy', [.85, name==='starter'?.23:.32, 1.3], [0, name==='starter'?.48:.44, .65], canopyMaterial, node);
    for (const side of [-1, 1]) {
      if(name!=='starter'){const wing = box('swept-wing', [2.3, .18, 1.6], [side * 1.3, -.1, -.6], metal, node);wing.rotation.y = side * -.32;box('engine-pod', [.55, .55, 1.8], [side * 1.05, 0, -1.35], dark, node);}
      if(name==='starter'){const glow=b.MeshBuilder.CreateDisc('kestrel-engine-glow',{radius:.27,tessellation:20},scene);glow.parent=node;glow.position.set(side*1.06,-.03,-2.24);glow.rotation.y=Math.PI;glow.material=material('kestrel-burn',allegiance==='hostile'?'#ed765b':'#ff9a3c',true);}
      else box('exhaust', [.38, .34, .15], [side * 1.05, 0, -2.3], light, node);
    }
    if(name==='ship2')node.scaling.x=1.2;if(name==='ship3')node.scaling.z=1.3;
    node.metadata = {
      placeholder: true,
      reference: 'art/ships.png',
      landed: !!opts.landed && name==='starter'
    };
    return node;
  }
  // A landed Kestrel gets boarding stairs up to the cockpit's right side, a lit ring at their foot and a KESTREL / BOARD
  // sign, as on Vesper. The ring is the boarding spot: the room's BOARD YOUR SHIP point moves onto it.
  function landBoarding(def){
    const b=B();if(!roomRoot)return;
    for(const ship of roomRoot.getDescendants(false)){
      if(!ship.metadata?.landed||ship.metadata.boarding)continue;ship.computeWorldMatrix(true);
      // Ship space: the hull's side is at x .72 and the deck at y -1 (the ship stands 1 unit up); the cockpit runs z 0 to 1.3,
      // clear of the wing and guns (they end at z .6). Steps climb from the deck to the hull's side by the cockpit, on the
      // left (sd -1): the right side is where the hangar's maintenance terminal stands, and the two must not share a spot.
      const k=ship.scaling.y||1,ground=-ship.position.y/k,top=-.12,sd=-1,x0=sd*.8,x1=sd*1.9,z0=1.05,steps=6,steel=material('kestrel-steps','#7c858a'),lamp=material('kestrel-boarding-lamp','#ffcf80',true);
      for(let i=0;i<steps;i++){const f=(i+1)/steps,h=ground+(top-ground)*f;const s=box('kestrel-boarding-step',[Math.abs(x1-x0)/steps+.04,.035,.5],[x1-(x1-x0)*(i+.5)/steps,h-.018,z0],steel,ship);s.isPickable=false;}
      for(const dz of [-.26,.26]){const len=Math.hypot(x1-x0,top-ground),r=b.MeshBuilder.CreateCylinder('kestrel-boarding-handrail',{diameter:.03,height:len},scene);r.parent=ship;r.position.set((x0+x1)/2,(ground+top)/2+.3,z0+dz);r.rotation.z=Math.atan2(x1-x0,top-ground);r.material=steel;r.isPickable=false;
        const post=b.MeshBuilder.CreateCylinder('kestrel-boarding-handrail',{diameter:.03,height:.3},scene);post.parent=ship;post.position.set(x1,ground+.15+.035,z0+dz);post.material=steel;post.isPickable=false;}
      const foot=new b.Vector3(x1+sd*.55,ground,z0),ring=b.MeshBuilder.CreateTorus('kestrel-boarding-locus',{diameter:1.5/k,thickness:.03/k,tessellation:28},scene);ring.parent=ship;ring.position.set(foot.x,ground+.03/k,foot.z);ring.material=lamp;ring.isPickable=false;
      const t=new b.DynamicTexture('kestrel-board-sign',{width:256,height:48},scene,true),g=t.getContext();g.fillStyle='#0b1218';g.fillRect(0,0,256,48);g.fillStyle='#d4bd87';g.font='bold 26px monospace';g.textAlign='center';g.fillText('KESTREL / BOARD',128,33);t.update();
      const sm=new b.StandardMaterial('kestrel-board-sign',scene);sm.diffuseTexture=t;sm.emissiveTexture=t;sm.disableLighting=true;const sign=b.MeshBuilder.CreatePlane('kestrel-board-sign',{width:1.1/k*1.4,height:.21/k*1.4},scene);sign.parent=ship;sign.position.set(x1+sd*.3,ground+1.1/k*1.6,z0+.75);sign.rotation.y=-sd*Math.PI/2;sign.material=sm;sign.onDisposeObservable.add(()=>{sm.dispose();t.dispose();});sign.isPickable=false;const back=sign.clone('kestrel-board-sign-back');back.rotation.y+=Math.PI; // readable from both sides, never mirrored
      const post=b.MeshBuilder.CreateCylinder('kestrel-board-sign-post',{diameter:.03,height:1.1/k*1.6},scene);post.parent=ship;post.position.set(x1+sd*.3,ground+.55/k*1.6,z0+.75);post.material=steel;post.isPickable=false;
      ship.metadata.boarding=true;
      const w=b.Vector3.TransformCoordinates(foot,ship.getWorldMatrix()),board=def?.interactions?.find(i=>i.id==='board'||i.action==='board');
      if(board){board.position=[w.x,1.7,w.z];board.range=2.2;}
    }
  }


  // Worn steel pressure door: panel seams, centre split, hazard bands and status lamps.
  function doorMaterial(){
    if(materials['pressure-door'])return materials['pressure-door'];
    const b=B(),t=new b.DynamicTexture('pressure-door',{width:512,height:256},scene,true),g=t.getContext();
    g.fillStyle='#2a3035';g.fillRect(0,0,512,256);
    for(let i=0;i<900;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'120,130,135')+','+(Math.random()*.08)+')';g.fillRect(Math.random()*512,Math.random()*256,2+Math.random()*10,1+Math.random()*3);}
    g.strokeStyle='#14181b';g.lineWidth=3;for(const x of [40,128,212,300,384,472])g.strokeRect(x-36,24,72,208);
    g.fillStyle='#0c0f11';g.fillRect(253,0,6,256);
    for(let x=0;x<512;x+=28){g.fillStyle='#b8862e';g.beginPath();g.moveTo(x,226);g.lineTo(x+14,226);g.lineTo(x+28,256);g.lineTo(x+14,256);g.fill();}
    g.fillStyle='#14181b';g.fillRect(0,222,512,4);
    g.fillStyle='#4a545a';for(let y=40;y<210;y+=34)for(const x of [232,280])g.fillRect(x-6,y,12,6);
    g.fillStyle='#d9a441';g.fillRect(200,10,112,14);g.fillStyle='#14181b';g.font='bold 12px monospace';g.textAlign='center';g.fillText('PRESSURE DOOR',256,21);
    g.fillStyle='#ef5b4c';g.fillRect(222,30,10,6);g.fillStyle='#5fd0a0';g.fillRect(280,30,10,6);
    t.update();
    const m=new b.StandardMaterial('pressure-door',scene);m.diffuseTexture=t;m.specularColor=new b.Color3(.12,.13,.14);m.emissiveColor=new b.Color3(.02,.02,.02);
    materials['pressure-door']=m;return m;
  }
  // Faction outposts share the walkable plan but not the look: the Communion's Vigil is smooth,
  // pale and lit in cyan; the Natural Order's Holdfast is riveted steel, pipework and amber lamps.
  function factionDressing(id,node){
    const b=B();
    if(id==='vigil'){
      const glow=material('vigil-glow','#7fe6ff',true),dim=material('vigil-votive','#2c5b6c',true),pale=material('vigil-shell','#dfe6ea'),silver=material('vigil-silver','#9fb0bc');
      for(const side of [-1,1]){
        box('vigil-light-strip',[.08,.08,28],[side*17.6,7.6,-11],glow,node);box('vigil-corridor-light',[.06,.06,13],[side*3.65,4.6,11],glow,node);box('vigil-hall-light',[.08,.08,15],[side*17.6,5.6,26],glow,node);
        for(let i=0;i<4;i++)box('vigil-rib',[.35,8.4,.5],[side*17.5,4.4,-23+i*8],silver,node);
      }
      // A wall of small lit panels in the hall, kept like votive lights.
      for(let r=0;r<4;r++)for(let c=0;c<12;c++)box('vigil-panel',[.5,.32,.06],[-8.25+c*1.5,1+r*.6,33.6],(r*12+c)%5===0?glow:dim,node);
      const halo=b.MeshBuilder.CreateTorus('vigil-halo',{diameter:120,thickness:2.2,tessellation:96},scene);halo.parent=node;halo.position.set(0,6,4);halo.material=pale;
      const ring=b.MeshBuilder.CreateTorus('vigil-halo-light',{diameter:120,thickness:.5,tessellation:96},scene);ring.parent=node;ring.position.set(0,7.3,4);ring.material=glow;
      const spire=b.MeshBuilder.CreateCylinder('vigil-spire',{height:60,diameterTop:.4,diameterBottom:7,tessellation:24},scene);spire.parent=node;spire.position.set(0,40,26);spire.material=pale;
      return;
    }
    const amber=material('holdfast-lamp','#ffb04a',true),steel=material('holdfast-steel','#3d3a36'),rust=material('holdfast-rust','#6b4a2e'),pipe=material('holdfast-pipe','#57524a');
    for(const side of [-1,1]){
      for(let i=0;i<5;i++){box('holdfast-beam',[.6,8.6,.6],[side*17.4,4.3,-24+i*6.5],steel,node);box('holdfast-lamp',[.5,.3,.5],[side*16.9,7.8,-24+i*6.5],amber,node);}
      for(let k=0;k<3;k++){const p=b.MeshBuilder.CreateCylinder('holdfast-pipe',{height:30,diameter:.35+k*.1,tessellation:10},scene);p.parent=node;p.rotation.x=Math.PI/2;p.position.set(side*(17.1-k*.5),6.6+k*.55,-11);p.material=pipe;}
      box('holdfast-plate',[.2,3,28],[side*17.6,1.5,-11],rust,node);
    }
    for(let i=0;i<6;i++)box('holdfast-crate',[1.6,1.2+(i%3)*.4,1.6],[12.4+(i%3)*1.9,.6+(i%3)*.2,-20+Math.floor(i/3)*2.1],i%2?rust:steel,node);
    box('holdfast-gantry',[36,.8,.8],[0,8.4,-18],steel,node);box('holdfast-hook',[.25,3,.25],[4,6.6,-18],pipe,node);
    for(let i=0;i<5;i++)box('holdfast-hall-lamp',[1.6,.1,.45],[-12+i*6,5.85,26],amber,node);
  }
  function stationModel(id, parent, exterior=false,layoutDef=null) {
    if(VoidStationLayouts.meridianClass.includes(id)&&exterior){const imported=id==='meridian'&&VoidAssets.instance('station:meridian',parent);if(imported){imported.metadata={identity:'meridian',source:'shared-glb'};return imported;}const built=VoidMeridian.build(scene,parent,{name:VoidStationLayouts.labels[id]});globalThis.VoidMeridianKitbash?.dress(scene,built,'kit:');return built;}
    const b=B(),node=new b.TransformNode('station-'+id,scene);node.parent=parent;
    const def=layoutDef||VoidStationLayouts.layout(id),hull=material('station',def.color),metal=material('truss','#343e47'),trim=material('navigation','#a9d7c5',true);
    for(const p of def.shell){const colors={frame:'#252c31',panel:'#61676a',seat:'#735a42',ceramic:'#b0b9b5',counter:'#655846',door:'#59656c',amber:'#d7a465',teal:'#82beb0'};const mesh=box(p.id,p.size,p.position,p.kind==='glass'?windowGlass():p.kind==='floor'?material('floor','#29333c'):colors[p.kind]?material(p.kind,colors[p.kind],['amber','teal'].includes(p.kind)):hull,node);if(p.kind==='door'){mesh.metadata={stationDoor:p};mesh.material=doorMaterial();}}
    if(def.rooms){ // every station shares Meridian's design; only the hull lettering differs
      const exterior=VoidMeridian.build(scene,node,{occupied:true,name:VoidStationLayouts.labels[id]});globalThis.VoidMeridianKitbash?.dress(scene,exterior,'kit:',{occupied:true});node.metadata={layout:id,exterior};return node;
    }
    // Open physical aperture at z=-26; split pressure doors slide into the jambs.
    const doors=[-1,1].map(side=>box('hangar-door',[9.8,7,.35],[side*15,3.5,-26],metal,node));
    const arrays=[];
    for(const side of [-1,1]){
      box('structural-truss',[45,.7,.7],[side*38,5,9],metal,node);
      for(let i=0;i<3;i++){
        const pivot=new b.TransformNode('solar-gimbal',scene);pivot.parent=node;pivot.position.set(side*(25+i*14),5,9);arrays.push(pivot);
        box('solar-frame',[11,.22,29],[0,0,0],metal,pivot);
        box('solar-array',[10.6,.12,28.6],[0,.17,0],material('solar','#213958'),pivot);
        for(let j=-6;j<=6;j++)box('solar-cell-seam',[10.6,.03,.045],[0,.25,j*2],trim,pivot);
        box('external-tank',[3,3,7],[side*(23+i*5),1,27],hull,node);
      }
      box('radiator',[10,.2,12],[side*26,2,-13],material('radiator','#b1b7b7'),node);
      for(let z=-34;z<-24;z+=3)box('approach-light',[.35,.25,.8],[side*9,.4,z],trim,node);
      box('antenna',[.15,8,.15],[side*15,10,29],metal,node);
    }
    if(id==='vigil'||id==='holdfast')factionDressing(id,node);
    node.metadata={layout:id,doors,arrays,placeholder:true};return node;
  }

  let actors=[],stationActivity=null,lastActivityTime=null,crowdLocation=null,waitingCrowd=[],lastRoomTime=null;
  // Turns toward a heading along the short way round.
  const turnToward=(from,to,k)=>{let d=((to-from+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return from+d*Math.min(1,k);};
  // The clip for a crew member's routine state; one-shot moves (sitting down, standing up, reaching) play once on entering the state.
  function crewClip(actor,a,time){const c=actor.crowd,s=a.state,was=actor.was;actor.was=s;
    if(s==='walk'){c.walk(time+a.id);return;}
    if(s!==was){const o=VoidCrowd.onceClip[s];if(o){c.playOnce(o[0],o[1]);return;}}
    if(!c.busy){const base=VoidCrowd.activityClip[s]||'idle';if(!vary(actor,c,base))c.play(base);}}
  // Every 12-30 s an ambient figure may play a one-off from its look's variety (crowd.js), then return to its loop.
  function vary(actor,c,base,dt=1/60){actor.varyIn=(actor.varyIn??6+Math.random()*14)-dt;if(actor.varyIn>0)return false;actor.varyIn=12+Math.random()*18;
   const options=VoidCrowd.varietyFor?.(c.look,base)||[];if(!options.length||Math.random()<.35)return false;return c.playOnce(options[Math.floor(Math.random()*options.length)],base)>0;}
  function characterModel(id,parent,position,ambient=false){
    const model=VoidAssets.instance('character:'+id,parent);if(model){model.position.set(position[0],0,position[2]);actors.push({node:model,base:position.slice(),ambient});return model;}const look=ambient&&id.startsWith('crew-')&&root.VoidCrowd?VoidCrowd.pick(crowdLocation,id):null,figure=look&&VoidAssets.instance('crowd:'+look,parent);if(figure){figure.position.set(position[0],0,position[2]);figure.metadata={...figure.metadata,crowd:look,character:id,ambient};actors.push({node:figure,base:position.slice(),ambient,crowd:VoidCrowd.animate(figure,look,VoidCrowd.clipFor(id))});return figure;}
    const b=B(),a=VoidStationLayouts.appearances[id]||{coat:['#48565b','#665541','#566249','#4d5264'][Number(id.slice(-1))%4]||'#59676e',hair:'#30363c',skin:['#ae8a70','#75533f','#c7a184'][Number(id.slice(-1))%3]||'#ae8a70'},node=new b.TransformNode('npc-'+id,scene);
    node.parent=parent;node.position.set(...position);node.position.y=0;
    const coat=material('coat',a.coat),skin=material('skin',a.skin),dark=material('clothing','#252b33');
    box('torso',[.55,.68,.3],[0,1.15,0],coat,node);box('coat-tail',[.6,.35,.32],[0,.77,0],coat,node);
    for(const side of [-1,1]){box('leg',[.19,.65,.23],[side*.15,.36,0],dark,node);box('boot',[.22,.16,.36],[side*.15,.08,.05],dark,node);const arm=box('arm',[.16,.59,.19],[side*.37,1.14,0],coat,node);arm.rotation.z=side*.1;box('hand',[.14,.16,.16],[side*.4,.8,0],skin,node);}
    const head=b.MeshBuilder.CreateSphere('head',{diameter:.36,segments:12},scene);head.parent=node;head.position.y=1.7;head.scaling.y=1.2;head.material=skin;
    box('hair',[.36,.12,.34],[0,1.88,-.02],material('hair',a.hair),node);
    if(a.style==='beard')box('beard',[.28,.14,.08],[0,1.57,.15],material('hair',a.hair),node);
    if(a.style==='braids')for(let i=-2;i<=2;i++)box('braid',[.055,.4,.06],[i*.08,1.61,-.17],material('hair',a.hair),node);
    if(a.eye)box('cybernetic-eye',[.085,.06,.04],[.09,1.73,.177],material('implant',a.eye,true),node);
    if(a.style==='glasses')box('spectacles',[.31,.085,.045],[0,1.73,.18],dark,node);
    if(a.archive){node.getChildMeshes().forEach(m=>m.visibility=.6);box('archive-projector',[.8,.12,.6],[0,.05,0],material('archive','#70bdd6',true),node);}
    if(ambient){
      const pieces=node.getChildMeshes();for(const old of pieces){if(['torso','arm','leg','hair'].includes(old.name)){const size=old.getBoundingInfo().boundingBox.extendSize.scale(2),shape=old.name==='hair'?b.MeshBuilder.CreateSphere('crew-hair',{diameter:1,segments:12},scene):b.MeshBuilder.CreateCapsule(old.name,{height:size.y,radius:Math.min(size.x,size.z)/2,tessellation:10},scene);shape.parent=node;shape.position.copyFrom(old.position);shape.rotation.copyFrom(old.rotation);shape.material=old.material;if(old.name==='torso')shape.scaling.x=1.65;if(old.name==='hair')shape.scaling.set(size.x,.2,size.z);old.dispose();}}
      for(const x of [-.07,.07]){const eye=b.MeshBuilder.CreateSphere('crew-eye',{diameter:.035,segments:6},scene);eye.parent=node;eye.position.set(x,1.73,.162);eye.material=dark;}box('crew-nose',[.055,.08,.07],[0,1.67,.18],skin,node);box('crew-belt',[.46,.08,.33],[0,.86,0],dark,node);box('crew-badge',[.08,.13,.02],[-.15,1.3,.16],material('badge','#d1b879'),node);
    }
    node.metadata={placeholder:true,reference:'art/characters.png',character:id,ambient};actors.push({node,base:position.slice(),ambient});
    // A crowd look still downloading: the person waits hidden (no primitive stand-in) and appears when it arrives.
    if(look){waitingCrowd.push({node,look,id,parent});node.setEnabled(false);}return node;
  }
  // A crowd figure that was still downloading when the scene was built replaces its stand-in when it
  // arrives (asset-pipeline.js background models): same spot, facing, activity and cup.
  // If a look fails to download, its people take another look of the same place that has loaded (and the clip).
  root.VoidAssets?.onLoaded?.((id,ok=true)=>{if(!id.startsWith('crowd:'))return;const failedLook=id.slice(6);
   if(!ok){for(const p of waitingCrowd)if(p.look===failedLook){const cast=VoidCrowd.castFor(crowdLocation,p.id)||[],clip=VoidCrowd.clipFor(p.id),alt=cast.find(l=>l!==failedLook&&VoidAssets.container('crowd:'+l)&&VoidCrowd.clips[l]?.includes(clip))||cast.find(l=>l!==failedLook&&!VoidAssets.failed.has('crowd:'+l));if(alt){p.look=alt;console.info('[VOID//RUNNER crowd] '+p.id+': '+failedLook+' failed, using '+alt);}}
    const ready=[...new Set(waitingCrowd.map(p=>p.look))].filter(l=>VoidAssets.container('crowd:'+l));for(const l of ready)swapIn('crowd:'+l);return;}
   swapIn(id);});
  function swapIn(id){const look=id.slice(6);waitingCrowd=waitingCrowd.filter(p=>{if(p.look!==look)return true;if(p.node.isDisposed()||p.parent?.isDisposed?.())return false;const figure=VoidAssets.instance(id,p.parent);if(!figure)return true;figure.position.copyFrom(p.node.position);figure.rotation.copyFrom(p.node.rotation);figure.metadata={...figure.metadata,crowd:look,character:p.id,ambient:true};const actor=actors.find(a=>a.node===p.node),crowd=VoidCrowd.animate(figure,look,VoidCrowd.clipFor(p.id));if(actor){actor.node=figure;actor.crowd=crowd;if(actor.cup)actor.cup.parent=figure;}p.node.dispose();return false;});}
  // Places a layout's approved props. Each group replaces its procedural fittings only when every
  // model in the group loaded, so a missing file never leaves a hole. Collision is not touched.
  function placeProps(def,parent){
    const groups={};
    for(const p of def.props||[]){const g=groups[p.group]??={ok:true,replaces:new Set(),nodes:[]};for(const id of p.replaces||[])g.replaces.add(id);
      const node=VoidAssets.instance('prop:'+p.model,parent);if(!node){g.ok=false;continue;}node.position.set(...p.position);node.rotation.y=p.yaw||0;g.nodes.push(node);}
    for(const g of Object.values(groups)){
      if(!g.ok){for(const n of g.nodes)n.dispose();continue;}
      for(const m of parent.getChildMeshes(true))if(g.replaces.has(m.name))m.setEnabled(false);
    }
    // Which groups are modelled, so later passes (meridian-art.js) don't add their own versions.
    parent.metadata={...parent.metadata,propGroups:Object.fromEntries(Object.entries(groups).map(([k,g])=>[k,g.ok]))};
  }
  async function prepareStation(def,task){
    release(); // A new visit owns exactly one room and its actors, signs and lights.
    const propModels=Object.fromEntries((def.props||[]).filter(p=>VoidAssets.models.props?.[p.model]).map(p=>['prop:'+p.model,VoidAssets.models.props[p.model]]));
    crowdLocation=def.id;root.VoidCrowd?.begin();await prepareSpace(def.id,['raider','courier','shuttle','security',def.ship],task,{...(root.VoidCrowd?.models(def.id,quality)||{}),...propModels,...(def.rooms&&globalThis.VoidMeridianInteriorKit?VoidMeridianInteriorKit.definitions('ikit:'):{}),...Object.fromEntries(def.interactions.filter(i=>i.character&&VoidAssets.models.characters[i.character]).map(i=>['character:'+i.character,VoidAssets.models.characters[i.character]]))});task.check();station.setEnabled(false);rocks.forEach((mesh,i)=>{mesh.position.set((i%2?-1:1)*(75+i*6),30+Math.sin(i)*24,90+i*17);mesh.scaling.setAll(2+i%5);});
    roomRoot=stationModel(def.id,null,false,def);room=def;actors=[];waitingCrowd=[];stationActivity=def.activityPoints?VoidStationActivities.create(def):null;lastActivityTime=null;
    const ship=shipModel(def.ship,'friendly',roomRoot,{landed:true});ship.position.set(-7,2,-9);ship.scaling.setAll(2);landBoarding(def);
    for(const item of def.interactions)if(item.character)characterModel(item.character,roomRoot,item.visualPosition||item.position);
    if(stationActivity){for(const a of stationActivity.actors){const node=characterModel('crew-'+a.id,roomRoot,[a.x,0,a.z],true);actors[actors.length-1].activity=a;const cup=box('crew-cup',[.1,.16,.1],[.4,1.4,.2],material('cup','#b7b2a1'),node);cup.setEnabled(false);actors[actors.length-1].cup=cup;}}else for(let i=0;i<4;i++)characterModel('crew-'+i,roomRoot,[i<2?-13:13,0,i<2?-8+i*7:20+i*3],true);
    for(let i=0;i<5;i++)box('cargo-crate',[1.3,1.3,1.3],[12+(i%2)*1.5,.65,-17+Math.floor(i/2)*1.5],material('cargo','#716b56'),roomRoot);
    const colors=['#d47575','#78a5cf','#d39865','#84bd94','#b398cf'];
    const shelfZ=def.furniture?.store?.shelves;colors.forEach((c,i)=>shelfZ?box('outfitter-category',[.12,.6,.9],[-17.55,3.35,shelfZ[0]-.6+i*(shelfZ[shelfZ.length-1]-shelfZ[0]+1.2)/4],material('shop',c,true),roomRoot):box('outfitter-category',[.55,.9,.12],[-14+i*1.5,1.7,29],material('shop',c,true),roomRoot));
    for(let z=-20;z<32;z+=7){box('floor-guide',[.12,.025,3],[0,.03,z],material('guide','#80baaa',true),roomRoot);if(z<4||z>18)box('ceiling-light',[8,.06,.2],[0,z<4?8.7:5.7,z],material('lamp','#d1d4be',true),roomRoot);}
    for(const signDef of def.signs)sign(signDef,roomRoot);
    // Hangar / Maintenance is a real console: install, remove and configure equipment here (the outfitter only sells).
    for(const item of def.interactions.filter(i=>i.action==='maintenance'))maintenanceTerminal(item.position,roomRoot);
    // Props first: the fit-out then batches the remaining static pieces, skipping the hidden ones.
    placeProps(def,roomRoot);
    if(def.rooms){fitoutMeridian(roomRoot);if(def.id==='meridian')planet.position.set(340,-65,140);
      // Interior dressing from the reference sheet (meridian-interior-kit.js): visual only, after the fit-out so it is never merged.
      globalThis.VoidMeridianInteriorKit?.dress(scene,roomRoot,'ikit:');}
    const roomLight=new BABYLON.PointLight('concourse-light',new BABYLON.Vector3(0,4,25),scene);roomLight.parent=roomRoot;roomLight.diffuse=new BABYLON.Color3(1,.69,.38);roomLight.intensity=1.4;roomLight.range=28;
    const fill=new BABYLON.PointLight('hangar-light',new BABYLON.Vector3(-3,7,-9),scene);fill.parent=roomRoot;fill.diffuse=new BABYLON.Color3(1,.8,.76);fill.specular=new BABYLON.Color3(.5,.4,.38);fill.intensity=1.5;fill.range=34;fill.falloffType=BABYLON.Light.FALLOFF_STANDARD; // brighter, slightly red (David, 2026-10-23); range falloff so the PBR wall panels 15 m out still catch it
    // These routes are station-relative and visible through the observation apertures.
    for(let i=0;i<3;i++){const n=shipModel(i?'shuttle':'courier','neutral',roomRoot);n.metadata={...n.metadata,traffic:true,lane:i};actors.push({node:n,traffic:true,lane:i});}
    await task.wait('scene',()=>scene.whenReadyAsync(),'station-'+def.id);diagnostics.location=def.id;
  }

  function maintenanceTerminal([x,,z],parent){
    const b=B(),frame=material('maintenance-frame','#2c353b'),trim=material('maintenance-trim','#f2b33d',true),glow=material('maintenance-ring','#7fe0c8',true);
    const node=new b.TransformNode('hangar-maintenance-terminal',scene);node.parent=parent;node.position.set(x,0,z+1.25);node.rotation.y=Math.PI; // screen faces the hangar floor (-z)
    box('maintenance-base',[1.5,.9,.7],[0,.45,0],frame,node);box('maintenance-hazard',[1.52,.08,.72],[0,.06,0],trim,node);
    box('maintenance-arm',[.12,1.1,.12],[-.62,1.45,.12],frame,node);box('maintenance-arm',[.12,1.1,.12],[.62,1.45,.12],frame,node);
    const t=new b.DynamicTexture('maintenance-screen',{width:512,height:320},scene,true),g=t.getContext();
    g.fillStyle='#071419';g.fillRect(0,0,512,320);g.strokeStyle='#7fe0c8';g.lineWidth=6;g.strokeRect(10,10,492,300);
    g.fillStyle='#f2b33d';g.font='bold 44px monospace';g.textAlign='center';g.fillText('HANGAR /',256,92);g.fillText('MAINTENANCE',256,146);
    g.fillStyle='#bfeee2';g.font='bold 28px monospace';g.fillText('INSTALL · REMOVE',256,210);g.fillText('CONFIGURE EQUIPMENT',256,248);
    g.fillStyle='#7fe0c8';g.font='22px monospace';g.fillText('[E] OPEN',256,292);t.update();
    const sm=new b.StandardMaterial('maintenance-screen',scene);sm.diffuseTexture=t;sm.emissiveTexture=t;sm.disableLighting=true;
    node.onDisposeObservable.addOnce(()=>{sm.dispose(false,false);t.dispose();});
    const screen=b.MeshBuilder.CreatePlane('maintenance-screen',{width:1.3,height:.82},scene);screen.parent=node;screen.position.set(0,1.42,.05);screen.rotation.set(-.18,Math.PI,0);screen.material=sm; // faces -z (plane front is -z; turned to face the player)
    const ring=b.MeshBuilder.CreateTorus('maintenance-floor-ring',{diameter:2.6,thickness:.05,tessellation:40},scene);ring.parent=node;ring.position.set(0,.03,1.25);ring.material=glow;ring.isPickable=false;
    node.metadata={animated:true};for(const m of node.getChildMeshes())m.metadata={...m.metadata,animated:true};
  }
  function fitoutMeridian(parent){
    const b=B(),steel=material('brushed-steel','#454e55'),warm=material('lamp-warm','#ffd39a',true),rubber=material('rubber','#232a30'),copper=material('copper','#967053');
    const F=room?.furniture||VoidMeridianInterior.layout().furniture;
    scene.getLightByName('ambient').intensity=.22;scene.getLightByName('sun').intensity=.28;
    const R=room?.rooms||VoidMeridianInterior.rooms,C=R.corridor,H=R.hall;
    // Red light strips along the hangar's side walls, high and at the deck edge, for a slight red cast (no extra lights).
    {const G=R.hangar,red=material('hangar-red-strip','#ff3a2c',true),glowRed=material('hangar-red-soft','#7a1612',true);
     for(const x of [G.x0+.42,G.x1-.42]){box('hangar-red-strip',[.06,.08,G.z1-G.z0-2],[x,G.h-1.4,(G.z0+G.z1)/2],red,parent);box('hangar-red-strip',[.06,.05,G.z1-G.z0-2],[x,.12,(G.z0+G.z1)/2],red,parent);box('hangar-red-wash',[.03,1.2,G.z1-G.z0-2],[x+(x<0?.02:-.02),G.h-2.1,(G.z0+G.z1)/2],glowRed,parent);}}
    function pipe(x,y,z,length){const m=b.MeshBuilder.CreateCylinder('service-pipe',{diameter:.13,height:length,tessellation:10},scene);m.parent=parent;m.position.set(x,y,z);m.rotation.x=Math.PI/2;m.material=copper;}
    function luminaire(x,y,z,along='x'){const w=along==='x'?[1.8,.22,.45]:[.45,.22,1.8],d=along==='x'?[1.5,.04,.3]:[.3,.04,1.5];box('luminaire-housing',w,[x,y,z],steel,parent);box('warm-diffuser',d,[x,y-.14,z],warm,parent);}
    // The corridor: a line of ceiling lights, service pipes, ribs on both walls and deck joints. Ribs skip the doorways.
    for(let z=C.z0+2;z<C.z1;z+=4){luminaire(0,C.h-.12,z,'z');for(const s of [-1,1]){pipe(s*1.55,C.h-.3,z,4);box('floor-expansion-joint',[C.x1-C.x0,.018,.04],[0,.027,z+2],rubber,parent);}}
    for(let z=C.z0+1;z<C.z1;z+=2.4)for(const x of [C.x0+.1,C.x1-.1]){if(x<0&&(z>10.2&&z<13.8||z>25.2&&z<30.8))continue;box('corridor-rib',[.14,C.h-.1,.2],[x,(C.h-.1)/2,z],steel,parent);}
    for(const z of F.portholes){box('porthole-frame',[.12,1.12,1.62],[C.x1-.05,1.75,z],steel,parent);box('porthole-lamp',[.06,.08,1],[C.x1-.08,2.45,z],warm,parent);}
    // Living area and store: luminaires across each room.
    for(const r of [R.living,R.store])for(let z=r.z0+3;z<r.z1-1;z+=5)for(let x=r.x0+3;x<r.x1-1;x+=5)luminaire(x,r.h-.12,z);
    // The hall: two rows of lights, pipes along the bar wall, amber lamps on the solid wall, deck joints.
    for(let z=H.z0+3;z<H.z1-1;z+=4){for(const x of [-6,6])luminaire(x,H.h-.25,z);pipe(H.x0+.8,H.h-.35,z,4);box('pressure-frame',[.22,H.h-.5,.25],[H.x0+.2,(H.h-.5)/2,z],steel,parent);box('amber-wall-lamp',[.12,1.3,.15],[H.x0+.32,2.8,z],warm,parent);
     for(const x of [-12,-6,0,6,12])box('floor-expansion-joint',[.04,.018,4],[x,.027,z],rubber,parent);}
    for(const [x,z]of F.lights){const light=new b.PointLight('warm-crew-light',new b.Vector3(x,Math.min(4.6,(x>R.corridor.x0&&x<R.corridor.x1&&z<C.z1||z<R.hall.z0?C.h:H.h)-.5),z),scene);light.parent=parent;light.diffuse=new b.Color3(1,.68,.35);light.intensity=1.5;light.range=z<R.hall.z0?14:22;}
    for(const {x,z} of F.tables){const lamp=b.MeshBuilder.CreateCylinder('table-lamp',{diameterTop:.16,diameterBottom:.32,height:.24,tessellation:12},scene);lamp.parent=parent;lamp.position.set(x,1.12,z);lamp.material=warm;box('table-light-base',[.12,.16,.12],[x,.92,z],steel,parent);for(const s of [-1,1]){box('chair-metal-leg',[.08,.48,.08],[x+s*1.6,.24,z-.24],steel,parent);box('chair-metal-leg',[.08,.48,.08],[x+s*1.6,.24,z+.24],steel,parent);}}
    {const front=F.bar.x+.64,n=Math.floor(F.bar.length/3.4);for(let i=0;i<n;i++){const z=F.bar.z-F.bar.length/2+1.7+i*3.4;box('bar-service-panel',[.045,.76,3.1],[front,.65,z],steel,parent);box('bar-underlight',[.04,.035,3],[front+.05,1.04,z],warm,parent);}}
    // The mission terminal on the corridor's outer wall.
    {const T=F.terminal;box('crew-terminal',[.15,.7,1],[T.x-.08,1.3,T.z],steel,parent);box('terminal-display',[.04,.45,.8],[T.x-.17,1.4,T.z],material('screen','#74bba8',true),parent);box('terminal-stand',[.2,1,.18],[T.x-.05,.5,T.z],steel,parent);}
    parent.metadata={...parent.metadata,art:globalThis.VoidMeridianArt?.enhance({B:b,scene,parent,box,material,quality})};
    for(const m of parent.getChildMeshes())if(m.material)m.material.maxSimultaneousLights=8;
    // Static fittings share material batches; NPCs, signs and doors keep individual nodes.
    const batches=new Map();for(const m of parent.getChildMeshes()){if(m.parent!==parent||m.metadata?.stationDoor||m.metadata?.animated||!m.isVisible||!m.isEnabled())continue;const list=batches.get(m.material)||[];list.push(m);batches.set(m.material,list);}for(const [mat,list] of batches)if(list.length>1){const mesh=b.Mesh.MergeMeshes(list,true,true,undefined,false,false);mesh.name='meridian-interior-'+mat.name;mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;}

  }

  function planetTexture(id) {
    if(id==='meridian')return VoidMeridian.planetTexture(scene);
    const b = B(),
      t = new b.DynamicTexture('planet-map-' + id, {
        width: 512,
        height: 256
      }, scene, false),
      g = t.getContext();
    const gas = id === 'meridian',
      ocean = id === 'kepler' || id === 'earth',
      ice = id === 'rusthaven',
      pale = id === 'vigil',
      dust = id === 'holdfast';
    g.fillStyle = pale ? '#3e4952' : dust ? '#7b5a39' : ocean ? '#1b4662' : ice ? '#7a919b' : gas ? '#aa8366' : '#6c3826';
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 600; i++) {
      const x = (i * 137.29) % 512,
        y = (i * 73.61) % 256;
      g.fillStyle = pale ? i % 9 ? '#5b6873' : '#86dcf2' : dust ? i % 2 ? '#a07a4f' : '#4f3a26' : gas ? i % 2 ? '#cba789' : '#715747' : ocean ? i % 3 ? '#496a50' : '#a3bbc0' : ice ? '#bacbd0' : i % 2 ? '#a36642' : '#352b26';
      g.globalAlpha = .2 + (i % 3) * .12;
      g.beginPath();
      g.ellipse(x, y, gas ? 260 : 5 + i % 21, gas ? 2 + i % 4 : 3 + i % 12, .2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    t.update();
    return t;
  }
  let surfaceHandle=null;
  async function prepareSpace(id, shipTypes = ['raider', 'interceptor', 'gunship', 'courier', 'security', 'shuttle'], task,extraModels={}) {
    if(!task) return VoidPreparation.run(t=>prepareSpace(id,shipTypes,t,extraModels));
    await initialize(task);
    scene.getLightByName('ambient').intensity=.48;scene.getLightByName('sun').intensity=1.5;
    task.check();
    if (activeLocation === id && spaceRoot && diagnostics.exteriorReady) {
      spaceRoot.setEnabled(true);
      roomRoot?.setEnabled(false);
      room = null;
      return;
    }
    release();
    const b = B();
    spaceRoot = new b.TransformNode('space-' + id, scene);
    activeLocation = id;
    room = null;
    scene.clearColor = new b.Color4(.008, .018, .035, 1);
    await task.wait('assets',()=>VoidAssets.prepare(scene, {
      ...extraModels,
      ...(id==='vesper'?Object.fromEntries(Object.entries(VoidOpening.hooks).filter(([,d])=>d.src).map(([key,d])=>['opening:'+key,d])):{}),
      ...Object.fromEntries(Object.entries(VoidAssets.models.ships).filter(([key]) => shipTypes.includes(key)).map(([key, value]) => ['ship:' + key, value])),
      // Meridian's hull cladding (meridian-kitbash.js), so every scene that shows Meridian clads it.
      ...(VoidStationLayouts.meridianClass.includes(id)&&globalThis.VoidMeridianKitbash?VoidMeridianKitbash.definitions('kit:'):{}),
      ...((VoidAssets.models.stations[id]||(id==='meridian'&&VoidMeridian.model.src?VoidMeridian.model:null)) ? {
        ['station:' + id]: VoidAssets.models.stations[id]||VoidMeridian.model
      } : {})
    },task), 'registered space models');
    const texturePath = ['meridian', 'kepler', 'rusthaven', 'foundry'].includes(id) ? id : 'kepler';
    sky = b.MeshBuilder.CreateSphere('painted-sky', {
      diameter: 3000,
      segments: 16,
      sideOrientation: b.Mesh.BACKSIDE
    }, scene);
    sky.parent = spaceRoot;
    const skyMat = material('sky-' + id, '#ffffff', true);
    skyMat.emissiveColor = new b.Color3(.012, .023, .047);
    skyMat.backFaceCulling = false;
    // Stars and procedural planets are always ready; bitmap skies are optional art references.
    sky.material = skyMat;
    const starMat = material('stars', '#b3c6d3', true),
      starSource = b.MeshBuilder.CreateSphere('star-source', {
        diameter: 1.5,
        segments: 3
      }, scene);
    starSource.parent = spaceRoot;
    starSource.material = starMat;
    starSource.isVisible = false;
    for (let i = 0; i < presets[quality].stars; i++) {
      const y = 1 - 2 * (i + .5) / presets[quality].stars,
        a = i * 2.399963,
        r = Math.sqrt(1 - y * y),
        s = starSource.createInstance('star');
      s.parent = spaceRoot;
      s.position.set(Math.cos(a) * r * 1250, y * 1250, Math.sin(a) * r * 1250);
      s.scaling.setAll(i % 7 === 0 ? 1.6 : .7);
    }
    planet = b.MeshBuilder.CreateSphere('planet', {
      diameter: 330,
      segments: quality === 'low' ? 24 : 48
    }, scene);
    planet.parent = spaceRoot;
    planet.position.set(id === 'kepler' ? -330 : 330, 125, 800);
    const pm = material('planet-' + id, '#ffffff');
    pm.diffuseTexture = planetTexture(id);
    pm.specularColor = new b.Color3(.03, .03, .03);
    planet.material = pm;
    if (id === 'meridian') {
      const ring = b.MeshBuilder.CreateTorus('planet-ring', {
        diameter: 430,
        thickness: 45,
        tessellation: 96
      }, scene);
      ring.parent = planet;
      ring.material = material('ring', '#9e8875', false, .65);
      ring.rotation.z = .3;
      ring.rotation.x = .4;
      ring.scaling.y = .025;
    }
    if(id==='vesper'){
      station=new b.TransformNode('vesper-surface',scene);station.parent=spaceRoot;
      surfaceHandle=VoidOpeningScene.build({scene,parent:station,quality,shadowLight:scene.getLightByName('sun'),characterModel,shipModel,state,camera});
      surfaceHandle.ship.setEnabled(false); // The player is now inside this ship.
      sky.setEnabled(false);planet.setEnabled(false);
      for(const mesh of spaceRoot.getChildMeshes())if(mesh.name==='star')mesh.setEnabled(false);
    }else station = stationModel(id, spaceRoot,true);
    station.position.set(0, 0, -100);
    rockSource = b.MeshBuilder.CreateIcoSphere('rock-source', {
      radius: 1,
      subdivisions: 2,
      flat: true
    }, scene);
    const positions = rockSource.getVerticesData(b.VertexBuffer.PositionKind),
      normals = [];
    for (let i = 0; i < positions.length; i += 3) {
      const rough = .83 + .18 * Math.sin(positions[i] * 13 + positions[i + 1] * 9 + positions[i + 2] * 7);
      for (let j = 0; j < 3; j++) positions[i + j] *= rough;
    }
    b.VertexData.ComputeNormals(positions, rockSource.getIndices(), normals);
    rockSource.setVerticesData(b.VertexBuffer.PositionKind, positions);
    rockSource.setVerticesData(b.VertexBuffer.NormalKind, normals);
    rockSource.material = material('rock', '#77716a');
    rockSource.parent = spaceRoot;
    rockSource.isVisible = false;
    for (let i = 0; i < presets[quality].rocks; i++) {
      const m = rockSource.createInstance('asteroid');
      m.parent = spaceRoot;
      rocks.push(m);
    }
    // Compile and fetch the current exterior before the launch clock may advance.
    try {

      await task.wait('scene',()=>scene.whenReadyAsync(), 'space-'+id);
    } catch (error) {
      clearSpace();
      throw error;
    }
    diagnostics.preparations++;
    diagnostics.location = id;
    diagnostics.exteriorReady = true;
  }

  function clearSpace() {
    cockpit?.dispose();cockpit=null;
    station?.metadata?.dispose?.();
    surfaceHandle?.dispose();surfaceHandle=null;
    disposeNode(spaceRoot);
    spaceRoot = null;
    rocks = [];
    ships.clear();
    effects.clear();
    pools = {};
    poolSources = {};
    VoidAssets.release();
    // Per-location texture/material ownership prevents accumulating destination assets.
    for (const [key, m] of Object.entries(materials))
      if (key.startsWith('sky-') || key.startsWith('planet-')) {
        m.dispose(false, true);
        delete materials[key];
      }
    activeLocation = null;
    diagnostics.exteriorReady = false;
  }

  function pool(kind, index, hex) {
    const list = pools[kind] ??= [];
    if (!poolSources[kind]) {
      const source = B().MeshBuilder.CreateSphere(kind + '-source', {
        diameter: 1,
        segments: 4
      }, scene);
      source.material = material(kind, hex, true);
      source.parent = spaceRoot;
      source.isVisible = false;
      poolSources[kind] = source;
    }
    if (!list[index]) {
      const m = poolSources[kind].createInstance(kind);
      m.parent = spaceRoot;
      list.push(m);
    }
    return list[index];
  }

  function setPool(kind, items, hex, size) {
    items.forEach((o, i) => {
      const m = pool(kind, i, hex);
      m.setEnabled(true);
      m.position.copyFrom(vector(o));
      m.scaling.set(size, size, size * 5);
      const dir = o.direction || {
        x: o.vx || 0,
        y: o.vy || 0,
        z: o.vz || 1
      };
      m.lookAt(m.position.add(vector(dir)));
    });
    (pools[kind] || []).slice(items.length).forEach(m => m.setEnabled(false));
  }

  function resize(width, height) {
    const scale = presets[quality].scale,
      w = Math.min(2560, Math.round(width / scale)),
      h = Math.min(1600, Math.round(height / scale));
    if (w !== lastWidth || h !== lastHeight) {
      engine.setSize(w, h);
      lastWidth = w;
      lastHeight = h;
    }
  }

  function renderFlight(snapshot, width, height) {
    if (!engine || !diagnostics.ready || !spaceRoot) return null;
    resize(width, height);
    spaceRoot.setEnabled(true);
    roomRoot?.setEnabled(false);
    const b = B(),
      basis = snapshot.basis;
    camera.position.set(0, 0, 0);
    camera.upVector.set(-basis.u.x, basis.u.y, -basis.u.z);
    camera.setTarget(vector(basis.f));
    const focal = Math.min(width, height) * .82,
      projection = b.Matrix.PerspectiveFovLH(2 * Math.atan(height / (2 * focal)), width / height, .1, 3500);
    projection.m[9] = .12;
    camera.freezeProjectionMatrix(projection);
    cockpit??=root.VoidCockpit3D.build(scene,camera);
    // The painted cockpit overlay replaces the box cockpit once its image has loaded.
    const painted=root.VoidCockpitOverlay?.ready===true;
    cockpit.setEnabled(!painted);
    if(!painted){cockpit.sync();cockpit.update(snapshot.instruments,snapshot.time);}
    const phase = snapshot.route?.phase || 'encounter',
      arrival = phase === 'arrived',
      warp = phase === 'warp',
      progress = snapshot.route?.progress || 0;
    rocks.forEach((mesh, i) => {
      const r = snapshot.rocks[i % snapshot.rocks.length];
      mesh.setEnabled(!!r);
      if (r) {
        mesh.position.copyFrom(vector(r));
        if (i >= snapshot.rocks.length) mesh.position.x += 50;
        mesh.scaling.set(r.size * (.7 + i % 3 * .18), r.size, r.size * .85);
        mesh.rotation.set(r.phase, snapshot.time * .04 + r.phase, 0);
      }
    });
    planet.rotation.y = snapshot.time * .008;
    const destinationVisible = (warp && progress*VoidWarp.config.warpSeconds>=VoidWarp.config.destinationRevealSeconds || arrival) && activeLocation===snapshot.route?.destination;
    const atOrigin = (phase==='departure'||phase==='align') && progress===0 && activeLocation===snapshot.route?.origin;
    station.setEnabled(destinationVisible || atOrigin);
    if (destinationVisible) {
      const reveal = Math.max(0, (progress * 12 - 8) / 4);
      // H01 opens along local -Z, directly into the player's +Z approach.
      // Keep the station's physical orientation and move through that opening.
      station.rotation.y=0;
      const approach=Math.max(0,Math.min(1,(snapshot.approach||0)/VoidWarp.config.approachSeconds));
      station.position.set(0,-4,arrival?120-105*approach:1500-reveal*1380);
    } else if(atOrigin){station.rotation.y=Math.PI;station.position.copyFrom(vector(snapshot.departureStation || {x:0,y:4,z:-15}));}
    station.metadata?.arrays?.forEach((n,i)=>n.rotation.z=.14+Math.sin(snapshot.time*.015+i*.2)*.08);
    if(station.metadata?.doors)station.metadata.doors.forEach((d,i)=>d.position.x=(i?1:-1)*(5+10*(phase==='departure'?Math.min(1,(snapshot.route.departure||0)/1.2):1)));
    if(surfaceHandle){
      const lift=atOrigin?3+Math.pow(Math.min(4,snapshot.route.departure||0),2)*4:Math.max(3,45-(snapshot.approach||0)*40);
      station.rotation.y=0;station.position.set(-12,-lift,atOrigin?(snapshot.departureStation?.z||-15)-10:-25);
      rocks.forEach(mesh=>mesh.setEnabled(false));
    }
    diagnostics.surfaceDeparture=!!surfaceHandle&&atOrigin;
    diagnostics.stationVisible=!surfaceHandle&&station.isEnabled();
    diagnostics.stationPosition=station.position.asArray();
    const present = new Set();
    for (const e of snapshot.ships) {
      present.add(e);
      let node = ships.get(e);
      if (!node) {
        node = shipModel(e.className || 'ship', VoidStory.relationship(e), spaceRoot);
        if(e.traffic){
          const wake=b.MeshBuilder.CreateSphere('traffic-warp-wake',{diameter:2,segments:6},scene);
          wake.parent=node;wake.material=material('traffic-warp','#b7dce8',true,.75);wake.position.z=-3;
          node.metadata={...node.metadata,warpWake:wake};
        }
        ships.set(e, node);
      }
      node.position.copyFrom(vector(e));
      node.scaling.setAll((e.size || 1) * 1.5);
      const v = e.velocity || {
        x: 0,
        y: 0,
        z: -1
      };
      node.rotation.y = Math.atan2(v.x, v.z);
      node.rotation.x = Math.atan2(v.y, Math.hypot(v.x, v.z));
      // Battle wrecks tumble slowly and read darker than live ships.
      if (e.wreck) {node.rotation.z = (e.spin || .3) * snapshot.time;node.rotation.x += (e.spin || .3) * .4 * snapshot.time;if (!node.metadata?.wrecked) {node.getChildMeshes().forEach(m => m.visibility = .7);node.metadata = {...node.metadata, wrecked: true};}}
      const wake=node.metadata?.warpWake;
      if(wake){wake.setEnabled(e.warp>0);wake.scaling.set(1+e.warp*2,1+e.warp*2,1+e.warp*25);node.scaling.z*=1+e.warp*5;node.getChildMeshes().forEach(m=>m.visibility=1-e.warp);}
    }
    for (const [e, node] of ships)
      if (!present.has(e)) {
        node.dispose();
        ships.delete(e);
      }
    setPool('laser', snapshot.bullets, '#75ffe0', .16);
    setPool('hostile', snapshot.hostile, '#ff715f', .2);
    // Faction battle bolts: precise cyan Communion fire, heavier amber Natural Order bursts.
    const factionShots = snapshot.factionShots || [];
    setPool('communion-bolt', factionShots.filter(q => q.side === 'communion'), '#8ff0ff', .12);
    setPool('order-bolt', factionShots.filter(q => q.side !== 'communion'), '#ffae4a', .19);
    setPool('missile', snapshot.missiles, '#ffca7d', .35);
    let count = 0;
    const activeEffects = new Set(snapshot.effects.slice(-12));
    for (const [cloud, visual] of effects)
      if (!activeEffects.has(cloud)) {
        visual.forEach(m => m.dispose());
        effects.delete(cloud);
      }
    for (const cloud of activeEffects) {
      const t = cloud.age / cloud.life;
      let visual = effects.get(cloud);
      if (!visual) {
        visual = [effectPlane(cloud.kind === 'impact' ? 'impact' : 'plasma'), effectPlane('ring'), effectPlane('smoke')];
        effects.set(cloud, visual);
      }
      for (const m of visual) m.position.copyFrom(vector(cloud));
      visual[0].scaling.setAll(cloud.size * (3 + t * 4));
      visual[0].visibility = Math.max(0, 1 - t / .7);
      visual[1].scaling.setAll(cloud.size * (1 + t * 13));
      visual[1].visibility = Math.max(0, (1 - t) * .65);
      visual[2].scaling.setAll(cloud.size * (2 + t * 7));
      visual[2].visibility = Math.max(0, Math.sin(t * Math.PI) * .4);
      for (const p of cloud.particles) {
        if (p.smoke || count >= presets[quality].fragments) continue;
        const m = pool('fragment', count++, '#ffc177');
        m.setEnabled(true);
        m.position.copyFrom(vector({
          x: cloud.x + p.vx * cloud.age,
          y: cloud.y + p.vy * cloud.age,
          z: cloud.z + p.vz * cloud.age
        }));
        m.scaling.set(.06 * cloud.size, .06 * cloud.size, Math.max(.05, cloud.size * p.scale * .35 * (1 - t)));
        m.lookAt(m.position.add(vector({
          x: p.vx,
          y: p.vy,
          z: p.vz
        })));
        m.visibility = Math.max(0, 1 - t);
      }
    }
    (pools.fragment || []).slice(count).forEach(m => m.setEnabled(false));
    scene.render();
    diagnostics.frames++;
    diagnostics.meshCount = scene.meshes.length;
    return surface;
  }

  function sign(def, parent) {
    const b = B(),
      mesh = b.MeshBuilder.CreatePlane('sign-' + def.id, {
        width: Math.min(14, def.text.length * .29),
        height: 1.15,
        sideOrientation: b.Mesh.DOUBLESIDE
      }, scene);
    mesh.parent = parent;
    mesh.position.set(...def.position);
    mesh.rotation.y = def.rotation || 0;
    const t = new b.DynamicTexture('sign-content', {
        width: 1024,
        height: 128
      }, scene, false),
      g = t.getContext();
    g.fillStyle = '#0a141bea';
    g.fillRect(0, 0, 1024, 128);
    g.strokeStyle = def.color;
    g.strokeRect(8, 8, 1008, 112);
    g.fillStyle = def.color;
    g.font = 'bold 35px monospace';
    g.textAlign = 'center';
    g.fillText(def.text, 512, 78);
    t.update();
    const m = new b.StandardMaterial('sign-material', scene);
    m.diffuseTexture = t;
    m.emissiveColor = color(def.color);
    m.disableLighting = true;
    m.backFaceCulling = false;
    m.alpha = .9;
    mesh.material = m;
    signs.push({
      mesh,
      def,
      texture: t,
      material: m
    });
    return mesh;
  }
  let openingHandle=null,derelictHandle=null,districtHandle=null,planetHandle=null,vrHandle=null;
  async function prepareRoom(def, task) {
    if(!task)return VoidPreparation.run(t=>prepareRoom(def,t));
    if(def.kind==='station')return prepareStation(def,task);
    await initialize(task);
    release();
    const b = B();
    roomRoot = new b.TransformNode('room', scene);
    room = def;
    camera.unfreezeProjectionMatrix();
    if(def.kind==='workshop'){
      crowdLocation='vesper';root.VoidCrowd?.begin();const definitions={...(root.VoidCrowd?.models('vesper',quality)||{}),...Object.fromEntries(Object.entries(VoidOpening.hooks).filter(([,d])=>d.src).map(([id,d])=>['opening:'+id,d]))};
      if(VoidAssets.models.ships.starter)definitions['ship:starter']=VoidAssets.models.ships.starter;
      await task.wait('assets',()=>VoidAssets.prepare(scene,definitions,task),'workshop models');
      openingHandle=VoidOpeningScene.build({scene,parent:roomRoot,quality,shadowLight:scene.getLightByName('sun'),characterModel,shipModel,state,camera});
      await task.wait('scene',()=>scene.whenReadyAsync(),'workshop');
      diagnostics.location=def.name;diagnostics.meshCount=scene.meshes.length;return;
    }
    if(def.district&&root.VoidNeoChinatown){
      crowdLocation='neochinatown';root.VoidCrowd?.begin();await task.wait('assets',()=>VoidAssets.prepare(scene,{...(root.VoidCrowd?.models('neochinatown',quality)||{}),...(VoidNeoChinatown.models||{})},task),'district models');
      districtHandle=VoidNeoChinatown.build({scene,parent:roomRoot,quality,characterModel,shipModel,state:typeof state!=='undefined'?state:{},instance:(id,parent)=>VoidAssets.instance(id,parent)});landBoarding(def);
      await task.wait('scene',()=>scene.whenReadyAsync(),'neochinatown');
      diagnostics.location=def.name;diagnostics.meshCount=scene.meshes.length;return;
    }
    if(def.planet&&root.VoidPlanets){crowdLocation=def.planet;root.VoidCrowd?.begin();await task.wait('assets',()=>VoidAssets.prepare(scene,root.VoidCrowd?.models(def.planet,quality)||{},task),'crowd models');
      planetHandle=VoidPlanets.build(def.planet,{scene,parent:roomRoot,quality,characterModel,shipModel,state:typeof state!=='undefined'?state:{}});landBoarding(def);
      await task.wait('scene',()=>scene.whenReadyAsync(),'homeworld');
      diagnostics.location=def.name;diagnostics.meshCount=scene.meshes.length;return;
    }
    // VR arcade simulations (vr-core.js): each experience builds its own world here.
    if(def.vr&&root.VoidVR){vrHandle=await root.VoidVR.buildWorld(def,{scene,parent:roomRoot,quality,task,camera,characterModel,assets:VoidAssets});
      await task.wait('scene',()=>scene.whenReadyAsync(),'vr');diagnostics.location=def.name;diagnostics.meshCount=scene.meshes.length;return;}
    if(def.kind==='derelict'){
      derelictHandle=VoidDerelictStation.build({scene,parent:roomRoot,quality,shipModel});
      await task.wait('scene',()=>scene.whenReadyAsync(),'derelict station');
      diagnostics.location=def.name;diagnostics.meshCount=scene.meshes.length;return;
    }
    crowdLocation=def.id;root.VoidCrowd?.begin();const definitions = {...(root.VoidCrowd?.models(def.id,quality)||{}),...Object.fromEntries((def.models || []).map(m => [m.id, m]))};
    const hullId=def.ship||'starter';if(VoidAssets.models.ships[hullId])definitions['ship:'+hullId]=VoidAssets.models.ships[hullId];
    await task.wait('assets',()=>VoidAssets.prepare(scene, definitions,task),'room models');
    for (const defn of def.models || []) {
      const node = VoidAssets.instance(defn.id, roomRoot);
      node.position.set(...defn.position);
    }
    const concrete = material('concrete', def.color),
      dark = material('floor', '#222e33');
    box('floor', [def.bounds[0] * 2, .3, def.bounds[1] * 2], [0, -.15, 0], dark, roomRoot);
    for (const side of [-1, 1]) {
      box('side-wall', [.6, 9, def.bounds[1] * 2], [side * def.bounds[0], 4.5, 0], concrete, roomRoot);
      box('end-wall', [def.bounds[0] * 2, 9, .6], [0, 4.5, side * def.bounds[1]], concrete, roomRoot);
    }
    if (def.kind !== 'city') box('ceiling', [def.bounds[0] * 2, .3, def.bounds[1] * 2], [0, 10, 0], concrete, roomRoot);
    for (const s of def.solids)
      if (s.id !== 'ship') box(s.id, s.size, s.position, concrete, roomRoot);
    // Modest repeated industrial detail; shared materials, no shadow-map passes.
    for (let z = -def.bounds[1] + 4; z < def.bounds[1]; z += 8) {
      for (const side of [-1, 1]) {
        box('wall-rib', [.35, 8, .5], [side * (def.bounds[0] - .5), 4, z], material('rib', '#23333b'), roomRoot);
        box('service-panel', [.1, 1.3, 2], [side * (def.bounds[0] - .35), 2, z + 1.8], material('panel', '#566464'), roomRoot);
        if (def.kind !== 'city') box('ceiling-lamp', [2, .1, .4], [side * 7, 9.7, z], material('lamp', '#bdcab5', true), roomRoot);
      }
      if (def.kind !== 'city') box('ceiling-beam', [def.bounds[0] * 2, .5, .4], [0, 9.2, z], material('rib', '#23333b'), roomRoot);
    }
    if (def.kind === 'hangar')
      for (let i = 0; i < 6; i++) box('cargo-crate', [1.6, 1.4, 1.6], [10 + i % 2 * 1.7, .7 + Math.floor(i / 4) * 1.4, -15 + Math.floor(i / 2) % 2 * 1.7], material('crate', '#6a6653'), roomRoot);
    for (let z = -def.bounds[1] + 3; z < def.bounds[1]; z += 8) {
      for (const x of [-def.bounds[0] + 1, def.bounds[0] - 1]) box('strip', [.15, .12, 3], [x, .03, z], material('strip', '#9cbaac', true), roomRoot);
      box('floor-seam', [def.bounds[0] * 2, .012, .035], [0, .02, z], material('seam', '#0b181e'), roomRoot);
    }
    for (const item of def.interactions) {
      if (item.character) {
        const figure = box('npc-' + item.character, [.65, 1.25, .45], [(item.visualPosition||item.position)[0], .95, (item.visualPosition||item.position)[2]], material('coat', '#4d5a58'), roomRoot);
        figure.metadata = {
          placeholder: true,
          character: item.character
        };
        const head = b.MeshBuilder.CreateSphere('npc-head', {
          diameter: .38,
          segments: 8
        }, scene);
        head.position.set((item.visualPosition||item.position)[0], 1.75, (item.visualPosition||item.position)[2]);
        head.material = material('skin', '#ad8d73');
        head.parent = roomRoot;
      } else if (item.action !== 'board') box('terminal', [.65, 1.4, .35], [item.position[0], .7, item.position[2] + .4], material('terminal', '#466966'), roomRoot);
    }
    if (['hangar','city','underground'].includes(def.kind)) {
      const ship = shipModel(def.ship||'starter', 'friendly', roomRoot);
      ship.position.set(-7, 2, def.kind==='hangar'?-5:-24);
      ship.scaling.setAll(2);
      for (const x of [-9, -5]) box('landing-strut', [.25, 1.5, .3], [x, .75, -6], material('rib', '#23333b'), roomRoot);
    }
    if (def.kind === 'city') {
      characterModel('admin',roomRoot,[-2,0,39]);characterModel('iris',roomRoot,[2,0,39]);
      scene.clearColor = new b.Color4(.12, .15, .17, 1);
      for (let i = 0; i < 14; i++) box('distant-skyline', [8, 12 + i % 5 * 4, 9], [-65 + i * 10, 6 + i % 5 * 2, 65], material('skyline', '#354149'), roomRoot);
      box('entrance', [3, 3, .2], [0, 1.5, 31], material('door', '#182e32'), roomRoot);
    } else scene.clearColor = new b.Color4(.015, .022, .028, 1);
    for (const defn of def.signs) sign(defn, roomRoot);
    await task.wait('scene',()=>scene.whenReadyAsync(),'room-'+def.id);
    diagnostics.location = def.name;
    diagnostics.meshCount = scene.meshes.length;
  }

  // First-person Ward pistol for rooms other than Vesper (which builds its own). Same pieces, colours and poses.
  let handGun=null;
  function handWeapon(drawn,aim=false,reloading=false){
    const camera=scene?.activeCamera;if(!camera)return;
    if(handGun&&(handGun.isDisposed()||handGun.parent!==camera)){handGun.dispose();handGun=null;}
    if(!handGun){if(!drawn)return;const b=B();handGun=new b.TransformNode('hand-ward-pistol',scene);handGun.parent=camera;
      const steel=material('hand-pistol-steel','#464b4a'),dark=material('hand-pistol-rubber','#222b2e'),sight=material('hand-pistol-sight','#b4773a');
      for(const [name,size,p,m] of [['pistol-slide',[.065,.085,.29],[0,0,0],steel],['pistol-grip',[.058,.14,.08],[0,-.085,-.07],dark],['pistol-front-sight',[.012,.014,.018],[0,.048,.12],sight],['pistol-rear-sight',[.06,.02,.022],[0,.05,-.105],dark]]){
        const mesh=b.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);mesh.parent=handGun;mesh.position.set(...p);mesh.material=m;mesh.renderingGroupId=1;mesh.isPickable=false;}}
    handGun.setEnabled(drawn);handGun.position.set(aim?0:.21,reloading?-.40:aim?-.07:-.23,aim?.5:.55);handGun.rotation.set(reloading?.65:0,0,reloading?.4:0);
  }
  function clearRoom() {
    root.VoidRelayScreens?.release();
    handGun?.dispose();handGun=null;
    roomRoot?.metadata?.art?.dispose?.();
    roomRoot?.metadata?.exterior?.metadata?.dispose?.();
    openingHandle?.dispose();openingHandle=null;root.VoidCrowd?.release();
    derelictHandle?.dispose();derelictHandle=null;districtHandle?.dispose();districtHandle=null;planetHandle?.dispose();planetHandle=null;vrHandle?.dispose?.();vrHandle=null;
    for (const s of signs) {
      s.texture.dispose();
      s.material.dispose();
    }
    signs = [];
    disposeNode(roomRoot);
    roomRoot = null;
    room = null;actors=[];waitingCrowd=[];stationActivity=null;lastActivityTime=null;
  }

  function renderRoom(player, width, height, time, allowed = () => true) {
    if (!roomRoot) return null;
    cockpit?.setEnabled(false);
    resize(width, height);
    camera.unfreezeProjectionMatrix();
    camera.fov = openingHandle&&camera.metadata?.openingAim ? .8 : 1.05;
    camera.position.set(player.x, player.y, player.z);
    camera.upVector.set(0, 1, 0);
    camera.rotation.set(player.pitch, player.yaw, 0);
    for (const s of signs) {
      s.mesh.setEnabled(!s.def.when || allowed(s.def.when));
      s.material.alpha = s.def.animation === 'flicker' ? .72 + Math.sin(time * 13) * .07 : s.def.animation === 'pulse' ? .8 + Math.sin(time) * .08 : .9;
      if (s.def.animation === 'rotate') s.mesh.rotation.y = time * .2;
    }
    const roomDt=lastRoomTime===null?0:Math.min(.1,Math.max(0,time-lastRoomTime));lastRoomTime=time;
    if(stationActivity){VoidStationActivities.step(stationActivity,lastActivityTime===null?0:Math.min(.1,Math.max(0,time-lastActivityTime)));lastActivityTime=time;}
    // Doors slide rather than snap. Inner doors open for crew walking through and close behind them, unless the player opened them.
    for(const mesh of roomRoot.getChildMeshes()){const d=mesh.metadata?.stationDoor;if(!d)continue;
      if(stationActivity&&d.id!=='crew-pressure-door'){const near=(x,z,m)=>Math.abs(x-d.position[0])<d.size[0]/2+m&&Math.abs(z-d.position[2])<d.size[2]/2+m,crew=stationActivity.actors.some(a=>near(a.x,a.z,1.6));
        if(crew&&!d.open){d.open=true;d.byCrew=true;}else if(!crew&&d.byCrew&&!near(player.x,player.z,1.2)){d.open=false;d.byCrew=false;}}
      const target=d.position[1]+(d.open?3.5:0);mesh.position.y+=(target-mesh.position.y)*(roomDt?Math.min(1,roomDt*5):1);}
    for(const actor of actors){if(actor.crowd){const a=actor.activity;if(a){actor.node.position.set(a.x,0,a.z);actor.node.rotation.y=turnToward(actor.node.rotation.y,a.yaw,roomDt*6);actor.cup?.setEnabled(false);crewClip(actor,a,time);}else if(actor.ambient&&!actor.crowd.busy)vary(actor,actor.crowd,actor.base?.clip||VoidCrowd.clipFor(actor.node.metadata?.character||''),roomDt);continue;}if(actor.activity){const a=actor.activity,seated=a.state==='sit'||a.state==='drink';actor.node.position.set(a.x,seated?-.35:0,a.z);actor.node.rotation.y=a.yaw;actor.cup?.setEnabled(a.state==='drink'||a.state==='get-drink');for(const mesh of actor.node.getChildMeshes()){if(mesh.name==='arm')mesh.rotation.x=a.state==='walk'?Math.sin(time*5+a.id)*.25:a.state==='talk'?Math.sin(time*2+a.id)*.15:a.state==='drink'?-.9+Math.sin(time)*.15:a.gesture==='device'?-.65:0;if(mesh.name==='leg')mesh.rotation.x=seated?-1.15:a.state==='walk'?Math.sin(time*5+(mesh.position.x<0?Math.PI:0))*.3:0;if(mesh.name==='head')mesh.rotation.y=a.gesture==='look'?Math.sin(time)*.18:0;}continue;}if(openingHandle&&actor.node===openingHandle.mara)continue;if(actor.traffic){actor.node.position.set((actor.lane%2?-1:1)*(25+actor.lane*8),5+actor.lane*2,((time*(5+actor.lane)+actor.lane*37)%140)-55);actor.node.rotation.y=0;}else{actor.node.rotation.y=Math.sin(time*.3+actor.base[0])*.13;if(actor.ambient)actor.node.position.z=actor.base[2]+Math.sin(time*.2+actor.base[0])*1.2;}}
    roomRoot.metadata?.arrays?.forEach((n,i)=>n.rotation.z=.14+Math.sin(time*.015+i*.2)*.08);
    openingHandle?.tick(time);districtHandle?.tick(time);planetHandle?.tick(time);vrHandle?.tick?.(time);
    scene.render();
    diagnostics.frames++;
    return surface;
  }

  function qualitySet(value) {
    quality = presets[value] ? value : 'medium';
    lastWidth = 0;
    if (scene && camera) look.apply(scene, camera, quality);
    if (menuHandle?.scene?.activeCamera) look.apply(menuHandle.scene, menuHandle.scene.activeCamera, quality);
  }

  function release() {
    clearRoom();
    clearSpace();
    for (const m of Object.values(materials)) m.dispose(false, true);
    materials = {};
  }
  let menuHandle=null,menuPromise=null,menuTask=null,menuGeneration=0;
  function releaseMenu(){menuGeneration++;menuTask?.cancel();menuHandle?.dispose();menuHandle=null;diagnostics.menuReady=false;}
  function prepareMenu(){if(menuHandle)return Promise.resolve();if(menuPromise)return menuPromise;const generation=menuGeneration;
    menuPromise=VoidPreparation.run(async task=>{menuTask=task;await initialize(task);const next=await VoidMeridian.menu(engine,quality,task);if(generation!==menuGeneration){next.dispose();return;}menuHandle=next;diagnostics.menuReady=true;diagnostics.menuMeshes=next.scene.meshes.length;}).finally(()=>{menuTask=null;menuPromise=null;});return menuPromise;
  }
  function renderMenu(width,height,time,reduced){if(!menuHandle)return null;resize(width,height);menuHandle.render(time,width,height,reduced);return surface;}
  root.VoidBabylon = {prepareMenu,renderMenu,releaseMenu,get menuScene(){return menuHandle?.scene;},
    resizeViewport(width,height){if(engine)resize(width,height);},
    initialize,
    handWeapon,
    prepareSpace,
    prepareRoom,
    renderFlight,
    renderRoom,
    release,
    setQuality: qualitySet,
    presets,
    diagnostics,
    get quality() {
      return quality;
    },
    get opening(){return openingHandle;},get district(){return districtHandle;},
    get scene() {
      return scene;
    }
  };
})(globalThis);
