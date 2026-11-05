const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),S=require('../void-runner/story.js'),A=require('../void-runner/district-area.js'),N=require('../void-runner/neochinatown.js'),M=require('../void-runner/mission-log.js');

test('returning campaign wakes in pod 01 without losing inventory or historical missions',()=>{
 const old=C.fresh();old.location='meridian';old.credits=777;old.quest='open';old.universe.missions['legal-run']={acquired:true,completed:true,objectives:{deliver:true}};old.story.events.push('old-event');
 const before=JSON.stringify(old),restored=C.restore(before),originalLocation=restored.location,entry=C.socialEntry(restored);
 assert.equal(JSON.stringify(old),before,'the saved source is untouched');
 assert.equal(entry.credits,777);assert.equal(entry.quest,'open');assert.deepEqual(entry.universe.missions['legal-run'],old.universe.missions['legal-run']);
 assert.deepEqual(entry.story.events,old.story.events);assert.equal(entry.story.flags.previousLocation,originalLocation);assert.equal(entry.location,'earth');
 assert.equal(M.closed(entry),true);assert.equal(A.keyFor(entry),'darknet-district');
 const spawn=A.resume(entry,N),[x,z]=N.toWorld(spawn.spawn[0],spawn.spawn[2]);assert(Math.abs(x+15.4)<.01&&Math.abs(z-57)<.01);
 assert.deepEqual(S.emit(entry,'talk','mara'),[],'old story triggers stay inactive');
 assert.equal(C.accept(entry,'legal-run'),false);
 assert.equal(C.acceptRook(entry),false);
 assert.equal(C.acceptFaction(entry,'communion'),false);
 assert.equal(C.complete(entry),null);
 assert.deepEqual(entry.universe.missions['legal-run'],old.universe.missions['legal-run']);
});
