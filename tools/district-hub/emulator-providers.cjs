/* The development providers: they ask the LOCAL Firebase emulators only. Token check: Auth emulator. Character: Firestore emulator.
   The production hub uses google-auth.cjs and api-providers.cjs instead (see server.cjs). */
'use strict';
const crypto=require('node:crypto');
const PROJECT='demo-darknet-local';
const isLocal=h=>/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(h||'');

function create(env=process.env){
  const auth=env.FIREBASE_AUTH_EMULATOR_HOST,store=env.FIRESTORE_EMULATOR_HOST;
  // Refuse anything that is not clearly the local emulators. There is no code path to production here.
  if(!isLocal(auth)||!isLocal(store))throw new Error('Set FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST to local emulator addresses (127.0.0.1:port).');
  if(env.GOOGLE_APPLICATION_CREDENTIALS)throw new Error('Refusing to run with real Google credentials in the environment.');
  return {
    project:PROJECT,
    /* The one call the hub makes: -> {uid, anonymous, model, handle} or null. */
    async identify(token){
      const who=await this.verifyToken(token);if(!who)return null;
      return {...who,model:who.anonymous?null:await this.characterModel(who.uid),handle:null};
    },
    /* -> {uid, anonymous} or null. The emulator checks that the token is one it issued and that the account exists. */
    async verifyToken(token){
      try{
        const r=await fetch(`http://${auth}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
        if(!r.ok)return null;const u=(await r.json()).users?.[0];if(!u?.localId)return null;
        return {uid:u.localId,anonymous:!u.email&&!(u.providerUserInfo||[]).length};
      }catch{return null;}
    },
    /* -> the stored character model name or null. Same document id as void_runner_api.player_ref(). */
    async characterModel(uid){
      try{
        const id=crypto.createHash('sha256').update(uid).digest('hex');
        const r=await fetch(`http://${store}/v1/projects/${PROJECT}/databases/(default)/documents/vr_players/${id}`,{headers:{authorization:'Bearer owner'}});
        if(!r.ok)return null;const f=(await r.json()).fields?.character?.mapValue?.fields;
        return f?.model?.stringValue||null;
      }catch{return null;}
    }
  };
}
module.exports={create,isLocal,PROJECT};
