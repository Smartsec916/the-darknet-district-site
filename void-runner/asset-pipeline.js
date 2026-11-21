/* Optional self-contained GLB replacements. No remote textures or decoder services. */
(function(root) {
  const models = {
      ships: {},
      stations: {},characters: {}
    },
    containers = new Map();
  let loader;
  const base = typeof document !== 'undefined' ? new URL('.', document.currentScript.src) : null;

  function validate(buffer) {
    const v = new DataView(buffer);
    if (v.byteLength < 20 || v.getUint32(0, true) !== 0x46546c67 || v.getUint32(4, true) !== 2 || v.getUint32(8, true) !== v.byteLength || v.getUint32(16, true) !== 0x4e4f534a) throw Error('Expected a glTF 2.0 GLB.');
    const length = v.getUint32(12, true);
    if (length > v.byteLength - 20) throw Error('Invalid GLB JSON chunk.');
    const data = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, length)));
    for (const item of [...data.buffers || [], ...data.images || []])
      if (item.uri && !item.uri.startsWith('data:')) throw Error('Use a self-contained GLB; external asset URIs are not enabled.');
    // KTX2 / Basis Universal textures (KHR_texture_basisu) are decoded by the locally hosted transcoder in
    // vendor/ktx2 (useKTX2Locally), and meshopt geometry (EXT_meshopt_compression, lossless, 18 Nov 2026) by the
    // locally hosted vendor/meshopt_decoder-1.3.0.js (useMeshoptLocally). Draco still has no decoder here.
    const compressed = ['KHR_draco_mesh_compression', 'KHR_meshopt_compression'];
    if ((data.extensionsUsed || []).some(e => compressed.includes(e))) throw Error('Compressed geometry needs a configured, locally hosted decoder. Export an uncompressed or EXT_meshopt_compression GLB.');
    return data;
  }

  // KTX2 textures stay compressed on the GPU (BC7, ASTC or ETC, whichever the device supports; plain RGBA where it
  // supports none). Babylon's decoder and the Basis Universal / UASTC / Zstandard transcoders are served from
  // vendor/ktx2 (see its README for sources and licences), never from a CDN.
  function useKTX2Locally() {
    const K = root.BABYLON?.KhronosTextureContainer2;
    if (!K || !base || K.URLConfig.jsDecoderModule?.startsWith(base.origin)) return;
    const at = f => new URL('vendor/ktx2/' + f, base).href;
    K.URLConfig = {jsDecoderModule: at('babylon.ktx2Decoder.js'), wasmUASTCToASTC: at('uastc_astc.wasm'), wasmUASTCToBC7: at('uastc_bc7.wasm'),
      wasmUASTCToRGBA_UNORM: at('uastc_rgba8_unorm_v2.wasm'), wasmUASTCToRGBA_SRGB: at('uastc_rgba8_srgb_v2.wasm'), wasmUASTCToR8_UNORM: at('uastc_r8_unorm.wasm'),
      wasmUASTCToRG8_UNORM: at('uastc_rg8_unorm.wasm'), jsMSCTranscoder: at('msc_basis_transcoder.js'), wasmMSCTranscoder: at('msc_basis_transcoder.wasm'), wasmZSTDDecoder: at('zstddec.wasm')};
    K.DefaultNumWorkers = Math.max(1, Math.min(2, (root.navigator?.hardwareConcurrency || 2) - 1));
  }

  // Babylon's meshopt decoder defaults to a CDN; the game serves its own copy (meshoptimizer 1.3.0, MIT:
  // vendor/LICENSE-meshoptimizer.md), set before any model loads.
  function useMeshoptLocally() {
    const M = root.BABYLON?.MeshoptCompression;
    if (!M || !base) return;
    const url = new URL('vendor/meshopt_decoder-1.3.0.js', base).href;
    if (M.Configuration?.decoder?.url !== url) M.Configuration = {decoder: {url}};
  }

  // Licensed models whose terms ask games to keep the file from casual extraction ship as .vrpak: the GLB
  // with a "VRPK" header and its bytes XOR-scrambled by a fixed xorshift stream (tools/assets/pack-model.cjs).
  // This only stops casual saving; it is not encryption.
  function unpack(buffer) {
    const v = new DataView(buffer);
    if (v.byteLength < 8 || v.getUint32(0, true) !== 0x4b505256) throw Error('Expected a VRPK model.');
    const out = new Uint8Array(buffer.byteLength - 8), src = new Uint8Array(buffer, 8);
    let x = (0x9e3779b9 ^ v.getUint32(4, true)) >>> 0 || 1;
    for (let i = 0; i < out.length; i++) {
      if ((i & 3) === 0) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; }
      out[i] = src[i] ^ (x >>> ((i & 3) * 8)) & 255;
    }
    return out.buffer;
  }

  // On the live site the licensed models are encrypted instead (CGTrader's licence asks games to take "commercially
  // reasonable measures" such as "encrypting the Product data"): a "VRPE" header, a 12-byte IV, then AES-256-GCM.
  // tools/assets/build-pages.cjs encrypts them at deploy time and writes the key here. The browser has to hold the key
  // to draw the model, so a determined player can still extract it; this keeps the files out of reach of casual
  // saving and off the public repository, nothing more. Local builds keep the placeholder and the scrambled files.
  const ASSET_KEY = '__VOID_ASSET_KEY__';
  let assetKey = null;
  async function open(buffer) {
    const v = new DataView(buffer);
    if (v.byteLength < 32 || v.getUint32(0, true) !== 0x45505256) return unpack(buffer);
    if (ASSET_KEY.startsWith('__')) throw Error('Encrypted model, but this build has no asset key.');
    assetKey ??= root.crypto.subtle.importKey('raw', Uint8Array.from(root.atob(ASSET_KEY), c => c.charCodeAt(0)), 'AES-GCM', false, ['decrypt']);
    return root.crypto.subtle.decrypt({name: 'AES-GCM', iv: new Uint8Array(buffer, 4, 12)}, await assetKey, new Uint8Array(buffer, 16));
  }

  function loadPlugin(task) {
    useKTX2Locally();
    useMeshoptLocally();
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/babylonjs-loaders-8.26.0.min.js', base);
      const abort=()=>{s.remove();loader=null;reject(task.signal.reason);};
      task?.signal.addEventListener('abort',abort,{once:true});
      s.onload = ()=>{task?.signal.removeEventListener('abort',abort);resolve();};
      s.onerror = () => {
        loader = null;
        s.remove();
        task?.signal.removeEventListener('abort',abort);
        reject(Error('GLB loader unavailable.'));
      };
      document.head.append(s);
    });
    return loader;
  }
  async function load(id, def, scene, task) {
    const container = await loadContainer(def, scene, task, id);
    containers.set(id, {
      container,
      def
    });
    return container;
  }
  // Loads and validates a model into a container the caller owns (not tracked or released here).
  async function loadContainer(def, scene, task, id = def.src) {
    const url = new URL(def.src, base);
    const packed = url.pathname.endsWith('.vrpak');
    if (url.origin !== location.origin || !(packed || url.pathname.endsWith('.glb'))) throw Error('Model must be a locally hosted GLB.');
    let buffer=def.localBuffer;
    if(buffer)validate(buffer);
    for(let attempt=1;!def.localBuffer&&attempt<=2;attempt++){
      task?.check();
      try{
        const response=await fetch(url,{signal:task?.signal});
        if(!response.ok)throw Error('Model HTTP '+response.status);
        buffer=await response.arrayBuffer();
        if(packed)buffer=await open(buffer);
        validate(buffer);
        break;
      }catch(error){
        if(task?.signal.aborted||attempt===2)throw Error('Model unavailable: '+id+' · '+error.message);
        console.warn('[VOID//RUNNER assets] retry', {id,attempt,reason:error.message});
        await new Promise(resolve=>setTimeout(resolve,650));
      }
    }
    await loadPlugin(task);
    task?.check();
    const container = packed || def.localBuffer
      ? await BABYLON.SceneLoader.LoadAssetContainerAsync('', new Uint8Array(buffer), scene, null, '.glb')
      : await BABYLON.SceneLoader.LoadAssetContainerAsync(url.href.slice(0, url.href.lastIndexOf('/') + 1), url.href.slice(url.href.lastIndexOf('/') + 1), scene);
    if(task?.signal.aborted){container.dispose();task.check();}
    // When a model finishes loading, the glTF loader raises every material in the scene to one light slot per
    // light in the scene. Busy scenes (NeoChinatown has 14) then need more uniform buffers than many GPUs allow
    // (12 on ANGLE/D3D11): shaders fail to compile and models and walls silently stop drawing. Put them back
    // within eight lights, the most any scene here is built for (Meridian).
    for(const m of [...container.materials,...scene.materials])if(m.maxSimultaneousLights>8)m.maxSimultaneousLights=8;
    // Character models get their edge light now, before any of their materials is prepared (character-finish.js): a material's plugins must be in place first.
    try{globalThis.VoidCharacterFinish?.applyContainer?.(id,container);}catch(error){console.warn('[VOID//RUNNER character finish]',error);}
    trimLeadIn(container);
    return container;
  }

  /* The bind pose at both ends of a clip (18 Nov 2026). The talk, watch, drink and wipe clips that almost every figure carries (the crowd looks, the named
     residents, Fish, Eva, Admin, Iris, the companions) open with ONE key in the bind pose (arms straight out to the sides) and close by easing back into it
     over their last nine keys (about half a second). So every time such a loop came round the figure raised its arms out to both sides and dropped them
     again (the owner: "that arms down then out to both sides thing that many of the NPCs are currently doing"), and a clip started from its beginning flicked
     them out. leadInEnd(keys) / leadOutStart(keys): given an upper arm's rotation keys ({frame, value:[x,y,z,w]}), the frame the clip should start at (the
     first key that leaves a bind-pose opening by more than 45 degrees) and end at (where the closing ease toward that same pose begins), else null.
     trimLeadIn plays each such clip between the two; copies of a figure get the same range (keepTrim). The model files are untouched. */
  const keyAngle=(p,q)=>2*Math.acos(Math.min(1,Math.abs(p[0]*q[0]+p[1]*q[1]+p[2]*q[2]+p[3]*q[3])));
  function leadInEnd(keys){if(!keys||keys.length<4)return null;const p=keys[0].value;
    // the opening key may be doubled (Babylon copies a clip's first key to frame 0): skip copies of it, then look at the first key that differs
    for(let i=1;i<Math.min(4,keys.length-1);i++){const a=keyAngle(p,keys[i].value);if(a<.02)continue;return a>Math.PI/4?keys[i].frame:null;}return null;}
  function leadOutStart(keys){if(leadInEnd(keys)===null)return null;const bind=keys[0].value,n=keys.length,d=i=>keyAngle(keys[i].value,bind);if(d(n-1)>.05)return null;
    // back from the end while each key is clearly further from the bind pose than the one after it (the closing ease); stop at the plateau before it
    let i=n-1;while(i>1&&d(i-1)>d(i)+.02)i--;return i<n-1&&n-1-i<=n*.25?keys[i].frame:null;}
  function trimLeadIn(container){let n=0;for(const g of container?.animationGroups||[]){let start=null,end=null;
    for(const ta of g.targetedAnimations){if(ta.animation.targetProperty!=='rotationQuaternion'||!/(^|:)(Left|Right)Arm$/.test(ta.target?.name||''))continue;const keys=ta.animation.getKeys().map(k=>({frame:k.frame,value:k.value.asArray?k.value.asArray():k.value}));if(keys[0].frame>g.from+1e-3)continue;   // only keys that open the clip count
     const f=leadInEnd(keys),e=leadOutStart(keys);if(f!==null)start=Math.max(start??f,f);if(e!==null)end=Math.min(end??e,e);}
    if(start!==null&&(end??g.to)>start){g.normalize(start,end??g.to);n++;}}
   return n;}
  // A copy of a model (instantiateModelsToScene) rebuilds each clip's range from its keys: give the copies the trimmed start again (groups come in the same order).
  function keepTrim(container,result){(result?.animationGroups||[]).forEach((g,i)=>{const src=container?.animationGroups?.[i];if(src&&src.name&&g.name.endsWith(src.name)&&(src.from>g.from+1e-3||src.to<g.to-1e-3)&&src.from<src.to)g.normalize(src.from,src.to);});return result;}

  // What the glTF loader does to every material when a model finishes loading (above), done now: one light slot per light in the scene, at most eight.
  // A place calls this before its loading screen lifts (neochinatown.js prepare), so the next model to arrive changes no material and no shader is rebuilt
  // mid-walk. A material lit by no more lights than it already had slots for draws exactly the same; one lit by more is drawn as it would be after that model.
  // keepLights: settle now, and return a check for each frame that settles again whenever the scene's number of materials has changed (a road taxi, a
  // figure's tinted clothes made after the loading screen), before that frame is drawn.
  function keepLights(scene){settleLights(scene);let count=scene?.materials?.length;return ()=>{const n=scene?.materials?.length;if(n!==count){count=n;settleLights(scene);}};}
  function settleLights(scene){const n=Math.min(8,scene?.lights?.length||0);let raised=0;for(const m of scene?.materials||[])if(m.maxSimultaneousLights!==undefined&&m.maxSimultaneousLights<n){m.maxSimultaneousLights=n;raised++;}if(raised)scene.incrementRenderId?.();return raised;}   /* a scene that has drawn no frame since takes its shaders as current: this makes the next readiness check look again */

  // Clones own skeletons (including their bone textures) and animation groups; materials stay with the container.
  function ownInstance(result, owner) {
    let disposed=false;
    const dispose=()=>{if(disposed)return;disposed=true;
      for(const g of result.animationGroups||[]){g.stop();g.dispose();}
      for(const s of result.skeletons||[])s.dispose();
    };
    owner.onDisposeObservable.addOnce(dispose);
    return dispose;
  }
  // `only` names one model of a kit file (several models sharing their textures): the copy keeps just that one.
  function instance(id, parent, only) {
    const item = containers.get(id);
    if (!item) return null;
    const result = keepTrim(item.container, item.container.instantiateModelsToScene(name => id + '-' + name, false)),
      node = new BABYLON.TransformNode(id + '-model', parent.getScene()),
      asset = new BABYLON.TransformNode(id + '-asset', parent.getScene());
    node.parent = parent;
    asset.parent = node;
    for (const mesh of result.rootNodes) mesh.parent = asset;
    if (only) {
      const keep = id + '-' + only, pieces = result.rootNodes.flatMap(r => r.getChildren());
      if (!pieces.some(p => p.name === keep)) { for (const r of result.rootNodes) r.dispose(); node.dispose(); asset.dispose(); return null; }
      for (const p of pieces) if (p.name !== keep) p.dispose();
    }
    asset.scaling.setAll(item.def.scale || 1);
    asset.rotation.y = item.def.yaw || 0;
    // Cloned clips belong to this copy; they start stopped and the caller picks one (crowd figures).
    for (const group of result.animationGroups) group.stop();
    node.metadata = { animationGroups: result.animationGroups };
    ownInstance(result,node);
    return node;
  }
  async function prepare(scene, definitions, task) {
    release();const gen=generation,later=[],missed=[];
    await Promise.all(Object.entries(definitions).map(async ([id,def])=>{
      // Large optional models (crowd figures) load with the scene only when already in the offline cache.
      // Otherwise they wait until the scene is on screen, so they never slow it down, and are swapped in
      // when they arrive (onLoaded); a finished download is cached for next time.
      if(def.background&&!(await cached(def))){later.push([id,def]);return;}
      try{await VoidPreparation.run(t=>t.wait('optional',()=>load(id,def,scene,t),def.src));}catch(error){
        missed.push({id,asset:def.src,reason:error.message});
        // A timeout cancels the download and the service worker caches only finished ones, so a slow
        // connection would miss on every visit. Finish it in the background so the next visit has it.
        if(/timed out/.test(error.message)&&gen===generation&&!(await cached(def)))later.push([id,def]);
      }
    }));
    if(missed.length)console.warn('[VOID optional models] '+missed.length+' using procedural placeholders; timed-out downloads continue in the background for the next visit',missed);
    task?.check();
    // Once the scene is ready, so background downloads and parsing never hold up its readiness check.
    if(later.length){
      // First presentation is the readiness boundary: background parsing must not re-block whenReadyAsync.
      const batch={scene,items:later,observer:null};scheduled.add(batch);
      batch.observer=scene.onAfterRenderObservable.addOnce(()=>{scheduled.delete(batch);if(gen===generation){queue.push(...later.map(([id,def])=>({id,def,scene,gen})));pump();}});
    }
  }
  async function cached(def){try{return typeof caches!=='undefined'&&!!(await caches.match(new URL(def.src,base).href));}catch{return false;}}
  // Background downloads, two at a time. Released scenes cancel theirs, so the next place loads at full speed.
  const backgroundLimit=120000,parallel=4;let generation=0;const listeners=new Set(),jobs=new Set(),scheduled=new Set(),queue=[],failed=new Map();
  function pump(){
    while(jobs.size<parallel&&queue.length){const next=queue.shift();if(next.gen===generation&&!next.scene.isDisposed)background(next);}
  }
  function background({id,def,scene,gen}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(Error('Background model timed out.')),backgroundLimit);
    const task={signal:controller.signal,check(){if(controller.signal.aborted)throw controller.signal.reason;}},job={controller,gen};jobs.add(job);
    return loadContainer(def,scene,task,id).then(container=>{
      if(gen!==generation||scene.isDisposed){container.dispose();return false;}
      // Not a swap-in model (a timed-out prop or fitting): the finished download is now cached for the next visit.
      if(!def.background){container.dispose();return true;}
      containers.set(id,{container,def});failed.delete(id);
      for(const listener of listeners)try{listener(id,true);}catch(error){console.warn('[VOID//RUNNER assets] listener',error);}
      return true;
    },error=>{if(gen!==generation)return false;
      // Reported, not silent: the console says which model and why, VoidAssets.failed lists it, and listeners hear
      // (id, false) so stand-ins can switch to a look that did load.
      console.warn('[VOID optional model] failed',{id,asset:def.src,reason:error.message});failed.set(id,error.message);
      for(const listener of listeners)try{listener(id,false);}catch(e){console.warn('[VOID//RUNNER assets] listener',e);}return false;})
     .finally(()=>{clearTimeout(timer);jobs.delete(job);pump();});
  }
  // Called with a model id whenever a background model becomes available for the current scene.
  function onLoaded(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
  const pending=()=>jobs.size+queue.length+[...scheduled].reduce((n,b)=>n+b.items.length,0);

  function unload(id){const item=containers.get(id);if(item){item.container.dispose();containers.delete(id);}}
  function release() {
    generation++;queue.length=0;for(const b of scheduled)b.scene.onAfterRenderObservable.remove(b.observer);scheduled.clear();for(const job of jobs)job.controller.abort(Error('Scene released.'));
    for (const {
        container
      }
      of containers.values()) container.dispose();
    containers.clear();
  }
  // The loaded container for an id (for builders that place many copies themselves), or null.
  function container(id){return containers.get(id)?.container||null;}
  const api = {
    models,unload,container,loadContainer,ownInstance,onLoaded,get pending(){return pending();},get failed(){return new Map(failed);},
    validate,
    leadInEnd,leadOutStart,trimLeadIn,keepTrim,
    unpack,
    open,
    useKTX2Locally,
    useMeshoptLocally,
    load,
    instance,
    prepare,
    release,
    settleLights,
    keepLights,
    isCached:src=>cached({src})   // is a model already in the offline cache (then loading it costs no download)
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidAssets = api;
})(globalThis);
