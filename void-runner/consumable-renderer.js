// A scene owns its GPU resources. Both the editor's isolated scene and the game attach this same pass.
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function envelope(e,elapsed){
  const t=elapsed-e.delay;
  if(t<0||t>=e.duration)return 0;
  return clamp(e.intensity*Math.min(1,e.fadeIn?t/e.fadeIn:1,e.fadeOut?(e.duration-t)/e.fadeOut:1),0,1);
 }
 function sample(active,now){
  const effects=new Map(),modifiers={};
  for(const a of active){
   if(a.until!=null&&now>=a.until)continue;
   const t=now-a.startedAt,gain=a.gain||1,extension=a.extension||0;
   for(const m of a.definition.modifiers||[]){
    const weight=envelope({...m,duration:m.duration+extension,intensity:1},t);
    if(weight)modifiers[m.stat]=(modifiers[m.stat]||0)+m.amount*weight*gain;
   }
   for(const e of a.definition.effects||[]){
    const k=Math.min(1,envelope({...e,duration:e.duration+extension},t)*gain);if(k<=0)continue;
    const values=effects.get(e.type)||[],instance={weight:k,params:e.params,time:(t-e.delay)*e.speed};
    if(e.stacking==='replace')effects.set(e.type,[instance]);
    else if(e.stacking==='max'){if(!values.length||k>=values[0].weight)effects.set(e.type,[instance]);}
    else{values.push(instance);effects.set(e.type,values);}
   }
  }
  return {effects,modifiers};
 }
 const shader=`precision highp float;
 varying vec2 vUV; uniform sampler2D textureSampler,historySampler;uniform float trail;
 uniform vec4 grade,hue,tunnel,wave,split,ghost,fold,warp,screen; uniform vec2 eye,motion; uniform float clock;
 vec3 hueRotate(vec3 c,float a){vec3 k=vec3(.57735);return c*cos(a)+cross(k,c)*sin(a)+k*dot(k,c)*(1.-cos(a));}
 float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
 vec2 uv=vUV+motion;vec2 center=uv-eye;float r=length(center);
 if(fold.w>0.){float sector=6.28318/max(2.,fold.x);float a=abs(mod(atan(center.y,center.x)+fold.y,sector)-sector*.5);uv=mix(uv,eye+vec2(cos(a),sin(a))*r*fold.z,fold.w);}
 uv+=wave.x*vec2(sin(uv.y*wave.y+wave.z),cos(uv.x*wave.y+wave.z)*wave.w);
 uv+=warp.x*vec2(sin(uv.y*warp.y+clock)*cos(uv.x*warp.z),cos(uv.x*warp.y+clock));
 uv=clamp(uv,vec2(.001),vec2(.999));vec4 pixel=texture2D(textureSampler,uv);vec3 col=pixel.rgb;
 if(split.x>0.){vec2 d=mix(vec2(1.,0.),center,split.y)*split.x;col.r=texture2D(textureSampler,clamp(uv+d,0.,1.)).r;col.b=texture2D(textureSampler,clamp(uv-d,0.,1.)).b;}
 if(ghost.z>0.)col=mix(col,texture2D(textureSampler,clamp(uv+ghost.xy,0.,1.)).rgb,ghost.z);
 if(screen.x>0.){vec2 d=vec2(screen.x);col=(col*4.+texture2D(textureSampler,uv+d).rgb+texture2D(textureSampler,uv-d).rgb+texture2D(textureSampler,uv+vec2(-d.x,d.y)).rgb+texture2D(textureSampler,uv+vec2(d.x,-d.y)).rgb)/8.;}
 col=hueRotate(col,hue.x);col=mix(col,col.brg,grade.w);col=mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,grade.x);
 col=(col-.5)*grade.y+.5;col*=exp2(grade.z);col=mix(col,1.-col,hue.y);col=mix(col,max(col,vec3(0.))*hueRotate(vec3(1.5,.6,.8),hue.z),hue.w);
 col+=screen.y*max(col-.65,0.);col+=(noise(vUV*500.+fract(clock))-.5)*screen.z;
 col*=1.-tunnel.z*smoothstep(tunnel.x,tunnel.x+max(.001,tunnel.y),distance(vUV,eye)*1.42);
 if(trail>0.)col=mix(col,texture2D(historySampler,vUV).rgb,trail);gl_FragColor=vec4(clamp(col,0.,1.),pixel.a);}`;
 function uniforms(frame,limits){
  const u={grade:[1,1,0,0],hue:[0,0,0,0],tunnel:[1,.1,0,0],wave:[0,1,0,0],split:[0,0,0,0],ghost:[0,0,0,0],fold:[2,0,1,0],warp:[0,0,0,0],screen:[0,0,0,0],eye:[.5,.5],motion:[0,0],fov:0,trail:0};
  const motion=limits.motion?1:0,dist=limits.distortion?1:0,flash=limits.flashing?1:0;
  for(const [type,entries] of frame.effects)for(const {weight:w,params:p,time:t} of entries){
   const rad=Math.PI/180,osc=Math.sin(t*2);
   switch(type){
    case 'colorShift':u.grade[0]+=(p.saturation-1)*w;u.grade[1]+=(p.contrast-1)*w;u.grade[2]+=p.exposure*w;u.grade[3]+=p.channelSplit*w;
     u.hue[0]+=(p.hue+p.hueSpeed*t*flash)*rad*w;u.hue[1]+=p.invert*w;u.hue[2]=p.tintHue*rad;u.hue[3]+=p.tintAmount*w;break;
    case 'chromaticAberration':u.split=[p.separation*w*dist*(1+osc*p.pulse*.3*flash),p.radial,0,0];u.eye=[p.centerX,p.centerY];break;
    case 'wavyVision':u.wave=[p.amplitude*w*dist,p.frequency,t*motion,p.direction];break;
    case 'fractalWarp':u.warp=[p.distortion*.045*w*dist,p.scale*3,p.complexity*2,0];break;
    case 'doubleVision':u.ghost=[p.offsetX*(1+osc*p.oscillation*motion),p.offsetY,p.opacity*w*dist,0];break;
    case 'kaleidoscope':u.fold=[p.segments,p.rotation*t*rad*motion,p.scale,p.blend*w*dist];u.eye=[p.centerX,p.centerY];break;
    case 'tunnelVision':u.eye=[p.centerX,p.centerY];u.tunnel=[p.radius,p.softness,p.darkness*w*(1+osc*p.pulse*.15*flash),0];break;
    case 'motionTrails':u.trail=clamp(p.length*p.opacity*w*Math.exp(-p.decay/60)*motion,0,.92);break;
    case 'cameraMotion':u.motion=[w*motion*(Math.sin(t*p.swayRate*6.28)*p.sway*.005+Math.sin(t*19)*p.shake*.0015),w*motion*(Math.cos(t)*p.bob*.05+Math.sin(t*.3)*p.drift*.002)];u.fov=(p.fov+osc*p.zoomPulse)*rad*w*motion;break;
    case 'lensGrade':u.screen=[p.blur*.004*w,p.glow*w,p.grain*.12*w*flash,0];u.grade[2]+=p.brightness*w;break;
   }
  }
  u.grade[0]=clamp(u.grade[0],0,3);u.grade[1]=clamp(u.grade[1],.5,2);u.grade[2]=clamp(u.grade[2],-1,1);u.grade[3]=clamp(u.grade[3],0,1);
  u.hue[1]=clamp(u.hue[1],0,1);u.hue[3]=clamp(u.hue[3],0,1);u.tunnel[2]=clamp(u.tunnel[2],0,1);
  return u;
 }
 function attach(scene,getFrame){
  const B=root.BABYLON;B.Effect.ShadersStore.vrConsumableFragmentShader=shader;
  let pass=null,owner=null,frame=null,clock=0,offset=0,baseFov=0,history=null,output=null,copier=null,valid=false;
  const four=['grade','hue','tunnel','wave','split','ghost','fold','warp','screen'],two=['eye','motion'];
  let particles=null;
  function dust(camera,input){
   const entry=input?.frame.effects.get('particles')?.at(-1);
   if(!entry||!input.limits.motion){if(particles){particles.dispose(true);particles=null;}return;}
   if(!particles){
    const tex=new B.DynamicTexture('Consumable mote',32,scene,false),ctx=tex.getContext(),g=ctx.createRadialGradient(16,16,0,16,16,15);g.addColorStop(0,'white');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);tex.hasAlpha=true;tex.update();
    particles=new B.ParticleSystem('Consumable particles',root.VoidBabylon?.quality==='low'?40:150,scene);
    particles.particleTexture=tex;particles.minEmitBox=new B.Vector3(-1,-.7,-1);particles.maxEmitBox=new B.Vector3(1,.7,1);
    particles.minLifeTime=.4;particles.maxLifeTime=1.5;particles.start();
   }
   const p=entry.params,c=B.Color3.FromHSV(p.hue,.55,.9);particles.color1=new B.Color4(c.r,c.g,c.b,.6);particles.color2=particles.color1;particles.colorDead=new B.Color4(c.r,c.g,c.b,0);
   particles.emitter=camera.globalPosition.add(camera.getForwardRay().direction.scale(1.5));particles.emitRate=p.count*entry.weight;
   particles.minSize=p.size*.4;particles.maxSize=p.size;particles.direction1=new B.Vector3(-.1,p.drift*.25,-.1);particles.direction2=new B.Vector3(.1,p.drift*.5,.1);
  }
  function freeHistory(){if(output)output.dispose(owner);output=null;history?.dispose();history=null;copier?.dispose();copier=null;valid=false;}
  function detach(){freeHistory();if(pass)pass.dispose(owner);pass=null;owner=null;}
  function trailBuffer(camera){
   const engine=scene.getEngine(),w=Math.max(1,Math.floor(engine.getRenderWidth()/2)),h=Math.max(1,Math.floor(engine.getRenderHeight()/2));
   if(history&&history.width===w&&history.height===h)return;
   freeHistory();copier=new B.CopyTextureToTexture(engine);history=engine.createRenderTargetTexture({width:w,height:h},{generateMipMaps:false,generateDepthBuffer:false});
   output=new B.PassPostProcess('Consumable trail history',1,camera,B.Texture.BILINEAR_SAMPLINGMODE,engine);
   output.onAfterRender=()=>{const texture=output.inputTexture?.texture;if(texture&&copier.isReady())valid=copier.copy(texture,history);};
  }
  const before=scene.onBeforeCameraRenderObservable.add(camera=>{
   if(camera!==scene.activeCamera)return;
   const input=getFrame();dust(camera,input);if(!input||!input.frame.effects.size){detach();return;}
   if(camera!==owner){detach();owner=camera;pass=new B.PostProcess('Consumable effects','vrConsumable',[...four,...two,'clock','trail'],['historySampler'],1,camera,B.Texture.BILINEAR_SAMPLINGMODE,scene.getEngine());pass.onApply=fx=>{
    if(!frame)return;for(const k of four)fx.setFloat4(k,...frame[k]);for(const k of two)fx.setFloat2(k,...frame[k]);fx.setFloat('clock',clock);fx.setFloat('trail',valid?frame.trail:0);if(valid)fx._bindTexture('historySampler',history.texture);
   };}
   clock=input.limits.motion?input.time:0;frame=uniforms(input.frame,input.limits);if(frame.trail&&B.CopyTextureToTexture)trailBuffer(camera);else if(history)freeHistory();baseFov=camera.fov;offset=clamp(frame.fov,-.2,.2);camera.fov=clamp(baseFov+offset,.3,2.2);
  });
  const after=scene.onAfterCameraRenderObservable.add(camera=>{if(camera===owner&&offset){camera.fov=baseFov;offset=0;}});
  function dispose(){scene.onBeforeCameraRenderObservable.remove(before);scene.onAfterCameraRenderObservable.remove(after);if(particles){particles.dispose(true);particles=null;}detach();}
  scene.onDisposeObservable.addOnce(dispose);return dispose;
 }
 const api={clamp,envelope,sample,uniforms,attach};if(typeof module!=='undefined')module.exports=api;else root.VoidConsumableRenderer=api;
})(globalThis);
