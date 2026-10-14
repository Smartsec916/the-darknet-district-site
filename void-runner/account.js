/* Firebase identity + authenticated API. Cloud save replacement is always explicit.
   Sign-in: a District handle (no Google needed), an email link, or Google. */
const account = window.VoidAccount = {user:null,products:[],status:'Verified purchases require a connection.',busy:false,revision:0,cloud:null,savedAt:null};
let authInitialization=null,unsubscribe=null;
let firebase, generation=0, pendingCheckout=new URLSearchParams(location.search).get('checkout');
let saveReady=false,verifiedUntil=0,ownershipTimer,refreshTimer,serviceRetryTimer,lastRefreshAttempt=0;
// Handles, email links and Google linking are shared with every District game.
let identityModule=null;const identity=()=>identityModule??=import('../district-identity.js');
function render(){
  globalThis.VoidMenu?.refreshAccount();
  if(mode==='dock'&&view==='market')market();
  if(mode==='dock'&&view==='account')accountPage();
}
async function api(path,body,authenticated=true){
  const user=account.user,epoch=generation;
  if(authenticated&&!user)throw new Error('Sign in to continue.');
  const token=authenticated?await user.getIdToken():undefined;
  if(authenticated&&epoch!==generation)throw new Error('Sign in again.');
  return VoidNetwork.request(path,{body,token,scope:authenticated?user.uid+':'+epoch:'public'});
}

