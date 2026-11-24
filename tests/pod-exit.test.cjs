/* Leaving the Sleeping Pod with the mouse held must not open the pause menu (the owner, 16 Nov 2026). The browser test is tests/pod-exit-browser.cjs. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
// Drive the production event handler. The browser may deliver the release after the destination has changed.
function input(mode,locked){
 const listeners=new Map(),cleared=[],released=[];
 const doc={hidden:false,pointerLockElement:locked,addEventListener:(name,fn)=>listeners.set(name,fn),
   exitPointerLock(){released.push(this.pointerLockElement);this.pointerLockElement=null;},
   createElement:()=>({style:{}}),body:{append(){}}};
 const ctx={mode,performance,document:doc,addEventListener(){},dispatchEvent(){},Event,clearInput:()=>cleared.push(true),
   MutationObserver:class{observe(){}},requestAnimationFrame(){},openGameMenu(){assert.fail('pointer lock changes must preserve gameplay');}};
 require('node:vm').runInNewContext(read('void-runner/input-state.js'),ctx);
 return {doc,ctx,cleared,released,change:()=>listeners.get('pointerlockchange')()};
}
test('a game-requested release preserves the mode for every element that owned the mouse',()=>{
 for(const id of ['space','pod-wake']){
  const h=input('walking',{id});h.doc.exitPointerLock();h.change();
  assert.equal(h.ctx.mode,'walking');assert.equal(h.cleared.length,1);assert.equal(h.released[0].id,id);
 }
});
test('the pod releases the mouse through document.exitPointerLock before it leaves',()=>{
 const w=read('void-runner/world-integration.js');
 assert.match(w,/c\.action==='exit'\|\|c\.action==='vend'\)\{if\(document\.pointerLockElement===podWake\)document\.exitPointerLock/);
 assert.match(w,/pick!=='look'&&document\.pointerLockElement===podWake\)document\.exitPointerLock/);
});
test('a late "mouse taken" event from the pod\'s own screen is not an Esc either',()=>{
 const pod={id:'pod-wake'},h=input('pod-waking',pod);
 h.change();assert.equal(h.doc.pointerLockElement,pod,'the pod owns the mouse while the player is there');
 h.ctx.mode='walking';h.change();assert.deepEqual(h.released,[pod]);assert.equal(h.ctx.mode,'walking');
 h.change();assert.equal(h.ctx.mode,'walking','the following release also preserves the room');
});

test('Escape after browser capture gives back the cursor and consumes a late unlock once',()=>{
 const h=input('walking',{id:'space'});h.change();
 assert.equal(h.ctx.VoidInputState.freeMouse(),true);
 h.change();assert.equal(h.ctx.VoidInputState.freeMouse(),true);
 assert.equal(h.ctx.VoidInputState.freeMouse(),false);
 assert.deepEqual(h.released.map(el=>el.id),['space']);assert.equal(h.ctx.mode,'walking');
});
