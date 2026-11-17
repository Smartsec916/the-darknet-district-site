/* The Sleeping Pod's wall controls (David, 15 Nov 2026): what a click on each wall screen does, and that the District's music stays off in the pod. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/district-area.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('the music player: transport buttons and volume on the wall face (the rest of the face is tests/pod-player-ui.test.cjs)',()=>{
 const at=(x,y)=>A.podControl('music',x/384,y/192,{view:'player',source:'website',count:27,offset:0});
 assert.deepEqual([35,75,115,155,195].map(x=>at(x,160).action),['previous','play','pause','stop','next']);
 assert.equal(at(254,160).value,0);assert.equal(at(366,160).value,1);assert.ok(Math.abs(at(310,160).value-.5)<.01);
 assert.equal(at(200,124).action,'list');assert.equal(at(53,160),null,'the gap between two buttons is not a button');
});
test('the light panel: three presets, nothing elsewhere',()=>{
 const at=(x,y)=>A.podControl('lights',x/320,y/180);
 assert.deepEqual([50,96,142].map(y=>at(80,y).preset),['rest','reading','music']);assert.equal(at(240,90),null);
});
test('the sign and the vending face; off-screen points do nothing',()=>{
 assert.deepEqual(A.podControl('exit',.5,.5),{action:'exit'});assert.deepEqual(A.podControl('vend',.1,.9),{action:'vend'});
 assert.equal(A.podControl('music',1.2,.5),null);assert.equal(A.podControl('nothing',.5,.5),null);
});
test('the pod pieces are wired together',()=>{
 const n=read('void-runner/neochinatown.js'),w=read('void-runner/world-integration.js'),m=read('void-runner/music-integration.js'),p=read('void-runner/pod-music.js');
 for(const kind of ['music','lights','vend','exit'])assert.ok(n.includes(",index,'"+kind+"')"),kind+' is clickable');
 assert.ok(n.includes('EXIT THE POD'));assert.ok(/podPick/.test(w)&&/podControl/.test(w));
 assert.ok(m.includes('podWakePending===true'),'no District music while the player is in a pod, whatever panel is open');
 for(const f of ['setVolume','setLighting','stop','playIndex','toggleShuffle','cycleRepeat','removeAt','chooseFiles'])assert.ok(p.includes(f+'('));
 assert.ok(!/pod-music\)/.test(p)&&!p.includes('SLEEPING POD / MUSIC')&&!p.includes('pod-music:'),'the pop-up panel is gone');
});
