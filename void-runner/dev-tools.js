/* UI visibility is not authorization: every private read/write is verified by the API. */
const VoidDevTools={authorized:false,request:null,pending:null,revision:0,values:{...VoidBalance.defaults},preset:'NORMAL',overlay:false,
 applyPending(){if(this.pending){VoidBalance.apply(this.pending);this.pending=null;}},
 async identity(request){
  this.authorized=false;this.request=request;this.overlay=false;devPanel.hidden=true;devButton.hidden=true;debugInfo.hidden=true;
  devMissileTrial=false;Object.assign(missileState,{ownsMissileLauncher:false,equipped:false,missilesLoaded:0,missileCapacity:0});missiles=[];missileLock=VoidTargeting.fresh();
  try{const data=await request('developer/balance');if(this.request!==request)return;this.authorized=true;this.receive(data);devButton.hidden=false;}catch{/* Fail closed; ordinary players get no private controls. */}
 },
 receive(data){this.values=VoidBalance.validate(data.values);this.revision=data.revision;this.preset=data.preset||'CUSTOM';this.pending=this.values;},
 open(){if(!this.authorized)return;if(mode==='play')pause();devPanel.hidden=false;this.render();},
 render(){
  devPanel.innerHTML=`<div class="dev-heading"><h2>DEVELOPER / COMBAT BALANCE</h2><button data-dev="close">CLOSE</button></div><p>Saved values apply to subsequent flights. Save updates the shared server configuration. Preview changes only this session.</p><label>Preset <select id="dev-preset">${['EASY','NORMAL','HARD','CUSTOM'].map(p=>`<option ${this.preset===p?'selected':''}>${p}</option>`).join('')}</select></label><div class="dev-fields">${Object.entries(VoidBalance.spec).map(([key,s])=>`<label>${key}<input data-balance="${key}" type="number" min="${s.min}" max="${s.max}" step="any" value="${this.values[key]}"></label>`).join('')}</div><label><input id="dev-debug" type="checkbox" ${this.overlay?'checked':''}> Combat debug overlay</label><div class="dev-actions">${['preview','save','reload','defaults','missile-trial'].map(a=>`<button data-dev="${a}">${{'preview':'PREVIEW NEXT FLIGHT','save':'SAVE','reload':'RELOAD CURRENT VALUES','defaults':'RESET TO DEFAULTS','missile-trial':'MISSILE TRAINING / 12 ROUNDS'}[a]}</button>`).join('')}</div><p id="dev-status" role="status"></p>`;
 },
 read(){return VoidBalance.validate(Object.fromEntries([...devPanel.querySelectorAll('[data-balance]')].map(el=>[el.dataset.balance,el.value===''?NaN:Number(el.value)])));},
 debug(){
  debugInfo.hidden=!this.authorized||!this.overlay||!['play','pause'].includes(mode);if(debugInfo.hidden)return;
  const e=missileLock.target||enemies.find(e=>flightPoint(e).z>0),s=C.stats(state);
  debugInfo.textContent=`PLAYER Hull ${hp.toFixed(1)} Shield ${shieldHP.toFixed(1)}\nLaser ${s.damage.toFixed(2)} Missile ${VOID_BALANCE.missileDamage}\nTARGET ${e?`Hull ${e.armor.toFixed(1)} Shield ${(e.shield||0).toFixed(1)} Distance ${FM.length(e).toFixed(1)} Fire ${e.fire.toFixed(2)}s`:'NONE'}\nLock ${Math.round(missileLock.progress*100)}%`;
 }
};
const devButton=document.createElement('button');devButton.textContent='DEV BALANCE';devButton.hidden=true;devButton.id='dev-balance-open';document.body.append(devButton);devButton.onclick=()=>VoidDevTools.open();
const devPanel=document.createElement('section');devPanel.id='dev-balance';devPanel.hidden=true;devPanel.setAttribute('aria-label','Developer combat balance');document.body.append(devPanel);
const debugInfo=document.createElement('pre');debugInfo.id='combat-debug';debugInfo.hidden=true;document.body.append(debugInfo);
devPanel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')devPanel.hidden=true;});
devPanel.addEventListener('change',event=>{
 if(!VoidDevTools.authorized)return;
 if(event.target.id==='dev-debug')VoidDevTools.overlay=event.target.checked;
 else if(event.target.id==='dev-preset'){VoidDevTools.preset=event.target.value;if(event.target.value!=='CUSTOM'){VoidDevTools.values=VoidBalance.preset(event.target.value);VoidDevTools.render();}}
 else if(event.target.dataset.balance){VoidDevTools.preset='CUSTOM';devPanel.querySelector('#dev-preset').value='CUSTOM';}
});
devPanel.addEventListener('click',async event=>{
 const action=event.target.closest('[data-dev]')?.dataset.dev;if(!action||!VoidDevTools.authorized)return;
 const tools=VoidDevTools,request=tools.request;
 try{
  if(action==='close'){devPanel.hidden=true;return;}
  if(action==='defaults'){tools.values={...VoidBalance.defaults};tools.preset='NORMAL';tools.render();return;}
  if(action==='reload'||action==='save'){
   const data=await request('developer/balance',action==='save'?{values:tools.read(),preset:tools.preset,revision:tools.revision}:undefined);
   if(request!==tools.request)return;tools.receive(data);tools.render();
  }else if(action==='preview'){tools.values=tools.read();tools.pending=tools.values;}
  else if(action==='missile-trial'){
   // Revalidate access before granting temporary test equipment.
   await request('developer/balance');if(request!==tools.request)return;
   tools.pending=tools.read();devMissileTrial=true;trialGear='missile';devPanel.hidden=true;launch();return;
  }
  devPanel.querySelector('#dev-status').textContent='Ready. Values take effect on the next flight.';
 }catch(error){if(request===tools.request)devPanel.querySelector('#dev-status').textContent=error.message;}
});
// A public read exposes numbers, never developer access or a write capability.
const balanceApiBase=['localhost','127.0.0.1'].includes(location.hostname)?'':'https://the-darknet-district-site.onrender.com';
fetch(balanceApiBase+'/api/void-runner/balance').then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(!VoidDevTools.authorized)VoidDevTools.pending=VoidBalance.validate(data.values);}).catch(()=>{});
