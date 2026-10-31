// NeoChinatown's upgraded blocks (purchased Cyberpunk City pack): presentation only. The layout (streets, collision,
// interactions, taxi zones) is identical with or without them, the pack is only requested on a local development
// server, and block A sits inside its city block, clear of the sidewalk and the alley mouth.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=host=>{globalThis.location=host?{hostname:host}:undefined;delete require.cache[require.resolve('../void-runner/neochinatown.js')];return require('../void-runner/neochinatown.js');};

test('the pack is requested only on a local development server',()=>{
 for(const host of [undefined,'thedarknetdistrict.com','smartsec916.github.io'])assert.ok(!Object.keys(load(host).models).some(k=>k.startsWith('ncz:')),String(host));
 for(const host of ['localhost','127.0.0.1'])assert.deepEqual(Object.keys(load(host).models).filter(k=>k.startsWith('ncz:')).sort(),['ncz:building5','ncz:storefronts']);
 load(undefined);
});

test('the layout is the same whether or not the pack is installed',()=>{
 const pub=load('thedarknetdistrict.com').layout(),dev=load('127.0.0.1').layout();
 assert.deepEqual(dev,pub);load(undefined);
});

test('block A stays inside its city block, behind the sidewalk, clear of the alley and every interaction',()=>{
 const N=load(undefined),L=N.layout(),src=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');
 const m=/front=([\d.]+),z0=([-\d.]+),z1=([-\d.]+)/.exec(src);assert.ok(m,'block A definition');const [front,z0,z1]=m.slice(1).map(Number);
 const block=L.solids.find(s=>s.id.startsWith('city-block')&&Math.abs(s.position[0]+s.size[0]/2-front)<.01&&s.position[2]-s.size[2]/2<=z0&&s.position[2]+s.size[2]/2>=z1);
 assert.ok(block,'a solid city block runs along x='+front+' from z '+z0+' to '+z1);
 assert.equal(N.streets.main[0],front,'its front is Main Street\'s west edge');
 const [ax0,ax1,az0,az1]=N.streets.alley;assert.ok(front<ax0,'the alley is across the street');
 for(const i of L.interactions)assert.ok(!(i.position[0]<front&&i.position[0]>front-12&&i.position[2]>z0&&i.position[2]<z1),i.id);
 for(const t of N.taxiZones)assert.ok(!(t.position[0]<=front&&t.position[0]>front-12&&t.position[1]>z0&&t.position[1]<z1),t.id);
});
