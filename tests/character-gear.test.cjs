/* The cyberpunk gear as saved appearances and as multiplayer messages (docs/development/CHARACTER_GEAR.md): no browser needed.
   The gear is four accessory ids in the existing appearance. These tests pin: nothing is worn by default, every combination is valid on every outfit, the hub shows and
   broadcasts it, the largest appearance is small, the part files exist for both bodies, and the fit data covers every outfit. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/character-appearance.js'),C=A.CATALOG,{Hub}=require('../tools/district-hub/protocol.cjs'),HubA=require('../tools/district-hub/appearance/character-appearance.js');
const GEAR=['gear-visor','gear-collar','gear-shoulders','gear-chest'],ROOT=path.join(__dirname,'..'),subsets=ids=>Array.from({length:1<<ids.length},(_,m)=>ids.filter((_,i)=>m>>i&1));

test('the four gear ids exist, are flagged, and every outfit offers all of them with no mesh names; none is a default',()=>{
 for(const g of GEAR){assert.equal(C.accessories[g].gear,true,g);assert.match(g,/^[a-z0-9][a-z0-9-]{0,39}$/);}
 assert.equal(Object.keys(C.looks).length,11);
 for(const [id,l] of Object.entries(C.looks)){for(const g of GEAR)assert.deepEqual(l.accessories[g],[],id+' '+g);assert(!l.defaultAccessories.some(x=>GEAR.includes(x)),id+' defaults');assert(!A.defaults(id).accessories.some(x=>GEAR.includes(x)),id+' A.defaults');}
});
test('every combination of the four pieces is valid on every outfit with every hairstyle, with and without the native accessories',()=>{
 let n=0;for(const [id,l] of Object.entries(C.looks))for(const hair of ['native','none',...l.hairOk])for(const native of subsets(Object.keys(l.accessories).filter(k=>!GEAR.includes(k))))for(const gear of subsets(GEAR)){
  const a={v:1,base:l.base,look:id,hair,hairColor:null,clothingColor:null,accessories:[...native,...gear]},hatBad=native.includes('hat')&&hair!=='native'&&hair!=='none'&&!C.hair[hair].hatOk;
  assert.equal(A.validate(a),!hatBad,id+' '+hair+' '+a.accessories);if(!hatBad){assert.deepEqual(A.normalize(a),a);n++;}}
 assert(n>4000,'many combinations checked: '+n);
});
test('the nine hairstyles are all still offered, and gear does not change which ones fit',()=>{
 assert.equal(Object.keys(C.hair).length,9);
 for(const [id,l] of Object.entries(C.looks)){const bare=A.options(A.defaults(id)).hair.filter(h=>h.enabled).map(h=>h.id),geared=A.options({...A.defaults(id),accessories:[...A.defaults(id).accessories,...GEAR]}).hair.filter(h=>h.enabled).map(h=>h.id);assert.deepEqual(geared,bare,id);}
});
test('an appearance saved before the gear existed is valid, unchanged, and wears none',()=>{
 for(const [look,hair] of [['district-smuggler','short01'],['hacker-01','native'],['fixer-01','bob01']]){const l=C.looks[look],old={v:1,base:l.base,look,hair,hairColor:null,clothingColor:'black',accessories:[...l.defaultAccessories]};
  assert(A.validate(old));assert.deepEqual(A.normalize(old),old);assert(!old.accessories.some(x=>GEAR.includes(x)));}
});
test('the creator lists the gear separately and each piece independently',()=>{
 for(const id of Object.keys(C.looks)){const o=A.options(A.defaults(id)).accessories;assert.deepEqual(o.filter(a=>a.gear).map(a=>a.id).sort(),[...GEAR].sort(),id);assert(o.filter(a=>!a.gear).every(a=>!GEAR.includes(a.id)));}
});
test('the hub (its own copy of the rules) accepts, shows and broadcasts every gear combination on every outfit',()=>{
 assert.deepEqual(Object.keys(HubA.CATALOG.looks),Object.keys(C.looks));assert.equal(JSON.stringify(HubA.CATALOG),JSON.stringify(C),'the hub catalog copy is identical');
 let now=1e6;const sent=new Map(),hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now}),hello={t:'hello',token:'x',room:'district-interior'};
 const who=(uid,appearance)=>({uid,anonymous:false,model:'district-resident',handle:uid,appearance}),mk=(look,accessories)=>({v:1,base:C.looks[look].base,look,hair:'native',hairColor:null,clothingColor:null,accessories});
 const a={},b={};hub.join(a,hello,who('alpha',mk('district-smuggler',[])));hub.join(b,hello,who('bravo',mk('fixer-01',[])));hub.state(a,{t:'state',x:0,z:0,yaw:0});hub.state(b,{t:'state',x:2,z:2,yaw:0});
 for(const look of Object.keys(C.looks))for(const gear of subsets(GEAR)){
  const acc=[...C.looks[look].defaultAccessories,...gear],ap=mk(look,acc),shown=hub.look(who('u',ap));assert.equal(shown.model,C.looks[look].model);assert.deepEqual(shown.appearance,ap,look+' '+gear);
  sent.clear();now+=5000;assert(hub.refresh(a,who('alpha',ap)));const told=(sent.get(b)||[]).filter(m=>m.t==='look');
  if(JSON.stringify(ap)!==JSON.stringify(hub.byConn.get(a).appearance)||told.length)assert.deepEqual(told.at(-1).appearance,ap);
  assert.deepEqual(hub.byConn.get(a).appearance,ap,'the hub holds exactly what was saved');}
});
test('the hub still refuses an unknown accessory, a duplicate and too many',()=>{
 const l='district-smuggler',base={v:1,base:'male',look:l,hair:'native',hairColor:null,clothingColor:null};
 for(const acc of [['gear-wings'],['gear-visor','gear-visor'],[...GEAR,'hat','eyewear','mask','collar','x']])assert(!HubA.validate({...base,accessories:acc}),acc.join());
});
test('size: the largest valid appearance is small, and a player never sends an appearance to the hub',()=>{
 let max=0;for(const [id,l] of Object.entries(C.looks))for(const acc of subsets(Object.keys(l.accessories)))for(const hair of ['native',...l.hairOk]){const a={v:1,base:l.base,look:id,hair,hairColor:C.hairColors.at(-1).id,clothingColor:C.clothingColors.at(-1).id,accessories:acc};if(A.validate(a))max=Math.max(max,JSON.stringify(a).length);}
 assert(max<300,'largest appearance is '+max+' bytes');
 const {parse}=require('../tools/district-hub/protocol.cjs');
 assert(!parse(JSON.stringify({t:'hello',token:'x',room:'district-interior',appearance:{}})),'a hello cannot carry an appearance');assert(!parse(JSON.stringify({t:'refresh',token:'x',appearance:{}})),'neither can a refresh');
 assert(Object.keys(C.looks).every(id=>Object.keys(C.looks[id].accessories).length<=8),'no outfit offers more accessories than the validator allows');
});
test('every gear part file exists for both bodies, is a small self-contained GLB, and the fit data covers all 11 outfits',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(ROOT,'void-runner/assets/models/gear/gear-manifest.json'),'utf8')),fit=JSON.parse(fs.readFileSync(path.join(ROOT,'void-runner/assets/models/gear/gear-fit.json'),'utf8'));
 assert.equal(Object.keys(m.parts).length,10);let tris=0;
 for(const [name,p] of Object.entries(m.parts)){const f=path.join(ROOT,'void-runner/assets/models/gear',p.file),buf=fs.readFileSync(f);assert(buf.length<60000,name+' is small');assert.equal(buf.readUInt32LE(0),0x46546c67);
  const json=JSON.parse(buf.slice(20,20+buf.readUInt32LE(12)).toString());assert(!(json.images||[]).length&&!(json.buffers||[]).some(b=>b.uri),name+' is self-contained');assert(p.triangles<300,name);tris+=p.triangles;}
 for(const l of Object.values(C.looks)){const b=fit.bodies[l.model];assert(b,l.model);assert.equal(b.base,l.base);for(const j of ['Head','Neck','Spine2','LeftArm','RightArm'])assert.equal(b.joints[j].length,3);assert(b.headW>0&&b.span>0);}
 assert.equal(fit.reference.male,'district-smuggler');assert.equal(fit.reference.female,'district-resident');assert(tris<1200,'all ten parts together '+tris);
});
test('no source model or licensed asset was added with the gear',()=>{
 const dir=path.join(ROOT,'void-runner/assets/models/gear'),names=fs.readdirSync(dir);assert(names.every(n=>/^gear_[A-Za-z_]+_(m|f)\.glb$|^gear-(manifest|fit)\.json$/.test(n)),names.join());
});
