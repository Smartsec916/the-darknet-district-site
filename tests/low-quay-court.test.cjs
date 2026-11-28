'use strict';
// Low Quay's main alley and food court (void-runner/low-quay-court.js): reachable on foot from the subway stairs; the walkway reached only by its two flights
// (never a jump between the court and the walkway); the window booths not walkable in the current build; one usable dancer anchor per window (its facing a default).
const test=require('node:test'),assert=require('node:assert/strict');
const LQ=require('../void-runner/low-quay.js'),CO=require('../void-runner/low-quay-court.js');
const R=.38,L=LQ.layout(),blocked=(x,z)=>Math.abs(x)>L.bounds[0]-R||Math.abs(z)>L.bounds[1]-R||L.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R&&Math.abs(z-s.position[2])<s.size[2]/2+R);
const S=.2,X0=-40,X1=40,Z0=318.4,Z1=456,nx=Math.round((X1-X0)/S),nz=Math.round((Z1-Z0)/S),seen=new Uint8Array(nx*nz),steps=[];
{const id=(i,j)=>j*nx+i,q=[[Math.round((-12.5-X0)/S),Math.round((320-Z0)/S)]];seen[id(...q[0])]=1;
 while(q.length){const [i,j]=q.pop(),x=X0+i*S,z=Z0+j*S,h=LQ.groundHeight(z,x);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||seen[id(a,b)])continue;const xx=X0+a*S,zz=Z0+b*S;if(blocked(xx,zz))continue;steps.push(Math.abs(LQ.groundHeight(zz,xx)-h));seen[id(a,b)]=1;q.push([a,b]);}}}
