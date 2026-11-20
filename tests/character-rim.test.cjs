'use strict';
// The character and companion edge light (character-finish.js CharacterRimPlugin, vr-companions.js CompanionRimPlugin). Babylon 8's MaterialPluginBase keeps no
// enabled flag of its own; until 18 Nov 2026 neither plugin set _isEnabled, so prepareDefines wrote undefined and the rim was never compiled in.
const test=require('node:test'),assert=require('node:assert/strict');
class FakeBase{constructor(material,name,priority,defines){this._material=material;this.name=name;this.activated=0;this.markAllDefinesAsDirty=()=>{this.dirty=(this.dirty||0)+1;};}_enable(on){if(on)this.activated++;}}
const registered={},B={RegisterClass:(name,cls)=>{registered[name]=cls;},MaterialPluginBase:FakeBase,Color3:class{constructor(r,g,b){Object.assign(this,{r,g,b});}},ShaderLanguage:{WGSL:1},PBRMaterial:class{}};
test('the character rim is enabled when made, and its define is set',()=>{
 globalThis.BABYLON=B;const F=require('../void-runner/character-finish.js');
 // the plugin class is built lazily from Babylon: reach it through applyContainer with a fake container holding one PBR material
 const mat=new B.PBRMaterial();mat.name='casualsuit01';mat.clearCoat={};mat.sheen={};const c={materials:[mat],meshes:[]};let made=null;
 const Orig=B.MaterialPluginBase;B.MaterialPluginBase=class extends Orig{constructor(...a){super(...a);made=this;}};
 assert.equal(F.applyContainer('crowd:test-rim',c),1);B.MaterialPluginBase=Orig;
 assert.ok(made,'plugin made');assert.equal(made.isEnabled,true);assert.equal(made.activated,1);const d={};made.prepareDefines(d);assert.equal(d.CHARACTER_RIM,true);
 made.isEnabled=false;made.prepareDefines(d);assert.equal(d.CHARACTER_RIM,false);
 const code=made.getCustomCode('fragment',0).CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION;assert.match(code,/finalEmissive\+=/);});
test('the character rim class is registered with Babylon, so a cloned material re-creates it (night QA, 20 Nov 2026)',()=>{assert.equal(typeof registered['BABYLON.CharacterRimPlugin'],'function');assert.equal(new registered['BABYLON.CharacterRimPlugin']({}).getClassName(),'CharacterRimPlugin');});
test('the rim is subtle: an edge, not an outline',()=>{const F=require('../void-runner/character-finish.js');assert.ok(F.config.strength<=.5,'strength '+F.config.strength);assert.ok(F.config.power>=2.5);assert.ok(F.config.lift<=.05);});
test('the companion rim is enabled when made',()=>{const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../void-runner/vr-companions.js'),'utf8');
 const i=src.indexOf('class CompanionRimPlugin'),body=src.slice(i,src.indexOf('getUniforms',i));assert.match(body,/this\._isEnabled=false;this\.isEnabled=true;/);assert.match(body,/set isEnabled\(on\)\{[^}]*this\._isEnabled=on;this\.markAllDefinesAsDirty\(\);this\._enable\(on\);\}/);});
