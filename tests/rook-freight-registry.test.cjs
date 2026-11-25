const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign'),U=require('../void-runner/universe'),J=require('../void-runner/rook-cargo-jobs');
const G=require('../void-runner/rook-cargo-gen'),registry=require('../void-runner/rook-freight-registry.json');

test('freight desk and Mission Editor share the navigable world registry and cargo definitions',()=>{
 assert.deepEqual(G.defaults(),registry.config);
 assert.deepEqual(registry.goods,J.procedural.goods);
 for(const [id,record] of Object.entries(registry.stations)){
  assert.ok(C.stations[id]);assert.equal(record.system,U.system(id));assert.equal(record.hub,U.systems[record.system].hub);
  assert.equal(record.surface,U.planetside(id));
  const gate=Object.values(C.factionDeliveries).find(f=>U.system(f.destination)===record.system);
  assert.equal(record.gate,gate?.flag||null);
 }
 const cfg=G.defaults();
 assert.deepEqual(G.configErrors(cfg),[]);
 for(const patch of [{cargo:[]},{excluded:cfg.destinations},{minReward:4000},{dialogue:[]}])assert.ok(G.configErrors({...cfg,...patch}).length);
});

test('server freight and older routine contracts have distinct payment rules',()=>{
 const s=C.fresh();s.quest='open';s.contract='rook-run';s.story.flags.rookJob='routine';s.story.flags.rookRunTo='kepler';
 assert.equal(C.rookRun(s).payAt,'delivery');s.story.flags.rookLedger='active-receipt';
 assert.equal(C.rookRun(s).payAt,'rook');assert.equal(C.rookRun(s).reward,0);
 assert.equal(C.cancelRook(s),false);
 s.story.flags.rookOwed='1:500';s.location='meridian';
 assert.equal(C.collectRook(s),0);
});
