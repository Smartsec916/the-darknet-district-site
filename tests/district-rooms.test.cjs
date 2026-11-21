/* The District's rebuilt rooms (district-rooms.js; the owner, 16 Nov 2026): the data behind the vending machines, the store counter's display cases and the oxygen bar. */
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
test('nothing in a display case stands through its glass: every item clears the top pane on the tier it lies on, in both its forms',()=>{
 const src=read('void-runner/district-rooms.js'),H=Number(/const H=(\.\d+);/.exec(src)[1]);assert.ok(src.includes("box('shop-case-pane',[w-.03,.008,d-.03],[xc,top+.036+H,zc]"),'the top pane is where the rule expects it');
 assert.ok(Math.abs(R.CASE_CEILING-(.036+H-.004))<1e-9,'the ceiling is the underside of the top pane');
 for(const kind of Object.keys(R.FOOT))assert.ok(R.TALL[kind]>0,kind+' has a height');
 for(const [name,p] of Object.entries(R.PROPS))if(p.fit[0]==='y'&&R.TALL[name])assert.ok(R.TALL[name]>=p.fit[1],'the modelled '+name+' is no taller than the height the cases allow for');
 for(const dense of [true,false])for(const it of R.counterItems(dense)){if(it.kind==='tag')continue;const topOf=it.y-R.COUNTER.top+R.TALL[it.kind]*R.SCALE;
  assert.ok(topOf<=R.CASE_CEILING-R.CASE_CLEAR+1e-9,it.kind+' on tier '+it.tier+' reaches '+topOf.toFixed(3));
  const [fw,fd]=R.FOOT[it.kind].map(v=>v*R.SCALE),[a,b]=R.CASES[it.case],zf=R.COUNTER.z0+.1,[f,t]=R.TIERS[it.tier];assert.ok(it.x-fw/2>=a+.02&&it.x+fw/2<=b-.02,it.kind+' is clear of the side panes');assert.ok(it.z-fd/2>=zf+f-.001&&it.z+fd/2<=zf+t+.001,it.kind+' stays on its own tier');}
 const radios=R.counterItems(true).filter(i=>i.kind==='radio');assert.ok(radios.length>0&&radios.every(i=>i.tier<2),'no radio on the top shelf');
 assert.ok(R.counterItems(true).some(i=>i.tier===2),'the top shelf still carries the short goods');
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
test('the campaign screen carries the owner\'s header and his 25 lines word for word, one at a time',()=>{
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
test('the modelled props: each has its file, a size and a built prop to fall back on; Low never loads one',()=>{
 const names=Object.keys(R.PROPS);assert.deepEqual(names.slice().sort(),['bar-stool','flashlight','o2-station','o2-tank','pistol','radio','vr-headset']);
 const src=read('void-runner/district-rooms.js');
 for(const n of names){const p=R.PROPS[n],file=path.join(__dirname,'..','void-runner',R.propFile(n));assert.ok(fs.existsSync(file),n+': file');const size=fs.statSync(file).size;assert.ok(size>50e3&&size<1.5e6,n+': a web-sized file ('+size+')');
  const b=fs.readFileSync(file),json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));assert.ok(!(json.extensionsUsed||[]).some(e=>/draco|meshopt/.test(e)&&e!=='EXT_meshopt_compression'),n+': no compressed geometry the game cannot decode (lossless meshopt is decoded locally since 18 Nov 2026)');
  const tris=json.meshes.reduce((a,m)=>a+m.primitives.reduce((s,q)=>s+json.accessors[q.indices].count/3,0),0);assert.ok(tris>500&&tris<=12500,n+': triangles '+tris);
  assert.ok(['x','y','z'].includes(p.fit[0])&&p.fit[1]>.05&&p.fit[1]<2,n+': size');assert.ok(src.includes("prop('"+n+"',")||src.includes('prop(it.kind,'),n+': placed');}
 for(const k of ['pistol','radio','flashlight'])assert.ok(R.ITEMS.some(i=>i.kind===k),k+' is a kind of goods the counter already shows');
 assert.match(src,/const prop=\(name,at,standIn\)=>\{const propHome=K\.target;if\(low\|\|/,'Low builds the stand-in at once');
});
test('Nyx the bartender: her own model, the same person, place, prompt and line',()=>{
 const P=require('../void-runner/district-people.js'),C=require('../void-runner/crowd.js'),nyx=P.npc('nyx-district');
 assert.equal(nyx.name,'Nyx');assert.deepEqual(nyx.jobs,['bartender']);assert.equal(nyx.place,'The bar and oxygen lounge');assert.equal(nyx.model,'npc-nyx');assert.equal(nyx.appearance,undefined,'no other look stands in for her');
 assert.ok(fs.existsSync(path.join(__dirname,'..','void-runner/assets/models/crowd/npc-nyx.glb')));
 const spec=JSON.parse(read('tools/animation-pipeline/characters/npc-nyx.json'));assert.deepEqual(spec.clips.map(c=>c==='walk-game'?'walk':c).sort(),C.clips['npc-nyx'].slice().sort());for(const c of ['idle','talk','look','wipe'])assert.ok(C.clips['npc-nyx'].includes(c),c);
 const b=fs.readFileSync(path.join(__dirname,'..','void-runner/assets/models/crowd/npc-nyx.glb')),json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 assert.deepEqual(json.animations.map(a=>a.name.replace(/\.\d+$/,'')).sort(),C.clips['npc-nyx'].slice().sort(),'the file carries exactly the listed clips');
 const tris=json.meshes.reduce((a,m)=>a+m.primitives.reduce((s,q)=>s+json.accessors[q.indices].count/3,0),0);assert.ok(tris<=32000,'triangles '+tris);
 const it=N.layout?N.layout().interactions?.find(i=>i.id==='district-bar'):null;if(it)assert.equal(it.label,'TALK TO THE BARTENDER');
 const src=read('void-runner/neochinatown.js');assert.match(src,/old=characterModel\('nyx-district',target,pos,false\)/,'her earlier figure is the only stand-in');assert.match(src,/const pos=\[10,0,40\]/,'she stands where she stood');
 assert.match(read('void-runner/prologue-integration.js'),/register\('district-bar',\(\)=>districtLine\('Bartender','Filtered air is free, the drinks are not\. Pilots talk too much in here, so listen\.'\)\)/,'her line is unchanged');
});
