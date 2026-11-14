'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../void-runner/graphics-prefs.js');
const PRESETS=['low','medium','high','ultra'];
const read=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
test('new players start on Medium; nothing saved, or something unusable, means Medium',()=>{
 for(const s of [null,undefined,{},{quality:'banana'},{quality:5},'x',[]])assert.deepEqual(G.resolve(s,PRESETS),{quality:'medium',chosen:false,migrated:false,reason:'default'});
 assert.equal(G.DEFAULT,'medium');
});
test('a preset the player chose is kept exactly (version 2), including High and Ultra; an unchosen version-2 value is Medium',()=>{
 for(const q of PRESETS)assert.deepEqual([G.resolve({v:2,chosen:true,quality:q},PRESETS).quality,G.resolve({v:2,chosen:true,quality:q},PRESETS).chosen],[q,true]);
 assert.equal(G.resolve({v:2,chosen:false,quality:'ultra'},PRESETS).quality,'medium','an unchosen value is never read as a preference');
 assert.equal(G.resolve({v:2,quality:'high'},PRESETS).quality,'medium');
});
test('old saves: Low, Medium and Ultra were choices and stay; the unchosen High default of 12 Nov moves to Medium once; the old automatic Low is not a choice',()=>{
 for(const q of ['low','medium','ultra']){const r=G.resolve({renderer:'babylon',quality:q,lookSensitivity:.002},PRESETS);assert.deepEqual([r.quality,r.chosen,r.migrated],[q,true,false],q);}
 const h=G.resolve({renderer:'babylon',quality:'high'},PRESETS);assert.deepEqual([h.quality,h.chosen,h.migrated],['medium',false,true]);
 const a=G.resolve({quality:'low',auto:true},PRESETS);assert.deepEqual([a.quality,a.chosen,a.migrated],['medium',false,true],'the removed weak-hardware check wrote auto:true');
 assert.equal(G.resolve({quality:'ultra',auto:true},PRESETS).quality,'medium','an automatic flag never turns into an Ultra preference');
 // a High that is chosen again after the migration is kept for good
 const saved=G.serialize({renderer:'babylon',quality:'high',chosen:true,lookSensitivity:.002});assert.equal(G.resolve(saved,PRESETS).quality,'high');
 // and the migration result, once written, is stable
 const once=G.resolve({quality:'high'},PRESETS),written=G.serialize({renderer:'babylon',quality:once.quality,chosen:once.chosen,lookSensitivity:.002});assert.deepEqual(G.resolve(written,PRESETS),{quality:'medium',chosen:false,migrated:false,reason:'not chosen'});
});
test('the saved value has a version and a chosen flag, and keeps what was already saved',()=>{
 const s=G.serialize({renderer:'babylon',quality:'medium',chosen:false,lookSensitivity:.0031});assert.deepEqual(s,{renderer:'babylon',quality:'medium',lookSensitivity:.0031,v:2,chosen:false});
});
test('the renderer: Medium is not 4K and is not oversampled; the presets still exist; the fallback is Medium; High and Ultra are opt-in only',()=>{
 const src=read('babylon-renderer.js'),m=/const presets = (\{[\s\S]*?\n  \});/.exec(src);assert.ok(m);const presets=new Function('return '+m[1])();
 assert.deepEqual(Object.keys(presets),PRESETS);
 const med=presets.medium;assert.ok(med.scale>=1,'no supersampling on Medium');assert.ok(med.maxWidth<3840&&med.maxHeight<2160,'Medium is capped below 4K');assert.ok(med.maxDpr<=1.25);assert.equal(med.maxWidth,2560);assert.equal(med.maxHeight,1440);
 for(const [lo,hi] of [['low','medium'],['medium','high'],['high','ultra']]){assert.ok(presets[lo].maxWidth<=presets[hi].maxWidth&&presets[lo].maxDpr<=presets[hi].maxDpr,lo+' <= '+hi);}
 assert.ok(!/\|\| presets\.high|: 'high'/.test(src.replace(/\/\/.*$/gm,'')),'no fallback to High');assert.match(src,/quality = 'medium',/);assert.match(src,/presets\[value\] \? value : 'medium'/);
 // internal size for common displays (the renderer's own formula): Medium never reaches 4K, and never exceeds the display by more than 1.25x
 const size=(w,h,dpr,p)=>{const d=Math.min(dpr,p.maxDpr);let W=Math.round(w*d/p.scale),H=Math.round(h*d/p.scale);const fit=Math.min(1,p.maxWidth/W,p.maxHeight/H);return [Math.round(W*fit),Math.round(H*fit)];};
 for(const [w,h,dpr] of [[1280,720,1],[1920,1080,1],[1920,1080,2],[2560,1440,1],[2560,1440,1.5],[3840,2160,1],[3840,2160,2],[1536,864,1.25]]){const [rw,rh]=size(w,h,dpr,med);assert.ok(rw<=2560&&rh<=1440,w+'x'+h+'@'+dpr+' -> '+rw+'x'+rh);assert.ok(rw<=w*1.25+1);}
 assert.deepEqual(size(1920,1080,1,med),[1920,1080],'a 1080p window renders at 1080p, not forced to anything else');assert.deepEqual(size(1920,1080,2,med),[2400,1350]);assert.ok(size(3840,2160,2,presets.high)[0]===3840,'High still reaches 4K for players who choose it');
});
test('the game page and settings: Medium default text, a reset control, no automatic quality changes anywhere',()=>{
 const bi=read('babylon-integration.js');assert.match(bi,/quality: VoidGraphicsPrefs\.DEFAULT/);assert.match(bi,/Reset graphics to Medium/);assert.match(bi,/VoidGraphics\.chosen = true/);assert.doesNotMatch(bi,/High is the default/);
 const html=fs.readFileSync(path.join(__dirname,'..','void-runner.html'),'utf8');assert.ok(html.indexOf('void-runner/graphics-prefs.js')>0&&html.indexOf('void-runner/graphics-prefs.js')<html.indexOf('void-runner/babylon-integration.js'),'the rules load before the integration script');
 for(const f of fs.readdirSync(path.join(__dirname,'..','void-runner')).filter(x=>x.endsWith('.js'))){const t=read(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,'');if(f==='graphics-prefs.js')continue;assert.ok(!/setQuality\s*\(\s*['"]ultra['"]\s*\)/.test(t),f+' must not switch to Ultra by itself');}
});
