// A local TEST profile: a District character who has just finished Mission 003 (the real engine, the real campaign; nothing else touched).
const path=require('path'),R=p=>path.join(__dirname,'..',p),fs=require('fs');   // usage: node tests/awakening-make-save003.cjs > SHOTS/save-after-003.json (a LOCAL test profile, never a real save)
const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),DP=require(R('void-runner/district-people.js'));
B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);const ev=x=>MC.treeEvent(s,e,x,M,C);
const s=C.startDistrictCampaign(C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;
ev({type:'pod-exit',at:Date.now()});ev({type:'talk',npcs:['admin']});ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m002-eyes-on-the-street'});ev({type:'place',places:['null']});
ev({type:'photo',subjects:['juno-vex','halden-reyes']});ev({type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:['m002-eyes-on-the-street/photograph'],place:'null',at:1}});
ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m003-corporate-connections'});ev({type:'place',places:['milked']});ev({type:'talk',npcs:['milked-eva']});ev({type:'talk',npcs:['milked-fish']});
if(!s.universe.missions['m003-corporate-connections'].completed)throw Error('003 not done');s.story.flags.podWakePending=true;
process.stdout.write(JSON.stringify({...s,savedAt:Date.now()}));
