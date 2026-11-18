const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const S=require('../void-runner/ncz-street-pair.js'),C=require('../void-runner/crowd.js'),Q=require('../void-runner/ncz-quarters.js'),M=require('../void-runner/milked.js');
const at=(h,m=0,day=18)=>Date.UTC(2026,10,day,h,m);

test('the 12-hour rotation: UTC 0-11 Reverie, 12-23 Lace, the same for everyone',()=>{
 for(let h=0;h<24;h++)assert.equal(S.onShift(at(h,30)).id,h<12?'grey-reverie':'ethereal-lace',String(h));
 assert.equal(S.onShift(at(11,59)).id,'grey-reverie');assert.equal(S.onShift(at(12,0)).id,'ethereal-lace');assert.equal(S.onShift(at(0,0,19)).id,'grey-reverie');
 // a player's own time zone does not matter: the same instant gives the same answer
 const t=at(15,10);assert.equal(S.onShift(t).id,S.onShift(new Date(t).getTime()).id);
 assert.equal(S.shiftStart(at(15,10)),at(12,0));assert.equal(S.shiftStart(at(3,0)),at(0,0));assert.equal(S.nextChange(at(15,10)),at(0,0,19));assert.equal(S.nextChange(at(3,0)),at(12,0));
});

test('nobody is out for the first moments of a shift (the handover), then the one on shift is',()=>{
 const a=S.config.arrive;assert.ok(a>0&&a<600);
 assert.equal(S.onStreet(at(12,0)),null);assert.equal(S.onStreet(at(12,0)+(a-1)*1000),null);assert.equal(S.onStreet(at(12,0)+a*1000).id,'ethereal-lace');
 assert.equal(S.onStreet(at(0,0,19)+1000),null);assert.equal(S.onStreet(at(6,0)).id,'grey-reverie');
});

test('names: no spaces, placeholders, the Meshy titles kept; neither has dialogue or a voice',()=>{
 assert.deepEqual(S.PAIR.map(p=>p.id),['grey-reverie','ethereal-lace']);assert.deepEqual(S.PAIR.map(p=>p.name),['Reverie','Lace']);
 for(const p of S.PAIR){assert.doesNotMatch(p.name,/\s/);assert.equal(p.placeholder,true);}assert.deepEqual(S.PAIR.map(p=>p.title),['Grey Reverie','Ethereal Lace']);
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-street-pair.js'),'utf8');assert.doesNotMatch(src,/talkChoice|speech\s*=|announce\(|VoidInteractions|voice-clips/);
 const reg=fs.readFileSync(path.join(__dirname,'../tools/audio/npc-voice-registry.json'),'utf8');assert.doesNotMatch(reg,/reverie|ethereal|"lace"/i);
});

test('Lace plays neutral street clips only (no dance, flirt or performance clips)',()=>{
 assert.deepEqual(C.clips['npc-ethereal-lace'].slice().sort(),['idle','look','sit','walk']);
 const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'../tools/animation-pipeline/characters/npc-ethereal-lace.json'),'utf8'));assert.deepEqual(spec.clips.map(c=>c==='walk-game'?'walk':c).sort(),['idle','look','sit','walk']);
 const b=fs.readFileSync(path.join(__dirname,'../void-runner/assets/models/crowd/npc-ethereal-lace.glb')),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 assert.deepEqual(j.animations.map(a=>a.name.replace(/\.\d+$/,'')).sort(),['idle','look','sit','walk'],'the file carries exactly these clips');
 for(const f of ['npc-ethereal-lace','npc-grey-reverie','npc-street-cat']){const n=fs.statSync(path.join(__dirname,'../void-runner/assets/models/crowd/'+f+'.glb')).size;assert.ok(n<5.2e6,f+' is game-sized ('+n+')');}
 assert.ok(fs.statSync(path.join(__dirname,'../void-runner/assets/models/crowd/npc-street-cat.glb')).size<1.2e6,'the cat is small');
});

test('they stay on one ordinary stretch of the Avenue, far from Milked, NULL and the club',()=>{
 const pts=[S.SEAT,S.CAT_HOME,{x:S.STRETCH.x0,z:S.STRETCH.z},{x:S.STRETCH.x1,z:S.STRETCH.z},...S.STEPS];
 for(const p of pts){assert.ok(Q.inQuarter(S.QUARTER,p.x,p.z),JSON.stringify(p));assert.ok(M.distance(p.x,p.z)>100,'far from Milked');assert.ok(p.z<S.WALL&&p.z>-8,'on the north pavement');}
 // NULL and the District door are on Main Street / the alley (x 52-70, z -40..-70): nowhere near
 for(const p of pts)assert.ok(Math.hypot(p.x-61,p.z+60)>50);
});

test("Lace's routine: walks, sits on a ledge, gets up and walks again, never leaving her stretch",()=>{
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const s=S.laceStart(rnd);const seen=new Set();let sat=0,minX=1e9,maxX=-1e9;
 for(let i=0;i<20*60*10;i++){S.laceStep(s,.1,rnd);seen.add(s.mode);if(s.mode==='sit'){sat++;assert.ok(S.STEPS.some(t=>Math.abs(t.x-s.x)<.01),'sits on a ledge');assert.equal(s.clip,'sit');}
  minX=Math.min(minX,s.x);maxX=Math.max(maxX,s.x);assert.ok(s.z<S.WALL&&s.z>-7.5,'on the pavement: '+s.z);assert.ok(['walk','idle','sit','look'].includes(s.clip));}
 for(const m of ['walk','to-step','settle','sit','rise'])assert.ok(seen.has(m),m);
 assert.ok(sat>0);assert.ok(minX>=S.STRETCH.x0-.01&&maxX<=S.STRETCH.x1+.01,minX+'..'+maxX);
});

test("the cat's target: whoever is out, else home; a close player now and then, never during its cool-down",()=>{
 const cat={x:100,z:-6.2},her={x:110,z:-6.8,moving:true};
 assert.deepEqual(S.catTarget({her:null,cat}),{kind:'home',x:S.CAT_HOME.x,z:S.CAT_HOME.z});
 const t=S.catTarget({her,cat});assert.equal(t.kind,'her');assert.equal(t.x,110);assert.equal(t.moving,true);
 assert.equal(S.catTarget({her:{...her,sitting:true},cat}).sitting,true);
 const near={x:101,z:-6.5},far={x:120,z:-12};
 assert.equal(S.catTarget({her,cat,player:near,chance:0}).kind,'player','a close player, when the chance falls');
 assert.equal(S.catTarget({her,cat,player:near,chance:.99}).kind,'her','not every time');
 assert.equal(S.catTarget({her,cat,player:far,chance:0}).kind,'her','a far player is ignored');
 assert.equal(S.catTarget({her,cat,player:near,chance:0,clock:10,until:30}).kind,'her','cool-down');
 assert.equal(S.catTarget({her:null,cat,player:near,chance:0}).kind,'player');
 // the one out comes from the shift: in the handover the cat goes home
 assert.equal(S.catTarget({her:S.onStreet(at(12,0))?her:null,cat}).kind,'home');
});

test('wired into the page and the street (after the alley, before neochinatown.js)',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert.match(h,/src="void-runner\/ncz-street-pair\.js"/);assert.ok(h.indexOf('ncz-street-pair.js')<h.indexOf('void-runner/neochinatown.js'));}
 const n=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');assert.match(n,/VoidStreetPair\.start/);assert.match(n,/streetPair\?\.tick\(dt\)/);assert.match(n,/streetPair\?\.dispose\(\)/);
});
