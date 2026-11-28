const assert = require('node:assert/strict');
const test = require('node:test');
const Campaign = require('../void-runner/campaign.js');
const Comms = require('../void-runner/comms.js');
const Traffic = require('../void-runner/traffic.js');
const Nav = require('../void-runner/nav-coords.js');
const Freight = Campaign.districtFreight;

function registeredPilot() {
  const state = Campaign.startDistrictCampaign(Campaign.fresh());
  Campaign.awardStarterShip(state);
  return state;
}

test('District freight is optional and the opening flight to Rook remains safe', () => {
  const state = Campaign.startDistrictCampaign(Campaign.fresh());
  assert.equal(Freight.accept(state, 'legal'), false);
  Campaign.awardStarterShip(state);
  state.universe.missions['first-departure'] = {acquired:true, completed:false, objectives:{}};
  assert.equal(Campaign.chooseDestination(state, 'meridian'), true);
  assert.equal(Campaign.flight(state).enemies, 0);
  assert.equal(Freight.accept(state, 'legal'), true);
  assert.deepEqual(Nav.markers(state,[{destination:'meridian'}]),['sol-belt']);
  assert.equal(Campaign.chooseDestination(state, 'meridian'), false);
  assert.equal(Freight.cancel(state), true);
  assert.equal(Campaign.chooseDestination(state, 'meridian'), true);
});

test('legal freight pays once after clearance, including after a save restore', () => {
  const state = registeredPilot();
  assert.equal(Freight.accept(state, 'legal'), true);
  const restored = Campaign.restore(JSON.stringify(state));
  assert.equal(Campaign.flight(restored).destination, 'sol-belt');
  assert.equal(Campaign.complete(restored), null);
  assert.equal(Freight.decide(restored, 'escort'), true);
  const before = restored.credits;
  assert.equal(Campaign.complete(restored).reward, 110);
  assert.equal(restored.credits, before + 110);
  assert.equal(Campaign.complete(restored), null);
});

test('inspection impounds illicit freight and evasion raises pursuit pressure', () => {
  const inspected = registeredPilot();
  Freight.accept(inspected, 'illicit');
  Freight.decide(inspected, 'escort');
  const before = inspected.credits;
  assert.match(Campaign.complete(inspected).freightResult, /impounded/);
  assert.equal(inspected.credits, before - 60);
  assert.equal(inspected.story.flags.districtWarrant, 2);

  const runner = registeredPilot();
  Freight.accept(runner, 'illicit');
  assert.equal(Freight.decide(runner, 'run'), true);
  assert.equal(Freight.decide(runner, 'run'), false);
  assert.equal(runner.story.flags.districtWarrant, 1);
  assert.equal(Campaign.complete(runner).reward, 230);
});

test('relay outage interrupts lane uploads, changes NPC outcomes and can be repaired', () => {
  const state = registeredPilot();
  Freight.accept(state, 'illicit');
  const route = {origin:'earth', destination:'sol-belt', phase:'align'};
  assert.equal(Freight.relay(state, 'destroy'), true);
  assert.equal(Comms.canUpload(Comms.status(state, {route})), false);
  assert.equal(Comms.canUpload(Comms.status(state, {route:{...route, destination:'mars'}})), true);
  assert.deepEqual(Freight.traffic(12, true).map(x => x.earned), [110, 230]);
  assert.equal(Freight.decide(state, 'bypass'), true);
  assert.equal(Freight.relay(state, 'repair'), true);
  assert.equal(Comms.canUpload(Comms.status(state, {route})), true);
  assert.deepEqual(Freight.traffic(12, false).map(x => x.earned), [110, 0]);
  const traffic = Traffic.create(() => 0, true);
  Traffic.districtCouriers(traffic, {f:{x:0,y:0,z:1},r:{x:1,y:0,z:0}});
  assert.deepEqual(Traffic.visible(traffic).map(x => x.signalId), ['ship:sol-cargo-1', 'ship:sol-cargo-2']);
});
