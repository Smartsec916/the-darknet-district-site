/* Converts Wavefront OBJ (+ MTL colours) to a self-contained GLB for VOID//RUNNER. No dependencies.
   For packs shipped only as OBJ/FBX (for example Quaternius's 2020 packs): flat-colour materials
   (MTL Kd, opacity d) become glTF PBR materials; faces are triangulated as fans; one primitive per
   material. Texture maps are not carried over (these packs don't use them).
   Usage: node tools/assets/obj-to-glb.cjs <in.obj> <out.glb> [--scale 1] */
const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),[input,output]=args.filter(a=>!a.startsWith('--')&&!/^[\d.]+$/.test(a));
const scale=Number(args[args.indexOf('--scale')+1])||1;
if(!input||!output){console.error('Usage: node tools/assets/obj-to-glb.cjs <in.obj> <out.glb> [--scale n]');process.exit(1);}
function readMtl(file){const mats={};let cur=null;if(!fs.existsSync(file))return mats;
 for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const [k,...v]=line.trim().split(/\s+/);
  if(k==='newmtl'){cur=mats[v.join(' ')]={color:[.8,.8,.8],alpha:1,emissive:[0,0,0]};}
  else if(cur&&k==='Kd')cur.color=v.slice(0,3).map(Number);else if(cur&&k==='d')cur.alpha=Number(v[0]);else if(cur&&k==='Ke')cur.emissive=v.slice(0,3).map(Number);}
 return mats;}
const text=fs.readFileSync(input,'utf8'),dir=path.dirname(input);
const P=[],N=[],T=[],groups=new Map();let mtl={},current='default';
for(const raw of text.split(/\r?\n/)){
 const line=raw.trim();if(!line||line[0]==='#')continue;const [k,...v]=line.split(/\s+/);
 if(k==='v')P.push(v.slice(0,3).map(Number));else if(k==='vn')N.push(v.slice(0,3).map(Number));else if(k==='vt')T.push(v.slice(0,2).map(Number));
 else if(k==='mtllib')mtl={...mtl,...readMtl(path.join(dir,v.join(' ')))};else if(k==='usemtl')current=v.join(' ');
 else if(k==='f'){const idx=v.map(t=>{const [a,b,c]=t.split('/');const r=(x,n)=>x?(+x<0?n+ +x:+x-1):-1;return [r(a,P.length),r(b,T.length),r(c,N.length)];});
  if(!groups.has(current))groups.set(current,[]);const g=groups.get(current);for(let i=1;i+1<idx.length;i++)g.push(idx[0],idx[i],idx[i+1]);}
}
// Build one primitive per material; vertices are shared within a primitive by (position, normal).
const buffers=[],views=[],accessors=[],meshPrims=[],materials=[];let offset=0;
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
function pushView(arr,target){const buf=Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength),pad=(4-buf.length%4)%4;buffers.push(buf,Buffer.alloc(pad));views.push({buffer:0,byteOffset:offset,byteLength:buf.length,...(target?{target}:{})});offset+=buf.length+pad;return views.length-1;}
for(const [name,tris] of groups){
 const key=new Map(),pos=[],nor=[],ind=[];
 for(let t=0;t<tris.length;t+=3){
  let fn=null;const [a,b,c]=[tris[t],tris[t+1],tris[t+2]].map(x=>P[x[0]]);
  if(tris[t][2]<0){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],w=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],l=Math.hypot(...n)||1;fn=n.map(x=>x/l);}
  for(let j=0;j<3;j++){const [pi,,ni]=tris[t+j],k=pi+'/'+(ni>=0?ni:'f'+t);
   if(!key.has(k)){key.set(k,pos.length/3);const p=P[pi].map(x=>x*scale);pos.push(...p);for(let d=0;d<3;d++){min[d]=Math.min(min[d],p[d]);max[d]=Math.max(max[d],p[d]);}nor.push(...(ni>=0?N[ni]:fn));}
   ind.push(key.get(k));}
 }
 const P32=new Float32Array(pos),N32=new Float32Array(nor),I=pos.length/3>65535?new Uint32Array(ind):new Uint16Array(ind);
 const pmin=[0,1,2].map(d=>Math.min(...pos.filter((_,i)=>i%3===d))),pmax=[0,1,2].map(d=>Math.max(...pos.filter((_,i)=>i%3===d)));
 accessors.push({bufferView:pushView(P32,34962),componentType:5126,count:pos.length/3,type:'VEC3',min:pmin,max:pmax});const pa=accessors.length-1;
 accessors.push({bufferView:pushView(N32,34962),componentType:5126,count:nor.length/3,type:'VEC3'});const na=accessors.length-1;
 accessors.push({bufferView:pushView(I,34963),componentType:I instanceof Uint32Array?5125:5123,count:ind.length,type:'SCALAR'});const ia=accessors.length-1;
 const m=mtl[name]||{color:[.8,.8,.8],alpha:1,emissive:[0,0,0]};
 materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...m.color,m.alpha],metallicFactor:0,roughnessFactor:.7},...(m.emissive.some(x=>x>0)?{emissiveFactor:m.emissive}:{}),...(m.alpha<1?{alphaMode:'BLEND'}:{})});
 meshPrims.push({attributes:{POSITION:pa,NORMAL:na},indices:ia,material:materials.length-1});
}
const bin=Buffer.concat(buffers),name=path.basename(input,'.obj');
const json={asset:{version:'2.0',generator:'void-runner obj-to-glb'},scene:0,scenes:[{nodes:[0]}],nodes:[{name,mesh:0}],meshes:[{name,primitives:meshPrims}],materials,accessors,bufferViews:views,buffers:[{byteLength:bin.length}]};
const j=Buffer.from(JSON.stringify(json)),jp=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,0x20)]),head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+jp.length+8+bin.length,8);jh.writeUInt32LE(jp.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
fs.writeFileSync(output,Buffer.concat([head,jh,jp,bh,bin]));
console.log(name,'materials',materials.length,'size',[0,1,2].map(d=>(max[d]-min[d]).toFixed(2)).join('x'),(fs.statSync(output).size/1024|0)+'KB');
