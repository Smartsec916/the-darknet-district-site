const test=require('node:test'),assert=require('node:assert/strict');
const studio=require('../void-runner/sound-studio-runtime.js');
test('overnight conditional playlists only apply to the authored location and mission',()=>{
 const p={id:'doors',area:'under-tea-room',fromHour:22,toHour:4,mission:'investigate'};
 const c={locations:[p]},world={areas:['under-tea-room'],hour:2,missions:['investigate']};
 assert.equal(studio.playlist(c,world),p);assert.equal(studio.playlist(c,{...world,hour:4}),undefined);
 assert.equal(studio.playlist(c,{...world,missions:[]}),undefined);
 assert.equal(studio.playlist(c,{...world,areas:['district-store']}),undefined);
 assert.equal(studio.hourMatches(12,0,0),true);
});
test('packaged library entries map to shipped recordings',()=>{
 const fs=require('node:fs'),path=require('node:path'),list=require('../void-runner/sound-library.json');
 assert.equal(new Set(list).size,list.length);
 for(const src of list){assert.match(src,/^assets\/audio\/[\w/-]+\.(ogg|mp3|wav|m4a)$/);assert.ok(fs.existsSync(path.resolve(__dirname,'..',studio.mediaUrl(src))));}
 assert.ok(list.some(f=>f.includes('nomi-greet')));assert.ok(list.some(f=>f.includes('se7en-greet')));
});
