const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Kit=require('../void-runner/meridian-interior-kit.js'),Interior=require('../void-runner/meridian-interior.js');
const plan=Kit.plan(),layout=Interior.layout();
const props=plan.filter(p=>!p.size);

test('every piece the dressing uses ships as a self-contained model',()=>{
  for(const k of Kit.pieces){const f=path.join(__dirname,'..','void-runner','assets','models','meridian-interior',k+'.glb');assert.ok(fs.existsSync(f),k);assert.equal(fs.readFileSync(f).readUInt32LE(0),0x46546c67,k+' is a GLB');}
  assert.ok(plan.every(p=>Kit.pieces.includes(p.key)));
});
test('everything sits inside Meridian’s walls',()=>{
  for(const p of plan){assert.ok(Math.abs(p.position[0])<=18,JSON.stringify(p));assert.ok(p.position[2]>=-26&&p.position[2]<=66,JSON.stringify(p));}
});
test('cargo is kept off the ship, the spawn point, the walking route and every interaction',()=>{
  const ship=layout.solids.find(s=>s.id==='ship');
  for(const p of props){
   const [x,,z]=p.position;
   assert.ok(!(Math.abs(x-ship.position[0])<ship.size[0]/2+1&&Math.abs(z-ship.position[2])<ship.size[2]/2+1),'clear of the ship: '+p.key+' '+x+','+z);
   assert.ok(Math.hypot(x,z+17)>4,'clear of the spawn point');
   if(z<4)assert.ok(Math.abs(x)>=10,'hangar cargo stays by the walls: '+p.key+' '+x);
   for(const i of layout.interactions)assert.ok(Math.hypot(x-i.position[0],z-i.position[2])>1.4||p.key==='ammo-case','clear of '+i.id+': '+p.key);
  }
});
test('the walkable plan and its collision are untouched',()=>{
  // The dressing adds no solids; meridian-interior.js is the only source of collision.
  assert.equal(typeof Kit.apply,'function');assert.ok(!('solids' in Kit));
  const src=fs.readFileSync(path.join(__dirname,'..','void-runner','meridian-interior-kit.js'),'utf8');
  assert.doesNotMatch(src,/solids\.push|checkCollisions\s*=\s*true/);
});
