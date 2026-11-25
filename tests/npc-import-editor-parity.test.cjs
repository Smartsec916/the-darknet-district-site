const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const editor=fs.readFileSync(path.join(__dirname,'../void-runner/npc-editor.js'),'utf8');
const adapter=fs.readFileSync(path.join(__dirname,'../void-runner/npc-companion-import.js'),'utf8');

test('NPC file picker accepts studio transfer files while retaining GLB and glTF',()=>{
 assert.match(editor,/\.glb,\.gltf,\.vrcompanion/);
 assert.match(editor,/ensureCompanionImporter\(\)/);
 assert.match(editor,/\.inspect\(file\)/);
});
test('imported personality has ChatGPT prompt and schema-validated JSON editing',()=>{
 assert.match(editor,/COPY CHATGPT PROMPT/);
 assert.match(editor,/VALIDATE & IMPORT JSON/);
 assert.match(editor,/VoidVRCompanionStudio\.profile\(JSON\.parse\(area\.value\)\)/);
});
test('paid voice generation is explicit, developer-authenticated, and never generated during import',()=>{
 assert.match(editor,/GENERATE ALL MISSING VOICES/);
 assert.match(editor,/root\.confirm\('Generate '/);
 assert.match(editor,/dev\.request\('developer\/companion-voice'/);
 assert.match(editor,/DTX\(\)\?\.authorized/);
 assert.match(editor,/await saveRec\(rec\)/);
 const start=editor.indexOf('async function importFile(');
 const end=editor.indexOf('async function saveRec(rec)',start);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(editor.slice(start,end),/developer\/companion-voice/);
});
test('companion package parsing remains local and never silently publishes',()=>{
 assert.match(adapter,/localTestOnly:true/);
 assert.doesNotMatch(adapter,/fetch\(|\.request\(|developer\/live-content/);
});
