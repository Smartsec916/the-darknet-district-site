/* "Let me place REVERIE or LACE anywhere" (the owner, 19 Nov 2026): the walkable areas of the city and the District interior (npc-areas.js), the owner's content rule
   (never Milked, NULL, the District bar, VR, the arcade room, the Corporate District), snapping a click onto ground she may stand on, routes in one area, the placement
   rules that use them (npc-paths.js), the ChatGPT prompt (npc-behaviour.js) and the game starting the pair in every area. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const A=require(R('void-runner/npc-areas.js')),P=require(R('void-runner/npc-paths.js')),B=require(R('void-runner/npc-behaviour.js'));
const REV='grey-reverie',CAT='street-cat',W=(x,z)=>{const [a,b]=A.toWorld(x,z);return {x:a,z:b};};
const place=id=>{const p=A.places().find(q=>q.id===id);assert.ok(p,'place '+id);return {x:p.x,z:p.z};};

test('six areas, each with ground she may stand on and named places; the District interior is its own scene',()=>{
 assert.deepEqual(A.list().map(a=>a.id),['avenue','oldtown','far-south','outskirts','port','district','milked']);   // milked: reception, for adult made characters only (npc-made.js)
 for(const a of A.list().filter(a=>a.id!=='milked')){assert.ok(a.walk.length,a.id);const named=A.places().filter(p=>p.area===a.id);assert.ok(named.length>=2,a.id+' has named places');
  for(const p of named){const c=A.check(p);assert.ok(c.ok,p.id+': '+c.why);assert.equal(c.area,a.id,p.id);}}
 assert.equal(A.get('district').scene,'interior');assert.deepEqual(A.here('interior'),['district']);assert.deepEqual(A.here('street','oldtown'),['oldtown']);assert.equal(A.here('street',null).length,5);
 assert.deepEqual(A.enter('outskirts'),{walk:'sacramento',quarter:'outskirts'});assert.deepEqual(A.enter('district'),{walk:'darknet-district'});
 assert.ok(A.GEN&&A.GEN.areas,'the obstacle reading from the built scenes is committed');for(const id of A.IDS.filter(x=>x!=='milked'))assert.ok(A.GEN.areas[id],'read: '+id);});

test('the content rule: never Milked, NULL, the District bar, VR or arcade room, the terrace, the Corporate District',()=>{
 const rule=[[52,-58,/NULL/],[30,-58,/NULL/],[88,-182,/Milked/],[81.75,-173,/Milked’s front doorway/],[94.75,-190.8,/Milked’s rear doorway/],[81.75,-176,/Milked/],[-90,0,/Corporate/],[88,-105,/terrace/],[-30,-12,/Function Gate|Corporate/],[170,-12,/Temple/]];
 for(const [x,z,re] of rule){const c=A.check({x,z});assert.equal(c.ok,false,x+','+z);assert.equal(c.kind,'rule',x+','+z+' '+c.why);assert.match(c.why,re);assert.deepEqual(P.pick(REV,{x,z},c.area).spot,null,'never moved out of a forbidden place');}
 for(const [lx,lz,re] of [[10,34,/bar/],[-10,36,/VR/],[-7,62,/arcade/],[-5,73,/Sleeping Pod/],[10,72,/Sleeping Pod/]]){const c=A.check(W(lx,lz));assert.equal(c.kind,'rule',re.source);assert.match(c.why,re);}
 for(const id of [REV,'ethereal-lace',CAT])for(const [x,z] of [[52,-58],[88,-182]])assert.ok(P.spotProblems(id,{x,z}).length,id);
 assert.match(P.planProblems(REV,{mode:'stay',...W(10,34),yaw:0,actions:['idle']}).join(),/bar/);
 assert.match(P.planProblems(REV,{mode:'original',schedule:[{from:'08:00',to:'09:00',mode:'stay',x:81.75,z:-173,yaw:0,actions:['idle']}]}).join(),/Milked/,'a time block too');
 assert.match(P.waitAtProblems(REV,{x:52,z:-58,yaw:0}).join(),/NULL/,'"Giver waits at" too');});

test('roads, gates, buildings, walls and private rooms are blocked with a plain reason',()=>{
 for(const [x,z] of [[100,-12],[61,-90],[61,-180],[42,-100]])assert.equal(A.check({x,z}).kind,'road',x+','+z);
 for(const [x,z] of [[61,-23],[61,-127],[5,-12],[148,-12],[61,-221]])assert.equal(A.check({x,z}).kind,'gate',x+','+z);
 assert.equal(A.check({x:100,z:-35}).kind,'outside','a city block');assert.match(A.check({x:140,z:-100}).why,/District/,'the District building seen from the street');
 assert.match(A.check(W(9,62)).why,/meeting room/);assert.match(A.check(W(0,23)).why,/vestibule/);assert.match(A.check(W(10,49)).why,/counter|staff/);
 const ob=A.get('outskirts').obstacles[0];assert.ok(ob,'the container homes stand in the yard');assert.equal(A.check({x:(ob[0]+ob[1])/2,z:(ob[2]+ob[3])/2},'outskirts').kind,'obstacle');});

test('allowed: both Avenue pavements, Old Town, Far South, the Outskirts, the Port, the District hallway, store and vending',()=>{
 for(const id of ['laundry','south-laundry','oldtown-alley-mouth','oldtown-district-door','oldtown-access-road','far-south-middle','far-south-gate','outskirts-yard','outskirts-west-lane','port-pad','port-passage','district-entry','district-hall','district-store','district-vending']){
  const p=place(id);assert.deepEqual(P.spotProblems(REV,p),[],id);assert.deepEqual(P.spotProblems(CAT,p),[],'the cat too: '+id);}
 assert.deepEqual(P.planProblems(REV,{mode:'stay',...place('outskirts-yard'),yaw:0,actions:['idle','look']}),[]);
 assert.deepEqual(P.planProblems(REV,{mode:'stay',...place('oldtown-alley-mouth'),yaw:0,actions:['scroll']}),[]);
 assert.deepEqual(P.planProblems(CAT,{mode:'stay',...place('district-hall'),yaw:0,actions:['cat-sit']}),[]);});

test('snapping a click: onto the nearest spot she may stand on, in the area shown; or the plain reason',()=>{
 const r=P.pick(REV,{x:100,z:-9},'avenue');assert.ok(r.spot&&r.spot.moved);assert.ok(A.check(r.spot).ok);assert.match(r.why,/road/);assert.ok(Math.hypot(r.spot.x-100,r.spot.z+9)<3);
 const k=P.pick(REV,{x:55.5,z:-90},'oldtown');assert.ok(k.spot&&A.check(k.spot).area==='oldtown','off the kerb onto Main Street’s pavement');
 const ok=place('oldtown-alley-mouth'),same=P.pick(REV,ok,'oldtown');assert.equal(same.spot.moved,false);
 assert.match(P.pick(REV,ok,'avenue').why,/Old Town, not the area shown/);
 const far=P.pick(REV,{x:100,z:-40},'avenue');assert.equal(far.spot,null);assert.ok(far.why.length);
 assert.deepEqual(P.snap(REV,{x:100,z:-40},'avenue'),{x:100,z:-40},'nothing within reach: unchanged (the map shows the reason)');});

test('routes stay in one area and on walkable ground; schedules may use a different area in each time block',()=>{
 const a=place('oldtown-alley-mouth'),b={x:a.x+6,z:a.z};assert.deepEqual(A.leg(a,b),[],'along the alley');
 assert.match(A.leg({x:100,z:-6.4},{x:100,z:-18.3}).join(),/road/);assert.deepEqual(A.leg({x:52.5,z:-40},{x:52.5,z:-90}),[],'past NULL’s door on the public pavement');assert.match(A.leg({x:52.6,z:-58.5},{x:40,z:-58.5}).join(),/never used for her/,'into NULL');
 assert.match(A.leg(place('laundry'),a).join(),/one area/);
 const cross={mode:'path',points:[{...place('laundry'),action:'look',seconds:4},{...a,action:'look',seconds:4}]};assert.match(P.planProblems(REV,cross).join(),/stays in one area/);
 const day={mode:'original',schedule:[{from:'08:00',to:'12:00',mode:'stay',...place('outskirts-yard'),yaw:0,actions:['idle']},{from:'12:00',to:'14:00',mode:'path',points:[{...a,action:'look',seconds:4},{...b,action:'idle',seconds:4}]},{from:'20:00',to:'23:00',mode:'stay',...place('district-hall'),yaw:0,actions:['look']}]};
 assert.deepEqual(P.planProblems(REV,day),[]);const at=h=>P.planNow(REV,{plan:day,minute:h*60});
 assert.equal(at(9).area,'outskirts');assert.equal(at(13).area,'oldtown');assert.equal(at(21).area,'district');assert.equal(at(16),null,'outside every block: her usual thing (the Avenue)');
 assert.equal(P.planNow(REV,{waiting:{...place('port-pad'),mission:'m'}}).area,'port');});

test('the ChatGPT prompt lists the allowed areas with their bounds and the never-used places; recipes in other areas are accepted, forbidden ones refused',()=>{
 const pr=B.prompt(REV);for(const a of A.list().filter(a=>a.id!=='milked'))assert.ok(pr.includes(a.name),a.name);assert.match(pr,/NEVER/);assert.match(pr,/Sleeping Pod/);assert.doesNotMatch(pr,/district-pods/);assert.match(pr,/Milked/);assert.match(pr,/NULL/);assert.match(pr,/x 51\.4 to 53\.6/);assert.match(pr,/oldtown-alley-mouth/);assert.match(pr,/in ONE area/);
 const ok=B.read(JSON.stringify({recipe:B.KIND,version:1,npc:REV,schedule:[{from:'08:00',to:'12:00',do:'stay',at:'outskirts-yard',actions:['idle']},{from:'20:00',to:'22:00',do:'stay',at:'district-store',actions:['look']}]}),REV);assert.ok(ok.ok,ok.problems.join(' | '));
 const no=B.read(JSON.stringify({recipe:B.KIND,version:1,npc:REV,allDay:{do:'stay',at:{x:88,z:-182},actions:['idle']}}),REV);assert.equal(no.ok,false);assert.match(no.problems.join(),/Milked/);
 const two=B.read(JSON.stringify({recipe:B.KIND,version:1,npc:REV,allDay:{do:'route',points:[{at:'laundry',action:'look',seconds:3},{at:'oldtown-alley-mouth',action:'look',seconds:3}]}}),REV);assert.equal(two.ok,false);assert.match(two.problems.join(),/one area/);
 assert.ok(B.prompt(CAT).includes('The Outskirts'));});

test('the game: the pair is started in every street quarter and inside the District, and only loads her where she is',()=>{
 const nc=fs.readFileSync(R('void-runner/neochinatown.js'),'utf8'),sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8');
 assert.match(nc,/VoidStreetPair\.start\(\{B,scene,parent,quality,where:\{scene:'street',quarter:QK\}\}\)/);assert.match(nc,/where:\{scene:'interior'\}/);assert.doesNotMatch(nc,/VoidStreetPair&&\(!QK\|\|QK==='avenue'\)/);
 assert.match(sp,/HERE=new Set\(AR\?AR\.here\(/);assert.match(sp,/want=w0&&HERE\.has\(herArea\(w0\.id\)\)/);assert.match(sp,/if\(!HERE\.has\(area\)\)\{catLeave\(\);return;\}/);
 const html=fs.readFileSync(R('void-runner.html'),'utf8');assert.ok(html.indexOf('void-runner/npc-areas.js')>0&&html.indexOf('void-runner/npc-areas.js')<html.indexOf('void-runner/npc-paths.js'));
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);});

test('the server’s copy of the areas (admin inventory) matches npc-areas.js',()=>{const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).npcPaths;
 assert.deepEqual(inv.areas,JSON.parse(JSON.stringify(A.inventory())));for(const id of Object.keys(P.MOVABLE))assert.deepEqual(inv.movable[id].areas,A.IDS);});

test('follow / lead / cab steps (npc-escort.js) happen in the area she is placed in for the mission: spots there, cab stops in its quarter',()=>{
 const E=require(R('void-runner/npc-escort.js')),alley=place('oldtown-alley-mouth'),ot=E.placedArea(REV,{waitAt:alley});assert.equal(ot,'oldtown');assert.equal(E.placedArea(REV,{plan:{mode:'stay',...place('outskirts-yard')}}),'outskirts');assert.equal(E.placedArea(REV,{}),'avenue');
 assert.deepEqual(E.stops(REV,'oldtown').filter(s=>s.ok).map(s=>s.id).sort(),['alley-mouth','main']);assert.match(E.stops(REV,'oldtown').find(s=>s.id==='avenue').why,/placed in Old Town/);
 assert.ok(E.stops(REV,'district').every(s=>!s.ok));assert.match(E.stops(REV,'district')[0].why,/no taxis/);assert.ok(E.stops(REV,'outskirts').every(s=>!s.ok),'no taxi beyond the Far South Gate');
 assert.deepEqual(E.problems({kind:'follow-them',npc:REV,to:{x:alley.x+5,z:alley.z}},{area:'oldtown'}),[]);
 assert.match(E.problems({kind:'follow-them',npc:REV,to:place('laundry')},{area:'oldtown'}).join(),/placed in Old Town/);
 assert.match(E.problems({kind:'shared-cab',npc:REV,stop:'avenue'},{area:'oldtown'}).join(),/placed in Old Town/);assert.deepEqual(E.problems({kind:'shared-cab',npc:REV,stop:'main'},{area:'oldtown'}),[]);
 assert.ok(E.spots(REV,'oldtown').every(p=>A.areaOf(p)==='oldtown'));const k=E.kerb({x:77,z:-58.5},'oldtown');assert.ok(A.check(k).ok&&k.call,'she calls the cab from beside a taxi pole in Old Town');
 const r=E.route({x:alley.x,z:alley.z},{x:alley.x+20,z:alley.z},'oldtown');assert.equal(r.length,1);});

test('the owner, 20 Nov 2026: public pavements in front of NULL and Milked are walked past and crossed; NULL\'s doorway is never stood in; inside stays closed',()=>{
 const E=require(R('void-runner/npc-escort.js')),X=require(R('void-runner/crosswalks.js'));
 // NULL's doorway (within 1.5 m of its street door): no spot, no waiting, never snapped out of, for Reverie, Lace, the cat and a made character not marked adult
 for(const [x,z] of [[52,-58.5],[51.6,-60],[52.3,-56.2]]){const c=A.check({x,z});assert.equal(c.kind,'rule',x+','+z);assert.match(c.why,/doorway/);assert.equal(P.pick(REV,{x,z},'oldtown').spot,null);
  for(const id of [REV,'ethereal-lace',CAT])assert.match(P.spotProblems(id,{x,z}).join(),/doorway/,id);assert.match(P.waitAtProblems(REV,{x,z,yaw:0}).join(),/doorway/);
  assert.equal(A.check({x,z},null,undefined,{made:true}).ok,false,'a made character not marked adult');assert.equal(A.check({x,z},null,undefined,{adult:true}).ok,true,'an adult made character may');}
 assert.match(P.planProblems(REV,{mode:'path',points:[{x:52.6,z:-70,action:'look',seconds:4},{x:52,z:-58.5,action:'look',seconds:4}]}).join(),/doorway/,'a route point in the doorway');
 // the pavement round it is ordinary: spots a little away, a route along it, a route past it
 for(const [x,z] of [[53,-58.5],[52.6,-62],[52.6,-55]])assert.deepEqual(P.spotProblems(REV,{x,z}),[],x+','+z);
 assert.deepEqual(P.planProblems(REV,{mode:'path',points:[{x:52.6,z:-70,action:'look',seconds:4},{x:52.6,z:-47,action:'look',seconds:4}]}),[]);
 // inside NULL, Milked, its side street and service alley stay closed (for walking too)
 for(const [x,z] of [[48,-58.5],[30,-58],[81.75,-176],[88,-182]])assert.equal(A.check({x,z},null,undefined,{passing:true}).kind,'rule',x+','+z);
 assert.match(A.leg({x:81.75,z:-171},{x:81.75,z:-178}).join(),/never used for her/,'into Milked through its front door');
 // Milked's frontage on Main Street (the pavement across its side street's and service alley's mouths)
 for(const [x,z] of [[69.5,-171],[69.5,-191.5]])assert.deepEqual(P.spotProblems(REV,{x,z}),[],x+','+z);
 assert.deepEqual(A.leg({x:69.5,z:-163},{x:69.5,z:-196}),[],'past Milked on the public pavement');
 // escorts: from the pavement north of NULL to the east pavement by the alley crosswalk (over its stripes)
 const r=E.route({x:52.6,z:-50},{x:69.4,z:-64},'oldtown');assert.ok(r.length>1);assert.ok(r.some(p=>X.at(p.x,p.z,'oldtown',.6)?.id==='ot-alley')||r.slice(0,-1).some((p,i)=>{const q=r[i+1];for(let t=0;t<=1;t+=.05)if(X.at(p.x+(q.x-p.x)*t,p.z+(q.z-p.z)*t,'oldtown')?.id==='ot-alley')return true;return false;}),'over the alley crosswalk: '+JSON.stringify(r));
 assert.equal(E.route({x:52.6,z:-75},{x:52.6,z:-45},'oldtown').length,1,'straight along the pavement past NULL’s door');
 assert.equal(E.route({x:69.5,z:-160},{x:69.5,z:-200},'far-south').length,1,'straight along the pavement past Milked');
 // the arrow: from NULL's side to the alley's mouth across Main Street, over the alley crosswalk
 assert.equal(X.crossing({x:52.6,z:-58.5},{x:69.4,z:-58.5}).c.id,'ot-alley');
 // the editor map and the ChatGPT prompt
 const m=P.mapData('oldtown',REV),d=m.no.find(n=>n.doorway);assert.ok(d&&d.rule);assert.ok(!m.no.some(n=>/NULL’s door$/.test(n.name||'')));
 const pr=B.prompt(REV);assert.match(pr,/NULL's doorway/);assert.doesNotMatch(pr,/pavement at its door/);
 const inv=A.inventory().areas.find(a=>a.id==='oldtown').no.find(n=>n.doorway);assert.deepEqual(inv.rect,[50.5,52.5,-61.2,-55.8]);});

test('the owner, 20 Nov 2026: Milked\'s side street and service alley are ordinary walkable ground; only its two doorways are never stood in; inside stays closed',()=>{
 const E=require(R('void-runner/npc-escort.js')),X=require(R('void-runner/crosswalks.js'));
 for(const id of [REV,'ethereal-lace',CAT])for(const [x,z] of [[85,-171],[90,-171.5],[76,-171.2],[85,-192],[76,-191.8],[71,-171]])assert.deepEqual(P.spotProblems(id,{x,z}),[],id+' '+x+','+z);
 assert.deepEqual(P.waitAtProblems(REV,{x:88,z:-171,yaw:0}),[]);assert.equal(A.check({x:88,z:-171},null,undefined,{made:true}).ok,true,'a made character not marked adult');
 assert.deepEqual(P.planProblems(REV,{mode:'path',points:[{x:69.5,z:-171,action:'look',seconds:4},{x:96,z:-171,action:'idle',seconds:4}]}),[],'a route into the side street, past the front door');
 assert.deepEqual(A.leg({x:69.5,z:-191.8},{x:97,z:-191.8}),[],'along the service alley, past the rear door');
 // the doorways (within about 1.5 m of each door): never a spot or a wait, not snapped out of; an adult made character may
 for(const [x,z,re] of [[81.75,-173,/front doorway/],[80.4,-172.7,/front doorway/],[94.75,-190.8,/rear doorway/],[93.4,-191.3,/rear doorway/]]){const c=A.check({x,z});assert.equal(c.kind,'rule',x+','+z);assert.match(c.why,re);assert.equal(P.pick(REV,{x,z},'far-south').spot,null);
  for(const id of [REV,'ethereal-lace',CAT])assert.ok(P.spotProblems(id,{x,z}).length);assert.ok(P.waitAtProblems(REV,{x,z,yaw:0}).length);assert.equal(A.check({x,z},null,undefined,{adult:true}).ok,true);assert.equal(A.check({x,z},null,undefined,{passing:true}).ok,true);}
 // inside Milked (vestibule, reception, studios, staff rooms) stays closed
 for(const [x,z] of [[81.75,-175],[81.75,-176],[81,-180],[88,-182],[95,-187]])assert.equal(A.check({x,z},null,undefined,{passing:true}).ok,false,x+','+z);
 // her lanes' walls, planter, dumpster and crates are furniture
 for(const [x,z] of [[87,-190.6],[84.2,-173.2],[97.5,-192.8]])assert.equal(A.check({x,z},null,undefined,{passing:true}).kind,'obstacle',x+','+z);
 // named places, an escort over the Far South crosswalk into the service alley, the map and the prompt
 for(const id of ['far-south-milked-lane','far-south-milked-alley'])assert.equal(place(id).x,76);
 const r=E.route({x:52.6,z:-191},{x:90,z:-192},'far-south');assert.ok(r.some((p,i)=>i&&X.at((p.x+r[i-1].x)/2,(p.z+r[i-1].z)/2,'far-south')),'over a crosswalk: '+JSON.stringify(r));assert.deepEqual(r[r.length-1],{x:90,z:-192});
 assert.equal(E.route({x:69.5,z:-150},{x:90,z:-171},'far-south').length,2,'round the corner into the side street');
 const m=P.mapData('far-south',REV);assert.equal(m.no.filter(n=>n.doorway).length,2);assert.ok(!m.no.some(n=>/side street|service alley/.test(n.name||'')));assert.ok(m.walk.some(w=>w.name==='Milked side street'));
 const pr=B.prompt(REV);assert.match(pr,/Milked's front or rear doorway/);assert.match(pr,/Milked side street: x/);assert.doesNotMatch(pr,/Milked \(the building, its side street/);});
