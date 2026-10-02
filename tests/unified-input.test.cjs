const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const modulePath=path.join(__dirname,'../void-runner/input.js');
function fresh(initial){let saved=initial;global.localStorage={getItem:()=>saved,setItem:(_key,value)=>{saved=value;}};delete require.cache[require.resolve(modulePath)];return {input:require(modulePath),saved:()=>saved};}
test('controller preferences share the existing controls record and retain keyboard remaps',()=>{
  const first=fresh(null),input=first.input;
  assert(input.bind('missile','KeyV').saved);
  assert(input.bindController('jump',8).saved);
  input.controller.sensitivity=1.6;input.controller.leftDeadZone=.22;input.controller.invertY=true;input.persist();
  const second=fresh(first.saved()).input;
  assert.equal(second.bindings.missile,'KeyV');
  assert.equal(second.controller.bindings.jump,8);
  assert.equal(second.controller.sensitivity,1.6);
  assert.equal(second.controller.leftDeadZone,.22);
  assert.equal(second.controller.invertY,true);
  second.resetController();
  assert.equal(second.controller.bindings.jump,0);
  assert.equal(second.bindings.missile,'KeyV');
  delete global.localStorage;
});
test('controller remaps reject in-mode collisions and virtual actions do not alter keyboard bindings',()=>{
  const input=fresh(null).input;
  assert(input.bindController('jump',7).error);
  assert(input.bindController('jump',16).saved);
  input.virtual.add('fire');
  assert(input.down('fire'));
  input.virtual.delete('fire');
  assert(!input.down('fire'));
  assert.equal(input.bindings.fire,'Space');
  delete global.localStorage;
});
