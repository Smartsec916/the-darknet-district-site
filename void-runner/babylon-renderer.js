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
  let engine, scene, camera, surface, loadPromise, spaceRoot, roomRoot, planet, station, sky, rockSource, rocks = [],
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

  function script() {
    if (root.BABYLON) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/babylon-8.26.0.js', base);
      s.onload = resolve;
      s.onerror = () => {
        s.remove();
        reject(Error('Babylon engine unavailable.'));
      };
      document.head.append(s);
    });
  }
  async function initialize() {
    if (engine) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      await script();
      const b = B();
      surface = document.createElement('canvas');
      surface.setAttribute('aria-hidden', 'true');
      // No second audio context and no second animation loop.
      engine = new b.Engine(surface, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        audioEngine: false
      });
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
      diagnostics.ready = true;
      engine.onContextLostObservable.add(() => {
        diagnostics.ready = false;
        diagnostics.exteriorReady = false;
      });
      engine.onContextRestoredObservable.add(() => {
        diagnostics.ready = true;
      });
    })().catch(error => {
      loadPromise = null;
      throw error;
    });
    return loadPromise;
  }

  function shipModel(name, allegiance, parent) {
    const model = VoidAssets.instance('ship:' + name, parent);
    if (model) return model;
    const b = B(),
      node = new b.TransformNode(name, scene),
      metal = material('hull', '#465964'),
      dark = material('hull-dark', '#202e36'),
      light = material('engine', allegiance === 'hostile' ? '#ed765b' : '#60d7d0', true);
    node.parent = parent;
    box('hull', [1.4, .65, 4], [0, 0, 0], metal, node);
    box('canopy', [.85, .32, 1.3], [0, .44, .65], material('glass', '#182b3c'), node);
    for (const side of [-1, 1]) {
      const wing = box('swept-wing', [2.3, .18, 1.6], [side * 1.3, -.1, -.6], metal, node);
      wing.rotation.y = side * -.32;
      box('engine-pod', [.55, .55, 1.8], [side * 1.05, 0, -1.35], dark, node);
      box('exhaust', [.38, .34, .15], [side * 1.05, 0, -2.3], light, node);
    }
    node.metadata = {
      placeholder: true,
      reference: 'art/ships.png'
    };
    return node;
  }

  function stationModel(id, parent) {
    const model = VoidAssets.instance('station:' + id, parent);
    if (model) return model;
    const b = B(),
      node = new b.TransformNode('station-' + id, scene),
      hull = material('station', '#4a5860'),
      trim = material('trim', {
        meridian: '#69bfac',
        kepler: '#c8a16d',
        undertow: '#b67dbb',
        foundry: '#c5885b'
      } [id] || '#7eaaa0', true);
    node.parent = parent;
    if (id !== 'foundry') {
      const ring = b.MeshBuilder.CreateTorus('habitat-ring', {
        diameter: 72,
        thickness: id === 'undertow' ? 7 : 5,
        tessellation: 48
      }, scene);
      ring.parent = node;
      ring.material = hull;
      ring.rotation.x = Math.PI / 2;
      ring.scaling.y = id === 'kepler' ? .45 : .7;
    }
    box('central-spine', [58, 7, 10], [0, 0, 0], hull, node);
    box('dock-bay', [12, 9, 18], [0, -6, 6], material('dock-dark', '#15232d'), node);
    for (let i = -4; i <= 4; i++) {
      box('module', [5, 5, 14], [i * 6, 0, 0], material('module', i % 2 ? '#5c696c' : '#384a55'), node);
      box('window-strip', [3, .5, .2], [i * 6, 1.3, -7.15], trim, node);
      box('dock-rib', [.5, 8, 11], [i * 6, -1, 0], hull, node);
    }
    for (let i = -2; i <= 2; i++) {
      box('industrial-tower', [5, 25 + (i % 2 ? 10 : 0), 7], [i * 12, 3, 0], hull, node);
      box('running-lights', [3, .4, 7.2], [i * 12, 7, 0], trim, node);
    }
    node.metadata = {
      placeholder: true,
      reference: 'art/STATION-ART.md'
    };
    return node;
  }

  function planetTexture(id) {
    const b = B(),
      t = new b.DynamicTexture('planet-map-' + id, {
        width: 512,
        height: 256
      }, scene, false),
      g = t.getContext();
    const gas = id === 'meridian',
      ocean = id === 'kepler' || id === 'earth',
      ice = id === 'undertow';
    g.fillStyle = ocean ? '#1b4662' : ice ? '#7a919b' : gas ? '#aa8366' : '#6c3826';
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 600; i++) {
      const x = (i * 137.29) % 512,
        y = (i * 73.61) % 256;
      g.fillStyle = gas ? i % 2 ? '#cba789' : '#715747' : ocean ? i % 3 ? '#496a50' : '#a3bbc0' : ice ? '#bacbd0' : i % 2 ? '#a36642' : '#352b26';
      g.globalAlpha = .2 + (i % 3) * .12;
      g.beginPath();
      g.ellipse(x, y, gas ? 260 : 5 + i % 21, gas ? 2 + i % 4 : 3 + i % 12, .2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    t.update();
    return t;
  }
  async function prepareSpace(id, shipTypes = ['raider', 'interceptor', 'gunship', 'courier', 'security', 'shuttle']) {
    await initialize();
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
    await VoidAssets.prepare(scene, {
      ...Object.fromEntries(Object.entries(VoidAssets.models.ships).filter(([key]) => shipTypes.includes(key)).map(([key, value]) => ['ship:' + key, value])),
      ...(VoidAssets.models.stations[id] ? {
        ['station:' + id]: VoidAssets.models.stations[id]
      } : {})
    });
    const texturePath = ['meridian', 'kepler', 'undertow', 'foundry'].includes(id) ? id : 'kepler';
    sky = b.MeshBuilder.CreateSphere('painted-sky', {
      diameter: 3000,
      segments: 16,
      sideOrientation: b.Mesh.BACKSIDE
    }, scene);
    sky.parent = spaceRoot;
    const skyMat = material('sky-' + id, '#ffffff', true);
    skyMat.emissiveColor = new b.Color3(.5, .5, .5);
    skyMat.backFaceCulling = false;
    const skyReady = new Promise((resolve, reject) => {
      skyMat.diffuseTexture = new b.Texture(new URL('art/sky-' + texturePath + '.png', base).href, scene, false, false, b.Texture.TRILINEAR_SAMPLINGMODE, resolve, () => reject(Error('Exterior sky texture unavailable.')));
    });
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
    station = stationModel(id, spaceRoot);
    station.position.set(-65, -5, 180);
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
      await Promise.all([skyReady, scene.whenReadyAsync()]);
    } catch (error) {
      clearSpace();
      throw error;
    }
    diagnostics.preparations++;
    diagnostics.location = id;
    diagnostics.exteriorReady = true;
  }

  function clearSpace() {
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
    if (warp || arrival) {
      const reveal = Math.max(0, (progress * 12 - 8) / 4);
      station.position.set(0, 0, arrival ? Math.max(34, 120 - snapshot.approach * 28) : 1500 - reveal * 1380);
    } else station.position.set(-65, -5, phase === 'departure' ? 180 + snapshot.route.departure * 18 : 350);
    const present = new Set();
    for (const e of snapshot.ships) {
      present.add(e);
      let node = ships.get(e);
      if (!node) {
        node = shipModel(e.className || 'ship', e.allegiance || 'hostile', spaceRoot);
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
    }
    for (const [e, node] of ships)
      if (!present.has(e)) {
        node.dispose();
        ships.delete(e);
      }
    setPool('laser', snapshot.bullets, '#75ffe0', .16);
    setPool('hostile', snapshot.hostile, '#ff715f', .2);
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
  async function prepareRoom(def) {
    await initialize();
    release();
    const b = B();
    roomRoot = new b.TransformNode('room', scene);
    room = def;
    camera.unfreezeProjectionMatrix();
    const definitions = Object.fromEntries((def.models || []).map(m => [m.id, m]));
    if (def.kind === 'hangar' && VoidAssets.models.ships.starter) definitions['ship:starter'] = VoidAssets.models.ships.starter;
    await VoidAssets.prepare(scene, definitions);
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
        const figure = box('npc-' + item.character, [.65, 1.25, .45], [item.position[0], .95, item.position[2]], material('coat', '#4d5a58'), roomRoot);
        figure.metadata = {
          placeholder: true,
          character: item.character
        };
        const head = b.MeshBuilder.CreateSphere('npc-head', {
          diameter: .38,
          segments: 8
        }, scene);
        head.position.set(item.position[0], 1.75, item.position[2]);
        head.material = material('skin', '#ad8d73');
        head.parent = roomRoot;
      } else if (item.action !== 'board') box('terminal', [.65, 1.4, .35], [item.position[0], .7, item.position[2] + .4], material('terminal', '#466966'), roomRoot);
    }
    if (def.kind === 'hangar') {
      const ship = shipModel('starter', 'friendly', roomRoot);
      ship.position.set(-7, 2, -5);
      ship.scaling.setAll(2);
      for (const x of [-9, -5]) box('landing-strut', [.25, 1.5, .3], [x, .75, -6], material('rib', '#23333b'), roomRoot);
    }
    if (def.kind === 'city') {
      scene.clearColor = new b.Color4(.12, .15, .17, 1);
      for (let i = 0; i < 14; i++) box('distant-skyline', [8, 12 + i % 5 * 4, 9], [-65 + i * 10, 6 + i % 5 * 2, 65], material('skyline', '#354149'), roomRoot);
      box('entrance', [3, 3, .2], [0, 1.5, 31], material('door', '#182e32'), roomRoot);
    } else scene.clearColor = new b.Color4(.015, .022, .028, 1);
    for (const defn of def.signs) sign(defn, roomRoot);
    await scene.whenReadyAsync();
    diagnostics.location = def.name;
    diagnostics.meshCount = scene.meshes.length;
  }

  function clearRoom() {
    for (const s of signs) {
      s.texture.dispose();
      s.material.dispose();
    }
    signs = [];
    disposeNode(roomRoot);
    roomRoot = null;
    room = null;
  }

  function renderRoom(player, width, height, time, allowed = () => true) {
    if (!roomRoot) return null;
    resize(width, height);
    camera.unfreezeProjectionMatrix();
    camera.fov = 1.05;
    camera.position.set(player.x, player.y, player.z);
    camera.upVector.set(0, 1, 0);
    camera.rotation.set(player.pitch, player.yaw, 0);
    for (const s of signs) {
      s.mesh.setEnabled(!s.def.when || allowed(s.def.when));
      s.material.alpha = s.def.animation === 'flicker' ? .72 + Math.sin(time * 13) * .07 : s.def.animation === 'pulse' ? .8 + Math.sin(time) * .08 : .9;
      if (s.def.animation === 'rotate') s.mesh.rotation.y = time * .2;
    }
    scene.render();
    diagnostics.frames++;
    return surface;
  }

  function qualitySet(value) {
    quality = presets[value] ? value : 'medium';
    lastWidth = 0;
  }

  function release() {
    clearRoom();
    clearSpace();
    for (const m of Object.values(materials)) m.dispose(false, true);
    materials = {};
  }
  root.VoidBabylon = {
    initialize,
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
    get scene() {
      return scene;
    }
  };
})(globalThis);
