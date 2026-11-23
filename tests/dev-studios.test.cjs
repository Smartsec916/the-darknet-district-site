/* SHOP HERE, ad playlists, the sound library, cinematic shots and skirmish practice. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const S=require(R('void-runner/dev-studios.js')),M=require(R('void-runner/music-score.js')),A=require(R('void-runner/ad-screens-data.js'));
const html=fs.readFileSync(R('void-runner.html'),'utf8');

test('a tonic refreshes, stays under the cap, and expires',()=>{
 const a=S.buy(100,null,'sprint',1000);assert.equal(a.ok,true);assert.equal(a.credits,60);assert.equal(S.moveMul(a.flag,1001),1.2);
 const b=S.buy(a.credits,a.flag,'sprint',1005);assert.equal(b.credits,20);assert.equal(S.read(b.flag,1006).amount,.2);
 assert.equal(S.moveMul('sprint:0.9:'+(1000+90),1001),1.25);assert.equal(S.read(a.flag,1000+91),null);
 assert.equal(S.buy(10,null,'sprint',1).ok,false);assert.match(S.buy(10,null,'nope',1).why,/not for sale/);
});

test('a playlist only uses existing ads and does not blank a screen',()=>{
 const ids=A.ADS.slice(0,2).map(a=>a.id),spec={id:'night',order:'ordered',ids,location:'neochinatown'};
 assert.deepEqual(S.playlistProblems(spec,A.ADS.map(a=>a.id)),[]);
 assert.match(S.playlistProblems({...spec,ids:['not-an-ad']},A.ADS.map(a=>a.id)).join(' '),/existing/);
 const slots=[{type:'ad',ad:{id:ids[0]}},{type:'ad',ad:{id:'other'}},{type:'break',n:0}];
 const out=S.filterProgramme(slots,spec);assert.ok(out.some(s=>s.ad&&s.ad.id===ids[0]));assert.equal(S.filterProgramme(slots,{id:'x',order:'ordered',ids:['missing']}).length,slots.length);
});

test('the sound library lists recorded areas, a shot needs a place, and a networked skirmish lobby is refused',()=>{
 const lib=S.soundLibrary(M);assert.ok(lib.find(t=>t.id==='neochinatown'&&t.file));assert.deepEqual(S.mixProblems({music:1,ambient:0}),[]);
 assert.deepEqual(S.shotProblems({id:'gate',place:'district-store',x:8,z:48,yaw:0,hideHud:true}),[]);
 assert.match(S.shotProblems({id:'Gate',place:'',x:900,z:0,yaw:0,hideHud:'yes'}).join(' '),/place/);
 const net=S.practice({network:true});assert.equal(net.ok,false);assert.match(net.why,/multiplayer|service/);
 assert.deepEqual(S.practice({difficulty:'normal'}),{ok:true,credits:false,campaign:false});
 assert.ok(html.includes('dev-studios.js')&&html.indexOf('dev-studios.js')<html.indexOf('neochinatown.js'));
 assert.equal(html,fs.readFileSync(R('static/void-runner.html'),'utf8'));
 assert.match(fs.readFileSync(R('void-runner/neochinatown.js'),'utf8'),/SHOP HERE/);
 assert.match(fs.readFileSync(R('void-runner/dev-tools.js'),'utf8'),/'studios','Studios'/);
});
