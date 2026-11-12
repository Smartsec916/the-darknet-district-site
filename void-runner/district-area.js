/* Which environment a player is in, where they appear, and where the two environments meet (docs/void-runner/environment-separation.md).
   Pure rules, no rendering: NeoChinatown's street ('street', location key 'sacramento') and The Darknet District's interior ('interior', key
   'darknet-district') are separate environments joined at the security vestibule. Runs in the browser and in Node tests.
   Saves: location stays 'earth'. story.flags.area='district' marks a player inside; it counts only with a badge (a save without one resumes outside). */
(function(root){
 const KEY={street:'sacramento',interior:'darknet-district'};
 // District-plan metres: x across the building, z from the street door (20) inward. The vestibule runs z 20..26; the outer door is at 20, the inner at 26.
 const POINT={outside:[0,17.4],vestibule:[0,23],hall:[0,28.5],pod:[-15.4,57],podExit:[-12.5,57]};
 // The checkpoint works in the MIDDLE of the vestibule, in both directions: CENTRE is where a player must stand for the doors to seal and the scan to start;
 // VESTIBULE is the whole floor between the two doors (leaving it re-arms the checkpoint). ENTER and EXIT are kept as names for the same centre zone.
 const CENTRE={halfWidth:2.6,from:21.8,to:24.2},VESTIBULE={halfWidth:2.95,from:20.5,to:25.5},ENTER=CENTRE,EXIT=CENTRE;
 const flagsOf=s=>s?.story?.flags||{};
 const areaOf=s=>{const f=flagsOf(s);return f.area==='district'&&f.districtBadge===true?'interior':'street';};
 const keyFor=s=>KEY[areaOf(s)];
 const world=(N,p,y=1.7)=>{const [x,z]=N.toWorld(p[0],p[1]);return [x,y,z];};
 // Where a saved player in the interior reappears: just inside the inner door, facing in. Outside, the location's own spawn is used.
 function resume(s,N){if(areaOf(s)!=='interior')return {};const f=flagsOf(s);if(f.podWakePending===true){const slot=Math.max(1,Math.min(10,Number(f.activePod)||1));return {spawn:world(N,[POINT.pod[0],POINT.pod[1]+((slot-1)%5)*2.6],1.1+(slot>5?1.7:0)),yaw:-Math.PI/2};}return {spawn:world(N,POINT.hall),yaw:Math.PI};}
 function podExit(N,index=1){const slot=Math.max(1,Math.min(10,Number(index)||1));return {spawn:world(N,[POINT.podExit[0],POINT.podExit[1]+((slot-1)%5)*2.6]),yaw:-Math.PI/2};}
 // Where a player appears on leaving the District: in the alley outside the outer door, facing along the alley toward the street.
 function exitSpawn(N){return {spawn:world(N,POINT.outside),yaw:-Math.PI/2};}
 const local=(N,p)=>N.toWorld(p.x??p[0],p.z??p[2]);
 // Entering the vestibule starts the scan automatically, including for a first-time visitor.
 const within=(N,p,zone)=>{const [lx,lz]=local(N,p);return Math.abs(lx)<zone.halfWidth&&lz>=zone.from&&lz<=zone.to;};
 const centre=(N,p)=>within(N,p,CENTRE),inVestibule=(N,p)=>within(N,p,VESTIBULE);
 function enterTrigger(N,p){return centre(N,p);}
 // Leaving works the same way, from the same spot: the middle of the vestibule.
 function exitTrigger(N,p){return centre(N,p);}
 const api={KEY,POINT,ENTER,EXIT,CENTRE,VESTIBULE,centre,inVestibule,areaOf,keyFor,resume,podExit,exitSpawn,enterTrigger,exitTrigger};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidDistrictArea=api;
})(typeof globalThis!=='undefined'?globalThis:this);
