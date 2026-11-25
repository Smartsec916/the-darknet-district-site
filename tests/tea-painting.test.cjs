// The underground tea room's two additions (the owner, 20 Nov 2026): his painting (a white cat among cherry blossoms) on the service nook's north wall above the sink,
// and the sign 表と裏 on the partition above the tea room host. The tea room module builds both; the painting file ships with the site and is cached by the game.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=f=>path.join(ROOT,f),read=f=>fs.readFileSync(R(f),'utf8');
const M=require(R('void-runner/modules.js')),BP=require(R('tools/assets/build-pages.cjs'));
const FILE='void-runner/assets/textures/paintings/tea-room-cat-painting.jpg';
const teaBuild=()=>{const b=read('void-runner/module-build.js'),i=b.indexOf("'tea-under'(mod,t)"),j=b.indexOf("'card-room'(mod,t)",i);assert.ok(i>0&&j>i);return b.slice(i,j);};

test('the tea room builds the owner\'s painting: his file, facing the room, on the nook\'s north wall above the sink, framed flush, with a picture lamp',()=>{
 const src=teaBuild();assert.match(src,/tex:'paintings\/tea-room-cat-painting\.jpg'/);
 const [,px,py,pz,pw,ph]=/const px=([\d.]+),py=([\d.]+),pz=([\d.]+),pw=([\d.]+),ph=([\d.]+);plane\(pm,pw,ph,\[px,py,pz\],0\)/.exec(src).map(Number);
 const t=M.TYPES['tea-under'],sink=t.furn.find(f=>f[5]==='sink'),part=t.furn.find(f=>f[5]==='partition');
 assert.ok(pz>2.85&&pz<2.9,'on the north wall (z 2.9), its front (-z, rotation 0) toward the room');assert.ok(Math.abs(pw/ph-768/1024)<.01,'the picture\'s own 3:4 proportions (not stretched)');
 assert.ok(px+pw/2<2.9&&px-pw/2>part[1]+.05,'between the end of the partition and the east wall');assert.equal(px,1.91,'the owner moved it 0.45 m to the viewer\'s left (from 2.36), 23 Nov 2026');assert.ok(px+pw/2+.035<sink[1],'its frame ends inside the nook');assert.ok(px-pw/2-.035>part[1]+.3,'clear of the partition\'s end');assert.ok(py-ph/2>sink[4]+.2,'clear above the sink');
 assert.match(src,/box2\(dw,x0,x1,y0,y1,pz-\.004,2\.9\)/,'the frame runs from the wall to just in front of the picture');assert.match(src,/picture-lamp/);
 const j=fs.readFileSync(R(FILE));assert.equal(j.readUInt16BE(0),0xffd8,'a JPEG');});

test('the painting ships with the site and is cached by the game',()=>{
 assert.equal(BP.publishable(FILE),true,'build-pages.cjs publishes it');
 const sw=read('void-runner-sw.js'),allowed=new RegExp(/const allowed=\/(.*)\/i;/.exec(sw)[1],'i'),large=new RegExp(/const large=\/(.*)\/i;/.exec(sw)[1],'i');
 assert.ok(allowed.test('/'+FILE)&&large.test('/'+FILE),'the service worker caches it (assets cache)');});

test('the sign 表と裏 is the owner\'s text, centred over the host on the partition, above his head, with a CJK font list',()=>{
 const src=teaBuild();assert.ok(src.includes("g.fillText('表と裏',"),'exactly his three characters');assert.match(src,/Noto Sans CJK JP|Noto Serif CJK JP/);
 const [,sx,sw2,sy,sh]=/const sx=([\d.]+),sw2=([\d.]+),sy=([\d.]+),sh=([\d.]+);plane\(sm,sw2\*2,sh,\[sx,sy,1\.494\],0\)/.exec(src).map(Number);
 assert.ok(Math.abs(sw2*2/sh-3)<.01,'the board keeps its texture\'s 3:1 (768 x 256): no stretched glyphs');
 assert.match(src,/shojiWall\('n',-2\.6,-\.1,3,1\.42,\.6,2\.0\)/,'the paper panel on the partition stands to 2.0 m, 8 cm in front of it');assert.ok(sy-sh/2>2.0,'the sign hangs above that panel (it hid the sign\'s left end)');
 const t=M.TYPES['tea-under'],host=t.spots.find(s=>s[0]==='host'),part=t.furn.find(f=>f[5]==='partition');
 assert.equal(sx,host[1],'centred over the host');assert.ok(1.494<part[2]&&1.494>part[2]-.02,'on the partition\'s room-side face');assert.ok(sy-sh/2>1.8,'its bottom above a standing man\'s head');assert.ok(sy+sh/2+.02<=part[4],'below the partition\'s top');
 // the counter's lantern [x, z, centre y; body ±0.25] never crosses the sight line to the sign from the seats (plan.seats, eye 1.1 seated / 1.7 standing) or the door
 const L=(/lantern\((-?[\d.]+),(-?[\d.]+),([\d.]+),Ch,lamp,\.3\)/g),all=[...src.matchAll(L)].map(m=>m.slice(1).map(Number)),lan=all.find(([x,z])=>z>-.5&&z<.9);assert.ok(lan,'the counter lantern');
 const eyes=[...t.plan.seats.map(([x,z])=>[x,z,1.1]),...t.plan.seats.map(([x,z])=>[x,z,1.7]),[.1,-2.3,1.7]];
 for(const [ex,ez,ey] of eyes)for(const [tx,ty] of [[sx-sw2,sy-sh/2],[sx+sw2,sy-sh/2],[sx-sw2,sy+sh/2],[sx+sw2,sy+sh/2],[sx,sy]]){if(ez>=lan[1])continue;const k=(lan[1]-ez)/(1.494-ez),x=ex+(tx-ex)*k,y=ey+(ty-ey)*k;
  assert.ok(Math.abs(x-lan[0])>.17||y<lan[2]-.26||y>lan[2]+.26,'the lantern hides the sign from '+[ex,ez,ey]);}});
