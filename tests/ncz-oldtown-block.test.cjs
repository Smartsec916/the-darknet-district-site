// Old Town's alley-corner block on Main Street (void-runner/ncz-oldtown-block.js; docs/development/NEOCHINATOWN_REMAKE.md): what it stands in for, what it
// must leave alone, and that the walkable city is untouched. How it looks and whether its walls close is checked in a browser (tests/ncz-raygrid-browser.cjs).
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const N=require('../void-runner/neochinatown.js'),Q=require('../void-runner/ncz-quarters.js'),S=require('../void-runner/street-sight.js'),K=require('../void-runner/ncz-oldtown-block.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('the block is Main Street\'s east side from Milked\'s street to the North Gate, with the alley as its one opening',()=>{
 assert.equal(K.enabled,true);const main=N.streets.main,alley=N.streets.alley;assert.equal(main[1],71);assert.deepEqual(K.ALLEY,[alley[2],alley[3]]);
 assert.deepEqual(K.UNITS.map(u=>u[0]),['corner-south','bridge','corner-north','mid','gate-end']);
 for(let i=1;i<K.UNITS.length;i++)assert.equal(K.UNITS[i][1],K.UNITS[i-1][2],'buildings meet: '+K.UNITS[i][0]+' starts where '+K.UNITS[i-1][0]+' ends');
 assert.equal(K.UNITS[0][1],N.milked.LANE[3],'starts at Milked\'s side street');assert.equal(K.UNITS[4][2],Q.gate('north').rect[3],'ends behind the North Gate');
 const w=K.WALLS.find(w=>w.id==='main-east-block'),o=K.OPENINGS[0];assert.equal(o.wall,w.id);assert.ok(Math.abs((w.a[1]-o.from)-alley[3])<1e-9&&Math.abs((w.a[1]-o.to)-alley[2])<1e-9,'the opening is exactly the alley mouth');
 for(const u of K.UNITS)if(u[0]!=='bridge')assert.ok(u[3]>=w.height,u[0]+' is at least as tall as the wall the check expects');
});
test('it draws only: collision, streets, interactions and the sight rectangles are what they were',()=>{
 const src=read('void-runner/ncz-oldtown-block.js');assert.doesNotMatch(src,/solids|interactions|walkingLocation|VoidExplorer/,'the block never touches the layout');
 const L=N.layout('street','oldtown');assert.ok(!L.solids.some(s=>/port|block-remake/.test(s.id)));
 assert.deepEqual(S.open(N).length,Object.keys(N.streets).length+(N.footprints.club?1:0),'street-sight rectangles unchanged');
 // the bridge is above head height over the alley mouth: the alley is still a street the sight rule can see along
 assert.equal(S.sees(S.open(N),{x:61,y:1.7,z:-58.5},{x:120,z:-58.5}),true);
});
test('what it stands in for, and what it leaves',()=>{
 const r=K.replaces;
 assert.equal(r('old-building',[76.9,10,-49.6]),true,'the plot north of the alley');assert.equal(r('old-building',[75.8,10,-65]),true,'the plot south of the alley');assert.equal(r('batch',[71.07,8,-40]),true,'its windows');
 assert.equal(r('alley-building-side',[71,8,-51.3]),true,'the alley brick\'s return along Main Street stood in front of the new shopfronts');assert.equal(r('alley-building-side',[84,8,-51.3]),false);
 assert.equal(r('storefront',[71.05,1.6,-40]),true);assert.equal(r('awning',[70.4,3.4,-40]),true);assert.equal(r('shop-sign-3',[70.75,5.2,-47]),true);assert.equal(r('blade-sign',[70,8,-35]),true);assert.equal(r('floor-wash',[69.4,.2,-35]),true);
 // never: the alley's own walls and fittings, the advertisement boards and kiosks (another agent's work), the pavement, cables, the other side of the street, other blocks
 for(const [n,p] of [['alley-building',[76,7,-55.3]],['alley-south',[90,6.5,-61.8]],['alley-pipe',[76,6,-55.65]],['billboard',[70.7,11,-40]],['billboard-frame',[70.85,11,-40]],['kiosk-frame',[68.4,1.45,-40]],['kiosk-ad',[68.2,1.55,-40]],['sidewalk',[69.5,.09,-40]],['cable',[0,0,0]],
   ['storefront',[50.95,1.6,-40]],['old-building',[76.9,10,-80]],['old-building',[95,10,-40]],['shop-sign-1',[70.75,5.2,-100]],['batch',[76,7,-58.5]],['club-sign',[51.08,6.1,-58.5]],['old-building',[76.9,10,-10]]])assert.equal(r(n,p),false,n+' at '+p);
 const n=read('void-runner/neochinatown.js');assert.match(n,/\[Block\] the remade Old Town block could not be built; the old block is used/);assert.match(n,/QK==='oldtown'&&root\.VoidOldTownBlock\?\.build/);
});
test('existing assets only: no modelled kit props, the game\'s own shop names, the palette as published',()=>{
 const src=read('void-runner/ncz-oldtown-block.js'),old=read('void-runner/neochinatown.js');assert.match(src,/models:false/);assert.doesNotMatch(src,/\.glb|loadContainer/);
 const names=[...src.matchAll(/\[\[('[^\]]+')\],'#/g)].flatMap(m=>m[1].split(',').map(s=>s.replace(/'/g,'')));assert.ok(names.length>=8);
 for(const w of names)assert.ok(old.includes(w),'"'+w+'" is a name the street already carries');
 assert.deepEqual(Object.keys(K.PALETTE),['sodium','window','teal','lantern','pink','fog']);for(const v of Object.values(K.PALETTE))assert.match(v,/^#[0-9a-f]{6}$/);
 const h=read('void-runner.html'),at=f=>h.indexOf('src="void-runner/'+f+'"');assert.ok(at('ncz-kit.js')<at('ncz-oldtown-block.js')&&at('ncz-oldtown-block.js')<at('neochinatown.js'));
});
test('city-wide fix: a building\'s body is judged by the building rule, like its windows and roof (front-row buildings were being left out of every quarter)',()=>{
 const n=read('void-runner/neochinatown.js');assert.match(n,/roofPiece=\/\^\(water-tank\|dish\|old-building\)\$\//);
 // what the rule decides for a front-row plot beside the landing pad and one on Main Street: far more than the 2.6 m detail margin from the street, well inside the 45 m building margin
 for(const [q,x,z] of [['port',7,-96],['port',25,-80],['oldtown',45,-90],['oldtown',77,-37.7],['avenue',80,-27]]){assert.equal(Q.keepDetail(q,x,z),false,'detail rule drops '+q+' '+x+','+z);assert.equal(Q.keepBuilding(q,x,z),true,'building rule keeps it');}
});
