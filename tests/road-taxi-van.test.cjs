'use strict';
/* The minivan street taxi (road-taxi-van.js, 19 Nov 2026) and the taxi stops' LED chase borders: the shape fits the cab's footprint and the gates' bays,
   the passenger and the companion sit on the van's middle-row seats under the roof, the doors are clear of the body, the page loads the van before the cab code. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const V=require('../void-runner/road-taxi-van.js');const Q=require('../void-runner/ncz-quarters.js'),R=require('../void-runner/road-taxi-rules.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('the van keeps the cab footprint (rules SPEC) and fits the gates\' vehicle bays',()=>{
 const zs=V.PROFILE.map(p=>p[0]),ys=V.PROFILE.map(p=>p[1]);
 assert.ok(Math.max(...zs)-Math.min(...zs)<=R.SPEC.length+.01,'length');assert.ok(V.halfW(0.5)*2<=R.SPEC.width+.01,'width');
 assert.ok(Math.max(...ys)<2.0&&V.WHEEL.r*2<.75,'height and wheels');
 for(const g of Q.GATES)for(const l of Q.lanesOf(g.id).filter(l=>l.kind==='bay'))for(const d of Object.values(l.doors)){assert.ok(d.half*2>=2.1,'bay '+l.key+' opening '+d.half*2);assert.ok(d.height>=2.6,'bay height');}
 // y-monotone outline: each height crosses it in one span
 for(let y=.27;y<1.83;y+=.05){const [a,b]=V.span(y);assert.ok(b>a,'span at '+y);}
});
test('passenger and companion sit in the middle row, side by side, under the roof; the doors stand clear of the van',()=>{
 for(const yaw of [0,Math.PI/2,-2.2]){const cab={x:30,z:-12,yaw},p=R.seatPoint(cab),c=R.companionSeat(cab),fx=Math.sin(yaw),fz=Math.cos(yaw),rx=fz,rz=-fx;
  const local=q=>({right:(q.x-cab.x)*rx+(q.z-cab.z)*rz,fwd:(q.x-cab.x)*fx+(q.z-cab.z)*fz});
  const lp=local(p),lc=local(c);
  assert.ok(Math.abs(lp.right-.42)<1e-9&&lp.fwd<0&&lp.fwd>-.7,'player on the right middle seat');assert.ok(Math.abs(lc.right+.42)<1e-9,'companion on the left');
  assert.ok(p.y>1.3&&p.y<1.7,'seated eye height below the 1.76 m roof lining');
  // the sit clip: hips 0.54 m above its root (35 cm behind it), head about 1.15 m above: on the 0.84 m cushion, head under the lining
  assert.ok(Math.abs(c.y+.54-.84)<.02,'hips on the cushion');assert.ok(c.y+1.15<1.7,'her head under the roof');
  for(const d of R.doorPoints(cab).slice(0,2)){const l=local(d);assert.ok(Math.abs(l.right)>V.halfW(.5)+.5,'door point clear of the side');}
  const right=local(R.doorPoints(cab)[0]);assert.ok(right.right>0&&right.fwd>V.DOOR.z0&&right.fwd<V.DOOR.z1,'BOARD TAXI by the sliding door');}
});
test('each cab has its own number; the first is the reference\'s 0724',()=>{
 assert.equal(V.number('cab-1'),'0724');const n=new Set(['cab-2','cab-3','cab-4'].map(V.number));assert.equal(n.size,3);for(const x of n)assert.match(x,/^\d{4}$/);
});
test('the page loads the van before the cab; the stops, the Corporate District and the Temple draw the LED chase; no real brand on the cab',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=read(f);assert.ok(h.indexOf('void-runner/road-taxi-van.js')>0&&h.indexOf('void-runner/road-taxi-van.js')<h.indexOf('void-runner/road-taxi.js'));}
 assert.match(read('void-runner/ncz-gates.js'),/VoidTaxiVan\?\.ledFrames\?\.\(B,scene,leds/);
 for(const f of ['corporate-build.js','temple-build.js'])assert.match(read('void-runner/'+f),/VoidTaxiVan\?\.ledFrames/);
 const src=read('void-runner/road-taxi-van.js');assert.doesNotMatch(src,/neuralink|waymo|tesla|uber|zoox/i);
 assert.match(read('void-runner/road-taxi.js'),/globalThis\.VoidTaxiVan\.build/);   // the box cab stays as the stand-in
});
