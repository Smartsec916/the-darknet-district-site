'use strict';
// Shared humanoid import foundation. Header-level checks only; verify decoded weights and motion in preview before release.
function makeRigTools(){
  'use strict';
  const chains=[['Hips','Spine','Chest','Neck','Head'],...['Left','Right'].flatMap(s=>[['Chest',s+'UpperArm',s+'ForeArm',s+'Hand'],['Hips',s+'UpperLeg',s+'LowerLeg',s+'Foot',s+'Toes']])];
  const roles=[...new Set(chains.flat())],optional=new Set(['Chest','Neck','LeftToes','RightToes']);
  const aliases={Hips:['hips','pelvis'],Spine:['spine','spine01'],Chest:['chest','upperchest','spine1','spine02','spine2','spine03'],Neck:['neck','neck01'],Head:['head']};
  for(const [s,short] of [['Left','l'],['Right','r']]){
    const a=s.toLowerCase();
    for(const [role,terms] of Object.entries({UpperArm:['upperarm','arm'],ForeArm:['forearm','lowerarm','elbow'],Hand:['hand','wrist'],UpperLeg:['upperleg','thigh','upleg'],LowerLeg:['lowerleg','calf','leg','shin'],Foot:['foot','ankle'],Toes:['toes','toe','toebase','ball']}))
      aliases[s+role]=terms.flatMap(t=>[a+t,t+a,t+short,short+t]);
  }
  const norm=n=>String(n??'').split(/[:|]/).at(-1).toLowerCase().replace(/[^a-z0-9]/g,'');
  function inspectRig(j,overrides={}){
    const nodes=j.nodes||[],skins=j.skins||[],accessors=j.accessors||[],issues=[],parents=new Map(),reachable=new Set(),visiting=new Set();
    for(let i=0;i<nodes.length;i++)for(const c of nodes[i].children||[]){if(!nodes[c]||parents.has(c))issues.push('Invalid or multiple parents for node '+c);else parents.set(c,i);}
    function visit(i){if(visiting.has(i)){issues.push('Cycle in scene hierarchy');return;}if(reachable.has(i)||!nodes[i])return;visiting.add(i);reachable.add(i);for(const c of nodes[i].children||[])visit(c);visiting.delete(i);}
    const scene=j.scenes?.[j.scene??0];if(scene)for(const i of scene.nodes||[])visit(i);else for(let i=0;i<nodes.length;i++)visit(i);
    const bound=new Set(),invalid=[];
    for(const i of reachable){const n=nodes[i];if(n.skin==null)continue;const skin=skins[n.skin],mesh=j.meshes?.[n.mesh];
      if(!skin?.joints?.length||!mesh?.primitives?.length){invalid.push(i);continue;}
      const valid=mesh.primitives.every(p=>{const a=p.attributes||{},pos=accessors[a.POSITION],joint=accessors[a.JOINTS_0],weight=accessors[a.WEIGHTS_0];return pos?.count>0&&joint?.type==='VEC4'&&[5121,5123].includes(joint.componentType)&&weight?.type==='VEC4'&&(weight.componentType===5126||([5121,5123].includes(weight.componentType)&&weight.normalized===true))&&joint.count===pos.count&&weight.count===pos.count;});
      if(valid)bound.add(n.skin);else invalid.push(i);
    }
    if(invalid.length)issues.push('Invalid skin binding on mesh nodes: '+invalid.join(', '));
    const result={state:'unrigged',skin:null,joints:[],mapping:{},ambiguous:{},missing:[],issues,ready:false};
    if(!skins.length&&!bound.size&&!invalid.length)return result;
    result.state='unsupported';
    if(bound.size!==1||invalid.length||issues.length){issues.push(bound.size?'Multiple or invalid active skin bindings':'No mesh with a structurally valid skin binding');return result;}
    const id=[...bound][0],skin=skins[id],jointSet=new Set(skin.joints);
    if(jointSet.size!==skin.joints.length||skin.joints.some(i=>!nodes[i]||!reachable.has(i))){issues.push('Invalid or inactive joint nodes');return result;}
    result.state='bound';result.skin=id;result.joints=[...jointSet].map(i=>({index:i,name:nodes[i].name||''}));
    const isAncestor=(a,b)=>{const seen=new Set();while(parents.has(b)){b=parents.get(b);if(b===a)return true;if(seen.has(b))return false;seen.add(b);}return false;};
    for(const role of roles){
      const candidates=result.joints.filter(n=>aliases[role].includes(norm(n.name))).map(n=>n.index);
      if(Object.prototype.hasOwnProperty.call(overrides,role)){
        const choice=overrides[role];if(choice===null&&optional.has(role))continue;
        if(!jointSet.has(choice)){issues.push('Invalid override for '+role);continue;}result.mapping[role]=choice;
      }else if(candidates.length===1)result.mapping[role]=candidates[0];
      else if(candidates.length>1)result.ambiguous[role]=candidates;
    }
    // Spine numbering is not portable: Mixamo counts upwards, some Meshy rigs backwards.
    // Resolve only an unbroken ancestor chain with a known hip and both arm anchors.
    if(!Object.hasOwn(overrides,'Spine')&&!Object.hasOwn(overrides,'Chest')&&result.mapping.Hips!==undefined&&result.mapping.LeftUpperArm!==undefined&&result.mapping.RightUpperArm!==undefined){
      const torso=result.joints.filter(n=>[...aliases.Spine,...aliases.Chest].includes(norm(n.name))).map(n=>n.index);
      const ordered=torso.length>=2&&torso.every(a=>isAncestor(result.mapping.Hips,a)&&isAncestor(a,result.mapping.LeftUpperArm)&&isAncestor(a,result.mapping.RightUpperArm)&&torso.every(b=>a===b||isAncestor(a,b)||isAncestor(b,a)));
      if(ordered){torso.sort((a,b)=>isAncestor(a,b)?-1:1);result.mapping.Spine=torso[0];result.mapping.Chest=torso.at(-1);delete result.ambiguous.Spine;delete result.ambiguous.Chest;}
    }
    for(const role of Object.keys(overrides))if(!roles.includes(role))issues.push('Unknown role '+role);
    const used=new Set();for(const [role,i] of Object.entries(result.mapping)){if(used.has(i))issues.push('Joint mapped more than once: '+role);used.add(i);}
    for(const chain of chains){const present=chain.filter(role=>Object.prototype.hasOwnProperty.call(result.mapping,role));for(let i=1;i<present.length;i++)if(!isAncestor(result.mapping[present[i-1]],result.mapping[present[i]]))issues.push('Hierarchy mismatch: '+present[i-1]+' → '+present[i]);}
    for(const s of ['Left','Right'])if(result.mapping.Hips!==undefined&&result.mapping[s+'UpperArm']!==undefined&&!isAncestor(result.mapping.Hips,result.mapping[s+'UpperArm']))issues.push('Arm not descended from hips: '+s);
    result.missing=roles.filter(role=>!optional.has(role)&&result.mapping[role]===undefined);
    result.ready=!issues.length&&!result.missing.length&&!Object.keys(result.ambiguous).length;
    return result;
  }
  const clipNames={idle:['idle','standingidle','idleloop'],talk:['talk','talking','talkloop'],walk:['walk','walking','walkforward','walkloop'],run:['run','running','runforward','runloop'],sit:['sit','sitting','sittingidle','sitidle'], 'sit-enter':['sitenter','sitdown','sittingdown'],'sit-exit':['sitexit','standup','situp','gettingup']};
  function inspectClips(j,rig){
    const joints=new Set((rig?.joints||[]).map(n=>n.index)),acc=j.accessors||[];
    return (j.animations||[]).map((a,index)=>{
      const targets=new Set();let valid=true;
      for(const c of a.channels||[]){const s=a.samplers?.[c.sampler],i=acc[s?.input],o=acc[s?.output],p=c.target?.path,node=c.target?.node;
        if(!joints.has(node)||!['rotation','translation','scale'].includes(p))continue;
        const k=node+':'+p,interp=s?.interpolation||'LINEAR';
        if(targets.has(k)||!['LINEAR','STEP','CUBICSPLINE'].includes(interp)||i?.type!=='SCALAR'||i.componentType!==5126||i.count<2||!Number.isFinite(i.min?.[0])||!Number.isFinite(i.max?.[0])||i.max[0]<=i.min[0]||o?.componentType!==5126||o.type!==(p==='rotation'?'VEC4':'VEC3')||o.count!==i.count*(interp==='CUBICSPLINE'?3:1)){valid=false;continue;}targets.add(k);
      }
      return {index,name:a.name||'',structural:valid&&targets.size>0,jointTracks:targets.size};
    });
  }
  function planAliases(j,rig,required=Object.keys(clipNames),overrides={}){
    const clips=inspectClips(j,rig),plan={aliases:[],present:[],missing:[],ambiguous:{},invalid:[]};
    if(!rig?.ready){plan.invalid.push('Resolve humanoid mapping first');return plan;}
    for(const role of required){
      const exact=clips.filter(c=>c.name===role);
      if(exact.length){if(exact.length===1&&exact[0].structural)plan.present.push(role);else plan.invalid.push(role);continue;}
      const manual=Object.prototype.hasOwnProperty.call(overrides,role),candidates=clips.filter(c=>c.structural&&(manual?c.index===overrides[role]:(clipNames[role]||[]).includes(norm(c.name))));
      if(candidates.length===1)plan.aliases.push({role,index:candidates[0].index,source:candidates[0].name,manual});
      else if(candidates.length>1)plan.ambiguous[role]=candidates.map(c=>c.index);
      else plan.missing.push(role);
    }
    return plan;
  }
  function applyAliases(j,rig,required,overrides){
    const plan=planAliases(j,rig,required,overrides),copy=JSON.parse(JSON.stringify(j));
    if(plan.invalid.length)throw Error('Cannot apply aliases: '+plan.invalid.join(', '));
    for(const a of plan.aliases){const clip=JSON.parse(JSON.stringify(copy.animations[a.index]));clip.name=a.role;copy.animations.push(clip);}
    return {json:copy,plan};
  }
  // Accessors from a normalized, decoded, single-buffer GLB. Unsupported encodings
  // must be decoded upstream, never treated as an empty or passing stream.
  function accessor(j,binary,index){
    const a=j.accessors?.[index],v=j.bufferViews?.[a?.bufferView],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a?.type],size={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a?.componentType];
    if(!(binary instanceof Uint8Array)||!a||!v||!width||!size||a.sparse||v.extensions||v.buffer!==0||!Number.isSafeInteger(a.count)||a.count<1)throw Error('Unsupported accessor '+index);
    const base=v.byteOffset??0,offset=a.byteOffset??0,stride=v.byteStride??width*size,length=v.byteLength;
    if(![base,offset,stride,length].every(Number.isSafeInteger)||base<0||offset<0||stride<width*size||stride%size||length<1||base+length>binary.byteLength||offset+(a.count-1)*stride+width*size>length||(base+offset)%size)throw Error('Accessor out of bounds '+index);
    const dv=new DataView(binary.buffer,binary.byteOffset,binary.byteLength),get={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];
    const max={5120:127,5121:255,5122:32767,5123:65535}[a.componentType];
    if(a.normalized&&!max)throw Error('Invalid normalized accessor '+index);
    return {count:a.count,width,row(i){if(!Number.isInteger(i)||i<0||i>=a.count)throw Error('Accessor index out of range');return Array.from({length:width},(_,k)=>{const n=dv[get](base+offset+i*stride+k*size,true);if(!Number.isFinite(n))throw Error('Non-finite accessor '+index);return a.normalized?Math.max(-1,n/max):n;});}};
  }
  function validateSkin(j,binary,rig=inspectRig(j)){
    const report={ok:false,vertices:0,issues:[]};
    if(!rig.ready){report.issues.push('Resolve rig mapping first');return report;}
    try{
      const skin=j.skins[rig.skin];
      if(skin.inverseBindMatrices!=null){
        const a=j.accessors[skin.inverseBindMatrices],m=accessor(j,binary,skin.inverseBindMatrices);
        if(a.componentType!==5126||a.type!=='MAT4'||m.count<skin.joints.length)throw Error('Invalid inverse bind matrices');
        for(let i=0;i<skin.joints.length;i++){
          const x=m.row(i),d=x[0]*(x[5]*x[10]-x[6]*x[9])-x[4]*(x[1]*x[10]-x[2]*x[9])+x[8]*(x[1]*x[6]-x[2]*x[5]);
          if(!Number.isFinite(d)||d===0||Math.abs(x[3])+Math.abs(x[7])+Math.abs(x[11])+Math.abs(x[15]-1)>1e-4)throw Error('Singular or non-affine inverse bind matrix '+i);
        }
      }
      const seen=new Set();
      for(const n of j.nodes||[])if(n.skin===rig.skin&&!seen.has(n.mesh)){
        seen.add(n.mesh);
        for(const p of j.meshes[n.mesh].primitives){
          if(p.extensions)throw Error('Decode compressed mesh first');
          const a=p.attributes,position=accessor(j,binary,a.POSITION),sets=[];
          for(const k of Object.keys(a).filter(k=>/^JOINTS_\d+$/.test(k)||/^WEIGHTS_\d+$/.test(k)))if(!sets.includes(k.split('_')[1]))sets.push(k.split('_')[1]);
          const pairs=sets.map(k=>{const ji=a['JOINTS_'+k],wi=a['WEIGHTS_'+k],ja=j.accessors[ji],wa=j.accessors[wi];if(ja?.type!=='VEC4'||![5121,5123].includes(ja.componentType)||ja.normalized||wa?.type!=='VEC4'||!(wa.componentType===5126&&!wa.normalized||[5121,5123].includes(wa.componentType)&&wa.normalized))throw Error('Invalid joint/weight streams');const joints=accessor(j,binary,ji),weights=accessor(j,binary,wi);if(joints.count!==position.count||weights.count!==position.count)throw Error('Mismatched skin streams');return {joints,weights};});
          if(!pairs.length||position.width!==3)throw Error('Missing skin streams');
          for(let i=0;i<position.count;i++){
            position.row(i);let total=0;
            for(const {joints,weights} of pairs){const ids=joints.row(i),ws=weights.row(i);for(let k=0;k<4;k++){if(!Number.isInteger(ids[k])||ids[k]<0||ids[k]>=skin.joints.length||ws[k]<0||ws[k]>1.0001)throw Error('Invalid joint index or weight at vertex '+i);total+=ws[k];}}
            if(Math.abs(total-1)>.025)throw Error('Unnormalized or zero skin weights at vertex '+i);
            report.vertices++;
          }
        }
      }
      if(!report.vertices)throw Error('No decoded skinned vertices');
      report.ok=true;
    }catch(e){report.issues.push(e.message);}
    return report;
  }
  function validateMotion(j,binary,rig,index,{locomotion=false}={}){
    const report={ok:false,movingJoints:[],issues:[]};
    if(!rig.ready||!inspectClips(j,rig)[index]?.structural){report.issues.push('Invalid structural clip or rig');return report;}
    try{
      const a=j.animations[index],jointSet=new Set(rig.joints.map(x=>x.index)),moving=new Set();
      for(const c of a.channels){
        const node=c.target?.node,path=c.target?.path;
        if(!jointSet.has(node)||!['rotation','translation','scale'].includes(path))continue;
        const s=a.samplers[c.sampler],input=accessor(j,binary,s.input),output=accessor(j,binary,s.output),cubic=s.interpolation==='CUBICSPLINE';
        let previous=-Infinity,first=null;
        for(let i=0;i<input.count;i++){
          const t=input.row(i)[0];if(t<0||t<=previous)throw Error('Animation times must increase');previous=t;
          const value=output.row(cubic?i*3+1:i);
          if(cubic){output.row(i*3);output.row(i*3+2);}
          if(path==='rotation'&&Math.abs(Math.hypot(...value)-1)>.01)throw Error('Invalid rotation quaternion');
          if(first===null)first=value;
          else {const distance=path==='rotation'?1-Math.abs(first.reduce((sum,x,k)=>sum+x*value[k],0))/(Math.hypot(...first)*Math.hypot(...value)):Math.hypot(...value.map((x,k)=>x-first[k]));if(distance>1e-5)moving.add(node);}
        }
      }
      report.movingJoints=[...moving];
      if(locomotion&&!['Left','Right'].every(side=>[side+'UpperLeg',side+'LowerLeg',side+'Foot'].some(role=>moving.has(rig.mapping[role]))))throw Error('Locomotion requires actual motion in both legs');
      report.ok=true;
    }catch(e){report.issues.push(e.message);}
    return report;
  }
  return {roles,inspectRig,inspectClips,planAliases,applyAliases,accessor,validateSkin,validateMotion};
}
if(typeof module==='object'&&module.exports)module.exports=makeRigTools();else globalThis.VoidSharedRig=makeRigTools();
