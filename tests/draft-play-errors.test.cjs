/* PLAY (21 Nov 2026, the owner: "playing the draft isn't working ... nothing at all"): an error before the draft session starts is shown in the editor's status line. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'..','void-runner','mission-editor.js'),'utf8');
test('every PLAY goes through a wrapper that reports what stopped it',()=>{
 assert.match(s,/async function play\(key,stepId,opt=\{\}\)\{try\{return await playNow\(key,stepId,opt\);\}catch\(e\)\{/);
 assert.match(s,/status='PLAY could not start: '/);assert.match(s,/async function playNow\(key,stepId,opt=\{\}\)\{/);
 assert.equal((s.match(/async function play\(/g)||[]).length,1);});
