/* The advertisement screens (David, 16 Nov 2026): the pictures, the screen objects and their sound.
   What they show and where is ad-screens-data.js (David's words, the location table, the every-5th rule); the weekly board is warflying-board.js.
   - LOOKS: one visual template per category (colour, type, motion and a moving motif), painted on a canvas. The same painter draws a tall street screen and
     a wide station screen (relay-screens.js uses it for Meridian).
   - A FEED is one channel: a programme, one canvas texture and one material, shared by every screen that shows it. A quarter has one feed per zone on Low
     and two on Medium and up. A feed is redrawn a few times a second, and only while one of its screens is near and in front of the player.
   - The text is the caption: a line appears word by word in step with the recording being played, or at reading pace when there is no recording.
   - SOUND comes from the screen: level and left/right by where it stands (area-ambience.js heard()). Only one voice ever plays (the screen heard best), so
     two screens never talk over each other; the nearest two hum. Nothing is said in a checkpoint lane, indoors, during a conversation or while the radio's
     Relay is talking. Voices go to the Voice channel and the hum and chimes to the Ambient channel, so the game's volume sliders and mute apply.
   - A line with no recording is silent. NOTHING is recorded here: the broadcast voices are provisional until David picks them by ear. */
(function(root){
 'use strict';
 const D=root.VoidAdData,TAU=Math.PI*2;
 const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v,ease=t=>{t=clamp(t);return 1-Math.pow(1-t,3);},back=t=>{t=clamp(t);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
 const hash=(a,b=0)=>{let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
 const SANS='"Arial Black","Helvetica Neue",Arial,sans-serif',COND='Impact,"Arial Narrow","Helvetica Neue",Arial,sans-serif',SERIF='Georgia,"Times New Roman",serif',MONO='Consolas,"Courier New",monospace',ROUND='"Trebuchet MS",Verdana,Arial,sans-serif';

 // ---------------------------------------------------------------- text
 function wrap(g,text,width){const out=[];let line='';for(const w of String(text).split(/\s+/).filter(Boolean)){const test=line?line+' '+w:w;if(line&&g.measureText(test).width>width){out.push(line);line=w;}else line=test;}if(line)out.push(line);return out;}
 // The largest size at which the text fits the width in at most `rows` lines (and, when given, a height of `tall`).
 function fit(g,text,font,width,max,min,rows,tall=1e9){let px=max,lines=[];for(;px>=min;px-=Math.max(1,px*.07)){g.font=font(Math.round(px));lines=wrap(g,text,width);if(lines.length<=rows&&lines.length*px*1.3<=tall&&lines.every(l=>g.measureText(l).width<=width))break;}g.font=font(Math.round(px));return {px:Math.round(px),lines:wrap(g,text,width)};}
 // Draws wrapped lines with the first `shown` words lit (shown may be fractional: the word arriving pops in).
 function words(g,lines,x,y,lh,shown,on,off,align='left',width=0){
  let k=0;const prev=g.textAlign;g.textAlign='left';
  for(let i=0;i<lines.length;i++){const ws=lines[i].split(' '),lw=g.measureText(lines[i]).width;let cx=align==='center'?x+(width-lw)/2:x;
   for(const w of ws){const a=clamp(shown-k);if(a>0||off){g.globalAlpha=a>0?.25+.75*a:1;g.fillStyle=a>0?on:off;g.fillText(w,cx,y+i*lh+(a>0?(1-ease(a))*lh*.18:0));}cx+=g.measureText(w+' ').width;k++;}}
  g.globalAlpha=1;g.textAlign=prev;
 }
 const count=text=>String(text).split(/\s+/).filter(Boolean).length;

 // ---------------------------------------------------------------- the looks
 /* Each look: pal {a: background dark, b: background light, ink: text, hi: accent, lo: second accent}, type {brand, body: font makers}, enter (how a brand
    arrives: 'slide' | 'pop' | 'drop' | 'type' | 'glitch' | 'fade' | 'wipe'), caps (brand in capitals), back(g,W,H,t,pal) (the moving background) and
    motif(g,x,y,r,t,pal) (the moving emblem, drawn in a circle of radius r around x,y). */
 const F=(w,f)=>px=>w+' '+px+'px '+f;
 const LOOKS={
  cyber:{pal:{a:'#01090b',b:'#06282e',ink:'#eafffb',hi:'#3ff2c0',lo:'#0f6f63'},type:{brand:F('700',ROUND),body:F('400',MONO)},enter:'glitch',
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.2);g.strokeStyle='rgba(63,242,192,.07)';g.lineWidth=1;const s=W/9;for(let i=0;i<12;i++)for(let j=0;j<16;j++){const x=i*s+(j%2)*s/2,y=j*s*.86-((t*12)%(s*1.72));g.beginPath();for(let k=0;k<6;k++)g.lineTo(x+Math.cos(k/6*TAU)*s*.28,y+Math.sin(k/6*TAU)*s*.28);g.closePath();g.stroke();}
    const y=((t*.22)%1.3-.15)*H;band(g,0,y,W,H*.1,'rgba(63,242,192,.10)');},
   motif(g,x,y,r,t,p){g.lineCap='butt';for(let i=0;i<4;i++){const rr=r*(.38+i*.2),a=t*(i%2?-.9:.6)*(1+i*.2);g.strokeStyle=i===1?p.ink:p.hi;g.globalAlpha=.9-i*.15;g.lineWidth=r*(i===0?.12:.045);g.beginPath();g.arc(x,y,rr,a,a+TAU*(.55+.1*i));g.stroke();}g.globalAlpha=1;
    g.fillStyle=p.hi;g.beginPath();g.arc(x,y,r*.16*(1+.12*Math.sin(t*5)),0,TAU);g.fill();g.strokeStyle=p.ink;g.lineWidth=r*.02;for(let k=0;k<4;k++){const a=k/4*TAU+Math.PI/4;g.beginPath();g.moveTo(x+Math.cos(a)*r*1.02,y+Math.sin(a)*r*1.02);g.lineTo(x+Math.cos(a)*r*1.2,y+Math.sin(a)*r*1.2);g.stroke();}}},
  food:{pal:{a:'#3a0f04',b:'#a5330a',ink:'#fff5e1',hi:'#ffd23f',lo:'#ff7a1a'},type:{brand:F('400',COND),body:F('700',ROUND)},enter:'pop',
   back(g,W,H,t,p){rad(g,W,H,W*.5,H*.3,p.b,p.a);g.save();g.translate(W/2,H*.3);g.rotate(t*.12);g.fillStyle='rgba(255,210,63,.07)';for(let i=0;i<12;i++){g.rotate(TAU/12);g.beginPath();g.moveTo(0,0);g.lineTo(-W*.09,-H);g.lineTo(W*.09,-H);g.fill();}g.restore();
    for(let i=0;i<14;i++){const x=hash(i,1)*W,y=H-((t*(18+hash(i,2)*30)+hash(i,3)*H)%(H*1.1)),s=W*.012*(1+hash(i,4));g.fillStyle=i%2?'rgba(255,210,63,.5)':'rgba(255,245,225,.35)';g.beginPath();g.arc(x+Math.sin(t+i)*8,y,s,0,TAU);g.fill();}},
   motif(g,x,y,r,t,p){const b=Math.abs(Math.sin(t*2.4))*r*.08;g.strokeStyle='rgba(255,245,225,.8)';g.lineWidth=r*.07;g.lineCap='round';for(let i=-1;i<=1;i++){g.beginPath();for(let k=0;k<=10;k++){const yy=y-r*.15-k*r*.085-b,xx=x+i*r*.36+Math.sin(k*.9+t*3+i)*r*.09;k?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.globalAlpha=.55;g.stroke();}g.globalAlpha=1;
    g.fillStyle=p.hi;g.beginPath();g.arc(x,y+r*.05-b,r*.78,0,Math.PI);g.closePath();g.fill();g.fillStyle=p.lo;g.fillRect(x-r*.86,y-r*.02-b,r*1.72,r*.13);g.fillStyle=p.ink;g.fillRect(x-r*.3,y+r*.8-b,r*.6,r*.1);
    g.strokeStyle=p.ink;g.lineWidth=r*.05;for(let i=0;i<5;i++){g.beginPath();g.arc(x-r*.5+i*r*.25,y-r*.02-b,r*.12,Math.PI,TAU);g.stroke();}}},
  dating:{pal:{a:'#22031c',b:'#8c1161',ink:'#fff0fa',hi:'#ff7ac8',lo:'#ffc4ea'},type:{brand:F('italic 700',SERIF),body:F('italic 400',SERIF)},enter:'fade',
   back(g,W,H,t,p){lin(g,W,H,p.b,p.a,-.25);for(let i=0;i<16;i++){const s=W*(.04+hash(i,5)*.1),x=hash(i,6)*W+Math.sin(t*.4+i)*W*.04,y=H-((t*(10+hash(i,7)*18)+hash(i,8)*H*1.2)%(H*1.25))+s;const q=g.createRadialGradient(x,y,0,x,y,s);q.addColorStop(0,'rgba(255,160,220,.22)');q.addColorStop(1,'rgba(255,160,220,0)');g.fillStyle=q;g.fillRect(x-s,y-s,s*2,s*2);}},
   motif(g,x,y,r,t,p){const beat=1+.09*Math.pow(Math.max(0,Math.sin(t*4.2)),6)+.05*Math.pow(Math.max(0,Math.sin(t*4.2-.9)),6);for(let k=2;k>=0;k--){const s=r*.9*beat*(1+k*.22);g.globalAlpha=k?.16:1;g.fillStyle=k?p.lo:p.hi;g.beginPath();g.moveTo(x,y+s*.75);g.bezierCurveTo(x-s*1.5,y-s*.1,x-s*.6,y-s*1.05,x,y-s*.35);g.bezierCurveTo(x+s*.6,y-s*1.05,x+s*1.5,y-s*.1,x,y+s*.75);g.fill();}g.globalAlpha=1;
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(x-r*.34,y-r*.3,r*.12,r*.2,-.6,0,TAU);g.fill();}},
  corporate:{pal:{a:'#070d18',b:'#12233c',ink:'#eef3fa',hi:'#dfe8f5',lo:'#2f7bff'},type:{brand:F('700','"Helvetica Neue",Arial,sans-serif'),body:F('300','"Helvetica Neue",Arial,sans-serif')},enter:'wipe',caps:true,track:.12,
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,0);g.strokeStyle='rgba(223,232,245,.05)';g.lineWidth=1;const s=W/8;for(let x=0;x<=W;x+=s){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=(t*6)%s;y<=H;y+=s){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}g.fillStyle=p.lo;g.fillRect(0,0,W,H*.012);g.fillRect(0,H*.988,W,H*.012);},
   motif(g,x,y,r,t,p){g.strokeStyle=p.hi;g.lineWidth=r*.035;g.strokeRect(x-r*.8,y-r*.8,r*1.6,r*1.6);const n=6;for(let i=0;i<n;i++){const h=r*1.3*(.25+.75*ease(((t*.35+i*.11)%1)*1.4))*(.45+i*.11);g.fillStyle=i===n-1?p.lo:'rgba(223,232,245,'+(.35+i*.1)+')';g.fillRect(x-r*.66+i*r*.225,y+r*.66-h,r*.15,h);}
    g.strokeStyle=p.lo;g.lineWidth=r*.04;g.beginPath();const q=(t*.35)%1;for(let i=0;i<=20;i++){if(i/20>q*1.3)break;const xx=x-r*.7+i*r*.07,yy=y+r*.4-i*r*.05-Math.sin(i*1.3)*r*.06;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}},
  health:{pal:{a:'#bfdcd6',b:'#eaf6f3',ink:'#0c3a3a',hi:'#e23b4e',lo:'#1c9a8c'},type:{brand:F('700',ROUND),body:F('400',ROUND)},enter:'slide',
   back(g,W,H,t,p){lin(g,W,H,p.b,p.a,.5);g.strokeStyle='rgba(28,154,140,.13)';g.lineWidth=1;const s=W/16;for(let x=-(t*14)%s;x<=W;x+=s){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<=H;y+=s){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    const y0=H*.93,amp=H*.045;g.strokeStyle=p.hi;g.lineWidth=Math.max(2,W*.007);g.lineJoin='round';g.beginPath();for(let x=0;x<=W;x+=4){const u=((x/W*2.2-t*.55)%1+1)%1;const v=u<.06?-u/.06*.25:u<.1?-.25+(u-.06)/.04*1.25:u<.14?1-(u-.1)/.04*1.6:u<.18?-.6+(u-.14)/.04*.6:u>.3&&u<.42?Math.sin((u-.3)/.12*Math.PI)*.22:0;x?g.lineTo(x,y0-v*amp):g.moveTo(x,y0-v*amp);}g.stroke();},
   motif(g,x,y,r,t,p){const s=r*(.92+.06*Math.sin(t*3));g.fillStyle='rgba(28,154,140,.16)';g.beginPath();g.arc(x,y,r*(1.05+.12*((t*.6)%1)),0,TAU);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(x,y,s*.9,0,TAU);g.fill();g.fillStyle=p.hi;g.fillRect(x-s*.17,y-s*.58,s*.34,s*1.16);g.fillRect(x-s*.58,y-s*.17,s*1.16,s*.34);g.strokeStyle=p.lo;g.lineWidth=r*.05;g.beginPath();g.arc(x,y,s*.9,t,t+TAU*.3);g.stroke();}},
  housing:{pal:{a:'#070a16',b:'#152038',ink:'#f6efe0',hi:'#ffcf7a',lo:'#6f86b8'},type:{brand:F('700',SERIF),body:F('400',SERIF)},enter:'drop',
   back(g,W,H,t,p){lin(g,W,H,p.b,p.a,.5);for(let b=0;b<7;b++){const bw=W*(.12+hash(b,11)*.1),bx=b*W/6.2-W*.04+hash(b,12)*W*.04,bh=H*(.25+hash(b,13)*.4);g.fillStyle='rgba(4,6,14,.75)';g.fillRect(bx,H-bh,bw,bh);const cw=bw/5,ch=cw*1.25;for(let i=0;i<4;i++)for(let j=0;j<Math.floor(bh/ch)-1;j++){const on=hash(b*31+i,j*7+Math.floor(t*.35+hash(b+i,j)*9))>.56;g.fillStyle=on?'rgba(255,207,122,.55)':'rgba(111,134,184,.10)';g.fillRect(bx+cw*.6+i*cw,H-bh+ch*.6+j*ch,cw*.55,ch*.6);}}},
   motif(g,x,y,r,t,p){g.strokeStyle=p.hi;g.lineWidth=r*.06;g.lineJoin='miter';g.beginPath();g.moveTo(x-r*.85,y-r*.05);g.lineTo(x,y-r*.85);g.lineTo(x+r*.85,y-r*.05);g.stroke();g.strokeRect(x-r*.62,y-r*.05,r*1.24,r*.9);const k=Math.floor(t*.8)%4;for(let i=0;i<4;i++){g.fillStyle=i===k?p.hi:'rgba(255,207,122,.18)';g.fillRect(x-r*.46+(i%2)*r*.52,y+r*.08+Math.floor(i/2)*r*.38,r*.4,r*.28);}}},
  transport:{pal:{a:'#0b0b0c',b:'#26221a',ink:'#fffbe8',hi:'#ffd400',lo:'#e23b2f'},type:{brand:F('italic 400',COND),body:F('700',ROUND)},enter:'slide',caps:true,
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.5);const vx=W*.5,vy=H*.36;g.strokeStyle='rgba(255,212,0,.25)';g.lineWidth=2;for(let i=-4;i<=4;i++){g.beginPath();g.moveTo(vx,vy);g.lineTo(vx+i*W*.4,H);g.stroke();}for(let k=0;k<7;k++){const u=((k/7+t*.3)%1),y=vy+(H-vy)*u*u;g.globalAlpha=u;g.fillStyle=p.hi;g.fillRect(vx-W*.012*(1+u*5),y,W*.024*(1+u*5),H*.03*u);}g.globalAlpha=1;
    for(const y of [0,H*.955]){g.fillStyle=p.hi;g.fillRect(0,y,W,H*.045);g.fillStyle='#0b0b0c';const s=H*.045;for(let x=-s*2+((t*40)%(s*2));x<W+s;x+=s*2){g.beginPath();g.moveTo(x,y+s);g.lineTo(x+s,y);g.lineTo(x+s*2,y);g.lineTo(x+s,y+s);g.fill();}}},
   motif(g,x,y,r,t,p){const sh=Math.sin(t*22)*r*.012;g.fillStyle=p.hi;rr(g,x-r*.95,y-r*.1+sh,r*1.9,r*.5,r*.12);g.fill();g.beginPath();g.moveTo(x-r*.55,y-r*.1+sh);g.lineTo(x-r*.35,y-r*.5+sh);g.lineTo(x+r*.4,y-r*.5+sh);g.lineTo(x+r*.62,y-r*.1+sh);g.fill();g.fillStyle='#0b0b0c';g.fillRect(x-r*.28,y-r*.42+sh,r*.3,r*.26);g.fillRect(x+r*.08,y-r*.42+sh,r*.3,r*.26);
    for(const s of [-1,1]){g.fillStyle='#0b0b0c';g.beginPath();g.arc(x+s*r*.55,y+r*.4,r*.2,0,TAU);g.fill();g.strokeStyle=p.ink;g.lineWidth=r*.04;g.beginPath();g.arc(x+s*r*.55,y+r*.4,r*.1,t*9,t*9+4);g.stroke();}g.fillStyle=p.lo;g.fillRect(x-r*.95,y+r*.1+sh,r*.1,r*.12);g.fillStyle=p.ink;g.fillRect(x+r*.85,y+r*.1+sh,r*.1,r*.12);}},
  tech:{pal:{a:'#000300',b:'#031106',ink:'#d2ffc9',hi:'#39ff14',lo:'#ff2bd6'},type:{brand:F('700',MONO),body:F('400',MONO)},enter:'type',
   back(g,W,H,t,p){g.fillStyle=p.a;g.fillRect(0,0,W,H);const cw=W/22;g.font='bold '+Math.round(cw)+'px '+MONO;g.textAlign='center';for(let c=0;c<22;c++){const sp=.25+hash(c,21)*.6,head=((t*sp+hash(c,22))%1.3)*H;for(let k=0;k<12;k++){const y=head-k*cw*1.15;if(y<0||y>H)continue;g.fillStyle=k?'rgba(57,255,20,'+(.3-k*.024)+')':'rgba(210,255,201,.75)';g.fillText(String.fromCharCode(0x30A0+Math.floor(hash(c*13+k,Math.floor(t*6+c))*90)),c*cw+cw/2,y);}}g.textAlign='left';
    if(hash(Math.floor(t*7),3)>.82){const y=hash(Math.floor(t*7),4)*H;g.fillStyle='rgba(255,43,214,.16)';g.fillRect(0,y,W,H*.03);}},
   motif(g,x,y,r,t,p){g.strokeStyle=p.hi;g.lineWidth=r*.05;const j=hash(Math.floor(t*9),9)>.8?(hash(Math.floor(t*9),8)-.5)*r*.3:0;g.strokeRect(x-r*.9+j,y-r*.62,r*1.8,r*1.24);g.fillStyle='rgba(57,255,20,.12)';g.fillRect(x-r*.9+j,y-r*.62,r*1.8,r*.24);g.fillStyle=p.hi;for(let i=0;i<3;i++){g.beginPath();g.arc(x-r*.72+i*r*.16+j,y-r*.5,r*.045,0,TAU);g.fill();}
    g.lineWidth=r*.07;g.beginPath();g.moveTo(x-r*.6,y-r*.12);g.lineTo(x-r*.3,y+r*.1);g.lineTo(x-r*.6,y+r*.32);g.stroke();if(Math.floor(t*2.4)%2)g.fillRect(x-r*.15,y+r*.22,r*.5,r*.1);
    g.fillStyle=p.lo;g.globalAlpha=.7;for(let i=0;i<5;i++){const w=r*(.2+hash(i,Math.floor(t*4))*.9);g.fillRect(x+r*.8-w,y-r*.28+i*r*.13,w*.4,r*.04);}g.globalAlpha=1;}},
  government:{pal:{a:'#101114',b:'#22242a',ink:'#f4f2ea',hi:'#c8372b',lo:'#8d9099'},type:{brand:F('700',SERIF),body:F('700',SERIF)},enter:'fade',
   back(g,W,H,t,p){lin(g,W,H,p.b,p.a,.5);g.fillStyle='rgba(255,255,255,.025)';const s=W/12;for(let i=0;i<12;i+=2)g.fillRect(i*s,0,s,H);const y=((t*.09)%1.4-.2)*H;band(g,0,y,W,H*.22,'rgba(244,242,234,.05)');g.fillStyle=p.hi;g.fillRect(0,0,W,H*.018);g.fillRect(0,H*.982,W,H*.018);},
   motif(g,x,y,r,t,p){g.strokeStyle=p.ink;g.lineWidth=r*.05;g.beginPath();g.arc(x,y,r*.95,0,TAU);g.stroke();g.lineWidth=r*.02;g.beginPath();g.arc(x,y,r*.8,0,TAU);g.stroke();for(let i=0;i<36;i++){const a=i/36*TAU+t*.12;g.beginPath();g.moveTo(x+Math.cos(a)*r*.82,y+Math.sin(a)*r*.82);g.lineTo(x+Math.cos(a)*r*(i%3?.88:.93),y+Math.sin(a)*r*(i%3?.88:.93));g.stroke();}
    g.fillStyle=p.hi;g.fillRect(x-r*.5,y-r*.34,r,r*.14);g.fillStyle=p.ink;g.fillRect(x-r*.5,y-r*.1,r,r*.14);g.fillRect(x-r*.5,y+r*.14,r*(.35+.65*Math.abs(Math.sin(t*.9))),r*.14);}},
  shipgear:{pal:{a:'#04111f',b:'#0b2a4a',ink:'#f3f8ff',hi:'#ff8a2a',lo:'#6fc3ff'},type:{brand:F('700',COND),body:F('700',ROUND)},enter:'slide',caps:true,
   back(g,W,H,t,p){lin(g,W,H,p.b,p.a,.35);g.strokeStyle='rgba(111,195,255,.10)';g.lineWidth=1;const s=W/10;for(let x=0;x<=W;x+=s){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<=H;y+=s){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    for(let i=0;i<26;i++){const u=(hash(i,31)+t*(.05+hash(i,32)*.25))%1;g.fillStyle='rgba(243,248,255,'+(.15+hash(i,33)*.4)+')';g.fillRect(W*(1-u)*1.1-W*.05,hash(i,34)*H,W*(.01+hash(i,32)*.05),1.5);}},
   motif(g,x,y,r,t,p){g.strokeStyle='rgba(111,195,255,.55)';g.lineWidth=r*.025;for(const k of [.4,.7,1]){g.beginPath();g.arc(x,y,r*k,0,TAU);g.stroke();}const a=t*1.7;const q=g.createConicGradient?g.createConicGradient(a,x,y):null;if(q){q.addColorStop(0,'rgba(111,195,255,0)');q.addColorStop(.8,'rgba(111,195,255,0)');q.addColorStop(1,'rgba(111,195,255,.45)');g.fillStyle=q;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
    g.strokeStyle=p.lo;g.lineWidth=r*.035;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.stroke();
    g.save();g.translate(x,y);g.rotate(-.5+Math.sin(t*.9)*.25);const fl=.5+.5*hash(Math.floor(t*30),5);g.fillStyle=p.hi;g.globalAlpha=.6+.4*fl;g.beginPath();g.moveTo(-r*.5,-r*.1);g.lineTo(-r*(.75+fl*.25),0);g.lineTo(-r*.5,r*.1);g.fill();g.globalAlpha=1;g.fillStyle=p.ink;g.beginPath();g.moveTo(r*.55,0);g.lineTo(-r*.25,-r*.3);g.lineTo(-r*.5,-r*.14);g.lineTo(-r*.5,r*.14);g.lineTo(-r*.25,r*.3);g.closePath();g.fill();g.restore();}},
  police:{pal:{a:'#060b24',b:'#0b2a6b',ink:'#ffffff',hi:'#ff2b3a',lo:'#2f6bff'},type:{brand:F('400',COND),body:F('400',COND)},enter:'pop',caps:true,
   back(g,W,H,t,p){const f=Math.floor(t*3.2)%2;lin(g,W,H,p.a,f?'#3a0b12':p.b,.5);const hw=W/2;for(let s=0;s<2;s++){const on=(Math.floor(t*6.4)%4<2)===!!s,x=s*hw,c=s?p.lo:p.hi;const q=g.createRadialGradient(x+hw/2,0,0,x+hw/2,0,H*.55);q.addColorStop(0,on?c:'rgba(0,0,0,0)');q.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=on?.75:0;g.fillStyle=q;g.fillRect(x,0,hw,H*.6);g.globalAlpha=1;g.fillStyle=on?c:'#1a1d2c';g.fillRect(x+hw*.08,H*.012,hw*.84,H*.03);}
    g.fillStyle=p.ink;g.fillRect(0,H*.94,W,H*.008);g.fillStyle=p.hi;g.fillRect(0,H*.948,W,H*.052);},
   motif(g,x,y,r,t,p){const s=r*(1+.04*Math.sin(t*6));g.fillStyle=p.ink;g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8;g.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}g.closePath();g.fill();g.fillStyle=p.b;g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8;g.lineTo(x+Math.cos(a)*s*.84,y+Math.sin(a)*s*.84);}g.closePath();g.fill();
    g.fillStyle=p.ink;g.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2+t*.5,q=i%2?s*.24:s*.58;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}g.closePath();g.fill();}},
  district:{pal:{a:'#050507',b:'#14101c',ink:'#f2f2f5',hi:'#38e8ff',lo:'#ff3fb4'},type:{brand:F('900',SANS),body:F('400',ROUND)},enter:'wipe',caps:true,
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.6);g.save();g.globalAlpha=.1;g.strokeStyle=p.lo;g.lineWidth=W*.05;for(let i=-3;i<8;i++){const x=i*W*.22+((t*14)%(W*.22));g.beginPath();g.moveTo(x,H);g.lineTo(x+H*.45,0);g.stroke();}g.restore();
    const fl=hash(Math.floor(t*11),41)>.9?.35:1,m=W*.035;g.lineWidth=Math.max(2,W*.008);g.globalAlpha=fl;g.strokeStyle=p.hi;g.strokeRect(m,m,W-m*2,H-m*2);g.strokeStyle=p.lo;g.strokeRect(m*1.7,m*1.7,W-m*3.4,H-m*3.4);g.globalAlpha=1;},
   motif(g,x,y,r,t,p){const sway=Math.sin(t*1.3)*.05;g.save();g.translate(x,y);g.rotate(sway);const shirt=()=>{g.beginPath();g.moveTo(-r*.3,-r*.75);g.quadraticCurveTo(0,-r*.5,r*.3,-r*.75);g.lineTo(r*.95,-r*.4);g.lineTo(r*.72,-r*.02);g.lineTo(r*.5,-r*.16);g.lineTo(r*.5,r*.8);g.lineTo(-r*.5,r*.8);g.lineTo(-r*.5,-r*.16);g.lineTo(-r*.72,-r*.02);g.lineTo(-r*.95,-r*.4);g.closePath();};
    g.lineJoin='round';g.lineWidth=r*.09;g.strokeStyle=p.lo;g.globalAlpha=.55;g.translate(r*.05,r*.05);shirt();g.stroke();g.translate(-r*.05,-r*.05);g.globalAlpha=1;g.strokeStyle=p.hi;g.lineWidth=r*.06;shirt();g.stroke();g.fillStyle=p.ink;const k=(t*.5)%1;g.fillRect(-r*.3,r*.05+k*r*.5,r*.6,r*.03);g.restore();}},
  warflying:{pal:{a:'#070b02',b:'#1a2606',ink:'#fbffe9',hi:'#c6ff1a',lo:'#ff3fb4'},type:{brand:F('italic 400',COND),body:F('700',ROUND)},enter:'pop',caps:true,
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.4);g.save();g.globalAlpha=.09;g.fillStyle=p.hi;for(let i=-4;i<10;i++){const x=i*W*.19+((t*70)%(W*.19));g.beginPath();g.moveTo(x,H);g.lineTo(x+W*.08,H);g.lineTo(x+W*.08+H*.5,0);g.lineTo(x+H*.5,0);g.fill();}g.restore();
    for(let i=0;i<30;i++){const tw=.5+.5*Math.sin(t*3+i*1.7);g.fillStyle='rgba(251,255,233,'+(.1+.5*tw*hash(i,51))+')';g.fillRect(hash(i,52)*W,hash(i,53)*H,2,2);}},
   motif(g,x,y,r,t,p){for(let k=0;k<4;k++){const u=((t*.6+k/4)%1);g.strokeStyle=k%2?p.lo:p.hi;g.globalAlpha=(1-u)*.9;g.lineWidth=r*.07*(1-u*.5);g.beginPath();g.arc(x,y,r*(.2+u*.95),-Math.PI*.82,-Math.PI*.18);g.stroke();g.beginPath();g.arc(x,y,r*(.2+u*.95),Math.PI*.18,Math.PI*.82);g.stroke();}g.globalAlpha=1;
    g.save();g.translate(x,y);g.rotate(Math.sin(t*1.1)*.5);g.fillStyle=p.ink;g.beginPath();g.moveTo(r*.42,0);g.lineTo(-r*.3,-r*.26);g.lineTo(-r*.16,0);g.lineTo(-r*.3,r*.26);g.closePath();g.fill();g.restore();}},
  news:{pal:{a:'#050c18',b:'#123a63',ink:'#f2f6fb',hi:'#ffcf4a',lo:'#7fc6ff'},type:{brand:F('700','"Helvetica Neue",Arial,sans-serif'),body:F('400','"Helvetica Neue",Arial,sans-serif')},enter:'slide',
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.2+.1*Math.sin(t*.3));g.save();g.globalAlpha=.08;g.strokeStyle=p.lo;g.lineWidth=W*.04;for(let i=-2;i<10;i++){const x=((t*30+i*W*.26)%(W*1.6))-W*.3;g.beginPath();g.moveTo(x,H);g.lineTo(x+H*.5,0);g.stroke();}g.restore();const x=((t*.2)%1.6-.3)*W;const q=g.createLinearGradient(x-W*.2,0,x+W*.2,0);q.addColorStop(0,'rgba(127,198,255,0)');q.addColorStop(.5,'rgba(127,198,255,.12)');q.addColorStop(1,'rgba(127,198,255,0)');g.fillStyle=q;g.fillRect(0,0,W,H);},
   motif(g,x,y,r,t,p){g.strokeStyle='rgba(127,198,255,.5)';g.lineWidth=r*.03;g.beginPath();g.arc(x,y,r*.8,0,TAU);g.stroke();for(const k of [.3,.62]){g.beginPath();g.ellipse(x,y,r*.8*k,r*.8,0,0,TAU);g.stroke();g.beginPath();g.ellipse(x,y,r*.8,r*.8*k,0,0,TAU);g.stroke();}g.save();g.translate(x,y);g.rotate(t*.6);g.strokeStyle=p.hi;g.lineWidth=r*.045;g.beginPath();g.ellipse(0,0,r,r*.36,0,0,TAU);g.stroke();g.fillStyle=p.hi;g.beginPath();g.arc(r,0,r*.09,0,TAU);g.fill();g.restore();}},
  board:{pal:{a:'#090806',b:'#2a2110',ink:'#fff8e6',hi:'#ffc93a',lo:'#c6ff1a'},type:{brand:F('italic 400',COND),body:F('700',ROUND)},enter:'pop',caps:true,
   back(g,W,H,t,p){lin(g,W,H,p.a,p.b,.3);g.save();g.globalAlpha=.07;g.fillStyle=p.hi;for(let i=-4;i<10;i++){const x=i*W*.21-((t*40)%(W*.21));g.beginPath();g.moveTo(x,0);g.lineTo(x+W*.07,0);g.lineTo(x+W*.07+H*.4,H);g.lineTo(x+H*.4,H);g.fill();}g.restore();},
   motif(){}}
 };
 function lin(g,W,H,a,b,tilt){const q=g.createLinearGradient(0,0,W*tilt,H);q.addColorStop(0,a);q.addColorStop(1,b);g.fillStyle=q;g.fillRect(0,0,W,H);}
 function rad(g,W,H,x,y,a,b){const q=g.createRadialGradient(x,y,0,x,y,Math.max(W,H)*.8);q.addColorStop(0,a);q.addColorStop(1,b);g.fillStyle=q;g.fillRect(0,0,W,H);}
 function band(g,x,y,w,h,c){const q=g.createLinearGradient(0,y-h,0,y+h);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(.5,c);q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(x,y-h,w,h*2);}
 function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

 // ---------------------------------------------------------------- one frame of one slide
 /* paint(g, W, H, slide, st): slide from VoidAdData.slide(); st {t: seconds (keeps the background moving), slideT: seconds since this slide began,
    i: the line showing, p: 0..1 how far through that line the voice (or the reading clock) is}. Tall canvases put the motif on top and the words below;
    wide ones put the words on the left and the motif on the right. */
 function paint(g,W,H,slide,st){
  const L=LOOKS[slide.look]||LOOKS.news,P=L.pal,tall=H>W*1.05,u=Math.min(W,H*(tall?.7:1.3))/100,t=st.t,T=st.slideT;
  const lay=tall?{x:W*.08,w:W*.84,mx:W*.5,my:H*.215,mr:Math.min(W*.27,H*.15),top:H*.42,bottom:H*.93,align:'center'}:{x:W*(slide.look==='district'?.075:.05),w:W*.56,mx:W*.81,my:H*.5,mr:Math.min(W*.15,H*.3),top:H*.16,bottom:H*.9,align:'left'};
  g.save();g.textBaseline='alphabetic';g.textAlign='left';g.globalAlpha=1;g.lineCap='butt';g.lineJoin='miter';
  L.back(g,W,H,t,P);
  if(slide.kind==='board')boardSlide(g,W,H,L,slide,st,u,tall);
  else{
   g.save();const mIn=slide.kind==='notice'?ease(T/.8):back(T/.6);g.translate(lay.mx,lay.my);g.scale(mIn,mIn);g.translate(-lay.mx,-lay.my);g.globalAlpha=clamp(T/.3);L.motif(g,lay.mx,lay.my,lay.mr,t,P);g.restore();g.globalAlpha=1;
   if(slide.kind==='brand')brandSlide(g,L,slide,st,u,lay,tall);else scriptSlide(g,W,H,L,slide,st,u,lay,tall);
  }
  // the screen itself: fine scan lines, a soft dark edge, and the cut between slides (a bright bar wipes the new picture in)
  g.globalAlpha=1;g.fillStyle=L===LOOKS.health?'rgba(12,58,58,.05)':'rgba(255,255,255,.035)';for(let y=(t*18)%4;y<H;y+=4)g.fillRect(0,y,W,1);
  const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=v;g.fillRect(0,0,W,H);
  if(T<.42){const k=ease(T/.42);g.fillStyle='#04060a';if(tall){g.fillRect(0,k*H,W,H);g.fillStyle=P.hi;g.fillRect(0,k*H-u*.8,W,u*1.6);}else{g.fillRect(k*W,0,W,H);g.fillStyle=P.hi;g.fillRect(k*W-u*.8,0,u*1.6,H);}}
  g.restore();
 }
 function label(g,L,text,x,y,u,align,width){if(!text)return 0;g.font='700 '+Math.round(u*3.5)+'px '+MONO;const w=g.measureText(text).width+u*3,bx=align==='center'?x+(width-w)/2:x;g.fillStyle=L.pal.hi;g.fillRect(bx,y-u*3.6,w,u*5);g.fillStyle=L===LOOKS.government||L===LOOKS.police?'#ffffff':L.pal.a;g.fillText(text,bx+u*1.5,y);return u*8;}
 // A brand and its tagline. The brand arrives in the look's own way; the tagline's words light up as the line is spoken.
 function brandSlide(g,L,s,st,u,lay,tall){
  const P=L.pal,T=st.slideT,name=L.caps?s.title.toUpperCase():s.title,e=clamp(T/.6);
  if(L.track&&g.letterSpacing!==undefined)g.letterSpacing=Math.round(u*(tall?1.2:1))+'px';
  const b=fit(g,name,L.type.brand,lay.w*(L.track?.94:1),u*(tall?17:13),u*6,tall?3:2),bl=b.px*1.04,by=lay.top+b.px;
  g.save();g.fillStyle=P.ink;g.textAlign=lay.align==='center'?'center':'left';const bx=lay.align==='center'?lay.x+lay.w/2:lay.x;
  const drawBrand=(dx,dy,c)=>{g.fillStyle=c;b.lines.forEach((l,i)=>g.fillText(l,bx+dx,by+i*bl+dy));};
  if(L.enter==='slide'){g.globalAlpha=e;drawBrand((1-ease(e))*-lay.w*.6,0,P.ink);}
  else if(L.enter==='pop'){const k=back(e),cx=lay.align==='center'?bx:bx+lay.w*.3,cy=by+bl*(b.lines.length-1)/2-b.px*.3;g.translate(cx,cy);g.scale(k,k);g.rotate((1-ease(e))*-.12);g.translate(-cx,-cy);drawBrand(u*.5,u*.5,'rgba(0,0,0,.45)');drawBrand(0,0,P.ink);}
  else if(L.enter==='drop'){const k=back(e);g.globalAlpha=clamp(e*2);drawBrand(0,(k-1)*b.px*1.4,P.ink);}
  else if(L.enter==='type'){const n=Math.ceil(name.length*clamp(T/.9));let left=n;b.lines.forEach((l,i)=>{const part=l.slice(0,Math.max(0,left));left-=l.length+1;g.fillStyle=P.ink;g.fillText(part+(left<=0&&left>-l.length-1&&Math.floor(T*4)%2?'█':''),bx,by+i*bl);});
   if(hash(Math.floor(st.t*8),7)>.86){g.globalAlpha=.6;drawBrand(u*.8,0,P.lo);g.globalAlpha=1;}}
  else if(L.enter==='glitch'){const j=(1-ease(e))*u*5;g.globalAlpha=.7;drawBrand(-j-u*.35,0,P.hi);drawBrand(j+u*.35,0,'#ff3f7f');g.globalAlpha=1;drawBrand((hash(Math.floor(st.t*12),3)-.5)*j,0,P.ink);}
  else if(L.enter==='wipe'){g.save();g.beginPath();g.rect(lay.x-u,lay.top-u,(lay.w+u*2)*ease(e),bl*b.lines.length+u*4);g.clip();drawBrand(0,0,P.ink);g.restore();}
  else{g.globalAlpha=ease(e);drawBrand(0,(1-ease(e))*u*2,P.ink);}
  g.restore();if(g.letterSpacing!==undefined)g.letterSpacing='0px';
  // a rule under the brand grows as the brand lands
  const ry=by+bl*(b.lines.length-1)+u*3.2,rw=lay.w*(tall?.5:.4)*ease((T-.25)/.5);g.fillStyle=P.hi;g.fillRect(lay.align==='center'?lay.x+(lay.w-rw)/2:lay.x,ry,rw,u*.9);
  // the tagline
  const tag=fit(g,s.lines[0].text,L.type.body,lay.w,u*(tall?10.5:7),u*4.2,tall?6:4,lay.bottom-ry-u*4),lh=tag.px*1.3,n=count(s.lines[0].text),share=count(s.title)/(count(s.title)+n+1);
  const shown=n*clamp((st.p-share)/(1-share)*1.12)+(st.p>share?.6:0);
  words(g,tag.lines,lay.x,ry+u*4+tag.px,lh,shown,P.ink,null,lay.align,lay.w);
 }
 // A title with lines that scroll up one at a time (longer ads, announcements, news). The line being spoken is large and its words light up as they are said.
 function scriptSlide(g,W,H,L,s,st,u,lay,tall){
  const P=L.pal,T=st.slideT,notice=s.kind==='notice';let y=lay.top;
  y+=label(g,L,s.label,lay.x,y+u*3.6,u,lay.align,lay.w);
  if(s.title){const name=L.caps?s.title.toUpperCase():s.title,b=fit(g,name,L.type.brand,lay.w,u*(tall?9.5:8),u*4.5,3),e=ease(T/.6);g.save();g.globalAlpha=e;g.fillStyle=s.kind==='news'?P.ink:P.hi;g.textAlign=lay.align==='center'?'center':'left';
   b.lines.forEach((l,i)=>g.fillText(l,(lay.align==='center'?lay.x+lay.w/2:lay.x)+(1-e)*-u*6,y+b.px+i*b.px*1.08));g.restore();y+=b.px*1.08*b.lines.length+u*2.4;
   g.fillStyle=s.kind==='news'?P.hi:P.ink;const rw=lay.w*ease((T-.2)/.5);g.fillRect(lay.align==='center'?lay.x+(lay.w-rw)/2:lay.x,y,rw,u*.6);y+=u*3.5;}
  const line=s.lines[st.i]||s.lines[s.lines.length-1],prev=s.lines[st.i-1];if(!line)return;
  // a headline or a spoken title holds the title above; the body starts on the first real line
  const body=line.title||line.headline?null:line,area=lay.bottom-y;
  if(!body){const dots=Math.floor(st.t*3)%4;g.fillStyle=P.hi;for(let i=0;i<3;i++){g.globalAlpha=i<dots?1:.25;g.fillRect(lay.align==='center'?lay.x+lay.w/2-u*4+i*u*3:lay.x+i*u*3,y+u*3,u*1.6,u*1.6);}g.globalAlpha=1;return;}
  const max=notice?u*(tall?11.5:9):u*(tall?9.6:6.8),f=fit(g,body.text,L.type.body,lay.w,max,u*(tall?4.4:3.6),9,area-u*2),lh=f.px*1.28,h=lh*f.lines.length;
  // scroll: the new line rises into place while the old one leaves upward
  const lineT=st.lineT??st.p*5,k=ease(lineT/.5),cy=y+(notice?Math.max(0,(area-h)/2):u*1.5)+f.px;
  g.save();g.beginPath();g.rect(0,y-u,W,lay.bottom-y+u*4);g.clip();
  if(prev&&!prev.title&&!prev.headline&&k<1&&st.i>0){const o=fit(g,prev.text,L.type.body,lay.w,max,u*3.6,8);g.globalAlpha=(1-k)*.8;words(g,o.lines,lay.x,cy-k*area*.7,o.px*1.28,999,P.ink,null,lay.align,lay.w);g.globalAlpha=1;g.font=L.type.body(f.px);}
  g.translate(0,(1-k)*area*.55);g.globalAlpha=k;const n=count(body.text);
  words(g,f.lines,lay.x,cy,lh,n*clamp(st.p*1.12)+.6,P.ink,null,lay.align,lay.w);
  g.restore();
  // how far through the ad we are: one pip per line
  const real=s.lines.filter(l=>!l.title&&!l.headline),at=real.indexOf(body);if(real.length>1){const pw=u*2.2,total=real.length*pw*1.6,px=lay.align==='center'?lay.x+(lay.w-total)/2:lay.x;for(let i=0;i<real.length;i++){g.fillStyle=i<=at?P.hi:(L===LOOKS.health?'rgba(12,58,58,.25)':'rgba(255,255,255,.25)');g.fillRect(px+i*pw*1.6,lay.bottom+u*1.5,pw,u*.8);}}
 }
 // The WarFlying Leadership Board: the top five, #1 picked out. Nothing else is listed.
 function boardSlide(g,W,H,L,s,st,u,tall){
  const P=L.pal,T=st.slideT,rows=s.standings?.rows||[],x=W*.07,w=W*.86;let y=H*(tall?.07:.1);
  const hd=fit(g,s.label,L.type.brand,w,u*(tall?13:10),u*5,tall?3:1),e=back(T/.5);g.save();g.translate(W/2,y+hd.px*.5);g.scale(e,e);g.translate(-W/2,-(y+hd.px*.5));g.textAlign='center';
  hd.lines.forEach((l,i)=>{g.fillStyle=i===0&&hd.lines.length>1?P.lo:P.hi;g.fillText(l,W/2,y+hd.px+i*hd.px*1.02);});g.restore();y+=hd.px*1.02*hd.lines.length+u*3;
  g.fillStyle=P.hi;g.fillRect(x,y,w*ease((T-.2)/.5),u*.8);y+=u*4;
  const rh=Math.min((H*(tall?.93:.95)-y)/5,u*(tall?17:13)),max=Math.max(1,...rows.map(r=>r.points)),pulse=.5+.5*Math.sin(st.t*5);
  rows.forEach((r,i)=>{const a=ease((T-.45-i*.16)/.5);if(a<=0)return;const ry=y+i*rh,first=i===0,slide=(1-a)*W*.4;g.globalAlpha=a;
   g.fillStyle=first?'rgba(255,201,58,'+(.2+.12*pulse)+')':r.player?'rgba(198,255,26,.14)':'rgba(255,255,255,.05)';g.fillRect(x+slide,ry,w,rh*.86);
   g.fillStyle=first?P.hi:r.player?P.lo:'rgba(255,248,230,.45)';g.fillRect(x+slide,ry+rh*.78,w*(r.points/max)*ease((T-.6-i*.16)/.9),rh*.08);
   g.fillStyle=first?P.hi:r.player?P.lo:P.ink;g.font=L.type.brand(Math.round(rh*.52));g.textAlign='left';g.fillText(String(r.rank),x+u*2+slide,ry+rh*.6);
   const pts=String(Math.round(r.points*ease((T-.6-i*.16)/.9)));g.font=L.type.body(Math.round(rh*.42));g.textAlign='right';g.fillText(pts,x+w-u*2+slide,ry+rh*.58);const pw=g.measureText('000').width+u*3;
   const nm=fit(g,r.name,L.type.body,w-u*13-pw,rh*(first?.5:.44),rh*.16,1);g.textAlign='left';g.fillStyle=first||r.player?'#ffffff':P.ink;g.fillText(nm.lines[0]||r.name,x+u*11+slide,ry+rh*.58);});
  g.globalAlpha=1;g.textAlign='left';
 }

 // ---------------------------------------------------------------- the screen as an object
 /* The parts of a screen's housing around a picture w wide and h tall, in the picture's own axes: [name, size [across, up, deep], offset [across, up, back],
    surface]. back > 0 is behind the picture (toward the wall). surface: 'case' dark metal, 'trim' lighter metal, 'glow' the zone's accent light,
    'lamp' a white downlight, 'led' the red power light. kind 'wall': a big screen bracketed to a wall. kind 'kiosk': a street stand on a plinth.
    kind 'panel': a slim wall or ceiling panel (stations). */
 function housing(kind,w,h){
  const p=[];
  if(kind==='kiosk'){
   p.push(['body',[w+.34,h+.5,.26],[0,-.06,.15],'case'],['plinth',[w+.7,.2,.62],[0,-h/2-.41,.13],'trim'],['foot',[w+.5,.1,.5],[0,-h/2-.26,.13],'case'],
    ['hood',[w+.5,.09,.5],[0,h/2+.24,.02],'trim'],['hood-lamp',[w*.86,.025,.05],[0,h/2+.19,-.17],'lamp'],['lip-top',[w+.14,.07,.07],[0,h/2+.035,-.03],'case'],['lip-bottom',[w+.14,.07,.07],[0,-h/2-.035,-.03],'case'],
    ['lip-left',[.07,h,.07],[-w/2-.035,0,-.03],'case'],['lip-right',[.07,h,.07],[w/2+.035,0,-.03],'case'],['fin-left',[.035,h*.82,.05],[-w/2-.15,0,-.005],'glow'],['fin-right',[.035,h*.82,.05],[w/2+.15,0,-.005],'glow'],
    ['vent',[w*.6,.42,.05],[0,h*.22,.29],'trim'],['service',[w*.34,.5,.05],[0,-h*.24,.29],'trim'],['led',[.04,.04,.03],[w/2-.08,-h/2-.14,.005],'led']);
  }else if(kind==='wall'){
   const d=Math.max(.3,w*.06),lip=Math.max(.12,w*.035);
   p.push(['casing',[w+lip*4,h+lip*4,d],[0,0,d/2+.05],'case'],['lip-top',[w+lip*2,lip,lip*1.2],[0,h/2+lip/2,-lip*.2],'case'],['lip-bottom',[w+lip*2,lip*1.6,lip*1.2],[0,-h/2-lip*.8,-lip*.2],'trim'],
    ['lip-left',[lip,h,lip*1.2],[-w/2-lip/2,0,-lip*.2],'case'],['lip-right',[lip,h,lip*1.2],[w/2+lip/2,0,-lip*.2],'case'],
    ['bar-left',[lip*.3,h*.9,lip*.4],[-w/2-lip*1.55,0,-lip*.05],'glow'],['bar-right',[lip*.3,h*.9,lip*.4],[w/2+lip*1.55,0,-lip*.05],'glow'],
    ['hood',[w+lip*6,lip*.7,d+lip*4],[0,h/2+lip*2.6,-lip*.9],'trim'],['tray',[w*.5,lip*1.6,d*.9],[0,-h/2-lip*3,d/2],'trim'],['conduit',[lip*.8,h*.5,lip*.8],[w*.32,-h/2-lip*3-h*.25,d*.7],'trim'],
    ['bracket-top',[w*.7,lip,d+.3],[0,h*.3,d/2+.15],'trim'],['bracket-bottom',[w*.7,lip,d+.3],[0,-h*.3,d/2+.15],'trim'],['led',[lip*.3,lip*.3,.04],[w/2-lip*.4,-h/2-lip*.8,-lip*.82],'led']);
  }else{
   const lip=Math.max(.035,Math.min(w,h)*.035);
   p.push(['casing',[w+lip*3.2,h+lip*3.2,.07],[0,0,.055],'case'],['lip-top',[w+lip*2,lip,.05],[0,h/2+lip/2,-.012],'case'],['lip-bottom',[w+lip*2,lip*1.5,.05],[0,-h/2-lip*.75,-.012],'trim'],
    ['lip-left',[lip,h,.05],[-w/2-lip/2,0,-.012],'case'],['lip-right',[lip,h,.05],[w/2+lip/2,0,-.012],'case'],['bar',[w*.3,lip*.28,.02],[-w*.3,-h/2-lip*.75,-.04],'glow'],['led',[lip*.4,lip*.4,.02],[w/2-lip,-h/2-lip*.75,-.04],'led']);
  }
  return p;
 }
 // A picture facing `ry` (a Babylon plane's front is -z): across = the viewer's left-to-right, back = into the wall.
 const axes=ry=>({ax:[Math.cos(ry),-Math.sin(ry)],bk:[Math.sin(ry),Math.cos(ry)]});
 const place=(p,ry,[a,up,b])=>{const {ax,bk}=axes(ry);return [p[0]+ax[0]*a+bk[0]*b,p[1]+up,p[2]+ax[1]*a+bk[1]*b];};
 const FACES={n:Math.PI,s:0,e:-Math.PI/2,w:Math.PI/2};

 // ---------------------------------------------------------------- sound
 const ZONE_SOUND={oldtown:{hum:[100,'sawtooth',420],gain:1},port:{hum:[60,'sawtooth',300],gain:1.1},avenue:{hum:[120,'triangle',700],gain:.8},corporate:{hum:[180,'sine',900],gain:.55}};
 // A short chime as a slide begins: [wave, [frequency, start, length]...] per look.
 const CHIMES={food:['triangle',[523,0,.12],[659,.09,.12],[784,.18,.22]],dating:['sine',[440,0,.35,880]],corporate:['sine',[392,0,.3],[587,.02,.4]],health:['sine',[880,0,.5]],housing:['triangle',[659,0,.28],[523,.26,.42]],
  transport:['square',[311,0,.14],[311,.2,.26]],tech:['square',[1200,0,.04],[700,.06,.04],[1500,.12,.05]],government:['sine',[330,0,.42],[247,.4,.6]],shipgear:['sine',[1320,0,.6]],police:['square',[660,0,.16],[495,.16,.16],[660,.32,.16]],
  district:['sawtooth',[82,0,.4]],warflying:['sawtooth',[392,0,.1],[523,.1,.1],[659,.2,.1],[784,.3,.3]],cyber:['triangle',[990,0,.07],[1480,.07,.2]],news:['triangle',[740,0,.07],[740,.11,.07],[740,.22,.07],[988,.33,.3]],board:['sawtooth',[523,0,.09],[523,.11,.09],[784,.22,.35]]};
 const VOICE_RANGE={wall:38,kiosk:20,panel:12},HUM_RANGE={wall:16,kiosk:8,panel:5};
 const audio={ctx:null,voice:null,hums:[],busy:null,level:0};
 function ensureAudio(){
  const A=root.VoidAudio,vb=A?.bus?.('voice'),ab=A?.bus?.('ambient');if(!vb||!ab||!A.settings?.enabled)return null;
  if(audio.ctx!==vb.context){audio.ctx=vb.context;const c=audio.ctx,gain=c.createGain(),pan=c.createStereoPanner?c.createStereoPanner():null;gain.gain.value=0;if(pan){gain.connect(pan);pan.connect(vb.node);}else gain.connect(vb.node);audio.voice={gain,pan,level:0,panTo:0,x:0,z:0};audio.hums=[];audio.busy=null;audio.amb=ab.node;}
  return audio.ctx.state==='running'?audio:null;
 }
 function humVoice(zone){
  const c=audio.ctx,[f,type,cut]=(ZONE_SOUND[zone]||ZONE_SOUND.oldtown).hum,o=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain(),pan=c.createStereoPanner?c.createStereoPanner():null,lfo=c.createOscillator(),depth=c.createGain();
  o.type=type;o.frequency.value=f;o2.type='sine';o2.frequency.value=f*2.01;lp.type='lowpass';lp.frequency.value=cut;g.gain.value=0;lfo.frequency.value=.7;depth.gain.value=f*.004;lfo.connect(depth);depth.connect(o.frequency);
  o.connect(lp);o2.connect(lp);lp.connect(g);if(pan){g.connect(pan);pan.connect(audio.amb);}else g.connect(audio.amb);o.start();o2.start();lfo.start();
  return {zone,nodes:[o,o2,lfo],gain:g,pan,level:0,spot:null};
 }
 function chime(look,level,pan){
  const def=CHIMES[look],c=audio.ctx;if(!def||!c||!(level>.01))return;const out=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null,lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;out.gain.value=level*.16;out.connect(lp);
  if(p){p.pan.value=pan;lp.connect(p);p.connect(audio.amb);}else lp.connect(audio.amb);let end=0;
  for(const [f,at,len,to] of def.slice(1)){const o=c.createOscillator(),e=c.createGain(),t0=c.currentTime+.02+at;o.type=def[0];o.frequency.setValueAtTime(f,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+len);e.gain.setValueAtTime(0,t0);e.gain.linearRampToValueAtTime(1,t0+.012);e.gain.exponentialRampToValueAtTime(.001,t0+len);o.connect(e);e.connect(out);o.start(t0);o.stop(t0+len+.05);end=Math.max(end,at+len);}
  setTimeout(()=>{try{out.disconnect();lp.disconnect();p?.disconnect();}catch{}},(end+.4)*1000);audio.lastChime={look,level,pan,at:c.currentTime};
 }
 const heard=(dx,dz,yaw,range)=>root.VoidAmbience?.heard?root.VoidAmbience.heard(dx,dz,yaw,range):{level:0,pan:0};
 /* Is this a moment to keep quiet? No player position (sound off, a pod, VR), not out on the street, standing in a checkpoint lane, a conversation, a menu,
    or the radio's Relay talking. Returns 0 (silent) .. 1. */
 function loudness(me,quarter){
  if(!me||!(me.area==='neochinatown'||me.area==='alley'))return 0;
  if(typeof mode!=='undefined'&&mode!=='walking'&&mode!=='road-taxi')return 0;
  if(typeof speech!=='undefined'&&speech)return 0;
  if(root.VoidRelayRadio?.speaking)return 0;
  if(quarter&&root.VoidQuarters?.laneAt({x:me.x,z:me.z},quarter))return 0;
  return clamp(me.city==null?1:me.city);
 }

 // ---------------------------------------------------------------- feeds
 const TIER={low:{feeds:1,fps:6,res:[384,576]},medium:{feeds:2,fps:10,res:[512,768]},high:{feeds:2,fps:12,res:[512,768]},ultra:{feeds:2,fps:12,res:[512,768]}};
 const DRAW_RANGE={wall:110,kiosk:48,panel:26};
 const relayContent=()=>root.VoidRelayRadio?.content||{segments:[]};
 const standings=()=>{try{return root.VoidWarFlyingScanner?.standings?.()||root.VoidWarFlyingBoard.standings(0,'YOU');}catch{return root.VoidWarFlyingBoard.standings(0,'YOU');}};
 const newsNow=()=>{try{return D.newsFor(relayContent(),typeof state!=='undefined'?state?.relay?.occurred:null);}catch{return [];}};
 function createFeed(id,zone,seed){
  const f={id,zone,seed,programme:[],relayCount:-1,pos:-1,slide:null,i:0,lineT:0,dur:1,slideT:0,clip:null,said:false,spots:[],texture:null,material:null,dirty:true,spoken:0,shown:0,log:[]};
  f.rebuild=()=>{const rc=relayContent();f.relayCount=(rc.segments||[]).length;f.programme=D.programme(zone,{relay:rc,seed});if(f.pos<0)f.pos=seed*7%Math.max(1,f.programme.length)-1;};
  f.rebuild();return f;
 }
 function nextSlide(f){
  if((relayContent().segments||[]).length!==f.relayCount)f.rebuild();
  if(!f.programme.length){f.slide=null;return;}
  f.pos=(f.pos+1)%f.programme.length;let slot=f.programme[f.pos];if(slot.type==='break')slot=D.breakSlot(slot.n+f.seed,newsNow());
  f.slide=D.slide(slot,{standings:slot.type==='board'?standings():null});f.i=-1;f.slideT=0;f.fresh=true;f.shown++;f.log.push(f.slide.kind==='board'?'board':f.slide.kind==='news'?'news:'+f.slide.id:f.slide.id);if(f.log.length>40)f.log.shift();
 }
 // Cutting a voice off: the line stays up for the rest of its reading time.
 function stopClip(f){if(f.clip){const c=f.clip;f.clip=null;try{c.stop();}catch{}if(audio.busy===f)audio.busy=null;f.dur=Math.max(f.lineT+D.TIMING.gap,f.slide?.lines[f.i]?.hold||0);}}
 function nextLine(f,speak){
  stopClip(f);f.i++;if(!f.slide||f.i>=f.slide.lines.length){nextSlide(f);if(!f.slide){f.dur=5;f.lineT=0;return;}f.i=0;}
  const line=f.slide.lines[f.i];f.lineT=0;f.dur=line.hold;f.said=false;
  if(speak&&line.say&&!audio.busy&&audio.voice){
   const clip=root.VoidVoiceClips?.broadcast?.(f.slide.speaker,line.say,audio.voice.gain);
   if(clip){f.clip=clip;audio.busy=f;f.dur=40;f.spoken++;f.lastSpoken={speaker:f.slide.speaker,text:line.say};
    const done=ok=>{if(f.clip!==clip)return;f.clip=null;f.said=ok;if(audio.busy===f)audio.busy=null;f.dur=ok?f.lineT+D.TIMING.gap:Math.max(f.lineT+D.TIMING.gap,line.hold);};clip.done.then(()=>done(true),()=>done(false));}
  }
 }

 // ---------------------------------------------------------------- the street's screens
 /* street(env): called by neochinatown.js while it builds a quarter. env: {B, scene, quality, quarter, box(name,size,pos,mat), add(mesh,mat,pos,merge),
    dropped(name,pos), mat(key,hex,opts), glowMat(key,hex,level), textures, owned}. Returns {wall(w,p,ry), kiosk(p,ry), extras(), tick(dt), dispose(), ...}.
    wall() and kiosk() return false where no screen may stand (the location table), so the caller leaves the wall bare. */
 function street(env){
  const {B,scene,quality,quarter}=env,tier=TIER[quality]||TIER.medium,feeds=new Map(),counts={},spots=[];let drawTimer=0,audioTimer=0,turn=0,clock=0,disposed=false,lead=null;
  const caseM=env.mat('adscreen-case','#0c0d11',{rough:.42,metal:.85}),trimM=env.mat('adscreen-trim','#2a2d33',{rough:.35,metal:.9}),lampM=env.glowMat('adscreen-lamp','#dfe9ff',.9),ledM=env.glowMat('adscreen-led','#ff2b2b',1.2);
  const glows={oldtown:env.glowMat('adscreen-glow-oldtown','#ff3fb4',1),port:env.glowMat('adscreen-glow-port','#ffb347',1),avenue:env.glowMat('adscreen-glow-avenue','#38e8ff',1),corporate:env.glowMat('adscreen-glow-corporate','#e8f0ff',.8)};
  const surface=(s,zone)=>s==='case'?caseM:s==='trim'?trimM:s==='lamp'?lampM:s==='led'?ledM:glows[zone]||glows.avenue;
  function feedFor(zone){
   const n=counts[zone]=(counts[zone]||0)+1,k=(n-1)%(zone==='corporate'?1:tier.feeds),id=zone+'-'+'ab'[k];if(feeds.has(id))return feeds.get(id);
   const f=createFeed(id,zone,k+1),[W,H]=tier.res;f.res=[W,H];f.texture=new B.DynamicTexture('adscreen-'+id,{width:W,height:H},scene,true);env.textures.push(f.texture);
   const m=new B.StandardMaterial('adscreen-'+id,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=f.texture;m.disableLighting=true;env.owned.push(m);f.material=m;
   f.offset=k*3.1;nextLine(f,false);paintFeed(f);feeds.set(id,f);return f;
  }
  function paintFeed(f){if(!f.slide||f.i<0)return;const line=f.slide.lines[f.i],p=f.clip?f.clip.progress||0:f.said?1:f.lineT/Math.max(.5,line.hold*.82);
   paint(f.texture.getContext(),f.res[0],f.res[1],f.slide,{t:clock+f.offset,slideT:f.slideT,i:f.i,p:clamp(p),lineT:f.lineT});f.texture.update();f.frames=(f.frames||0)+1;}
  function make(kind,w,h,p,ry){
   const zone=D.zoneAt(quarter,p[0],p[2]);if(!zone||env.dropped('adscreen',p))return false;
   // no screen in or against a checkpoint: the gatehouses stand where some old posters were, and a checkpoint is a quiet place
   if((root.VoidQuarters?.GATES||[]).some(g=>p[0]>=g.rect[0]-D.GATE_MARGIN&&p[0]<=g.rect[1]+D.GATE_MARGIN&&p[2]>=g.rect[2]-D.GATE_MARGIN&&p[2]<=g.rect[3]+D.GATE_MARGIN))return false;
   const f=feedFor(zone);
   for(const [name,size,off,s] of housing(kind,w,h)){const m=env.box('adscreen-'+name,size,place(p,ry,off),surface(s,zone));m.rotation.y=ry;}
   const pic=B.MeshBuilder.CreatePlane('adscreen',{width:w,height:h,sideOrientation:B.Mesh.FRONTSIDE},scene);env.add(pic,f.material,p,true);pic.rotation.y=ry;
   const {bk}=axes(ry),spot={feed:f,kind,zone,x:p[0],y:p[1],z:p[2],nx:-bk[0],nz:-bk[1],w,h,ry};f.spots.push(spot);spots.push(spot);return true;
  }
  const wall=(w,p,ry)=>make('wall',w,w*1.5,p,ry),kiosk=(p,ry)=>make('kiosk',1.6,2.4,p,ry);
  // the hand-placed screens of this quarter (ad-screens-data.js PLACES)
  function extras(){for(const e of D.PLACES){if(e.quarter!==quarter)continue;const ry=FACES[e.faces]??0;if(e.kind==='kiosk'){kiosk(e.at,ry);continue;}const w=e.w||6,h=w*1.5;if(!wall(w,e.at,ry))continue;
   // posts: true stands the screen on two steel legs with a brace and a footing each (where there is no wall behind it to carry it)
   if(e.posts){const bottom=e.at[1]-h/2,t=Math.max(.3,w*.07);for(const s of [-1,1]){const leg=env.box('adscreen-leg',[t,bottom+h*.5,t],place([e.at[0],(bottom+h*.5)/2,e.at[2]],ry,[s*w*.3,0,t*1.6]),trimM);leg.rotation.y=ry;const foot=env.box('adscreen-footing',[t*2.6,.3,t*2.6],place([e.at[0],.15,e.at[2]],ry,[s*w*.3,0,t*1.6]),caseM);foot.rotation.y=ry;}
    for(const y of [bottom*.45,bottom*.9]){const brace=env.box('adscreen-brace',[w*.6,t*.5,t*.5],place([e.at[0],y,e.at[2]],ry,[0,0,t*1.6]),trimM);brace.rotation.y=ry;}}}}
  // Is a spot worth drawing for: near enough, the camera on its picture side, and not behind the camera.
  function seen(s,cam,fx,fz){const dx=s.x-cam.x,dz=s.z-cam.z,d=Math.hypot(dx,dz);if(d>DRAW_RANGE[s.kind])return false;if(-(dx*s.nx+dz*s.nz)<-.5)return false;return d<6||(dx*fx+dz*fz)/d>-.25;}
  function tick(dt){
   if(disposed||!feeds.size)return;clock+=dt;
   const me=root.VoidMusicArea&&performance.now()-root.VoidMusicArea.at<2000?root.VoidMusicArea:null,loud=loudness(me,quarter),au=ensureAudio();
   // who is heard: the screen heard best leads; its feed alone may speak
   audioTimer-=dt;
   if(audioTimer<=0){audioTimer=.1;let best=null,bestLevel=0;const near=[];
    if(me)for(const s of spots){const dx=s.x-me.x,dz=s.z-me.z,front=-(dx*s.nx+dz*s.nz)>-.5?1:.45,v=heard(dx,dz,me.yaw||0,VOICE_RANGE[s.kind]);s.level=v.level*front;s.pan=v.pan;
     if(D.ZONES[s.zone].speaks&&s.level>bestLevel){bestLevel=s.level;best=s;}const h=heard(dx,dz,me.yaw||0,HUM_RANGE[s.kind]);if(h.level>0)near.push({s,level:h.level,pan:h.pan});}
    lead=loud>0&&best&&bestLevel>.004?best:null;
    // a feed that is talking keeps the voice while one of its screens is still heard; otherwise it is cut off and the best-heard screen takes over at its next line
    if(audio.busy){const own=feeds.get(audio.busy.id)===audio.busy?audio.busy.spots.reduce((a,s)=>(s.level||0)>(a?.level||0)?s:a,null):null;if(own&&own.level>.015&&loud>0)lead=own;else stopClip(audio.busy);}
    if(au){const v=audio.voice,target=lead&&loud>0?Math.min(1,lead.level*1.5)*loud:0;v.level=target;v.gain.gain.setTargetAtTime(target,au.ctx.currentTime,.12);if(lead){v.x=lead.x;v.z=lead.z;v.panTo=lead.pan;if(v.pan)v.pan.pan.setTargetAtTime(lead.pan,au.ctx.currentTime,.1);}
     // the nearest two screens hum
     near.sort((a,b)=>b.level-a.level);const want=loud>0?near.slice(0,2):[];
     for(let i=0;i<2;i++){const n=want[i];let h=audio.hums[i];if(!n){if(h&&h.level){h.level=0;h.gain.gain.setTargetAtTime(0,au.ctx.currentTime,.3);h.spot=null;}continue;}
      if(!h||h.zone!==n.s.zone){if(h){const old=h;old.gain.gain.setTargetAtTime(0,au.ctx.currentTime,.1);setTimeout(()=>{for(const o of old.nodes)try{o.stop();}catch{}try{old.gain.disconnect();old.pan?.disconnect();}catch{}},600);}h=audio.hums[i]=humVoice(n.s.zone);}
      const lv=n.level*.045*(ZONE_SOUND[n.s.zone]?.gain||1)*loud;h.level=lv;h.spot=n.s;h.panTo=n.pan;h.gain.gain.setTargetAtTime(lv,au.ctx.currentTime,.25);if(h.pan)h.pan.pan.setTargetAtTime(n.pan,au.ctx.currentTime,.1);}}
    else if(audio.busy)stopClip(audio.busy);
   }
   // the programme
   for(const f of feeds.values()){f.lineT+=dt;f.slideT+=dt;
    if(f.lineT>=f.dur){const speak=!!au&&loud>0&&!!lead&&lead.feed===f&&D.ZONES[f.zone].speaks&&root.VoidAudio.settings.voiceEnabled!==false;nextLine(f,speak);
     if(f.fresh){f.fresh=false;if(au&&loud>0){const s=f.spots.reduce((a,x)=>(x.level||0)>(a?.level||0)?x:a,null);if(s&&s.level>.01&&(lead?.feed===f||!lead))chime(f.slide.look,s.level*loud,s.pan||0);}}
     f.dirty=true;}}
   // the pictures: one feed per frame slot, only where somebody can see it
   drawTimer-=dt;if(drawTimer>0)return;drawTimer=1/tier.fps/Math.max(1,feeds.size);
   const cam=scene.activeCamera;if(!cam)return;const cp=cam.globalPosition||cam.position,fw=cam.getForwardRay?cam.getForwardRay(1).direction:{x:0,z:1},list=[...feeds.values()],f=list[turn++%list.length];
   if(f.spots.some(s=>seen(s,cp,fw.x,fw.z)))paintFeed(f);
  }
  function dispose(){disposed=true;for(const f of feeds.values())stopClip(f);for(const h of audio.hums){if(!h)continue;try{h.gain.gain.value=0;for(const o of h.nodes)o.stop();h.gain.disconnect();h.pan?.disconnect();}catch{}}audio.hums=[];if(audio.voice)try{audio.voice.gain.gain.value=0;}catch{}feeds.clear();spots.length=0;lead=null;if(api.current===handle)api.current=null;}
  const handle={wall,kiosk,extras,tick,dispose,quarter,get feeds(){return [...feeds.values()];},get spots(){return spots;},get lead(){return lead;},
   // for tests: move a feed on by one slide, or to the first slide of a kind / id
   skip(id,want){const f=feeds.get(id);if(!f)return null;for(let n=0;n<400;n++){stopClip(f);nextSlide(f);if(!f.slide)return null;if(!want||f.slide.kind===want||f.slide.cat===want||f.slide.id===want)break;}f.i=-1;f.lineT=0;f.dur=0;return f.slide;},
   paintAll(){for(const f of feeds.values())paintFeed(f);}};
  api.current=handle;return handle;
 }
 const api={LOOKS,CHIMES,ZONE_SOUND,TIER,VOICE_RANGE,HUM_RANGE,paint,housing,place,axes,FACES,street,loudness,audio,current:null,fit,wrap};
 root.VoidAdScreens=api;
})(typeof globalThis!=='undefined'?globalThis:this);
