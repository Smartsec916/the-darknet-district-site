// The GitHub Pages build (tools/assets/build-pages.cjs): what is published, and that an encrypted model opens in the
// game's loader once the deploy has written the key into it.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const B=require('../tools/assets/build-pages.cjs'),{pack}=require('../tools/assets/pack-model.cjs');
const asArrayBuffer=buf=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length);

test('the site publishes what the branch deployment did, without dot or underscore paths and exports/',()=>{
 for(const f of ['void-runner.html','CNAME','void-runner/asset-pipeline.js','docs/VOID_RUNNER_VR_ARCADE.md'])assert.ok(B.publishable(f),f);
 for(const f of ['.github/workflows/pages.yml','.gitignore','.agents/memory/MEMORY.md','_licensed/void-runner/x.vrpak','exports/blackout-protocol-primary.zip'])assert.ok(!B.publishable(f),f);
});

test('a packed model is encrypted, and the deployed loader decrypts it with the injected key',async()=>{
 const glb=Buffer.from('glTF stand-in model bytes, long enough to span several cipher blocks and keystream words.');
 const key=B.keyFrom(Buffer.alloc(32,7).toString('base64'));
 assert.deepEqual(B.unscramble(pack(glb,99)),glb);
 const sealed=B.seal(B.unscramble(pack(glb,99)),key);
 assert.equal(sealed.readUInt32LE(0),0x45505256);assert.ok(!sealed.includes(glb.subarray(0,16)),'ciphertext must not contain the model');
 assert.notDeepEqual(B.seal(glb,key).subarray(4,16),B.seal(glb,key).subarray(4,16),'a fresh IV each time');
 // The loader as deployed: the placeholder replaced by the key.
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/asset-pipeline.js'),'utf8');
 assert.equal(src.split("'__VOID_ASSET_KEY__'").length,2,'one key placeholder');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vr-pages-')),file=path.join(dir,'asset-pipeline.js');
 fs.writeFileSync(file,src.replace("'__VOID_ASSET_KEY__'","'"+key.toString('base64')+"'"));
 const deployed=require(file);
 assert.deepEqual(Buffer.from(await deployed.open(asArrayBuffer(sealed))),glb);
 assert.deepEqual(Buffer.from(await deployed.open(asArrayBuffer(pack(glb,5)))),glb,'scrambled files still open');
 const tampered=Buffer.from(sealed);tampered[40]^=1;
 await assert.rejects(deployed.open(asArrayBuffer(tampered)),'a changed file is refused');
 // A local build has no key: encrypted files are refused with a clear message.
 const local=require('../void-runner/asset-pipeline.js');
 await assert.rejects(local.open(asArrayBuffer(sealed)),/no asset key/);
 assert.throws(()=>B.keyFrom('c2hvcnQ='),/32 bytes/);
});