async function catalog(){
  try{const data=await api('catalog',null,false);account.products=data.products;account.status=data.testMode?'TEST STORE · Checkout uses test payments. No real equipment sales yet.':'Permanent equipment · Secure checkout · No subscription';}
  catch{account.products=[];account.status='VOID NETWORK unavailable. Purchases remain locked. Try again shortly.';}
  render();
}
async function refresh(){
  lastRefreshAttempt=Date.now();
  const epoch=generation;
  let data;try{data=await api('account');}catch(error){if(epoch===generation){setOwnedGear([]);saveReady=false;
    if(['unavailable','timeout','network','invalid-response'].includes(error.kind)){
      clearTimeout(serviceRetryTimer);serviceRetryTimer=setTimeout(()=>{if(epoch===generation&&account.user)run(refresh,true);},60000);
    }
  }throw error;}if(epoch!==generation)return;
  clearTimeout(serviceRetryTimer);
  verifiedUntil=Date.now()+300000;clearTimeout(ownershipTimer);ownershipTimer=setTimeout(()=>{setOwnedGear([]);verifiedUntil=0;},300000);
  clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(epoch===generation&&account.user)run(refresh,true);},240000);
  if(data.developer){const identityEpoch=generation;VoidDevTools.identity((path,body)=>{if(identityEpoch!==generation||!account.user)throw new Error('Sign in again.');return api(path,body);});}
  account.revision=data.revision;account.cloud=data.save;account.savedAt=data.savedAt;saveReady=true;setOwnedGear(data.owned);render();
}
function cloudDescription(){return account.cloud?`${account.cloud.completed} deliveries · ${account.cloud.credits.toLocaleString()} CR · ${account.cloud.cleared?.length||0}/12 new missions`:'No cloud save yet.';}
function handleField(id,label,action,cta,value=''){
  return `<div class="account-field"><label for="${id}">${label}</label><div class="field-row"><input id="${id}" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ghost_01" value="${escapeText(value)}" data-enter="${action}">${button(cta,action,false,account.busy)}</div><small>3–20 letters, numbers or underscores. Shared across District games.</small></div>`;
}
function emailField(cta,quiet=false){
  return `<div class="account-field"><label for="vr-email">Email sign-in link</label><div class="field-row"><input id="vr-email" type="email" autocomplete="email" placeholder="you@example.com" data-enter="email-link">${button(cta,'email-link',quiet,account.busy||!firebase)}</div><small>Open the link in this browser to finish. No password, no Google account.</small></div>`;
}
function accountPage(){
  view='account';
  const user=account.user,anonymous=!!user?.isAnonymous,name=user?.displayName||user?.email||'Pilot';
  let body;
  if(!user){
    body=`<p class="account-detail">Register a handle to keep cloud saves and buy equipment. No Google account needed, and you can keep playing locally without one.</p>
      ${handleField('vr-handle','Choose your handle','register-handle','REGISTER HANDLE')}
      <details class="account-other"><summary>Already have an account?</summary>${emailField('SEND LINK',true)}<div class="account-actions">${button('SIGN IN WITH GOOGLE','sign-in',true,account.busy||!firebase)}${!firebase?button('RETRY CONNECTION','auth-retry',true,account.busy):''}</div></details>`;
  } else {
    body=`<p class="account-detail">Signed in as <strong>${escapeText(name)}</strong>.</p>`;
    if(!user.displayName)body+=handleField('vr-handle','Choose your public handle','register-handle','CLAIM HANDLE');
    if(anonymous)body+=`<div class="account-warning"><strong>Handle not secured.</strong> It lives only in this browser. Add an email or Google so you can sign in anywhere. Required before buying equipment.</div>${emailField('SECURE WITH EMAIL')}<div class="account-actions">${button('SECURE WITH GOOGLE','secure-google',true,account.busy||!firebase)}</div>`;
    body+=`<div class="manifest">${row('This browser',state.completed+' deliveries / '+state.credits+' CR')}${row('Cloud save',escapeText(cloudDescription()))}${row('Owned equipment',ownedGear.length+' verified items')}</div><p>Choose when to copy progress between this browser and your account. Start New Campaign replaces the local campaign; it never deletes purchases.</p><div class="account-actions">${button('SAVE THIS JOURNEY TO CLOUD','cloud-save-prompt',false,account.busy||!saveReady)}${button('LOAD CLOUD JOURNEY','cloud-load-prompt',true,account.busy||!account.cloud||!saveReady)}${button('REFRESH / RESTORE PURCHASES','account-refresh',true,account.busy)}${button('SIGN OUT','sign-out',true,account.busy)}</div>`;
    if(user.displayName)body+=`<details class="account-other"><summary>Change public handle</summary>${handleField('vr-handle-change','New handle','change-handle','CHANGE HANDLE',user.displayName)}<small>Handles can be changed once every 30 days.</small></details>`;
  }
  menuPage('PILOT ACCOUNT','Pilot account',body+`<p class="fine">Cloud saves copy campaign progress only. Paid ownership is checked separately with the server. Your browser save remains available if the account service is offline.</p>`);
  const back=screen.querySelector('.shop-heading button');if(back){back.dataset.action='account-main-menu';back.textContent='BACK TO MAIN MENU';}
}
function fieldValue(id){return screen.querySelector('#'+id)?.value.trim()||'';}
async function afterIdentityChange(){
  account.user=firebase.auth.currentUser;
  try{await confirmCheckout();await refresh();}catch(error){render();}
}
async function run(action,quiet=false){
  if(account.busy)return;account.busy=true;render();
  try{await action();}catch(error){if(!quiet)announce(error.message||'Connection unavailable. Please try again.');}
  finally{account.busy=false;render();}
}
function clearCheckout(){pendingCheckout=null;const url=new URL(location.href);url.searchParams.delete('checkout');history.replaceState(null,'',url);}
async function confirmCheckout(){
  if(!pendingCheckout||!account.user)return;
  const epoch=generation;
  const data=await api('checkout/confirm',{session:pendingCheckout});
  if(epoch!==generation)return;
  setOwnedGear(data.owned);
  if(data.status==='paid'){clearCheckout();announce('Payment confirmed. Your equipment is ready to equip.');}
  else if(data.status==='revoked'){clearCheckout();announce('This purchase was refunded or suspended.');}
  else announce('Payment is still processing. Refresh your account in a moment.');
}
function initializeAuth(){
  if(authInitialization)return authInitialization;
  VoidNetwork.report('identity','connecting');
  authInitialization=(async()=>{
    try{
      firebase=await import('../firebase-auth.js');
      if(!unsubscribe)unsubscribe=firebase.onAuthStateChanged(firebase.auth,user=>{
        generation++;clearTimeout(ownershipTimer);clearTimeout(refreshTimer);verifiedUntil=0;account.user=user;VoidDevTools.identity(null);account.cloud=null;account.revision=0;saveReady=false;setOwnedGear([]);render();
        VoidNetwork.report('identity','ready');
        if(user)run(async()=>{await confirmCheckout();await refresh();},true);
      });
      await firebase.getRedirectResult(firebase.auth);
      try{const done=await (await identity()).completeEmailLink();
        if(done){await afterIdentityChange();announce(done.result==='secured'?'Handle secured. You can now sign in anywhere with your email.':done.result==='switched'?'That email already had an account. You are now signed in to it.':'Signed in with your email link.');}
      }catch(error){announce(error.message);}
    }catch{VoidNetwork.report('identity','degraded');authInitialization=null;}
    render();
  })();
  return authInitialization;
}

