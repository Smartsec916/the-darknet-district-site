// KTX2 / Basis Universal textures: the asset loader accepts them (and still refuses compressed geometry), and the
// decoder is always served from void-runner/vendor/ktx2 with its licences, never from a CDN.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const assets=require('../void-runner/asset-pipeline.js');
const vendor=path.join(__dirname,'../void-runner/vendor/ktx2');
function glb(json){const j=Buffer.from(JSON.stringify(json));const pad=(4-j.length%4)%4,jl=j.length+pad,h=Buffer.alloc(20);
 h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(20+jl,8);h.writeUInt32LE(jl,12);h.writeUInt32LE(0x4e4f534a,16);
 const b=Buffer.concat([h,j,Buffer.alloc(pad,0x20)]);return b.buffer.slice(b.byteOffset,b.byteOffset+b.length);}

test('GLBs with KTX2 textures are accepted; compressed geometry is still refused',()=>{
 assert.doesNotThrow(()=>assets.validate(glb({asset:{version:'2.0'},extensionsUsed:['KHR_texture_basisu'],extensionsRequired:['KHR_texture_basisu']})));
 for(const ext of ['KHR_draco_mesh_compression','EXT_meshopt_compression'])assert.throws(()=>assets.validate(glb({asset:{version:'2.0'},extensionsUsed:[ext]})),/Compressed geometry/);
});

test('the decoder, every transcoder and their licences are in vendor/ktx2',()=>{
 for(const f of ['babylon.ktx2Decoder.js','msc_basis_transcoder.js','msc_basis_transcoder.wasm','uastc_astc.wasm','uastc_bc7.wasm','uastc_r8_unorm.wasm','uastc_rg8_unorm.wasm',
  'uastc_rgba8_srgb_v2.wasm','uastc_rgba8_unorm_v2.wasm','zstddec.wasm','LICENSE-babylonjs.md','LICENSE-transcoders.md','LICENSE-zstddec.txt','README.md'])
  assert.ok(fs.existsSync(path.join(vendor,f)),f);
 for(const f of fs.readdirSync(vendor).filter(f=>f.endsWith('.wasm')))assert.equal(fs.readFileSync(path.join(vendor,f)).readUInt32LE(0),0x6d736100,f+' is WebAssembly');
});

test('Babylon is pointed at the local decoder files, nothing remote',()=>{
 // A browser-like setting: the script's own URL, a BABYLON with Babylon's default CDN configuration.
 const K={URLConfig:{jsDecoderModule:'https://cdn.babylonjs.com/babylon.ktx2Decoder.js'},DefaultNumWorkers:4};
 const g={BABYLON:{KhronosTextureContainer2:K},navigator:{hardwareConcurrency:8},document:{currentScript:{src:'https://example.test/void-runner/asset-pipeline.js'}},location:{origin:'https://example.test'}};
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/asset-pipeline.js'),'utf8');
 const run=new Function('window','document','location','navigator','module',src.replace(/\}\)\((typeof window[^)]*|this|globalThis|window)\);?\s*$/,'})(window);'));
 const win={...g};run(win,g.document,g.location,g.navigator,undefined);
 win.VoidAssets.useKTX2Locally();
 const urls=Object.values(K.URLConfig).filter(Boolean);
 assert.equal(urls.length,10);for(const u of urls)assert.match(u,/^https:\/\/example\.test\/void-runner\/vendor\/ktx2\//,u);
 for(const u of urls)assert.ok(fs.existsSync(path.join(vendor,u.split('/').pop())),u);
 assert.ok(K.DefaultNumWorkers>=1&&K.DefaultNumWorkers<=2);
});
