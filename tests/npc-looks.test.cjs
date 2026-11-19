/* NPC appearance editor (queue item 0c, 18 Nov 2026): what a model supports, read from its file (npc-looks.js capabilities on the real crowd files' glTF headers and
   on sample metadata), the safety rules (only accessories and hair hide; clothing, body, face and unclassified parts never; licensed models and Reverie / Lace), the
   content shape (mission-content.js), the crowd's pick, the admin inventory the server reads, the colour maths and the page order. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const L=()=>{fresh();return require(R('void-runner/npc-looks.js'));};
const glb=a=>L().metaFromGlb(fs.readFileSync(R('void-runner/assets/models/crowd/'+a+'.glb')));
const data=()=>{const A=require(R('void-runner/character-appearance.js')),bases={};for(const l of Object.values(A.CATALOG.looks))if(!l.street)bases[l.model]=l.base;
 return {bases,fitBodies:Object.keys(JSON.parse(fs.readFileSync(R('void-runner/assets/models/gear/gear-fit.json'),'utf8')).bodies),bindBodies:Object.keys(JSON.parse(fs.readFileSync(R('void-runner/assets/models/parts/bind-data.json'),'utf8')).bodies)};};
const inv=()=>JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).npcLooks;

test('classification: only accessories and hair are hideable; clothing, shoes, body, face and anything unnamed never',()=>{const X=L();
 for(const n of ['district_smuggler.fedora_cocked','x.shades0','x.visor0','x.mask0','x.mask0.slit1','x.collar1','vr_player_a.headset0.strap','backpack','Hat','x.bob02','x.short02','x.ponytail01','x.long01'])assert.ok(X.hideable(n),n);
 for(const n of ['x.male_casualsuit01','x.female_sportsuit01','x.matcreator_mc-scifi-armor_jupiter7','x.matcreator_mc-skinsuit_2022','culturalibre_heroine_suit_2','jacket','Coat','T-Shirt','pants','x.shoes03','boots',
  'x.body','base','output_unwrapped','zz:Body','zz:HeadMesh','x.eyebrow001','x.eyelashes01','x.low-poly','char','Cube.001','Object_7','','strap_top','hat_jacket','shorts'])assert.equal(X.hideable(n),false,n);
 // a generic mesh name takes its material's name (vr-player-a's trackers), but a clothing word anywhere wins
 assert.equal(X.classify('Cube.001','vr_player_a.trackers1.Left'),'accessory');assert.equal(X.classify('Cube.002','x.male_casualsuit03'),'garment');assert.equal(X.classify('Cube.003',''),'unknown');});

test('capabilities are detected from the file: multi-part figures, one-piece Meshy figures, licensed models, Reverie and Lace',()=>{const X=L(),d=data();
 const vr=X.capabilities('vr-player-a',glb('vr-player-a'),d);assert.deepEqual(vr.groups.filter(g=>g.hideable).map(g=>g.label),['Hand trackers (left)','VR headset','Hand trackers (right)','Hair (short)']);
 assert.deepEqual(vr.groups.find(g=>g.label==='VR headset').names,['vr_player_a.headset0','vr_player_a.headset0.lens','vr_player_a.headset0.strap']);   // the lens and strap go with the headset
 assert.ok(vr.groups.some(g=>!g.hideable&&g.kind==='garment'&&/Clothing stays on/.test(g.why)));assert.equal(vr.whole,false);assert.ok(vr.colours.some(c=>c.key==='vr_player_a.male_casualsuit03'));assert.ok(!vr.colours.some(c=>/body|eyebrow|low-poly/.test(c.key)));
 assert.equal(vr.gear.ok,false);assert.match(vr.gear.why,/creator’s skeleton/);
 const dr=X.capabilities('district-resident',glb('district-resident'),d);assert.equal(dr.gear.base,'female');assert.equal(dr.hair.ok,true);assert.deepEqual(dr.hair.native,['district_resident.braid01']);
 assert.equal(X.capabilities('district-smuggler',glb('district-smuggler'),d).gear.base,'male');assert.deepEqual(X.capabilities('district-smuggler',glb('district-smuggler'),d).hair.hats,['district_smuggler.fedora_cocked']);
 for(const a of ['npc-office-f','npc-casual-m','npc-admin','npc-zen-zephyr']){const c=X.capabilities(a,glb(a),d);assert.equal(c.whole,true,a);assert.deepEqual(c.colours.map(x=>x.key),['*'],a);assert.ok(!c.groups.some(g=>g.hideable),a);assert.equal(c.gear.ok,false,a);}
 const rev=X.capabilities('npc-grey-reverie',glb('npc-grey-reverie'),d);assert.equal(rev.street,true);assert.match(rev.gear.why,/ordinary street clothing/);
 const comp=X.capabilities('vr-companion-f',glb('vr-companion-f'),d);assert.equal(comp.licensed,true);assert.equal(comp.gear.ok,false);assert.equal(comp.hair.ok,false);assert.match(comp.gear.why,/licensed/);
 assert.deepEqual(comp.groups.filter(g=>g.hideable).map(g=>g.names[0]),['vr_companion_f.long01']);   // her suit and shoes stay
 // sample metadata (a file the game does not have)
 const s=X.capabilities('npc-sample',X.metaFromGltf({materials:[{name:'Skin'},{name:'Jacket_mat'},{name:'Cap_mat'},{name:'Mystery'}],meshes:[{primitives:[{material:0}]},{primitives:[{material:1}]},{primitives:[{material:2}]},{primitives:[{material:3}]}],
  nodes:[{name:'Body',mesh:0},{name:'Jacket',mesh:1},{name:'Mesh.004',mesh:2},{name:'Thing',mesh:3}],skins:[{joints:[0,1,2]}]}),d);
 assert.deepEqual(s.groups.map(g=>[g.id,g.kind,g.hideable]),[['Body','body',false],['Jacket','garment',false],['Mesh.004','accessory',true],['Thing','unknown',false]]);assert.equal(s.joints,3);
 assert.match(s.groups.find(g=>g.id==='Thing').why,/might be clothing/);});

test('a look is checked: parts, colours, pieces, licensed and street rules, the hat rule, which look is worn',()=>{const X=L(),I=inv();
 const ok={looks:[{id:'look-1',name:'Night shift',hide:['district_smuggler.shades0'],colour:{'district_smuggler.male_casualsuit01':{tint:'#1d2c5a',bright:1.1}},gear:['gear-visor','gear-collar'],hair:'short01'}],use:'look-1'};
 assert.deepEqual(X.problems({'district-smuggler':ok},{inventory:I}),[]);assert.deepEqual(X.problems({'district-smuggler':ok}),[]);
 const bad=(a,e,why,noInv)=>{const p=X.problems({[a]:e},noInv?{}:{inventory:I});assert.ok(p.some(x=>why.test(x)),a+' '+JSON.stringify(e)+' -> '+p.join('|'));};
 const one=l=>({looks:[{id:'look-1',name:'A',...l}],use:'look-1'});
 bad('district-smuggler',one({hide:['district_smuggler.male_casualsuit01']}),/cannot be hidden/);bad('district-smuggler',one({hide:['district_smuggler.male_casualsuit01']}),/cannot be hidden/,true);
 bad('district-smuggler',one({hide:['district_smuggler.body']}),/cannot be hidden/,true);bad('district-smuggler',one({hide:['district_smuggler.shoes01']}),/cannot be hidden/);
 bad('district-smuggler',one({colour:{'district_smuggler.body':{tint:'#ff0000'}}}),/not a colour this model can change/);bad('district-smuggler',one({colour:{'x.body':{tint:'#ff0000'}}}),/body and face/,true);
 bad('district-smuggler',one({colour:{'district_smuggler.male_casualsuit01':{tint:'red'}}}),/#rrggbb/);bad('district-smuggler',one({colour:{'district_smuggler.male_casualsuit01':{hue:500}}}),/hue/);
 bad('district-smuggler',one({hair:'long01'}),/under the hat/);assert.deepEqual(X.problems({'district-smuggler':one({hair:'long01',hide:['district_smuggler.fedora_cocked']})},{inventory:I}),[]);
 bad('npc-office-f',one({gear:['gear-visor']}),/does not fit/);bad('npc-office-f',one({hair:'bob01'}),/does not fit/);bad('npc-office-f',one({gear:['gear-jetpack']}),/unknown gear/);
 bad('vr-companion-f',one({gear:['gear-visor']}),/licensed/,true);bad('vr-companion-f',one({hair:'bob01'}),/licensed/,true);bad('vr-companion-f',one({gear:['gear-visor']}),/licensed/);
 assert.deepEqual(X.problems({'vr-companion-f':one({hide:['vr_companion_f.long01'],colour:{'vr_companion_f.female_elegantsuit01':{hue:30}}})},{inventory:I}),[]);
 bad('vr-companion-f',one({hide:['vr_companion_f.female_elegantsuit01']}),/cannot be hidden/);
 bad('npc-grey-reverie',one({gear:['gear-visor']}),/ordinary street clothing/,true);assert.deepEqual(X.problems({'npc-grey-reverie':one({colour:{'*':{tint:'#8c1f2b'}}})},{inventory:I}),[]);
 bad('npc-office-f',{looks:[],use:'look-9'},/does not exist/);bad('npc-office-f',{looks:[],use:'mix'},/mix needs/);bad('npc-office-f',one({name:'<b>x</b>'}),/plain name/);
 bad('npc-office-f',{looks:[{id:'a',name:'A'},{id:'a',name:'B'}]},/repeated id/);bad('npc-office-f',{looks:Array.from({length:9},(_,i)=>({id:'l'+i,name:'L'}))},/at most 8/);bad('npc-office-f',one({script:'x'}),/unknown fields/);
 bad('no-such-model',one({}),/not a model the editor knows/);assert.deepEqual(X.problems([]),['Looks have an unknown shape.']);});

test('content.looks travels through drafts (fromDrafts), the browser check and apply (env.looks); the crowd pick is stable',()=>{fresh();const MC=require(R('void-runner/mission-content.js')),X=require(R('void-runner/npc-looks.js'));
 const e={looks:[{id:'look-1',name:'Navy',colour:{'*':{tint:'#1d2c5a'}},hide:[],gear:[]},{id:'look-2',name:'Wine',colour:{'*':{hue:-40}}}],use:'mix'};
 const c=MC.fromDrafts({local:{looks:{'npc-office-f':e,'npc-courier':{looks:[],use:'original'},'npc-medic':{looks:[{id:'x',name:'<i>'}]}}}});
 assert.deepEqual(c.looks,{'npc-office-f':{looks:[{id:'look-1',name:'Navy',colour:{'*':{tint:'#1d2c5a'}}},{id:'look-2',name:'Wine',colour:{'*':{hue:-40}}}],use:'mix'}});   // empty and invalid entries are not sent
 assert.equal(MC.check(c,{}).ok,true);const env={};const r=MC.apply(c,env,{});assert.deepEqual(r.refused,[]);assert.deepEqual(env.looks,c.looks);assert.ok(r.applied.some(x=>/NPC look/.test(x)));
 assert.equal(MC.check({format:MC.FORMAT,version:MC.VERSION,looks:{'npc-office-f':{looks:[{id:'a',name:'A',hide:['x.male_casualsuit01']}]}}},{}).ok,false);
 assert.equal(MC.check({format:MC.FORMAT,version:MC.VERSION,looks:{'npc-office-f':{looks:[{id:'a',name:'A',hide:['x.shades0']}]}}},{lookInventory:inv()}).ok,false);   // the inventory: npc-office-f has no shades
 const counts={};for(let i=0;i<200;i++){const l=X.pick(e,'person-'+i);counts[l.id]=(counts[l.id]||0)+1;assert.equal(X.pick(e,'person-'+i),l);}assert.ok(counts['look-1']>50&&counts['look-2']>50,JSON.stringify(counts));
 assert.equal(X.pick({...e,use:'look-2'},'a').id,'look-2');assert.equal(X.pick({...e,use:'original'},'a'),null);assert.equal(X.pick(null,'a'),null);});

test('colour settings become the street-variant shader: a picked colour keeps light and dark, a separate material skips the skin test, equal settings share one material',()=>{const X=L(),V=require(R('void-runner/npc-variants.js'));
 const a=X.variant({tint:'#8c1f2b'},false),b=X.variant({tint:'#8c1f2b'},false),c=X.variant({tint:'#8c1f2b'},true),h=X.variant({hue:90,sat:.5,bright:1.2},false);
 assert.equal(a.id,b.id);assert.notEqual(a.id,c.id);assert.equal(a.s,0);assert.ok(a.t[0]>a.t[1]);assert.equal(h.h,.25);assert.equal(h.s,.5);assert.equal(h.v,1.2);
 assert.equal(V.uniforms(a)[1][3],1);assert.equal(V.uniforms(c)[1][3],2);assert.equal(V.uniforms({id:'orig'})[1][3],0);assert.match(V.GLSL,/step\(vNpcTintB\.a,1\.5\)/);assert.match(V.WGSL,/step\(uniforms\.vNpcTintB\.a,1\.5\)/);});

test('the admin inventory (the server’s copy) lists every crowd model with what may change, and agrees with npc-looks.js',()=>{const X=L(),I=inv(),C=require(R('void-runner/crowd.js')),d=data();
 assert.deepEqual(Object.keys(I.assets).sort(),Object.keys(C.clips).sort());assert.deepEqual(I.gear,Object.keys(X.GEAR));
 for(const [a,x] of Object.entries(I.assets)){const f=R('void-runner/assets/models/crowd/'+a+'.glb');if(!fs.existsSync(f)){assert.deepEqual(x.parts,[],a);assert.deepEqual(x.colours,['*'],a);continue;}
  assert.deepEqual(x,X.summary(X.capabilities(a,glb(a),d)),a);for(const p of x.parts)assert.ok(X.hideable(p),a+' '+p);}
 for(const a of Object.keys(I.assets).filter(a=>X.LICENSED.test(a)))assert.ok(I.assets[a].licensed&&!I.assets[a].gear&&!I.assets[a].hair,a);
 for(const a of X.STREET)assert.ok(I.assets[a].street&&!I.assets[a].parts.length,a);
 const A=require(R('void-runner/character-appearance.js'));assert.deepEqual(Object.fromEntries(Object.entries(A.CATALOG.hair).map(([k,v])=>[k,v.hatOk])),Object.fromEntries(Object.entries(X.HAIR).map(([k,v])=>[k,v.hatOk])));});

test('the page loads npc-looks.js after the crowd and the variants; the editor and draft carry looks; no model file is written',()=>{const html=fs.readFileSync(R('void-runner.html'),'utf8'),at=s=>html.indexOf('src="void-runner/'+s+'"');
 assert.ok(at('npc-looks.js')>at('crowd.js')&&at('npc-looks.js')>at('npc-variants.js')&&at('crowd.js')>0);assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 const ed=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8'),me=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8'),nl=fs.readFileSync(R('void-runner/npc-looks.js'),'utf8');
 assert.ok(!/Appearance \(coming next\)/.test(ed));assert.match(ed,/data-npc-look-new/);assert.match(me,/looks:d\.looks\|\|\{\}/);assert.match(me,/looks:b\.looks\|\|\{\}/);
 assert.ok(!/writeFile|indexedDB|localStorage|fetch\([^)]*method/.test(nl));   // reads only (the fit data); never stores or uploads anything
 assert.match(nl,/remote-player:\|avatar-preview/);});   // player figures are never dressed in an NPC look
