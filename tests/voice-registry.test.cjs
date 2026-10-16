const test=require('node:test'),assert=require('node:assert/strict');
const path=require('path'),Registry=require(path.join(__dirname,'..','tools','audio','voice-registry.cjs'));
const clone=()=>JSON.parse(JSON.stringify(Registry.load()));

test('the voice registry is valid and every recurring NPC has a permanent entry',()=>{
  const reg=Registry.load();assert.deepEqual(Registry.validate(reg),[]);
  for(const who of ['mara','elias','rook','admin','iris','elara','marcus','kess','mercer'])assert(reg.npcs[who],who);
  assert.equal(reg.npcs.iris.profile,'android');assert.equal(reg.npcs.elias.profile,'hologram');
});
test('the special character slot stays reserved with no voice',()=>{
  const reg=clone();assert.equal(reg.reserved['special-character'].status,'reserved');assert(!reg.reserved['special-character'].voice);
  reg.reserved['special-character'].voice='af_bella';assert.match(Registry.validate(reg).join(),/reserved slot/);
});
test('an approved voice is locked: changing its voice, speed or accent without re-approval fails',()=>{
  const reg=clone(),e=reg.npcs.rook;e.status='approved';e.approvedConfigHash=Registry.configHash(e,reg.engine);
  assert.deepEqual(Registry.validate(reg),[]);
  for(const change of [{voice:'am_adam'},{speed:1.05},{lang:'en-gb'}]){
    const r=clone(),x=Object.assign(r.npcs.rook,{status:'approved',approvedConfigHash:e.approvedConfigHash},change);
    assert.match(Registry.validate(r).join(),/rook: APPROVED VOICE CHANGED/,JSON.stringify(change));
  }
  // Live processing and notes are not part of the voice identity.
  const r=clone();Object.assign(r.npcs.rook,{status:'approved',approvedConfigHash:e.approvedConfigHash,notes:'x'});assert.deepEqual(Registry.validate(r),[]);
});
test('a different model file invalidates approvals',()=>{
  const reg=clone(),e=reg.npcs.mara;e.status='approved';e.approvedConfigHash=Registry.configHash(e,reg.engine);
  reg.engine.modelSha256='0'.repeat(64);assert.match(Registry.validate(reg).join(),/mara: APPROVED VOICE CHANGED/);
});
test('two characters can never share a voice',()=>{
  const reg=clone();reg.npcs.marcus.voice=reg.npcs.rook.voice;assert.match(Registry.validate(reg).join(),/shared with another NPC/);
});
test('the fingerprint matches the Python pipeline',()=>{
  // Same key as config_hash() in tools/audio/generate.py; pinned so neither side drifts.
  const reg=Registry.load(),e={voice:'af_nicole',speed:.94,lang:'en-us'};
  assert.equal(Registry.configHash(e,reg.engine),require('crypto').createHash('sha256').update('kokoro-v1.0.onnx|7d5df8ecf7d4b187|af_nicole|0.940|en-us').digest('hex').slice(0,12));
});
