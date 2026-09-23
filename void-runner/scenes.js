/* Portrait dialogue, explorable interiors, and route-specific planet flybys. */
const characters = VoidStoryContent.characters;
let speech = null;
function portrait(id, small=false) { const c=characters[id]; return `<div class="portrait ${small?'small':''}" role="img" aria-label="Portrait of ${c.name}" style="background-image:url('${new URL(c.portrait,new URL('../',artBase)).href}');background-size:${c.cell?'300% 200%':'cover'};background-position:${c.cell||'center'}"></div>`; }
function scene(name) { if(name&&screen.dataset.scene&&screen.dataset.scene!==name)globalThis.VoidAudio?.event('door');globalThis.VoidAudio?.cancel(); screen.dataset.scene=name;screen.dataset.station=state.location;screen.classList.remove('station-dock'); screen.classList.toggle('cinematic',!!name); }
const originalPanel=panel;
panel=function(...args){speech=null;scene('');originalPanel(...args);};
const originalLaunch=launch;
launch=function(){speech=null;scene('');originalLaunch();};
function talk(sceneName, lines, done, label='CONTINUE →', heading='') {
 mode='dialogue';clearInput();flightUI(false);scene(sceneName);screen.classList.remove('hidden');
 speech={lines,index:0,shown:0,done,label,heading,scene:sceneName};renderLine();
}
function renderLine(){
 const line=speech.lines[speech.index], c=characters[line.who]||{name:line.who,role:''};const newlyMet=!state.story.met.includes(line.who);if(newlyMet)state.story.met.push(line.who);const events=VoidStory.emit(state,'talk',line.who);if(newlyMet||events.length)save();speech.shown=reducedMotion?line.text.length:0;
 screen.innerHTML=`<section class="cinematic-space"><div class="scene-heading"><div class="eyebrow">${speech.scene==='vesper'?'VESPER / WARD FREIGHT WORKSHOP':speech.scene==='bar'?C.stations[state.location].name.toUpperCase()+' / '+C.stations[state.location].bar.toUpperCase():'INCOMING TRANSMISSION'}</div><h1>${speech.heading}</h1></div><div class="dialogue-window">${characters[line.who]?portrait(line.who):''}<div class="speech-body"><div class="speaker"><h2>${c.name}</h2><span>${c.role}</span></div><p id="spoken-text" aria-hidden="true"></p><p class="sr-only" aria-live="polite">${c.name}: ${line.text}</p><div class="speech-controls"><span id="speech-status">TRANSMITTING <span class="talk-light">●</span></span><button data-action="speech-next" id="speech-next">${reducedMotion?nextLabel():'SHOW FULL LINE'}</button></div></div></div></section>`;
 globalThis.VoidAudio?.speak(line.who,line.text);
 $('spoken-text').textContent=line.text.slice(0,Math.floor(speech.shown));
}
function nextLabel(){return speech.index===speech.lines.length-1?speech.label:'NEXT →';}
function advanceSpeech(){
 if(!speech)return;
 const line=speech.lines[speech.index];
 if(speech.shown<line.text.length){speech.shown=line.text.length;updateSpeech(0);return;}
 if(speech.index<speech.lines.length-1){speech.index++;renderLine();return;}
 const done=speech.done;speech=null;globalThis.VoidAudio?.cancel();done();
}
function updateSpeech(dt){if(!speech)return;const line=speech.lines[speech.index];speech.shown=Math.min(line.text.length,speech.shown+dt*48);$('spoken-text').textContent=line.text.slice(0,Math.floor(speech.shown));const finished=speech.shown>=line.text.length;$('speech-next').textContent=finished?nextLabel():'SHOW FULL LINE';$('speech-status').textContent=finished?`${speech.index+1} / ${speech.lines.length} · END OF LINE`:'● SPEAKING';}
const originalUpdate=update;update=function(dt){originalUpdate(dt);updateSpeech(dt);};
function barRoom(){
 speech=null;mode='dock';view='bar';clearInput();flightUI(false);scene('bar');screen.classList.remove('hidden');
 screen.innerHTML=`<section class="cinematic-space"><div class="scene-heading"><div class="eyebrow">${C.stations[state.location].name.toUpperCase()}</div><h1>${C.stations[state.location].bar}</h1></div><button class="place bartender" data-action="talk-nyx">NYX · TALK</button><button class="place booth" data-action="talk-rook">ROOK · TALK</button>${state.quest==='open'?'<button class="place job-board" data-action="contacts">CARGO CONTACTS →</button>':''}</section>`;
}
bar=barRoom;
function rookConversation(){
 const illegal=state.quest==='illegal-offer';
 if(state.quest==='open')return contacts();
 if(!['legal-offer','illegal-offer'].includes(state.quest))return talk('bar',[{who:'rook',text:'Deliver the cargo. Then come back for more work.'}],barRoom,'BACK');
 offerCard(illegal);
}
function offerCard(illegal){
 talk('bar',[{who:'rook',text:`${illegal?'Good run. Next job: memory wafers to Rusthaven. Illegal. This run might be more dangerous. 800 credits.':(state.story.met.includes('rook')?'The filters are still waiting. Take them to Kepler. Watch for raiders. 350 credits. Then come back.':'Elias sent you? Take legal filters to Kepler. Look out for raiders. 350 credits. Then come back.')}`}],()=>{if(C.accept(state)){save();dock();announce('Cargo loaded. Ready for departure.');}else dock();},'ACCEPT JOB →','Rook’s booth');
 // Leaving the offer never commits the player to a job.
 screen.querySelector('.speech-controls').insertAdjacentHTML('beforeend',button('NOT YET','bar',true));
}
function contacts(){
 speech=null;scene('dock');mode='dock';view='bar';screen.classList.remove('hidden');
 screen.innerHTML=`<section class="cinematic-space"><div class="scene-heading"><div class="eyebrow">CARGO DOCK</div><h1>Find a job.</h1></div>${C.contracts.map(c=>{const id=c.id==='medicine'?'sol':c.id==='ghost'?'iona':'rook';return '<button class="place contact-'+id+'" data-action="brief:'+c.id+'" '+(state.contract?'disabled':'')+'>'+characters[id].name+'<br>'+(state.contract?'CARGO LOADED':c.reward+' CR · TALK')+'</button>';}).join('')}<button class="place cargo-exit" data-action="bar">BAR →</button></section>`;
}
function brief(id){const c=C.contracts.find(c=>c.id===id);if(!c)return;const who=id==='medicine'?'sol':id==='ghost'?'iona':'rook';talk('dock',[{who,text: `${c.cargo}. ${c.legal?'Legal':'Illegal'}. To ${C.stations[c.destination===state.location?'meridian':c.destination].name}. ${c.reward} credits.`}],()=>{if(C.accept(state,id)){save();dock();}else contacts();},'ACCEPT JOB →','Cargo job');screen.querySelector('.speech-controls').insertAdjacentHTML('beforeend',button('BACK','contacts',true));}

