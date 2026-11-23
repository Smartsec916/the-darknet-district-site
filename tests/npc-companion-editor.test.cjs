const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/npc-editor.js'),'utf8');
test('NPC importer offers .vrcompanion while retaining GLB and glTF',()=>{
 assert.match(source,/f\.accept='\.glb,\.gltf,\.vrcompanion,/);
 assert.match(source,/ensureCompanionImporter\(\)/);
 assert.match(source,/\.inspect\(file\)/);
 assert.match(source,/X\(\)\.importDocument\(await model\.arrayBuffer\(\),transfer\?'\.glb':ext\)/);
});
test('companion import stores extracted model plus the original full transfer locally',()=>{
 assert.match(source,/blob:model,transferBlob:original,companion/);
 assert.match(source,/if\(rec\.transferBlob\)download\(rec\.sourceFileName,rec\.transferBlob\)/);
 assert.match(source,/data-npc-companion-profile/);
 assert.match(source,/missingVoiceLines/);
 assert.match(source,/LOCAL TEST ONLY/);
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
