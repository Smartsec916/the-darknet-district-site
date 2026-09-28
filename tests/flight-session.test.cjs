const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {create}=require('../void-runner/flight-session.js');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('flight owner starts preparing with unique runtime identity and cancellation signal',()=>{
 const s=create(),a=s.begin();assert.equal(a.kind,'CAMPAIGN');assert.equal(a.status,'PREPARING');assert.equal(s.active,a);assert.equal(a.signal.aborted,false);
 const b=s.begin();assert.notEqual(a.id,b.id);assert.equal(a.status,'ENDED');assert.equal(a.signal.aborted,true);assert.equal(s.owns(a),false);
});
test('only current preparing owner activates',()=>{const s=create(),a=s.begin(),b=s.begin();assert.equal(s.activate(a),false);assert.equal(s.activate(b),true);assert.equal(s.activate(b),false);assert(s.running());});
test('pause retains identity and external runtime; resume reuses same owner',()=>{const s=create(),a=s.begin(),runtime={hp:42};s.activate(a);s.pause(a);assert.equal(s.active,a);assert.equal(a.status,'PAUSED');assert.equal(runtime.hp,42);assert(s.resume(a));assert.equal(s.active,a);});
test('stale resume cannot resurrect ended or replaced owner',()=>{const s=create(),a=s.begin();s.activate(a);s.pause(a);s.end(a);const b=s.begin();assert.equal(s.resume(a),false);assert.equal(s.active,b);});
test('end invalidates immediately and cleanup is idempotent',async()=>{let releases=0,cancels=0;const s=create({release:()=>releases++,cancel:()=>cancels++}),a=s.begin();const first=s.end(a),second=s.end(a);assert.equal(first,second);assert.equal(s.active,null);assert(a.signal.aborted);await first;assert.equal(releases,1);assert.equal(cancels,1);});
test('replacement waits for old preparation and cleanup before acquiring shared resources',async()=>{
 const gate=deferred(),trace=[];const s=create({release:()=>trace.push('release-A')}),a=s.begin();
 const old=s.exclusive(async()=>{trace.push('prepare-A');await gate.promise;trace.push('settle-A');assert.equal(s.activate(a),false);});
 await Promise.resolve();s.end(a);const b=s.begin();const next=s.exclusive(()=>{trace.push('prepare-B');assert(s.activate(b));});
 await Promise.resolve();assert.deepEqual(trace,['prepare-A']);gate.resolve();await Promise.all([old,next]);assert.deepEqual(trace,['prepare-A','settle-A','release-A','prepare-B']);
 await s.end(a);assert.equal(s.active,b);assert.deepEqual(trace,['prepare-A','settle-A','release-A','prepare-B']);
});
test('failed scene job does not poison later serialized handoff',async()=>{const s=create();await assert.rejects(s.exclusive(()=>{throw Error('failed');}));assert.equal(await s.exclusive(()=>23),23);});
test('termination and replacement clear held input',async()=>{const held=new Set(),s=create({clearInput:()=>held.clear()}),a=s.begin();s.activate(a);held.add('fire');await s.end(a);assert.equal(held.size,0);held.add('stale');s.begin();assert.equal(held.size,0);});

