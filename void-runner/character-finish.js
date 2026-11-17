/* How people are lit: the finish every ordinary character model gets (players, other players, residents). BROWSER ONLY.
   The owner, 2026-11-13: the District is dark with coloured light as the accent, and in it the player characters read as near-black silhouettes. The interior is already
   at the scene's limit of real lamps, so the light is added in the character's own surface: a soft edge light that slides round the figure as the camera moves,
   cyan on one side and magenta on the other like the hallway's two sides, and a little lift so a dark outfit keeps its shape. Nothing about the models changes.
   Applied once per model file, by the model loader the moment the file is read (asset-pipeline.js loadContainer): a material must have its plugins before it is
   first prepared. The materials belong to the file and are shared by every copy. VR companions are left alone: they
   have their own finish (vr-companions.js). Mission characters are not model files and are not touched. */
(function(root){
 'use strict';
 const config={quality:true,strength:1,power:2.2,lift:.09,cyan:[.25,.9,1],magenta:[1,.25,.75]};
 // Eyes, lashes, teeth and the like are not given an edge light: it makes them glow.
 const notSurface=/eye|cornea|pupil|iris|teeth|tooth|tongue|lash|brow|glass|nail|lacrimal/i,skip=id=>/^crowd:vr-companion/.test(id);
 let Plugin=null;
 function plugin(B){return Plugin??=class CharacterRimPlugin extends B.MaterialPluginBase{
  constructor(material){super(material,'CharacterRim',212,{CHARACTER_RIM:false});this._enable(true);}
  getClassName(){return 'CharacterRimPlugin';}
  isCompatible(){return true;}
  prepareDefines(defines){defines.CHARACTER_RIM=this._isEnabled;}
  getUniforms(){return {ubo:[{name:'vCharacterRimA',size:4,type:'vec4'},{name:'vCharacterRimB',size:4,type:'vec4'}],fragment:'#ifdef CHARACTER_RIM\nuniform vec4 vCharacterRimA;\nuniform vec4 vCharacterRimB;\n#endif\n'};}
  bindForSubMesh(ubo){if(!this._isEnabled)return;const s=config.strength,a=config.cyan,b=config.magenta;ubo.updateFloat4('vCharacterRimA',a[0]*s,a[1]*s,a[2]*s,config.power);ubo.updateFloat4('vCharacterRimB',b[0]*s,b[1]*s,b[2]*s,config.lift);}
  getCustomCode(type,language){if(type!=='fragment')return null;
   return language===B.ShaderLanguage?.WGSL
    ?{CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION:'#ifdef CHARACTER_RIM\n{let rimF=pow(1.0-saturate(dot(normalW,viewDirectionW)),uniforms.vCharacterRimA.a);let rimC=mix(uniforms.vCharacterRimA.rgb,uniforms.vCharacterRimB.rgb,saturate(normalW.x*0.5+0.5));finalEmissive+=rimC*rimF*(vec3f(0.7)+0.3*surfaceAlbedo.rgb)+surfaceAlbedo.rgb*uniforms.vCharacterRimB.a;}\n#endif\n'}
    :{CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION:'#ifdef CHARACTER_RIM\n{float rimF=pow(1.0-clamp(dot(normalW,viewDirectionW),0.0,1.0),vCharacterRimA.a);vec3 rimC=mix(vCharacterRimA.rgb,vCharacterRimB.rgb,clamp(normalW.x*0.5+0.5,0.0,1.0));finalEmissive+=rimC*rimF*(vec3(0.7)+0.3*surfaceAlbedo.rgb)+surfaceAlbedo.rgb*vCharacterRimB.a;}\n#endif\n'};}};}
 /* ---- Surface quality (the owner, 15 Nov 2026: "upgrade all NPCs and player character models"; references: wet, layered, black street clothing under neon) ----
    The models themselves are unchanged (MakeHuman figures, 512-pixel textures, no normal maps). What changes is how each surface answers light, by what it is:
      clothing  a fine woven grain (a small tiling detail map made here, no file) and a thin wet coat, so black cloth shows folds and catches the coloured lights
      footwear  polished, with a stronger coat
      skin      a little smoother with a soft sheen at grazing angles, so faces stop reading as flat paint
      hair      a tighter highlight
      masks, visors, shades   dark glass or coated shell; a mask's slits are lit in one colour per person (the "one small light" every figure in the references has)
    Kinds are read from the material's name (the MakeHuman part it came from). Anything unrecognised is left exactly as it was. */
 const surface=name=>{const n=String(name||'').toLowerCase();
  if(/slit/.test(n))return 'light';
  if(/(^|[._])(mask|shades|visor|goggles|headset|collar)\d*$/.test(n)||/shades\d|visor\d|mask\d/.test(n))return 'shell';
  if(notSurface.test(n)||/low-poly/.test(n))return null;
  if(/\.body$|(^|[._])body$|skin/.test(n))return 'skin';
  if(/shoe|boot/.test(n))return 'footwear';
  if(/short\d|long\d|bob\d|braid\d|ponytail\d|afro\d|hair/.test(n))return 'hair';
  if(/suit|armor|armour|jacket|coat|shirt|pants|dress|fedora|hat|cap|hood|glove|skirt|vest|casual|sport|elegant|work/.test(n))return 'clothing';
  return null;};
 const quality={clothing:{rough:.52,coat:.34,coatRough:.28,grain:.55},footwear:{rough:.3,coat:.7,coatRough:.14,grain:.2},skin:{rough:.46,sheen:.22},hair:{rough:.42},shell:{rough:.16,coat:.8,coatRough:.08},light:{glow:1.5}};
 const ACCENTS=[[.25,.9,1],[1,.25,.75],[1,.2,.16],[.55,1,.3],[1,.62,.12],[.62,.4,1]];   // one accent per person, chosen from the file's own name so it never changes
 const accentOf=id=>{let h=7;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return ACCENTS[h%ACCENTS.length];};
 // The woven grain: a small tiling picture in the layout Babylon's detail map expects (red = light/dark of the weave, green and alpha = the weave's slope, blue = roughness).
 const grains=new WeakMap();
 function grain(scene){
  let t=grains.get(scene);if(t&&!t._isDisposed)return t;const B=root.BABYLON,N=128,data=new Uint8Array(N*N*4),h=new Float32Array(N*N);
  let q=12345;const r=()=>(q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N*Math.PI*2,v=y/N*Math.PI*2;h[y*N+x]=.5+.22*Math.sin(u*16)*Math.cos(v*16)+.14*Math.sin(u*32+v*16)+.1*(r()-.5);}   // a twill weave with a little fibre noise; whole waves so it tiles
  const at=(x,y)=>h[((y+N)%N)*N+((x+N)%N)];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4,dx=(at(x+1,y)-at(x-1,y))*2.2,dy=(at(x,y+1)-at(x,y-1))*2.2;
   data[i]=Math.max(0,Math.min(255,Math.round(128+(h[y*N+x]-.5)*110)));data[i+1]=Math.max(0,Math.min(255,Math.round(128+dy*127)));data[i+2]=Math.max(0,Math.min(255,Math.round(128+(h[y*N+x]-.5)*90)));data[i+3]=Math.max(0,Math.min(255,Math.round(128+dx*127)));}
  t=B.RawTexture.CreateRGBATexture(data,N,N,scene,true,false,B.Texture.TRILINEAR_SAMPLINGMODE);t.name='character-grain';t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.uScale=t.vScale=20;t.anisotropicFilteringLevel=4;grains.set(scene,t);return t;
 }
 /* Gives one material the quality for what it is. Returns the kind, or null when it was left alone. Safe to call once per material (the loader does). */
 function refine(mat,id){
  const B=root.BABYLON,kind=surface(mat.name),q=kind&&quality[kind];if(!q||!config.quality)return null;
  try{
   if(kind==='light'){const c=accentOf(id);mat.albedoColor=new B.Color3(.02,.02,.02);mat.emissiveColor=new B.Color3(c[0],c[1],c[2]);mat.emissiveIntensity=q.glow;mat.roughness=.4;return kind;}
   if(q.rough!=null){mat.roughness=q.rough;if(kind!=='shell')mat.metallic=Math.min(mat.metallic??0,.1);}
   if(q.coat){mat.clearCoat.isEnabled=true;mat.clearCoat.intensity=q.coat;mat.clearCoat.roughness=q.coatRough;}
   if(q.sheen){mat.sheen.isEnabled=true;mat.sheen.intensity=q.sheen;mat.sheen.roughness=.5;mat.sheen.color=new B.Color3(1,.86,.8);}
   if(q.grain&&mat.detailMap&&!low()){const g=grain(mat.getScene());mat.detailMap.texture=g;mat.detailMap.isEnabled=true;mat.detailMap.diffuseBlendLevel=.35*q.grain;mat.detailMap.bumpLevel=q.grain;mat.detailMap.roughnessBlendLevel=.3*q.grain;}
   if(kind==='shell'){mat.albedoColor=new B.Color3(.03,.035,.045);mat.metallic=.6;const c=accentOf(id);mat.emissiveColor=new B.Color3(c[0]*.05,c[1]*.05,c[2]*.05);}
  }catch(error){console.warn('[VOID//RUNNER character quality]',id,mat.name,error);return null;}
  return kind;
 }
 const low=()=>root.VoidGraphics?.quality==='low';
 const done=new WeakSet();
 // Gives one freshly loaded model file's materials the finish, before anything is drawn with them. Returns how many materials it changed.
 function applyContainer(id,c){
  const B=root.BABYLON;if(!B?.MaterialPluginBase||!c||done.has(c)||!wants(id))return 0;done.add(c);let n=0;
  for(const mat of new Set([...(c.materials||[]),...(c.meshes||[]).map(m=>m.material)].filter(Boolean))){if(!(mat instanceof B.PBRMaterial))continue;
   refine(mat,id);
   if(notSurface.test(mat.name)||mat.pluginManager?.getPlugin?.('CharacterRim')||mat.pluginManager?.getPlugin?.('CompanionRim'))continue;
   try{new (plugin(B))(mat);n++;}catch(error){console.warn('[VOID//RUNNER character finish]',id,error);}}
  return n;
 }
 const apply=id=>applyContainer(id,root.VoidAssets?.container?.(id));
 const wants=id=>typeof id==='string'&&id.startsWith('crowd:')&&!skip(id);
 const api={config,apply,applyContainer,wants,notSurface,surface,quality,accentOf,refine};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidCharacterFinish=api;
})(typeof globalThis!=='undefined'?globalThis:this);
