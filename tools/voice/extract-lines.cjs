/* Builds void-runner/assets/audio/voice/manifest.json: every fixed NPC line in the game with a
   stable id, its speaker and the voice cast for that speaker. Lines assembled at runtime (prices,
   destinations) are not listed and use the browser voice fallback.
   Usage: node tools/voice/extract-lines.cjs */
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
// Voice casting (Kokoro v1.0 voices). `speed` < 1 is slower; `effect` is applied live in the game.
const cast={
  mara:{voice:'af_nicole',speed:.94,note:'Mature, weary, practical mechanic'},
  elias:{voice:'bm_george',speed:.92,effect:'hologram',note:'Older, warm, reassuring; heard as a recording'},
  rook:{voice:'am_fenrir',speed:1,note:'Gravelly, streetwise, business-like'},
  admin:{voice:'am_michael',speed:.97,note:'Relaxed, confident, dry'},
  iris:{voice:'bf_emma',speed:1,effect:'android',note:'Smooth, articulate, faintly synthetic'},
  elara:{voice:'bf_isabella',speed:.98,note:'Educated, composed, thoughtful'},
  marcus:{voice:'am_eric',speed:1,note:'Rough, practical, skeptical'},
  nyx:{voice:'af_river',speed:1,note:'Bartender at the Dead Channel'},
  iona:{voice:'af_kore',speed:1,note:'Rusthaven engineer'},
  sol:{voice:'bm_lewis',speed:.97,note:'Kepler clinic doctor'},
  bartender:{voice:'am_liam',speed:1,note:'District bartender'},
  attendant:{voice:'am_puck',speed:1.05,note:'District arcade attendant'},
  kess:{voice:'bm_daniel',speed:.95,note:'Mature, educated, calm, slightly weary'},
  mercer:{voice:'am_onyx',speed:1,note:'Mature, slightly rough, conversational'}
};
const manifest={version:1,engine:'kokoro-82m-v1.0 (Apache-2.0)',format:'ogg/opus 24 kHz mono',cast,lines:{}};
for(const l of [...lines.values()].sort((a,b)=>a.id.localeCompare(b.id)))manifest.lines[l.id]={speaker:l.speaker,text:l.text,file:l.id+'.ogg',source:l.source};
// --check: fail if the game's dialogue no longer matches the manifest or a clip is missing.
if(process.argv.includes('--check')){
  const current=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
  const stale=Object.keys(manifest.lines).filter(id=>!current.lines[id]),missing=Object.values(current.lines).filter(l=>!fs.existsSync(path.join(out,l.file))).map(l=>l.file);
  if(stale.length||missing.length){console.error(JSON.stringify({notInManifest:stale,missingClips:missing}));process.exit(1);}
  console.log('voice manifest up to date:',Object.keys(current.lines).length,'lines');process.exit(0);
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,1)+'\n');
const counts={};for(const l of lines.values())counts[l.speaker]=(counts[l.speaker]||0)+1;
console.log(lines.size+' lines',counts);
