const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const MC=require('../void-runner/mission-content.js');
const POOL='[cheerful] Welcome.\nGood to see you.\n\n  Tea?  \nBack again.\nSit anywhere.';
const lines=['[cheerful] Welcome.','Good to see you.','Tea?','Back again.','Sit anywhere.'];
function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
test('a pool plays every line once per round, in a random order, before any repeats',()=>{
 for(let seed=1;seed<40;seed++){const p={},r=seeded(seed),got=Array.from({length:lines.length*4},()=>MC.interactionPick(POOL,p,r));
  for(let k=0;k<4;k++)assert.deepEqual(got.slice(k*5,k*5+5).sort(),lines.slice().sort(),'round '+k+' seed '+seed);}
});
test('the same line never plays twice in a row, including across rounds',()=>{
 for(let seed=1;seed<200;seed++){const p={},r=seeded(seed);let prev='';for(let i=0;i<60;i++){const l=MC.interactionPick(POOL,p,r);assert.notEqual(l,prev);prev=l;}}
 const two={};let prev='';for(let i=0;i<20;i++){const l=MC.interactionPick('A\nB',two);assert.notEqual(l,prev);prev=l;}
});
test('the order is random, not the written order',()=>{
 const firsts=new Set();for(let seed=1;seed<60;seed++)firsts.add(MC.interactionPick(POOL,{},seeded(seed)));assert.ok(firsts.size>1);
 const orders=new Set();for(let seed=1;seed<60;seed++){const p={},r=seeded(seed);orders.add(lines.map(()=>MC.interactionPick(POOL,p,r)).join('|'));}assert.ok(orders.size>1);
});
test('one line, an empty pool and no state are handled',()=>{
 const p={};for(let i=0;i<5;i++)assert.equal(MC.interactionPick('  Only line. \n',p),'Only line.');
 assert.equal(MC.interactionPick('',{}),'');assert.equal(MC.interactionPick(null,{}),'');assert.equal(MC.interactionPick(undefined),'');
 assert.ok(lines.includes(MC.interactionPick(POOL)));
});
test('editing the pool drops removed lines and never plays them',()=>{
 const p={},r=seeded(7);MC.interactionPick(POOL,p,r);const smaller='Tea?\nBack again.';for(let i=0;i<12;i++)assert.ok(['Tea?','Back again.'].includes(MC.interactionPick(smaller,p,r)));
});
test('the game uses the picker for the approach greeting and keeps the existing line helper',()=>{
 const live=fs.readFileSync(require.resolve('../void-runner/live-content.js'),'utf8');
 assert.match(live,/MC\.interactionPick\(r\.near,p\)/);assert.doesNotMatch(live,/interactionLine\(r\.near/);
 assert.equal(MC.interactionLine('a\nb',3),'b');
 assert.match(fs.readFileSync(require.resolve('../void-runner-sw.js'),'utf8').split(/\n/)[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
});
