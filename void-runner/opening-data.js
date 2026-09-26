/* One authored location in metres. Gameplay anchors are independent of model assets. */
(function(root){
 const hooks={mara:{src:null,path:'assets/models/characters/mara.glb',scale:1,yaw:0},elias:{src:null,path:'assets/models/characters/elias-hologram.glb',scale:1,yaw:0},kestrel:{src:null,path:'assets/models/ships/kestrel.glb',scale:1,yaw:0},pistol:{src:null,path:'assets/models/weapons/ward-pistol.glb',scale:1,yaw:0},bench:{src:null,path:'assets/models/props/workbench.glb',scale:1,yaw:0},workshop:{src:null,path:'assets/models/environment/ward-workshop.glb',scale:1,yaw:0}};
 const cans=Array.from({length:6},(_,id)=>({id,position:[39,1.45,-13+id*2]}));
 function layout(){return {id:'vesper',name:'VESPER / WARD REPAIR',kind:'workshop',bounds:[72,80],spawn:[-3,1.68,-17],yaw:.10,color:'#b49473',music:'industrial',ship:'starter',
  solids:[{id:'back-wall',position:[0,3,-23],size:[26,6,.5]},{id:'left-wall',position:[-13,3,-11.5],size:[.5,6,23]},{id:'right-wall',position:[13,3,-11.5],size:[.5,6,23]},
   {id:'left-bench',position:[-10,1,-11],size:[3,2,9]},{id:'right-storage',position:[10.5,1,-18],size:[3,2,5]},{id:'holo-case',position:[-6,1,-3],size:[2,2,1.5]},{id:'kestrel',position:[12,2,25],size:[11,4,13]},
   {id:'target-rack',position:[39,.55,-8],size:[1,1.1,14]},{id:'range-backstop',position:[46,3,-8],size:[5,6,23]},{id:'fuel-tank',position:[-22,2,14],size:[5,4,5]}],
  interactions:[{id:'recording',action:'opening-recording',label:'PLAY ELIAS’S RECORDING',position:[-6,1.5,-4.4],range:2.8},
   {id:'mara',action:'opening-mara',character:'mara',label:'SPEAK WITH MARA',position:[7,1.68,-5],range:2.8},
   {id:'personal-shop',action:'personal-shop',label:'WORKSHOP PARTS / OPTICS',position:[-8,1.6,-13],range:2.8},
   {id:'maintenance',action:'maintenance',label:'KESTREL DIAGNOSTICS',position:[5,1.68,19],range:2.8},
   {id:'board',action:'board',label:'BOARD KESTREL',position:[5,1.68,24],range:3}],signs:[]};}
 const stages=['move','look','recording','mara','range','draw','aim','fire','reload','cans','ship'];
 function next(s){const p=s.progression,o=p.opening;if(!o||o.version!==2||s.quest!=='inheritance')return null;if(!p.flags.move)return'move';if(!p.flags.look)return'look';if(!o.hologram)return'recording';if(!o.pistol)return'mara';if(!p.flags.draw)return'draw';if(!p.flags.aim)return'aim';if(!p.flags.fire)return'fire';if(!p.flags.reload)return'reload';if(o.cans.length<4)return'cans';return'ship';}
 function hit(s,id){const o=s.progression.opening;if(!o||!o.pistol||!Number.isInteger(id)||id<0||id>=cans.length||o.cans.includes(id))return false;o.cans.push(id);if(o.cans.length>=4)s.progression.flags.groundCombat=true;return true;}
 const api={hooks,cans,layout,stages,next,hit};if(typeof module!=='undefined')module.exports=api;else root.VoidOpening=api;
})(globalThis);
