/* The hub's production providers. It holds NO Firebase credential and NO database access. Everything it learns about a player
   beyond "this token is valid" it learns by forwarding the player's OWN token to the existing game API, which applies its own
   checks (token verification with revocation, one character per account). Lookup failures fail closed for multiplayer.
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
  /* Only the API's authenticated, account-bound records can complete a profile. */
  async function profile(token){
    const [character,me]=await Promise.all([getJson('/api/void-runner/character',token),getJson('/api/identity/me',token)]);
    if(!character||!me)return {profileStatus:'unavailable'};
    const saved=character.character;
    const validCharacter=!!saved&&typeof saved==='object'&&
      ((saved.gender==='male'&&['district-smuggler','admin'].includes(saved.model))||
       (saved.gender==='female'&&saved.model==='district-resident'));
    const handle=typeof me.handle==='string'&&HANDLE.test(me.handle)?me.handle:null;
    // Malformed non-null records need repair; never treat them as an empty slot and offer an overwrite.
    if((me.handle!=null&&!handle)||(saved!=null&&!validCharacter))return {profileStatus:'unavailable'};
    const profileStatus=handle?(validCharacter?'ready':'missing-character'):(validCharacter?'missing-handle':'missing-both');
    const appearance=character.appearance&&typeof character.appearance==='object'&&!Array.isArray(character.appearance)?character.appearance:null;
    return {profileStatus,model:validCharacter?saved.model:null,handle,appearance};
  }
  return {profile};
}
module.exports={createApiProvider,HANDLE};