const originalArrive=arrive;
arrive=function(){
 const f=current;originalArrive();if(mode!=='arrival'||!f?.reward)return;
 const who=f.destination==='undertow'?'iona':f.destination==='foundry'?'rook':'sol';
 const line=f.destination==='undertow'&&state.completed===2?'Delivered. 800 credits. These MK 2 guns are my thanks. Shops are open to you now.':`Delivered. ${f.reward} credits. ${state.quest==='return'?'Head back to Rook at Meridian.':'Good flying.'}`;
 talk('dock',[{who,text:line+(f.repairCharged?` Dock servicing costs ${f.repairCharged} credits.`:'')}],()=>dock(),'OPEN STATION MENU →','Delivery confirmed');
};
screen.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(a==='speech-next')advanceSpeech();else if(a==='talk-rook')rookConversation();else if(a==='talk-nyx')talk('bar',[{who:'nyx',text:state.quest==='legal-offer'?'Rook has work. He’s in the booth.':state.quest==='illegal-offer'?'Rook is waiting. This job pays better.':'Need work? Visit the cargo contacts. Need upgrades? Try the shop.'}],barRoom,'BACK TO THE BAR','At the counter');else if(a==='contacts')contacts();else if(a?.startsWith('brief:'))brief(a.slice(6));});
addEventListener('keydown',e=>{if(speech&&['Space','Enter'].includes(e.code)&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)advanceSpeech();}});
const planetTypes={
 meridian:{name:'AUREL / RINGED GAS GIANT',base:'#d6b58a',shade:'#443248',ring:true,kind:'gas',side:1},
 kepler:{name:'PELAGOS / OCEAN WORLD',base:'#41a6c7',shade:'#081e48',kind:'ocean',side:-1},
 undertow:{name:'NYX / FROZEN MOON',base:'#b7d4f0',shade:'#27355e',kind:'ice',side:1},
 foundry:{name:'CINDER / VOLCANIC WORLD',base:'#db7454',shade:'#351623',kind:'rock',side:-1}
};
function planetPosition(progress,width=W,height=H){
 const z=250-progress*350;if(z<=4)return null;
 const scale=Math.min(width,height)*.9/z;
 return {x:width/2+60*scale,y:height*.42-18*scale,r:22*scale,z};
}
function drawPlanets(dest){
 const type=planetTypes[dest],flying=mode==='play'||mode==='pause';
 const p=flying?planetPosition(elapsed/current.duration):{x:W*.8,y:H*.23,r:Math.min(W,H)*.15,z:250};if(!p)return;
 if(type.side<0)p.x=W-p.x;
 if(p.x-p.r*2>W||p.x+p.r*2<0||p.y+p.r*2<0)return;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.22);
 function ring(start,end){ctx.strokeStyle='#c9b29688';ctx.lineWidth=p.r*.21;ctx.beginPath();ctx.ellipse(0,0,p.r*1.75,p.r*.52,0,start,end);ctx.stroke();ctx.strokeStyle='#e7d5bfa0';ctx.lineWidth=p.r*.06;ctx.beginPath();ctx.ellipse(0,0,p.r*1.96,p.r*.58,0,start,end);ctx.stroke();}
 if(type.ring)ring(Math.PI,Math.PI*2);
 ctx.save();ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.clip();ctx.fillStyle=type.base;ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);
 if(type.kind==='gas'||type.kind==='ice'){for(let i=-10;i<10;i++){ctx.fillStyle=i%3===0?'#ffffff25':'#38456535';ctx.fillRect(-p.r,i*p.r*.11,p.r*2,p.r*.05);}}
 if(type.kind==='ocean'){ctx.fillStyle='#568d62';for(let i=0;i<6;i++){const x=Math.sin(i*4.3)*p.r*.65,y=Math.cos(i*2.8)*p.r*.7;ctx.beginPath();for(let j=0;j<=9;j++){const a=j*Math.PI*2/9,rr=p.r*(.18+Math.sin(j*3+i)*.08);j?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+rr,y);}ctx.fill();}}
 if(type.kind==='rock'){for(let i=0;i<14;i++){ctx.fillStyle=i%3?'#57282e':'#ffbc6e';ctx.beginPath();ctx.arc(Math.sin(i*4.7)*p.r*.8,Math.cos(i*2.3)*p.r*.8,p.r*(i%3?.07:.025),0,Math.PI*2);ctx.fill();}}
 const shadow=ctx.createRadialGradient(-p.r*.45,-p.r*.5,p.r*.05,p.r*.3,p.r*.2,p.r*1.45);shadow.addColorStop(0,'#ffffff22');shadow.addColorStop(.45,'#00000000');shadow.addColorStop(1,type.shade);ctx.fillStyle=shadow;ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);ctx.restore();
 ctx.strokeStyle=type.base+'55';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.stroke();if(type.ring)ring(0,Math.PI);ctx.restore();
 if(flying&&elapsed/current.duration<.48){ctx.fillStyle='#adc7d1';ctx.font='11px Consolas, monospace';ctx.fillText(type.name,Math.max(20,Math.min(W-260,p.x-p.r)),Math.max(205,p.y+p.r+24));}
}
// bootstrap.js owns startup after all renderers are registered.
