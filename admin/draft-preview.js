/* Schema adapter for isolated inspection. It never calls Story.apply, mission completion, saves or APIs. */
(function(root){
 const Story=typeof module!=='undefined'?require('../void-runner/story.js'):root.VoidStory;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function condition(c,fixture){if(!c)return true;if(c.type==='at-location')return fixture.location===c.key;return Story.matches(fixture,c.type==='flag'?{flags:{[c.key]:c.value}}:{completed:[c.key]});}
 function mission(document,fixture={}){const f={story:Story.fresh(),cleared:[],ownedShips:[],creditGear:[],standardGear:[],quest:'',location:'',...clone(fixture)};const d=clone(document.data);return {isolated:true,available:d.enabled&&(!d.availability.locations.length||d.availability.locations.includes(f.location))&&d.availability.conditions.every(c=>condition(c,f))&&d.prerequisites.every(id=>condition({type:'mission-complete',key:id,value:true},f)),objectives:d.objectives.map(o=>({id:o.id,label:o.label,complete:o.condition?condition(o.condition,f):false})),plannedRewards:clone(d.rewards),executedActions:0};}
 function dialogue(document,id,fixture={}){const n=clone(document.data.nodes.find(n=>n.id===(id||document.data.start)));if(!n)return null;const f={story:Story.fresh(),cleared:[],ownedShips:[],creditGear:[],standardGear:[],quest:'',location:'',...clone(fixture)};return {...n,choices:n.choices.filter(c=>condition(c.condition,f)),isolated:true,executedActions:0};}
 const api={mission,dialogue};if(typeof module!=='undefined')module.exports=api;else root.VoidDraftPreview=api;
})(globalThis);
