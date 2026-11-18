'use strict';
// Street glow (ncz-street-glow.js): a little more coloured light where NeoChinatown and the Outskirts are dark, no real lights.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../void-runner/ncz-street-glow.js'),Q=require('../void-runner/ncz-quarters.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-street-glow.js'),'utf8');
test('the palette is the city\'s own: magenta, cyan, amber, teal, and sodium for the Outskirts',()=>{for(const k of ['magenta','cyan','amber','teal','sodium'])assert.match(G.COLORS[k],/^#[0-9a-f]{6}$/);});
test('fixtures go only where the city has no light of its own nearby',()=>{
 const all=G.plan({quality:'medium'}).filter(f=>f.front);assert.ok(all.length>20);
 const lit=all.slice(0,10).map(f=>[f.x+f.nx*1.5,f.z+f.nz*1.5]),some=G.plan({quality:'medium',lit}).filter(f=>f.front);
 for(const f of some)for(const [x,z] of lit)assert.ok(Math.hypot(f.x+f.nx*1.5-x,f.z+f.nz*1.5-z)>=G.config.DARK-1e-9,'nothing within reach of an existing pool');
 assert.ok(some.length<all.length);});
test('fixtures are spaced out: pools of light with shadow between them',()=>{
 const f=G.plan({quality:'medium'}).filter(f=>f.front);for(let i=0;i<f.length;i++)for(let j=i+1;j<f.length;j++)if(f[i].front===f[j].front)assert.ok(Math.hypot(f[i].x-f[j].x,f[i].z-f[j].z)>=G.config.DARK-1e-6);});
test('each fixture stands in its own quarter, clear of gates, NULL and Milked',()=>{
 for(const f of G.plan({quality:'high'})){const pts=f.ends||(f.a?[[f.a[0],f.a[2]],[f.b[0],f.b[2]]]:[[f.x,f.z]]);
  for(const [x,z] of pts)assert.ok(Q.inQuarter(f.quarter,x+(f.nx||0)*1.5,z+(f.nz||0)*1.5)||Q.inQuarter(f.quarter,x+(f.nx||0)*.5,z+(f.nz||0)*.5)||f.kind==='across'||f.quarter==='outskirts',f.kind+' '+x+','+z+' in '+f.quarter);
  if(f.front){for(const g of Q.GATES){const [x0,x1,z0,z1]=g.rect;assert.ok(!(f.x>x0-1&&f.x<x1+1&&f.z>z0-1&&f.z<z1+1),'not at '+g.id);}
   assert.ok(!(f.front==='main-w'&&f.z>-70&&f.z<-47),'not on NULL\'s front');assert.ok(!(f.front==='farsouth-e'&&(f.z>-176&&f.z<-166.5||f.z>-195.5&&f.z<-188)),'not in Milked\'s lane or alley');}}});
test('one quarter at a time; the Outskirts get their makeshift light',()=>{
 const o=G.plan({quarter:'outskirts',quality:'medium'});assert.ok(o.every(f=>f.quarter==='outskirts'));
 for(const k of ['worklamp','string','fire','tube-bare'])assert.ok(o.some(f=>f.kind===k),k);
 assert.ok(G.plan({quarter:'avenue'}).every(f=>f.quarter==='avenue'));assert.equal(G.plan({quarter:'port'}).length,0);});
test('Low: no lanterns across the street and no flicker',()=>{const l=G.plan({quality:'low'});assert.ok(!l.some(f=>f.kind==='across'));assert.ok(l.filter(f=>f.kind==='tube-bare').every(f=>!f.flicker));});
test('no real lights, merged meshes, everything disposed',()=>{assert.doesNotMatch(src,/PointLight|SpotLight|HemisphericLight|DirectionalLight/);assert.match(src,/MergeMeshes/);assert.match(src,/dispose\(\)\{for\(const m of meshes\)m\.dispose\(\);for\(const o of own\)o\.dispose\(\)/);});
test('wired into the street and the page',()=>{const n=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');assert.match(n,/VoidStreetGlow\.start\(\{B,scene,parent,quality,quarter:QK,lit:litSpots\}\)/);assert.match(n,/streetGlow\?\.tick\(dt\)/);assert.match(n,/streetGlow\?\.dispose\(\)/);
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert.ok(h.indexOf('ncz-street-glow.js')>0&&h.indexOf('ncz-street-glow.js')<h.indexOf('void-runner/neochinatown.js'));}});
