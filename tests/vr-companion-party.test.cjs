// Ava and Eva: their names, looks (defaults, parts, variant textures, saving), coming along together, the picker,
// the VR menu's look rows, and how a retired companion hands over to a successor (Seren, later).
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/vr-companions.js');
const store=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
const registered=[];globalThis.VoidVR={register:e=>registered.push(e)};
globalThis.VoidVRKit={kit(){},spot:(id,label,x,z,range=2.4)=>({id:'vr-'+id,label,position:[x,1.7,z],action:'vr-act',range})};
globalThis.VoidCrowd=require('../void-runner/crowd.js');
delete require.cache[require.resolve('../void-runner/vr-suite.js')];require('../void-runner/vr-suite.js');
const suite=registered.find(e=>e.id==='suite');

test('Ava and Eva are their permanent names; nothing player-facing says PrettyGirl',()=>{
 const ava=C.get('ava'),eva=C.get('eva');
 assert.equal(ava.name,'Ava');assert.equal(eva.name,'Eva');assert.equal(C.get('pg'),null);
 for(const e of [ava,eva]){assert.equal(e.sex,'female');assert.doesNotMatch(JSON.stringify({n:e.name,a:e.about,p:e.preview,l:e.looks}),/pretty ?girl/i);}
 assert.equal(eva.preview,'void-runner/assets/vr/companions/eva.jpg');
});

test('each has their own empty personality, dialogue and voice identity (nothing of Seren\'s)',()=>{
 const seren=C.get('seren');
 for(const e of [C.get('ava'),C.get('eva')]){assert.deepEqual(e.dialogue,{});assert.deepEqual(e.personality,{});assert.equal(C.speaks(e),false);
  assert.ok(e.voice?.characterId&&e.voice.voiceId===null);assert.notEqual(e.dialogue,seren.dialogue);}
 assert.notEqual(C.get('ava').voice.characterId,C.get('eva').voice.characterId);
 assert.equal(C.speaks(seren),true);
});

test('default looks are David\'s picks',()=>{
 assert.deepEqual(C.chosen(C.get('ava')),{outfit:'red',hair:'bob',glasses:'none',face:'natural'});
 assert.deepEqual(C.chosen(C.get('eva')),{outfit:'white',hair:'natural',eyes:'brown',face:'5'});
 assert.deepEqual(C.lookTextures(C.get('eva')),{},'the defaults are the model\'s own textures');
});

test('a look shows its own parts and hides the rest of its group; other parts are untouched',()=>{
 const ava=C.get('ava');
 const red=C.wears(ava,{}),bikini=C.wears(ava,{outfit:'bikini',hair:'pixie',glasses:'round'});
 assert.ok(red('top_red')&&red('skirt_red')&&red('bikini_bottom')&&!red('bikini_top')&&!red('skin_under'));
 assert.ok(red('hair_bob')&&!red('hair_long')&&!red('hair_pixie')&&!red('glasses_round')&&!red('glasses_wire'));
 assert.ok(bikini('bikini_top')&&bikini('skin_under')&&!bikini('top_red')&&bikini('hair_pixie')&&!bikini('hair_bob')&&bikini('glasses_round'));
 for(const shared of ['body','brows','sandals'])assert.ok(red(shared)&&bikini(shared),shared);
 const eva=C.get('eva');assert.deepEqual(C.lookTextures(eva,{outfit:'pink'}),{cloth:'cloth-pink'});assert.deepEqual(C.lookTextures(eva,{outfit:'white'}),{});
 assert.deepEqual(C.lookTextures(eva,{hair:'ginger',eyes:'green',face:'2'}),{hair:'hair-ginger',eye_r3:'eyes-green',eye_l3:'eyes-green',head5:'face-02'});
 assert.equal(C.option(ava,'hair','no-such-style').id,'bob');
});

test('every variant texture Ava and Eva can ask for is installed (where their models are built locally)',t=>{
 const fs=require('fs'),path=require('path'),built=[C.get('ava'),C.get('eva')].filter(e=>fs.existsSync(path.join(__dirname,'../void-runner/assets/models/crowd',C.file(e))));
 if(!built.length)return t.skip('models kept out of the repository until their licences are confirmed');
 for(const e of built)for(const g of C.looks(e))for(const o of g.options)for(const f of Object.values(o.textures||{}))
  assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/models/crowd',e.model,f+'.vrtex')),e.id+' '+f);
});

test('looks are saved per companion and survive a bad or missing record',()=>{
 const s=store(),ava=C.get('ava'),eva=C.get('eva');
 assert.ok(C.saveLook(ava,'outfit','bikini',s));assert.ok(C.saveLook(ava,'hair','long',s));assert.ok(C.saveLook(eva,'hair','black',s));
 assert.deepEqual(C.savedLooks(ava,s),{outfit:'bikini',hair:'long',glasses:'none',face:'natural'});
 assert.equal(C.savedLooks(eva,s).hair,'black');assert.equal(C.savedLooks(eva,s).outfit,'white');
 assert.equal(C.saveLook(ava,'nonsense','x',s),false);
 assert.deepEqual(C.savedLooks(ava,store({'void-runner-companion-looks-v1':'{not json'})),{outfit:'red',hair:'bob',glasses:'none',face:'natural'});
 assert.equal(C.savedLooks(ava,store({'void-runner-companion-looks-v1':'{"ava":{"hair":"gone"}}'})).hair,'bob');
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(C.savedLooks(ava,broken).outfit,'red');assert.equal(C.saveLook(ava,'outfit','bikini',broken),false);
 assert.deepEqual(C.savedLooks(C.get('nadia'),s),{});
});

