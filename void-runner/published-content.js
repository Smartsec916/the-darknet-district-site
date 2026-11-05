/* Bounded adapters into the existing registries. No action, reward, save or scene execution. */
(function(root){
 const clone=value=>JSON.parse(JSON.stringify(value));
 const id=v=>typeof v==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(v)&&!['__proto__','prototype','constructor'].includes(v);
 function keys(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error('Unsupported published fields.');}
 function text(value,max=4000){if(typeof value!=='string'||value.length>max||/<\s*\/?\s*[a-zA-Z][^>]*>/.test(value)||value.includes('\0'))throw Error('Invalid published text.');}
 function when(c){keys(c,['flags','missions','location']);if(c.flags){keys(c.flags,Object.keys(c.flags).filter(id));if(Object.values(c.flags).some(v=>typeof v!=='boolean'))throw Error('Invalid flag predicate.');}if(c.missions&&(!Array.isArray(c.missions)||c.missions.length>30||!c.missions.every(id)))throw Error('Invalid mission predicate.');if(c.location&&!id(c.location))throw Error('Invalid location predicate.');}
 function effects(e){keys(e,['flags','relationships']);for(const k of Object.keys(e)){keys(e[k],Object.keys(e[k]).filter(id));if(k==='flags'&&Object.keys(e[k]).some(key=>['missionPool','shipAccess'].includes(key)||/^(campaign|vr)/i.test(key)))throw Error('Lifecycle flags are source-owned.');for(const v of Object.values(e[k]))if(k==='flags'?typeof v!=='boolean':!Number.isSafeInteger(v)||Math.abs(v)>100)throw Error('Invalid registered effect.');}}
 function condition(c){keys(c,['type','key','value']);if(!id(c.key)||!['flag','mission-complete','at-location'].includes(c.type)||(c.type==='flag'?typeof c.value!=='boolean':c.value!==true))throw Error('Invalid content condition.');}
 function create({missions,story,companions,sourceRevision}){
  const originals=clone(missions.definitions),scenes=clone(story.dialogue);let pinned=false;
  function apply(envelope){
   if(pinned)throw Error('Content is pinned until the next page load.');
   keys(envelope,['schemaVersion','generation','sourceRevision','digest','content']);const data=envelope.content;
   if(envelope.schemaVersion!==1||envelope.sourceRevision!==sourceRevision||!Number.isSafeInteger(envelope.generation)||envelope.generation<1)throw Error('Published content belongs to another source build.');
   keys(data,['schemaVersion','sourceRevision','missions','dialogue','companions']);if(data.schemaVersion!==1||data.sourceRevision!==sourceRevision)throw Error('Invalid content version.');
   keys(data.missions,Object.keys(originals));keys(data.dialogue,Object.keys(scenes));if(!Array.isArray(data.companions)||data.companions.length>20||Object.keys(data.missions).length+Object.keys(data.dialogue).length+data.companions.length>20)throw Error('Published content exceeds limits.');
   const plannedM={},plannedS={},plannedC=[],slots=new Set();
   for(const [key,d]of Object.entries(data.missions)){
    keys(d,['title','description','objectives','prerequisites','availability','enabled']);text(d.title,200);text(d.description);if(typeof d.enabled!=='boolean'||!Array.isArray(d.objectives)||d.objectives.length!==originals[key].objectives.length)throw Error('Objective identities cannot change.');
    const base=clone(originals[key]);base.title=d.title;base.description=d.description;base.contentEnabled=d.enabled;
    base.objectives=d.objectives.map((o,i)=>{keys(o,['id','label','type','condition']);if(o.id!==base.objectives[i].id||o.type!=='instruction'||o.condition!==null)throw Error('Completion rules remain source-owned.');text(o.label,500);return {...base.objectives[i],label:o.label};});
    if(!Array.isArray(d.prerequisites)||d.prerequisites.length>30||!d.prerequisites.every(id))throw Error('Invalid prerequisites.');base.prerequisites=d.prerequisites.slice();keys(d.availability,['locations','conditions']);if(!Array.isArray(d.availability.locations)||!d.availability.locations.every(id)||d.availability.locations.length>80||!Array.isArray(d.availability.conditions)||d.availability.conditions.length>30)throw Error('Invalid availability.');d.availability.conditions.forEach(condition);base.contentAvailability=clone(d.availability);plannedM[key]=base;
   }
   for(const [key,d]of Object.entries(data.dialogue)){
    keys(d,['heading','start','nodes']);text(d.heading,200);if(!Object.hasOwn(scenes[key].nodes,d.start)||Object.keys(d.nodes).length!==Object.keys(scenes[key].nodes).length)throw Error('Story cursors remain stable.');keys(d.nodes,Object.keys(scenes[key].nodes));const scene=clone(scenes[key]);scene.heading=d.heading;scene.start=d.start;
    for(const [nodeId,n]of Object.entries(d.nodes)){
     keys(n,['id','character','text','next','choices','effects','when','end','label']);const before=scenes[key].nodes[nodeId];if(!before||n.character!==before.character||n.end!==before.end||n.label!==before.label||JSON.stringify(n.effects)!==JSON.stringify(before.effects)||JSON.stringify(n.when)!==JSON.stringify(before.when))throw Error('Native node handlers and identity remain locked.');text(n.text);if(n.next!==undefined&&!Object.hasOwn(d.nodes,n.next))throw Error('Broken transition.');if(before.end&&(n.next!==before.next||n.choices))throw Error('Native terminal handler cannot be redirected.');
     if(n.choices){if(!Array.isArray(n.choices)||n.choices.length>12)throw Error('Too many choices.');for(const c of n.choices){keys(c,['text','next','when','effects']);text(c.text,500);if(!Object.hasOwn(d.nodes,c.next))throw Error('Broken choice.');when(c.when);effects(c.effects);}}
     scene.nodes[nodeId]=clone(n);
    }
    const active=new Set(),done=new Set();function visit(k){if(active.has(k))throw Error('Cyclic dialogue.');if(done.has(k))return;active.add(k);const n=scene.nodes[k];for(const next of [n.next,...(n.choices||[]).map(c=>c.next)].filter(Boolean))visit(next);active.delete(k);done.add(k);}visit(scene.start);if(done.size!==Object.keys(scene.nodes).length)throw Error('Unreachable nodes.');plannedS[key]=scene;
   }
   for(const slot of data.companions){keys(slot,['id','path','text']);if(!id(slot.id)||!Array.isArray(slot.path)||slot.path[0]!=='dialogue'||slot.path.length>6||slot.path.some(p=>typeof p!=='string'||!(/^[a-zA-Z0-9_-]+$/.test(p))||['__proto__','constructor','prototype'].includes(p)))throw Error('Invalid companion path.');text(slot.text);const target=companions.get(slot.id);if(!target)throw Error('Unknown companion.');let owner=target;for(const part of slot.path.slice(0,-1)){if(!Object.hasOwn(owner,part))throw Error('Unknown companion slot.');owner=owner[part];}const last=slot.path.at(-1);if(!owner||!Object.hasOwn(owner,last)||typeof owner[last]!=='string')throw Error('Unknown text slot.');const key=slot.id+':'+slot.path.join('.');if(slots.has(key))throw Error('Duplicate text slot.');slots.add(key);plannedC.push({owner,last,text:slot.text});}
   // Validate everything above before a single source object is modified.
   Object.assign(missions.definitions,plannedM);Object.assign(story.dialogue,plannedS);for(const c of plannedC)c.owner[c.last]=c.text;pinned=true;return {generation:envelope.generation,applied:true};
  }
  return {apply,get pinned(){return pinned;}};
 }
 async function initialize(options={}){
  if(options.enabled!==true)return {status:'disabled',generation:0};
  const revision=options.sourceRevision,key='void-published-content-v1';let storage=options.storage;try{storage??=root.localStorage;}catch{}
  const adapter=create({missions:root.VoidMissions,story:root.VoidStoryContent,companions:root.VoidVRCompanions,sourceRevision:revision});
  async function checked(value){if(JSON.stringify(value).length>524288)throw Error('Content snapshot too large.');const bytes=new TextEncoder().encode(canonical(value.content)),hash=await root.crypto.subtle.digest('SHA-256',bytes),digest=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');if(digest!==value.digest)throw Error('Published digest mismatch.');return adapter.apply(value);}
  try{const response=await (options.fetch||root.fetch)(options.url||((root.location&&['localhost','127.0.0.1'].includes(root.location.hostname)?'':'https://the-darknet-district-site.onrender.com')+'/api/void-runner/content'),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Published service unavailable.');const value=await response.json();if(value.enabled===false){try{storage.removeItem(key);}catch{}return {status:'baseline',generation:0};}const result=await checked(value);try{storage.setItem(key,JSON.stringify(value));}catch{}return {status:'published',...result};}
  catch(error){try{const raw=storage.getItem(key);if(raw){const result=await checked(JSON.parse(raw));return {status:'cached',...result};}}catch{}return {status:'baseline',generation:0};}
 }
 function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
 const api={create,initialize,canonical};if(typeof module!=='undefined')module.exports=api;else root.VoidPublishedContent=api;
})(globalThis);