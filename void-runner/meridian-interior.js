/* Meridian's shared walkable plan, fittings and tagged activity points, in metres. */
(function(root){
 function layout(ship='starter'){
  const shell=[],solids=[],interactions=[],signs=[],activityPoints=[];
  function add(id,size,position,kind='hull',collision=true){const p={id,size,position,kind};shell.push(p);if(collision)solids.push(p);return p;}
  function sign(id,text,position){signs.push({id,text,position,color:'#d9b776'});}
  function door(id,x,z,label,width=4){const d=add(id,[width,3.4,.25],[x,1.7,z],'door');d.open=false;interactions.push({id,action:'station-door',door:id,label:'OPEN / CLOSE '+label,position:[x,1.6,z-.5],range:2.8});sign(id+'-sign',label,[x,4,z-.3]);return d;}
  for(const side of [-1,1]){
   add('hangar-wall',[.6,9,30],[side*18,4.5,-11]);add('hangar-door-jamb',[8,9,.6],[side*14,4.5,-26]);add('hangar-corridor-wall',[14,9,.6],[side*11,4.5,4]);
   add('corridor-wall',[.6,5,14],[side*4,2.5,11]);add('commerce-entry-wall',[14,6,.6],[side*11,3,18]);
   add('observation-sill',[.6,1.1,24],[side*18,.55,30]);add('observation-lintel',[.6,2,24],[side*18,5,30]);add('observation-glass',[.12,2.9,24],[side*18,2.55,30],'glass');
   add('crew-outer-wall',[.6,6,24],[side*18,3,54]);
   solids.push({id:'outside-corridor',size:[14,20,13],position:[side*11,0,11]});
  }
  add('hangar-header',[20,2,.6],[0,8,-26]);
  for(const [id,w,d,z,h]of [['hangar',36,30,-11,9],['connector',8,14,11,5],['concourse',36,48,42,6]]){add(id+'-floor',[w,.4,d],[0,-.2,z],'floor',false);add(id+'-roof',[w,.4,d],[0,h,z],'hull',false);}
  add('aft-window-sill',[36,1,1],[0,.5,66]);add('aft-window',[36,3,.12],[0,2.5,66],'glass');add('aft-lintel',[36,2,1],[0,5,66]);
  door('crew-pressure-door',0,4,'CONCOURSE',7.4);
  add('bar-counter',[7,1.15,1.2],[11,.575,29],'counter');add('shop-counter',[6,1.15,1.2],[-11,.575,29],'counter');
  add('bar-back',[8,2.8,.5],[11,1.4,33],'panel');
  for(let i=0;i<12;i++)add('bottle',[.15,.35+(i%3)*.09,.15],[7.8+i*.56,1.8,32.6],i%2?'amber':'teal',false);
  for(let i=0;i<4;i++){const x=8+i*1.8;add('bar-stool',[.65,.55,.65],[x,.275,27],'seat');activityPoints.push({id:'bar-'+i,position:[x,0,27],facing:0,activities:['sit','drink'],animation:'seated'});}
  for(const x of [-12,11])for(const z of [37,41]){add('lounge-table',[2.2,.12,1.2],[x,.8,z],'panel');add('table-pedestal',[.35,.8,.35],[x,.4,z],'frame');for(const s of [-1,1]){add('lounge-chair',[.7,.16,.7],[x+s*1.6,.5,z],'seat');add('chair-back',[.14,.8,.7],[x+s*1.93,.7,z],'seat');activityPoints.push({id:'seat-'+x+'-'+z+'-'+s,position:[x+s*1.6,0,z],facing:-s*Math.PI/2,activities:['sit','drink'],animation:'seated'});}}
  for(const side of [-1,1]){
   const x=side*12;add('crew-front',[8,6,.4],[side*14,3,46]);
   add('crew-divider',[.4,6,20],[side*7,3,56]);add('crew-back',[11,6,.4],[side*12.5,3,64]);
   // Rooms enter from the promenade through a split divider aperture.
   const divider=shell.find(p=>p.id==='crew-divider'&&p.position[0]===side*7);shell.splice(shell.indexOf(divider),1);solids.splice(solids.indexOf(divider),1);
   add('crew-side-front',[.4,6,4],[side*7,3,48]);add('crew-side-back',[.4,6,10],[side*7,3,59]);
   const d=add(side<0?'restroom-door':'quarters-door',[.25,3.4,4],[side*7,1.7,52],'door');d.open=false;interactions.push({id:d.id,door:d.id,action:'station-door',label:'OPEN / CLOSE '+(side<0?'RESTROOMS':'CREW QUARTERS'),position:[side*6.4,1.6,52],range:2.8});
   if(side>0){for(const z of [49,59]){add('bunk-frame',[4,.45,1.8],[13,.225,z],'frame');add('bunk-mattress',[3.6,.2,1.6],[13,.55,z],'seat');add('locker',[1,2.3,1],[16,1.15,z],'panel');}}
   else {for(const z of [49,59]){add('washbasin',[1.4,.8,.7],[-15,.4,z],'ceramic');add('mirror',[.05,1.2,1.6],[-17.5,1.8,z],'glass');add('stall-partition',[3.5,2.3,.15],[-13,1.15,z+2]);add('sanitary-fixture',[.65,.55,.9],[-15,.275,z+1],'ceramic');}}
  }
  for(let z=20;z<65;z+=4){add('floor-seam',[35,.012,.035],[0,.012,z],'frame',false);add('overhead-beam',[35,.2,.3],[0,5.7,z],'frame',false);for(const s of [-1,1]){add('ceiling-conduit',[.15,.18,4],[s*4,5.7,z],'amber',false);add('window-mullion',[.28,4,.3],[s*17.7,2.7,z],'frame',false);}}
  for(let z=21;z<65;z+=8)add('route-strip',[.08,.02,4],[0,.025,z],'teal',false);
  for(let i=0;i<4;i++){add('supply-shelf',[.6,2.6,3],[-16,1.3,22+i*3],'frame');for(let j=0;j<3;j++)add('supply-case',[.5,.45,.7],[-15.9,.5+j*.7,22+i*3],'panel',false);}
  solids.push({id:'ship',size:[7,4,11],position:[-7,2,-9]});
  interactions.push({id:'board',action:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-14],range:3.5},{id:'services',action:'services',label:'SHIP OUTFITTER',position:[-10,1.7,26],range:3},{id:'jobs',action:'jobs',label:'MISSION TERMINAL',position:[-4,1.7,31],range:3},{id:'rook',action:'talk',character:'rook',label:'TALK / ROOK',position:[8,1.7,25],range:3},{id:'nyx',action:'talk',character:'nyx',label:'TALK / NYX',position:[13,1.7,31],range:3});
  sign('concourse','MERIDIAN / CREW CONCOURSE',[0,4.8,18.5]);sign('supply','SUPPLIES / OUTFITTER',[-11,3.2,29]);sign('lounge','THE DEAD CHANNEL / LOUNGE',[11,3.5,33]);sign('quarters','RESTROOMS ←   CREW QUARTERS →',[0,4.7,57]);sign('return','HANGAR H01 / RETURN TO SHIP',[0,4,19]);
  for(const [id,x,z,facing,activities]of [['window-left',-16.4,35,-Math.PI/2,['window']],['window-right',16.4,39,Math.PI/2,['window']],['terminal',-4,30,0,['terminal']],['drinks',6,27,0,['get-drink']],['chat-a',-2,38,0,['talk']],['chat-b',-2,40,Math.PI,['talk']],['idle-a',3,44,0,['idle']],['idle-b',-3,60,Math.PI,['idle']]])activityPoints.push({id,position:[x,0,z],facing,activities,animation:activities[0]});
  return {id:'meridian',name:'MERIDIAN STATION',kind:'station',bounds:[18,66],spawn:[0,1.7,-17],ship,color:'#505962',shell,solids,interactions,signs,activityPoints};
 }
 const api={layout};if(typeof module!=='undefined')module.exports=api;else root.VoidMeridianInterior=api;
})(globalThis);
