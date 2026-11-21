/* Mission-instanced apartments (the owner, 19 Nov 2026: "create me 3 apartment interiors ... as instances I can add for missions"; docs/development/APARTMENTS.md):
   the street doors derived from the city's street edges, the identical footprint of the three apartments, the access points and hacks, the mission data
   (apartments, steps "Go into apartment X" / "Use something in apartment X" / "Hack the access point") checked by the game, completed by the mission engine,
   and the same lists reaching the server through the admin inventory. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const A=()=>require(R('void-runner/apartments.js'));
test('mission registry identifies fixed room numbers, dynamic apartments and access-point-only doors without treating the rest of the building as free',()=>{const a=A(),t={missions:[{id:'m1',title:'Mission one',apartments:[{id:'flat',door:'apt-avenue-n-16',number:105},{id:'dynamic',door:'apt-avenue-n-16'},{id:'modular',door:'apt-avenue-n-30',modules:[{id:'hall'},{id:'flat',number:104}]}],objectives:[{kind:'hack',ap:'apt-avenue-n-23'}]}]};const r=a.addressRegistry([t,t],{});assert.equal(r.size,3);assert.deepEqual(r.get('apt-avenue-n-16').apartments.map(x=>x.numbers),[[105],[]]);assert.equal(r.get('apt-avenue-n-30').apartments[0].modular,true);assert.deepEqual(r.get('apt-avenue-n-30').apartments[0].numbers,[104]);assert.equal(r.get('apt-avenue-n-23').apartments.length,0);assert.equal(r.get('apt-avenue-n-23').missions.length,1);});
test('shipped Reyes apartment 105 reserves its entire street entrance',()=>{const a=A(),r=a.addressRegistry(require(R('void-runner/main-story.js')).trees(),{}),reyes=r.get('apt-avenue-n-30');assert.ok(reyes.missions.length);assert.ok(reyes.apartments.some(x=>x.id==='reyes'&&x.numbers.includes(105)));});
test('address registry reserves inactive mission buildings and lists exact residence slots',()=>{const a=A(),r=a.addressRegistry([{missions:[{id:'one',title:'Secret mission',apartments:[{door:'apt-avenue-n-16'}],objectives:[{kind:'hack',ap:'apt-avenue-n-23'}]}]}],{pinky:{name:'Pinky',residence:{door:'apt-avenue-n-30',slot:1}},iris:{name:'Iris',residence:{door:'apt-avenue-n-30',slot:2}}});assert.deepEqual(r.get('apt-avenue-n-16').missions,[{id:'one',title:'Secret mission'}]);assert.equal(r.get('apt-avenue-n-23').missions.length,1);assert.deepEqual(r.get('apt-avenue-n-30').residents.map(x=>x.slot),[1,2]);});
test('street and apartment access are independent, shared rules fail closed',()=>{const a=A(),d=a.doors().find(x=>x.style==='normal'),base={door:d.id,slot:0,mode:'always',from:'20:00',to:'08:00',streetAccess:{mode:'public'},apartmentAccess:{mode:'item',value:'hacking-device'}},homes=a.residenceInstances({iris:{residence:base},pinky:{residence:{...base,slot:1,apartmentAccess:{mode:'public'}}}});assert.equal(homes.length,2);const s={story:{flags:{}},progression:{personal:{items:[]}},universe:{missions:{}}};assert.equal(a.accessAllows(homes[0].streetAccess,s),true);assert.equal(a.accessAllows(homes[0].apartmentAccess,s),false);assert.equal(a.accessAllows(homes[1].apartmentAccess,s),true);s.progression.personal.items.push('hacking-device');assert.equal(a.accessAllows(homes[0].apartmentAccess,s),true);assert.equal(a.accessAllows({mode:'device',value:'v3'},s,null,'v1'),false);assert.equal(a.accessAllows({mode:'device',value:'v3'},s,null,'v3'),true);assert.equal(a.accessAllows({mode:'mission',value:'draft-foo'},s),false);s.universe.missions['draft-foo']={completed:true};assert.equal(a.accessAllows({mode:'mission',value:'draft-foo'},s),true);const k=a.accessKey(d.id,0);assert.match(k,/^[a-zA-Z][\w-]{0,63}$/);assert.notEqual(k,a.accessKey(d.id));assert.equal(a.accessAllows({mode:'hack'},s,k),false);s.story.flags[k]=true;assert.equal(a.accessAllows({mode:'hack'},s,k),true);assert.equal(a.residenceInstances({a:{residence:base},b:{residence:{...base,slot:1,streetAccess:{mode:'locked'}}}})[0].streetAccess.mode,'locked');});
test('residents share a stable address and reserve their apartment number',()=>{const a=A(),d=a.doors().find(x=>x.style==='normal'),r={door:d.id,slot:4,mode:'always',from:'20:00',to:'08:00'},homes=a.residenceInstances({pinky:{residence:r},iris:{residence:r},other:{residence:{...r,slot:5}}});assert.equal(homes.length,2);assert.deepEqual(homes[0].residents,['pinky','iris']);assert.equal(a.slotsFor(homes,d.style)[homes[0].key],4);assert.equal(homes[0].number,105);assert.equal(a.mergeResidenceInstances([{door:d.id,modular:true}],homes).length,1);for(let i=0;i<12;i++)assert.ok(a.residenceSpot(d.style,i));});
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(read('tools/audio/npc-voice-registry.json')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees});
const ID='draft-flat-m1';
const tree=(objectives,apartments)=>[{id:'draft-flat',name:'The flat',missions:[{id:ID,number:72,title:'Someone’s flat',type:'side',giver:'admin',offer:[{who:'admin',text:'There is a flat on Main Street.'}],objectives,...(apartments?{apartments}:{})}]}];
const flat={id:'safehouse',style:'rundown',door:'apt-main-w-96',number:13};

test('street doors: derived from the street edges, stable ids, only where nothing else is, a style by quarter',()=>{
 fresh();const X=A(),d=X.doors().filter(x=>(x.family||'city')==='city');assert.ok(d.length>=50,'doors along the main streets: '+d.length);assert.equal(new Set(d.map(x=>x.id)).size,d.length,'unique ids');
 for(const x of d){assert.match(x.id,/^apt-(avenue|main|road|passage)-[nsew]-\d{1,3}$/);assert.ok(['avenue','oldtown','far-south','port'].includes(x.quarter),x.id);assert.ok(X.STYLE_IDS.includes(x.style));
  for(const k of X.KEEP_OUT)assert.ok(!(x.x>=k.rect[0]-1.5&&x.x<=k.rect[1]+1.5&&x.z>=k.rect[2]-1.5&&x.z<=k.rect[3]+1.5),x.id+' is clear of '+k.why);
  for(const g of require(R('void-runner/ncz-quarters.js')).GATES)assert.ok(!(x.x>=g.rect[0]-2&&x.x<=g.rect[1]+2&&x.z>=g.rect[2]-2&&x.z<=g.rect[3]+2),x.id+' is clear of '+g.name);
  assert.equal(x.number%2,x.side==='e'||x.side==='n'?1:0,'odd numbers on the east and north sides');}
 assert.ok(X.door('apt-main-w-96'),'a known door keeps its id');assert.equal(X.door('apt-main-w-96').quarter,'oldtown');
 assert.ok(d.some(x=>x.quarter==='far-south'&&x.style==='rundown')&&d.some(x=>x.quarter==='oldtown'&&x.style==='normal')&&d.some(x=>x.quarter==='avenue'&&x.style==='luxury'));
 assert.match(X.blockedWhy(X.EDGES[2],[51,-58.5]),/NULL/);assert.match(X.blockedWhy(X.EDGES[9],[71,-171]),/joins|Milked/);
 // the edges are the ones neochinatown.js lays its shopfronts on
 const src=read('void-runner/neochinatown.js');for(const e of X.EDGES.slice(0,8))assert.ok(src.includes("{street:'"+e.street+"',a:["+e.a.join(',')+'],b:['+e.b.join(',')+'],n:['+e.n.join(',')+']'),'edge '+e.street+' '+e.a);
 assert.ok(X.nearestDoor(51.5,-96.2).id==='apt-main-w-96');assert.equal(X.nearestDoor(500,500),null);
});

test('three apartments with the same footprint; every object can be used; the hallway has numbered doors and a street door',()=>{
 fresh();const X=A(),L=s=>X.layout('flat',s),CITY=['rundown','normal','luxury'];const sol=s=>JSON.stringify(L(s).solids);assert.equal(sol('rundown'),sol('normal'));assert.equal(sol('normal'),sol('luxury'));
 for(const s of CITY){const l=L(s);assert.equal(l.id,'neochinatown');assert.equal(l.private,true);assert.equal(l.apartment,true);assert.equal(l.part,'flat');
  const objs=l.interactions.filter(i=>i.action==='apt-use').map(i=>i.object).sort();assert.deepEqual(objs,X.OBJECT_IDS.filter(o=>s!=='luxury'||o!=='screen').sort(),s);
  assert.ok(l.interactions.some(i=>i.action==='apt-exit'));for(const i of l.interactions)assert.ok(Math.abs(i.position[0]-X.ORIGIN[0])<4&&Math.abs(i.position[2]-X.ORIGIN[1])<5,'inside the room: '+i.id);
  const h=X.layout('hall',s);assert.equal(h.part,'hall');assert.equal(h.interactions.filter(i=>i.action==='apt-hall-door').length,10);assert.ok(h.interactions.some(i=>i.action==='apt-hall-exit'));}
 assert.ok(!X.OBJECT_IDS.includes('fridge'),'no refrigerator (the owner)');assert.ok(X.OBJECT_IDS.includes('vending'));assert.ok(!('counter' in X.FURN)&&!('fridge' in X.FURN),'no kitchen');assert.ok(X.FURN.couch&&X.SEATS.length);
 // nothing in the city overlaps them
 assert.ok(X.ORIGIN[0]>300&&X.ORIGIN[1]>300);const it=X.layout('flat','normal',{items:[{type:'loot',label:'Cash',x:1,z:1}]}).interactions.find(i=>i.action==='apt-item');assert.ok(it&&/CASH/.test(it.label));
 const slots=X.slotsFor([{key:'m/a'},{key:'m/b'}]);assert.notEqual(slots['m/a'],slots['m/b']);assert.equal(X.slotsFor([{key:'m/a'}])['m/a'],slots['m/a'],'a stable hallway door');
});

test('mission data: apartments and their steps are checked (style, door, number, from, items, screen and lights, hacks, items the player needs)',()=>{
 fresh();const X=A(),P=m=>X.problems(m).join(' | ');
 const ok={id:'m',apartments:[{...flat,locked:true,lightsOff:true,screenOff:true,items:[{type:'mission-item',label:'Data shard',x:-2.4,z:-1.2}]}],objectives:[{id:'a',kind:'apt-enter',apt:'safehouse'},{id:'b',kind:'apt-use',apt:'safehouse',object:'safe'},{id:'c',kind:'hack',ap:'safehouse/hall',hold:6,needs:'hacking-device',unlock:true,stay:false},{id:'d',kind:'hack',ap:'apt-main-w-96'}]};
 assert.equal(P(ok),'');
 assert.match(P({...ok,apartments:[{...flat,style:'penthouse'}]}),/choose a style/);assert.match(P({...ok,apartments:[{...flat,door:'apt-main-w-999'}]}),/street door/);
 assert.match(P({...ok,apartments:[flat,{...flat,id:'other'}]}),/same street door/);assert.match(P({...ok,apartments:[{...flat,number:0}]}),/1 to 9999/);
 assert.match(P({...ok,apartments:[{...flat,from:'zzz'}]}),/available from/);assert.match(P({...ok,apartments:[{...flat,items:[{type:'loot',label:'x',x:9,z:0}]}]}),/inside the apartment/);
 assert.match(P({...ok,apartments:[{...flat,style:'luxury',screenOff:true}]}),/ad screen/);assert.match(P({...ok,apartments:[{...flat,color:'red'}]}),/unknown fields/);
 assert.match(P({...ok,apartments:[{...flat,style:'luxury'}],objectives:[{id:'b',kind:'apt-use',apt:'safehouse',object:'screen'}]}),/no ad screen/);
 assert.match(P({...ok,objectives:[{id:'b',kind:'apt-use',apt:'safehouse',object:'fridge'}]}),/choose what is used/);assert.match(P({...ok,objectives:[{id:'b',kind:'apt-enter',apt:'nope'}]}),/this mission’s apartments/);
 assert.match(P({...ok,objectives:[{id:'c',kind:'hack',ap:'x/roof'}]}),/access point/);assert.match(P({...ok,objectives:[{id:'c',kind:'hack',ap:'apt-main-w-96',hold:99}]}),/2 to 30/);
 assert.match(P({...ok,objectives:[{id:'c',kind:'hack',ap:'apt-main-w-96',needs:'a-laser'}]}),/item the game has/);assert.match(P({...ok,objectives:[{id:'c',kind:'talk',ap:'apt-main-w-96'}]}),/only a “hack/);
 assert.match(P({apartments:[1,2,3,4,5]}),/at most 4/);
 // the reserved item: a carried thing, never sold
 const PR=require(R('void-runner/progression.js'));assert.equal(PR.personalItems['hacking-device'].name,'Hacking device');assert.equal(PR.personalItems['hacking-device'].sold,false);assert.ok(!PR.modules['hacking-device'],'no shop listing, no price');
 const s=PR.fresh();PR.restore({progression:{personal:{items:['hacking-device','junk']}}},s);
});

test('the mission engine: the door opens with the mission (or from a step), a hack opens a locked hallway door, steps complete inside',()=>{
 const x=env(),objs=[{id:'talk',kind:'talk',npc:'iris',label:'Talk to Iris'},{id:'hack',kind:'hack',ap:'safehouse/hall',label:'Get past the door',hold:3},{id:'in',kind:'apt-enter',apt:'safehouse',label:'Get inside'},{id:'safe',kind:'apt-use',apt:'safehouse',object:'safe',label:'Try the safe'}];
 const d=doc(x,tree(objs,[{...flat,from:'hack',locked:true}]));assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);
 const sent=x.MC.fromDrafts({local:{trees:tree(objs,[{...flat,from:'hack',locked:true}])},givers:x.e.givers}).trees[0].missions[0];assert.deepEqual(sent.apartments,[{id:'safehouse',style:'rundown',door:'apt-main-w-96',number:13,from:'hack',locked:true}]);
 assert.deepEqual(sent.objectives[1],{id:'hack',label:'Get past the door',kind:'hack',ap:'safehouse/hall',hold:3});assert.deepEqual(sent.objectives[3].object,'safe');
 x.MC.apply(d,x.e,ctx(x));const s=player(x);assert.deepEqual(x.MC.apartmentsNow(s,x.e),[],'nothing before the mission');
 assert.ok(ev(x,s,{type:'talk',npcs:['admin']}).offered);assert.deepEqual(x.MC.apartmentsNow(s,x.e),[],'not before the step it opens from');
 assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).objective,'talk');
 let open=x.MC.apartmentsNow(s,x.e);assert.equal(open.length,1);assert.equal(open[0].key,ID+'/safehouse');assert.equal(open[0].locked,true,'its hallway door is locked until hacked');
 assert.deepEqual(x.MC.hacksNow(s,x.e).map(h=>[h.ap,h.hold,h.stay,h.unlock]),[['safehouse/hall',3,true,true]]);
 assert.equal(ev(x,s,{type:'hack',ap:'safehouse/hall',mission:'draft-other'}).objective,null,'another mission’s hack does not count');
 assert.equal(ev(x,s,{type:'hack',ap:'safehouse/hall',mission:ID}).objective,'hack');assert.equal(x.MC.apartmentsNow(s,x.e)[0].locked,false,'hacked: open');
 assert.equal(ev(x,s,{type:'place',places:[],apt:null}).objective,null);assert.equal(ev(x,s,{type:'place',places:[],apt:ID+'/safehouse'}).objective,'in','inside the apartment');
 assert.equal(ev(x,s,{type:'apt-use',mission:ID,apt:'safehouse',object:'closet'}).objective,null,'the wrong object');
 const r=ev(x,s,{type:'apt-use',mission:ID,apt:'safehouse',object:'safe'});assert.equal(r.objective,'safe');assert.ok(r.completed);
 assert.deepEqual(x.MC.apartmentsNow(s,x.e),[],'the door locks again when the mission ends');
});

test('a hacked street door opens for the rest of the mission; a placeholder door and an unknown kind are refused; guide-me names what is missing',()=>{
 const x=env(),objs=[{id:'h',kind:'hack',ap:'apt-main-w-96',label:'Hack it'},{id:'t',kind:'talk',npc:'iris',label:'Tell Iris'}];const d=doc(x,tree(objs));assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));const s=player(x);
 ev(x,s,{type:'talk',npcs:['admin']});assert.equal(ev(x,s,{type:'hack',ap:'apt-main-w-96'}).objective,'h');assert.deepEqual(x.MC.hackedNow(s,x.e),[{door:'apt-main-w-96',mission:ID}]);
 const needs=x.MC.treeBlockers({title:'x',giver:'admin',objectives:[{id:'a',kind:'apt-use',label:'x'},{id:'b',kind:'hack',label:'y'}],apartments:[{id:'a1',style:'normal',door:''}]},x.e.givers).join(' | ');
 assert.match(needs,/choose one of this mission’s apartments/);assert.match(needs,/choose what is used/);assert.match(needs,/access point/);assert.match(needs,/choose its street door/);
});

test('the game and the server read the same lists; the page loads the new scripts in order; the renderer builds an apartment; a player inside is private',()=>{
 fresh();const X=A(),inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.deepEqual(inv.apartments,JSON.parse(JSON.stringify(X.inventory())),'run node tools/admin-inventory.cjs');
 for(const k of ['apt-enter','apt-use','hack'])assert.ok(inv.missionEditor.stepKinds.includes(k),k);assert.ok(inv.apartments.items.includes('hacking-device'));
 const html=read('void-runner.html'),i=f=>html.indexOf('void-runner/'+f+'"');assert.ok(i('apartments.js')>0&&i('apartments.js')<i('apartment-build.js')&&i('apartment-build.js')<i('neochinatown.js')&&i('live-content.js')<i('apartment-integration.js')&&i('apartment-integration.js')<i('ncz-gate-transit.js'));
 assert.equal(read('static/void-runner.html'),html);
 assert.match(read('void-runner/babylon-renderer.js'),/def\.apartment&&root\.VoidApartments\?\.build/);assert.match(read('void-runner/remote-players.js'),/wl\.private\?null/);
 assert.match(read('void-runner-sw.js'),/const BUILD='[0-9a-z-]+';/);
 // every door slides (the owner): the street doors, the hallway doors, the entry and the bathroom
 const b=read('void-runner/apartment-build.js');for(const id of ['bath','entry','street','slot-'])assert.ok(b.includes("id:'"+id),id);assert.match(read('void-runner/apartment-integration.js'),/A\.slider\(/);
});

test('The Outskirts: container apartments (two styles), a four-door container hallway, doors evenly along the edge of the yard; container styles only behind those doors',()=>{
 fresh();const X=A(),C=require(R('void-runner/ncz-containers.js')),N=require(R('void-runner/npc-areas.js')),d=X.doors().filter(x=>x.family==='container');
 assert.ok(d.length>=12,'a door in (nearly) every container on the edge: '+d.length);assert.equal(new Set(d.map(x=>x.id)).size,d.length);
 for(const x of d){assert.match(x.id,/^apt-yard-[nsew]-\d{1,2}$/);assert.equal(x.quarter,'outskirts');assert.ok(X.CONTAINER_STYLES.includes(x.style));const c=C.PLAN.find(p=>p.id===x.container);
  assert.ok(c&&c.flag!=='kai'&&c.flag!=='deck','never Kai’s home, never behind a deck');assert.ok(N.check({x:x.front[0],z:x.front[1]},'outskirts').ok,x.id+': the ground in front of it is walkable');
  assert.ok(Math.hypot(x.front[0]-61,x.front[1]+242)<Math.hypot(x.x-61,x.z+242)+.01,'it faces into the yard');}
 assert.ok(d.some(x=>x.style==='container-rundown')&&d.some(x=>x.style==='container-regular'),'mixed styles');assert.ok(!d.some(x=>x.container===C.KAI_HOME.id));
 const south=d.filter(x=>x.side==='s').map(x=>x.x).sort((a,b)=>a-b);assert.ok(south.length>=8);for(let i=1;i<south.length;i++)assert.ok(south[i]-south[i-1]>2&&south[i]-south[i-1]<8,'evenly spaced along the south row');
 const sol=s=>JSON.stringify(X.layout('flat',s).solids);assert.equal(sol('container-rundown'),sol('container-regular'),'the same footprint');
 for(const s of X.CONTAINER_STYLES){const l=X.layout('flat',s),h=X.layout('hall',s);assert.equal(l.container,true);assert.deepEqual(l.interactions.filter(i=>i.action==='apt-use').map(i=>i.object).sort(),X.OBJECT_IDS.slice().sort(),s);
  assert.equal(h.interactions.filter(i=>i.action==='apt-hall-door').length,4,'four doors');for(const i of l.interactions)assert.ok(Math.abs(i.position[0]-X.ORIGIN[0])<6.1&&Math.abs(i.position[2]-X.ORIGIN[1])<2.35,i.id);}
 assert.equal(X.slotNumber(3,'container-regular'),4);assert.ok(Object.values(X.slotsFor([{key:'m/a'},{key:'m/b'}],'container-rundown')).every(i=>i<4));
 const P=m=>X.problems(m).join(' | '),door=d[0].id;
 assert.equal(P({apartments:[{id:'a',style:'container-regular',door,screenOff:true,lightsOff:true,items:[{type:'loot',label:'Cash',x:5,z:-1}]}],objectives:[{id:'u',kind:'apt-use',apt:'a',object:'screen'}]}),'');
 assert.match(P({apartments:[{id:'a',style:'container-rundown',door:'apt-main-w-96'}],objectives:[]}),/container apartment goes behind a door in The Outskirts/);
 assert.match(P({apartments:[{id:'a',style:'normal',door}],objectives:[]}),/city apartment goes behind a city street door/);
 assert.match(P({apartments:[{id:'a',style:'container-rundown',door,items:[{type:'loot',label:'x',x:1,z:3}]}],objectives:[]}),/inside the apartment/);
 const inv=JSON.parse(read('void_runner_admin_inventory.json')).apartments;assert.equal(inv.doors[door].family,'container');assert.deepEqual(inv.containerStyles,X.CONTAINER_STYLES);
 assert.match(read('void-runner/apartment-build.js'),/function buildCFlat\(/);assert.match(read('void-runner/apartment-build.js'),/function buildCHall\(/);
});
