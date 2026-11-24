const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Z=require('../void-runner/zones.js');
const ctx={VoidZones:Z,document:{createElement:()=>({}),body:{append(){}},addEventListener(){}},addEventListener(){},canvas:{addEventListener(){}},update(){},draw(){},openGameMenu(){}};
vm.runInNewContext(fs.readFileSync(require.resolve('../void-runner/skirmish.js'),'utf8'),ctx);
const S=ctx.VoidSkirmish;
test('three-sector station starts friendly; both doorway transitions and enemy posts are consistent',()=>{
 assert.equal(S.zoneAt({z:S.layout.spawn[2]}),'friendly');
 assert.equal(S.zoneAt({z:-10}),'neutral');assert.equal(S.zoneAt({z:10}),'hostile');
 assert.equal(S.sectors[0].enemies.length,0);
 for(const s of S.sectors.slice(1)){assert.ok(s.enemies.length);for(const [x,z] of s.enemies){assert.equal(S.zoneAt({z}),s.id);assert.ok(!S.layout.solids.some(b=>Math.abs(x-b.position[0])<b.size[0]/2+.38&&Math.abs(z-b.position[2])<b.size[2]/2+.38));}}
 for(const z of [-10,10])assert.ok(!S.layout.solids.some(b=>Math.abs(b.position[0])<b.size[0]/2+.38&&Math.abs(z-b.position[2])<b.size[2]/2+.38));
});
test('shared campaign rules lock friendly and allow first-press fire in neutral and hostile',()=>{
 const st={armedAt:null},esc={at:null,until:0},c=Z.tune();
 assert.equal(Z.press(st,'friendly',0,c),'locked');assert.equal(Z.press(st,'neutral',1,c),'fire');
 Z.provoke(esc,'neutral',1.1,c);
 assert.equal(Z.hostileNow(esc,'neutral',2),true);assert.equal(Z.hostileNow(esc,'friendly',2),false);
 assert.equal(Z.press(st,'hostile',3,c),'fire');
});

test('the separate faction scenario uses real station doorways and noncombatants',()=>{
 const stationContext={URL,document:{currentScript:{src:'https://example.test/void-runner/derelict-station.js'}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../void-runner/derelict-station.js'),'utf8'),stationContext);
 const room=stationContext.VoidDerelictStation.layout;
 assert.notEqual(room.id,S.layout.id);
 assert.equal(S.factionZone({z:room.spawn[2]}),'friendly');
 for(const post of S.factionPosts)for(const [x,z] of post.enemies){
  assert.equal(S.factionZone({z}),post.id);
  assert.ok(!room.solids.some(b=>Math.abs(x-b.position[0])<b.size[0]/2+.38&&Math.abs(z-b.position[2])<b.size[2]/2+.38),'clear post '+[x,z]);
 }
 assert.ok(S.factionPosts.some(group=>group.civilian&&group.id==='neutral'));
 for(const [z,from,to] of [[-27,'friendly','neutral'],[72,'neutral','hostile']]){
  assert.equal(S.factionZone({z:z-.5}),from);assert.equal(S.factionZone({z:z+.5}),to);
  assert.ok(!room.solids.some(b=>Math.abs(b.position[0])<b.size[0]/2+.38&&Math.abs(z-b.position[2])<b.size[2]/2+.38));
 }
});
