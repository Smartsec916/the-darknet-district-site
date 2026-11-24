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
  return {roles,inspectRig,inspectClips,planAliases,applyAliases};
}
if(typeof module==='object'&&module.exports)module.exports=makeRigTools();else globalThis.VoidSharedRig=makeRigTools();
