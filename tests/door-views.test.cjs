/* The doors into and out of interiors (the owner, 20 Nov 2026): one shared sliding-door timing, the next place shown in the doorway as the door opens (both directions,
   everywhere: street door, hallway, apartment, module locations, the tunnels' stair and checkpoint doors), a short fade only once the door is open, and doors that never
   close on the player. The pictures are baked by tools/door-views/bake.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
function views(){const ctx={globalThis:{},console};ctx.globalThis=ctx;vm.runInNewContext(read('void-runner/door-views.js'),ctx);return ctx.VoidDoorViews;}

test('one timing for every sliding door: about 0.5-0.8 s to open, open before the fade, held about 1.5 s',()=>{
 const A=require(R('void-runner/apartments.js')),D=A.DOOR;assert.ok(D.open>=.5&&D.open<=.8,'open '+D.open);assert.ok(Math.abs(D.hold-1.5)<.01);assert.ok(D.wait>=D.open*.95,'the fade waits for the door');
 assert.ok(D.fadeIn<=.25&&D.fadeOut<=.4,'a short fade');
 assert.match(read('void-runner/apartment-build.js'),/hold=root\.VoidApartments\?\.DOOR\?\.hold\?\?1\.5,dur=root\.VoidApartments\?\.DOOR\?\.open\?\?\.6/,'the slider takes the shared timing');
 for(const f of ['apartment-integration.js','module-integration.js','ncz-underground-integration.js']){const s=read('void-runner/'+f);assert.ok(!/setTimeout\(\(\)=>(enterFlat|backToHall|backToStreet|cross|go)\([^)]*\)\)?,(450|350)\)/.test(s),f+': no fixed wait');assert.match(s,/DOOR/,f);}
 // a module door near the player never shuts (the leaves keep open while he is in the doorway)
 assert.match(read('void-runner/module-build.js'),/\|\|dx\*dx\+dz\*dz<\.81\)/);
});

test('door views: every key is baked, small, and every kind of door shows one',()=>{
 const V=views();assert.ok(V.KEYS.length>=30);
 for(const k of V.KEYS){const f=R('void-runner/art/door-views/'+k+'.webp');assert.ok(fs.existsSync(f),'baked: '+k);const n=fs.statSync(f).size;assert.ok(n>1500&&n<90000,k+' '+n+' bytes');}
 assert.equal(V.street('nowhere'),'street-avenue');assert.equal(V.mod('nope'),'mod-corp');assert.equal(V.housing('apt','luxury'),'apt-luxury');
 const html=read('void-runner.html'),i=f=>html.indexOf('void-runner/'+f+'"');assert.ok(i('door-views.js')>0&&i('door-views.js')<i('apartment-build.js')&&i('door-views.js')<i('module-build.js'));
 const ab=read('void-runner/apartment-build.js');assert.match(ab,/DV\.street\(streetQ\)/,'hallway street door: the street');assert.match(ab,/DV\.housing\('apt',style\)/,'hallway door: the apartment');assert.match(ab,/DV\.housing\('hallx',style\)/,'apartment door: the hallway');
 assert.match(read('void-runner/apartment-integration.js'),/aptst-view-/,'street doors: the hallway / first room');
 const mb=read('void-runner/module-build.js');assert.match(mb,/return 'landing'/);assert.match(mb,/DV\.street\(/);assert.match(mb,/'checkpoint'/);
 assert.match(read('void-runner/ncz-backalleys.js'),/vc\.get\('checkpoint'\)/,'the tunnels\' stair door: the checkpoint');assert.match(read('void-runner/ncz-underground-integration.js'),/underDoor/);
});
