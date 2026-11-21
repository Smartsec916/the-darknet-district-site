/* The Location card's top-down plan (module-editor.js planLayout, 20 Nov 2026): the owner's location "hallway + apartment" (portal modules joined by a connection) showed an
   EMPTY plan because only grid modules were drawn. Every module of the location is now a tile: grid modules where they stand, portal modules beside them in the order you
   walk in, with a connector labelled with its doors; the street entrance; a locked connection; a mix of grid and portal modules; the one-line summary. No data is changed. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const load=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];globalThis.VoidModules=require(R('void-runner/modules.js'));globalThis.VoidApartments=require(R('void-runner/apartments.js'));delete globalThis.VoidModuleEditor;require(R('void-runner/module-editor.js'));return {E:globalThis.VoidModuleEditor,M:globalThis.VoidModules};};
const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.z<b.z+b.d&&b.z<a.z+a.d;
const inside=(T,x,z)=>x>=T.x-1e-6&&x<=T.x+T.w+1e-6&&z>=T.z-1e-6&&z<=T.z+T.d+1e-6;

test('the owner’s case: Add > Housing > Rundown apartment gives a hallway and an apartment; the plan draws both side by side and the connector between their doors',()=>{
 const {E,M}=load();let l={id:'l1',door:'apt-main-n-3',modules:[]};l=M.addModule(l,'hall-rundown').loc;l=M.addModule(l,'apt-rundown').loc;const before=JSON.stringify(l);
 const L=E.planLayout(l,0);assert.deepEqual(L.tiles.map(t=>t.id),['hall','flat']);assert.ok(L.tiles.every(t=>t.portal&&t.w>0&&t.d>0));
 const [h,f]=L.tiles;assert.ok(!overlap(h,f),'tiles do not overlap');assert.ok(f.x>=h.x+h.w,'the apartment is beside (east of) the hallway: walk order');
 assert.equal(L.links.length,1);const k=L.links[0];assert.equal(k.a,'hall.d0');assert.equal(k.b,'flat.entry');assert.equal(k.label,'hallway door 101 → apartment entry');assert.equal(k.locked,false);
 assert.ok(inside(h,k.ax,k.az)&&inside(f,k.bx,k.bz),'the connector runs from the hallway tile to the apartment tile');
 assert.ok(L.entry&&L.entry.id==='hall'&&inside(h,L.entry.x,L.entry.z),'the street entrance is marked on the hallway');
 for(const t of L.tiles)assert.ok(t.x>=L.x0&&t.x+t.w<=L.x1&&t.z>=L.z0&&t.z+t.d<=L.z1,'the bounds hold every tile');
 assert.equal(E.summary(l,'No. 204, Main Street'),'Street door No. 204, Main Street → Rundown hallway → Rundown apartment 101');
 assert.equal(JSON.stringify(l),before,'nothing in the location is changed');assert.deepEqual(M.problems(l,'city'),[]);});

test('a locked connection is red; an apartment number set on the flat names the hallway door; portal tiles appear on the ground floor only when nothing on the grid holds them',()=>{
 const {E,M}=load();let l={id:'l1',door:'',modules:[]};l=M.addModule(l,'hall-normal').loc;l=M.addModule(l,'apt-normal').loc;l=M.addModule(l,'apt-normal').loc;l.locks=['hall.d1'];l.modules[1].number=204;
 const L=E.planLayout(l,0);assert.equal(L.tiles.length,3);const byA=Object.fromEntries(L.links.map(x=>[x.a,x]));
 assert.equal(byA['hall.d0'].label,'hallway door 204 → apartment entry');assert.equal(byA['hall.d1'].locked,true);assert.equal(byA['hall.d0'].locked,false);
 const [h,f1,f2]=L.tiles;assert.equal(f1.x,f2.x,'two apartments behind the same hallway stand in one column');assert.ok(!overlap(f1,f2));
 assert.match(E.summary(l,null),/^Street door \(not chosen yet\) → Ordinary hallway → Normal apartment 204 → Normal apartment 102$/);
 assert.equal(E.planLayout(l,-1).tiles.length,0,'nothing on another floor');});

test('grid and portal modules together: grid modules where they stand, the apartment beside them, joined to the grid door it connects to',()=>{
 const {E,M}=load();let l={id:'l1',door:'',modules:[]};l=M.addModule(l,'office-floor').loc;const free=M.freeSockets(l).find(x=>!x.portal);l.entry=free.ref;
 const r=M.addModule(l,'apt-rundown');assert.ok(r.ok,r.why);l=r.loc;const L=E.planLayout(l,0),g=L.tiles.find(t=>!t.portal),p=L.tiles.find(t=>t.portal);
 assert.ok(g&&p);assert.equal(g.x,l.modules[0].x|0);assert.ok(p.x>=g.x+g.w,'the apartment is laid out beside the grid');assert.ok(!overlap(g,p));
 assert.equal(L.links.length,1);assert.ok(inside(p,L.links[0].bx,L.links[0].bz)||inside(p,L.links[0].ax,L.links[0].az));assert.match(L.links[0].label,/office floor door .* → apartment entry/);});

test('an older apartment migrated to modules (fromApartment) draws the same way; the module-editor exports the plan helpers',()=>{
 const {E,M}=load();const {loc}=M.fromApartment({id:'a1',style:'rundown',door:'apt-main-n-3',locked:true},'m1');const L=E.planLayout(loc,0);
 assert.deepEqual(L.tiles.map(t=>t.id).sort(),['flat','hall']);assert.equal(L.links.length,1);assert.equal(L.links[0].locked,true);assert.match(L.links[0].label,/^hallway door \d+ → apartment entry$/);
 for(const k of ['planLayout','summary','doorLabel','modLabel'])assert.equal(typeof E[k],'function');});

test('any city apartment style behind any city street door (an office or shop entrance too); The Outskirts take the container styles only (the owner, 20 Nov 2026)',()=>{
 const {M}=load(),A=globalThis.VoidApartments,loc=(st,door)=>({id:'h',door,entry:'hall.street',modules:[{id:'hall',type:'hall-'+st},{id:'flat',type:'apt-'+st}],links:[{a:'hall.d0',b:'flat.entry'}]});
 const yard=A.doors().find(d=>d.family==='container'),fam=id=>(A.door(id).family||'city');
 for(const st of ['rundown','normal','luxury'])for(const d of ['apt-main-w-103','apt-avenue-n-16','biz-avenue-n-13',A.doors().find(x=>x.family==='commercial').id])assert.deepEqual(M.problems(loc(st,d),fam(d)),[],st+' behind '+d);
 assert.match(M.problems(loc('rundown',yard.id),'container').join(),/container in The Outskirts/);
 for(const st of ['container-rundown','container-regular']){assert.deepEqual(M.problems(loc(st,yard.id),'container'),[]);assert.match(M.problems(loc(st,'apt-main-w-103'),'city').join(),/container door in The Outskirts/);}
 // the older apartment entries: any city style behind any city apartment door, containers in The Outskirts only (unchanged)
 for(const st of ['rundown','normal','luxury'])assert.deepEqual(A.problems({apartments:[{id:'a',style:st,door:'apt-avenue-n-16'}],objectives:[]}),[]);
 assert.match(A.problems({apartments:[{id:'a',style:'luxury',door:yard.id}],objectives:[]}).join(),/container/);});

test('the street-door map helpers: a door named in plain words; the doors other locations of the mission use',()=>{
 const {E}=load(),A=globalThis.VoidApartments;assert.match(E.doorTitle(A.door('apt-main-w-103')),/^No\. \d+, Main Street — normal apartment building$/);assert.match(E.doorTitle(A.door('biz-avenue-n-13')),/— office entrance$/);
 const m={apartments:[{id:'l1',door:'apt-main-w-103',modules:[]},{id:'a2',style:'normal',door:'apt-avenue-n-16'},{id:'l3',door:''}]};assert.deepEqual(E.usedDoors(m,m.apartments[0]),{'apt-avenue-n-16':'apartment a2'});});