// Execute the complete production adapter against controlled entry points, not copied wrappers.
const adapter=fs.readFileSync(require.resolve('../void-runner/flight-session-integration.js'),'utf8');
function harness(){
 const gate=deferred(),events=[],held=new Set();let c;
 c=vm.createContext({window:{},VoidGraphics:{busy:false},VoidFlightLifecycle:{create},AbortController,Promise,preparationGeneration:0,mode:'dock',held,
 clearInput(){held.clear();},VoidPreparation:{cancel(){events.push('cancel');}},VoidMenu:{returnTo:null},VoidBabylon:{release(){events.push('release');}},
 launch:async()=>{events.push('launch');await gate.promise;if(c.window.VoidFlightSession.active)c.mode='play';},
 dock:()=>events.push('dock'),newJourney:()=>events.push('new'),resumeSavedWorld:()=>events.push('load'),safeRespawn:()=>events.push('restore-resources'),
 hurt:()=>c.mode='over',escortImpact:()=>c.mode='over',fireMissile:()=>events.push('missile'),selectCombatTarget:()=>events.push('target'),activateDrive:()=>events.push('drive'),
 openMissionLog:()=>c.mode='mission-log',closeMissionLog:()=>c.mode='play',missionPanel:null,missionReturn:null,update:()=>events.push('update')});
 vm.runInContext(adapter,c);return {c,s:c.window.VoidFlightSession,gate,events,held};
}
test('production single and duplicate launch share one preparing owner and one launch',async()=>{const {c,s,gate,events}=harness();const a=c.launch(),owner=s.active,b=c.launch();assert.equal(a,b);await new Promise(setImmediate);assert.deepEqual(events,['launch']);assert.equal(owner.status,'PREPARING');gate.resolve();await a;assert.equal(owner.status,'RUNNING');assert.equal(s.active,owner);});
test('production obsolete preparation cannot activate owner',async()=>{const {c,s,gate}=harness();const launch=c.launch(),a=s.active;await Promise.resolve();await s.end(a);gate.resolve();await launch;assert.equal(s.active,null);assert.equal(a.status,'ENDED');});
test('production recovery invalidates owner before resource restoration',async()=>{const {c,s,gate,events}=harness();gate.resolve();await c.launch();const a=s.active;await c.safeRespawn();assert.equal(a.status,'ENDED');assert.equal(s.active,null);assert(events.indexOf('release')<events.indexOf('restore-resources'));assert.equal(events.filter(x=>x==='restore-resources').length,1);});
test('production dock retires flight before station entry',async()=>{const {c,s,gate,events}=harness();gate.resolve();await c.launch();await c.dock();assert.equal(s.active,null);assert(events.indexOf('release')<events.indexOf('dock'));});
test('production damage defeat invalidates owner and retry creates another',async()=>{const {c,s,gate}=harness();gate.resolve();await c.launch();const a=s.active;c.hurt(999);assert.equal(s.active,null);await c.launch();assert.notEqual(s.active.id,a.id);assert(s.running());});
test('production input dispatch accepts only running owner',async()=>{const {c,s,gate,events}=harness();gate.resolve();await c.launch();c.fireMissile();s.pause();c.fireMissile();c.selectCombatTarget('nearest');c.activateDrive();assert.equal(events.filter(x=>x==='missile').length,1);assert(!events.includes('target'));assert(!events.includes('drive'));});
test('production mission log pauses and resumes same owner',async()=>{const {c,s,gate}=harness();gate.resolve();await c.launch();const a=s.active;c.openMissionLog();assert.equal(a.status,'PAUSED');c.closeMissionLog();assert.equal(s.active,a);assert(s.running());});
test('production stale mission-log close cannot restore play',async()=>{const {c,s,gate}=harness();gate.resolve();await c.launch();c.openMissionLog();await s.end();c.mode='dock';c.closeMissionLog();assert.equal(c.mode,'dock');assert.equal(s.active,null);});
test('production replacement clears controls and releases before new Campaign',async()=>{const {c,s,gate,events,held}=harness();gate.resolve();await c.launch();held.add('fire');await c.newJourney();assert.equal(s.active,null);assert.equal(held.size,0);assert(events.indexOf('release')<events.indexOf('new'));});
test('obsolete recovery continuation cannot restore resources over a replacement',async()=>{
 const {c,s,gate,events}=harness();gate.resolve();await c.launch();const cleanup=deferred();c.VoidBabylon.release=()=>cleanup.promise;
 const recovery=c.safeRespawn(),next=c.launch(),b=s.active;cleanup.resolve();await Promise.all([recovery,next]);
 assert.equal(s.active,b);assert(s.running());assert(!events.includes('restore-resources'));
});
test('obsolete new-Campaign continuation cannot clear a replacement flight',async()=>{
 const {c,s,gate,events}=harness();gate.resolve();await c.launch();const cleanup=deferred();let releases=0;c.VoidBabylon.release=()=>{releases++;return cleanup.promise;};
 const replacement=c.newJourney(),next=c.launch(),b=s.active;cleanup.resolve();await Promise.all([replacement,next]);
 assert.equal(s.active,b);assert(s.running());assert(!events.includes('new'));assert.equal(releases,1);
});
