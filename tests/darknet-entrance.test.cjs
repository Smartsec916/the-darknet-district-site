/* Entrypoint contract for the *current* homepage and separate District game.
   The older deferred homepage patch was superseded by the live homepage design. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
test('the existing homepage uses the readable green ENTER link and does not replace other navigation',()=>{
 const home=read('index.html');
 assert.match(home,/<a class="tdd-enter-logo" href="void-runner\.html" aria-label="Enter The Darknet District">/);
 assert.match(home,/<span class="tdd-enter-corner" aria-hidden="true">ENTER<\/span>/);
 assert.match(home,/<h1 class="cyberpunk-title"[^>]*>The Darknet District<\/h1>/);
 assert.match(home,/\.tdd-enter-logo:focus-visible/);
 assert.ok(home.includes('games-list.html'),'other games remain reachable');
 assert.ok(fs.existsSync('void-runner.html'));
});
test('the homepage does not promise working multiplayer',()=>{
 assert.doesNotMatch(read('index.html'),/\bmultiplayer\b|\bother players\b/i);
});
test('the Arcade no longer presents the old Void Runner card',()=>{
 for(const f of ['games-list.html','static/games-list.html']){
  const page=read(f);
  assert.doesNotMatch(page,/href="void-runner\.html"/);
  for(const game of ['/origins/index.html','blackout-protocol/','raven.html'])assert.ok(page.includes('href="'+game+'"'),f+' '+game);
 }
 for(const f of ['void-runner.html','static/void-runner.html','void-runner-sw.js','void-runner-backdrop.js','void-runner/game.js','void-runner/save-manifest.json'])assert.ok(fs.existsSync(f),f);
});
test('game entrypoint displays The Darknet District, while internal filenames remain stable',()=>{
 const html=read('void-runner.html'),menu=read('void-runner/menu.js');
 assert.ok(html.includes('THE DARKNET<br>DISTRICT'));
 assert.ok(html.includes('void-runner/game.js'));
 assert.ok(read('void-runner/game.js').includes('SAVE_KEY'));
 assert.equal(html,read('static/void-runner.html'));
 assert.doesNotMatch(menu,/VOID\/\/RUNNER/);
});
