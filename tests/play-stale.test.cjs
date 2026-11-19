/* PLAY straight after typing (19 Nov 2026 fix): every play / check path in the Mission Editor reads the saved draft, never the trees drawn before the typing.
   The browser walkthrough is tests/play-stale-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'..','void-runner','mission-editor.js'),'utf8');
const body=name=>{const i=s.indexOf(name);assert.ok(i>=0,name);return s.slice(i,s.indexOf('\n',i));};
test('one shared helper: the field being typed in hands over its value, the trees are rebuilt from the saved draft, the waiting Guide me pass runs now',()=>{
 const f=body(' function fresh(){');assert.match(f,/a\.blur\(\)/);assert.match(f,/if\(src\)rebuild\(\)/);assert.match(f,/clearTimeout\(guideT\);guideT=0;guideNow\(\)/);});
test('PLAY THIS DRAFT, PLAY FROM HERE, Test my mission / PLAY IT NOW and JUMP THERE all go through it before checking',()=>{
 const p=s.slice(s.indexOf(' async function play(key,stepId){'));assert.match(p,/^ async function play\(key,stepId\)\{\n  fresh\(\);const f=findMission\(key\)/);
 assert.match(body('  playTree(id,step){'),/playTree\(id,step\)\{return play\('tree:'\+id,step\|\|null\);\}/);
 assert.match(body(' async function jumpTo('),/return;fresh\(\);const content=draftContent\(\)/);
 for(const m of s.matchAll(/btn\('PLAY THIS DRAFT(?: FROM HERE)?',\(\)=>(\w+)\(/g))assert.equal(m[1],'play');});
test('publish and the server check never send a draft that changed since the check screen was drawn',()=>{
 assert.match(s,/const changedSince=\(\)=>\{fresh\(\);if\(JSON\.stringify\(draftContent\(\)\)===JSON\.stringify\(content\)\)return false;/);
 assert.match(s,/btn\('ASK THE SERVER TO CHECK',async\(\)=>\{if\(changedSince\(\)\)return;/);assert.match(s,/btn\('PUBLISH TO ALL PLAYERS',async\(\)=>\{if\(changedSince\(\)\)return;/);});
test('the PLAY buttons follow every keystroke (not only after Guide me pauses), and a status line never redraws the editor under the cursor',()=>{
 assert.match(s,/root_\.addEventListener\('input',\(\)=>\{syncPlay\(root_\);guideSoon\(\);\}\)/);assert.match(s.slice(s.indexOf(' function syncPlay(sc){'),s.indexOf(' function syncPlay(sc){')+600),/MC\(\)\.treeBlockers\(m,givers,items\)/);
 assert.match(body(' const setStatus=t=>{'),/if\(s_\)\{s_\.textContent=t;return;\}const m=host&&host\.querySelector\('#me-root > \.me-modes'\);if\(m\)m\.after\(/);});
