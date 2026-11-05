/* The hub's production providers. It holds NO Firebase credential and NO database access. Everything it learns about a player
   beyond "this token is valid" it learns by forwarding the player's OWN token to the existing game API, which applies its own
   checks (token verification with revocation, one character per account). Failures never block joining: the player simply gets
   the default look and a guest name.
     GET {api}/api/void-runner/character  -> {character:{gender, model}|null}
     GET {api}/api/identity/me            -> {handle|null, ...}                                                          */
'use strict';
const HANDLE=/^[A-Za-z0-9_]{3,20}$/;

function createApiProvider({apiBase,fetchImpl=fetch,timeoutMs=4000,log=()=>{}}){
  if(!/^https?:\/\/[^/\s]+$/.test(apiBase||''))throw new Error('HUB_API_BASE must be an origin such as https://example.onrender.com');
  async function getJson(path,token){
    try{
      const r=await fetchImpl(apiBase+path,{headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(timeoutMs)});
      if(!r.ok){log('warn',path+' answered '+r.status);return null;}
      const ct=r.headers?.get?.('content-type')||'';if(ct&&!/json/i.test(ct))return null;
      const j=await r.json();return j&&typeof j==='object'&&!Array.isArray(j)?j:null;
    }catch(e){log('warn',path+' failed: '+String(e.message).slice(0,80));return null;}
  }
  /* -> {model|null, handle|null}. Both are validated here again; nothing from the API is passed on unchecked. */
  async function profile(token,{anonymous}){
    // Anonymous accounts cannot own a character (the API refuses to create one), so only ask for the handle.
    const [character,me]=await Promise.all([anonymous?null:getJson('/api/void-runner/character',token),getJson('/api/identity/me',token)]);
    const model=typeof character?.character?.model==='string'?character.character.model:null;
    const handle=typeof me?.handle==='string'&&HANDLE.test(me.handle)?me.handle:null;
    return {model,handle};
  }
  return {profile};
}
module.exports={createApiProvider,HANDLE};
