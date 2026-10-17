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
    const compressed = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'];
    if ((data.extensionsUsed || []).some(e => compressed.includes(e))) throw Error('Compressed models need a configured, locally hosted decoder. Export an uncompressed GLB for this milestone.');
    return data;
  }

  function loadPlugin(task) {
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
    if (url.origin !== location.origin || !url.pathname.endsWith('.glb')) throw Error('Model must be a locally hosted GLB.');
    let buffer;
    for(let attempt=1;attempt<=2;attempt++){
      task?.check();
      try{
        const response=await fetch(url,{signal:task?.signal});
        if(!response.ok)throw Error('Model HTTP '+response.status);
        buffer=await response.arrayBuffer();
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
    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(url.href.slice(0, url.href.lastIndexOf('/') + 1), url.href.slice(url.href.lastIndexOf('/') + 1), scene);
    if(task?.signal.aborted){container.dispose();task.check();}
    return container;
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
    return node;
  }
  async function prepare(scene, definitions, task) {
    release();const gen=generation,later=[];
    await Promise.all(Object.entries(definitions).map(async ([id,def])=>{
      // Large optional models (crowd figures) load with the scene only when already in the offline cache.
      // Otherwise they wait until the scene is on screen, so they never slow it down, and are swapped in
      // when they arrive (onLoaded); a finished download is cached for next time.
      if(def.background&&!(await cached(def))){later.push([id,def]);return;}
      try{await VoidPreparation.run(t=>t.wait('optional',()=>load(id,def,scene,t),def.src));}catch(error){console.warn('[VOID optional model]',{id,asset:def.src,recovery:'procedural modern placeholder',reason:error.message});}
    }));task?.check();
    if(later.length)scene.onAfterRenderObservable.addOnce(()=>{if(gen===generation)queue.push(...later.map(([id,def])=>({id,def,scene,gen})));pump();});
  }
  async function cached(def){try{return typeof caches!=='undefined'&&!!(await caches.match(new URL(def.src,base).href));}catch{return false;}}
  // Background downloads, two at a time. Released scenes cancel theirs, so the next place loads at full speed.
  const backgroundLimit=120000,parallel=2;let generation=0;const listeners=new Set(),jobs=new Set(),queue=[];
  function pump(){
    while(jobs.size<parallel&&queue.length){const next=queue.shift();if(next.gen===generation&&!next.scene.isDisposed)background(next);}
  }
  function background({id,def,scene,gen}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(Error('Background model timed out.')),backgroundLimit);
    const task={signal:controller.signal,check(){if(controller.signal.aborted)throw controller.signal.reason;}},job={controller,gen};jobs.add(job);
    return loadContainer(def,scene,task,id).then(container=>{
      if(gen!==generation||scene.isDisposed){container.dispose();return false;}
      containers.set(id,{container,def});
      for(const listener of listeners)try{listener(id);}catch(error){console.warn('[VOID//RUNNER assets] listener',error);}
      return true;
    },error=>{if(gen===generation)console.warn('[VOID optional model]',{id,asset:def.src,recovery:'procedural modern placeholder',reason:error.message});return false;})
     .finally(()=>{clearTimeout(timer);jobs.delete(job);pump();});
  }
  // Called with a model id whenever a background model becomes available for the current scene.
  function onLoaded(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
  const pending=()=>jobs.size+queue.length;

  function unload(id){const item=containers.get(id);if(item){item.container.dispose();containers.delete(id);}}
  function release() {
    generation++;queue.length=0;for(const job of jobs)job.controller.abort(Error('Scene released.'));
    for (const {
        container
      }
      of containers.values()) container.dispose();
    containers.clear();
  }
  // The loaded container for an id (for builders that place many copies themselves), or null.
  function container(id){return containers.get(id)?.container||null;}
  const api = {
    models,unload,container,loadContainer,onLoaded,get pending(){return pending();},
    validate,
    load,
    instance,
    prepare,
    release
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidAssets = api;
})(globalThis);
