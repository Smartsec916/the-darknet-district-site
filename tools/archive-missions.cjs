/* Writes a recoverable snapshot of the mission definitions. Read-only for the game: nothing loads this archive at runtime.
   Usage: node tools/archive-missions.cjs <folder>   */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),Missions=require('../void-runner/mission-log.js'),C=require('../void-runner/campaign.js'),Content=require('../void-runner/content.js'),Story=require('../void-runner/story-content.js');
const folder=path.resolve(root,process.argv[2]||'docs/void-runner/mission-archive/2026-11-03');
const sources=['mission-log.js','campaign.js','content.js','story.js','story-content.js','story-scenes.js','scenes.js','faction-scenes.js','homeworld-scenes.js','prologue-integration.js','world-integration.js','opening-data.js','save-manifest.json'].map(f=>'void-runner/'+f);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n')).digest('hex');
const snapshot={archivedFromCommit:execSync('git rev-parse HEAD',{cwd:root}).toString().trim(),missions:Missions.definitions,tutorials:Missions.tutorials,contracts:C.contracts,allContracts:C.allContracts,rookJobs:C.rookJobs,factionDeliveries:C.factionDeliveries,sealedCargo:C.sealedCargo,contentMissions:Content.missions,story:Story,sourceFiles:Object.fromEntries(sources.map(f=>[f,hash(f)]))};
fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'missions.json'),JSON.stringify(snapshot,(key,value)=>typeof value==='function'?'[function]':value,1)+'\n');
console.log('Archived',Object.keys(snapshot.missions).length,'missions and',snapshot.allContracts.length,'contracts.');
