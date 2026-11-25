// Luna (21 Nov 2026): a female VR companion from the owner's own Meshy dancer (made standing in an A-pose, rigged and given the female companion clips).
// Her registry entry, the clips her file carries, her gallery picture, her DRAFT lines and pending voice, and that she stays a VR-bedroom companion only.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=f=>path.join(ROOT,f),read=f=>fs.readFileSync(R(f),'utf8');
const C=require(R('void-runner/vr-companions.js')),CR=require(R('void-runner/crowd.js'));
const glb=f=>{const b=fs.readFileSync(R(f));assert.equal(b.readUInt32LE(0),0x46546c67,'a binary glTF');const n=b.readUInt32LE(12);return JSON.parse(b.slice(20,20+n).toString('utf8'));};
const FEMALE=['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'];

test('Luna is registered as a female companion on her own model, offered at the terminal on the live site',()=>{
 const e=C.get('luna');assert.ok(e,'registered');
 assert.equal(e.name,'Luna');assert.equal(e.sex,'female');assert.equal(e.model,'npc-luna');assert.equal(C.file(e),'npc-luna.glb');
 assert.ok(!e.licensed,'the owner\'s own Meshy generation, not a purchased model kept in the private repository');
 assert.ok(C.offered(e,'thedarknetdistrict.com'),'offered on the live site');assert.ok(!e.pairable,'not offered as part of a pair');
 assert.ok(typeof e.about==='string'&&e.about.length>=30);assert.ok(Object.keys(e.personality).length);
 assert.match(e.name,/^[a-zA-Z][\w-]{0,63}$/,'the name goes into story.met, which the save validator checks');
 const [one]=C.list({sex:'female',has:m=>CR.clips[m]||[],installed:{'npc-luna':true}}).filter(x=>x.id==='luna');assert.equal(one.usable,true,one.reason);
 assert.equal(C.resolve({companion:'luna'}).id,'luna');assert.equal(C.resolve({choice:'f'}).id,'nadia','old saves asking for the female companion still get Nadia');
});

test('her file carries every clip crowd.js lists for her (the female companion set, the bedroom\'s required clips) on the 24-joint Meshy rig',()=>{
 const j=glb('void-runner/assets/models/crowd/npc-luna.glb'),names=j.animations.map(a=>a.name);
 assert.deepEqual(CR.clips['npc-luna'],FEMALE,'the same set as the female companion figure');assert.deepEqual(names,FEMALE,'clip names without Blender .001 suffixes');
 for(const c of C.requiredClips)assert.ok(names.includes(c),'required clip '+c);
 const e=C.get('luna');for(const role of Object.keys(e.clips))assert.ok(FEMALE.includes(C.clipFor(e,role,c=>FEMALE.includes(c))),role);
 const joints=j.skins[0].joints.map(i=>j.nodes[i].name);assert.equal(joints.length,24);assert.ok(joints.includes('mixamorig:Hips')&&joints.includes('mixamorig:Head'),'renamed to the Mixamo names the head tracking uses');
 assert.equal(j.meshes.length,1);assert.ok(fs.statSync(R('void-runner/assets/models/crowd/npc-luna.glb')).size<6e6,'a light file');
 assert.ok(j.images.every(i=>i.mimeType==='image/jpeg'),'JPEG maps');
});

test('her gallery picture is present',()=>{
 const e=C.get('luna');assert.equal(e.preview,'void-runner/assets/vr/companions/luna.jpg');const b=fs.readFileSync(R(e.preview));
 assert.equal(b.readUInt16BE(0),0xffd8,'a JPEG');assert.ok(b.length>5000&&b.length<120000,'a small picture: '+b.length);
});

test('her lines are her own DRAFT placeholders in every pool the bedroom uses; her voice waits for the owner (shown, not read aloud)',()=>{
 const e=C.get('luna'),kai=C.get('kai');assert.deepEqual(Object.keys(e.dialogue).sort(),Object.keys(kai.dialogue).sort());assert.equal(C.speaks(e),true);
 const others=new Set([...C.companions.values()].filter(x=>x.id!=='luna').flatMap(x=>Object.values(x.dialogue).flat()));
 for(const t of Object.values(e.dialogue).flat()){assert.ok(!others.has(t),'borrows another companion\'s line: '+t);assert.ok(t.length<=200);}
 assert.equal(e.voice.pending,true);assert.equal(e.voice.voiceId,null);assert.equal(e.voice.characterId,'vr-luna');
 const src=read('void-runner/vr-companions.js');assert.match(src,/Luna[\s\S]{0,400}PROPOSED \/ DRAFT/,'marked for the owner\'s review');
 assert.match(read('void-runner/vr-suite.js'),/unvoiced:!!comp\.who\.voice\?\.pending/,'the bedroom shows her lines without reading them aloud');
 assert.match(read('void-runner/talk-choice.js'),/l\.silent\|\|l\.unvoiced/);assert.match(read('tools/audio/extract-lines.cjs'),/if\(!e\.voice\?\.pending\)/,'no recordings are made for her');
 const manifest=JSON.parse(read('void-runner/assets/audio/voice/manifest.json'));assert.ok(!Object.values(manifest.lines).some(l=>l.speaker==='vr-luna'),'no recordings');
 assert.equal(JSON.parse(read('tools/audio/npc-voice-registry.json')).npcs['vr-luna'],undefined,'no voice cast');
});

test('she is a VR-bedroom companion only: never a street, crowd, District or floor-pose figure; her clips are adult-only for the editors',()=>{
 for(const [k,list] of Object.entries(CR.casts))assert.ok(!list.includes('npc-luna'),'cast '+k);for(const [k,list] of Object.entries(CR.pools))assert.ok(!list.includes('npc-luna'),'pool '+k);
 assert.ok(!CR.street['npc-luna']&&!CR.monks.includes('npc-luna'));for(const q of ['oldtown','avenue','outskirts','port','far-south',null])assert.ok(!CR.streetFigures(q,'high').includes('npc-luna'));
 assert.deepEqual(Object.keys(CR.models('neochinatown','high','all')).filter(k=>/luna/.test(k)),[],'never loaded with NeoChinatown or the District');
 for(const c of [...CR.FLOOR,...CR.FLOOR_MOVES])assert.ok(!CR.clips['npc-luna'].includes(c),'no floor pose '+c);
 const P=require(R('void-runner/npc-paths.js'));for(const id of ['grey-reverie','ethereal-lace']){const off=P.libraryOffer(id).filter(o=>o.source==='npc-luna');assert.deepEqual(off,[],'retired character has no rig or clip offers');}
 const people=require(R('void-runner/district-people.js'));assert.ok(!JSON.stringify(people.NPCS||[]).includes('npc-luna'),'not a District resident');
});

test('build bumped',()=>{assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);});
