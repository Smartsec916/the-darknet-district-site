/* The empty landing pad (new campaigns have no ship): the parked-ship collision box must not stay behind as an invisible wall,
   but it must still block for a player who really has that ship. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),C=require('../void-runner/campaign.js'),Sh=require('../void-runner/ships.js');
test('the pad has exactly one parked-ship collision box, tagged so the loader can open it',()=>{
 for(const area of ['all','street']){const hull=N.layout(area).solids.filter(s=>s.shipHull);assert.equal(hull.length,1,area);assert.equal(hull[0].id,'ship');}
 assert.equal(N.layout('interior').solids.filter(s=>s.shipHull).length,0);
});
test('with the box open there is no invisible wall; with it solid a ship owner collides as before',()=>{
 const L=N.layout('street'),hull=L.solids.find(s=>s.shipHull),[x,,z]=hull.position;
 assert.equal(E.blocked(x,z,L),true,'solid by default');hull.open=true;assert.equal(E.blocked(x,z,L),false,'open: walkable');hull.open=false;assert.equal(E.blocked(x,z,L),true);
});
test('the loader opens the box exactly when the player has no ship',()=>{
 const b=fs.readFileSync('void-runner/babylon-integration.js','utf8');assert(b.includes('if (solid.shipHull) solid.open = !VoidShips.hasShip(state);'));
 const shipless=C.startDistrictCampaign(C.fresh()),granted=C.restore(JSON.stringify(shipless));C.grantShip(granted);
 assert.equal(Sh.hasShip(shipless),false);assert.equal(Sh.hasShip(granted),true,'a granted ship collides again');assert.equal(Sh.hasShip(C.fresh()),true);
});
