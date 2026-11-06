/* Share links (?visit= / ?scenario=) were retired on 2026-11-04: nothing parses them, nothing builds them, and a link that still carries them opens the normal game. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
test('the share-link and guest-session files are gone, and the page no longer loads them',()=>{
 for(const f of ['share-registry.js','guest-mode.js','share-panel.js','share.css'])assert(!fs.existsSync('void-runner/'+f),f);
 for(const page of ['void-runner.html','static/void-runner.html'])for(const f of ['share-registry','guest-mode','share-panel','share.css'])assert(!read(page).includes(f),page+' '+f);
 assert.equal(read('void-runner.html'),read('static/void-runner.html'));
});
test('no game script reads share parameters or refers to the removed modules',()=>{
 for(const f of fs.readdirSync('void-runner').filter(f=>f.endsWith('.js'))){const src=read('void-runner/'+f);
  assert(!/VoidShare|VoidGuest|VoidSharePanel/.test(src),f+' refers to a removed module');
  assert(!/get\(['"](visit|scenario)['"]\)|[?&](visit|scenario)=/.test(src),f+' reads a share parameter');}
});
test('Developer Tools no longer has a Share Links tab',()=>{
 const src=read('void-runner/dev-tools.js');assert(!/share/i.test(src.split('\n').filter(l=>/sections:|tab===/.test(l)).join('\n')));assert(src.includes("['balance','Combat Balance']")&&src.includes("['test','Test & Jump To']")&&src.includes("['achievements','Achievement Manager']"));
});
test('the District area rules no longer know about guest links',()=>{
 const A=require('../void-runner/district-area.js');assert.equal(A.guestArea,undefined);for(const k of ['KEY','areaOf','keyFor','resume','exitSpawn','enterTrigger','exitTrigger'])assert(k in A,k);
});
test('the rest is untouched: the new campaign start, the transition and local play still wire up',()=>{
 const html=read('void-runner.html');for(const f of ['district-area.js','district-transition.js','district-transition.css','prologue-integration.js','menu.js','game.js'])assert(html.includes('void-runner/'+f),f);
  const {execFileSync}=require('node:child_process'),os=require('node:os'),path=require('node:path'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'tdd-home-'));for(const f of['index.html','accents.css'])fs.copyFileSync(f,path.join(dir,f));execFileSync('git',['init','-q','.'],{cwd:dir});execFileSync('git',['apply',path.resolve('docs/development/homepage-entry/activate-homepage-entry.patch')],{cwd:dir});const home=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert(home.includes('class="tdd-title-link"'),'the homepage patch makes the existing title clickable');
 assert(home.includes('href="void-runner.html"'),'the title is a plain link');
});
