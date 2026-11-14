/* Milked: registers the interaction handlers (milked.js has the data and the 3D build). Browser only.
   Everything here is provisional placeholder text. Nothing starts a mission and nothing is saved except the usual "met" entry a conversation records. */
(function(root){
 'use strict';
 const MK=root.VoidMilked;if(!MK||typeof document==='undefined')return;
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
  R('milked-checkin',()=>say(MK.MODELS.eva.id,MK.DIALOGUE.eva.checkin));
  R('milked-studio',({item}={})=>note('STUDIO '+(item?.studio||'')+' CONSOLE: broadcast live, privacy mode on, chat filter active. Viewers see a clothed performer on a stage set. (Display only.)'));
  R('milked-ops',()=>note('BROADCAST MONITORING: all studio feeds healthy. Encryption on. Privacy and security indicators green.'));
  R('milked-clinic',()=>note('BIOBANK KIOSK: appointments are by booking only. Adults only, identity checked, nothing leaves the building unrecorded. (Display only.)'));
  R('milked-consult',()=>note('A frosted, private consultation room. Sound-proofed and not recorded.'));
  R('milked-lab',()=>note('INVENTORY: sealed units, chain of custody logged, temperature nominal. (Fictional display.)'));
  R('milked-staff',()=>note('STAFF ONLY. The door is locked.'));
  R('milked-security',()=>note('SECURITY MONITOR: lobby, hall, lab door and Studio 2. Nothing unusual.'));
 }
})(globalThis);
