/* Scrambles a GLB into the .vrpak format the game's asset loader reads (asset-pipeline.js unpack()), for
   licensed models whose terms ask games to keep the file from casual extraction. Not encryption.
   Usage: node tools/assets/pack-model.cjs <in.glb> <out.vrpak> */
const fs=require('fs');
function pack(glb,seed){
 const out=Buffer.alloc(glb.length+8);out.writeUInt32LE(0x4b505256,0);out.writeUInt32LE(seed>>>0,4);
 let x=(0x9e3779b9^seed)>>>0||1;
 for(let i=0;i<glb.length;i++){if((i&3)===0){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;}out[i+8]=glb[i]^(x>>>((i&3)*8))&255;}
 return out;}
module.exports={pack};
if(require.main===module){
 const [input,output]=process.argv.slice(2);
 if(!input||!output){console.error('Usage: node tools/assets/pack-model.cjs <in.glb> <out.vrpak>');process.exit(1);}
 const glb=fs.readFileSync(input);
 if(glb.readUInt32LE(0)!==0x46546c67)throw new Error('Not a GLB: '+input);
 fs.writeFileSync(output,pack(glb,(Date.now()^glb.length)>>>0));
 console.log(output,glb.length,'bytes packed');}
