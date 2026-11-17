/* THE PLACE REGISTRY (pure data and rules: browser and Node tests; no DOM). Named places a mission step or trigger can name ("Enter / leave a place"), arranged the way David
   will pick them later: System > Planet > City > Area > Exact location. Today: Tessaly > NeoChinatown (planet and city in one) > a quarter > a place in it.
   David wants every location named, down to exact spots such as the food stalls: that list is still to be gone through with him; only the places below are named now.
   Every shape is read from data the game already has (ncz-quarters.js streets and gates, neochinatown.js the District's own plan, ncz-nightclub.js NULL, milked.js Milked),
   in WORLD metres (x east, z north). A place is a rect [x0,x1,z0,z1] or a union of rects, with an optional y range [min,max], inside one walking scene.
   The District's rooms are written in the District's own plan (local metres, door at 0,20) and turned into world metres once, with the same half turn neochinatown.js uses
   (a test checks DISTRICT_DOOR against it).
   at(point) -> every place the point is in, with all their parents (a player in NULL is also in Old Town, NeoChinatown and Tessaly).
   tracker() -> per player enter / leave events: update(point) returns {entered, left, inside}; nothing fires twice; a point not in a walking scene (a menu, the pod card,
   a transition) changes nothing, so going through a vestibule never fires a leave and an enter again. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const QT=node?require('./ncz-quarters.js'):root.VoidQuarters,NC=node?require('./ncz-nightclub.js'):root.VoidNightclub,MK=node?require('./milked.js'):root.VoidMilked;
 // neochinatown.js DOOR: the District door in world metres; local (x,z) -> world (DOOR.x-x, DOOR.z+20-z), a half turn (its own inverse).
 const DISTRICT_DOOR={x:126.9,z:-61.9};
 const local=([x0,x1,z0,z1])=>[DISTRICT_DOOR.x-x1,DISTRICT_DOOR.x-x0,DISTRICT_DOOR.z+20-z1,DISTRICT_DOOR.z+20-z0];
 const localPoint=(x,z)=>[DISTRICT_DOOR.x-x,DISTRICT_DOOR.z+20-z];
 const LEVELS=[{id:'system',name:'System'},{id:'planet',name:'Planet'},{id:'city',name:'City'},{id:'area',name:'Area'},{id:'place',name:'Exact location'}];
 const Q=id=>(QT&&QT.QUARTERS[id])||{streets:[],places:[]},G=id=>(QT&&QT.GATES.find(g=>g.id===id))||null;
 const street={walk:'sacramento'},inDistrict={walk:'darknet-district'};
 const DISTRICT=[109.4,144.4,-120.4,-61.6],ALLEY=[71,136,-61.6,-55.5];
 const HALL=(NC&&NC.HALL)||[18,50,-68.5,-48.5],ENTRY=(NC&&NC.ENTRY&&NC.ENTRY.rect)||[46,51,-59.7,-57.3],DOOR=(NC&&NC.DOOR)||{x:50.5,z:-58.5};
 /* id, name, level, parent, scene (walkingLocation.id), rects (world metres), y (optional), enter (where draft play puts a player), target (where the guide arrow leads). */
 const NODES=[
  {id:'tessaly',name:'Tessaly System',level:'system',parent:null,system:'sol'},
  {id:'neochinatown',name:'NeoChinatown',level:'city',parent:'tessaly',location:'earth',note:'Planet and city: NeoChinatown is both for now.',scenes:['neochinatown','corporate','temple']},
  // ---- areas: the quarters (ncz-quarters.js) and the scenes beyond the gates ----
  {id:'port',name:'The Port',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('port').streets],enter:{...street,quarter:'port'}},
  {id:'oldtown',name:'Old Town',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('oldtown').streets,...(Q('oldtown').places||[]),HALL,ENTRY],enter:{...street,quarter:'oldtown'},note:'Main Street, the alley, the access road; the District and NULL stand in it.'},
  {id:'avenue',name:'The Avenue',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('avenue').streets],enter:{...street,quarter:'avenue'}},
  {id:'far-south',name:'Far South',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('far-south').streets,...(Q('far-south').places||[])],enter:{...street,quarter:'far-south'}},
  {id:'outskirts',name:'The Outskirts',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('outskirts').streets],enter:{...street,quarter:'outskirts'}},
  {id:'corporate',name:'The Corporate District',level:'area',parent:'neochinatown',scene:'corporate',whole:true,enter:{...street,quarter:'avenue'},note:'Its own scene, through the Function Gate.'},
  {id:'temple',name:'Zen Zephyr’s Temple',level:'area',parent:'neochinatown',scene:'temple',whole:true,enter:{...street,quarter:'avenue'},note:'Its own scene, through the East Gate.'},
  {id:'gates',name:'Gates and checkpoints',level:'area',parent:'neochinatown',scene:'neochinatown',group:true},
  // ---- exact locations ----
  {id:'district',name:'The Darknet District',level:'place',parent:'oldtown',scene:'neochinatown',rects:[DISTRICT],enter:inDistrict,target:localPoint(0,30)},
  {id:'district-vestibule',name:'The District security vestibule',level:'place',parent:'district',scene:'neochinatown',rects:[local([-3,3,20,26])],enter:inDistrict},
  {id:'district-hall',name:'The District hallway',level:'place',parent:'district',scene:'neochinatown',rects:[local([-3,3,26,70.5])],enter:inDistrict},
  {id:'district-pods',name:'Sleeping Pod room',level:'place',parent:'district',scene:'neochinatown',rects:[local([-17,17,70.5,78.3])],enter:inDistrict},
  {id:'district-vr',name:'VR play area',level:'place',parent:'district',scene:'neochinatown',rects:[local([-17,-3,28,44])],enter:inDistrict},
  {id:'district-arcade',name:'The Arcade',level:'place',parent:'district',scene:'neochinatown',rects:[local([-10.5,-3,57.5,66.5])],enter:inDistrict},
  {id:'district-store',name:'The Store (Admin and Iris)',level:'place',parent:'district',scene:'neochinatown',rects:[local([3,17,43,53])],enter:inDistrict},
  {id:'district-bar',name:'The Bar',level:'place',parent:'district',scene:'neochinatown',rects:[local([3,17,28,42])],enter:inDistrict},
  {id:'district-meeting',name:'The meeting room',level:'place',parent:'district',scene:'neochinatown',rects:[local([3,15,56,69])],enter:inDistrict},
  {id:'district-alley',name:'The District alley',level:'place',parent:'oldtown',scene:'neochinatown',rects:[ALLEY],enter:{...street,quarter:'oldtown'}},
  {id:'null',name:'NULL',level:'place',parent:'oldtown',scene:'neochinatown',rects:[HALL],enter:{...street,quarter:'oldtown'},target:[DOOR.x+1.6,1.7,DOOR.z],note:'The nightclub across Main Street: the hall, entry passage included (ncz-nightclub.js HALL).'},
  {id:'null-entrance',name:'NULL entrance',level:'place',parent:'null',scene:'neochinatown',rects:[ENTRY],enter:{...street,quarter:'oldtown'},target:[DOOR.x+1.6,1.7,DOOR.z]},
  {id:'milked',name:'Milked',level:'place',parent:'far-south',scene:'neochinatown',rects:[(MK&&MK.FOOTPRINT)||[78,98,-190,-174]],enter:{...street,quarter:'far-south'}},
  ...((QT&&QT.GATES)||[]).map(g=>({id:'gate-'+g.id.replace(/-gate$/,''),name:g.name+' ('+g.code+')',level:'place',parent:'gates',scene:'neochinatown',rects:[g.rect],enter:{...street,quarter:(g.ends.hi&&g.ends.hi.quarter)||(g.ends.lo&&g.ends.lo.quarter)||'avenue'}}))];
 const BY=new Map(NODES.map(n=>[n.id,n]));
 const IDS=NODES.map(n=>n.id);
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 const has=(n,p)=>{if(!n||n.group||!p)return false;if(n.whole)return p.scene===n.scene;if(n.scene&&n.scene!==p.scene)return false;if(!n.rects||!n.rects.length)return false;
  if(n.y&&Number.isFinite(p.y)&&(p.y<n.y[0]||p.y>n.y[1]))return false;return n.rects.some(r=>inRect(r,p.x,p.z));};
 const parents=id=>{const out=[];let n=BY.get(id);while(n&&n.parent){out.push(n.parent);n=BY.get(n.parent);}return out;};
 /* Every place a point is in, deepest first, with their parents. point: {scene, x, y?, z}. */
 function at(p){if(!p||typeof p.scene!=='string'||!Number.isFinite(p.x)||!Number.isFinite(p.z))return [];const hit=NODES.filter(n=>has(n,p)).map(n=>n.id),out=new Set();
  for(const id of hit.sort((a,b)=>parents(b).length-parents(a).length)){out.add(id);for(const q of parents(id))out.add(q);}return [...out];}
 /* The deepest named place a point is in (for a photo's location). */
 function deepest(p){const list=at(p);return list.length?list[0]:null;}
 const path=id=>[...parents(id).reverse(),id].filter(x=>BY.has(x));
 const label=id=>path(id).map(x=>BY.get(x).name).join(' › ');
 const name=id=>(BY.get(id)||{}).name||id;
 /* The tree for a picker: [{node, children:[...]}], in the order above. */
 function tree(){const kids=id=>NODES.filter(n=>n.parent===id).map(n=>({node:n,children:kids(n.id)}));return kids(null);}
 /* A flat list for a <select>: [{id, name, depth, label, selectable}] (a group heading is not selectable). */
 function options(){const out=[];const walk=(list,d)=>{for(const x of list){out.push({id:x.node.id,name:x.node.name,depth:d,label:label(x.node.id),level:x.node.level,selectable:!x.node.group&&x.node.level!=='system'});walk(x.children,d+1);}};walk(tree(),0);return out;}
 /* Where the guide arrow leads for a place: its target point, or the middle of its first rect (world metres, y 1.7). */
 function target(id){const n=BY.get(id);if(!n)return null;if(n.target)return n.target.length===3?n.target.slice():[n.target[0],1.7,n.target[1]];if(n.rects&&n.rects.length){const r=n.rects[0];return [(r[0]+r[1])/2,1.7,(r[2]+r[3])/2];}return null;}
 const within=(id,ancestor)=>id===ancestor||parents(id).includes(ancestor);
 /* Enter / leave events for one player. */
 function tracker(){let inside=new Set(),started=false;
  return {
   update(p){if(!p||typeof p.scene!=='string')return {entered:[],left:[],inside:[...inside]};const now=new Set(at(p)),entered=[...now].filter(x=>!inside.has(x)),left=[...inside].filter(x=>!now.has(x));inside=now;started=true;return {entered,left,inside:[...now]};},
   get inside(){return [...inside];},get started(){return started;},has:id=>inside.has(id),reset(){inside=new Set();started=false;}};}
 const api={LEVELS,NODES,IDS,BY,DISTRICT_DOOR,at,deepest,path,label,name,tree,options,target,within,parents,tracker,node:id=>BY.get(id)||null};
 if(node)module.exports=api;else root.VoidPlaces=api;
})(typeof globalThis!=='undefined'?globalThis:this);
