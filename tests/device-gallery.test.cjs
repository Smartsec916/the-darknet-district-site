/* The Gallery and the News app's PEOPLE feed (David, 15 Nov 2026). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const G=require('../void-runner/device-gallery.js'),D=require('../void-runner/device-v1.js'),P=require('../void-runner/district-people.js');
test('each photo takes 1% of storage: a stock V1 holds 25',()=>{
 assert.equal(G.PHOTO_PCT,1);const dev=D.restore({});assert.equal(G.capacity(D.storage(dev,0).usedPct),25);
 assert.equal(D.storage(dev,10).usedPct,85);assert.equal(D.storage(dev,10).availablePct,15);assert.equal(D.storage(dev,400).usedPct,100);assert.equal(G.capacity(100),0);
});
test('a photo keeps the tags of who was in it, once each',()=>{
 assert.deepEqual(G.cleanTags([{name:'Dax',role:'Courier',kind:'npc'},{name:'dax',role:'x'},{name:'<b>Zed</b>',role:'Player',kind:'player'},{name:''}]),[{name:'Dax',role:'Courier',kind:'npc'},{name:'bZed/b',role:'Player',kind:'player'}]);
 assert.equal(G.cleanTags(Array.from({length:40},(_, i)=>({name:'p'+i}))).length,24);
});
test('the PEOPLE feed: posted photos and the residents\' pictures, newest first; unposted photos stay private',()=>{
 const now=1e12,feed=G.peopleFeed([{id:'a',postedAt:now-60000,place:'NULL',tags:[]},{id:'b',postedAt:0}],now,'Zed');
 assert.equal(feed[0].id,'me:a');assert.equal(feed[0].by,'Zed');assert.ok(!feed.some(x=>x.photo==='b'));for(let i=1;i<feed.length;i++)assert.ok(feed[i-1].at>=feed[i].at);
 for(const n of G.NPC_POSTS){assert.ok(P.npc(n.by),'a real resident posts it: '+n.by);assert.ok(fs.existsSync(n.image),n.image);for(const t of n.tags||[])assert.ok(t.name);}
 assert.ok(G.NPC_POSTS.some(n=>n.place==='NULL'));
});
test('the camera takes photos with the left mouse button and the News app has its filters',()=>{
 const cam=fs.readFileSync('void-runner/device-camera.js','utf8'),pd=fs.readFileSync('void-runner/personal-device.js','utf8');
 assert.ok(/mousedown/.test(cam)&&/e\.button!==0/.test(cam)&&/LEFT CLICK · PHOTO/.test(cam));
 for(const f of ['all','broadcasts','commerce','people'])assert.ok(pd.includes("['"+f+"'"));assert.ok(pd.includes('photoDel')&&pd.includes('photoPost'));
 assert.equal(G.placeName('club'),'NULL');assert.equal(G.placeName('district-bar'),'The Darknet District · bar');
});
