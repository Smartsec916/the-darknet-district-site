// People using their V1 (void-runner/npc-device.js): tiers, the scheduler (share of users, durations, poses), the caps, and the spectacle reactions.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const D=require(path.join(__dirname,'..','void-runner','npc-device.js'));
const seeded=(s=1)=>()=>((s=Math.imul(s^s>>>15,2246822507)+0x6d2b79f5>>>0)%100000)/100000;

test('tiers: data wins, otherwise mostly V1, some V2, rare V3 // Shadow',()=>{
 assert.equal(D.tierFor('dax','v3'),'v3');assert.equal(D.tierFor('anyone','v2'),'v2');
 const c={v1:0,v2:0,v3:0};for(let i=0;i<20000;i++)c[D.tierFor('night-'+i)]++;
 assert.ok(c.v1/20000>.66&&c.v1/20000<.78,'V1 most '+c.v1);assert.ok(c.v2/20000>.18&&c.v2/20000<.28,'V2 some '+c.v2);assert.ok(c.v3/20000>.03&&c.v3/20000<.07,'V3 rare '+c.v3);
 assert.equal(D.tierFor('night-7'),D.tierFor('night-7'),'stable for a seed');
 assert.equal(D.TIERS.v3.eye,true,'the V3 // Shadow streams into the eye');assert.equal(D.TIERS.v3.color,'#46ff7a');assert.equal(D.TIERS.v1.color,'#61eee9');
 assert.equal(D.TIERS.v2.color,D.V2_PLACEHOLDER_COLOR);assert.ok(D.TIERS.v2.placeholder&&D.TIERS.v2.color!==D.TIERS.v1.color,'V2: a different placeholder colour until the owner designs it');
});

test('street walkers: 10-20% use their V1 at a time, for 5-15 s',()=>{
 const s=D.createScheduler({rnd:seeded(3)}),ag=[...Array(40)].map((_,i)=>({id:'w'+i,kind:'walker',tier:'v1',can:true,moving:true}));
 let sum=0,n=0,lo=1,hi=0;const durs=[];
 for(let t=0;t<1600;t++){for(const e of s.step(.5,ag))if(e.start)durs.push(e.start.dur);if(t>40){const on=ag.filter(a=>s.session(a.id)).length/ag.length;sum+=on;n++;lo=Math.min(lo,on);hi=Math.max(hi,on);}}
 assert.ok(lo>=.1&&hi<=.2,'share stays in the band: '+lo+'..'+hi);assert.ok(sum/n>.12&&sum/n<.19,'average '+sum/n);
 assert.ok(Math.min(...durs)>=5&&Math.max(...durs)<=15,'durations 5-15 s');
 // walkers on the move only read; nobody takes a photo mid-stride
 for(const a of ag)assert.ok(!s.session(a.id)||s.session(a.id).pose==='scroll');
});

test('scheduler: stops when they start moving, cannot, or their partner is gone; pairs take pair selfies; V3 never selfies',()=>{
 const s=D.createScheduler({rnd:seeded(9)}),ag=[...Array(20)].map((_,i)=>({id:'s'+i,kind:'stander',tier:i===5?'v3':'v1',can:true,moving:false,pair:'s'+(i^1)}));
 const poses={};for(let t=0;t<2000;t++)for(const e of s.step(.5,ag))if(e.start){poses[e.start.pose]=(poses[e.start.pose]||0)+1;if(e.id==='s5')assert.ok(['scroll','photo'].includes(e.start.pose),'v3: '+e.start.pose);}
 assert.ok(poses['pair-selfie']>0&&poses.selfie>0&&poses.photo>0&&poses.scroll>0,JSON.stringify(poses));
 // a pair selfie ends for both when one walks off
 let pair=null;for(let t=0;t<4000&&!pair;t++){s.step(.25,ag);pair=ag.find(a=>s.session(a.id)?.pose==='pair-selfie'&&s.session(a.id).role==='holder');}
 assert.ok(pair);const mate=ag.find(a=>a.id===s.session(pair.id).partner);assert.equal(s.session(mate.id).role,'friend');
 mate.can=false;s.step(.1,ag);s.step(.1,ag);assert.equal(s.session(mate.id),null);assert.equal(s.session(pair.id),null);
 // a still pose ends when the person walks on
 const one=D.createScheduler({rnd:()=>.01}),p={id:'x',kind:'shop',tier:'v1',can:true,moving:false};let got=null;for(let i=0;i<200&&!got;i++){one.step(1,[p]);got=one.session('x');}
 assert.ok(got);p.moving=true;one.step(.1,[p]);assert.equal(one.session('x'),null);
});

test('food spots photograph their food; NULL takes selfies; the story kind stays rare',()=>{
 const s=D.createScheduler({rnd:seeded(5)}),f=[...Array(10)].map((_,i)=>({id:'f'+i,kind:'food',tier:'v1',can:true,moving:false})),c=[...Array(10)].map((_,i)=>({id:'c'+i,kind:'dancer',tier:'v1',can:true,moving:false,pair:'c'+(i^1)}));
 const seen={};for(let t=0;t<3000;t++)for(const e of s.step(.5,[...f,...c]))if(e.start)seen[e.start.pose]=(seen[e.start.pose]||0)+1;
 assert.ok(seen['food-photo']>0&&seen.selfie>0&&seen['pair-selfie']>0&&seen.film>0,JSON.stringify(seen));
 const st=D.createScheduler({rnd:seeded(2)}),admin={id:'admin',kind:'story',tier:'v1',can:true,moving:false};let on=0;for(let t=0;t<2400;t++){st.step(.5,[admin]);if(st.session('admin'))on++;}
 assert.ok(on/2400<.2,'Admin checks now and then: '+on/2400);
});

