/* The companions' organic finish (vr-companions.js): crease shading from geometry, the breath and sway, which
   materials count as skin or carry an ORM ambient-occlusion channel, and the quality tiers. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/vr-companions.js');

// A folded strip: two flat panels meeting in a valley along x=0 (the crease), normals pointing up (+y).
function valley(depth){const positions=[],normals=[],indices=[];
 for(let i=0;i<=4;i++)for(let j=0;j<=2;j++){const x=i-2;positions.push(x,Math.abs(x)*depth,j);normals.push(0,1,0);}
 for(let i=0;i<4;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;indices.push(a,b,a+1,a+1,b,b+1);}
 return {positions,normals,indices};}

test('cavity darkens a crease, leaves flat and convex surfaces open, and stays within its floor',()=>{
 const [crease]=C.cavity([valley(.6)]),[flat]=C.cavity([valley(0)]),[ridge]=C.cavity([valley(-.6)]);
 const mid=crease[2*3+1];assert.ok(mid<.97,'the bottom of the valley is shaded: '+mid);assert.equal(Math.min(...crease),mid,'the valley floor is the darkest point');
 assert.ok(Math.min(...crease)>=.6,'never darker than the floor');
 assert.ok(flat.every(v=>v===1),'a flat panel is untouched');
 assert.ok(ridge.every(v=>v>.97),'a ridge is (almost) untouched');});

test('cavity welds seams: the same valley split in two parts shades like one',()=>{
 const whole=valley(.6),[one]=C.cavity([whole]);
 // Split along the crease: the left panel and the right panel, sharing the crease vertices' positions.
 const left={positions:[],normals:[],indices:[]},right={positions:[],normals:[],indices:[]};
 const pick=(dst,cols)=>{for(const i of cols)for(let j=0;j<=2;j++){dst.positions.push(i-2,Math.abs(i-2)*.6,j);dst.normals.push(0,1,0);}for(let i=0;i<cols.length-1;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;dst.indices.push(a,b,a+1,a+1,b,b+1);}};
 pick(left,[0,1,2]);pick(right,[2,3,4]);const [l,r]=C.cavity([left,right]);
 assert.ok(Math.abs(l[2*3+1]-one[2*3+1])<1e-6&&Math.abs(r[1]-one[2*3+1])<1e-6);});

test('the breath is small, smooth, periodic and differs between companions',()=>{
 for(let t=0;t<30;t+=.37){const b=C.breath(t,1.2);for(const v of Object.values(b))assert.ok(Math.abs(v)<.025);assert.ok(b.shoulders>=0);}
 const a=C.breath(3,0),b=C.breath(3+1/.235,0);assert.ok(Math.abs(a.chest-b.chest)<1e-9,'one breath every ~4.3 s');
 assert.notEqual(C.breath(3,0).chest,C.breath(3,2).chest);
 assert.equal(C.breathWeight({state:'idle'}),1);assert.ok(C.breathWeight({state:'walk'})<.5&&C.breathWeight({dancing:true})<.5);});

test('every released companion names its skin materials; Eva reads ambient occlusion from her ORM maps',()=>{
 for(const id of ['seren','kai','nadia','ava','eva','base-f','base-m'])assert.ok(C.get(id).skin?.length,id+' lists skin materials');
 assert.ok(C.isSkin(C.get('ava'),'head')&&!C.isSkin(C.get('ava'),'hair_front')&&!C.isSkin(C.get('ava'),'pupil'));
 assert.ok(C.hasOrm(C.get('eva'),'head5')&&!C.hasOrm(C.get('ava'),'head'));
 // Without a list, skin is guessed from the name, never from eyes, hair or lashes.
 assert.ok(C.isSkin({},'Skin_M')&&!C.isSkin({},'EyeBall_M')&&!C.isSkin({},'Eyelash_M'));});

test('quality tiers: translucency only above Low; rim and filtering everywhere',()=>{
 assert.equal(C.tier('low').translucency,false);assert.equal(C.tier('medium').translucency,true);assert.equal(C.tier('high').translucency,true);assert.equal(C.tier('ultra').anisotropy,16);
 assert.equal(C.tier('nonsense').anisotropy,C.tier('medium').anisotropy);assert.ok(C.tier('low').rim>0);});

test('the bedroom applies the finish and the breath, and removes its observers when it closes',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/vr-suite.js'),'utf8');
 assert.match(src,/C\.finish\(B,node,who,/);assert.match(src,/C\.breath\(life\.t,life\.phase\)/);
 assert.match(src,/onAfterAnimationsObservable\.remove\(lifeObserver\)/);assert.match(src,/onBeforeAnimationsObservable\.remove\(lifeUndo\)/);
 // The rim shader uses names both PBR shader languages define at that injection point.
 const own=fs.readFileSync(path.join(__dirname,'../void-runner/vr-companions.js'),'utf8');
 assert.match(own,/CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION/);assert.match(own,/finalEmissive\+=uniforms\.vCompanionRim/);});
