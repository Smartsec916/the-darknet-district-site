const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/npc-editor.js'),'utf8');
test('NPC importer offers .vrcompanion while retaining GLB and glTF',()=>{
 assert.match(source,/f\.accept='\.glb,\.gltf,\.vrcompanion,/);
 assert.match(source,/ensureCompanionImporter\(\)/);
 assert.match(source,/\.inspect\(file\)/);
 assert.match(source,/X\(\)\.importDocument\(await model\.arrayBuffer\(\),transfer\?'\.glb':ext\)/);
});
test('companion import stores the original transfer privately and exports a repacked updated transfer',()=>{
 assert.match(source,/blob:model,transferBlob:original,companion/);
 assert.match(source,/companionExport=await importer\.repack\(rec\.transferBlob,\{\.\.\.rec\.companion,name:rec\.name\},rec\.blob\)/);
 assert.match(source,/if\(companionExport\)download\(rec\.sourceFileName,companionExport\)/);
 assert.match(source,/data-npc-companion-profile/);
 assert.match(source,/missingVoiceLines/);
 assert.match(source,/Local import draft/);
 assert.match(source,/PUBLISH NPC TO GAME/);
});
test('companion script loading stays behind the developer-only import UI',()=>{
 assert.match(source,/async function ensureCompanionImporter/);
 assert.match(source,/void-runner\/vr-companion-studio\.js/);
 assert.match(source,/void-runner\/npc-companion-import\.js/);
 assert.doesNotMatch(source,/autoPublishCompanion|uploadCompanionToServer/);
});

test('imported NPC personality JSON has prompt, validation, save, and inline failures',()=>{
 assert.match(source,/data-npc-personality-json/);
 assert.match(source,/data-npc-personality-prompt/);
 assert.match(source,/data-npc-personality-import/);
 assert.match(source,/VoidVRCompanionStudio\.profile\(JSON\.parse\(area\.value\)\)/);
 assert.match(source,/rec\.companion\.missingVoiceLines\.length/);
 assert.match(source,/data-npc-personality-error/);
});
