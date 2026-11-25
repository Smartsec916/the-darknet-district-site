import {open} from './rig-workshop.mjs';
import {GLB,inspect,map,bake} from './rig-motion.mjs';

function binaryGltf(json){
 const parts=[],starts=[];let size=0;
 function append(raw){size=(size+3)&~3;const start=size;parts.push([start,raw]);size+=raw.length;return start;}
 function decode(uri){
  if(typeof uri!=='string'||!/^data:[^,]*;base64,/i.test(uri))throw Error('Use a self-contained glTF or export a GLB.');
  return Uint8Array.from(atob(uri.slice(uri.indexOf(',')+1)),c=>c.charCodeAt(0));
 }
 for(const buf of json.buffers||[]){const data=decode(buf.uri);if(data.length!==buf.byteLength)throw Error('Invalid embedded buffer length.');starts.push(append(data));}
 for(const v of json.bufferViews||[]){v.byteOffset=starts[v.buffer]+(v.byteOffset||0);v.buffer=0;
  const ext=v.extensions?.EXT_meshopt_compression;if(ext){ext.byteOffset=starts[ext.buffer]+(ext.byteOffset||0);ext.buffer=0;}}
 for(const im of json.images||[]){if(!im.uri)continue;const raw=decode(im.uri);im.mimeType=im.uri.slice(5,im.uri.indexOf(';'));delete im.uri;
  im.bufferView=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:append(raw),byteLength:raw.length});}
 const bytes=new Uint8Array((size+3)&~3);for(const [start,part] of parts)bytes.set(part,start);
 json.buffers=[{byteLength:bytes.length}];return new Blob([GLB.write(json,bytes)],{type:'model/gltf-binary'});
}
export async function prepareModel(rec){
 let blob=rec.blob;
 if(blob&&/\.gltf$/i.test(rec.fileName))blob=binaryGltf(globalThis.VoidNPCPaths.importDocument(await blob.arrayBuffer(),'.gltf'));
 for(const track of rec.companion?.motions||[]){
  const target=await open(blob),src=await open(track.blob);
  const animation=src.json.animations?.find(a=>a.name===track.clip)||(src.json.animations?.length===1?src.json.animations[0]:null);
  if(!animation)throw Error('Cannot find the motion track '+track.clip+'.');
  const rig=inspect(target,target.json.extras?.voidHumanoidMapping||{}),source=map(src,src.json.extras?.voidHumanoidMapping||{});
  if(!rig.ready||!source.ready)throw Error('Review the rig mapping for '+track.clip+' before publishing.');
  const frames=bake(src,source,animation,target,rig);
  let name=track.name||track.clip;const original=name;let i=2;
  while(target.json.animations?.some(a=>a.name===name))name=original+' '+i++;
  const input=target.decoded?new Blob([GLB.write(target.json,target.binary)]):blob;
  blob=await GLB.animate(input,frames,name);
 }
 if(blob&&blob.size>15*1024*1024)throw Error('The model with its motions exceeds 15 MiB. Optimize it before publishing.');
 return blob;
}
async function json(file){
 const response=await fetch('void-runner/'+file+'?v='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw Error('The deployed NPC registry is unavailable ('+response.status+').');
 return response.json();
}
export async function deployedModel(rec,progress){
 const blob=await prepareModel(rec);
 let hash=rec.library?.sha256;
 if(blob)hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
 const find=async()=>{
  const index=await json('npc-publish-models.json');
  for(const asset of index[hash]||[]){
   if(asset.startsWith('npc-upload-')&&!globalThis.VoidMadeNPCs.modelOf(asset)){
    const caps=await json('npc-publish-capabilities.json');globalThis.VoidCrowd.registerPublishedModel(asset,caps.clips[asset]);
   }
   if(globalThis.VoidMadeNPCs.modelOf(asset))return asset;
  }
 };
 const known=await find();if(known)return known;
 if(!blob)throw Error('The source model is missing. Reimport it to register the asset.');
 const code=prompt('Start node tools/npc-publisher.cjs on your PC and enter its pairing code to register this new model privately.');
 if(!code)throw Error('Model registration cancelled.');
 progress('Registering the model in the private asset repository…');
 let response;
 try{response=await fetch('http://127.0.0.1:47831/models',{method:'POST',headers:{Authorization:'Bearer '+code.trim(),'Content-Type':'application/octet-stream','X-Triangle-Exception':String(rec.allowOverTriangleLimit===true)},body:blob});}
 catch{throw Error('The PC publisher could not be reached. Start it and allow the browser to connect to the local network.');}
 const result=await response.json();if(!response.ok||result.hash!==hash)throw Error(result.error||'Publisher returned a different model.');
 progress('Model registered. Waiting for the game asset deployment before placing the NPC…');
 for(let i=0;i<90;i++){
  await new Promise(done=>setTimeout(done,10000));
  const asset=await find();if(asset)return asset;
 }
 throw Error('The model is registered, but its deployment has not finished. Retry Publish after the site build completes.');
}
