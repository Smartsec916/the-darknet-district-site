/* The archive must keep covering every mission and contract the game defines. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const archive=JSON.parse(fs.readFileSync('docs/void-runner/mission-archive/2026-11-03/missions.json','utf8'));
test('every mission and contract is archived with its source commit',()=>{const Missions=require('../void-runner/mission-log.js'),C=require('../void-runner/campaign.js');assert.match(archive.archivedFromCommit,/^[0-9a-f]{40}$/);for(const id of Object.keys(Missions.definitions))assert(archive.missions[id],id);const ids=new Set(archive.allContracts.map(c=>c.id));for(const c of C.allContracts)assert(ids.has(c.id),c.id);assert(Object.keys(archive.sourceFiles).length>=10);});
