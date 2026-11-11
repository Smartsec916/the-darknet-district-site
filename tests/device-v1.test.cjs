'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../void-runner/device-v1.js'),N=require('../void-runner/neochinatown.js'),A=require('../void-runner/character-appearance.js');

test('V1 is the default device and the registry is the extension point',()=>{
 assert.equal(D.restore({}).model,'v1');assert.equal(D.DEVICES.v1.name,'V1');assert.equal(D.DEVICES.v1.generation,1);
 for(const id of D.DEVICES.v1.apps)assert.ok(D.APPS[id],id);
 assert.deepEqual(Object.keys(D.APPS).filter(k=>D.APPS[k].state==='placeholder').sort(),['camera','gallery'],'only the camera and the gallery are placeholders');
 assert.equal(D.DEVICES.v1.camera.enabled,false);
 assert.deepEqual(Object.keys(D.DEVICES),['v1'],'no V2/V3 exists yet');assert.equal(D.STORE_EXTRA.length,0,'nothing is for sale');
});
test('saved device state: unknown values are ignored, built-in apps stay installed, settings are whitelisted, a save without it loads',()=>{
 const flags={campaignEpoch:1};const d=D.restore(flags);assert.deepEqual(d.apps,D.DEVICES.v1.apps);assert.deepEqual(d.settings,D.DEFAULT_SETTINGS);
 D.write(flags,{...d,settings:{...d.settings,motion:'reduced'}});
 assert.equal(flags.deviceModel,'v1');assert.equal(typeof flags.deviceSettings,'string');assert.ok(flags.deviceSettings.length<=200);
 assert.equal(D.restore(flags).settings.motion,'reduced');
 const hostile=D.restore({deviceModel:'v99',deviceApps:'../../x,missions,<img>',deviceSettings:'motion=evil;scan=1;size=huge;__proto__=x',deviceMapInterior:'zz<script>ff'});
 assert.equal(hostile.model,'v1');assert.ok(!hostile.apps.includes('../../x'));assert.equal(hostile.settings.motion,'auto');assert.equal(hostile.settings.size,'half');assert.equal(hostile.map.interior,'cff','only hexadecimal characters survive');assert.ok(/^[0-9a-f]*$/.test(hostile.map.interior));
 // every value written is something the cloud save validator accepts (booleans, strings up to 200 characters, safe integers)
 for(const v of Object.values(D.write({},D.restore({}))))assert.ok(typeof v==='boolean'||typeof v==='string'&&v.length<=200||Number.isSafeInteger(v));
});
test('App Store: shows installed apps and says nothing more is available; no purchases',()=>{
 const l=D.storeListing(D.restore({}));assert.ok(l.rows.every(r=>r.status==='installed'));assert.equal(l.more,false);
 assert.ok(!JSON.stringify(l).match(/price|\$|credit|buy|purchase/i));
});
test('map exploration uses the real District and street layouts and reveals only what was visited',()=>{
 for(const area of ['interior','street']){
  const layout=N.layout(area),e=D.extent(layout);assert.ok(e);const cells=Math.ceil((e.x1-e.x0)/e.cell)*Math.ceil((e.z1-e.z0)/e.cell);assert.ok(cells<=240,area+' fits the save: '+cells+' cells (cell '+e.cell+' m)');
  assert.equal(D.visible('',layout).solids.length+D.visible('',layout).places.length,0,'nothing is revealed before exploring');
  const s=layout.spawn;let hex=D.explore('',e,s[0],s[2]);assert.ok(hex.length>0&&hex.length<=60);assert.equal(D.explore(hex,e,s[0],s[2]),hex,'exploring the same place changes nothing');
  const v=D.visible(hex,layout);assert.ok(v.solids.length+v.places.length<(layout.solids.length+layout.interactions.length),area+': only part is shown');
  assert.ok(D.explored(hex,e,s[0],s[2]));
  // walking to every interaction reveals every interaction, and only real ones (ids come from the layout)
  let all='';for(const i of layout.interactions)all=D.explore(all,e,i.position[0],i.position[2]);
  const places=D.visible(all,layout).places;assert.equal(places.length,layout.interactions.length);for(const p of places)assert.ok(layout.interactions.some(i=>i.id===p.id));
 }
 const hexRound=D.encode(D.decode('1a3f',40));assert.equal(hexRound,'1a3f');
});
test('profiles: NPCs and players share one shape; private data never appears; unknown NPC facts stay hidden',()=>{
 const p=D.profile('player',{uid:'SECRET-UID-123',email:'a@b.c',handle:'Neon_Fox',publicId:'0123456789ab',appearance:A.defaults('ncz-neon'),bio:'hello'});
 const n=D.profile('npc',{id:'rook',name:'Rook',bio:'Broker',place:'Rook’s booth',affiliation:'Meridian',learned:[],here:false});
 assert.deepEqual(Object.keys(p).sort(),Object.keys(n).sort(),'identical view-model fields');
 assert.ok(!JSON.stringify(p).includes('SECRET-UID')&&!JSON.stringify(p).includes('a@b.c'));
 assert.equal(p.name,'Neon_Fox');assert.equal(p.portrait.state,'ready');assert.equal(n.portrait.state,'unavailable','no model: honest unavailable state, never an invented face');
 assert.equal(D.profile('player',{handle:'<script>',publicId:'x'}).name,'Unregistered visitor');
 assert.equal(p.actions.find(a=>a.id==='message').enabled,false,'private messaging is not pretended');
 assert.deepEqual(n.facts,[]);
});
test('portrait cache keys: a different look, character or asset version never shares a picture',()=>{
 const a=A.defaults('ncz-neon'),b={...a,hair:'bob01'},c={...a,hairColor:'cyan'};
 const k=(id,l,v)=>D.portraitKey('player',id,l,v);
 assert.equal(k('p1',a),k('p1',{...a}),'same look, same key (key order does not matter)');
 assert.notEqual(k('p1',a),k('p1',b));assert.notEqual(k('p1',a),k('p1',c));assert.notEqual(k('p1',a),k('p2',a));assert.notEqual(k('p1',a,1),k('p1',a,2));
 assert.notEqual(D.portraitKey('npc','rook',{model:'x'}),D.portraitKey('npc','rook',{model:'y'}),'an updated NPC model invalidates its portrait');
 assert.notEqual(D.portraitKey('npc','a',{model:'x'}),D.portraitKey('npc','b',{model:'x'}));
});