function requestAction(action){
  if(globalThis.VoidSkirmish?.active||globalThis.VoidFlightSkirmish?.active)return;
  if(['play','pause'].includes(mode))return;
  if(action==='account'){accountPage();return;}
  if(action==='auth-retry'){run(initializeAuth);return;}
  // Read typed values first: run() redraws the page (busy state) before the action starts.
  if(action==='register-handle'||action==='change-handle'){const handle=fieldValue(action==='register-handle'?'vr-handle':'vr-handle-change');run(async()=>{
    if(!firebase)throw new Error('Account service is still connecting. Try again shortly.');
    const user=await (await identity()).registerHandle(handle);
    await afterIdentityChange();
    announce(`Handle ${user.displayName} is yours.${user.isAnonymous?' Secure it with an email or Google to keep it on other devices.':''}`);
  });}
  if(action==='email-link'){const typed=fieldValue('vr-email');run(async()=>{
    const email=await (await identity()).sendEmailLink(typed);
    announce(`Sign-in link sent to ${email}. Open it in this browser to finish.`);
  });}
  if(action==='secure-google')run(async()=>{
    const user=await (await identity()).secureWithGoogle();
    if(user){await afterIdentityChange();announce('Handle secured with Google.');}
  });
  if(action==='sign-in')run(async()=>{
    if(!firebase)throw new Error('Google sign-in is still connecting. Try again shortly.');
    try{await firebase.signInWithPopup(firebase.auth,firebase.provider);}
    catch(error){
      if(error.code==='auth/popup-closed-by-user')return;
      if(error.code==='auth/popup-blocked')throw new Error('Allow the Google sign-in popup, then try again.');
      throw new Error('Google sign-in failed. Please try again.');
    }
    // The auth listener can fire while run() is busy; refresh explicitly afterward.
    account.user=firebase.auth.currentUser;await confirmCheckout();await refresh();
  });
  else if(action==='sign-out')run(async()=>{generation++;setOwnedGear([]);await firebase.signOut(firebase.auth);account.user=null;saveReady=false;account.cloud=null;});
  else if(action==='account-refresh')run(async()=>{setOwnedGear([]);await confirmCheckout();await refresh();announce('Account and equipment refreshed.');});
  else if(action?.startsWith('purchase:')){
    if(!account.user){accountPage();return;}
    if(account.user.isAnonymous){accountPage();announce('Secure your handle with an email or Google before buying equipment, so a purchase can never be lost.');return;}
    run(async()=>{await catalog();if(!account.products.some(p=>p.id===action.slice(9)))throw new Error(account.status+' This item is not currently available.');const epoch=generation;const data=await api('checkout',{item:action.slice(9)});if(epoch!==generation)return;
      const target=new URL(data.url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw new Error('Unexpected checkout address.');location.assign(target.href);});
  }
  else if(action==='cloud-save-prompt'&&saveReady){view='save-confirm';menuPage('CLOUD SAVE','Save this <em>journey?</em>',`<p>Copy this browser’s ${state.completed} deliveries and ${state.credits} credits to your account. ${account.cloud?'This replaces your current cloud journey.':'This creates your first cloud save.'}</p>${button('SAVE TO CLOUD','cloud-save')}${button('CANCEL','account',true)}`);}
  else if(action==='cloud-load-prompt'&&account.cloud){view='load-confirm';menuPage('RESTORE JOURNEY','Load your <em>cloud save?</em>',`<p>${escapeText(cloudDescription())}. This replaces the campaign in this browser. Your purchased equipment is unaffected.</p>${button('LOAD CLOUD SAVE','cloud-load')}${button('CANCEL','account',true)}`);}
  else if(action==='cloud-save')run(async()=>{const epoch=generation;const snapshot=JSON.parse(JSON.stringify(state));const data=await api('save',{save:snapshot,revision:account.revision});if(epoch!==generation)return;account.revision=data.revision;account.cloud=snapshot;account.savedAt=data.savedAt;accountPage();announce('Journey saved to your account.');});
  else if(action==='cloud-load'&&account.cloud){const restored=C.restore(JSON.stringify(account.cloud));if(!restored){announce('This cloud save is incompatible. Your local progress is unchanged.');return;}globalThis.VoidFlightSession?.end();state=restored;save();current=null;VoidMenu.returnTo=null;hud();accountPage();announce('Cloud journey restored.');}
}
account.request=requestAction;
screen.addEventListener('click',e=>requestAction(e.target.closest('button')?.dataset.action));
// Enter in a handle or email field triggers its button.
screen.addEventListener('keydown',e=>{const action=e.target.dataset?.enter;if(e.key==='Enter'&&action){e.preventDefault();requestAction(action);}});
if(pendingCheckout==='cancelled'){clearCheckout();announce('Checkout cancelled. No equipment was added.');}
VoidLoading.stage('account','ACCOUNT INITIALIZATION STARTED · OPTIONAL SERVICES CONNECTING');
initializeAuth();
addEventListener('focus',()=>{if(account.user&&Date.now()>verifiedUntil-240000&&Date.now()-lastRefreshAttempt>60000)run(refresh,true);});
