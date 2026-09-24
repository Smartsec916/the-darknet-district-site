/* One metre-space plan drives exterior shells, walkable walls and collisions. */
(function(root){
 const palettes={meridian:['#56616a','#6981a0'],kepler:['#879497','#688ca6'],undertow:['#645959','#544a6d'],foundry:['#595955','#88654b'],'sol-belt':['#879497','#607f99'],vesper:['#655f56','#627c79']};
 const appearances={
  mara:{coat:'#596449',hair:'#c4c7c5',skin:'#b88d74',style:'short'},
  elias:{coat:'#68503c',hair:'#90938d',skin:'#b7957c',style:'beard',archive:true},
  rook:{coat:'#2e3039',hair:'#181c22',skin:'#b28c77',style:'undercut',eye:'#ffb750'},
  iona:{coat:'#414656',hair:'#8b579d',skin:'#6e4736',style:'braids'},
  sol:{coat:'#3b757a',hair:'#343633',skin:'#c69f82',style:'glasses'},
  nyx:{coat:'#303544',hair:'#e1e1db',skin:'#b09b90',style:'undercut',eye:'#a7d4e2'}
 };
 function layout(id,ship='starter'){
  const shell=[],solids=[];const add=(name,size,position,kind='hull',collision=true)=>{const part={id:name,size,position,kind};shell.push(part);if(collision)solids.push(part);};
  // Hangar [-18,18] x [-26,4], corridor [-4,4] x [4,18], commerce [-18,18] x [18,34].
  for(const side of [-1,1]){
   add('hangar-wall',[.6,9,30],[side*18,4.5,-11]);
   add('hangar-door-jamb',[8,9,.6],[side*14,4.5,-26]);
   add('hangar-corridor-wall',[14,9,.6],[side*11,4.5,4]);
   add('corridor-wall',[.6,5,14],[side*4,2.5,11]);
   add('commerce-entry-wall',[14,6,.6],[side*11,3,18]);
   // Observation windows: genuine open apertures with sill/lintel and glass.
   add('window-sill',[.6,1.1,16],[side*18,.55,26]);
   add('window-lintel',[.6,2,16],[side*18,5,26]);
   add('observation-glass',[.12,2.9,16],[side*18,2.55,26],'glass');
  }
  add('hangar-header',[20,2,.6],[0,8,-26]);
  add('commerce-back',[36,6,.6],[0,3,34]);
  add('hangar-floor',[36,.4,30],[0,-.2,-11],'floor',false);add('hangar-roof',[36,.4,30],[0,9,-11],'hull',false);
  add('corridor-floor',[8,.4,14],[0,-.2,11],'floor',false);add('corridor-roof',[8,.4,14],[0,5,11],'hull',false);
  add('commerce-floor',[36,.4,16],[0,-.2,26],'floor',false);add('commerce-roof',[36,.4,16],[0,6,26],'hull',false);
  add('bar-counter',[7,1.15,1.2],[11,.575,29],'counter');
  add('shop-counter',[6,1.15,1.2],[-11,.575,29],'counter');
  // Nonwalkable strips outside the narrow corridor are collision volumes, not visual walls.
  solids.push({id:'outside-left',size:[14,20,13],position:[-11,0,11]},{id:'outside-right',size:[14,20,13],position:[11,0,11]}, {id:'ship',size:[7,4,11],position:[-7,2,-9]});
  const interactions=[{id:'board',action:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-14],range:3.5},{id:'services',action:'services',label:'SHIP OUTFITTER',position:[-10,1.7,26],range:3},{id:'jobs',action:'jobs',label:'MISSION TERMINAL',position:[-4,1.7,31],range:3}];
  const people=id==='meridian'?['rook','nyx']:id==='kepler'?['sol']:id==='undertow'?['iona']:id==='vesper'?['mara','elias']:[];
  people.forEach((character,i)=>interactions.push({id:character,action:'talk',character,label:(character==='elias'?'PLAY ARCHIVE / ':'TALK / ')+character.toUpperCase(),position:id==='vesper'?[i?5:0,1.7,i?-10:-12]:[i?13:8,1.7,i?31:25],range:3}));
  return {id,name:id.toUpperCase(),kind:'station',bounds:[18,34],spawn:[0,1.7,-17],ship,color:(palettes[id]||palettes.meridian)[0],shell,solids,interactions,signs:[{id:'hangar',position:[0,6,3.5],text:'HANGAR  /  CONCOURSE →',color:'#9fcbba'},{id:'concourse',position:[0,4,33.5],text:id==='meridian'?'THE DEAD CHANNEL / OUTFITTER':id.toUpperCase()+' / CREW SERVICES',color:'#a4c3b6'}]};
 }
 const api={layout,palettes,appearances};if(typeof module!=='undefined')module.exports=api;else root.VoidStationLayouts=api;
})(globalThis);
