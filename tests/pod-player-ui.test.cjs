/* The DARKNET·AMP on the Sleeping Pod wall (pod-player-ui.js): every button's click region, the song list's paging, and that the pop-up is gone (the owner, 16 Nov 2026). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const U=require('../void-runner/pod-player-ui.js'),A=require('../void-runner/district-area.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const P={view:'player',source:'website',count:27,offset:0},L=(o={})=>({view:'list',source:'website',count:27,offset:0,...o});
test('player view: transport, volume, source, shuffle, repeat, title and PL',()=>{
 assert.deepEqual([35,75,115,155,195].map(x=>U.hit(P,x,160).action),['previous','play','pause','stop','next']);
 assert.equal(U.hit(P,254,160).value,0);assert.equal(U.hit(P,366,160).value,1);assert.ok(Math.abs(U.hit(P,310,160).value-.5)<.01);
 assert.deepEqual(U.hit(P,300,38),{action:'source',source:'website'});assert.deepEqual(U.hit(P,300,58),{action:'source',source:'mine'});
 assert.equal(U.hit(P,270,78).action,'shuffle');assert.equal(U.hit(P,340,78).action,'repeat');
 assert.equal(U.hit(P,200,124).action,'list');assert.equal(U.hit(P,350,13).action,'list');
 assert.equal(U.hit(P,53,160),null,'the gap between two buttons is not a button');assert.equal(U.hit(P,100,60),null);assert.equal(U.hit(P,-1,5),null);assert.equal(U.hit(P,400,5),null);
});
test('list view: tabs, rows by offset, scroll buttons, mine-only buttons',()=>{
 assert.equal(U.hit(L(),100,34).source,'website');assert.equal(U.hit(L(),177,34).source,'mine');
 assert.equal(U.hit(L(),247,34),null,'ADD SONGS only on My music');assert.equal(U.hit(L(),300,34),null);
 assert.deepEqual(U.hit(L(),100,46+8),{action:'track',index:0});assert.deepEqual(U.hit(L(),100,46+5*16+8),{action:'track',index:5});
 assert.deepEqual(U.hit(L({offset:21}),100,46+5*16+8),{action:'track',index:26});
 assert.deepEqual(U.hit(L(),364,50),{action:'scroll',delta:-1});assert.deepEqual(U.hit(L(),364,46+6*16-8),{action:'scroll',delta:1});
 assert.equal(U.hit(L(),364,100).action,'scroll');assert.equal(U.hit(L(),364,100).delta,U.ROWS,'below the thumb pages down');
 const M=L({source:'mine',count:3});assert.equal(U.hit(M,247,34).action,'add');assert.equal(U.hit(M,330,34).action,'clear');assert.equal(U.hit(M,300,183).action,'keep');
 assert.deepEqual(U.hit(M,337,46+8),{action:'remove',index:0});assert.equal(U.hit(M,100,46+3*16+8),null,'past the last song');assert.equal(U.hit({...M,count:0},330,34),null,'nothing to clear');
 assert.equal(U.hit(L(),35,160).action,'previous','transport works in the list view too');
});
test('paging helpers',()=>{
 assert.equal(U.maxOffset(27),21);assert.equal(U.maxOffset(3),0);assert.equal(U.clampOffset(99,27),21);assert.equal(U.clampOffset(-4,27),0);
 assert.equal(U.offsetFor(0,27),0);assert.equal(U.offsetFor(10,27),8);assert.equal(U.offsetFor(26,27),21);assert.equal(U.offsetFor(-1,27),0);
 const t=U.thumbOf(27,0),e=U.thumbOf(27,21);assert.ok(t.y<e.y&&e.y+e.h<=U.R.gutter[1]+U.R.gutter[3]+.01);
 U.reset();assert.equal(U.toggleList({index:15,count:27}),'list');assert.equal(U.ui.offset,13);U.scroll(100,27);assert.equal(U.ui.offset,21);assert.equal(U.toggleList(),'player');U.reset();
});
test('every region lies on the 384x192 face and none overlaps another in its view',()=>{
 for(const [k,r] of Object.entries(U.R).filter(([k])=>k!=='transport'))assert.ok(r[0]>=0&&r[1]>=0&&r[0]+r[2]<=U.W&&r[1]+r[3]<=U.H,k);
 const rects={player:['pl','site','mine','shuffle','repeat','title',...U.R.transport.map((_,i)=>i),'volume'],list:['pl','tabSite','tabMine','add','clear','list','up','down','gutter','keep','volume',...U.R.transport.map((_,i)=>i)]};
 for(const v in rects){const rs=rects[v].map(k=>typeof k==='number'?U.R.transport[k]:U.R[k]);for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];assert.ok(a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1],v+' regions '+rects[v][i]+' and '+rects[v][j]+' overlap');}}
});
test('the wall face is what podControl asks, in both uv spaces',()=>{
 assert.equal(A.podControl('music',200/384,124/192,P).action,'list');assert.equal(A.podControl('music',100/384,54/192,L()).index,0);
 assert.equal(A.podControl('music',1.2,.5,P),null);
});
test('the pop-up is gone: no panel, no M key, no room prompt; the wall player is in the page before the scene',()=>{
 const m=read('void-runner/pod-music.js'),w=read('void-runner/world-integration.js'),h=read('void-runner.html');
 assert.ok(!m.includes("panel('SLEEPING POD / MUSIC'")&&!/open\s*[:(,]|open,/.test(m.slice(m.indexOf('const api={'))),'no open() on the player');
 assert.ok(!m.includes('district-pod-music')&&!m.includes("mode='equipment'"));assert.ok(!w.includes('podAct.music')&&!w.includes('KeyM'));
 assert.ok(h.indexOf('pod-player-ui.js')>0&&h.indexOf('pod-player-ui.js')<h.indexOf('neochinatown.js'));assert.ok(!/press (Q|M)/i.test(w));
});
test('painting does not throw for an idle face, a playing list and My music',()=>{
 const calls=[],g=new Proxy({canvas:{width:768},measureText:s=>({width:String(s).length*6}),createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k);},set:()=>true});
 U.reset();U.draw(g,1,null);const st={source:'website',playing:true,title:'A',position:5,volume:.5,shuffle:true,repeat:'all',index:1,count:2,list:[{label:'A'},{label:'B',failed:true}],keeping:false,status:'x'};U.draw(g,1,st);
 U.toggleList(st);U.draw(g,1,st);U.draw(g,1,{...st,source:'mine',list:[],count:0,keeping:true});U.draw(g,2,null);U.reset();assert.ok(calls.length>50);
});
