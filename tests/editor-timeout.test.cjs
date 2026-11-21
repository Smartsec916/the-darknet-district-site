/* The Mission Editor stays open (the owner, 21 Nov 2026: "sometimes the mission editor times out and goes to the previous page. also while trying to play through a
   test mission the editor pops up"). Causes: account.js's 4-minute account check re-ran VoidDevTools.identity(), which hid the Developer tools window and, during
   PLAY THIS DRAFT (the editor-return note waiting), reopened the Mission Editor; a deploy reloaded the page under an editor open over the main menu. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../void-runner/editor-session.js'),U=require('../void-runner/update-ready.js');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');

test('the same account confirmed again (every 4 minutes, on tab focus) keeps the window, its tab and its work',()=>{
 assert.equal(S.identity({authorized:true,uid:'owner',open:true},{uid:'owner',request:true}),'swap');
 assert.equal(S.identity({authorized:true,uid:'owner',open:false,testing:true},{uid:'owner',request:true}),'swap','during draft play: nothing opens');
 assert.equal(S.identity({authorized:false,uid:null},{uid:'owner',request:true}),'fresh','the first confirmation of a page load');
 assert.equal(S.identity({authorized:true,uid:'owner'},{uid:'someone-else',request:true}),'fresh','another account starts over');
});
test('the sign-in listener: same account = nothing changes; signed out with the editor or a draft open = keep it, show the bar; otherwise fail closed',()=>{
 assert.equal(S.identity({authorized:true,uid:'owner',open:true},{uid:'owner'}),'hold');
 assert.equal(S.identity({authorized:true,uid:'owner',open:true},{uid:null}),'expired');
 assert.equal(S.identity({authorized:true,uid:'owner',open:false,testing:true},{uid:null}),'expired');
 assert.equal(S.identity({authorized:true,uid:'owner',open:false},{uid:null}),'close','nothing open: the old fail-closed path');
 assert.equal(S.identity({authorized:true,uid:'owner',open:true},{uid:'other'}),'close','a different account signed in: close');
 assert.equal(S.identity({authorized:false,uid:null,open:false},{uid:null}),'close');
});
test('the editor opens by itself only on the first confirmation of a page load (after LEAVE DRAFT), never during a draft or a second time',()=>{
 assert.equal(S.autoOpen({first:true,missions:true}),'missions');
 assert.equal(S.autoOpen({first:true,npcs:true}),'npcs');
 assert.equal(S.autoOpen({first:true,missions:true,testing:true}),null,'draft play: the editor never pops up');
 assert.equal(S.autoOpen({first:false,missions:true}),null,'a later account check');
 assert.equal(S.autoOpen({first:true,missions:true,open:true}),null,'already open');
 assert.equal(S.autoOpen({first:true}),null,'no note waiting');
});
test('a failed editor call: 401 = sign in again; no answer / timeout / 5xx = the server is waking up (retry); anything else is shown, not retried',()=>{
 assert.equal(S.problem({status:401}),'signin');assert.equal(S.problem({message:'Sign in again.'}),'signin');assert.equal(S.problem({message:'Your sign-in expired. Sign in again.'}),'signin');
 for(const e of [{kind:'timeout'},{kind:'network'},{kind:'unavailable',status:503},{status:502},{status:504},{status:429}])assert.equal(S.problem(e),'waking',JSON.stringify(e));
 assert.equal(S.problem({status:403,kind:'rejected'}),'other');assert.equal(S.problem({status:400,kind:'rejected'}),'other');assert.equal(S.problem(null),'other');
 assert.deepEqual([1,2,3,4,5,6,7,50].map(S.retryDelay),[3,6,12,24,45,60,60,60]);assert.equal(S.retryDelay(0),3);
 assert.match(S.TEXT.waking,/Server waking up \/ retrying…/);assert.match(S.TEXT.signin,/Sign-in expired/);
});
test('Escape closes the window, but not while typing in a box',()=>{
 for(const t of ['INPUT','TEXTAREA','SELECT','input'])assert.equal(S.escapeCloses({tagName:t}),false,t);
 assert.equal(S.escapeCloses({tagName:'DIV',isContentEditable:true}),false);assert.equal(S.escapeCloses({tagName:'BUTTON'}),true);assert.equal(S.escapeCloses(null),true);
});
test('a new build never reloads the page while the editor was used or a draft plays: it waits for APPLY UPDATE',()=>{
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true,editor:true}),'wait','the editor over the main menu (the reported case)');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true,testing:true}),'wait');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true}),'reload','players: unchanged');
 const cache=read('void-runner/cache.js');assert.match(cache,/editor:typeof VoidDevTools!=='undefined'&&!!VoidDevTools\.used/);assert.match(cache,/VoidDevTools\.updateReady\?\.\(\)/);
 const dt=read('void-runner/dev-tools.js');assert.match(dt,/open\(tab\)\{if\(!this\.authorized\)return;this\.used=true;/);assert.match(dt,/data-dev-bar-act="update">APPLY UPDATE/);
 assert.match(dt,/if\(act==='update'\)\{[^}]*blur[^]*?T\.exit\(\);else location\.reload\(\)/,'applied only by the click (a draft leaves through LEAVE DRAFT)');
});
test('wiring: account.js passes the uid, retries a 401 with a fresh token, and offers a silent SIGN IN; dev-tools.js follows the rules',()=>{
 const a=read('void-runner/account.js');
 assert.match(a,/VoidDevTools\.identity\(null,\{uid:user\?\.uid\|\|null\}\)/);assert.match(a,/return api\(path,body\);\},\{uid:account\.user\?\.uid\|\|null\}\)/);
 assert.match(a,/error\?\.status!==401[^\n]*\n[^\n]*getIdToken\(true\)/);assert.match(a,/account\.reconfirm=async\(\)=>/);
 const dt=read('void-runner/dev-tools.js'),body=dt.slice(dt.indexOf('async identity(request,info){'),dt.indexOf('signin(on){'));
 assert.ok(body.indexOf('ES.identity(')>0&&body.indexOf('ES.identity(')<body.indexOf('devPanel.hidden=true'),'decide before anything is hidden');
 assert.match(body,/if\(d==='swap'\)\{this\.request=request;this\.signin\(false\);return;\}/);assert.match(body,/if\(d==='expired'\)\{this\.request=null;this\.signin\(true\);return;\}/);
 assert.match(body,/ES\.autoOpen\(ret\)/);assert.doesNotMatch(body,/if\(sessionStorage\.getItem\('mission-editor-return'\)\)this\.open/,'the old unconditional reopen is gone');
 assert.match(dt,/ES&&!ES\.escapeCloses\(event\.target\)/);assert.match(dt,/devButton\.onclick=\(\)=>\{VoidDevTools\.open\(\);devButton\.blur\(\);\}/);
 assert.match(dt,/addEventListener\('pagehide'/);
});
test('wiring: the Mission Editor retries its server copy and never closes; draft play notes a failed step instead of opening the editor',()=>{
 const me=read('void-runner/mission-editor.js');assert.match(me,/function trouble\(e,again\)/);assert.match(me,/else if\(!trouble\(e,\(\)=>saveServer\(\)\)\)\{ws\.state='off';\}/);
 assert.match(me,/if\(!trouble\(e,\(\)=>loadServer\(afterConflict\)\)\)ws\.state='off'/);assert.match(me,/server\.note\.roles==='unreachable'&&!refreshServer\.waiting/);
 assert.match(me,/leave:'LEAVE DRAFT · BACK TO EDITOR'/);assert.doesNotMatch(me,/history\.(back|go)|location\.reload|window\.close/);
 const t=read('void-runner/dev-test.js');assert.match(t,/function stepNote\(text\)/);assert.equal((t.match(/document\.activeElement\?\.blur\?\.\(\);\}catch\{\}active=true;/g)||[]).length,3);
 assert.match(read('void-runner/live-content.js'),/VoidDevTest\?\.stepNote\?\.\('you lost /);assert.match(read('void-runner/mission-mechanics-game.js'),/VoidDevTest\?\.stepNote\?\.\('SPOTTED/);
 assert.match(read('void-runner/zone-integration.js'),/VoidDevTest\?\.stepNote\?\./);
});
test('the page loads the rules before the cache script and the Developer tools; BUILD is bumped',()=>{
 const html=read('void-runner.html'),i=html.indexOf('void-runner/editor-session.js');assert.ok(i>0&&i<html.indexOf('void-runner/cache.js')&&i<html.indexOf('void-runner/dev-tools.js'));
 assert.equal(read('static/void-runner.html'),html);
 assert.match(read('void-runner-sw.js').split(/\r?\n/)[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';$/);
});
