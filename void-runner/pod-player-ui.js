/* The DARKNET·AMP on the Sleeping Pod's right-hand wall: its layout, what a click on each part does, and how it is drawn (David, 16 Nov 2026: the wall player
   does everything and the pop-up panel is gone). Pure rules plus a canvas painter: it runs in the browser and in Node (tests/pod-player-ui.test.cjs).
   Coordinates are in a 384 x 192 design space; the painter scales to whatever size the wall texture is. The playback itself is pod-music.js, untouched. */
(function(root){
 'use strict';
 const W=384,H=192,ROWS=6,ROW_H=16,LIST_Y=46;
 const R={
  pl:[330,5,42,17],title:[10,112,364,24],
  transport:[18,58,98,138,178].map(x=>[x,146,34,28]),volume:[248,146,124,30],
  site:[244,30,132,17],mine:[244,50,132,17],shuffle:[244,70,54,17],repeat:[302,70,74,17],
  tabSite:[10,26,128,16],tabMine:[142,26,70,16],add:[218,26,58,16],clear:[280,26,94,16],
  list:[10,LIST_Y,340,ROWS*ROW_H],up:[354,LIST_Y,20,22],down:[354,LIST_Y+ROWS*ROW_H-22,20,22],gutter:[354,LIST_Y+22,20,ROWS*ROW_H-44],keep:[250,177,124,14]
 };
 const inside=(r,x,y)=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];
 const ACTIONS=['previous','play','pause','stop','next'];
 const maxOffset=count=>Math.max(0,(Number(count)||0)-ROWS);
 const clampOffset=(offset,count)=>Math.max(0,Math.min(maxOffset(count),Math.round(Number(offset)||0)));
 // The first row to show so that song `index` is in view, a little below the top when the list is long.
 const offsetFor=(index,count)=>index>=0?clampOffset(index-2,count):0;
 /* ctx: {view:'player'|'list', source:'website'|'mine', count, offset}. Returns what the click at design point (x, y) does, or null. */
 function hit(ctx,x,y){
  const view=ctx&&ctx.view==='list'?'list':'player',mine=ctx&&ctx.source==='mine',count=(ctx&&ctx.count)|0,offset=clampOffset(ctx&&ctx.offset,count);
  if(!(x>=0&&x<=W&&y>=0&&y<=H))return null;
  if(inside(R.pl,x,y))return {action:'list'};
  for(let k=0;k<5;k++)if(inside(R.transport[k],x,y))return {action:ACTIONS[k]};
  if(inside(R.volume,x,y)&&x>=254&&x<=366)return {action:'volume',value:Math.max(0,Math.min(1,(x-254)/112))};
  if(view==='player'){
   if(inside(R.site,x,y))return {action:'source',source:'website'};
   if(inside(R.mine,x,y))return {action:'source',source:'mine'};
   if(inside(R.shuffle,x,y))return {action:'shuffle'};if(inside(R.repeat,x,y))return {action:'repeat'};
   if(inside(R.title,x,y))return {action:'list'};
   return null;
  }
  if(inside(R.tabSite,x,y))return {action:'source',source:'website'};if(inside(R.tabMine,x,y))return {action:'source',source:'mine'};
  if(mine){if(inside(R.add,x,y))return {action:'add'};if(inside(R.clear,x,y))return count?{action:'clear'}:null;if(inside(R.keep,x,y))return {action:'keep'};}
  if(inside(R.up,x,y))return {action:'scroll',delta:-1};if(inside(R.down,x,y))return {action:'scroll',delta:1};
  if(inside(R.gutter,x,y)){const thumb=thumbOf(count,offset);return {action:'scroll',delta:y<thumb.y?-ROWS:y>thumb.y+thumb.h?ROWS:0};}
  if(inside(R.list,x,y)){const row=Math.floor((y-LIST_Y)/ROW_H),index=offset+row;if(index>=count)return null;
   return mine&&x>=R.list[0]+R.list[2]-20?{action:'remove',index}:{action:'track',index};}
  return null;
 }
 function thumbOf(count,offset){const top=R.gutter[1],h=R.gutter[3],m=maxOffset(count);if(!m)return {y:top,h};const th=Math.max(10,h*ROWS/count);return {y:top+(h-th)*offset/m,h:th};}
 // The wall's own state: which view is showing and where the list is scrolled. One player is looked at at a time.
 const ui={view:'player',offset:0,keepSeen:false};
 function toggleList(song){ui.view=ui.view==='list'?'player':'list';if(ui.view==='list')ui.offset=offsetFor(song&&song.index,song&&song.count);return ui.view;}
 function scroll(delta,count){ui.offset=clampOffset(ui.offset+delta,count);return ui.offset;}
 function reset(){ui.view='player';ui.offset=0;}
 const sig=()=>ui.view+'|'+ui.offset;

 const text=(g,s,x,y,max)=>{s=String(s);while(s.length>1&&g.measureText(s).width>max)s=s.slice(0,-2);return g.fillText(s,x,y);};
 function button(g,r,label,on,size){
  g.fillStyle=on?'#1d4a30':'#16221c';g.fillRect(r[0],r[1],r[2],r[3]);g.strokeStyle=on?'#63ff8f':'#31503f';g.lineWidth=1;g.strokeRect(r[0]+.5,r[1]+.5,r[2]-1,r[3]-1);
  g.fillStyle=on?'#63ff8f':'#9fc0ab';g.font='bold '+(size||10)+'px monospace';g.textAlign='center';g.fillText(label,r[0]+r[2]/2,r[1]+r[3]/2+(size||10)*.36);g.textAlign='left';
 }
 /* Paints the player. g: a 2D context of any size (scaled to the 384 x 192 design space); index: the pod number; st: null (idle) or the state of VoidPodMusic.state(). */
 function draw(g,index,st){
  const cw=g.canvas&&g.canvas.width||W;g.save();g.setTransform(cw/W,0,0,cw/W,0,0);
  const on=!!st&&!!st.title,t=on?Math.max(0,Math.floor(st.position||0)):0,mm=String(Math.floor(t/60)).padStart(2,'0'),ss=String(t%60).padStart(2,'0'),list=ui.view==='list'&&!!st,mine=!!st&&st.source==='mine';
  g.textAlign='left';g.textBaseline='alphabetic';
  g.fillStyle='#05080a';g.fillRect(0,0,W,H);g.strokeStyle='#2a3a33';g.lineWidth=2;g.strokeRect(2,2,W-4,H-4);
  g.fillStyle='#6f8f7c';g.font='bold 13px monospace';g.fillText('DARKNET·AMP  v2.9',12,20);g.fillStyle='#e96bbf';g.fillText('POD '+String(index).padStart(2,'0'),W-124,20);
  button(g,R.pl,'PL',list,11);
  if(!list){
   g.fillStyle=on&&st.playing?'#63ff8f':'#2f6b45';g.fillRect(14,34,10,10);
   g.fillStyle=on?'#63ff8f':'#2f6b45';g.font='bold 58px monospace';g.fillText(mm+':'+ss,34,84);
   g.font='12px monospace';g.fillStyle='#4fae6c';g.fillText('128 kbps   44 kHz   '+(on?(st.playing?'PLAYING':'PAUSED'):'STOPPED'),14,104);
   button(g,R.site,'WEBSITE PLAYLIST',!mine,10);button(g,R.mine,'MY MUSIC',mine,10);
   button(g,R.shuffle,'SHUFFLE',!!st&&st.shuffle,10);button(g,R.repeat,'REPEAT: '+String(st?st.repeat:'off').toUpperCase(),!!st&&st.repeat&&st.repeat!=='off',10);
   g.fillStyle='#0b1410';g.fillRect(10,112,W-20,24);g.fillStyle='#63ff8f';g.font='bold 15px monospace';
   const title=on?String(st.title).replace(/[^\x20-\x7e]/g,'').slice(0,60):'NO TRACK  ***  CLICK HERE TO CHOOSE A SONG',shift=on&&title.length>36?Math.floor((st.position||0)*2)%(title.length+5):0;
   g.save();g.beginPath();g.rect(12,112,W-24,24);g.clip();g.fillText((title+'  ***  '+title).slice(shift,shift+44),16,129);g.restore();
  }else{
   button(g,R.tabSite,'WEBSITE PLAYLIST',!mine,10);button(g,R.tabMine,'MY MUSIC',mine,10);
   if(mine){button(g,R.add,'ADD SONGS',false,9);button(g,R.clear,'CLEAR PLAYLIST',false,9);}
   const items=st&&st.list||[],offset=clampOffset(ui.offset,items.length);
   g.fillStyle='#0b1410';g.fillRect(R.list[0],R.list[1],R.list[2],R.list[3]);g.font='bold 11px monospace';
   if(!items.length){g.fillStyle='#4fae6c';g.fillText(mine?'NO SONGS YET. CHOOSE ADD SONGS.':'NO SONGS.',18,LIST_Y+19);}
   for(let r=0;r<ROWS&&offset+r<items.length;r++){const i=offset+r,it=items[i],y=LIST_Y+r*ROW_H,cur=i===st.index;
    if(cur){g.fillStyle='rgba(99,255,143,.2)';g.fillRect(R.list[0],y,R.list[2],ROW_H);}
    g.fillStyle=it.failed?'#ff8a9a':cur?'#63ff8f':'#8fbf9f';g.fillText(String(i+1).padStart(2,'0'),14,y+12);text(g,String(it.label).replace(/[^\x20-\x7e]/g,''),38,y+12,mine?270:300);
    if(mine){g.fillStyle='#c08090';g.fillText('x',R.list[0]+R.list[2]-14,y+12);}}
   button(g,R.up,'^',false,11);button(g,R.down,'v',false,11);g.fillStyle='#0b1410';g.fillRect(R.gutter[0],R.gutter[1],R.gutter[2],R.gutter[3]);
   const th=thumbOf(items.length,offset);g.fillStyle='#31503f';g.fillRect(R.gutter[0]+3,th.y,R.gutter[2]-6,th.h);
  }
  for(let k=0;k<5;k++){const r=R.transport[k],glyph=['|<','>','||','[]','>|'][k],lit=(on&&st.playing&&k===1)||(on&&!st.playing&&k===2);g.fillStyle='#16221c';g.fillRect(r[0],r[1],r[2],r[3]);g.strokeStyle='#31503f';g.lineWidth=1;g.strokeRect(r[0]+.5,r[1]+.5,r[2]-1,r[3]-1);g.fillStyle=lit?'#63ff8f':'#7fa08c';g.font='bold 14px monospace';g.fillText(glyph,r[0]+8,165);}
  g.fillStyle='#4fae6c';g.font='11px monospace';g.fillText('VOL',226,164);g.fillStyle='#16221c';g.fillRect(254,154,112,10);g.fillStyle='#b8d94a';g.fillRect(254,154,Math.round(112*Math.max(0,Math.min(1,st?st.volume??.6:.6))),10);
  g.fillStyle='#4fae6c';g.font='11px monospace';
  const note=st&&st.status?st.status:on||list?(mine?'MY MUSIC':'DISTRICT PLAYLIST'):'CLICK TITLE: PLAYLIST';
  text(g,note,10,188,list&&mine?236:360);
  if(list&&mine)button(g,R.keep,'KEEP MY SONGS: '+(st&&st.keeping?'ON':'OFF'),!!st&&st.keeping,9);
  g.restore();
 }
 const api={W,H,ROWS,ROW_H,LIST_Y,R,ACTIONS,hit,maxOffset,clampOffset,offsetFor,thumbOf,ui,toggleList,scroll,reset,sig,draw};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidPodPlayerUI=api;
})(typeof globalThis!=='undefined'?globalThis:this);
