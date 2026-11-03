/* Share-link guest sessions (David, 2026-11-03): every one of the 13 links keeps working and keeps its destination, but a guest
   never holds campaign progress. District, NeoChinatown, VR and station tours have no ship, no pistol and no missions; only the
   flight preview gets a temporary ship. Nothing here may touch a real player's saved campaign. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const S=require('../void-runner/share-registry.js'),C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),Sh=require('../void-runner/ships.js');
const St=require('../void-runner/story.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),Data=require('../void-runner/exploration-data.js');
const read=f=>fs.readFileSync(f,'utf8');

// The 13 published links: [id, type, destination kind, game location, access]. These must never change.
const LINKS=[
 ['neochinatown','location','dock','earth','tour'],['darknet-district','location','dock','earth','tour'],
 ['meridian','location','dock','meridian','tour'],['kepler','location','dock','kepler','tour'],['rusthaven','location','dock','rusthaven','tour'],
 ['foundry','location','dock','foundry','tour'],['tessaly-belt','location','dock','sol-belt','tour'],
 ['station-arrival','scenario','dock','meridian','tour'],['district-night','scenario','dock','earth','tour'],
 ['meridian-departure','scenario','flight','meridian','preview'],
 ['vr-forest','scenario','vr','earth','tour'],['vr-tropical','scenario','vr','earth','tour'],['vr-bedroom','scenario','vr','earth','tour']];

// What guest-mode.js starts from: an open-stage campaign with the pistol, free travel and the old missions (VoidDevTest.build).
function guestBase(location){
 const raw=C.fresh();raw.quest='open';raw.location=location;delete raw.progression;
 const s=C.restore(JSON.stringify(raw));
 s.progression.personal.weapon='ward-pistol';s.progression.opening.pistol=true;s.universe.missionLogUnlocked=true;s.universe.freeTravel=true;s.missileUnlocked=true;
 s.location=location;M.sync(s,C);return s;
}

test('the registry still has exactly the 13 published links, each with its destination',()=>{
 assert.equal(S.entries.length,13);assert.deepEqual(S.entries.map(e=>e.id).sort(),LINKS.map(l=>l[0]).sort());
 for(const [id,type,kind,location,access] of LINKS){const e=S.get(id);assert(e,id);
  assert.equal(e.type,type,id+' type');assert.equal(e.destination.kind,kind,id+' kind');assert.equal(e.destination.location,location,id+' location');assert.equal(e.access,access,id+' access');
  assert.equal(e.version,1);assert.equal(e.availability,'public');assert.equal(e.guest,true);}
 assert.deepEqual(S.entries.filter(e=>e.access==='preview').map(e=>e.id),['meridian-departure'],'only the flight demonstration is a preview');
 assert.deepEqual(S.entries.filter(e=>e.destination.kind==='vr').map(e=>e.destination.experience).sort(),['forest','suite','tropical']);
 assert.equal(S.get('vr-bedroom').destination.picker,true);
});

for(const [id,type,kind,location,access] of LINKS){
 test('link '+id+': existing URL forms still open it',()=>{
  const key=type==='location'?'visit':'scenario';
  for(const q of ['?'+key+'='+id,'?'+key+'='+id+'&v=1','?'+key+'='+id+'&v=1&fbclid=abc']){const r=S.parse(q);assert.equal(r.ok,true,q);assert.equal(r.entry.id,id);assert.equal(r.version,1);}
  assert.equal(S.parse('?'+(type==='location'?'scenario':'visit')+'='+id).reason,'unknown','the other form is still refused');
  assert.equal(S.link(id,'https://thedarknetdistrict.com/void-runner.html'),'https://thedarknetdistrict.com/void-runner.html?'+key+'='+id+'&v=1');
 });
 test('link '+id+': guest permissions',()=>{
  const e=S.get(id),s=S.applyPolicy(guestBase(location),e);
  assert.equal(s.progression.personal.weapon,null,'no pistol');assert.equal(s.progression.opening.pistol,false);
  assert.deepEqual(s.universe.missions,{},'no old missions');assert.equal(M.all(s,C).length,0);assert.equal(s.universe.trackedMission,null);
  assert.equal(M.sync(s,C).length,0,'syncing does not bring missions back');assert.equal(M.acquire(s,'meet-rook'),null);
  assert.equal(s.story.flags.missionPool,'closed');
  if(access==='tour'){assert.equal(Sh.hasShip(s),false,'no ship access');assert.equal(Sh.owns(s,'starter'),false);assert.equal(s.story.flags.shipAccess,'none');assert.equal(C.switchShip(s,'starter'),false);}
  else{assert.equal(Sh.hasShip(s),true,'the preview has a temporary ship');assert.equal(s.story.flags.shipAccess,'granted');assert.equal(Sh.owns(s,'starter'),true);}
 });
 test('link '+id+': save isolation',()=>{
  const real=guestBase(location),before=JSON.stringify(real),guest=S.applyPolicy(guestBase(location),S.get(id));
  assert.notEqual(guest,real);assert.equal(JSON.stringify(real),before,'a real campaign object is untouched');
  assert.equal(real.progression.personal.weapon,'ward-pistol');assert.equal(Sh.hasShip(real),true);
  assert.equal(C.restore(JSON.stringify(real)).story.flags.shipAccess,undefined,'the real save has no guest flags');
 });
}

test('guest sessions never save: save, cloud and account are switched off, and the policy runs on the throwaway state',()=>{
 const g=read('void-runner/guest-mode.js');
 assert(/const realSave=save;save=function\(\)\{if\(guest\.active\)return false;/.test(g),'save is a no-op while a guest');
 assert(g.includes('VoidShare.applyPolicy(s,e)'),'the policy is applied to the session state');
 assert(g.indexOf('VoidShare.applyPolicy(s,e)')>g.indexOf('VoidDevTest.build'),'after the base campaign is built');
 assert(g.includes('nothing you do here is saved'));
 assert(read('tests/share-policy-browser.cjs').includes('real save is byte-identical'),'the browser check for the real save exists');
});

test('boarding prompts are hidden when a state has no ship, everywhere a ship can be boarded',()=>{
 const shipless=C.startDistrictCampaign(C.fresh()),owner=C.fresh(),boards=[];
 for(const [name,L] of Object.entries(Data.locations))for(const i of L.interactions||[])if(i.action==='board')boards.push([name,i]);
 const pad=N.layout().interactions.find(i=>i.action==='board');boards.push(['neochinatown',pad]);
 const real=boards.filter(Boolean);assert(real.length>=4,'found the boarding prompts');
 for(const [name,i] of real){assert(i.when,name+' prompt is conditional');assert.equal(St.matches(shipless,i.when),false,name+' hidden with no ship');assert.equal(St.matches(owner,i.when),true,name+' kept for an existing save');}
 const src=['void-runner/meridian-interior.js','void-runner/station-layouts.js','void-runner/planets.js','void-runner/exploration-data.js'].map(read).join('\n');
 assert.equal((src.match(/action:\s*'board'/g)||[]).length,(src.match(/shipAccess/g)||[]).length,'every board interaction names shipAccess');
});

test('the parked-ship collision box is open for shipless states and solid for existing saves and unlocked ships',()=>{
 const L=N.layout(),hull=L.solids.find(s=>s.id==='ship');assert(hull&&hull.shipHull===true);
 const [x,,z]=hull.position;assert.equal(E.blocked(x,z,L),true,'an existing save still collides with its ship');
 hull.open=true;assert.equal(E.blocked(x,z,L),false,'no ship: no invisible wall');hull.open=false;assert.equal(E.blocked(x,z,L),true);
 const b=read('void-runner/babylon-integration.js');assert(b.includes('if (solid.shipHull) solid.open = !VoidShips.hasShip(state);'));
 const shipless=C.startDistrictCampaign(C.fresh()),granted=C.restore(JSON.stringify(shipless));C.grantShip(granted);
 assert.equal(!Sh.hasShip(shipless),true);assert.equal(!Sh.hasShip(granted),false,'a legitimately unlocked ship collides again');assert.equal(!Sh.hasShip(C.fresh()),false);
 assert.equal(L.solids.filter(s=>s.shipHull).length,1);
});

test('the District layout itself is unchanged',()=>{const L=N.layout();assert.equal(L.solids.length,73);assert.equal(L.interactions.length,14);});
