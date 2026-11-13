/* Which environment a player is in, where they appear, and where the two environments meet (docs/void-runner/environment-separation.md).
   Pure rules, no rendering: NeoChinatown's street ('street', location key 'sacramento') and The Darknet District's interior ('interior', key
   'darknet-district') are separate environments joined at the security vestibule. Runs in the browser and in Node tests.
   Saves: location stays 'earth'. story.flags.area='district' marks a player inside; it counts only with a badge (a save without one resumes outside). */
(function(root){
 const KEY={street:'sacramento',interior:'darknet-district'};
 // District-plan metres: x across the building, z from the street door (20) inward. The vestibule runs z 20..26; the outer door is at 20, the inner at 26.
 // The Sleeping Pods stand along the back wall (z 76.7), five across from x -5.2 in steps of 2.6, hatches facing the hallway; `pod` and `podExit` are pod 01.
 const POINT={outside:[0,17.4],vestibule:[0,23],hall:[0,28.5],pod:[-5.2,76.7],podExit:[-5.2,73.8]},POD_STEP=2.6,POD_YAW=0;
 // The checkpoint works in the MIDDLE of the vestibule, in both directions: CENTRE is where a player must stand for the doors to seal and the scan to start;
 // VESTIBULE is the whole floor between the two doors (leaving it re-arms the checkpoint). ENTER and EXIT are kept as names for the same centre zone.
 const CENTRE={halfWidth:2.6,from:21.8,to:24.2},VESTIBULE={halfWidth:2.95,from:20.5,to:25.5},ENTER=CENTRE,EXIT=CENTRE;
 const flagsOf=s=>s?.story?.flags||{};
 const areaOf=s=>{const f=flagsOf(s);return f.area==='district'&&f.districtBadge===true?'interior':'street';};
 const keyFor=s=>KEY[areaOf(s)];
 const world=(N,p,y=1.7)=>{const [x,z]=N.toWorld(p[0],p[1]);return [x,y,z];};
 // Where a saved player in the interior reappears: just inside the inner door, facing in. Outside, the location's own spawn is used.
 function resume(s,N){if(areaOf(s)!=='interior')return {};const f=flagsOf(s);if(f.podWakePending===true){const slot=Math.max(1,Math.min(10,Number(f.activePod)||1));return {spawn:world(N,[POINT.pod[0]+((slot-1)%5)*POD_STEP,POINT.pod[1]],1.1+(slot>5?1.7:0)),yaw:POD_YAW};}return {spawn:world(N,POINT.hall),yaw:Math.PI};}
 function podExit(N,index=1){const slot=Math.max(1,Math.min(10,Number(index)||1));const lx=POINT.podExit[0]+((slot-1)%5)*POD_STEP,lz=POINT.podExit[1];
  // Stepping out, the player faces the doorway to the hallway (not the wall straight ahead). A yaw of a looks along local (-sin a, -cos a).
  return {spawn:world(N,[lx,lz]),yaw:Math.atan2(lx-0,lz-67)};}
 // Where a player lies in pod `index` (1..10; 6..10 are the upper row), and the directions to look from there: out through the hatch, at the wall screens, at the vending unit.
 function podBed(N,index=1){const slot=Math.max(1,Math.min(10,Number(index)||1)),[x,,z]=world(N,[POINT.pod[0]+((slot-1)%5)*POD_STEP,POINT.pod[1]]);return {x,z,y:1.1+(slot>5?1.7:0)};}
 const POD_VIEW={hatch:POD_YAW,inside:POD_YAW+Math.PI,vending:POD_YAW-Math.PI/2};
 // Where a player appears on leaving the District: in the alley outside the outer door, facing along the alley toward the street.
 function exitSpawn(N){return {spawn:world(N,POINT.outside),yaw:-Math.PI/2};}
 const local=(N,p)=>N.toWorld(p.x??p[0],p.z??p[2]);
 // Entering the vestibule starts the scan automatically, including for a first-time visitor.
 const within=(N,p,zone)=>{const [lx,lz]=local(N,p);return Math.abs(lx)<zone.halfWidth&&lz>=zone.from&&lz<=zone.to;};
 const centre=(N,p)=>within(N,p,CENTRE),inVestibule=(N,p)=>within(N,p,VESTIBULE);
 function enterTrigger(N,p){return centre(N,p);}
 // Leaving works the same way, from the same spot: the middle of the vestibule.
 function exitTrigger(N,p){return centre(N,p);}
 const api={KEY,POINT,POD_VIEW,podBed,ENTER,EXIT,CENTRE,VESTIBULE,centre,inVestibule,areaOf,keyFor,resume,podExit,exitSpawn,enterTrigger,exitTrigger};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidDistrictArea=api;
})(typeof globalThis!=='undefined'?globalThis:this);