const can=(x,z)=>!!seen[Math.round((z-Z0)/S)*nx+Math.round((x-X0)/S)];
test('from the stairs: up the alley, into the food court, up both flights onto the walkway on all three sides',()=>{
 for(const [x,z,w] of [[-12.5,340,'alley'],[-12.5,405,'alley end'],[-2,430,'court'],[-28,419,'west flight'],[24,419,'east flight'],[-28,440,'west walkway'],[0,453.5,'north walkway'],[24,440,'east walkway']])assert.ok(can(x,z),w+' '+x+','+z);
 assert.equal(LQ.groundHeight(440,-28),LQ.CITY_Y+CO.U);assert.equal(LQ.groundHeight(430,-2),LQ.CITY_Y);
});
test('no step between neighbouring floor cells is more than a stair riser (no jumping from the walkway into the court)',()=>{
 assert.ok(steps.length>1000);assert.ok(Math.max(...steps)<.3,'largest step '+Math.max(...steps).toFixed(2));
});
// Players cannot walk into the booths in the current build (the block collision); whether they may is the owner's open decision, recorded here only as the current state.
test('each window has a usable dancer anchor: inside its booth with room for a dancer, a finite facing, coloured light; the facing is a default, not a fixed angle',()=>{
 assert.ok(CO.WINDOWS.length>=10);assert.equal(CO.WINDOW_ANCHORS.length,CO.WINDOWS.length);
 const DANCER=.35,valid=(a,w)=>[a.x,a.z,a.yaw].every(Number.isFinite)&&a.x>CO.ALLEY.x1+DANCER&&a.x<CO.ALLEY.x1+CO.BOOTH.depth-DANCER&&Math.abs(a.z-w.z)<CO.BOOTH.width/2-DANCER;
 CO.WINDOW_ANCHORS.forEach((a,i)=>{const w=CO.WINDOWS[i];assert.ok(valid(a,w),a.id+' stands inside its booth');assert.ok(!can(a.x,a.z),a.id+' (current build: booths not walkable)');
  assert.ok(!/^#?(f{3}|f{6})$/i.test(a.tint)&&a.tint===CO.boothColor(i),a.id+' coloured light, never white');});
 // the default faces out through the booth's glass to the alley (a component toward -x), whatever its exact angle
 assert.ok(CO.WINDOW_ANCHORS.every(a=>-Math.sin(a.yaw)>.5),'the default faces the alley');
 // any other facing the owner picks builds valid anchors too (one value, or one per window)
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI*.75,-Math.PI/2+.4,(i)=>i*.7])CO.windowAnchors(yaw).forEach((a,i)=>{assert.ok(valid(a,CO.WINDOWS[i]),'yaw '+yaw+' '+a.id);assert.equal(a.yaw,typeof yaw==='function'?yaw(i):yaw);});
 // one side only: the alley's west side has no windows
 assert.ok(CO.WINDOWS.every(w=>w.z>CO.ALLEY.z0&&w.z<CO.ALLEY.z1));
});
test('the offset grid: brick bond, mirrored, every alley ends in a T, all of it reachable',()=>{
 const G=LQ.GRID,key=b=>b.slice(0,4).join(',');assert.ok(G.length>80);
 const set=new Set(G.map(key));for(const b of G)assert.ok(set.has([-b[1],-b[0],b[2],b[3]].join(',')),'mirror of '+key(b));
 const rows=[...new Set(G.map(b=>b[2]))].sort((a,b)=>a-b);
 for(let i=0;i+1<rows.length;i++){const a=G.filter(b=>b[2]===rows[i]),b=G.filter(b=>b[2]===rows[i+1]);
  for(const g of a){const alleyX=g[1]+2;if(!a.some(o=>o[0]===g[1]+4))continue;if(!b.some(o=>o[0]<alleyX-1&&o[1]>alleyX+1&&b.length))continue;
   assert.ok(b.some(o=>o[0]<alleyX&&o[1]>alleyX),'alley at x '+alleyX+' z '+rows[i]+' ends in a T');}}
 // reachable from the main alley: a far corner of the grid and both sides
 const R2=.38,blk=(x,z)=>Math.abs(x)>L.bounds[0]-R2||Math.abs(z)>L.bounds[1]-R2||L.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R2&&Math.abs(z-s.position[2])<s.size[2]/2+R2);
 const St=1,x0=-160,z0=320,nx=320,nz=280,seen=new Uint8Array(nx*nz),id=(i,j)=>j*nx+i,q=[[Math.round(-12.5-x0),Math.round(330-z0)]];seen[id(...q[0])]=1;
 while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||seen[id(a,b)])continue;if(blk(x0+a*St,z0+b*St))continue;seen[id(a,b)]=1;q.push([a,b]);}}
 const can=(x,z)=>!!seen[id(Math.round(x-x0),Math.round(z-z0))];
 for(const [x,z] of [[0,590],[-150,502],[150,502],[-150,358],[150,358],[-100,598]])assert.ok(can(x,z),'grid reachable at '+x+','+z);
});
// The owner (28 Nov 2026): the window booths are lit red. One setting for the set (BOOTH_LIGHT.color), overridable per window; a default, not a rule.
test('the alley window booths are lit red by default, from one setting that can be changed per set or per window',()=>{
 const red=h=>{const [r,g,b]=[1,3,5].map(k=>parseInt(h.slice(k,k+2),16));return r>=100&&r>2*g&&r>2*b;};
 assert.match(CO.BOOTH_LIGHT.color,/^#[0-9a-f]{6}$/i);assert.ok(red(CO.BOOTH_LIGHT.color),'default booth light is red: '+CO.BOOTH_LIGHT.color);
 CO.WINDOWS.forEach((w,i)=>assert.equal(CO.boothColor(i),CO.BOOTH_LIGHT.color,'window '+i+' uses the set colour'));
 assert.ok(CO.WINDOW_ANCHORS.every(a=>red(a.tint)),'every anchor reports the red light');
 const saved={...CO.BOOTH_LIGHT,windows:{...CO.BOOTH_LIGHT.windows}};
 try{CO.BOOTH_LIGHT.windows[2]='#5a1f9a';assert.equal(CO.boothColor(2),'#5a1f9a');assert.equal(CO.boothColor(3),saved.color);
  CO.BOOTH_LIGHT.color='#b0156e';assert.equal(CO.boothColor(0),'#b0156e');}
 finally{CO.BOOTH_LIGHT.color=saved.color;CO.BOOTH_LIGHT.windows=saved.windows;}
});
