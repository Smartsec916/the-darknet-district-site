/* Which environment a player is in, where they appear, and where the two environments meet (docs/void-runner/environment-separation.md).
   Pure rules, no rendering: NeoChinatown's street ('street', location key 'sacramento') and The Darknet District's interior ('interior', key
   'darknet-district') are separate environments joined at the security vestibule. Runs in the browser and in Node tests.
   Saves: location stays 'earth'. story.flags.area='district' marks a player inside; it counts only with a badge (a save without one resumes outside). */
(function(root){
 const KEY={street:'sacramento',interior:'darknet-district'};
 // District-plan metres: x across the building, z from the street door (20) inward. The vestibule runs z 20..26; the outer door is at 20, the inner at 26.
 const POINT={outside:[0,17.4],vestibule:[0,23],hall:[0,28.5],pod:[-15.4,57],podExit:[-12.5,57]};
 const ENTER={halfWidth:2.9,from:22.8,to:25.5},EXIT={halfWidth:3,from:19.5,to:20.8};
 const flagsOf=s=>s?.story?.flags||{};
 const areaOf=s=>{const f=flagsOf(s);return f.area==='district'&&f.districtBadge===true?'interior':'street';};
 const keyFor=s=>KEY[areaOf(s)];
 const world=(N,p,y=1.7)=>{const [x,z]=N.toWorld(p[0],p[1]);return [x,y,z];};
 // Where a saved player in the interior reappears: just inside the inner door, facing in. Outside, the location's own spawn is used.
 function resume(s,N){if(areaOf(s)!=='interior')return {};return flagsOf(s).podWakePending===true?{spawn:world(N,POINT.pod,1.1),yaw:-Math.PI/2}:{spawn:world(N,POINT.hall),yaw:Math.PI};}
 function podExit(N){return {spawn:world(N,POINT.podExit),yaw:-Math.PI/2};}
 // Where a player appears on leaving the District: in the alley outside the outer door, facing along the alley toward the street.
 function exitSpawn(N){return {spawn:world(N,POINT.outside),yaw:-Math.PI/2};}
 const local=(N,p)=>N.toWorld(p.x??p[0],p.z??p[2]);
 // Walking into the vestibule with a badge, from the street, goes straight in; without one the scanner asks for it.
 function enterTrigger(N,p,s){const f=flagsOf(s);if(f.districtBadge!==true)return false;const [lx,lz]=local(N,p);return Math.abs(lx)<ENTER.halfWidth&&lz>=ENTER.from&&lz<=ENTER.to;}
 // Walking out through the open outer door, from the interior, leaves.
 function exitTrigger(N,p){const [lx,lz]=local(N,p);return Math.abs(lx)<EXIT.halfWidth&&lz>=EXIT.from&&lz<=EXIT.to;}
 const api={KEY,POINT,ENTER,EXIT,areaOf,keyFor,resume,podExit,exitSpawn,enterTrigger,exitTrigger};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidDistrictArea=api;
})(typeof globalThis!=='undefined'?globalThis:this);
