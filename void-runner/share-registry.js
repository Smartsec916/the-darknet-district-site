/* Shareable places and guest scenarios (David's brief, 2026-11-01). The one list of what a public link may open.
   A link names an entry by id (?visit=meridian or ?scenario=station-arrival, plus &v=1); everything else (where you
   stand, which way you face, what is set up) comes from this file, never from the address. Ids that aren't here, newer
   versions, development-only entries, anything that looks like a save, coordinates or code are refused.
   Pure rules: runs in the browser (VoidShare) and in Node (tests). guest-mode.js turns an entry into a session. */
(function(root){
 const VERSION=1,MIN_VERSION=1;
 // The District's own plan (neochinatown.js): x across the facility, z from the street door (20) inward.
 const frames={district:{x:[-16,16],z:[21,78]}};
 const tint={city:'linear-gradient(135deg,#120a24,#ff2d96 55%,#5ff2ff)',district:'linear-gradient(135deg,#05121a,#5ff2ff 60%,#ff2d96)',station:'linear-gradient(135deg,#0b1820,#6981a0)',flight:'linear-gradient(135deg,#02060a,#3a6cff 60%,#5ff2ff)'};
 // destination.kind: 'dock' (the game's own arrival at that location), 'flight' (dock, then board and launch),
 // 'vr' (the District's VR arcade, through VoidVR.launch or its own picker). Only what the game really builds.
 const entries=[
  {id:'neochinatown',type:'location',name:'NeoChinatown',system:'Tessaly System',description:'The city landing: tall towers, neon signs, street traffic and the alley that leads to The Darknet District.',
   destination:{kind:'dock',location:'earth'},spawn:null,environment:'NeoChinatown street (night)',equipment:{weapon:'ward-pistol'},npc:'Street crowd, taxis and police patrols',objective:'Walk the streets and find the District door in the alley.',flags:{districtDoor:true,districtBadge:true},preview:null,tint:tint.city},
  {id:'darknet-district',type:'location',name:'The Darknet District',system:'NeoChinatown',description:'Inside the District: the hallway, VR arcade, bar, Admin and Iris’s shop, vending machines, sleep pods and the stairs to the smoking area.',
   destination:{kind:'dock',location:'earth'},spawn:{frame:'district',x:0,z:30,face:[0,46]},environment:'The Darknet District interior',equipment:{weapon:'ward-pistol'},npc:'Iris, the bartender and the arcade',objective:'Look around the District. Talk to Iris and the bartender, or try the VR arcade.',flags:{districtDoor:true,districtBadge:true},preview:null,tint:tint.district},
  {id:'meridian',type:'location',name:'Meridian Station',system:'Erebus System',description:'The first trade hub: hangar, pressure door, concourse, living area, store and bar.',
   destination:{kind:'dock',location:'meridian'},spawn:null,environment:'Meridian hangar and concourse',equipment:{weapon:'ward-pistol'},npc:'Station crew and traders',objective:'Walk from the hangar through the pressure door to the concourse.',flags:{},preview:'void-runner/art/hangar-meridian.png',tint:tint.station},
  {id:'kepler',type:'location',name:'Kepler Exchange',system:'Erebus System',description:'A clean research and logistics station on Meridian’s plan.',
   destination:{kind:'dock',location:'kepler'},spawn:null,environment:'Kepler hangar and concourse',equipment:{weapon:'ward-pistol'},npc:'Station crew',objective:'Explore the station.',flags:{},preview:'void-runner/art/hangar-kepler.png',tint:tint.station},
  {id:'rusthaven',type:'location',name:'Rusthaven Port',system:'Erebus System',description:'A rough port on the edge of the law.',
   destination:{kind:'dock',location:'rusthaven'},spawn:null,environment:'Rusthaven hangar and concourse',equipment:{weapon:'ward-pistol'},npc:'Dock workers',objective:'Explore the port.',flags:{},preview:'void-runner/art/hangar-rusthaven.png',tint:tint.station},
  {id:'foundry',type:'location',name:'The Foundry',system:'Erebus System',description:'An industrial station of furnaces and heavy cargo.',
   destination:{kind:'dock',location:'foundry'},spawn:null,environment:'Foundry hangar and concourse',equipment:{weapon:'ward-pistol'},npc:'Station crew',objective:'Explore the station.',flags:{},preview:'void-runner/art/hangar-foundry.png',tint:tint.station},
  {id:'tessaly-belt',type:'location',name:'Tessaly Belt Anchorage',system:'Tessaly System',description:'The anchorage in the Tessaly asteroid belt.',
   destination:{kind:'dock',location:'sol-belt'},spawn:null,environment:'Anchorage hangar and concourse',equipment:{weapon:'ward-pistol'},npc:'Station crew',objective:'Explore the anchorage.',flags:{},preview:null,tint:tint.station},
  {id:'station-arrival',type:'scenario',name:'Arrival at Meridian',system:'Erebus System',description:'You have just docked your Kestrel at Meridian. Step off the ship and take in the station.',
   destination:{kind:'dock',location:'meridian'},spawn:null,environment:'Meridian hangar, ship docked',equipment:{weapon:'ward-pistol'},npc:'Station crew and traders',objective:'Leave the hangar through the pressure door and find the bar.',flags:{},preview:'void-runner/art/hangar-meridian.png',tint:tint.station},
  {id:'district-night',type:'scenario',name:'A Night in the District',system:'NeoChinatown',description:'Start inside The Darknet District with the doors open and the arcade running.',
   destination:{kind:'dock',location:'earth'},spawn:{frame:'district',x:0,z:30,face:[12.5,46.2]},environment:'The Darknet District interior',equipment:{weapon:'ward-pistol'},npc:'Iris and the bartender',objective:'Talk to Iris, then the bartender. The VR arcade is on your left.',flags:{districtDoor:true,districtBadge:true},preview:null,tint:tint.district},
  {id:'meridian-departure',type:'scenario',name:'Departure from Meridian',system:'Erebus System',description:'Undock from Meridian and fly the Kestrel along the transit lane.',
   destination:{kind:'flight',location:'meridian'},spawn:null,environment:'Kestrel cockpit, leaving Meridian',equipment:{weapon:'ward-pistol'},npc:'Traffic control',objective:'Follow the transit lane. Docking is automatic on arrival.',flags:{},preview:'void-runner/art/sky-meridian.png',tint:tint.flight},
  {id:'vr-forest',type:'scenario',name:'VR · Relax in a Forest',system:'Darknet District VR arcade',description:'A quiet forest with paths, a stream and a waterfall, a sunlit clearing, birds and butterflies.',
   destination:{kind:'vr',location:'earth',experience:'forest'},spawn:null,environment:'VR forest simulation',equipment:{},npc:null,objective:'Sit, rest, listen. Backspace leaves the simulation.',flags:{districtDoor:true,districtBadge:true},preview:'void-runner/assets/vr/sky/forest.jpg',tint:tint.district},
  {id:'vr-tropical',type:'scenario',name:'VR · Tropical Escape',system:'Darknet District VR arcade',description:'A sandy beach on a calm sea: palms, loungers, a thatched shelter and a pier.',
   destination:{kind:'vr',location:'earth',experience:'tropical'},spawn:null,environment:'VR beach simulation',equipment:{},npc:null,objective:'Walk the beach and the pier. Backspace leaves the simulation.',flags:{districtDoor:true,districtBadge:true},preview:'void-runner/assets/vr/sky/beach-day.jpg',tint:tint.district},
  {id:'vr-bedroom',type:'scenario',name:'VR · Play in a Bedroom',system:'Darknet District VR arcade',description:'The arcade’s private apartment simulation. The visitor chooses from the companions this site offers to everyone.',
   destination:{kind:'vr',location:'earth',experience:'suite',picker:true},spawn:null,environment:'VR apartment simulation',equipment:{},npc:'A companion the visitor chooses',objective:'Choose a companion at the VR terminal.',flags:{districtDoor:true,districtBadge:true},preview:'void-runner/assets/vr/preview-suite.jpg',tint:tint.district}
 ].map(e=>Object.freeze({version:1,availability:'public',guest:true,...e}));
 const byId=new Map(entries.map(e=>[e.id,e]));
 // Keys a link may carry for us. Other harmless keys (a messenger's tracking tag) are ignored; these are refused outright.
 const FORBIDDEN=/^(save|state|campaign|credits|items?|gear|dev|developer|admin|debug|cheat|x|y|z|pos|position|spawn|coords?|yaw|eval|script|js|code|data|json|token|uid|stage|quest|mission|reputation|kit)$/i;
 const ID=/^[a-z0-9]+(-[a-z0-9]+)*$/,MAX_QUERY=300,MAX_ID=40;
 const fail=(reason,message)=>({ok:false,reason,message});
 function inBounds(e){const s=e.spawn;if(!s)return true;const f=frames[s.frame];if(!f)return false;
  const ok=(v,[lo,hi])=>Number.isFinite(v)&&v>=lo&&v<=hi;return ok(s.x,f.x)&&ok(s.z,f.z)&&(!s.face||ok(s.face[0],f.x)&&ok(s.face[1],f.z));}
 // Usable by a guest: public, guest-compatible, this version or older, and spawning inside its frame.
 function usable(e){return !!e&&e.availability==='public'&&e.guest===true&&e.version<=VERSION&&inBounds(e);}
 function list(type){return entries.filter(e=>usable(e)&&(!type||e.type===type));}
 function get(id){const e=byId.get(id);return usable(e)?e:null;}
 // Reads a page address's query string. Returns {present:false} when it isn't a share link at all.
 function parse(search){
  const raw=typeof search==='string'?search:'';
  const q=raw.replace(/^\?/,'');
  if(!/(^|&)(visit|scenario)=/i.test(q))return {present:false};
  if(raw.length>MAX_QUERY)return {present:true,...fail('too-long','This link is too long to be a VOID//RUNNER share link.')};
  let params;try{params=new URLSearchParams(q);}catch{return {present:true,...fail('malformed','This link could not be read.')};}
  const keys=[...params.keys()];
  if(keys.some(k=>FORBIDDEN.test(k)))return {present:true,...fail('forbidden','This link asks for something share links cannot do.')};
  for(const k of ['visit','scenario','v'])if(params.getAll(k).length>1)return {present:true,...fail('duplicate','This link repeats a setting.')};
  const visit=params.get('visit'),scenario=params.get('scenario');
  if(visit!==null&&scenario!==null)return {present:true,...fail('both','A link opens one place or one scenario, not both.')};
  const type=visit!==null?'location':'scenario',id=visit??scenario;
  if(!id||id.length>MAX_ID||!ID.test(id))return {present:true,...fail('malformed','This link’s destination isn’t valid.')};
  const vRaw=params.get('v');let version=VERSION;
  if(vRaw!==null){if(!/^[0-9]{1,3}$/.test(vRaw))return {present:true,...fail('version','This link’s version isn’t valid.')};version=+vRaw;}
  if(version>VERSION)return {present:true,...fail('version','This link was made by a newer version of the game. Reload the page to update, then open the link again.')};
  if(version<MIN_VERSION)return {present:true,...fail('version','This link is from an old version and is no longer supported.')};
  const e=byId.get(id);
  if(!e||e.type!==type)return {present:true,...fail('unknown','This destination doesn’t exist or isn’t shareable.')};
  if(!usable(e))return {present:true,...fail('unavailable','This destination isn’t available to guests.')};
  return {present:true,ok:true,entry:e,version};
 }
 // The link for an entry, on the page's own address (no other parameters carried over).
 function link(id,base){const e=get(id);if(!e)return null;const url=String(base||'https://thedarknetdistrict.com/void-runner.html').split(/[?#]/)[0];
  return url+'?'+(e.type==='location'?'visit':'scenario')+'='+encodeURIComponent(e.id)+'&v='+VERSION;}
 function search(text,type){const t=String(text||'').toLowerCase().trim().slice(0,60);return list(type).filter(e=>!t||[e.name,e.description,e.system,e.id].join(' ').toLowerCase().includes(t));}
 const api={VERSION,MIN_VERSION,frames,entries,list,get,parse,link,search,usable,inBounds};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidShare=api;
})(typeof globalThis!=='undefined'?globalThis:this);
