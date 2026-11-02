// Shareable locations and guest scenarios (David's brief, 2026-11-01): the registry, link parsing and spawn safety.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../void-runner/share-registry.js'),U=require('../void-runner/universe.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('every entry is complete, public, guest-compatible and points at a place the game builds',()=>{
 const ids=new Set();
 for(const e of S.entries){
  assert.ok(!ids.has(e.id),'unique '+e.id);ids.add(e.id);
  assert.match(e.id,/^[a-z0-9]+(-[a-z0-9]+)*$/);
  for(const k of ['id','name','description','type','destination','environment','equipment','objective','version','availability','guest'])assert.ok(k in e,e.id+' has '+k);
  assert.ok(['location','scenario'].includes(e.type));assert.equal(e.availability,'public');assert.equal(e.guest,true);assert.equal(e.version,1);
  assert.ok(U.locations[e.destination.location],e.id+' location exists');
  assert.ok(['dock','flight','vr'].includes(e.destination.kind),e.id+' kind');
  assert.ok(S.inBounds(e),e.id+' spawn in bounds');
  assert.ok(Object.isFrozen(e));
 }
 for(const id of ['neochinatown','darknet-district','meridian'])assert.ok(S.get(id)?.type==='location',id);
 for(const id of ['station-arrival','vr-forest','vr-tropical','vr-bedroom','meridian-departure'])assert.ok(S.get(id)?.type==='scenario',id);
});
test('only finished VR experiences are shareable: no Combat Simulator, no named companion',()=>{
 const vr=S.entries.filter(e=>e.destination.kind==='vr');
 assert.deepEqual(vr.map(e=>e.destination.experience).sort(),['forest','suite','tropical']);
 for(const e of vr)assert.ok(!('companion' in e.destination)&&!('companions' in e.destination),'no companion chosen by the link');
 assert.equal(S.get('vr-combat'),null);assert.equal(S.parse('?scenario=vr-combat').reason,'unknown');
 assert.equal(S.get('vr-bedroom').destination.picker,true,'the visitor picks from what the terminal offers');
});
test('valid links open their entry',()=>{
 const a=S.parse('?visit=neochinatown');assert.ok(a.present&&a.ok);assert.equal(a.entry.id,'neochinatown');
 const b=S.parse('?scenario=station-arrival&v=1');assert.ok(b.ok);assert.equal(b.entry.id,'station-arrival');assert.equal(b.version,1);
 assert.ok(S.parse('?visit=meridian&v=1&fbclid=abc123').ok,'a messenger tracking tag is ignored');
 assert.deepEqual(S.parse(''),{present:false});assert.deepEqual(S.parse('?nightclub=1'),{present:false});assert.deepEqual(S.parse(null),{present:false});
});
test('invalid, malformed, oversized and dangerous links are refused with a reason',()=>{
 const no=(q,reason)=>{const r=S.parse(q);assert.equal(r.present,true,q);assert.equal(r.ok,false,q);assert.equal(r.reason,reason,q);assert.ok(r.message,q);};
 no('?visit=atlantis','unknown');no('?visit=vr-forest','unknown');no('?scenario=meridian','unknown');
 no('?visit=meridian&scenario=vr-forest','both');no('?visit=meridian&visit=kepler','duplicate');no('?visit=meridian&v=1&v=1','duplicate');
 no('?visit=','malformed');no('?visit=Meridian','malformed');no('?visit=../../admin','malformed');no('?visit=%3Cscript%3Ealert(1)%3C%2Fscript%3E','malformed');
 no('?visit='+encodeURIComponent('{"credits":99999}'),'malformed');no('?visit=a'.padEnd(60,'a'),'malformed');no('?visit=meridian&pad='+'x'.repeat(400),'too-long');
 no('?visit=meridian&v=2','version');no('?visit=meridian&v=0','version');no('?visit=meridian&v=1.5','version');no('?visit=meridian&v=-1','version');no('?visit=meridian&v=9999','version');
 for(const k of ['save','state','dev','admin','debug','x','z','spawn','credits','eval','script','quest','stage','kit','reputation','token'])no('?visit=meridian&'+k+'=1','forbidden');
});
test('entries that are not public, not for guests, newer or out of bounds are never usable',()=>{
 const base=S.get('darknet-district');
 for(const bad of [{availability:'dev'},{availability:'retired'},{guest:false},{version:2},{spawn:{frame:'district',x:0,z:200}},{spawn:{frame:'district',x:NaN,z:30}},{spawn:{frame:'space',x:0,z:30}},{spawn:{frame:'district',x:0,z:30,face:[99,0]}}])
  assert.equal(S.usable({...base,...bad}),false,JSON.stringify(bad));
 assert.equal(S.usable(base),true);
});
test('generated links round-trip and carry nothing but the id and version',()=>{
 for(const e of S.list()){const url=S.link(e.id,'https://thedarknetdistrict.com/void-runner.html?save=1#x');
  assert.equal(url,'https://thedarknetdistrict.com/void-runner.html?'+(e.type==='location'?'visit':'scenario')+'='+e.id+'&v=1');
  const r=S.parse(new URL(url).search);assert.ok(r.ok);assert.equal(r.entry.id,e.id);}
 assert.equal(S.link('nope'),null);
 assert.deepEqual(S.search('vr','scenario').map(e=>e.id).sort(),['vr-bedroom','vr-forest','vr-tropical']);
 assert.equal(S.search('meridian','location')[0].id,'meridian');assert.deepEqual(S.search('zzz-none'),[]);
});
test('District spawns stand on open floor inside the District and can reach Iris and the arcade',()=>{
 const L=N.layout();
 for(const e of S.entries.filter(e=>e.spawn)){const [x,z]=N.toWorld(e.spawn.x,e.spawn.z);
  assert.equal(E.blocked(x,z,L),false,e.id+' spawn not inside a wall');assert.equal(N.zone({x,z}).area,'district',e.id+' inside the District');
  // Doors are open in a guest session (districtDoor/districtBadge), so walk the plan without them.
  const open={...L,solids:L.solids.filter(s=>!/^district(-inner)?-door$/.test(s.id))},S2=.5,seen=new Set([x.toFixed(1)+','+z.toFixed(1)]),q=[[x,z]];
  for(let i=0;i<q.length&&i<60000;i++){const [cx,cz]=q[i];for(const [dx,dz] of [[S2,0],[-S2,0],[0,S2],[0,-S2]]){const nx=cx+dx,nz=cz+dz,k=nx.toFixed(1)+','+nz.toFixed(1);if(seen.has(k)||E.blocked(nx,nz,open))continue;seen.add(k);q.push([nx,nz]);}}
  for(const id of ['district-iris','district-vr']){const it=L.interactions.find(i=>i.id===id);assert.ok(q.some(([cx,cz])=>Math.hypot(cx-it.position[0],cz-it.position[2])<=it.range),e.id+' reaches '+id);}
 }
 // The VR terminal spot guest-mode.js uses is open floor too.
 const [tx,tz]=N.toWorld(-5,36);assert.equal(E.blocked(tx,tz,L),false);
});
test('the page loads the guest guard right after game.js, before anything else captures save(), and the panel after dev tools',()=>{
 const html=read('void-runner.html'),order=[...html.matchAll(/src="void-runner\/([^"]+)"/g)].map(m=>m[1]);
 const at=f=>order.indexOf(f);
 assert.equal(at('share-registry.js'),at('game.js')+1);assert.equal(at('guest-mode.js'),at('game.js')+2);
 for(const f of ['flight-skirmish.js','vr-core.js','dev-test.js','dev-tools.js','menu.js','account.js'])assert.ok(at(f)>at('guest-mode.js'),f+' after the guard');
 assert.ok(at('share-panel.js')>at('dev-test.js')&&at('share-panel.js')<at('bootstrap.js'));
 assert.ok(html.includes('void-runner/share.css'));
 assert.equal(read('static/void-runner.html'),html,'static copy is byte-identical');
});
test('guest mode never writes storage, never evaluates link text, and blocks saves, account, purchases and dev tools',()=>{
 const g=read('void-runner/guest-mode.js'),p=read('void-runner/share-panel.js'),r=read('void-runner/share-registry.js');
 for(const src of [g,p,r]){assert.doesNotMatch(src,/\beval\s*\(|new Function|localStorage\.setItem|sessionStorage\.setItem|innerHTML\s*=\s*[^;]*location\.search/);}
 assert.match(g,/save=function\(\)\{if\(guest\.active\)return false;/);
 assert.match(g,/BLOCKED=\/\^\(menu-continue\|menu-load\|menu-new\|menu-account\|menu-logout\|menu-devtools\|menu-skirmish\|cloud-\|checkout\|account/);
 assert.match(g,/VoidDevTools\.open=function\(\)\{if\(guest\.active\)return;/);
 assert.match(g,/VoidDevTest\.build\(\{location:e\.destination\.location,stage:'open',kit:false\}\)/,'reuses the dev test campaign without the test kit');
 assert.match(read('void-runner/dev-tools.js'),/\['share','Share Links'\]/);
});
