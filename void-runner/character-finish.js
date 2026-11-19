/* How people are lit: the finish every ordinary character model gets (players, other players, residents). BROWSER ONLY.
   David, 2026-11-13: the District is dark with coloured light as the accent, and in it the player characters read as near-black silhouettes. The interior is already
   at the scene's limit of real lamps, so the light is added in the character's own surface: a soft edge light that slides round the figure as the camera moves,
   cyan on one side and magenta on the other like the hallway's two sides, and a little lift so a dark outfit keeps its shape. Nothing about the models changes.
   Applied once per model file, by the model loader the moment the file is read (asset-pipeline.js loadContainer): a material must have its plugins before it is
   first prepared. The materials belong to the file and are shared by every copy. VR companions are left alone: they
   have their own finish (vr-companions.js). Mission characters are not model files and are not touched. */
(function(root){
 'use strict';
 const config={strength:1,power:2.2,lift:.09,cyan:[.25,.9,1],magenta:[1,.25,.75]};
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
 const done=new WeakSet();
 // Gives one freshly loaded model file's materials the finish, before anything is drawn with them. Returns how many materials it changed.
 function applyContainer(id,c){
  const B=root.BABYLON;if(!B?.MaterialPluginBase||!c||done.has(c)||!wants(id))return 0;done.add(c);let n=0;
  for(const mat of new Set([...(c.materials||[]),...(c.meshes||[]).map(m=>m.material)].filter(Boolean))){if(!(mat instanceof B.PBRMaterial)||notSurface.test(mat.name)||mat.pluginManager?.getPlugin?.('CharacterRim')||mat.pluginManager?.getPlugin?.('CompanionRim'))continue;
   try{new (plugin(B))(mat);n++;}catch(error){console.warn('[VOID//RUNNER character finish]',id,error);}}
  return n;
 }
 const apply=id=>applyContainer(id,root.VoidAssets?.container?.(id));
 const wants=id=>typeof id==='string'&&id.startsWith('crowd:')&&!skip(id);
 const api={config,apply,applyContainer,wants,notSurface};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidCharacterFinish=api;
})(typeof globalThis!=='undefined'?globalThis:this);
