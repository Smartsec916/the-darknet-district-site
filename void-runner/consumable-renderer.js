// A scene owns its GPU resources. Both the editor's isolated scene and the game attach this same pass.
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const spec=typeof module!=='undefined'&&module.exports?require('./consumable-spec.js'):root.VoidConsumableSpec;
 function curveValue(curve,t){
  if(!curve)return 1;
  const points=curve.points;
  const i=points.findIndex(p=>p[0]>t);
  if(i<=0)return points[i===0?0:points.length-1][1];
  const [x,y]=points[i-1],[right,next]=points[i];
  let u=(t-x)/(right-x);
  if(curve.mode==='step')return y;
  if(curve.mode==='smooth')u=u*u*(3-2*u);
  return y+(next-y)*u;
 }
 function envelope(e,elapsed){
  const t=elapsed-e.delay;
  if(t<0||t>=e.duration)return 0;
  return e.intensity*curveValue(e.curve,t/e.duration)*clamp(Math.min(e.fadeIn?t/e.fadeIn:1,e.fadeOut?(e.duration-t)/e.fadeOut:1),0,1);
 }
 function staminaAfter(reserve,running,regen,drain,seconds){
  return clamp(reserve+seconds*(running?-.08*(1+drain):.14*(1+regen)),0,1);
 }
 function recoveryRate(maximum,regen,damage,rest){
  return maximum*(regen-damage)+rest;
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
    const limit=spec.intensityLimits[spec.effects[e.type]?.group]??1;
    const k=Math.min(limit,envelope({...e,duration:e.duration+extension},t)*gain);if(k<=0)continue;
    const values=effects.get(e.type)||[],instance={weight:k,params:e.params,time:(t-e.delay)*e.speed};
    if(e.stacking==='replace')effects.set(e.type,[instance]);
    else if(e.stacking==='max'){if(!values.length||k>=values[0].weight)effects.set(e.type,[instance]);}
    else{values.push(instance);effects.set(e.type,values);}
   }
  }
  return {effects,modifiers};
 }
 const shader=`precision highp float;
 varying vec2 vUV; uniform sampler2D textureSampler,historySampler,history2,history3,history4;uniform float trail,trailCount;uniform vec2 trailTint,figures;
 uniform vec4 grade,hue,tunnel,wave,split,ghost,fold,warp,screen; uniform vec2 eye,motion,resolution,velocity; uniform float pixelSize,blurLength,splitView;uniform sampler2D focusSampler;uniform vec3 focus; uniform float clock;
 vec3 hueRotate(vec3 c,float a){vec3 k=vec3(.57735);return c*cos(a)+cross(k,c)*sin(a)+k*dot(k,c)*(1.-cos(a));}
 float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
 if(splitView>.5 && vUV.x<.5){gl_FragColor=texture2D(textureSampler,vUV);return;}
 vec2 uv=vUV+motion;vec2 center=uv-eye;float r=length(center);
 if(fold.w>0.){float sector=6.28318/max(2.,fold.x);float a=abs(mod(atan(center.y,center.x)+fold.y,sector)-sector*.5);uv=mix(uv,eye+vec2(cos(a),sin(a))*r*fold.z,fold.w);}
 uv+=wave.x*vec2(sin(uv.y*wave.y+wave.z),cos(uv.x*wave.y+wave.z)*wave.w);
 uv+=warp.x*vec2(sin(uv.y*warp.y+clock)*cos(uv.x*warp.z),cos(uv.x*warp.y+clock));
 if(screen.w>0.){float band=noise(vec2(floor(uv.y*32.),floor(clock*6.)));uv.x+=screen.w*step(.82,band)*(band-.82)*.18;}
 if(pixelSize>1.)uv=(floor(uv*resolution/pixelSize)+.5)*pixelSize/resolution;
 uv=clamp(uv,vec2(.001),vec2(.999));vec4 pixel=texture2D(textureSampler,uv);vec3 col=pixel.rgb;
 if(blurLength>0.){vec2 d=velocity*blurLength;col=(col*2.+texture2D(textureSampler,clamp(uv+d,0.,1.)).rgb+texture2D(textureSampler,clamp(uv-d,0.,1.)).rgb)*.25;}
 if(split.x>0.){vec2 d=mix(vec2(1.,0.),center,split.y)*split.x;col.r=texture2D(textureSampler,clamp(uv+d,0.,1.)).r;col.b=texture2D(textureSampler,clamp(uv-d,0.,1.)).b;}
 if(ghost.z>0.)col=mix(col,texture2D(textureSampler,clamp(uv+ghost.xy,0.,1.)).rgb,ghost.z);
 float radius=screen.x;
 if(focus.z>0.){float depth=abs(texture2D(focusSampler,vUV).r);radius+=focus.z*smoothstep(focus.y,focus.y*2.,abs(depth-focus.x));}
 if(radius>0.){vec2 d=vec2(radius);col=(col*4.+texture2D(textureSampler,uv+d).rgb+texture2D(textureSampler,uv-d).rgb+texture2D(textureSampler,uv+vec2(-d.x,d.y)).rgb+texture2D(textureSampler,uv+vec2(d.x,-d.y)).rgb)/8.;}
 col=hueRotate(col,hue.x);col=mix(col,col.brg,grade.w);col=mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,grade.x);
 col=(col-.5)*grade.y+.5;col*=exp2(grade.z);col=mix(col,1.-col,hue.y);col=mix(col,max(col,vec3(0.))*hueRotate(vec3(1.5,.6,.8),hue.z),hue.w);
 if(figures.x>0.){
  for(int i=0;i<2;i++){
   float side=float(i),swing=sin(figures.y+side*2.3);
   vec2 p=(vUV-vec2(mix(.13,.86,side)+.035*swing,.48+.035*cos(figures.y*.7+side)))*vec2(resolution.x/resolution.y,1.);
   float head=length((p-vec2(0.,.07))*vec2(1.15,1.))-.016;
   float body=length((p-vec2(0.,.009))*vec2(1.4,.6))-.038;
   float legs=length(vec2(abs(p.x)-.014,p.y+.066)*vec2(1.6,.43))-.019;
   col*=1.-(1.-smoothstep(-.002,.008,min(head,min(body,legs))))*figures.x;
  }
 }
 col+=screen.y*max(col-.65,0.);col+=(noise(vUV*500.+fract(clock))-.5)*screen.z;
 col*=1.-tunnel.z*smoothstep(tunnel.x,tunnel.x+max(.001,tunnel.y),distance(vUV,eye)*1.42);
 if(trail>0.){
  vec3 after=texture2D(historySampler,vUV).rgb;float sum=1.;
  if(trailCount>1.5){after+=texture2D(history2,vUV).rgb*.7;sum+=.7;}
  if(trailCount>2.5){after+=texture2D(history3,vUV).rgb*.5;sum+=.5;}
  if(trailCount>3.5){after+=texture2D(history4,vUV).rgb*.35;sum+=.35;}
  after/=sum;after=mix(after,hueRotate(after,trailTint.x),trailTint.y);col=mix(col,after,trail);
 }gl_FragColor=vec4(clamp(col,0.,1.),pixel.a);}`;
 function uniforms(frame,limits){
  const u={grade:[1,1,0,0],hue:[0,0,0,0],tunnel:[1,.1,0,0],wave:[0,1,0,0],split:[0,0,0,0],ghost:[0,0,0,0],fold:[2,0,1,0],warp:[0,0,0,0],screen:[0,0,0,0],eye:[.5,.5],motion:[0,0],fov:0,trail:0,trailCount:1,trailTint:[0,0],pixelSize:1,blurLength:0,figures:[0,0],historyInterval:0,focus:[1,1,0]};
  const motion=limits.motion?1:0,dist=limits.distortion?1:0,flash=limits.flashing?1:0;
  for(const [type,entries] of frame.effects)for(const {weight:w,params:p,time:t} of entries){
   const rad=Math.PI/180,osc=Math.sin(t*2);
   switch(type){
    case 'peripheralFigures':u.figures=[Math.min(.8,p.opacity*w),t*p.pace*motion];break;
    case 'timePerception':if(motion){u.historyInterval=p.interval;u.trailCount=Math.max(3,u.trailCount);u.trail=Math.max(u.trail,Math.min(.9,p.persistence*w));}break;
    case 'depthFocus':u.focus=[p.distance,p.width,.009*p.blur*w];break;
    case 'pixelation':u.pixelSize=Math.max(u.pixelSize,1+(p.size-1)*w);break;
    case 'motionBlur':u.blurLength=Math.max(u.blurLength,p.length*w*motion);break;
    case 'visualPulse':u.grade[2]+=Math.sin(2*Math.PI*t*p.rate)*p.brightness*Math.min(w,1.5)*flash;break;
    case 'colorShift':u.grade[0]+=(p.saturation-1)*w;u.grade[1]+=(p.contrast-1)*w;u.grade[2]+=p.exposure*w;u.grade[3]+=p.channelSplit*w;
     u.hue[0]+=(p.hue+p.hueSpeed*t*flash)*rad*w;u.hue[1]+=p.invert*w;u.hue[2]=p.tintHue*rad;u.hue[3]+=p.tintAmount*w;break;
    case 'chromaticAberration':u.split=[p.separation*w*dist*(1+osc*p.pulse*.3*flash),p.radial,0,0];u.eye=[p.centerX,p.centerY];break;
    case 'wavyVision':u.wave=[p.amplitude*w*dist,p.frequency,t*motion,p.direction];break;
    case 'fractalWarp':u.warp=[p.distortion*.045*w*dist,p.scale*3,p.complexity*2,0];break;
    case 'doubleVision':u.ghost=[p.offsetX*Math.max(1,w)*(1+osc*p.oscillation*motion),p.offsetY*Math.max(1,w),clamp(p.opacity*w*dist,0,.85),0];break;
    case 'kaleidoscope':u.fold=[p.segments,p.rotation*t*rad*motion,p.scale,clamp(p.blend*w*dist,0,1)];u.eye=[p.centerX,p.centerY];break;
    case 'tunnelVision':u.eye=[p.centerX,p.centerY];u.tunnel=[p.radius,p.softness,p.darkness*w*(1+osc*p.pulse*.15*flash),0];break;
    case 'motionTrails':u.trail=Math.max(u.trail,clamp(p.length*p.opacity*w*Math.exp(-p.decay/60)*motion,0,.92));u.trailCount=Math.max(u.trailCount,Math.round(clamp(p.afterimages??1,1,4)));u.trailTint=[p.tintHue*rad,p.tintAmount];break;
    case 'cameraMotion':u.motion=[w*motion*(Math.sin(t*p.swayRate*6.28)*p.sway*.005+Math.sin(t*19)*p.shake*.0015),w*motion*(Math.cos(t)*p.bob*.05+Math.sin(t*.3)*p.drift*.002)];u.fov=(p.fov+osc*p.zoomPulse)*rad*w*motion;break;
    case 'signalGlitch':u.screen[3]=Math.max(u.screen[3],p.amount*w*dist*motion*flash);break;
    case 'lensGrade':u.screen=[p.blur*.004*w,p.glow*w,p.grain*.12*w*flash,u.screen[3]];u.grade[2]+=p.brightness*w;break;
   }
  }
  u.grade[0]=clamp(u.grade[0],0,3);u.grade[1]=clamp(u.grade[1],.5,2);u.grade[2]=clamp(u.grade[2],-1,1);u.grade[3]=clamp(u.grade[3],0,1);
  u.hue[1]=clamp(u.hue[1],0,1);u.hue[3]=clamp(u.hue[3],0,1);u.tunnel[2]=clamp(u.tunnel[2],0,1);
  return u;
 }
 function attach(scene,getFrame){
  const B=root.BABYLON;B.Effect.ShadersStore.vrConsumableFragmentShader=shader;
  let pass=null,owner=null,frame=null,clock=0,offset=0,baseFov=0,history=null,output=null,copier=null,valid=false;
  const four=['grade','hue','tunnel','wave','split','ghost','fold','warp','screen'],two=['eye','motion','figures'];
  let depth=null;
  function clearDepth(){
   if(!depth)return;
   const i=scene.customRenderTargets.indexOf(depth.getDepthMap());
   if(i>=0)scene.customRenderTargets.splice(i,1);
   depth.dispose();depth=null;
  }
  function updateDepth(camera,strength){
   if(!strength){clearDepth();return;}
   if(depth)return;
   const caps=scene.getEngine().getCaps();
   if(!caps.textureFloatRender&&!caps.textureHalfFloatRender)return;
   const type=caps.textureFloatRender?B.Constants.TEXTURETYPE_FLOAT:B.Constants.TEXTURETYPE_HALF_FLOAT;
   depth=new B.DepthRenderer(scene,type,camera,false,B.Texture.NEAREST_SAMPLINGMODE,true);
   scene.customRenderTargets.push(depth.getDepthMap());
  }
  let historyFrames=[],written=0,nextHistory=0,lastSample=-Infinity;
  let particles=null,previousDirection=null,previousPosition=null,velocity=[0,0];
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
  function freeHistory(){if(output)output.dispose(owner);output=null;for(const target of historyFrames)target.dispose();historyFrames=[];history=null;written=0;nextHistory=0;lastSample=-Infinity;copier?.dispose();copier=null;valid=false;}
  function detach(){clearDepth();previousDirection=null;previousPosition=null;freeHistory();if(pass)pass.dispose(owner);pass=null;owner=null;}
  function trailBuffer(camera){
   const engine=scene.getEngine(),w=Math.max(1,Math.floor(engine.getRenderWidth()/2)),h=Math.max(1,Math.floor(engine.getRenderHeight()/2));
   if(history&&history.width===w&&history.height===h&&historyFrames.length===frame.trailCount)return;
   freeHistory();copier=new B.CopyTextureToTexture(engine);historyFrames=Array.from({length:frame.trailCount},()=>engine.createRenderTargetTexture({width:w,height:h},{generateMipMaps:false,generateDepthBuffer:false}));history=historyFrames[0];
   output=new B.PassPostProcess('Consumable trail history',1,camera,B.Texture.BILINEAR_SAMPLINGMODE,engine);
   output.onAfterRender=()=>{const texture=output.inputTexture?.texture;if(clock<lastSample)lastSample=-Infinity;
    if(clock-lastSample>=frame.historyInterval&&texture&&copier.isReady()&&copier.copy(texture,historyFrames[nextHistory])){
     lastSample=clock;nextHistory=(nextHistory+1)%historyFrames.length;
     written=Math.min(written+1,historyFrames.length);valid=true;
    }};
  }
  const before=scene.onBeforeCameraRenderObservable.add(camera=>{
   if(camera!==scene.activeCamera)return;
   const input=getFrame();dust(camera,input);if(!input||![...input.frame.effects.keys()].some(type=>spec.effects[type]?.group!=='audio'&&type!=='particles')){detach();return;}
   if(camera!==owner){detach();owner=camera;pass=new B.PostProcess('Consumable effects','vrConsumable',[...four,...two,'clock','trail','trailCount','trailTint','resolution','velocity','pixelSize','blurLength','splitView','focus'],['historySampler','focusSampler','history2','history3','history4'],1,camera,B.Texture.BILINEAR_SAMPLINGMODE,scene.getEngine());pass.onApply=fx=>{
    if(!frame)return;for(const k of four)fx.setFloat4(k,...frame[k]);for(const k of two)fx.setFloat2(k,...frame[k]);const engine=scene.getEngine();fx.setFloat2('resolution',engine.getRenderWidth(),engine.getRenderHeight());fx.setFloat2('velocity',...velocity);fx.setFloat3('focus',frame.focus[0],frame.focus[1],depth?frame.focus[2]:0);if(depth)fx.setTexture('focusSampler',depth.getDepthMap());fx.setFloat('splitView',frame.splitView?1:0);fx.setFloat('pixelSize',frame.pixelSize);fx.setFloat('blurLength',frame.blurLength);fx.setFloat('clock',clock);fx.setFloat('trail',valid?frame.trail:0);fx.setFloat('trailCount',written);fx.setFloat2('trailTint',...frame.trailTint);
    const names=['historySampler','history2','history3','history4'];
    for(let i=0;i<written;i++){
     const index=(nextHistory-1-i+historyFrames.length)%historyFrames.length;
     fx._bindTexture(names[i],historyFrames[index].texture);
    }
   };}
   if(input.frame.effects.has('motionBlur')){
    const dir=camera.getForwardRay().direction,pos=camera.globalPosition;
    if(previousDirection){
     const delta=dir.subtract(previousDirection).add(pos.subtract(previousPosition).scale(.15));
     const local=B.Vector3.TransformNormal(delta,camera.getViewMatrix());
     const scale=16.67/Math.max(1,scene.getEngine().getDeltaTime());
     velocity=[clamp(local.x*scale,-.04,.04),clamp(local.y*scale,-.04,.04)];
    }else velocity=[0,0];
    previousDirection=dir.clone();previousPosition=pos.clone();
   }else previousDirection=null;
   clock=input.limits.motion?input.time:0;frame=uniforms(input.frame,input.limits);frame.splitView=input.splitView;updateDepth(camera,frame.focus[2]);if(frame.trail&&B.CopyTextureToTexture)trailBuffer(camera);else if(history)freeHistory();baseFov=camera.fov;offset=clamp(frame.fov,-.2,.2);camera.fov=clamp(baseFov+offset,.3,2.2);
  });
  const after=scene.onAfterCameraRenderObservable.add(camera=>{if(camera===owner&&offset){camera.fov=baseFov;offset=0;}});
  function dispose(){scene.onBeforeCameraRenderObservable.remove(before);scene.onAfterCameraRenderObservable.remove(after);if(particles){particles.dispose(true);particles=null;}detach();}
  scene.onDisposeObservable.addOnce(dispose);return dispose;
 }
 const api={curveValue,clamp,envelope,staminaAfter,recoveryRate,sample,uniforms,attach};if(typeof module!=='undefined')module.exports=api;else root.VoidConsumableRenderer=api;
})(globalThis);
