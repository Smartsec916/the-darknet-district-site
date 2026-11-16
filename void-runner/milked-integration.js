/* Milked: registers the interior as a place and the interaction handlers (milked.js has the data, milked-build.js the 3D build). Browser only.
   Everything here is provisional placeholder text. Nothing starts a mission and nothing is saved except the usual "met" entry a conversation records. */
(function(root){
 'use strict';
 const MK=root.VoidMilked;if(!MK||typeof document==='undefined')return;
 // The inside of Milked is a place of its own (milked.js layout(), milked-build.js build()), reached only through the front vestibule or the rear lobby
 // (milked-transition.js). It is not a save location: nothing here writes to the save.
 try{if(typeof VoidExplorationData!=='undefined'&&VoidExplorationData.locations&&MK.layout)VoidExplorationData.locations[MK.KEY]=MK.layout();}catch(e){console.warn('[Milked]',e);}
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof talk==='undefined')return;clearInterval(wait);start();},300);
 function start(){
  // The two characters get a name and role for the dialogue window (they are separate from the VR companion Eva).
  const chars=root.VoidStoryContent?.characters;
  if(chars)for(const m of [MK.MODELS.eva,MK.MODELS.fish])if(!chars[m.id])chars[m.id]={id:m.id,name:m.name,role:m.role,portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['milked'],biography:'Placeholder. Provisional until approved.',relationshipDefault:0};
  const done=()=>{try{resumeWalking();}catch{}};
  const say=(who,texts)=>talk('',texts.map(text=>({who,text})),done,'CLOSE');
  const note=text=>{done();try{announce(text);}catch{}};
  const R=(action,fn)=>VoidInteractions.register(action,fn);
  R('milked-eva',()=>say(MK.MODELS.eva.id,MK.DIALOGUE.eva.greeting));
  R('milked-fish',()=>say(MK.MODELS.fish.id,MK.DIALOGUE.fish.greeting));
  R('milked-intercom',()=>note('VISITOR CHECK-IN: adults only. Card accepted. Stand in the middle of the vestibule: the doors seal, then the inner doors open.'));
  R('milked-security',()=>note('SECURITY MONITORS: vestibule, hallway, rear door and the side street. Nothing unusual.'));
  R('milked-studio',({item}={})=>note('STUDIO '+(item?.studio||'')+' is ON AIR: one performer, fixed cameras, nobody else in the room. The glass is soundproof. (Display only.)'));
  R('milked-cameras',()=>note('REMOTE CAMERA CONTROLS: every studio camera is on a stand and is moved from this desk. All four studios are live.'));
  R('milked-dressing',()=>note('DRESSING ROOM B is occupied. The door is locked.'));
  R('milked-restroom',()=>note('STAFF RESTROOMS. Occupied.'));
 }
})(globalThis);
