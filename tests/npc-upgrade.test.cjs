/* The NPC and character-creator upgrade (18 Nov 2026, docs/development/NPC_UPGRADE.md): the 25 Meshy street figures, who stands in for the old anonymous looks, where
   each kind of person is placed, the colour variants, and the creator's new bases with old saves still loading. No browser needed. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/crowd.js'),V=require('../void-runner/npc-variants.js'),N=require('../void-runner/ncz-nightlife.js'),A=require('../void-runner/character-appearance.js'),CAT=A.CATALOG;
const HubA=require('../tools/district-hub/appearance/character-appearance.js'),{Hub}=require('../tools/district-hub/protocol.cjs');
const ROOT=path.join(__dirname,'..'),CROWD=path.join(ROOT,'void-runner/assets/models/crowd');
const glb=f=>{const b=fs.readFileSync(f),n=b.readUInt32LE(12);return {size:b.length,json:JSON.parse(b.slice(20,20+n).toString())};};
const seeded=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const STREET=Object.keys(C.street);

test('25 street figures: concepts 1-24 without the monk (#18), and the two creator bases 26 and 27',()=>{
 assert.equal(STREET.length,25);assert.deepEqual(STREET.map(l=>C.street[l].n).sort((a,b)=>a-b),[...Array.from({length:24},(_,i)=>i+1).filter(n=>n!==18),26,27]);
 for(const l of STREET){assert.match(l,/^npc-[a-z-]+$/);assert.ok(['f','m'].includes(C.street[l].sex),l);assert.ok(C.street[l].roles.length,l);}
});
test('every street figure file is rigged on the 24-joint skeleton, about 30k triangles, JPEG maps, under 5 MB, and carries exactly its clips',()=>{
 for(const l of STREET){const {size,json}=glb(path.join(CROWD,l+'.glb'));
  assert.ok(size<5e6,l+' is '+size+' bytes');assert.equal(json.skins.length,1,l);assert.equal(json.skins[0].joints.length,24,l);assert.equal(json.meshes.length,1,l+' is one mesh');assert.equal(json.materials.length,1,l+' has one material');
  const tris=json.meshes[0].primitives.reduce((s,p)=>s+json.accessors[p.indices].count/3,0);assert.ok(tris>25000&&tris<=32000,l+' '+tris+' triangles');
  assert.ok(json.images.every(i=>i.mimeType==='image/jpeg'),l+' maps are JPEG');
  const names=json.animations.map(a=>a.name);assert.deepEqual([...names].sort(),[...C.clips[l]].sort(),l+' clips');
  const joints=json.skins[0].joints.map(j=>json.nodes[j].name);for(const b of ['Hips','Head','LeftArm','RightArm','LeftHand','RightHand','LeftUpLeg','RightUpLeg'])assert.ok(joints.includes('mixamorig:'+b),l+' '+b);   /* the game's Mixamo names (build_imported_character.py) */}
});
test('every street figure has the street clips the crowd and the V1 behaviour use (idle, walk, talk, sit, look, watch and the rest)',()=>{
 for(const l of STREET){for(const c of C.STREET_CLIPS)assert.ok(C.clips[l].includes(c),l+' '+c);assert.equal(C.clipIn(l,'typing'),'watch');assert.equal(C.clipIn(l,'wipe'),'interact');}
 for(const c of ['vr-aim','vr-shoot','vr-duck'])assert.ok(C.clips['npc-security'].includes(c),'Cade (the shooter booth) '+c);for(const c of ['dance','pickup','interact','menu','menu-tap','talk'])assert.ok(C.clips['npc-club-f'].includes(c),'Lumi (the social booth) '+c);
});
test('the old anonymous looks map to new figures; their files and ids stay (named characters and other places still use them)',()=>{
 for(const old of ['district-resident','regular-01','ncz-neon','fixer-01','runner-02','hacker-01','outlaw-01','district-smuggler','cyborg-01','vr-player-a','vr-player-b']){
  const to=C.swap(old);assert.ok(C.street[to],old+' -> '+to);assert.ok(fs.existsSync(path.join(CROWD,old+'.glb')),old+' file kept');assert.ok(C.clips[old],old+' clip list kept');}
 assert.equal(C.swap('npc-rin'),'npc-rin');assert.equal(C.swap('vr-companion-m'),'vr-companion-m','companions are never swapped');
 // NeoChinatown's casts are street figures now; the off-world places keep theirs (not reachable without a ship)
 for(const l of [...C.casts.neochinatown,...C.casts.district])assert.ok(C.street[l],l);assert.deepEqual(C.casts.vesper,['vesper-mechanic','vesper-trader','vesper-pilot']);
 const P=require('../void-runner/district-people.js');assert.equal(P.lookFor('vr-player-a'),'npc-security');assert.equal(P.lookFor('vr-player-b'),'npc-club-f');assert.equal(P.lookFor('crew-bar1'),'npc-rin','named residents keep their own model');
 for(const f of ['ncz-alley.js','ncz-outskirts-life.js','ncz-nightclub.js']){const src=fs.readFileSync(path.join(ROOT,'void-runner',f),'utf8'),cast=src.match(/CAST=\[([^\]]*)\]/)[1];assert.ok(!/'ncz-neon'|'runner-02'|'district-resident'/.test(cast),f+' cast is street figures');}
});
test('placement: corporate types toward the Function Gate, club-goers round NULL, the Outskirts\' own people only in the Outskirts, cooks, vendor and busker never walk',()=>{
 const share=(x,z,q,ls)=>{let n=0,k=0;for(let i=0;i<400;i++){const l=C.orderAt(x,z,q,'p'+i)[0];if(ls.includes(l))k++;n++;}return k/n;};
 const corp=['npc-security','npc-executive','npc-office-f','npc-office-m'],club=['npc-club-f','npc-club-m'];
 assert.ok(share(12,-12.5,'avenue',corp)>.5,'most walkers by the Function Gate are corporate');assert.ok(share(120,-12.5,'avenue',corp)<.25,'few at the far end of the Avenue');
 assert.ok(share(52,-58,'oldtown',club)>.25,'club-goers by NULL');assert.ok(share(61,-110,'oldtown',club)<.05,'none at the south end of Old Town');
 assert.ok(share(60,-240,'outskirts',['npc-outskirts-f','npc-outskirts-m'])>.5,'the Outskirts');assert.equal(share(61,-90,'oldtown',['npc-outskirts-f','npc-outskirts-m']),0,'never in town');
 for(const q of ['oldtown','avenue','far-south',null])assert.equal(share(61,-60,q,['npc-cook-old','npc-cook-f','npc-vendor','npc-busker']),0,'cooks, the vendor and the busker are not walkers');
 assert.ok(C.orderAt(10,-12,'avenue','x').includes('npc-security'));assert.ok(!C.orderAt(10,-12,'avenue','x').some(l=>/monk/.test(l)),'monks are dealt by monkShare');
});
test('the street plan puts the cooks at food shopfronts, one vendor and one busker per quarter that has them, and keeps the monk rule',()=>{
 for(const q of ['oldtown','far-south','avenue']){const p=N.plan('medium',seeded(7),undefined,q),fronts=N.foodFronts(N.lanesFor(q));
  const cooks=p.filter(x=>x.kind==='cook');assert.equal(cooks.length,N.config.cooks.medium,q+' cooks');for(const c of cooks){assert.ok(fronts.some(f=>f.word===c.sign),c.sign);assert.ok(['talk','idle'].includes(c.clip));}
  assert.equal(p.filter(x=>x.kind==='vendor').length,N.config.vendorIn.includes(q)?1:0,q+' vendor');assert.equal(p.filter(x=>x.kind==='busker').length,N.config.buskerIn.includes(q)?1:0,q+' busker');
  // the street figures of each quarter include the people its spots need (crowd.js SPOTS kept in step with ncz-nightlife.js)
  const want=C.SPOTS[q];assert.equal(want.includes('vendor'),N.config.vendorIn.includes(q),q);assert.equal(want.includes('busker'),N.config.buskerIn.includes(q),q);assert.ok(want.includes('cook'));
  for(const t of ['low','medium','high'])for(const k of want)for(const l of C.pools[k])assert.ok(C.streetFigures(q,t).includes(l),q+' '+t+' loads '+l);}
 for(const t of ['low','medium','high']){const n=['oldtown','avenue','far-south','outskirts','port'].map(q=>C.streetFigures(q,t).length);assert.ok(Math.max(...n)<=C.STREET_CAP[t],t+' '+n);}
 assert.ok(C.streetFigures('oldtown','low').length<C.streetFigures('oldtown','high').length,'Low downloads fewer figures');
 assert.ok(N.monkShareAt(148,-12.5)>N.monkShareAt(60,-60)*5,'monks still thicken toward the East Gate');
 const models=Object.keys(C.models('neochinatown','medium','street','avenue'));for(const m of ['npc-monk-elder','npc-monk-tech','npc-monk-grey','npc-security'])assert.ok(models.includes('crowd:'+m),m);
 assert.ok(Object.values(C.models('neochinatown','medium','street','avenue')).every(d=>d.background),'every figure loads in the background');
});
test('every figure has 2-4 colour variants; a person always gets the same one and neighbours differ',()=>{
 for(const l of STREET){const v=V.variantsOf(l);assert.ok(v&&v.length>=3&&v.length<=4,l);assert.equal(v[0].id,'orig');assert.equal(new Set(v.map(x=>x.id)).size,v.length,l);
  for(const x of v){const [a,b]=V.uniforms(x);assert.ok([...a,...b].every(Number.isFinite),l+' '+x.id);}}
 assert.equal(V.pick('npc-hacker','night-3'),V.pick('npc-hacker','night-3'));
 const seen=new Set();for(let i=0;i<40;i++)seen.add(V.pick('npc-casual-f','night-'+i));assert.equal(seen.size,V.variantsOf('npc-casual-f').length,'all variants are used');
 const c=V.colour({id:'crimson',hex:'#8c1f2b'});assert.equal(c.s,0);assert.ok(c.t[0]>c.t[1]);assert.equal(V.find('npc-hacker',c),c);assert.equal(V.find('npc-hacker','worn').id,'worn');
 assert.match(V.GLSL,/skin/);assert.match(V.WGSL,/skin/);
});
test('the character creator: six street bases with their colour versions replace the old figures; old saves load as the figure that replaced them',()=>{
 const live=Object.entries(CAT.looks).filter(([,l])=>!l.retired);assert.equal(live.length,18);assert.ok(live.every(([,l])=>l.street));
 assert.deepEqual([...new Set(live.map(([,l])=>l.model))].sort(),['npc-casual-f','npc-casual-m','npc-hacker','npc-merc','npc-office-f','npc-office-m']);
 for(const [id,l] of live){assert.equal(l.base,C.street[l.model].sex==='f'?'female':'male',id);assert.ok(V.find(l.model,l.variant),id+' variant');}
 for(const base of ['male','female']){const o=A.options(A.defaults(A.DEFAULT_LOOK[base]));assert.equal(o.looks.length,9);assert.ok(o.looks.every(x=>!CAT.looks[x.id].retired));assert.equal(o.hairColor,false);
  assert.deepEqual(o.hair.filter(h=>h.enabled).map(h=>h.id),['native']);assert.deepEqual(o.accessories,[]);}
 // every retired look moves to a street look of the same body, keeping the clothing colour; anything else is untouched
 for(const [id,l] of Object.entries(CAT.looks).filter(([,l])=>l.retired)){const old={...A.defaults(id),clothingColor:'teal'},m=A.migrate(old);
  assert.equal(m.look,l.replacedBy);assert.equal(m.base,old.base);assert.equal(m.clothingColor,'teal');assert.equal(m.hair,'native');assert.equal(m.hairColor,null);assert.deepEqual(m.accessories,[]);assert.ok(A.validate(m));
  assert.ok(A.validate(old),'the old look is still valid (named characters such as Juno Vex use it)');}
 const fresh={...A.defaults('street-merc-slate'),clothingColor:'navy'};assert.deepEqual(A.migrate(fresh),fresh);assert.equal(A.migrate('junk'),'junk');
 assert.equal(A.validate({...A.defaults('street-hacker'),hair:'bob01'}),false);assert.equal(A.validate({...A.defaults('street-hacker'),hairColor:'jet'}),false);assert.equal(A.validate({...A.defaults('street-hacker'),accessories:['gear-visor']}),false);
 assert.deepEqual(A.toLegacy(A.defaults('street-casual-f')),{gender:'female',model:'district-resident'},'the old server field keeps its two presets');
 // the hub copy shows an old player's look as the street figure too
 const hub=new Hub({send(){},close(){},now:()=>1e6}),shown=hub.look({uid:'u',anonymous:false,model:'district-smuggler',appearance:{...HubA.defaults('fixer-01'),clothingColor:'plum'}});
 assert.equal(shown.appearance.look,'street-office-f');assert.equal(shown.model,'npc-office-f');assert.equal(shown.appearance.clothingColor,'plum');
});
test('the creator figures are real files the hub may render, and the scene keeps their ids',()=>{
 const {RENDERABLE}=require('../tools/district-hub/protocol.cjs');for(const m of ['npc-casual-f','npc-casual-m','npc-hacker','npc-merc','npc-office-f','npc-office-m'])assert.ok(RENDERABLE.includes(m),m);
 const src=fs.readFileSync(path.join(ROOT,'void-runner/character-assembler.js'),'utf8');assert.match(src,/look\.street\?look\.topY/);assert.match(src,/VoidNPCVariants/);
 const html=fs.readFileSync(path.join(ROOT,'void-runner.html'),'utf8');assert.ok(html.indexOf('npc-variants.js')>html.indexOf('character-finish.js')&&html.indexOf('npc-variants.js')<html.indexOf('crowd.js'),'variants load before the crowd');
});
