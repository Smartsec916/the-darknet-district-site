const assert=require('node:assert/strict');
const campaign=require('../../void-runner/campaign.js');

module.exports=function completeJourney(state){
 const first=campaign.complete(state);
 if(!first?.connection)return first;
 assert.equal(first.reward,0,'arrival in open space pays no docking reward');
 return campaign.complete(state);
};
