// Multiplayer street poses encode underground x with a +2000 m offset.
const inBedroom=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&x>=-15.73&&x<=-9.73&&z>=-106.5&&z<=-100.5;
const gesture=g=>Array.isArray(g)&&g.length===3&&typeof g[0]==='string'&&/^[a-z-]{1,24}$/.test(g[0])&&
 Number.isFinite(g[1])&&g[1]>=0&&g[1]<=1&&(g[2]===1||g[2]===-1);
const actor=a=>Array.isArray(a)&&(a.length===4||a.length===5&&gesture(a[4]))&&inBedroom(a[0],a[1])&&Number.isFinite(a[2])&&Math.abs(a[2])<=7&&typeof a[3]==='string'&&/^[a-z0-9-]{1,35}$/.test(a[3]);
const valid=m=>Object.keys(m).sort().join()==='activity,actors,line,seated,t'&&Array.isArray(m.actors)&&m.actors.length===2&&m.actors.every(actor)&&
  [null,'sit','hands','dance','relax'].includes(m.activity)&&typeof m.seated==='boolean'&&(m.line===null||typeof m.line==='string'&&/^(nomi|se7en)-[a-zA-Z]+-[0-9]{1,3}$/.test(m.line));
class TeaRoom {
 constructor(send,now){this.members=new Set();this.send=send;this.now=now;this.snapshot=null;}
 get owner(){return this.members.values().next().value;}
 notify(p){this.send(p.conn,{t:'tea-state',owner:this.owner?.id||null,state:this.snapshot});}
 update(p){const inside=p.placed&&p.room==='neochinatown-street'&&inBedroom(p.x-2000,p.z);
  if(!inside){this.leave(p);return;}
  if(!this.members.has(p)){this.members.add(p);this.notify(p);}
 }
 leave(p){const owner=this.owner;if(!this.members.delete(p))return;
  if(p===owner){this.snapshot=null;for(const m of this.members)this.notify(m);}
  this.send(p.conn,{t:'tea-state',owner:null,state:null});
 }
 publish(p,m){if(!p||p!==this.owner||this.now()-(p.lastTea??-Infinity)<150)return;
  p.lastTea=this.now();this.snapshot={actors:m.actors,activity:m.activity,seated:m.seated,line:m.line};
  for(const listener of this.members)if(listener!==p)this.notify(listener);
 }
}
module.exports={TeaRoom,valid};
