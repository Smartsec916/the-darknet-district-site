/* Optional self-contained GLB replacements. No remote textures or decoder services. */
(function(root) {
  const models = {
      ships: {},
      stations: {}
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

  function loadPlugin() {
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/babylonjs-loaders-8.26.0.min.js', base);
      s.onload = resolve;
      s.onerror = () => {
        loader = null;
        s.remove();
        reject(Error('GLB loader unavailable.'));
      };
      document.head.append(s);
    });
    return loader;
  }
  async function load(id, def, scene) {
    const url = new URL(def.src, base);
    if (url.origin !== location.origin || !url.pathname.endsWith('.glb')) throw Error('Model must be a locally hosted GLB.');
    const response = await fetch(url);
    if (!response.ok) throw Error('Model unavailable: ' + id);
    validate(await response.arrayBuffer());
    await loadPlugin();
    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(url.href.slice(0, url.href.lastIndexOf('/') + 1), url.href.slice(url.href.lastIndexOf('/') + 1), scene);
    containers.set(id, {
      container,
      def
    });
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
    return node;
  }
  async function prepare(scene, definitions) {
    release();
    await Promise.all(Object.entries(definitions).map(([id, def]) => load(id, def, scene)));
  }

  function release() {
    for (const {
        container
      }
      of containers.values()) container.dispose();
    containers.clear();
  }
  const api = {
    models,
    validate,
    load,
    instance,
    prepare,
    release
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidAssets = api;
})(globalThis);
