/* Builds void-runner/assets/audio/voice/manifest.json: every fixed NPC line in the game with a
   stable id, its speaker and the voice cast for that speaker. Lines assembled at runtime (prices,
   destinations) are not listed and use the browser voice fallback.
   Usage: node tools/audio/extract-lines.cjs [--check] */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..','..'),src=path.join(root,'void-runner'),out=path.join(src,'assets','audio','voice');
// Who speaks in game -> voice-file speaker id. The player's own lines are never voiced.
const speakers={mara:'mara',elias:'elias',rook:'rook',nyx:'nyx',iona:'iona',sol:'sol',Admin:'admin',admin:'admin',Iris:'iris',iris:'iris',elara:'elara',marcus:'marcus',Bartender:'bartender','Arcade attendant':'attendant',kess:'kess',mercer:'mercer'};
const Q="'((?:[^'\\\\]|\\\\.)*)'";
const unescape=s=>s.replace(/\\(.)/g,'$1');
const lines=new Map();
function add(who,text,file){
  const speaker=speakers[who];if(!speaker||!text||text.includes('${'))return;
  const key=speaker+'|'+text;if(lines.has(key))return;
  // Stable id: speaker plus a hash of the approved wording. Changing a line gives it a new clip.
  const id=speaker+'-'+crypto.createHash('sha1').update(key).digest('hex').slice(0,10);
  lines.set(key,{id,speaker,text,source:file});
}
for(const file of fs.readdirSync(src).filter(f=>f.endsWith('.js'))){
  const code=fs.readFileSync(path.join(src,file),'utf8');
  // {who:'rook',text:'...'} — only complete literals, never concatenated text.
  for(const m of code.matchAll(new RegExp("who\\s*:\\s*'([A-Za-z ]+)'\\s*,\\s*text\\s*:\\s*"+Q+"\\s*\\}",'g')))add(m[1],unescape(m[2]),file);
  // Story-scene nodes: character: 'mara', text: '...'
  for(const m of code.matchAll(new RegExp("character\\s*:\\s*'([A-Za-z]+)'\\s*,\\s*text\\s*:\\s*"+Q,'g')))add(m[1],unescape(m[2]),file);
  // District one-liners: districtLine('Iris','...')
  for(const m of code.matchAll(new RegExp("districtLine\\('([A-Za-z ]+)'\\s*,\\s*"+Q+"\\)",'g')))add(m[1],unescape(m[2]),file);
  for(const m of code.matchAll(new RegExp("districtLine\\('([A-Za-z ]+)'\\s*,\\s*[^?]+\\?"+Q+":"+Q+"\\)",'g'))){add(m[1],unescape(m[2]),file);add(m[1],unescape(m[3]),file);}
  // Station one-liners: const texts={nyx:'...',iona:'...'}
  for(const block of code.matchAll(/const texts={([^}]*)}/g))for(const m of block[1].matchAll(new RegExp("([a-z]+):"+Q,'g')))add(m[1],unescape(m[2]),file);
  // Homeworld scene helpers: kess('...'), mercer('...')
  if(file==='homeworld-scenes.js')for(const m of code.matchAll(new RegExp("\\b(kess|mercer)\\("+Q+"\\)",'g')))add(m[1],unescape(m[2]),file);
  if(file==='faction-scenes.js'){
    // Scene helpers: admin('...'), iris('...'), elara('...'), marcus('...')
    for(const m of code.matchAll(new RegExp("\\b(admin|iris|elara|marcus)\\("+Q+"\\)",'g')))add(m[1],unescape(m[2]),file);
    // Recipient question answers and farewells, per recipient block.
    for(const [who,start,end] of [['elara','communion:{who:elara',"'natural-order':{who:marcus"],['marcus',"'natural-order':{who:marcus",'farewell:\'Appreciate it.']]){
      const a=code.indexOf(start),b=code.indexOf(end,a+1);if(a<0)continue;const block=code.slice(a,b<0?undefined:b+200);
      for(const m of block.matchAll(new RegExp("\\["+Q+","+Q+","+Q+"\\]",'g')))add(who,unescape(m[3]),file);
      for(const m of block.matchAll(new RegExp("farewell:"+Q,'g')))add(who,unescape(m[1]),file);
    }
  }
}
// Voices come from the permanent registry (tools/audio/npc-voice-registry.json); never cast here.
const Registry=require('./voice-registry.cjs'),reg=Registry.load(),problems=Registry.validate(reg);
if(problems.length){console.error('Voice registry problems:\n - '+problems.join('\n - '));process.exit(1);}
// Relay broadcasts (void-runner/relay-content.json) are recorded once David casts the broadcaster.
const Relay=require(path.join(src,'relay.js')),relayContent=JSON.parse(fs.readFileSync(path.join(src,'relay-content.json'),'utf8'));
const relayProblems=Relay.validate(relayContent);if(relayProblems.length){console.error('Relay content problems:\n - '+relayProblems.join('\n - '));process.exit(1);}
const voiced=Registry.voiced(reg);
// Each line of a report is its own clip. Lines with leaderboard names filled in at play time
// ({name} and the like) can't be recorded ahead, so they stay captions.
for(const s of relayContent.segments){const speaker=Relay.speakerOf(s);if(!voiced[speaker])continue;
  for(const text of Relay.lines(s)){if(/\{\w+\}/.test(text))continue;const key=speaker+'|'+text;
   if(!lines.has(key))lines.set(key,{id:speaker+'-'+crypto.createHash('sha1').update(key).digest('hex').slice(0,10),speaker,text,source:'relay-content.json'});}}
