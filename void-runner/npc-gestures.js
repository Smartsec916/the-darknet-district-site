/* ANIMATIONS IN MISSION LINES AND STEPS (the owner, 19 Nov 2026: "i also can't add animations anywhere between the steps"). Pure rules (browser and Node tests; the admin
   inventory hands the same lists to the server, void_runner_live_content.py) and, in the browser, the small runtime that plays a clip on an NPC's figure.
   - A line may carry `anim` (a clip id): "While saying this, <NPC> does: shrug". The clip plays on the speaker as the line shows, then she goes back to what she was doing.
   - A step of kind 'anim' {npc, clip, hold}: "<NPC> plays <clip> (and the mission waits `hold` seconds, 0 to 30)". It runs when it becomes the current step and no
     conversation is open; the step is done after `hold` seconds (live-content.js animTick).
   WHICH clips: only clips that NPC can really play: the clips of her own model (crowd.js clips[look]), compatible animation-library clips (npc-paths.js libraryOffer, ok),
   and clips added for her in Developer Tools > NPCs > Add animation (her plan's `anims`, npc-paths.js animAllowed). Never a walking / running / sit-down / seated clip (the
   game moves and seats people itself) and, for Reverie and Lace, never a banned clip (VoidStreetPair.BANNED: casual street clips only; npc-paths.js rules: nothing from
   adult-only models, no smoking or drinking). The street cat plays no clips (its pose is made by code). An NPC drawn by its own scene code with no clip list has none. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const NPX=()=>node?require('./npc-paths.js'):root.VoidNPCPaths;
 const CROWD=()=>node?require('./crowd.js'):root.VoidCrowd;
 const PEOPLE=()=>{try{return node?require('./district-people.js'):root.VoidDistrictPeople;}catch{return null;}};
 const SP=()=>{try{return node?require('./ncz-street-pair.js'):root.VoidStreetPair;}catch{return null;}};
 // Plain names for the clips the game's models carry (anything else shows its own id).
 const NAMES={idle:'Stand still (idle)','idle-shift':'Shift her weight','idle-stretch':'Stretch','idle-m2':'Stand (second idle)','idle-f2':'Stand (second idle)',look:'Look about',watch:'Watch something',talk:'Talk with the hands',gesture:'Explaining gesture',
  shrug:'Shrug',laugh:'Laugh',wave:'Wave','head-tilt':'Tilt the head','glance-back':'Glance back',wipe:'Wipe the counter',smoke:'Smoke',drink:'Drink',interact:'Reach for something',pickup:'Pick something up',work:'Work with the hands',menu:'Use a menu','menu-tap':'Tap a menu',
  'dance-groove':'Dance a little (groove)','dance-bop':'Dance a little (happy bop)',dance:'Dance','slow-dance':'Slow dance','dance-samba':'Samba','blow-kiss':'Blow a kiss',coy:'Coy',hips:'Hands on hips'};
 // Clips that are one movement (played once, then she goes back); the others are loops played for the time set.
 const ONCE=/^(shrug|gesture|laugh|wave|head-tilt|glance-back|idle-stretch|look|interact|pickup|blow-kiss|wipe|nod)$/;
 // Never offered: the game walks, runs and seats people itself.
 const NO=/^(walk|run|jog|walk-f|drunk-walk|sit-enter|sit-exit|recline)$|^sit/;
 const LIMIT={hold:[0,30],line:{min:2,max:8},clip:80};
 const CLIP=/^[a-z0-9][a-z0-9-]{0,40}(\/[a-z0-9][a-z0-9-]{0,40})?$/;
 const bare=c=>String(c||'').split('/').pop();
 const nameOf=c=>{const b=bare(c),n=NAMES[b]||b.replace(/^ac-/,'').replace(/-/g,' ');return /\//.test(c)?n+' (from '+String(c).split('/')[0].replace(/^npc-/,'')+')':n;};
 /* The model (crowd.js look) an NPC is drawn with in the game, or null. Only a model of her / his own: a shared crowd figure (Milked's Eva wears a street look) could be
    anyone on the street, so it is not used. */
 const SHARED={bartender:'nyx-district'};
 function lookOf(id){const X=NPX(),M=X&&X.MOVABLE&&X.MOVABLE[id];if(M)return M.cat?null:M.asset;const P=PEOPLE(),p=P&&P.npc?P.npc(SHARED[id]||id):null;const own=p&&(p.model||p.own);
  const C=CROWD();return own&&C&&C.clips&&C.clips[own]?own:null;}
 /* What NPC id can do while speaking or in an animation step: {ok, why, look, clips:[{id, name, source:'own'|'library'|'added', once}]}. plan: her NPCs-tab plan (content.npcs[id]). */
 function clipsFor(id,{plan}={}){const X=NPX(),M=X&&X.MOVABLE&&X.MOVABLE[id],C=CROWD();
  if(!id||id==='You')return {ok:false,why:'The player character has no animations to choose here.',look:null,clips:[]};
  if(M&&M.cat)return {ok:false,why:'The street cat is moved by its own code and plays no animation clips.',look:null,clips:[]};
  const look=lookOf(id);if(!look)return {ok:false,why:'This character is drawn by its own scene code, with no animations the editor can choose yet.',look:null,clips:[]};
  const banned=(M&&(SP()||{}).BANNED)||/$^/,out=[],seen=new Set(),add=(c,source)=>{if(seen.has(c))return;seen.add(c);out.push({id:c,name:nameOf(c),source,once:ONCE.test(bare(c))});};
  for(const c of (C&&C.clips&&C.clips[look])||[])if(!NO.test(c)&&!banned.test(c))add(c,'own');
  if(M&&X.libraryOffer)for(const o of X.libraryOffer(id))if(o.ok&&o.library==='actorcore')add(o.id,'library');
  if(M&&plan&&Array.isArray(plan.anims))for(const a of plan.anims)if(typeof a==='string'&&!X.animAllowed(id,a)&&!NO.test(bare(a)))add(a,'added');
  return {ok:out.length>0,why:out.length?'':'No animations for this character yet.',look,clips:out};}
 /* Why clip cannot be used by NPC id ('' when it can). */
 function problem(id,clip,opt={}){if(typeof clip!=='string'||clip.length>LIMIT.clip||!CLIP.test(clip))return 'the animation has an unknown name';const r=clipsFor(id,opt);if(!r.ok)return r.why.replace(/\.$/,'').toLowerCase();
  return r.clips.some(c=>c.id===clip)?'':'“'+nameOf(clip)+'” is not an animation this character can play';}
 /* How long a line's animation lasts: about as long as the line is read (1.2 s + 35 ms a character, 2 to 8 s). */
 const lineSeconds=text=>Math.max(LIMIT.line.min,Math.min(LIMIT.line.max,1.2+.035*String(text||'').length));
 const holdOk=v=>v==null||(Number.isInteger(v)&&v>=LIMIT.hold[0]&&v<=LIMIT.hold[1]);
 /* For the admin inventory (the server's check): every NPC with clips, and the clips that do not depend on the NPCs tab. */
 function inventory(ids){const out={};for(const id of ids||[]){const r=clipsFor(id);if(r.ok)out[id]={look:r.look,clips:r.clips.map(c=>c.id)};}return out;}
 const pure={NAMES,ONCE,NO,LIMIT,CLIP,nameOf,lookOf,clipsFor,problem,lineSeconds,holdOk,inventory};
 if(node){module.exports=pure;return;}
 // ---- browser: play a clip on the NPC's figure ----
 /* The figure of NPC id: the crowd controller of her model nearest to the player (a model is one person, so normally there is exactly one). */
 function figure(id){const look=lookOf(id),C=root.VoidCrowd;if(!look||!C||!C.figures)return null;let best=null,bd=Infinity;
  const px=typeof walker!=='undefined'&&walker?walker.x:0,pz=typeof walker!=='undefined'&&walker?walker.z:0;
  for(const c of C.figures()){if(c.node&&!c.node.isDisposed?.()&&c.node.metadata?.made===id)return c;}if(NPX()?.MOVABLE?.[id]?.made)return null;   // a mission giver made in the editor: her own figure (her model may be a street figure's)
  for(const c of C.figures()){if(c.look!==look||!c.node||c.node.isDisposed?.())continue;let d=0;try{const p=c.node.getAbsolutePosition();d=Math.hypot(p.x-px,p.z-pz);}catch{}if(d<bd){bd=d;best=c;}}return best;}
 const log=[];
 /* Play clip on NPC id for `seconds` (a one-movement clip plays once), then back to her own behaviour. A clip she does not carry yet (a library or added one) is put
    on her figure first (npc-paths.js applyAnims). Returns a promise of true when it started. */
 async function perform(id,clip,seconds,opt={}){const plan=opt.plan||null;if(problem(id,clip,{plan}))return false;const c=figure(id);log.push({id,clip,seconds,at:Date.now(),found:!!c});if(log.length>40)log.shift();if(!c||!c.perform)return false;
  if(!c.has(clip)){const X=NPX();try{await X.applyAnims(c.node,c.look,[clip]);}catch{}if(!c.has(clip))return false;}
  return c.perform(clip,{seconds,once:ONCE.test(bare(clip))})>0;}
 root.VoidNPCGestures={...pure,figure,perform,get log(){return log.slice();}};
})(typeof globalThis!=='undefined'?globalThis:this);
