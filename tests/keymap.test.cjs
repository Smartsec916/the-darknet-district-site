'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../void-runner/keymap.js');
const src=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
function loadInput(saved){
 delete require.cache[require.resolve('../void-runner/input.js')];
 globalThis.localStorage={getItem:()=>saved===undefined?null:JSON.stringify(saved),setItem(k,v){this.last=v;}};
 const I=require('../void-runner/input.js');delete globalThis.localStorage;return I;
}
test('the toggle hint says exactly what to press, and follows the player\'s binding',()=>{
 assert.equal(K.toggleHint({keymap:'KeyK'}),'To hide the KeyMap Press K');assert.equal(K.toggleHint(),'To hide the KeyMap Press K');assert.equal(K.toggleHint({keymap:'KeyJ'}),'To hide the KeyMap Press J');
});
test('every fixed on-foot key listed is really handled by the source file named for it, and the bindable actions really exist in input.js',()=>{
 for(const f of K.FIXED_WALKING)for(const code of f.codes)assert.ok(src(f.src).includes("'"+code+"'")||src(f.src).includes('"'+code+'"')||src(f.src).includes(code+':'),code+' ('+f.label+') is not handled in '+f.src);
 const I=loadInput();for(const id of Object.keys(K.WALKING_BOUND))assert.ok(I.actions[id],id);for(const id of Object.keys(K.FLIGHT_LABEL))assert.ok(I.actions[id],id+' exists');
 for(const id of Object.keys(I.actions))assert.ok(K.FLIGHT_LABEL[id],'flight KeyMap knows the action '+id+' (a new action must be added to the KeyMap)');
 assert.deepEqual(K.DEFAULTS,I.defaults,'the KeyMap defaults mirror input.js');
 assert.equal(I.defaults.keymap,'KeyK');assert.equal(new Set(Object.values(I.defaults)).size,Object.keys(I.defaults).length,'no default key is used twice');
 assert.match(src('mouse-control.js')+src('prologue-integration.js'),/e\.button===2/,'right-click aim exists');
});
test('on foot: only keys with an action are drawn, in their real relative positions, with the action; no conflicts by default',()=>{
 const p=K.place(K.entries('walking',K.DEFAULTS,{chat:false}));assert.deepEqual(p.conflicts,[]);
 const key=c=>p.keys.find(k=>k.code===c);
 for(const c of ['KeyW','KeyA','KeyS','KeyD','ShiftLeft','Space','KeyE','KeyR','KeyI','Digit1','KeyL','KeyK','KeyP','Escape'])assert.ok(key(c),c);
 assert.equal(key('KeyK').label,'KeyMap');assert.equal(key('KeyL').label,'V1 device');assert.equal(key('KeyW').label,'Forward');
 assert.ok(!key('KeyZ')&&!key('KeyQ')&&!key('Enter'),'unused keys are not drawn (Enter only where Messages can be opened)');
 const x=(a,b)=>key(a).x-key(b).x;assert.ok(Math.abs(x('KeyD','KeyA')-2)<1e-9,'A and D are two keys apart, like a real keyboard');assert.ok(Math.abs(x('KeyS','KeyA')-1)<1e-9);
 assert.equal(key('KeyW').row+1,key('KeyA').row,'W is a row above A');assert.ok(key('Space').w>5,'the space bar is wide');
 assert.ok(K.place(K.entries('walking',K.DEFAULTS,{chat:true})).keys.some(k=>k.code==='Enter'&&k.label==='Messages'));
});
test('flight is its own layout; arrows and right Shift appear only while the action is on its default key',()=>{
 const f=K.place(K.entries('flight',K.DEFAULTS));const c=n=>f.keys.find(k=>k.code===n);
 assert.equal(c('Space').label,'Fire');assert.equal(c('KeyF').label,'Missile');assert.equal(c('ArrowUp').label,'Pitch up');assert.ok(!f.keys.some(k=>k.label==='Jump'||k.label==='Inventory'),'no on-foot actions in flight');assert.deepEqual(f.conflicts,[]);
 const moved=K.place(K.entries('flight',{...K.DEFAULTS,pitchUp:'KeyY'}));assert.ok(moved.keys.some(k=>k.code==='KeyY'&&k.label==='Pitch up'));assert.ok(!moved.keys.some(k=>k.code==='ArrowUp'),'the arrow alias is not offered once the action is rebound');
});
test('player-customised bindings are shown, and a shared key is reported instead of hidden',()=>{
 const p=K.place(K.entries('walking',{...K.DEFAULTS,missionLog:'KeyJ',personalHud:'KeyO'},{}));assert.ok(p.keys.find(k=>k.code==='KeyJ'&&k.label==='V1 device'));assert.ok(p.keys.find(k=>k.code==='KeyO'&&k.label==='Terminal'));assert.ok(!p.keys.find(k=>k.code==='KeyL'));
 const clash=K.place(K.entries('walking',{...K.DEFAULTS,missionLog:'KeyW'}));assert.equal(clash.conflicts.length,1);assert.deepEqual(clash.conflicts[0].labels.sort(),['Forward','V1 device']);
});
test('first-exit trigger: only a real exit from the pod, only once, never in the creator',()=>{
 const T=(f,a,b,c)=>K.shouldAutoShow(f,a,b,c);
 assert.equal(T({},'pod-waking','walking',false),true);assert.equal(T(undefined,'pod-waking','walking',false),true,'an old save with no flags yet');
 assert.equal(T({keymapSeen:true},'pod-waking','walking',false),false,'seen once');assert.equal(T({},'pod-waking','walking',true),false,'creator open');
 assert.equal(T({},'pod-waking','character-creator',false),false,'still in the pod flow');assert.equal(T({},'walking','walking',false),false,'not every visit');assert.equal(T({},'menu','walking',false),false);assert.equal(T({},'',  'walking',false),false);
});
test('saved controls: the KeyMap takes K for a player who has none there; an existing K is never overwritten; custom bindings survive',()=>{
 const full=Object.fromEntries(Object.entries(loadInput().defaults).filter(([k])=>k!=='keymap'));   // a save from before the KeyMap
 let I=loadInput(full);assert.equal(I.bindings.keymap,'KeyK');assert.deepEqual({...I.bindings,keymap:undefined},{...full,keymap:undefined},'nothing else changed');
 I=loadInput({...full,missionLog:'KeyK'});assert.equal(I.bindings.missionLog,'KeyK','the player\'s own K stays on Mission log');assert.equal(I.bindings.keymap,'KeyJ','the KeyMap takes the next free key');assert.equal(K.toggleHint(I.bindings),'To hide the KeyMap Press J');
 I=loadInput({...full,missionLog:'KeyK',personalHud:'KeyJ',lock:'KeyN',pitchUp:'KeyM'});assert.equal(I.bindings.keymap,'KeyU');assert.equal(I.bindings.missionLog,'KeyK');
 I=loadInput({...full,fire:'KeyJ',throttleDown:'KeyV'});assert.equal(I.bindings.fire,'KeyJ');assert.equal(I.bindings.keymap,'KeyK');
 I=loadInput(undefined);assert.equal(I.bindings.keymap,'KeyK');I=loadInput({...full,keymap:'KeyU'});assert.equal(I.bindings.keymap,'KeyU','an explicit choice is kept');
 const bad=loadInput({...full,keymap:'KeyL'});assert.equal(bad.bindings.keymap,'KeyK','a duplicate saved set falls back to defaults, as before (unchanged behaviour)');
 const r=loadInput();assert.equal(r.bind('keymap','KeyL').error&&true,true,'binding KeyMap to a key already in use is refused with a message');assert.equal(r.bind('keymap','KeyJ').saved,true);assert.equal(r.bindings.keymap,'KeyJ');
 assert.equal(r.reset(),true);assert.equal(r.bindings.keymap,'KeyK');
});
