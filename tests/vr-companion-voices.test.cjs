const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const C=require('../void-runner/vr-companions.js'),reg=require('../tools/audio/voice-registry.cjs');
const registry=reg.load(),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../void-runner/assets/audio/voice/manifest.json'),'utf8'));
const pools=Object.keys(C.get('seren').dialogue);

test('every companion has a description for the gallery',()=>{
 for(const e of C.companions.values())if(!e.replacedBy)assert.ok(typeof e.about==='string'&&e.about.length>=30,e.id+' has no description');
});

test('every companion speaks: lines in every pool the bedroom uses',()=>{
 for(const e of C.companions.values()){if(e.replacedBy)continue;assert.equal(C.speaks(e),true,e.id);
  for(const p of pools)assert.ok(e.dialogue[p]?.length,e.id+' has no '+p+' lines');}
});

test("women's voices for the women, men's voices for the men, none shared",()=>{
 assert.deepEqual(reg.validate(registry),[]);
 for(const e of C.companions.values()){if(e.replacedBy)continue;const v=registry.npcs[e.voice.characterId];assert.ok(v,e.id+' has no cast voice');
  const kinds=new Set(reg.parseVoice(v.voice).map(([id])=>id[1]));assert.deepEqual([...kinds],[e.sex==='male'?'m':'f'],e.id+' ('+e.sex+') has voice '+v.voice);}
 // Blends must be same-sex and add up to 1.
 assert.ok(reg.parseVoice('am_adam:0.5+am_michael:0.5'));assert.equal(reg.parseVoice('am_adam:0.5+af_sky:0.5'),null);assert.equal(reg.parseVoice('am_adam:0.7+am_michael:0.7'),null);
});

test('every companion line is recorded in its own voice',()=>{
 const have=new Map(Object.values(manifest.lines).map(l=>[l.speaker+'|'+l.text,l]));
 for(const e of C.companions.values()){if(e.replacedBy)continue;
  for(const t of Object.values(e.dialogue).flat()){const l=have.get(e.voice.characterId+'|'+t);assert.ok(l,e.id+' line not recorded: '+t);
   assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/audio/voice',l.file)),e.id+' clip file missing: '+l.file);}}
});
