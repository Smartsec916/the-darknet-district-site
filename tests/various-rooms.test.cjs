/* The Various rooms and the underground pieces (the owner, 20 Nov 2026: "can you make me more and place all of them in Various filter?"; the underground: a stairwell, a gang
   checkpoint, tunnel pieces that tile seamlessly, the fight pit, the tea rooms and the East Asian set; the pawn shop's sell counter). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const Mo=()=>require(R('void-runner/modules.js'));
const NEW=['pawn-back','noodle-kitchen','repair-shop','implant-shop','laundry-back','tea-room','card-room','tattoo','radio-booth','scooter-bay','shrine-room','fight-pit','tea-under','mahjong','flophouse','food-stall'];
const UNDER=['fight-pit','gang-vestibule','stairwell','tunnel','tunnel-short','tunnel-mid','tunnel-junction','tunnel-lantern','tunnel-lantern-junction','tunnel-chamber','tea-under','mahjong','flophouse','food-stall'];
const TUBES=['tunnel','tunnel-short','tunnel-mid','tunnel-junction','tunnel-lantern','tunnel-lantern-junction'];

test('the Various category: the old Commercial rooms moved (same type ids, old missions still valid), the new rooms are there, every one furnished and usable',()=>{
 fresh();const M=Mo();assert.ok(M.CATS.some(c=>c.id==='various'&&c.name==='Various'));assert.ok(!M.CATS.some(c=>c.id==='commercial'));
 for(const id of ['shop-back','bar-back','clinic'])assert.equal(M.TYPES[id].cat,'various');
 // a mission saved before the move still names the same types and passes the checks
 const old={id:'a3',door:'apt-avenue-n-23',entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'bar',type:'bar-back',x:4,z:4}]};assert.deepEqual(M.problems(old,'commercial'),[]);
 for(const id of NEW){const t=M.TYPES[id];assert.ok(t,id);assert.equal(t.cat,'various',id);assert.ok(t.note&&t.note.length>30,id+' note');assert.ok(t.furn.length>=1&&t.inter.length>=2,id+' furnished and usable');
  assert.ok(t.objects.some(o=>o.id==='lights')||!t.sw,id);for(const o of t.objects)if(o.id!=='lights'&&o.id!=='screen'){const said=(t.say&&t.say[o.id])||(t.opens&&t.opens[o.id])||['computer','terminal','safe','panel','valve','shelves','kegs','cabinet','fridge'].includes(o.id);assert.ok(said,id+': '+o.id+' says something when used');}}
 const src=read('void-runner/module-build.js');for(const id of [...NEW,'gang-vestibule','stairwell','tunnel-chamber'])assert.ok(new RegExp("'"+id+"'\\s*\\(mod,t\\)|'"+id+"'\\]\\)BUILD|'"+id+"'(,'[a-z-]+')*\\]\\)BUILD").test(src)||src.includes("'"+id+"'(mod,t)")||src.includes("BUILD['"+id+"']"),id+' is built');
 for(const id of UNDER)assert.equal(M.TYPES[id].underground,true,id+' is marked underground');assert.match(read('void-runner/module-editor.js'),/optgroup.*Underground|Underground.*optgroup/);
 // the ready-made locations: one per new street room (hallway + room), the underground previews; every one passes the checks and is offered by name
 for(const id of ['pawn','kitchen','repair','cyber','laundry','tea','cards','tattoo','radio','garage','shrine','fight-pit','underground','tea-under','east-asian','tunnel-run']){const t=M.TEMPLATES.find(x=>x.id===id);assert.ok(t&&t.name,id);assert.deepEqual(M.problems({id:'t',door:'x',...M.template(id)},'commercial'),[],id);}
 const inv=M.inventory();assert.ok(inv.categories.includes('various')&&!inv.categories.includes('commercial'));assert.deepEqual(inv.types['fight-pit'].spots,['host','corner-a','corner-b']);assert.equal(inv.types.stairwell.stairs,true);
 const server=JSON.parse(read('void_runner_admin_inventory.json')).modules;assert.deepEqual(server.categories,inv.categories);for(const id of [...NEW,...UNDER])assert.ok(server.types[id],id+' in the server copy');
});

test('tunnel tubes tile: same cross-section, symmetric, joined end to end in a long chain with corners and a T; every tube-to-tube join is a seam (no wall, no door, nothing in the way)',()=>{
 fresh();const M=Mo();for(const id of TUBES){const t=M.TYPES[id];assert.equal(t.tube,true,id);assert.equal(t.w,1,id);assert.equal(t.ceil,2.6,id);assert.equal(t.style,'tunnel',id);
  for(const s of t.sockets)assert.equal(s.cell,0,id+' openings on the centre line');for(const f of t.furn)assert.ok(f[1]<=-.7||f[0]>=.7,id+': nothing stands in the tunnel (only on a wall)');}
 // chain: 6 straight pieces of every length, a T (with a branch), a corner, both plain and lantern pieces, built with the editor's own joining
 let L={id:'run',door:'x',modules:[]};const add=(type,o)=>{const r=M.addModule(L,type,o);assert.ok(r.ok&&!r.why,type+' '+(r.why||''));L=r.loc;return r.id;};
 const a=add('tunnel',{floor:-1}),b=add('tunnel-short',{to:a+'.n0'}),c=add('tunnel-lantern',{to:b+'.n0'}),tee=add('tunnel-junction',{to:c+'.n0'}),br=add('tunnel-mid',{to:tee+'.w0'}),d=add('tunnel',{to:tee+'.n0'}),corner=add('tunnel-lantern-junction',{to:d+'.n0'}),e=add('tunnel-mid',{to:corner+'.e0'}),f=add('tunnel-short',{to:e+'.n0'});
 L={...L,entry:a+'.s0'};assert.deepEqual(M.problems(L,'commercial'),[]);const an=M.analyse(L);assert.equal(an.clusters.length,1,'one continuous tunnel');assert.equal(an.doors.filter(x=>x.kind==='snap').length,8,'every piece joined');
 const turned=L.modules.filter(m=>m.rot===1).length;assert.ok(turned>=2,'pieces turned at the T and the corner');
 const w=M.layout({key:'k',mission:'m',id:'run',door:'x',modular:true,loc:L,hacked:[]},an.clusters[0].id,{});assert.ok(w);
 const seams=w.cluster.doors.filter(x=>x.seam);assert.equal(seams.length,8,'all eight joins are seams');assert.ok(!w.solids.some(s=>s.door&&seams.some(x=>x.id===s.door)),'no door solid at a seam');
 for(const m of w.cluster.mods)for(const e2 of m.seam)assert.ok(!w.solids.some(s=>typeof s.id==='string'&&s.id.startsWith('wall-'+m.id+'-'+e2+'-')),m.id+': no wall on its seam end '+e2);
 assert.ok(!w.interactions.some(i=>i.action==='apt-ap'&&seams.some(x=>i.ap&&(i.ap.endsWith('/'+x.a)||i.ap.endsWith('/'+x.b)))),'no access point at a seam');for(const x of seams)assert.equal(M.hackable(L,x.a),false);
 // a tube meeting a room (not a tube) keeps a real door
 const pit=M.template('fight-pit');const w2=M.layout({key:'k2',mission:'m',id:'p',door:'x',modular:true,loc:{id:'p',door:'x',...pit},hacked:[]},M.analyse(pit).clusters[0].id,{});assert.ok(w2.cluster.doors.some(x=>x.kind==='snap'&&!x.seam));
 // the build draws every tube piece from one cross-section (both walls alike) and skips the wall and the door at a seam
 const src=read('void-runner/module-build.js');assert.match(src,/const XS=\{low:\[/);assert.match(src,/if\(seam\.has\(e\)\)continue;/);assert.match(src,/if\(d\.seam\)continue;/);
});

test('the stairwell links floors like an elevator: stairs down on the street floor, up below; the gang checkpoint has standing spots for doormen; the tea room hides its back door',()=>{
 fresh();const M=Mo();const loc={id:'u',door:'x',...M.template('underground')},an=M.analyse(loc);assert.deepEqual(M.cabFloors(an),[-1,0]);
 const inst={key:'k',mission:'m',id:'u',door:'x',modular:true,loc,hacked:[]},top=M.layout(inst,an.clusterOf('stairs').id,{}),low=M.layout(inst,an.clusterOf('stairs2').id,{from:{cab:true}});
 assert.ok(top.interactions.some(i=>i.action==='mod-elev'&&i.label==='STAIRS · DOWN TO B1'));assert.ok(low.interactions.some(i=>i.action==='mod-elev'&&/^STAIRS · UP TO /.test(i.label)));assert.ok(!low.interactions.some(i=>/ELEVATOR/.test(i.label)));
 // the owner's order: stairs down first, the gang checkpoint at the bottom, then the tunnel, then the pit
 const order=['hall','stairs','stairs2','gate','tunnel','pit'];assert.deepEqual(loc.modules.map(m=>m.id).sort(),[...order].sort());assert.ok(an.doors.some(d=>[d.a,d.b].includes('stairs2.s0')&&[d.a,d.b].includes('gate.n0')));
 assert.ok(M.TYPES['gang-vestibule'].spots.length>=3);assert.ok(M.TYPES['food-stall'].spots.some(s=>s[0]==='cook'));
 // the underground tea room: front and back doors on opposite walls; from every seat the line to the back door crosses the partition
 const t=M.TYPES['tea-under'],ids=t.sockets.map(s=>s.id);assert.deepEqual(ids,['s1','n1']);const back=M.sockLocal(t,t.sockets.find(s=>s.id==='n1')),part=t.furn.find(f=>f[5]==='partition');
 const crosses=(p,q,[x0,x1,z0,z1])=>{for(let k=0;k<=200;k++){const u=k/200,x=p[0]+(q[0]-p[0])*u,z=p[1]+(q[1]-p[1])*u;if(x>=x0&&x<=x1&&z>=z0&&z<=z1)return true;}return false;};
 for(const seat of t.plan.seats)for(const dx of [-.6,0,.6])assert.ok(crosses(seat,[back[0]+dx,back[1]-.05],part),'seat '+seat+' cannot see the back door');
});

test('the pawn shop: an empty list the owner fills in; selling takes the item and adds its price; the room’s counter opens the panel; adults-only rooms',()=>{
 fresh();const W=require(R('void-runner/pawn-shop.js')),M=Mo();assert.deepEqual(W.BUYS,[]);assert.equal(W.EMPTY,'The broker isn’t buying anything right now.');
 const s={credits:100,progression:{personal:{items:['ward-kit']}}};assert.deepEqual(W.offers(s),[]);assert.equal(W.sell(s,'ward-kit').ok,false);assert.equal(s.credits,100);
 const list=[{item:'ward-kit',price:40},{item:'nonsense',price:5},{item:'hacking-device',price:0}];assert.equal(W.problems(list).length,2);assert.deepEqual(W.offers(s,list).map(o=>[o.item,o.have]),[['ward-kit',true]]);
 const r=W.sell(s,'ward-kit',list);assert.ok(r.ok);assert.equal(s.credits,140);assert.deepEqual(s.progression.personal.items,[]);assert.equal(W.sell(s,'ward-kit',list).ok,false,'not carried any more');
 assert.equal(M.TYPES['pawn-back'].opens.counter,'pawn');assert.match(read('void-runner/module-integration.js'),/VoidPanels/);assert.match(read('void-runner/pawn-shop.js'),/VoidPanels=root\.VoidPanels\|\|\{\}\)\.pawn=open/);
 const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/pawn-shop.js"')>html.indexOf('void-runner/module-integration.js"'));
 const E=require(R('void-runner/npc-escort.js'));assert.deepEqual(E.ADULT_ROOMS,['fight-pit']);
});
