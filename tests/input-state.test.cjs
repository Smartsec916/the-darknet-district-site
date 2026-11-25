const test=require('node:test');
const assert=require('node:assert/strict');
const {resolve,states}=require('../void-runner/input-state.js');

test('clickable surfaces own the cursor over exploration and seating, then restore the underlying controls',()=>{
  for(const surface of ['conversation','activity','store','device','vr','menu','loading']){
    const ui=resolve('walking',surface,false,false,true);
    assert.equal(ui,states[surface]);
    assert.deepEqual([ui.pointerLock,ui.cursor,ui.camera,ui.movement,ui.ui],[false,true,false,false,true]);
    assert.equal(resolve('walking',surface,true,false,true),states.background);
  }
  assert.equal(resolve('walking',null,false,false,true),states.seated);
  assert.equal(resolve('walking',null,false,true,false),states.cursor);
  assert.equal(resolve('walking',null,false,false,false),states.exploration);
});

test('seated look, transitions, VR menus and flight have distinct policies',()=>{
  for(const mode of ['vr-seated','food-seated','pod-waking']){
    const seated=resolve(mode,null,false,false,false);
    assert.ok(seated.camera&&!seated.movement&&seated.shortcuts==='seat');
  }
  for(const [mode,name] of [['vr-menu','vr'],['vr-transition','loading'],['preparing-flight','loading'],['play','flight'],['skirmish-fps','exploration']]){
    assert.equal(resolve(mode,null,false,false,false).name,name);
  }
});

test('floating dialogue preserves deliberate walking and reserves the mouse for choices',()=>{
  const floating=resolve('walking','floating',false,false,false);
  assert.ok(floating.movement&&floating.ui);
  assert.ok(!floating.pointerLock&&!floating.camera);
  assert.equal(resolve('vr-seated','floating',false,false,true).movement,false);
  assert.equal(resolve('walking','store',false,false,false).movement,false);
});
