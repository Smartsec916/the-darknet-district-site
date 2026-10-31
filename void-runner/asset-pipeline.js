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
    // vendor/ktx2 (useKTX2Locally); compressed geometry still has no decoder here.
    const compressed = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression'];
    if ((data.extensionsUsed || []).some(e => compressed.includes(e))) throw Error('Compressed geometry needs a configured, locally hosted decoder. Export an uncompressed GLB for this milestone.');
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

  function loadPlugin(task) {
    useKTX2Locally();
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
    let buffer;
    for(let attempt=1;attempt<=2;attempt++){
      task?.check();
      try{
        const response=await fetch(url,{signal:task?.signal});
        if(!response.ok)throw Error('Model HTTP '+response.status);
        buffer=await response.arrayBuffer();
        if(packed)buffer=unpack(buffer);
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
    const container = packed
      ? await BABYLON.SceneLoader.LoadAssetContainerAsync('', new Uint8Array(buffer), scene, null, '.glb')
      : await BABYLON.SceneLoader.LoadAssetContainerAsync(url.href.slice(0, url.href.lastIndexOf('/') + 1), url.href.slice(url.href.lastIndexOf('/') + 1), scene);
    if(task?.signal.aborted){container.dispose();task.check();}
    // When a model finishes loading, the glTF loader raises every material in the scene to one light slot per
    // light in the scene. Busy scenes (NeoChinatown has 14) then need more uniform buffers than many GPUs allow
    // (12 on ANGLE/D3D11): shaders fail to compile and models and walls silently stop drawing. Put them back
    // within eight lights, the most any scene here is built for (Meridian).
    for(const m of [...container.materials,...scene.materials])if(m.maxSimultaneousLights>8)m.maxSimultaneousLights=8;
    return container;
  }

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
  function instance(id, parent) {
    const item = containers.get(id);
    if (!item) return null;
    const result = item.container.instantiateModelsToScene(name => id + '-' + name, false),
      node = new BABYLON.TransformNode(id + '-model', parent.getScene()),
      asset = new BABYLON.TransformNode(id + '-asset', parent.getScene());
    node.parent = parent;
    asset.parent = node;
    for (const mesh of result.rootNodes) mesh.parent = asset;
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
    unpack,
    useKTX2Locally,
    load,
    instance,
    prepare,
    release
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidAssets = api;
})(globalThis);
