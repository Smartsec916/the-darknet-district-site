/* A new build reaches players without a manual refresh (David, 17 Nov 2026: the old area music played until he refreshed). The decision is pure (update-ready.js). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const U=require('../void-runner/update-ready.js');
test('an update is ready only when a worker with a different build takes over the page',()=>{
 assert.equal(U.ready('2026-11-17-a','2026-11-17-b'),true);assert.equal(U.ready('2026-11-17-a','2026-11-17-a'),false);
 assert.equal(U.ready(undefined,'x'),false,'nothing known yet');
});
test('it is applied only where nothing is lost: loading screen or main menu; never in a conversation, a flight, a test or when saving failed',()=>{
 assert.equal(U.when({started:false}),'reload','the loading screen');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true}),'reload','the main menu');
 assert.equal(U.when({started:true,mode:'walking'}),'wait','on foot: a notice, then the next main-menu visit');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:false}),'wait','another menu page (settings, account)');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true,flight:true}),'wait','a flight paused behind the menu');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true,speech:true}),'wait','a conversation paused behind the menu');
 assert.equal(U.when({started:false,flight:true}),'wait');assert.equal(U.when({started:true,mode:'menu',mainMenu:true,testing:true}),'wait','a developer test or draft session');
 assert.equal(U.when({started:true,mode:'menu',mainMenu:true,saved:false}),'wait');
 assert.match(U.NOTICE,/Update ready — it applies next time you return to the main menu/);
});
test('the page loads the rule before the cache script, and the worker activates a new build at once',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','void-runner.html'),'utf8');assert.ok(html.indexOf('void-runner/update-ready.js')>0&&html.indexOf('void-runner/update-ready.js')<html.indexOf('void-runner/cache.js'));
 const sw=fs.readFileSync(path.join(__dirname,'..','void-runner-sw.js'),'utf8');assert.match(sw,/skipWaiting\(\)/);assert.match(sw,/clients\.claim\(\)/);
 const cache=fs.readFileSync(path.join(__dirname,'..','void-runner/cache.js'),'utf8');assert.match(cache,/controllerchange/);assert.match(cache,/U\.when\(ctx\)==='reload'/);
});
