/* A look loaded in one place and released with it (VoidAssets.release on every change of place) is loaded again when it is asked for in the next place
   (the owner, 18 Nov 2026: back in The Darknet District after Mission 002, Admin was on his old look and Iris and Nyx were stand-in figures). */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
test('ensureLook: a released look is loaded again; a look still loaded is not; one download at a time',async()=>{
 const containers=new Map();let loads=0;
 globalThis.VoidCharacterAppearance={CATALOG:{looks:{},hair:{}}};globalThis.VoidCharacterFit={};
 globalThis.VoidAssets={container:id=>containers.get(id)||null,load:async id=>{loads++;await new Promise(r=>setTimeout(r,5));containers.set(id,{id});return containers.get(id);},release(){containers.clear();}};
 delete require.cache[require.resolve('../void-runner/character-assembler.js')];require(path.join(__dirname,'..','void-runner','character-assembler.js'));
 const A=globalThis.VoidCharacterAssembler,scene={};
 const [a,b]=await Promise.all([A.ensureLook('npc-admin',scene),A.ensureLook('npc-admin',scene)]);assert.equal(a,'crowd:npc-admin');assert.equal(b,a);assert.equal(loads,1,'one download for two asks');
 await A.ensureLook('npc-admin',scene);assert.equal(loads,1,'still loaded: nothing downloaded');
 VoidAssets.release();   // the player walks out to the street
 assert.equal(await A.ensureLook('npc-admin',scene),'crowd:npc-admin');assert.equal(loads,2,'loaded again after the place was released');assert.ok(VoidAssets.container('crowd:npc-admin'),'the model is there to be drawn');
});
