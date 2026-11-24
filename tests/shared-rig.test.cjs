'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),api=require('../tools/animation-pipeline/shared-rig.cjs');
function exercise(api,assert){
  const names=['Hips','Spine','Chest','Neck','Head','LeftUpperArm','LeftForeArm','LeftHand','RightUpperArm','RightForeArm','RightHand','LeftUpperLeg','LeftLowerLeg','LeftFoot','LeftToes','RightUpperLeg','RightLowerLeg','RightFoot','RightToes'];
  const parents=[null,0,1,2,3,2,5,6,2,8,9,0,11,12,13,0,15,16,17];
  const unreal=['pelvis','spine_01','spine_02','neck_01','head','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r','thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','ball_r'];
  function fixture(list=names){const nodes=list.map(name=>({name,children:[]}));parents.forEach((p,i)=>{if(p!==null)nodes[p].children.push(i);});nodes.push({mesh:0,skin:0});return {nodes,scenes:[{nodes:[0,19]}],scene:0,skins:[{joints:names.map((_,i)=>i)}],meshes:[{primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2}}]}],accessors:[{count:3,type:'VEC3',componentType:5126},{count:3,type:'VEC4',componentType:5121},{count:3,type:'VEC4',componentType:5126},{count:2,type:'SCALAR',componentType:5126,min:[0],max:[1]},{count:2,type:'VEC4',componentType:5126}],animations:[]};}
  for(const list of [names,names.map(n=>'mixamorig:'+n),unreal]){const rig=api.inspectRig(fixture(list));assert(rig.ready,'map '+list[0]);assert(rig.mapping.LeftForeArm===6,'left forearm');}
  for(const torso of [['Spine','Spine1','Spine2'],['Spine02','Spine01','Spine']]){
    const list=names.map(n=>n.replace('UpperArm','Arm').replace('UpperLeg','UpLeg').replace('LowerLeg','Leg').replace('Toes','ToeBase'));list[1]=torso[0];list[2]=torso[1];
    const j=fixture(list);j.nodes.push({name:torso[2],children:j.nodes[2].children});j.nodes[2].children=[20];j.skins[0].joints.push(20);
    const rig=api.inspectRig(j);assert(rig.ready,'ordered torso '+torso.join());assert(rig.mapping.Spine===1&&rig.mapping.Chest===20,'torso ordering');
  }
  const blank=fixture();delete blank.nodes[19].skin;assert(api.inspectRig(blank).state==='unsupported','unbound skeleton not falsely accepted');delete blank.skins;assert(api.inspectRig(blank).state==='unrigged','unrigged fallback');
  const bad=fixture();bad.accessors[2].count=2;assert(!api.inspectRig(bad).ready,'bad weight count');
  const ambiguous=fixture();ambiguous.nodes.push({name:'LeftForeArm'});ambiguous.nodes[5].children.push(20);ambiguous.skins[0].joints.push(20);assert(!api.inspectRig(ambiguous).ready,'ambiguous bones');assert(api.inspectRig(ambiguous,{LeftForeArm:6}).ready,'manual override');assert(!api.inspectRig(ambiguous,{LeftForeArm:20}).ready,'wrong hierarchy');
  const wrong=fixture();assert(!api.inspectRig(wrong,{LeftForeArm:9}).ready,'crossed limb');
  const gltf=fixture();const clip=name=>({name,samplers:[{input:3,output:4}],channels:[{sampler:0,target:{node:0,path:'rotation'}}]});gltf.animations=[clip('Walking'),clip('run'),clip('Custom')];const rig=api.inspectRig(gltf),before=JSON.stringify(gltf);
  const result=api.applyAliases(gltf,rig,['walk','run','idle']);assert(result.plan.present.join()==='run','existing exact preserved');assert(result.plan.missing.join()==='idle','missing stays missing');assert(result.json.animations.at(-1).name==='walk','alias');assert(JSON.stringify(gltf)===before,'input unchanged');assert(JSON.stringify(result.json.skins)===JSON.stringify(gltf.skins),'skins unchanged');assert(result.json.animations.length===4,'preserve originals');
  gltf.animations.push(clip('WalkForward'));assert(api.planAliases(gltf,rig,['walk']).ambiguous.walk.length===2,'ambiguous animation');assert(api.planAliases(gltf,rig,['walk'],{walk:0}).aliases[0].manual,'manual animation');
  gltf.animations.push({name:'idle',channels:[]});assert(api.planAliases(gltf,rig,['idle']).invalid.includes('idle'),'empty exact clip rejected');
  // Decoded binary streams: actual bytes, not accessor metadata alone.
  const d=fixture();d.accessors=[];d.bufferViews=[];const bytes=[];
  function put(values,type,componentType,normalized=false){
    const size=componentType===5126?4:1;while(bytes.length%4)bytes.push(0);const off=bytes.length,flat=values.flat(),raw=new Uint8Array(flat.length*size),dv=new DataView(raw.buffer);
    flat.forEach((n,i)=>size===4?dv.setFloat32(i*4,n,true):raw[i]=n);
    bytes.push(...raw);const bufferView=d.bufferViews.push({buffer:0,byteOffset:off,byteLength:raw.length})-1;
    return d.accessors.push({bufferView,type,componentType,count:values.length,...(normalized?{normalized:true}:{}),...(type==='SCALAR'?{min:[values[0][0]],max:[values.at(-1)[0]]}:{})})-1;
  }
  const pos=put([[0,0,0],[0,1,0],[1,0,0]],'VEC3',5126);
  const ids=put([[0,0,0,0],[1,0,0,0],[2,0,0,0]],'VEC4',5121);
  const weights=put([[255,0,0,0],[255,0,0,0],[255,0,0,0]],'VEC4',5121,true);
  d.meshes[0].primitives[0].attributes={POSITION:pos,JOINTS_0:ids,WEIGHTS_0:weights};
  const bind=put(names.map(()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),'MAT4',5126);d.skins[0].inverseBindMatrices=bind;
  const times=put([[0],[.5],[1]],'SCALAR',5126),rot=put([[0,0,0,1],[.5,0,0,Math.sqrt(.75)],[0,0,0,1]],'VEC4',5126),still=put([[0,0,0,1],[0,0,0,-1],[0,0,0,1]],'VEC4',5126);
  const anim=(name,outputs)=>({name,samplers:outputs.map(output=>({input:times,output})),channels:outputs.map((_,i)=>({sampler:i,target:{node:[11,15][i],path:'rotation'}}))});
  d.animations=[anim('walk',[rot,rot]),anim('run',[still,still]),anim('one-leg',[rot,still])];
  const data=Uint8Array.from(bytes),mapped=api.inspectRig(d);
  assert(mapped.ready,'decoded fixture mapping');assert(api.validateSkin(d,data,mapped).ok,'normalized actual weights and binds');assert(api.validateMotion(d,data,mapped,0,{locomotion:true}).ok,'bilateral motion');
  assert(!api.validateMotion(d,data,mapped,1,{locomotion:true}).ok,'quaternion sign changes not motion');assert(!api.validateMotion(d,data,mapped,2,{locomotion:true}).ok,'one leg not locomotion');
  const corrupt=(id,fn)=>{const b=data.slice(),o=d.bufferViews[d.accessors[id].bufferView].byteOffset;fn(b,o,new DataView(b.buffer));return b;};
  assert(!api.validateSkin(d,corrupt(weights,(b,o)=>b[o]=0),mapped).ok,'zero weights rejected');
  assert(!api.validateSkin(d,corrupt(ids,(b,o)=>b[o]=99),mapped).ok,'invalid joint rejected');
  assert(!api.validateSkin(d,corrupt(bind,(b,o,v)=>v.setFloat32(o,0,true)),mapped).ok,'singular bind rejected');
  assert(!api.validateSkin(d,data.subarray(0,4),mapped).ok,'truncated binary rejected');
  assert(!api.validateMotion(d,corrupt(times,(b,o,v)=>v.setFloat32(o+4,0,true)),mapped,0,{locomotion:true}).ok,'duplicate timestamps rejected');
  assert(!api.validateMotion(d,corrupt(rot,(b,o,v)=>v.setFloat32(o+12,0,true)),mapped,0).ok,'invalid quaternion rejected');

}
test('shared rig mapping and non-destructive clip alias planning',()=>exercise(api,(v,m)=>assert.ok(v,m)));
