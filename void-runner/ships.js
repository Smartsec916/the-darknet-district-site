/* Campaign ship and standard equipment tuning. Premium stats remain in balance-data.js. */
(function(root){
 const ships={
  starter:{id:'starter',name:'Kestrel / 01',price:0,hull:100,shield:0,recharge:6,shieldDelay:6,laser:1,fireRate:1,cockpit:'salvage',color:'#ffbd69',audio:{frequency:42,wave:'sawtooth',roughness:.22},missile:{capacity:6,damage:1,lock:1,cooldown:1},flight:{acceleration:10,braking:15,maxSpeed:24,pitchRate:.9,yawRate:1.1,rollRate:.9,angularAcceleration:3.2,angularDamping:7,inertia:1.4,linearDamping:1.3,boost:2.5}},
  ship2:{id:'ship2',name:'Peregrine / 02',price:1000,hull:135,shield:30,recharge:8,shieldDelay:5,laser:1.35,fireRate:1.12,cockpit:'vector',color:'#58ffe1',audio:{frequency:58,wave:'triangle',roughness:.08},missile:{capacity:10,damage:1.2,lock:.82,cooldown:.85},flight:{acceleration:15,braking:22,maxSpeed:29,pitchRate:1.15,yawRate:1.4,rollRate:1.2,angularAcceleration:4.8,angularDamping:8,inertia:1.05,linearDamping:1.8,boost:2.7}},
  ship3:{id:'ship3',name:'Spectre / 03',price:null,premium:'spectre',usd:1,hull:170,shield:55,recharge:10,shieldDelay:4.5,laser:1.7,fireRate:1.25,cockpit:'spectre',color:'#c99cff',audio:{frequency:32,wave:'sine',roughness:.035},missile:{capacity:14,damage:1.45,lock:.65,cooldown:.7},flight:{acceleration:21,braking:30,maxSpeed:35,pitchRate:1.4,yawRate:1.7,rollRate:1.5,angularAcceleration:6.5,angularDamping:9,inertia:.8,linearDamping:2.3,boost:3}}
 };
 const equipment={};
 Object.values(ships).forEach((ship,index)=>{
  const tier=index+1;
  equipment['pulse'+tier]={name:'Pulse '+['I','II','III'][index],slot:'weapon',ship:ship.id,get damage(){return ship.laser;},get rate(){return ship.fireRate;}};
  equipment['shield'+tier]={name:['Basic','Vector','Spectre'][index]+' deflector',slot:'shield',ship:ship.id,get capacity(){return ship.shield;},get recharge(){return ship.recharge;},get delay(){return ship.shieldDelay;}};
 });
 const defaults={starter:{weapon:'pulse1',shield:'shield1',utility:null,missile:null},ship2:{weapon:'pulse2',shield:'shield2',utility:null,missile:null},ship3:{weapon:'pulse3',shield:'shield3',utility:null,missile:null}};
 let verified=new Set();
 function verify(ids){verified=new Set(ids.filter(id=>id==='spectre'));}
 function owns(s,id){return id==='ship3'?verified.has('spectre'):s.ownedShips?.includes(id);}
 function get(s){return owns(s,s.activeShip)?ships[s.activeShip]||ships.starter:ships.starter;}
 const api={ships,equipment,defaults,get,owns,verify};if(typeof module!=='undefined')module.exports=api;else root.VoidShips=api;
})(globalThis);