test('Ava and Eva can come along together; companions that can\'t pair come alone',()=>{
 assert.deepEqual(C.party({companions:['ava','eva']}).map(e=>e.id),['ava','eva']);
 assert.deepEqual(C.party({companions:['eva','ava','eva']}).map(e=>e.id),['eva','ava']);
 assert.deepEqual(C.party({companion:'eva'}).map(e=>e.id),['eva']);
 assert.deepEqual(C.party({companions:['ava','nadia']}).map(e=>e.id),['ava'],'Nadia is not pairable');
 assert.deepEqual(C.party({companions:['nope','eva']}).map(e=>e.id),['eva']);
 assert.deepEqual(C.party({choice:'f'}).map(e=>e.id),['seren']);
});

test('the bedroom has a talk spot per companion and every spot is reachable',()=>{
 const one=suite.layout({companion:'ava'}),two=suite.layout({companions:['ava','eva']});
 assert.ok(one.interactions.some(i=>i.id==='vr-companion'));assert.ok(!one.interactions.some(i=>i.id==='vr-companion-2'));
 assert.ok(two.interactions.some(i=>i.id==='vr-companion')&&two.interactions.some(i=>i.id==='vr-companion-2'));
 const E=require('../void-runner/exploration-controller.js');
 for(const [x,z] of [[3.6,.3],[3.6,-1.5],[-3.7,.55],[-3.7,-1.95]])assert.equal(E.blocked(x,z,two),false,'slot spot '+x+','+z);
});

test('the picker brings both when a second pairable companion is chosen, and remembers the choice',()=>{
 const step=suite.picker.steps[1];
 assert.deepEqual(step.select(null,'ava'),['ava']);
 assert.deepEqual(step.select(['ava'],'eva'),['ava','eva']);
 assert.deepEqual(step.select(['ava','eva'],'eva'),['ava']);
 assert.deepEqual(step.select(['ava'],'seren'),['seren'],'Seren comes alone');
 assert.deepEqual(step.select(['seren'],'ava'),['ava']);
 assert.deepEqual(suite.picker.options(['female',['ava','eva']]),{companions:['ava','eva']});
 assert.deepEqual(suite.picker.options(['female',['eva']]),{companion:'eva'});
 assert.deepEqual(suite.picker.options(['female','seren']),{companion:'seren'});
});

test('Ava and Eva are released on the live site, their models from the private asset repository',()=>{
 for(const id of ['ava','eva']){const e=C.get(id);assert.equal(e.listed,undefined);assert.equal(e.licensed,true);
  assert.equal(C.offered(e,'localhost'),true);assert.equal(C.offered(e,'thedarknetdistrict.com'),true);}
 assert.equal(C.offered(C.get('seren'),'thedarknetdistrict.com'),true);
 assert.deepEqual(suite.picker.steps[1].choices(['female']).map(c=>c.id),['seren','nadia','ava','eva','base-f'],'the public female gallery adds the released companions');
});

test('the VR menu has look rows per companion, named when two are in the room',()=>{
 const keys=opts=>suite.settings(opts).map(o=>o.key);
 assert.deepEqual(keys({companion:'ava'}),['mood','music','look-ava-outfit','look-ava-hair','look-ava-glasses','look-ava-face']);
 assert.deepEqual(keys({companion:'eva'}),['mood','music','look-eva-outfit','look-eva-hair','look-eva-eyes','look-eva-face']);
 const both=suite.settings({companions:['ava','eva']});
 assert.equal(both.find(o=>o.key==='look-ava-hair').label,'Ava: Hairstyle');assert.equal(both.find(o=>o.key==='look-eva-hair').label,'Eva: Hair colour');
 assert.deepEqual(keys({companion:'seren'}),['mood','music']);
 assert.equal(suite.settings({companion:'ava'}).find(o=>o.key==='look-ava-hair').label,'Hairstyle');
});

test('a retired companion hands over to their successor, for old links and saves too',()=>{
 const seren=C.get('seren');
 assert.equal(C.resolve({companion:'seren'}).id,'seren','Seren is still in place for now');
 seren.replacedBy='ava';
 try{
  assert.equal(C.resolve({companion:'seren'}).id,'ava');
  assert.equal(C.resolve({choice:'f'}).id,'ava','old f/m links');
  assert.deepEqual(C.party({companion:'seren'}).map(e=>e.id),['ava']);
  assert.equal(C.offered(seren,'localhost'),false,'not offered at the terminal');
  assert.equal(C.resolve({choice:'m'}).id,'kai','Kai is untouched');
  assert.equal(C.resolve({companion:'nadia'}).id,'nadia','Nadia is untouched');
 }finally{delete seren.replacedBy;}
});
