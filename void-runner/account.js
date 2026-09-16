/* Firebase identity + authenticated API. Cloud save replacement is always explicit. */
const account = window.VoidAccount = {user:null,products:[],status:'Connecting to the equipment store…',busy:false,revision:0,cloud:null,savedAt:null};
const apiBase = ['localhost','127.0.0.1'].includes(location.hostname) ? '' : 'https://the-darknet-district-site.onrender.com';
let firebase, generation=0, pendingCheckout=new URLSearchParams(location.search).get('checkout');
let saveReady=false;
function render(){
  document.getElementById('account-nav').textContent=account.user?'ACCOUNT':'SIGN IN';
  if(mode==='dock'&&view==='market')market();
  if(mode==='dock'&&view==='account')accountPage();
}
async function api(path,body,authenticated=true){
  const headers={'Content-Type':'application/json'};
  if(authenticated){if(!account.user)throw new Error('Sign in to continue.');headers.Authorization='Bearer '+await account.user.getIdToken();}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(apiBase+'/api/void-runner/'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:controller.signal,credentials:'omit'});
    let data;try{data=await response.json();}catch{throw new Error('The account service is not available yet. Local play and training still work.');}
    if(!response.ok)throw new Error(data.error||'The account service could not complete that request.');
    return data;
  }catch(error){if(error.name==='AbortError')throw new Error('The account service took too long. Try again in a moment.');throw error;}
  finally{clearTimeout(timer);}
}
async function catalog(){
  try{const data=await api('catalog',null,false);account.products=data.products;account.status=data.testMode?'TEST STORE · Checkout uses test payments. No real equipment sales yet.':'Permanent equipment · Secure checkout · No subscription';}
  catch{account.products=[];account.status='Equipment sales are opening soon. Try every item in free training.';}
  render();
}
async function refresh(){
  const epoch=generation;
  const data=await api('account');if(epoch!==generation)return;
  account.revision=data.revision;account.cloud=data.save;account.savedAt=data.savedAt;saveReady=true;setOwnedGear(data.owned);render();
}
function cloudDescription(){return account.cloud?`${account.cloud.completed} deliveries · ${account.cloud.credits.toLocaleString()} CR · ${account.cloud.cleared?.length||0}/12 new missions`:'No cloud save yet.';}
function accountPage(){
  view='account';
  menuPage('PILOT ACCOUNT','Your ship. <em>Everywhere.</em>',
    `<p class="account-detail">${account.user?'Signed in as <strong>'+escapeText(account.user.displayName||account.user.email||'Pilot')+'</strong>.':'Use the same Google login as the District homepage. You can keep playing locally without signing in.'}</p>${account.user?`<div class="manifest">${row('This browser',state.completed+' deliveries / '+state.credits+' CR')}${row('Cloud save',escapeText(cloudDescription()))}${row('Owned equipment',ownedGear.length+' / 4')}</div><p>Choose when to copy progress between this browser and your account. New Journey resets your local campaign; it never deletes purchases.</p><div class="account-actions">${button('SAVE THIS JOURNEY TO CLOUD','cloud-save-prompt',false,account.busy||!saveReady)}${button('LOAD CLOUD JOURNEY','cloud-load-prompt',true,account.busy||!account.cloud||!saveReady)}${button('REFRESH / RESTORE PURCHASES','account-refresh',true,account.busy)}${button('SIGN OUT','sign-out',true,account.busy)}</div>`:`<div class="account-actions">${button('SIGN IN WITH GOOGLE','sign-in',false,account.busy||!firebase)}${!firebase?button('RETRY CONNECTION','auth-retry',true,account.busy):''}</div>`}<p class="fine">Cloud saves copy campaign progress only. Paid ownership is checked separately with the server. Your browser save remains available if the account service is offline.</p>`);
}
async function run(action,quiet=false){
  if(account.busy)return;account.busy=true;render();
  try{await action();}catch(error){if(!quiet||state.completed>=1)announce(error.message||'Connection unavailable. Please try again.');}
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
async function initializeAuth(){
  try{
    firebase=await import('../firebase-auth.js');
    firebase.onAuthStateChanged(firebase.auth,user=>{
      generation++;account.user=user;account.cloud=null;account.revision=0;saveReady=false;setOwnedGear([]);render();
      if(user)run(async()=>{await confirmCheckout();await refresh();},true);
    });
    await firebase.getRedirectResult(firebase.auth);
  }catch{if(state.completed>=1)announce('Google sign-in could not connect. Local play is still available.');}
  render();
}
function requestAction(action){
  if(['play','pause'].includes(mode))return;
  if(action==='account'){accountPage();return;}
  if(action==='auth-retry'){run(initializeAuth);return;}
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
  else if(action==='account-refresh')run(async()=>{await catalog();await confirmCheckout();await refresh();announce('Account and equipment refreshed.');});
  else if(action?.startsWith('purchase:')){
    if(!account.user){accountPage();return;}
    run(async()=>{const epoch=generation;const data=await api('checkout',{item:action.slice(9)});if(epoch!==generation)return;
      const target=new URL(data.url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw new Error('Unexpected checkout address.');location.assign(target.href);});
  }
  else if(action==='cloud-save-prompt'&&saveReady){view='save-confirm';menuPage('CLOUD SAVE','Save this <em>journey?</em>',`<p>Copy this browser’s ${state.completed} deliveries and ${state.credits} credits to your account. ${account.cloud?'This replaces your current cloud journey.':'This creates your first cloud save.'}</p>${button('SAVE TO CLOUD','cloud-save')}${button('CANCEL','account',true)}`);}
  else if(action==='cloud-load-prompt'&&account.cloud){view='load-confirm';menuPage('RESTORE JOURNEY','Load your <em>cloud save?</em>',`<p>${escapeText(cloudDescription())}. This replaces the campaign in this browser. Your purchased equipment is unaffected.</p>${button('LOAD CLOUD SAVE','cloud-load')}${button('CANCEL','account',true)}`);}
  else if(action==='cloud-save')run(async()=>{const epoch=generation;const snapshot=JSON.parse(JSON.stringify(state));const data=await api('save',{save:snapshot,revision:account.revision});if(epoch!==generation)return;account.revision=data.revision;account.cloud=snapshot;account.savedAt=data.savedAt;accountPage();announce('Journey saved to your account.');});
  else if(action==='cloud-load'&&account.cloud){const restored=C.restore(JSON.stringify(account.cloud));if(!restored){announce('This cloud save is incompatible. Your local progress is unchanged.');return;}state=restored;save();current=null;hud();accountPage();announce('Cloud journey restored.');}
}
document.getElementById('expansion-nav').addEventListener('click',e=>requestAction(e.target.closest('button')?.dataset.action));
screen.addEventListener('click',e=>requestAction(e.target.closest('button')?.dataset.action));
if(pendingCheckout==='cancelled'){clearCheckout();announce('Checkout cancelled. No equipment was added.');}
catalog();initializeAuth();
