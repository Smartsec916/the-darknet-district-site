const test=require('node:test'),assert=require('node:assert/strict'),C=require('../void-runner/cinematic-project.js');
test('a project interpolates real camera keyframes and isolates concurrent tracks',()=>{
 const p=C.fresh(),cam=p.clips[0];const overlay=C.clip('Text',1,1);p.clips.push(overlay);
 assert.equal(C.validate(p),'');assert.deepEqual(C.camera(cam,cam.duration/2),[0,2,-4.5]);assert.deepEqual(C.on(p,'Text',1),[overlay]);assert.deepEqual(C.on(p,'Text',2),[]);
 assert.deepEqual(C.dimensions(720,'16:9'),[1280,720]);assert.deepEqual(C.dimensions(1080,'9:16'),[1080,1920]);assert.deepEqual(C.dimensions(1440,'1:1'),[1440,1440]);
});
test('unsafe sources, unreasonable export settings and duplicate IDs cannot be imported',()=>{
 const p=C.fresh();p.clips.push(C.clip('Dialogue'));p.clips[1].src='https://example.invalid/track';assert.match(C.validate(p),/recording/);
 p.clips.pop();p.clips.push({...p.clips[0]});assert.match(C.validate(p),/duplicate/);p.clips.pop();p.fps=1000;assert.match(C.validate(p),/Invalid/);
});

test('private mission feeds and lighting survive round trips with legacy drafts',()=>{
 const p=C.fresh();delete p.hour;assert.equal(C.validate(p),'');
 p.hour=0;p.place='Blackrock camera feed';p.feed='mission-1/camera-2';
 assert.equal(C.validate(JSON.parse(JSON.stringify(p))),'');
 p.hour=23.7;assert.match(C.validate(p),/hour/);
 p.hour=23;p.place='Milked reception';assert.match(C.validate(p),/feed/);
});
