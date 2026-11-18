/* Variants of the Meshy street people (NPC upgrade, 18 Nov 2026: docs/development/NPC_UPGRADE.md): each figure is one skinned mesh with one material, so no two people
   on a street look the same only by colour: a variant re-colours the CLOTHES in the shader (a hue turn, saturation, brightness and a tint) and leaves the skin alone.
   The skin is found per pixel from its colour (warm hue, moderate saturation, not too dark), so faces, hands and arms keep their own tone; hair and clothing change.
   Cost: one material per figure and variant (sharing the figure's textures), no new texture memory, a few shader instructions. Draw calls are unchanged.
   PURE part (variant tables, the deterministic pick) runs in Node (tests/npc-upgrade.test.cjs); apply() is browser only. */
(function(root){
 'use strict';
 // A variant: h (a hue TURN, in turns, added to each pixel's own hue: it is relative, so 'red' on a blue jacket is a different turn from 'red' on an orange one), s (saturation x), v (brightness x), t (an RGB tint x). The first of every list is the figure as made.
 const T={
  orig:{id:'orig'},
  navy:{id:'navy',t:[.62,.82,1.45]},warm:{id:'warm',t:[1.4,1,.62],v:1.05},olive:{id:'olive',t:[1,1.16,.62],s:.9},wine:{id:'wine',t:[1.5,.7,.8]},slate:{id:'slate',s:.35,v:1.25,t:[.92,1,1.1]},
  faded:{id:'faded',s:.45,v:1.2},dusk:{id:'dusk',v:.7,t:[.92,.9,1.15]},
  teal:{id:'teal',h:.45},amber:{id:'amber',h:.1,s:1.05},red:{id:'red',h:.92},blue:{id:'blue',h:.6},green:{id:'green',h:.3,s:.85},violet:{id:'violet',h:.75}};
 const L=(...ids)=>ids.map(i=>typeof i==='object'?i:T[i]);
 // Per figure: mostly dark clothes take tints (a hue turn shows little on black); the few colourful outfits turn their hue.
 const VARIANTS={
  'npc-office-f':L('orig','navy','warm','slate'),'npc-office-m':L('orig','slate','warm','olive'),'npc-security':L('orig','olive','navy'),'npc-executive':L('orig','wine','navy'),
  'npc-cook-old':L('orig','faded','warm'),'npc-courier':L('orig',{id:'teal',h:.45},{id:'yellow',h:.09},{id:'blue',h:.55}),'npc-cook-f':L('orig','wine','olive','navy'),'npc-club-f':L('orig','navy','wine','warm'),
  'npc-club-m':L('orig','wine','navy','warm'),'npc-hacker':L('orig','olive','navy','wine'),'npc-merc':L('orig','slate','warm','dusk'),'npc-veteran':L('orig','faded','dusk','warm'),
  'npc-fixer':L('orig','wine','navy','olive'),'npc-vendor':L('orig',{id:'teal',h:.25},{id:'amber',h:-.4}),'npc-student':L('orig','wine','olive','slate'),'npc-tourist':L('orig',{id:'red',h:.45},{id:'green',h:-.22},{id:'amber',h:.55}),
  'npc-medic':L('orig',{id:'blue',h:.1},{id:'wine',h:.45},{id:'violet',h:.25}),'npc-enforcer':L('orig','warm','wine','navy'),'npc-lookout':L('orig','olive','navy','wine'),'npc-outskirts-f':L('orig','faded','olive','dusk'),
  'npc-outskirts-m':L('orig','faded','warm','dusk'),'npc-elder-f':L('orig','navy','wine','olive'),'npc-busker':L('orig','olive','wine','navy'),
  'npc-casual-f':L('orig','navy','wine','olive'),'npc-casual-m':L('orig','olive','navy','warm')};
 // The Outskirts' people read as poorer: a worn variant for any figure (ncz-outskirts-life.js).
 const WORN={id:'worn',s:.5,v:.9,t:[1.04,1,.9]};
 const variantsOf=look=>VARIANTS[look]||null;
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 /* Which variant a person wears: from a stable key (their id), so it never changes while they are about; null for figures without variants. */
 function pick(look,key){const v=VARIANTS[look];return v?v[hash(look+'|'+key)%v.length].id:null;}
 const find=(look,id)=>id&&typeof id==='object'?id:id==='worn'?WORN:id==='orig'?T.orig:(VARIANTS[look]||[]).find(v=>v.id===id)||null;
 /* A clothing colour of the character creator (catalog clothingColors {id, hex}) as a variant: the clothes take that colour, keeping their own light and dark (skin untouched).
    Dark colours stay dark (the brightness follows the colour's own), as the creator's tint of the older figures did. */
 function colour(c){const lin=x=>Math.pow(parseInt(x,16)/255,2.2),h=String(c?.hex||'#808080'),rgb=[lin(h.slice(1,3)),lin(h.slice(3,5)),lin(h.slice(5,7))],l=Math.max(1e-3,.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]);
  return {id:'cc-'+(c?.id||'x'),s:0,v:Math.max(.35,Math.min(1.25,.45+.8*Math.sqrt(l/.2))),t:rgb.map(x=>Math.min(4,x/l))};}
 /* The two shader vectors of a variant: [cos, sin, saturation, brightness] and [tint r, g, b, strength]. */
 function uniforms(v){const a=(v?.h||0)*Math.PI*2,t=v?.t||[1,1,1];return [[Math.cos(a),Math.sin(a),v?.s??1,v?.v??1],[t[0],t[1],t[2],v&&v.id!=='orig'?1:0]];}

 // ---- browser ----
 let Plugin=null;
 const GLSL='#ifdef NPC_TINT\n{vec3 c0=surfaceAlbedo.rgb;vec3 g=pow(max(c0,vec3(0.0)),vec3(0.4545));float mx=max(g.r,max(g.g,g.b)),mn=min(g.r,min(g.g,g.b)),d=mx-mn,sat=d/max(mx,1e-4),h=0.0;'
  +'if(d>1e-4){if(mx==g.r)h=mod((g.g-g.b)/d,6.0);else if(mx==g.g)h=(g.b-g.r)/d+2.0;else h=(g.r-g.g)/d+4.0;h/=6.0;}float hh=h>0.5?h-1.0:h;'
  +'float skin=smoothstep(-0.07,-0.02,hh)*(1.0-smoothstep(0.09,0.14,hh))*smoothstep(0.04,0.13,sat)*(1.0-smoothstep(0.5,0.66,sat))*smoothstep(0.14,0.28,mx);'
  +'vec3 k=vec3(0.57735);vec3 c=c0*vNpcTintA.x+cross(k,c0)*vNpcTintA.y+k*dot(k,c0)*(1.0-vNpcTintA.x);float l=dot(c,vec3(0.2126,0.7152,0.0722));c=mix(vec3(l),c,vNpcTintA.z)*vNpcTintA.w*vNpcTintB.rgb;'
  +'surfaceAlbedo.rgb=mix(c0,max(c,vec3(0.0)),(1.0-skin)*vNpcTintB.a);}\n#endif\n';
 const WGSL='#ifdef NPC_TINT\n{let c0=surfaceAlbedo.rgb;let g=pow(max(c0,vec3f(0.0)),vec3f(0.4545));let mx=max(g.r,max(g.g,g.b));let mn=min(g.r,min(g.g,g.b));let d=mx-mn;let sat=d/max(mx,1e-4);var h=0.0;'
  +'if(d>1e-4){if(mx==g.r){h=(g.g-g.b)/d;if(h<0.0){h+=6.0;}}else if(mx==g.g){h=(g.b-g.r)/d+2.0;}else{h=(g.r-g.g)/d+4.0;}h/=6.0;}var hh=h;if(h>0.5){hh=h-1.0;}'
  +'let skin=smoothstep(-0.07,-0.02,hh)*(1.0-smoothstep(0.09,0.14,hh))*smoothstep(0.04,0.13,sat)*(1.0-smoothstep(0.5,0.66,sat))*smoothstep(0.14,0.28,mx);'
  +'let k=vec3f(0.57735);var c=c0*uniforms.vNpcTintA.x+cross(k,c0)*uniforms.vNpcTintA.y+k*dot(k,c0)*(1.0-uniforms.vNpcTintA.x);let l=dot(c,vec3f(0.2126,0.7152,0.0722));c=mix(vec3f(l),c,uniforms.vNpcTintA.z)*uniforms.vNpcTintA.w*uniforms.vNpcTintB.rgb;'
  +'surfaceAlbedo=vec3f(mix(c0,max(c,vec3f(0.0)),(1.0-skin)*uniforms.vNpcTintB.a));}\n#endif\n';
 function plugin(B){return Plugin??=class NpcTintPlugin extends B.MaterialPluginBase{
  constructor(material,v){super(material,'NpcTint',220,{NPC_TINT:false});this.u=uniforms(v);this._isEnabled=true;this._enable(true);}   /* _isEnabled is the plugin's own flag (the base class does not set it) */
  getClassName(){return 'NpcTintPlugin';}
  isCompatible(){return true;}
  prepareDefines(defines){defines.NPC_TINT=this._isEnabled;}
  getUniforms(){return {ubo:[{name:'vNpcTintA',size:4,type:'vec4'},{name:'vNpcTintB',size:4,type:'vec4'}],fragment:'#ifdef NPC_TINT\nuniform vec4 vNpcTintA;\nuniform vec4 vNpcTintB;\n#endif\n'};}
  bindForSubMesh(ubo){if(!this._isEnabled)return;const [a,b]=this.u;ubo.updateFloat4('vNpcTintA',a[0],a[1],a[2],a[3]);ubo.updateFloat4('vNpcTintB',b[0],b[1],b[2],b[3]);}
  getCustomCode(type,language){if(type!=='fragment')return null;return {CUSTOM_FRAGMENT_UPDATE_ALPHA:language===B.ShaderLanguage?.WGSL?WGSL:GLSL};   /* right after the albedo is read, in the main PBR shader (the albedo block's own point is inside an include, where plugins cannot reach) */}};}
 const TEX=['albedoTexture','bumpTexture','metallicTexture','ambientTexture','emissiveTexture','reflectivityTexture','microSurfaceTexture','opacityTexture'];
 const cache=new WeakMap();let made=0;
 // One material per source material and variant, made once and shared by everyone wearing it; disposed with its source.
 function variantMaterial(mat,v){
  const B=root.BABYLON;let byId=cache.get(mat);if(!byId){byId=new Map();cache.set(mat,byId);mat.onDisposeObservable?.addOnce(()=>{for(const m of byId.values())m.dispose(false,false);byId.clear();});}
  if(byId.has(v.id))return byId.get(v.id);
  const c=mat.clone(mat.name+'~'+v.id);if(!c)return mat;
  for(const k of TEX)if(mat[k]&&c[k]&&c[k]!==mat[k]){const t=c[k];c[k]=mat[k];try{t.dispose();}catch{}}   // share the figure's own textures (a clone would only add objects)
  if(!c.pluginManager?.getPlugin?.('CharacterRim')&&mat.pluginManager?.getPlugin?.('CharacterRim'))try{root.VoidCharacterFinish?.applyContainer?.('crowd:variant'+(made++),{materials:[c],meshes:[]});}catch{}
  try{new (plugin(B))(c,v);}catch(error){console.warn('[VOID//RUNNER npc variants]',error);c.dispose();return mat;}
  byId.set(v.id,c);return c;
 }
 /* Dresses one placed figure in a variant (an id from pick(), 'worn', or null for as made). Returns the variant id used. */
 function apply(node,look,id){
  const B=root.BABYLON,v=id&&find(look,id);if(!node||!B?.MaterialPluginBase||!v)return v?.id||null;
  for(const m of node.getChildMeshes(false)){const mat=m.material;if(!mat||!(mat instanceof B.PBRMaterial))continue;const base=mat.metadata?.npcVariantOf||mat;
   if(v.id==='orig'){m.material=base;continue;}const c=variantMaterial(base,v);c.metadata={...(c.metadata||{}),npcVariantOf:base};m.material=c;}
  node.metadata={...(node.metadata||{}),variant:v.id};return v.id;
 }
 const api={VARIANTS,WORN,variantsOf,pick,find,colour,uniforms,apply,GLSL,WGSL};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidNPCVariants=api;
})(typeof globalThis!=='undefined'?globalThis:this);
