/* Blackout Protocol identity and ranked-run API. Guest play never waits for Firebase. */
const BASE = ['localhost', '127.0.0.1'].includes(location.hostname) ? '' : 'https://the-darknet-district-site.onrender.com';
const ROOT = `${BASE}/api/blackout`;
let firebase = null;
let user = null;
let authPromise = null;

export function currentUser(){ return user; }
export function authReady(){
  if(authPromise) return authPromise;
  authPromise = new Promise(async resolve => {
    const timer = setTimeout(()=>resolve(null), 4000);
    try {
      firebase = await import('../firebase-auth.js');
      firebase.onAuthStateChanged(firebase.auth, value => {
        user = value;
        dispatchEvent(new CustomEvent('blackout-auth', {detail:{signedIn:!!value}}));
        clearTimeout(timer);
        resolve(value);
      });
      await firebase.getRedirectResult(firebase.auth);
    } catch(error) {
      console.warn('Blackout sign-in unavailable:', error);
      clearTimeout(timer);
      resolve(null);
    }
  });
  return authPromise;
}

export async function signIn(){
  await authReady();
  if(!firebase) throw new Error('Google sign-in is unavailable right now.');
  try { return await firebase.signInWithPopup(firebase.auth, firebase.provider); }
  catch(error){
    if(error.code === 'auth/popup-blocked' || error.code === 'auth/web-storage-unsupported'){
      await firebase.signInWithRedirect(firebase.auth, firebase.provider);
      return null;
    }
    if(error.code === 'auth/popup-closed-by-user') return null;
    throw new Error('Google sign-in failed. Please try again.');
  }
}

export async function signOut(){
  await authReady();
  if(firebase) await firebase.signOut(firebase.auth);
  sessionStorage.removeItem('blackoutRunId');
  sessionStorage.removeItem('blackoutRunUid');
}

async function request(path, {method='GET', body, requireUser=false, timeout=5000}={}){
  await authReady();
  if(requireUser && !user) throw new Error('Sign in with Google to continue.');
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeout);
  try {
    const headers = {Accept:'application/json'};
    if(body !== undefined) headers['Content-Type'] = 'application/json';
    if(user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
    const response = await fetch(ROOT + path, {method, headers, body:body===undefined?undefined:JSON.stringify(body),
      cache:'no-store', credentials:'omit', signal:controller.signal});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error || 'The leaderboard service is unavailable.');
    return data;
  } catch(error){
    if(error.name === 'AbortError') throw new Error('The leaderboard service timed out. Local play continues.');
    throw error;
  } finally {clearTimeout(timer);}
}

export function leaderboard(){ return request('/leaderboard', {timeout:8000}); }
export function checkHandle(handle){ return request(`/handles/${encodeURIComponent(handle)}/available`); }
export function claimHandle(handle){ return request('/handle', {method:'POST', body:{handle}, requireUser:true}); }

export function resetRankedRun(){
  for(const key of ['blackoutRunId','blackoutRunUid','blackoutRankedError','blackoutLastSubmission']) sessionStorage.removeItem(key);
}

function activeRun(){
  return user && sessionStorage.getItem('blackoutRunUid')===user.uid ? sessionStorage.getItem('blackoutRunId') : null;
}

export async function startRankedRun(){
  await authReady();
  if(!user) return null;
  if(activeRun()) return activeRun();
  try {
    const data = await request('/runs', {method:'POST', body:{}, requireUser:true});
    sessionStorage.setItem('blackoutRunId', data.runId);
    sessionStorage.setItem('blackoutRunUid', user.uid);
    return data.runId;
  } catch(error){
    sessionStorage.setItem('blackoutRankedError', error.message);
    return null;
  }
}

export async function recordLevel(level, score, events={}){
  await authReady();
  const runId = activeRun();
  if(!runId) return null;
  try {
    return await request(`/runs/${runId}/level`, {method:'POST', body:{level,score,events}, requireUser:true, timeout:5000});
  } catch(error){
    sessionStorage.setItem('blackoutRankedError', error.message);
    return null;
  }
}

export async function finishRun(score, events={}){
  await authReady();
  const runId = activeRun();
  if(!runId) return null;
  try {
    const result = await request(`/runs/${runId}/finish`, {method:'POST', body:{score,events}, requireUser:true, timeout:5000});
    sessionStorage.setItem('blackoutLastSubmission', JSON.stringify(result));
    sessionStorage.removeItem('blackoutRunId');
    sessionStorage.removeItem('blackoutRunUid');
    return result;
  } catch(error){
    sessionStorage.setItem('blackoutRankedError', error.message);
    return null;
  }
}