test('caps: Low 4, Medium 10, High 16; the nearest visible are drawn, already shown ones keep their place',()=>{
 assert.deepEqual([D.capFor('low'),D.capFor('medium'),D.capFor('high'),D.capFor('ultra')],[4,10,16,16]);
 const list=[...Array(30)].map((_,i)=>({id:'p'+i,d:i,visible:i%3!==0,shown:false}));
 for(const q of ['low','medium','high']){const set=D.choosePosed(list,D.capFor(q));assert.equal(set.size,D.capFor(q));for(const id of set)assert.ok(list.find(a=>a.id===id).visible);}
 const lowSet=D.choosePosed(list,4);assert.deepEqual([...lowSet].sort(),['p1','p2','p4','p5']);
 list.find(a=>a.id==='p7').shown=true;assert.ok(D.choosePosed(list,4).has('p7')===false&&D.choosePosed(list.map(a=>a.id==='p5'?{...a,shown:true}:a),4).has('p5'));
});

test('spectacle: within the radius only; monks and V3 // Shadow never film; it ends after the event plus a few seconds',()=>{
 const R=D.createReactor({rnd:seeded(4)});
 const ag=[...Array(60)].map((_,i)=>({id:'a'+i,x:Math.cos(i)*i*.4,z:Math.sin(i)*i*.4,tier:i%10===0?'v3':'v1',monk:i%7===0}));
 const e=R.spectacle({x:0,z:0,radius:10,kind:'argument',duration:8},ag,100);
 for(const a of ag){const d=Math.hypot(a.x,a.z),r=e.who.get(a.id);if(d>10){assert.equal(r,undefined);continue;}assert.ok(r);
  if(a.monk)assert.equal(r.mode,'ignore');else if(a.tier==='v3')assert.ok(['ignore','leave'].includes(r.mode));else assert.ok(['film','watch'].includes(r.mode));}
 const filming=[...e.who.values()].filter(r=>r.mode==='film').length,able=ag.filter(a=>Math.hypot(a.x,a.z)<=10&&!a.monk&&a.tier!=='v3').length;assert.ok(filming/able>.55,'most film: '+filming+'/'+able);
 assert.ok([...e.who.values()].some(r=>r.step===1)&&[...e.who.values()].some(r=>r.step===-1),'some step closer, some back');
 const film=[...e.who.values()].find(r=>r.mode==='film');assert.equal(R.reactionOf(film.id,100+film.from-100-.01),null,'not before their delay');assert.ok(R.reactionOf(film.id,103));
 for(const r of e.who.values()){assert.ok(r.until>=108+2&&r.until<=108+5);}
 assert.equal(R.reactionOf(film.id,114),null,'over after the event and the linger');R.step(114);assert.equal(R.active.length,0);
 const e2=R.spectacle({x:0,z:0,radius:10,duration:30},ag,200);R.end(e2.id,201);assert.equal(R.reactionOf(film.id,205),null,'ended early');
});

test('who takes part: the places\' own ambient people, never staff at work, drunks, companions or the argument itself',()=>{
 const k=D.kindOf;assert.equal(k({nightlife:'night-3'}),'walker');assert.equal(k({nightlife:'stand-2'}),'stander');assert.equal(k({club:'dancer-1'}),'dancer');assert.equal(k({club:'bar-guest-a'}),'bar');
 assert.equal(k({club:'dj'}),null);assert.equal(k({club:'bartender'}),null);assert.equal(k({alley:'alley-drunk'}),null);assert.equal(k({alley:'alley-sitter'}),'seated');
 assert.equal(k({character:'crew-bar1',ambient:true}),'food');assert.equal(k({character:'crew-vr-watch',ambient:true}),null);assert.equal(k({character:'admin'}),'story');
 assert.equal(k({character:'admin',companion:true}),null);assert.equal(k({nightlife:'night-1',argument:true}),null);assert.equal(k({character:'crew-hall-talk1',ambient:true,life:true}),null);
 assert.ok(D.excluded({monk:true,tier:'v1'})&&D.excluded({tier:'v3'})&&!D.excluded({tier:'v2'}));
});

test('reading while walking: rare bumps, deterministic from the walker and the look; near misses notice late and sidestep fast',()=>{
 const N=require(path.join(__dirname,'..','void-runner','ncz-nightlife.js')),DC=N.config.distracted;
 let bumps=0,n=0;for(let i=0;i<400;i++)for(let k=1;k<=10;k++){n++;const d=N.distraction('night-'+i,k);if(d){bumps++;assert.equal(d.kind,'bump');assert.ok(d.at>=2&&d.at<=5,'the wall bump comes 2-5 s into the look');}}
 assert.ok(bumps/n>DC.bump*.75&&bumps/n<DC.bump*1.25,'about '+DC.bump+' of looks end in a bump: '+bumps/n);
 assert.ok(DC.bump<=.12,'kept rare (charming, not slapstick)');
 assert.deepEqual(N.distraction('night-3',2),N.distraction('night-3',2),'the same walker and look: the same outcome');
 assert.ok(DC.notice<N.config.spacing+.6,'readers notice people later than everyone else (near misses)');assert.ok(DC.sidestep>1.5,'and sidestep faster');
});

test('Admin and Dax carry a V3 // Shadow; Iris (an android, all internal) never shows a device',()=>{
 const D=require('../void-runner/npc-device.js'),P=require('../void-runner/district-people.js');
 const ppl=(P.npcs?P.npcs():P.NPCS||P.people||[]);const by=id=>ppl.find(n=>n.id===id);
 assert.equal(by('admin')?.device,'v3');assert.equal(by('dax')?.device,'v3');
 assert.equal(D.kindOf({character:'admin'}),'story');assert.equal(D.kindOf({character:'iris'}),null);
});
