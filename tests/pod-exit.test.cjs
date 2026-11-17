/* Leaving the Sleeping Pod with the mouse held must not open the pause menu (the owner, 16 Nov 2026). The browser test is tests/pod-exit-browser.cjs. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('a release of the mouse the game asked for counts as the game\'s, whichever element held it',()=>{
 const m=read('void-runner/mouse-control.js');
 assert.match(m,/document\.exitPointerLock=function\(\)\{if\(document\.pointerLockElement\)gameReleased=true;/,'the pod holds the mouse on #pod-wake, not on the canvas');
 assert.ok(!/if\(locked\(\)\)gameReleased=true/.test(m));
});
test('the pod releases the mouse through document.exitPointerLock before it leaves',()=>{
 const w=read('void-runner/world-integration.js');
 assert.match(w,/c\.action==='exit'\|\|c\.action==='vend'\)\{if\(document\.pointerLockElement===podWake\)document\.exitPointerLock/);
 assert.match(w,/pick!=='look'&&document\.pointerLockElement===podWake\)document\.exitPointerLock/);
});
test('a late "mouse taken" event from the pod\'s own screen is not an Esc either',()=>{
 const m=read('void-runner/mouse-control.js');
 assert.match(m,/if\(document\.pointerLockElement\)\{if\(fps\(\)\)document\.exitPointerLock\(\);return;\}/);
});