const cast={},missingSpeakers=new Set();
for(const l of lines.values()){const e=voiced[l.speaker];if(!e){missingSpeakers.add(l.speaker);continue;}cast[l.speaker]={voice:e.voice,...(e.profile!=='none'?{effect:e.profile}:{}),status:e.status};}
if(missingSpeakers.size){console.error('Speakers missing from the registry: '+[...missingSpeakers].join(', '));process.exit(1);}
const manifest={version:2,engine:reg.engine.model+' ('+reg.engine.license+')',format:'ogg/opus 24 kHz mono',cast,lines:{}};
for(const l of [...lines.values()].sort((a,b)=>a.id.localeCompare(b.id)))manifest.lines[l.id]={speaker:l.speaker,text:l.text,file:l.id+'.ogg',source:l.source,configHash:Registry.configHash(voiced[l.speaker],reg.engine)};
const rendersFile=path.join(out,'renders.json'),renders=fs.existsSync(rendersFile)?JSON.parse(fs.readFileSync(rendersFile,'utf8')):{};
// What still needs rendering: new or changed lines, or a voice whose settings changed. Protected clips are never re-rendered automatically.
function status(m){
  const report={missingClips:[],staleClips:[],protectedStale:[],notInManifest:[]};
  for(const [id,l] of Object.entries(m.lines)){const r=renders[id];
    if(!fs.existsSync(path.join(out,l.file)))report.missingClips.push(id);
    else if(!r||r.configHash!==l.configHash)(r?.protected?report.protectedStale:report.staleClips).push(id);}
  return report;
}
// --check: fail if the game's dialogue, the registry and the recordings disagree.
if(process.argv.includes('--check')){
  const current=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')),report=status(manifest);
  report.notInManifest=Object.keys(manifest.lines).filter(id=>!current.lines[id]||current.lines[id].configHash!==manifest.lines[id].configHash);
  if(report.missingClips.length||report.staleClips.length||report.notInManifest.length){console.error(JSON.stringify(report,null,1));console.error('Run: node tools/audio/extract-lines.cjs && python tools/audio/generate.py --models <folder>');process.exit(1);}
  console.log('voice manifest up to date:',Object.keys(current.lines).length,'lines'+(report.protectedStale.length?' ('+report.protectedStale.length+' protected clips kept from an older voice setting)':''));process.exit(0);
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,1)+'\n');
const counts={};for(const l of lines.values())counts[l.speaker]=(counts[l.speaker]||0)+1;
const report=status(manifest);
console.log(lines.size+' lines',counts);console.log('to render:',report.missingClips.length,'new,',report.staleClips.length,'changed voice,',report.protectedStale.length,'protected (kept)');
