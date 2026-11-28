const test=require('node:test'),assert=require('node:assert/strict');
const Universe=require('../void-runner/universe');
const Warp=require('../void-runner/warp');
const FlightNav=require('../void-runner/flight-nav');
const Campaign=require('../void-runner/campaign');

test('every world location has a fixed point and shares the chart coordinate frame',()=>{
 for(const [id,location] of Object.entries(Universe.locations)){
  const point=Universe.chartPoint(id);
  assert.equal(point.system,location.system);
  assert(Math.hypot(...point.position)<Universe.chart.systems[point.system].radius);
 }
 const out=Universe.direction('earth','sol-belt'),back=Universe.direction('sol-belt','earth');
 for(const axis of ['x','y','z'])assert(Math.abs(out[axis]+back[axis])<1e-12);
 assert.notDeepEqual(Universe.direction('mars','sol-belt'),out);
 assert.notDeepEqual(Universe.direction('earth','satellite:relay-t07'),out);
});

test('interstellar legs have a fixed outbound gate and a destination arrival anchor',()=>{
 const leg=Universe.routeCoordinates('earth','erebus-arrival');
 assert.equal(leg.exit.system,'sol');
 assert.equal(leg.entry.system,'erebus');
 assert.deepEqual(leg.entry,Universe.chartPoint('erebus-arrival'));
 assert(Math.abs(Math.hypot(...leg.exit.position)-Universe.chart.systems.sol.radius)<1e-9);
 assert.deepEqual(leg.exit,Universe.routeCoordinates('sol-belt','meridian').exit);
 assert.notDeepEqual(Universe.direction('earth','erebus-arrival'),Universe.direction('sol-belt','erebus-arrival'));
});

test('map display and restored warp route use the same launch heading',()=>{
 const state=Campaign.startDistrictCampaign(Campaign.fresh());
 Campaign.awardStarterShip(state);
 Campaign.districtFreight.accept(state,'legal');
 const route=Warp.create('earth','sol-belt','district-freight');
 const saved=JSON.parse(JSON.stringify(route));
 saved.vector={x:1,y:0,z:0};
 assert.deepEqual(Warp.restore(saved,'earth','sol-belt','district-freight',false).vector,route.vector);
 assert.deepEqual(route.vector,Warp.direction('earth','sol-belt'));
 const row=FlightNav.entries(state).find(item=>item.id==='sol-belt');
 assert.equal(row.bearing,340);
 assert.equal(row.elevation,18);
});

test('nearby marker cones choose the closer marker unless the pilot selected one in the Map',()=>{
 const markers=[
  {id:'farther',vector:{x:Math.sin(.06),y:0,z:Math.cos(.06)}},
  {id:'closest',vector:{x:0,y:0,z:1}}
 ];
 assert.equal(FlightNav.alignedMarker(markers,markers[1].vector,null),'closest');
 assert.equal(FlightNav.alignedMarker(markers,markers[1].vector,'farther'),'farther');
 assert.equal(FlightNav.alignedMarker(markers,{x:0,y:0,z:-1},'farther'),null);
});
