const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../void-runner/npc-preview.js'),'utf8');
test('import preview configures local decoders before checking or loading GLB plugin',async()=>{
 for(const installed of [true,false]){
  const calls=[];
  const context={BABYLON:{SceneLoader:{IsPluginForExtensionAvailable:()=>{calls.push('check');return installed;}}},VoidAssets:{useKTX2Locally:()=>calls.push('ktx2'),useMeshoptLocally:()=>calls.push('meshopt')},document:{createElement:()=>({}),head:{append:s=>{calls.push('load');s.onload();}}}};
  vm.runInNewContext(source,context);
  await context.VoidNPCPreview.loaders();
  assert.deepEqual(calls,installed?['ktx2','meshopt','check']:['ktx2','meshopt','check','load']);
 }
});
