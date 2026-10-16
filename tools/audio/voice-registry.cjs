/* Shared rules for tools/audio/npc-voice-registry.json. The same fingerprint is computed in
   generate.py and audition/server.py: sha256("model|modelSha256[:16]|voice|speed(3dp)|lang")[:12]. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const file=path.join(__dirname,'npc-voice-registry.json');
const load=()=>JSON.parse(fs.readFileSync(file,'utf8'));
// The settings that decide how a voice sounds. Live processing (profile) is not part of it.
function configHash(entry,engine){
  const key=[engine.model,engine.modelSha256.slice(0,16),entry.voice,Number(entry.speed).toFixed(3),entry.lang].join('|');
  return crypto.createHash('sha256').update(key).digest('hex').slice(0,12);
}
const profiles=['none','android','hologram','radio'];
// A cast voice: an NPC, or a Relay broadcaster once David assigns one.
function checkVoice(id,e,engine,problems){
  if(!e.voice||!/^[ab][fm]_[a-z]+$/.test(e.voice))problems.push(id+': voice must be an English Kokoro voice id');
  if(!(e.speed>=.7&&e.speed<=1.3))problems.push(id+': speed out of range');
  if(!['en-us','en-gb'].includes(e.lang))problems.push(id+': lang must be en-us or en-gb');
  if(!profiles.includes(e.profile))problems.push(id+': unknown processing profile');
  if(!['provisional','approved'].includes(e.status))problems.push(id+': status must be provisional or approved');
  // The lock: an approved voice may only change through an explicit re-approval.
  if(e.status==='approved'&&e.approvedConfigHash!==configHash(e,engine))problems.push(id+': APPROVED VOICE CHANGED without re-approval (use the audition tool to change it)');
}
// Everyone who can be heard: NPCs plus broadcasters that have a voice.
function voiced(reg){return {...reg.npcs,...Object.fromEntries(Object.entries(reg.broadcast||{}).filter(([,e])=>e.status!=='unassigned'))};}
// Returns a list of problems; empty means the registry is safe to generate from.
function validate(reg=load()){
  const problems=[];
  for(const [id,e] of Object.entries(reg.npcs)){if(!/^[a-z][a-z-]*$/.test(id))problems.push(id+': bad id');checkVoice(id,e,reg.engine,problems);}
  for(const [id,e] of Object.entries(reg.broadcast||{})){
    if(!/^[a-z][a-z-]*$/.test(id))problems.push(id+': bad id');
    if(e.status==='unassigned'){if(e.voice)problems.push(id+': an unassigned broadcaster has no voice');}
    else checkVoice(id,e,reg.engine,problems);
  }
  const voices=Object.entries(voiced(reg)).map(([id,e])=>[e.voice,id]);
  for(const [v,id] of voices)if(voices.filter(([w])=>w===v).length>1)problems.push(id+': voice '+v+' is shared with another character');
  for(const [id,r] of Object.entries(reg.reserved||{}))if(r.voice)problems.push(id+': reserved slot must not have a voice yet');
  return problems;
}
module.exports={file,load,configHash,validate,voiced};
