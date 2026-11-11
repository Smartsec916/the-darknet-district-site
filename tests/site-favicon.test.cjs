'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('../tools/site-favicon.cjs'),B=require('../tools/assets/build-pages.cjs'),ROOT=path.join(__dirname,'..');
const png=f=>{const b=fs.readFileSync(path.join(ROOT,f));assert.equal(b.toString('latin1',1,4),'PNG',f);return [b.readUInt32BE(16),b.readUInt32BE(20)];};

test('the icon files exist, are square, and meet Google Search\'s favicon rules (a multiple of 48 px, at least 48 px)',()=>{
 for(const [f,n] of [['favicon-48x48.png',48],['favicon-96x96.png',96],['favicon-192x192.png',192]]){const [w,h]=png(f);assert.equal(w,n,f);assert.equal(h,n,f);assert.equal(n%48,0);}
 assert.deepEqual(png('apple-touch-icon.png'),[180,180]);
 const ico=fs.readFileSync(path.join(ROOT,'favicon.ico'));assert.equal(ico.readUInt16LE(0),0);assert.equal(ico.readUInt16LE(2),1,'a real .ico file');
 const sizes=[];for(let i=0;i<ico.readUInt16LE(4);i++)sizes.push(ico[6+i*16]||256);assert.deepEqual(sizes.sort((a,b)=>a-b),[16,32,48]);
});
test('every top-level page and its static copy declares the same icons exactly once, with no other icon declaration',()=>{
 assert.deepEqual(F.generate(true),[],'run node tools/site-favicon.cjs');
 const pages=F.pages();assert.ok(pages.includes('index.html'));
 for(const file of pages)for(const prefix of ['','static/']){const p=path.join(ROOT,prefix+file);if(!fs.existsSync(p))continue;const s=fs.readFileSync(p,'utf8');
  assert.equal(s.split(F.start).length-1,1,prefix+file+' has one icon block');
  const all=s.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi)||[],inside=s.slice(s.indexOf(F.start),s.indexOf(F.end)).match(/<link[^>]*>/g)||[];
  assert.equal(all.length,inside.length,prefix+file+' has no conflicting icon link');assert.equal(inside.length,5);
  assert.ok(s.indexOf(F.end)<s.search(/<\/head>/i),prefix+file+': inside <head>');
  for(const href of inside.map(l=>/href="([^"]+)"/.exec(l)[1])){assert.ok(href.startsWith('/'),'root-relative, so it works from any page address');assert.ok(fs.existsSync(path.join(ROOT,href.slice(1))),href);}}
 assert.equal(Buffer.compare(fs.readFileSync(path.join(ROOT,'void-runner.html')),fs.readFileSync(path.join(ROOT,'static/void-runner.html'))),0);
});
test('the icons are published by the Pages build and not blocked from crawlers',()=>{
 for(const f of F.FILES)assert.ok(B.publishable(f),f+' is published');
 const robots=fs.readFileSync(path.join(ROOT,'robots.txt'),'utf8');
 for(const line of robots.split(/\r?\n/)){const m=/^\s*Disallow:\s*(\S+)/i.exec(line);if(!m)continue;for(const f of F.FILES)assert.ok(!('/'+f).startsWith(m[1]),'robots.txt does not block /'+f);}
 assert.doesNotMatch(robots,/^\s*Disallow:\s*\/\s*$/m,'the homepage is crawlable');
});
