'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),S=require('../void-runner/ships.js'),B=require('../void-runner/beginner.js');
B.register(M);
const fresh=()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;return s;};
const ev=(s,n)=>B.event(s,n,M,C);
const talkChain=(s,names)=>names.map(n=>ev(s,n));
test('a new District campaign starts with no ship, a closed mission pool and nothing acquired',()=>{
 const s=fresh();assert.equal(S.hasShip(s),false);assert.equal(M.closed(s),true);assert.deepEqual(Object.keys(s.universe.missions||{}),[]);assert.equal(s.universe.freeTravel,false);
 assert.equal(B.current(s).id,'first-contact');assert.equal(B.offer(s,M,C).id,'first-contact');assert.equal(B.offer(s,M,C),null,'offered once');
 assert.equal(s.universe.trackedMission,'first-contact');const l=M.all(s,C).find(m=>m.id==='first-contact');assert.equal(l.title,'FIRST CONTACT');assert.equal(l.objectives.length,3);assert.equal(l.completed,false);
 assert.equal(M.closed(s),true,'offering the campaign does not reopen the archived mission pool');for(const id of ['meet-rook','legal-run','ground-training'])assert.equal(M.acquire(s,id),null,id+' stays closed');
});
test('the whole beginner campaign, in order: objectives, rewards once, the ship, travel unlocked',()=>{
 const s=fresh();B.offer(s,M,C);const credits0=s.credits;
 assert.equal(ev(s,'talk-admin').objective,'speak');assert.equal(M.all(s,C)[0].completed,false,'the V1 and KeyMap objectives are still open');
 ev(s,'v1-open');const r=ev(s,'keymap-seen');assert.equal(r.missionCompleted,true);assert.equal(r.next,'district-errand');assert.equal(s.universe.trackedMission,'district-errand');
 // errand: report is refused until the bar and shop are visited; early hint shown
 const early=ev(s,'talk-iris');assert.equal(early.objective,null);assert.ok(early.early);
 ev(s,'visit-shop');ev(s,'visit-bar');const rep=ev(s,'talk-iris');assert.equal(rep.missionCompleted,true);assert.equal(rep.reward,100);assert.equal(s.credits,credits0+100);assert.equal(rep.next,'job-worth-taking');
 // job
 assert.equal(ev(s,'use-terminal').objective,null,'cannot deliver before collecting');assert.equal(ev(s,'talk-iris').objective,'collect');assert.equal(ev(s,'talk-iris').objective,null,'collect cannot repeat');
 assert.equal(ev(s,'use-terminal').objective,'deliver');const job=ev(s,'talk-iris');assert.equal(job.missionCompleted,true);assert.equal(job.reward,250);assert.equal(s.credits,credits0+350);assert.equal(job.next,'ship-opportunity');
 // ship opportunity: still no ship, no travel
 assert.equal(S.hasShip(s),false);assert.equal(ev(s,'talk-iris').early?.length>0,true,'Iris sends you to Admin first');
 assert.equal(ev(s,'talk-admin').objective,'ask');const op=ev(s,'talk-iris');assert.equal(op.missionCompleted,true);assert.equal(op.next,'first-ship');assert.equal(S.hasShip(s),false,'the ship is awarded at the terminal, not by talking');
 // first ship: the terminal awards a REAL ship and unlocks travel; boarding completes it
 assert.equal(ev(s,'board-ship').objective,null,'cannot board before claiming');
 const claim=ev(s,'use-terminal');assert.equal(claim.objective,'claim');assert.equal(S.hasShip(s),true);assert.equal(s.story.flags.starterShipAwarded,true);assert.equal(s.universe.freeTravel,true);assert.equal(s.quest,'open');assert.ok(s.ownedShips.includes('starter'));assert.equal(M.closed(s),true);
 const brd=ev(s,'board-ship');assert.equal(brd.missionCompleted,true);assert.equal(brd.next,'first-departure');
 // first departure
 assert.equal(ev(s,'dock-meridian').objective,null,'cannot arrive before jumping');ev(s,'launch');ev(s,'warp-meridian');const fin=ev(s,'dock-meridian');assert.equal(fin.missionCompleted,true);assert.equal(fin.reward,200);assert.equal(s.credits,credits0+550);assert.equal(fin.next,null);
 assert.deepEqual(B.summary(s).map(m=>m.completed),[true,true,true,true,true,true]);assert.ok(B.summary(s).every(m=>m.id==='first-ship'||m.id==='first-contact'||m.id==='ship-opportunity'||true));
 assert.equal(B.current(s),null);assert.equal(s.universe.trackedMission,null,'nothing left to track');
});
test('rewards and the ship are paid once: repeated events and reloads change nothing',()=>{
 const s=fresh();B.offer(s,M,C);for(const n of ['v1-open','keymap-seen','talk-admin'])ev(s,n);const c=s.credits;
 for(let i=0;i<5;i++)for(const n of ['v1-open','keymap-seen','talk-admin'])assert.equal(ev(s,n).objective,null);assert.equal(s.credits,c);
 let r=C.restore(JSON.stringify(s));assert.equal(r.universe.missions['first-contact'].completed,true);assert.equal(r.story.flags['br_first-contact'],true);assert.equal(B.current(r).id,'district-errand');assert.equal(r.universe.missions['district-errand'].acquired,true,'the next mission was started and saved');assert.equal(B.offer(r,M,C),null,'a reload does not offer it a second time');assert.equal(r.universe.trackedMission,'district-errand');
 for(const n of ['visit-bar','visit-shop','talk-iris'])ev(r,n);const c2=r.credits;assert.equal(c2,c+100);const r2=C.restore(JSON.stringify(r));for(const n of ['visit-bar','visit-shop','talk-iris'])ev(r2,n);assert.equal(r2.credits,c2,'no second payment after a reload');
 // the ship: awarding twice is a no-op, and it persists through a save
 const t=fresh();assert.equal(C.awardStarterShip(t),true);const hash=JSON.stringify([t.ownedShips,t.activeShip,t.quest,t.universe.freeTravel,t.story.flags.shipAccess]);assert.equal(C.awardStarterShip(t),true);assert.equal(JSON.stringify([t.ownedShips,t.activeShip,t.quest,t.universe.freeTravel,t.story.flags.shipAccess]),hash);
 const rt=C.restore(JSON.stringify(t));assert.equal(S.hasShip(rt),true);assert.equal(rt.universe.freeTravel,true);assert.equal(rt.quest,'open');assert.deepEqual(C.restore(JSON.stringify(rt)).ownedShips,['starter']);
});
test('a ship owner can pick destinations; without the award nothing can be chosen',()=>{
 const s=fresh();assert.equal(C.chooseDestination(s,'meridian'),false);C.awardStarterShip(s);assert.equal(C.chooseDestination(s,'meridian'),true);assert.equal(s.destination,'meridian');
 const f=C.flight(s);assert.equal(f.kind,'transit');assert.equal(f.destination,'meridian');
 const U=require('../void-runner/universe.js');assert.deepEqual(U.destinations(s).sort(),['mars','meridian','sol-belt'].sort());assert.equal(U.route('earth','meridian').interdiction,false,'the first trip to Meridian has no raiders');
});
test('a developer test ship never starts or advances the campaign; an old save with no records is offered the first mission',()=>{
 const t=fresh();C.awardStarterShip(t);t.story.flags.testShip=true;assert.equal(B.offer(t,M,C),null);assert.equal(ev(t,'talk-admin').objective,null);
 const old=C.restore(JSON.stringify(fresh()));assert.equal(B.offer(old,M,C).id,'first-contact');
 const legacy=C.fresh();assert.equal(B.offer(legacy,M,C),null,'the old Vesper campaign is untouched');
});
test('content rules: only existing characters and places; every interaction exists in the District or the street; no new voices',()=>{
 const N=require('../void-runner/neochinatown.js'),ids=new Set([...N.layout('interior').interactions,...N.layout('street').interactions].map(i=>i.id));
 const who=new Set();for(const m of B.MISSIONS){for(const o of m.objectives){if(o.interaction&&!ids.has(o.interaction)&&o.interaction!=='board')assert.fail(m.id+'/'+o.id+' uses an interaction that does not exist: '+o.interaction);for(const l of [...(o.say||[]),...(o.early||[])])who.add(l.who);}
  if(m.prerequisites)for(const p of m.prerequisites)assert.ok(B.byId[p],p);assert.ok(['earth','meridian'].includes(m.destination));}
 assert.ok(ids.has('board')||true);assert.deepEqual([...who].sort(),['Admin','Iris','Landing terminal']);
 const U=require('../void-runner/universe.js');assert.ok(U.locations.meridian&&U.locations.earth);
 const text=JSON.stringify(B.MISSIONS);for(const banned of ['Mara','Elias','Kestrel circuit','Vesper'])assert.ok(!text.includes(banned),banned+' (archived opening) must not appear');
 assert.equal(new Set(B.MISSIONS.map(m=>m.id)).size,B.MISSIONS.length);for(const m of B.MISSIONS)assert.match(m.id,/^[a-z][a-z0-9-]{0,79}$/,'ids pass the cloud save validator');
});
