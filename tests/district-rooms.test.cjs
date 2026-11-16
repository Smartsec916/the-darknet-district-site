/* The District's rebuilt rooms (district-rooms.js; David, 16 Nov 2026): the data behind the vending machines, the store counter's display cases and the oxygen bar. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../void-runner/district-rooms.js'),N=require('../void-runner/neochinatown.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
// a solid of the layout (world metres) against a rectangle given in the District's own metres
const sameBox=(solid,r,why)=>{const [x,z]=N.toWorld((r.x0+r.x1)/2,(r.z0+r.z1)/2);assert.ok(Math.abs(solid.position[0]-x)<.01&&Math.abs(solid.position[2]-z)<.01&&Math.abs(solid.size[0]-(r.x1-r.x0))<.01&&Math.abs(solid.size[2]-(r.z1-r.z0))<.01,why);};
test('the store counter shows only goods the store already has',()=>{
 const atlas=JSON.parse(read('void-runner/assets/textures/store/store-atlas.json')),names=new Set(atlas.survival.cells.map(c=>c.name));
 for(const it of R.ITEMS){assert.ok(it.like==='gun wall'||names.has(it.like),it.kind+' stands for a real store product: '+it.like);assert.ok(R.FOOT[it.kind],it.kind+' has a size');}
 assert.ok(read('void-runner/neochinatown.js').includes("'shop-gunwall-board'"),'the gun wall the pistols, magazines and ammunition come from is still in the shop');
});
test('every item lies inside a display case, on the counter, clear of Admin and Iris',()=>{
 const counter=N.layout('interior').solids.find(s=>s.id==='shop-counter'),C=R.COUNTER;
 sameBox(counter,C,'the cases sit on the counter the game collides with');
 const items=R.counterItems(true),few=R.counterItems(false);assert.ok(items.length>=120,'a dense counter: '+items.length);assert.ok(few.length<items.length*.75,'Low carries fewer');
 for(const it of items){const [a,b]=R.CASES[it.case];assert.ok(it.x>a&&it.x<b,'x inside its case');assert.ok(it.z>C.z0&&it.z<C.z1,'z on the counter');assert.ok(it.y>=C.top,'on the counter top');
  for(const s of R.STAFF)assert.ok(Math.abs(it.x-s)>.55,'nothing between a member of staff and the customer');assert.ok(it.kind==='tag'||R.FOOT[it.kind]);}
 for(const [a,b] of R.CASES){assert.ok(a>=C.x0&&b<=C.x1&&b>a);}
 assert.deepEqual(R.counterItems(true),items,'the same every time');
});
test('each hallway machine is stocked from the pod vending list under its own label',()=>{
 const src=read('void-runner/neochinatown.js'),all=JSON.parse(/const POD_VENDING=(\[\[.*?\]\])\.map/s.exec(src)[1]).map(d=>({name:d[0],category:d[1],price:d[2],kind:d[3]}));
 assert.deepEqual(R.MACHINES.map(m=>m.label),['DRINKS','DISPENSARY','NEUROHACKERS']);for(const m of R.MACHINES)assert.ok(src.includes("'"+m.label+"'"),'the label is the game\'s own');
 R.MACHINES.forEach((m,i)=>{const stock=R.machineStock(all,i);assert.ok(stock.length>=4,m.label+' has stock');for(const d of stock)assert.ok(all.includes(d));});
 assert.ok(R.machineStock(all,1).every(d=>d.category==='DISPENSARY'||/GREEN NEON|MIDNIGHT KUSH/.test(d.name)));
 assert.ok(src.includes("if(i===1||!instance('vending-neon'"),'the dispensary machine is always the built one; the others keep the licensed model where it is present');
});
test('the oxygen bar keeps to its counter, its seats and its allowed wording',()=>{
 const L=N.layout('interior'),counter=L.solids.find(s=>s.id==='bar-counter'),B=R.BAR;
 sameBox(counter,B.counter,'the bar is built on the counter the game collides with');const zBack=B.counter.z1;
 for(const [x,z] of B.tanks){assert.ok(x>3.3&&x<16.7&&z>zBack&&z<42,'tanks stand behind the bar');}
 assert.deepEqual(B.sign,['THE DARKNET DISTRICT','OXYGEN LOUNGE']);assert.deepEqual(B.neon,['O₂  OXYGEN BAR']);
 assert.ok(L.interactions.find(i=>i.id==='district-bar'),'the bartender prompt is unchanged');
 const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/district-rooms.js')>0&&html.indexOf('void-runner/district-rooms.js')<html.indexOf('void-runner/neochinatown.js'),'loaded before the District is built');
});
test('the hallway posters are down, their four spots are kept, and the advertisement order is unchanged',()=>{
 const src=read('void-runner/neochinatown.js');assert.ok(src.includes('const HALL_POSTER_SPOTS=[[30.5,1],[46,-1],[58,1],[66,-1]],HALL_POSTERS_SHOWN=false;'));
 assert.ok(src.includes("for(const [z,side] of HALL_POSTER_SPOTS){const ad=nextAd();if(HALL_POSTERS_SHOWN)plane('hall-ad'"),'each spot still takes its advertisement turn, and nothing is drawn');
 assert.equal(src.split("plane('hall-ad'").length,2,'no other hallway poster');
});
const LINES_HASH='6f865bb464d4bd93';
test('the campaign screen carries David\'s header and his 25 lines word for word, one at a time',()=>{
 const C=R.CAMPAIGN;assert.equal(C.header,'ANTI-WARFLYING CAMPAIGN');assert.equal(C.lines.length,25);assert.equal(new Set(C.lines).size,25);
 assert.equal(C.lines[0],"WarFlying is not a hobby. It's an invasion.");assert.equal(C.lines[19],"Scan my ship again and we'll discover how good your shields are.");assert.equal(C.lines[24],'The Tessaly System has room for everyone. Except snoops.');
 assert.equal(require('node:crypto').createHash('sha256').update(C.lines.join('\n')).digest('hex').slice(0,16),LINES_HASH,'no line was reworded');
 assert.deepEqual(R.campaignAt(0),{index:0,from:24,mix:1},'it opens on the first line, whole');const mid=R.campaignAt(C.seconds+C.fade/2);assert.equal(mid.index,1);assert.equal(mid.from,0);assert.ok(Math.abs(mid.mix-.5)<1e-9,'half way through the change');
 assert.equal(R.campaignAt(C.seconds*2-.01).mix,1,'then it holds');assert.equal(R.campaignAt(C.seconds*25).index,0,'and comes round again');
 // five panels: two in the hallway, two in the arcade, one in the bar; each whole on its wall with at least half a metre to the wall's end (a doorway or a corner), none in the pod room
 const L=N.layout('interior'),half=C.w/2+C.frame;assert.deepEqual(C.screens.map(s=>s.id),['hall-south','hall-mid','arcade-north','arcade-south','bar']);
 for(const sc of C.screens){const wall=L.solids.find(s=>s.id===sc.wall);assert.ok(wall,sc.wall);const [wx,wz]=N.toWorld(sc.x,sc.z),alongX=/z/.test(sc.face),off=alongX?Math.abs(wx-wall.position[0]):Math.abs(wz-wall.position[2]),len=alongX?wall.size[0]:wall.size[2];
  assert.ok(off+half+.5<=len/2,sc.id+' is clear of the ends of '+sc.wall+' by '+(len/2-off-half).toFixed(2)+' m');const across=alongX?Math.abs(wz-wall.position[2]):Math.abs(wx-wall.position[0]);assert.ok(across<.6,sc.id+' hangs on that wall');
  assert.ok(sc.z<70,'not in the Sleeping Pod room');assert.ok(sc.y-C.h/2>=1&&sc.y+C.h/2<=3.2,'at eye height');
  for(const o of L.solids)if(/^(prop-|arc-west-row|bar-counter|arcade-terminal)/.test(o.id)){const [px,pz]=N.toWorld(sc.x,sc.z);assert.ok(Math.abs(px-o.position[0])>o.size[0]/2+(alongX?half:.2)||Math.abs(pz-o.position[2])>o.size[2]/2+(alongX?.2:half),sc.id+' is clear of '+o.id);}}
 const src0=read('void-runner/neochinatown.js');for(const [x,z] of [...src0.matchAll(/\['crew-hall-[a-z0-9]+',(-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]))for(const sc of C.screens.filter(s=>s.hall))assert.ok(Math.sign(x)!==Math.sign(sc.x)||Math.abs(z-sc.z)>half+.6,'no resident stands in front of a hallway panel');
 const src=read('void-runner/district-rooms.js');assert.ok(!/campaign[^\n]*(speak|Audio|VoidVoice|playSound)/i.test(src),'no voice, no sound');
});
test('the arcade keeps a poster for every playable game and none for a game that is not built; a campaign screen hangs where each of those was',()=>{
 const src=read('void-runner/neochinatown.js'),playable=N.arcade.filter(c=>c.playable).map(c=>c.game).sort(),not=N.arcade.filter(c=>!c.playable).map(c=>c.game).sort();
 assert.deepEqual(playable,['blackout-protocol','corporate-zombies','underground-overdrive']);assert.deepEqual(not,['laser-moth','turbo-kelp']);
 const line=src.split('\n').find(l=>l.includes("if(ARCADE.find(c=>c.game===key)?.playable)poster(key,p,ry)"));assert.ok(line);for(const g of playable)assert.ok(line.includes("['"+g+"',["),g+' keeps its poster');for(const g of not)assert.ok(!line.includes("['"+g+"'"),g+' has no poster');
 assert.deepEqual(R.CAMPAIGN.screens.filter(s=>s.replaces).map(s=>s.replaces).sort(),not);assert.equal(N.arcade.length,5,'every cabinet is still there');
 const half=R.CAMPAIGN.w/2+R.CAMPAIGN.frame;for(const [x,wall] of [[-6,'arc-north'],[-4.4,'arc-south']])for(const sc of R.CAMPAIGN.screens.filter(s=>s.wall===wall))assert.ok(Math.abs(sc.x-x)>half+.5+.2,'clear of the poster beside it');
});
