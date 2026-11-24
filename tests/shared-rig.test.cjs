'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),api=require('../tools/animation-pipeline/shared-rig.cjs');
function exercise(api,assert){
  const names=['Hips','Spine','Chest','Neck','Head','LeftUpperArm','LeftForeArm','LeftHand','RightUpperArm','RightForeArm','RightHand','LeftUpperLeg','LeftLowerLeg','LeftFoot','LeftToes','RightUpperLeg','RightLowerLeg','RightFoot','RightToes'];
  const parents=[null,0,1,2,3,2,5,6,2,8,9,0,11,12,13,0,15,16,17];
  const unreal=['pelvis','spine_01','spine_02','neck_01','head','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r','thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','ball_r'];
  function fixture(list=names){const nodes=list.map(name=>({name,children:[]}));parents.forEach((p,i)=>{if(p!==null)nodes[p].children.push(i);});nodes.push({mesh:0,skin:0});return {nodes,scenes:[{nodes:[0,19]}],scene:0,skins:[{joints:names.map((_,i)=>i)}],meshes:[{primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2}}]}],accessors:[{count:3,type:'VEC3',componentType:5126},{count:3,type:'VEC4',componentType:5121},{count:3,type:'VEC4',componentType:5126},{count:2,type:'SCALAR',componentType:5126,min:[0],max:[1]},{count:2,type:'VEC4',componentType:5126}],animations:[]};}
  for(const list of [names,names.map(n=>'mixamorig:'+n),unreal]){const rig=api.inspectRig(fixture(list));assert(rig.ready,'map '+list[0]);assert(rig.mapping.LeftForeArm===6,'left forearm');}
  const blank=fixture();delete blank.nodes[19].skin;assert(api.inspectRig(blank).state==='unsupported','unbound skeleton not falsely accepted');delete blank.skins;assert(api.inspectRig(blank).state==='unrigged','unrigged fallback');
  const bad=fixture();bad.accessors[2].count=2;assert(!api.inspectRig(bad).ready,'bad weight count');
  const ambiguous=fixture();ambiguous.nodes.push({name:'LeftForeArm'});ambiguous.nodes[5].children.push(20);ambiguous.skins[0].joints.push(20);assert(!api.inspectRig(ambiguous).ready,'ambiguous bones');assert(api.inspectRig(ambiguous,{LeftForeArm:6}).ready,'manual override');assert(!api.inspectRig(ambiguous,{LeftForeArm:20}).ready,'wrong hierarchy');
  const wrong=fixture();assert(!api.inspectRig(wrong,{LeftForeArm:9}).ready,'crossed limb');
  const gltf=fixture();const clip=name=>({name,samplers:[{input:3,output:4}],channels:[{sampler:0,target:{node:0,path:'rotation'}}]});gltf.animations=[clip('Walking'),clip('run'),clip('Custom')];const rig=api.inspectRig(gltf),before=JSON.stringify(gltf);
  const result=api.applyAliases(gltf,rig,['walk','run','idle']);assert(result.plan.present.join()==='run','existing exact preserved');assert(result.plan.missing.join()==='idle','missing stays missing');assert(result.json.animations.at(-1).name==='walk','alias');assert(JSON.stringify(gltf)===before,'input unchanged');assert(JSON.stringify(result.json.skins)===JSON.stringify(gltf.skins),'skins unchanged');assert(result.json.animations.length===4,'preserve originals');
  gltf.animations.push(clip('WalkForward'));assert(api.planAliases(gltf,rig,['walk']).ambiguous.walk.length===2,'ambiguous animation');assert(api.planAliases(gltf,rig,['walk'],{walk:0}).aliases[0].manual,'manual animation');
  gltf.animations.push({name:'idle',channels:[]});assert(api.planAliases(gltf,rig,['idle']).invalid.includes('idle'),'empty exact clip rejected');
}
test('shared rig mapping and non-destructive clip alias planning',()=>exercise(api,(v,m)=>assert.ok(v,m)));
