/* The back alleys, bays, yards and fire escapes behind the housing (the owner, 20 Nov 2026; void-runner/ncz-backalleys.js): where they are, who walks them, the fire escape's
   jump-to-climb rule, the window into the hallway (no hacking), and the street-door prompt rule (only doors a mission uses show a prompt). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),src=f=>fs.readFileSync(R(f),'utf8');
const BA=require(R('void-runner/ncz-backalleys.js')),N=require(R('void-runner/neochinatown.js')),QT=require(R('void-runner/ncz-quarters.js')),AR=require(R('void-runner/npc-areas.js'));
const APT=require(R('void-runner/apartments.js')),NL=require(R('void-runner/ncz-nightlife.js')),ESC=require(R('void-runner/npc-escort.js')),E=require(R('void-runner/exploration-controller.js'));
const XW=require(R('void-runner/crosswalks.js')),MK=require(R('void-runner/milked.js')),NC=require(R('void-runner/ncz-nightclub.js'));
const inR=(r,x,z,m=0)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m,over=(a,b,m=0)=>a[0]<b[1]+m&&a[1]>b[0]-m&&a[2]<b[3]+m&&a[3]>b[2]-m;

test('the pieces: stable ids, three quarters, the owner\'s sizes (alleys about 5 m, narrower than the District alley; bays 8-10 x 12-16; yards about 12 x 12)',()=>{
 assert.equal(new Set(BA.PIECES.map(p=>p.id)).size,BA.PIECES.length);for(const p of BA.PIECES){assert.ok(['avenue','oldtown','far-south'].includes(p.quarter),p.id);assert.ok(p.id.startsWith(p.quarter+'-'),p.id+' starts with its quarter');assert.ok(p.name.length>5);}
 const dims=r=>[Math.min(r[1]-r[0],r[3]-r[2]),Math.max(r[1]-r[0],r[3]-r[2])],district=N.streets.alley[3]-N.streets.alley[2];
 for(const p of BA.PIECES.filter(p=>p.kind==='alley'||p.kind==='lane'))for(const r of p.rects){const [w]=dims(r);assert.ok(w>=4&&w<=5.01&&w<district,p.id+' is '+w+' m wide');}
 for(const p of BA.PIECES.filter(p=>p.kind==='bay')){const [d,l]=dims(p.rects[0]);assert.ok(d>=7.5&&d<=10&&l>=12&&l<=16,p.id+' '+d+' x '+l);}
 for(const p of BA.PIECES.filter(p=>p.kind==='yard')){const [d,l]=dims(p.rects[0]);assert.ok(d>=10&&l<=12.01,p.id+' '+d+' x '+l);}
 for(const q of ['avenue','oldtown','far-south'])for(const k of ['alley','bay','yard'])assert.ok(BA.list(q).some(p=>p.kind===k),q+' has a '+k);});

test('carved out of the city blocks, clear of every door, gate, crosswalk, NULL, Milked, the District and its terrace',()=>{
 const blocks=N.layout('all').solids.filter(s=>/^city-block/.test(s.id)).map(s=>[s.position[0]-s.size[0]/2,s.position[0]+s.size[0]/2,s.position[2]-s.size[2]/2,s.position[2]+s.size[2]/2]);
 for(const p of BA.PIECES)for(const r of p.rects){for(const b of blocks)assert.ok(!over(r,b,-.3),p.id+' is open ground (no city block in it)');
  for(const [name,f] of [['NULL',NC.RECT],['Milked',MK.FOOTPRINT],['the District',N.footprints.district],['the terrace',N.footprints.terrace]])assert.ok(!over(r,f,-.01),p.id+' clear of '+name);
  for(const g of QT.GATES)assert.ok(!over(r,g.rect,-.01),p.id+' clear of '+g.name);}
 for(const d of APT.doors().filter(d=>!d.family||d.family==='office'||d.family==='commercial'))for(const o of BA.MOUTHS){const c=o.axis==='x'?d.z:d.x,line=o.axis==='x'?d.x:d.z;if(Math.abs(line-o.at)>.01)continue;assert.ok(c<o.from-.7||c>o.to+.7,'the mouth of '+o.piece+' does not cut door '+d.id);}
 for(const c of XW.list())for(const p of c.posts)assert.ok(!BA.inPieces(p.p[0],p.p[1],null,.3),'crosswalk '+c.id+': its signal posts stand on the kerb, not in an alley');   // crosswalks are road: an alley's mouth may face one, never cut it
 // every mouth opens onto the street, every piece is reached from a street through others (one open space per quarter)
 for(const q of BA.QUARTERS){const P=BA.list(q),seen=new Set(),open=[...P.filter(p=>BA.MOUTHS.some(o=>o.piece===p.id)||p.rects.some(r=>over(r,N.streets.alley,0)||over(r,N.streets.milkedLane,0)))];open.forEach(p=>seen.add(p.id));
  while(open.length){const a=open.pop();for(const b of P)if(!seen.has(b.id)&&a.rects.some(r=>b.rects.some(s=>over(r,s,.01)))){seen.add(b.id);open.push(b);}}assert.equal(seen.size,P.length,q+': every piece joins the street');}
 // the street's collision: the player walks in (the furniture is solid)
 const L=N.layout('street',null);for(const p of BA.PIECES){const [x,z]=p.at;const f=BA.furniture().find(f=>inR(f.rect,x,z,.4));if(!f)assert.equal(E.blocked(x,z,L),false,p.id+' middle is open');}
 for(const f of BA.furniture())assert.ok(L.solids.some(s=>s.id==='back-'+f.id),f.id+' is solid');});

test('each quarter counts them as its own ground; the street walkers never go in or stand in a mouth',()=>{
 for(const p of BA.PIECES){const [x,z]=p.at;assert.equal(QT.quarterAt(x,z),p.quarter,p.id);}
 for(const l of [...NL.lanes,...NL.farLanes])for(let t=0;t<=1;t+=.02){const x=l.a[0]+(l.b[0]-l.a[0])*t,z=l.a[1]+(l.b[1]-l.a[1])*t;assert.ok(!BA.inPieces(x,z,null,-.01),'lane '+l.id+' stays on its pavement');}
 for(const o of BA.MOUTHS){const c=(o.from+o.to)/2,p=o.axis==='z'?[c,o.at-o.into[1]*1.5]:[o.at-o.into[0]*1.5,c];assert.equal(NL.clearAt(p),false,'nobody of the crowd stands in front of '+o.piece);}
 const people=NL.plan('high',(()=>{let s=7;return ()=>((s=s*16807%2147483647)-1)/2147483646;})());for(const p of people)assert.ok(!BA.inPieces(p.x,p.z,null),p.id+' is not in a back alley');});

test('ordinary walkable ground for placed NPCs: spots, named places, routes from the pavement, the walk planner; furniture and fire escapes are obstacles',()=>{
 for(const b of BA.places()){const p=AR.places().find(q=>q.id===b.id);assert.ok(p,b.id+' is a named place');assert.equal(p.name,b.name);const c=AR.check(p);assert.ok(c.ok,b.id+': '+c.why);assert.equal(c.area,b.area);}
 assert.equal(AR.places().find(p=>p.id==='far-south-east-yard').name,'Far South east yard');
 for(const [a,b] of [[{x:19.5,z:-6.6},{x:19.5,z:2.5}],[{x:12.7,z:-18.3},{x:12.7,z:-28.5}],[{x:52.5,z:-46.4},{x:20,z:-46.4}],[{x:69.5,z:-47.5},{x:111.6,z:-47.5}],[{x:111.6,z:-58},{x:111.6,z:-47}],[{x:69.5,z:-137.5},{x:100,z:-137.5}],[{x:100,z:-150},{x:100,z:-170.5}],[{x:52.5,z:-172.5},{x:37.5,z:-172.5}]])
  assert.deepEqual(AR.leg(a,b),[],JSON.stringify([a,b]));
 for(const [a,b,q] of [[{x:61,z:-6.6},{x:40,z:9.5},'avenue'],[{x:52.5,z:-100},{x:8.5,z:-59},'oldtown'],[{x:69.5,z:-80},{x:101,z:-82.5},'oldtown'],[{x:69.5,z:-150},{x:87,z:-162.5},'far-south']]){
  const r=ESC.walkRoute(a,b,q);assert.ok(r&&r.length>1,'a walk from the street into '+JSON.stringify(b));for(const w of r)assert.ok(AR.check(w,q,.1,{passing:true}).ok,'every turn of the walk is on walkable ground');}
 for(const f of BA.furniture()){const c=AR.check({x:f.x,z:f.z});assert.equal(c.ok,false,f.id);assert.equal(c.kind,'obstacle');}
 for(const e of BA.ESCAPES){const c=AR.check({x:e.x+e.u[0]*.6,z:e.z+e.u[1]*.6});assert.equal(c.ok,false);assert.match(c.why,/fire escape|wall|building/);}
 const inv=AR.inventory();for(const q of BA.QUARTERS){const a=inv.areas.find(x=>x.id===q);assert.ok(BA.walk(q).every(w=>a.walk.some(v=>Math.abs(v[0]-w.x0)<1e-9&&Math.abs(v[3]-w.z1)<1e-9)),q+': the server reads the same ground');}
 // the NEVER list still holds: NULL inside, Milked inside, the terrace and the District stay off limits
 for(const [x,z] of [[30,-58],[84,-182],[88,-105],[96,-75]])assert.equal(AR.check({x,z}).ok,false);});

test('the mission arrow routes into them (the quarter\'s streets join them)',()=>{
 const G=require(R('void-runner/guide-route.js'));const g=G.graphFor('neochinatown');
 for(const [from,goal] of [[{x:61,z:-12.5},{x:40,z:9.5}],[{x:61,z:-60},{x:8.5,z:-59}],[{x:61,z:-150},{x:30.5,z:-176}]]){const w=G.plan(g,from,goal);assert.ok(w.length>=2,'a turn on the way into '+JSON.stringify(goal));assert.equal(w[w.length-1].id,'goal');}});

test('fire escapes: behind every apartment-building door whose building backs onto a piece; a window into its hallway, a drop ladder off the ground',()=>{
 const rule=BA.escapeRule(APT.doors()).map(r=>r.door).sort();assert.deepEqual(BA.ESCAPES.map(e=>e.door).sort(),rule);
 for(const id of ['apt-avenue-n-23','apt-avenue-n-30','apt-avenue-n-37','apt-avenue-n-44','apt-avenue-s-23','apt-avenue-s-30','apt-avenue-s-86','apt-avenue-s-93','apt-avenue-s-100','apt-avenue-s-107','apt-avenue-s-114','apt-main-w-176','apt-main-w-183','apt-main-w-190'])assert.ok(BA.escapeFor(id),id);
 for(const e of BA.ESCAPES){assert.ok(!APT.door(e.door).family,'an apartment building, not an office or a shop: '+e.door);assert.ok(e.quarter);assert.ok(BA.inPieces(e.foot[0],e.foot[1],e.quarter),e.id+': its foot is in the alley');assert.ok(BA.open(e.x+e.u[0]*.3,e.z+e.u[1]*.3)&&!BA.open(e.x-e.u[0]*.3,e.z-e.u[1]*.3),e.id+' is on a wall');}
 assert.ok(BA.ESC.ladderLow>=1.4&&BA.ESC.ladderLow<=1.8,'the drop ladder hangs off the ground');assert.ok(BA.ESC.H>3);});

test('jump at the fire escape to climb: at its foot, facing the wall, on the ground; climb up to the landing; jump or walk off the ladder end to climb down',()=>{
 const e=BA.escapeFor('apt-avenue-n-30'),yaw=Math.atan2(-e.u[0],-e.u[1]),at={x:e.foot[0],z:e.foot[1],yaw,height:0};
 assert.equal(BA.grab(at,'avenue'),e);assert.equal(BA.grab({...at,yaw:yaw+Math.PI},'avenue'),null,'facing away');assert.equal(BA.grab({...at,yaw:yaw+1.4},'avenue'),null,'facing along the wall');
 assert.equal(BA.grab({...at,x:at.x+e.u[0]*1.5,z:at.z+e.u[1]*1.5},'avenue'),null,'too far from the ladder');assert.equal(BA.grab({...at,height:1},'avenue'),null,'already in the air');assert.equal(BA.grab(at,'oldtown'),null,'another quarter');
 const p0=BA.climbPose(e,0),p1=BA.climbPose(e,1);assert.ok(Math.hypot(p0.x-e.foot[0],p0.z-e.foot[1])<.05&&p0.h<.01,'starts at the foot');assert.ok(Math.abs(p1.h-BA.ESC.H)<.1,'ends on the landing');
 let last=-1;for(let k=0;k<=1;k+=.05){const p=BA.climbPose(e,k);assert.ok(p.h>=last-.1,'up, rung by rung');last=p.h;}
 const on=BA.perch(e,{x:e.x+e.u[0]*3,z:e.z+e.u[1]*3});assert.equal(on.off,false);assert.ok(Math.hypot(on.x-e.x,on.z-e.z)<1.5,'clamped onto the grating');
 const end=BA.perch(e,{x:e.x+e.t[0]*(BA.ESC.half+.3)+e.u[0]*.6,z:e.z+e.t[1]*(BA.ESC.half+.3)+e.u[1]*.6});assert.equal(end.off,true,'off the ladder end');
 const s=src('void-runner/ncz-backalleys-integration.js');assert.match(s,/E\.step=function/);assert.match(s,/BA\.grab\(p,loc\.quarter\)/);assert.match(s,/groundAction=function\(a\)\{if\(a==='jump'&&st&&st\.phase==='perch'\)/);assert.doesNotMatch(s,/CLIMB THE FIRE ESCAPE|CLIMB UP|GRAB THE LADDER/,'no menu prompt to climb');});

test('the window: open only with an apartment on that street door and its "available from" step reached; no hacking, a hack lock does not keep it shut',()=>{
 const door='apt-avenue-n-30',tree=(apts,objs=[{id:'s1',kind:'talk'},{id:'s2',kind:'apt-enter',apt:'a1'}])=>[{missions:[{id:'m1',objectives:objs,apartments:apts}]}];
 const st=done=>({universe:{missions:{m1:{acquired:true,completed:false,objectives:done}}}});
 assert.equal(BA.windowOpen(door,APT.openNow(st({}),tree([]))),null,'nothing placed');
 assert.equal(BA.windowOpen(door,APT.openNow(st({}),tree([{id:'a1',style:'normal',door,from:'s2'}]))),null,'its step not reached yet');
 assert.ok(BA.windowOpen(door,APT.openNow(st({s1:true}),tree([{id:'a1',style:'normal',door,from:'s2'}]))),'step reached');
 assert.ok(BA.windowOpen(door,APT.openNow(st({}),tree([{id:'a1',style:'normal',door,locked:true}]))),'locked until hacked: the window still opens');
 assert.equal(BA.windowOpen(door,APT.openNow(st({}),tree([{id:'a1',style:'normal',door:'apt-avenue-n-37'}]))),null,'another door');
 const s=src('void-runner/ncz-backalleys-integration.js'),h=s.slice(s.indexOf("register('fe-window'"),s.indexOf("register('apt-hall-window'"));assert.match(h,/The window is shut\./);assert.doesNotMatch(h,/hack|apt-ap|locked/i,'no hack option on the window');
 assert.match(s,/def\.spawn=\[A\.ORIGIN\[0\]\+H\.x\[1\]-1\.45/,'in at the far end of the hallway');assert.match(s,/def\.yaw=-Math\.PI\/2/,'facing back down the corridor');assert.match(s,/CLIMB OUT OF THE WINDOW/);
 assert.equal(APT.HALL.street.x,-11,'the street door is at the west end; the window at the east');});

test('street doors show a prompt only while a taken mission uses them (an apartment or location on it, a hack aimed at it, or hacked open); the windows follow the same rule',()=>{
 const st=(done,taken=true,completed=false)=>({universe:{missions:{m1:{acquired:taken,completed,objectives:done}}}}),door='apt-avenue-s-30';
 const tree=m=>[{missions:[{id:'m1',objectives:[{id:'s1',kind:'talk'},{id:'s2',kind:'apt-enter',apt:'a1'}],...m}]}];
 assert.equal(APT.doorsInUse(st({}),[]).size,0,'no missions: no door in use');
 assert.ok(APT.doorsInUse(st({}),tree({apartments:[{id:'a1',style:'normal',door,from:'s2'}]})).has(door),'placed, its step not reached yet: the prompt shows (locked)');
 assert.equal(APT.doorsInUse(st({},false),tree({apartments:[{id:'a1',style:'normal',door}]})).size,0,'not taken');assert.equal(APT.doorsInUse(st({},true,true),tree({apartments:[{id:'a1',style:'normal',door}]})).size,0,'done');
 assert.ok(APT.doorsInUse(st({}),[{missions:[{id:'m1',objectives:[{id:'h',kind:'hack',ap:'biz-avenue-s-34'}]}]}]).has('biz-avenue-s-34'),'a hack step aimed at an office door');
 const loc=APT.doorsInUse(st({}),[{missions:[{id:'m1',objectives:[],apartments:[{id:'o1',door:'biz-avenue-n-27',modules:[]}]}]}]);assert.ok(loc.has('biz-avenue-n-27'),'a location on an office door');
 // the selection skips a hidden prompt
 const p={x:0,z:0,yaw:0},loc2={interactions:[{id:'d',label:'NO. 30 · LOCKED',position:[0,1.7,1],action:'apt-door',range:1.6,hidden:true}],solids:[],bounds:[100,100]};assert.equal(E.select(p,loc2),null);loc2.interactions[0].hidden=false;assert.equal(E.select(p,loc2).id,'d');
 const s=src('void-runner/apartment-integration.js');assert.match(s,/hidden:!used\.has\(d\.id\)/);assert.match(s,/it\.hidden=!used\.has\(d\.id\)/);assert.match(s,/else if\(it\.action==='apt-ap'&&\/\^aptap-\/\.test\(it\.id\|\|''\)\)it\.hidden=!used\.has\(it\.ap\)/);
 const b=src('void-runner/ncz-backalleys-integration.js');assert.match(b,/it\.hidden=!inUse\(\)\.has\(st\.e\.door\)/,'the window prompt: the same rule');});

test('wired in: scripts in order, the editor map draws them and the fire escapes, the build, the ChatGPT prompt',()=>{
 const html=src('void-runner.html'),i=n=>html.indexOf('void-runner/'+n+'"');assert.ok(i('ncz-backalleys.js')>0&&i('ncz-backalleys.js')<i('npc-areas.js')&&i('ncz-backalleys.js')<i('ncz-quarters.js')&&i('ncz-backalleys.js')<i('neochinatown.js'));
 assert.ok(i('ncz-backalleys-integration.js')>i('apartment-integration.js')&&i('ncz-backalleys-integration.js')>i('prologue-integration.js'));assert.equal(src('static/void-runner.html'),html);
 const P=require(R('void-runner/npc-paths.js'));for(const q of BA.QUARTERS){const m=P.mapData(q);assert.equal(m.escapes.length,BA.escapesIn(q).length);const [x0,x1,z0,z1]=BA.extent(q);assert.ok(m.view.x0<=x0&&m.view.x1>=x1&&m.view.z0<=z0&&m.view.z1>=z1,q+' map shows them');}
 assert.match(src('void-runner/npc-map.js'),/fire escape/);assert.match(src('void-runner/neochinatown.js'),/BA\.build\(\{B,scene,parent,quality,quarter:QK,base\}\)/);
 assert.match(require(R('void-runner/npc-behaviour.js')).prompt('grey-reverie'),/back alleys/);
 assert.match(src('void-runner-sw.js'),/const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';/);});
test('a narrow opening between two pieces (the Avenue north alley into its loading bay) is kept clear of furniture (night QA)',()=>{const BA=require('../void-runner/ncz-backalleys.js');
 // the alley's east leg [45.1,49.9] meets the bay [33,47] over x 45.1..47 at z 5: a player (0.76 m wide) must fit through
 const inGap=BA.furniture('avenue').filter(f=>f.rect[0]<47&&f.rect[1]>45.1&&f.rect[2]<6.6&&f.rect[3]>3.4);assert.deepEqual(inGap.map(f=>f.id),[]);
 for(const q of BA.QUARTERS)for(const f of BA.furniture(q))assert.ok(!(f.piece==='avenue-north-bay'&&f.z<9&&f.x>45),f.id);});
test('a follow / lead walk between the Avenue back alleys and its pavement goes through the alley mouths, never through the buildings (night QA)',()=>{
 globalThis.VoidNPCAreas=require('../void-runner/npc-areas.js');const E=require('../void-runner/npc-escort.js');
 for(const [a,b] of [[{x:40,z:10},{x:24,z:7}],[{x:24,z:7},{x:47.5,z:-2}],[{x:40,z:10},{x:38,z:-6.6}],[{x:38,z:-6.6},{x:23,z:6}]]){
  const pts=[a,...E.route(a,b,'avenue')],rects=QT.QUARTERS.avenue.streets;for(let i=1;i<pts.length;i++)for(let t=0;t<=1;t+=.02){const x=pts[i-1].x+(pts[i].x-pts[i-1].x)*t,z=pts[i-1].z+(pts[i].z-pts[i-1].z)*t;
   assert.ok(rects.some(r=>x>=r[0]-.05&&x<=r[1]+.05&&z>=r[2]-.05&&z<=r[3]+.05),'off the streets at '+x.toFixed(1)+','+z.toFixed(1)+' '+JSON.stringify(pts));}}
 assert.deepEqual(E.route({x:60,z:-6.4},{x:30,z:-6.6},'avenue'),[{x:60,z:-6.6},{x:30,z:-6.6}]);});   // the north pavement keeps its walking line
