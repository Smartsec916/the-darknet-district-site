/* The District's faction deliveries in play: Admin's offer (design doc 05), the recipients at
   The Vigil and Holdfast (doc 07), and Iris's payment and second offer (doc 06). The dialogue is
   David's script; lines marked UNREVIEWED are Claude's functional placeholders. Rules live in campaign.js. */
(function(){
 const D=C.factionDeliveries,HEAD='The Darknet District';
 Object.assign(characters,{
  pilot:{name:'You',role:'INDEPENDENT PILOT'},
  Admin:{name:'Admin',role:'THE DARKNET DISTRICT'},
  Iris:{name:'Iris',role:'CHIEF SECURITY OFFICER'},
  elara:{name:'Dr. Elara Voss',role:'RESEARCH LOGISTICS COORDINATOR'},
  marcus:{name:'Marcus Vale',role:'INDUSTRIAL SUPPLY SUPERVISOR'}
 });
 const line=who=>text=>({who,text}),you=line('pilot'),admin=line('Admin'),iris=line('Iris'),elara=line('elara'),marcus=line('marcus');
 // The player's own lines are shown, not voiced.
 const voice=globalThis.VoidAudio;if(voice?.speak){const speak=voice.speak.bind(voice);voice.speak=(id,...rest)=>id==='pilot'?voice.cancel?.():speak(id,...rest);}

 // Plays the lines, then keeps the last one on screen with a button per choice.
 let choices=null;
 function ask(lines,options,heading=''){
  const menu=()=>{
   const last=lines[lines.length-1];talk('',[last],menu,'',heading);speech.shown=last.text.length;
   $('speech-next').style.display='none';screen.querySelector('.dialogue-window')?.classList.add('choice-menu');choices=options;
   screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend',options.map((o,i)=>button(o.label,'faction-choice:'+i,o.quiet===true)).join(''));
  };
  if(lines.length>1)talk('',lines.slice(0,-1),menu,'NEXT →',heading);else menu();
 }
 screen.addEventListener('click',e=>{
  const a=e.target.closest('button')?.dataset.action;if(!a?.startsWith('faction-choice:')||!choices)return;
  const option=choices[Number(a.split(':')[1])];choices=null;speech=null;globalThis.VoidAudio?.cancel();option?.run();
 });
 const leave=(lines,label='RETURN TO DISTRICT',after)=>talk('',lines,()=>{after?.();resumeWalking();},label,lines[0]?.who==='elara'||lines[0]?.who==='marcus'?'':HEAD);

 function take(faction,giver){
  const d=D[faction];
  if(!C.acceptFaction(state,faction)){
   // UNREVIEWED: shown only if the player is already carrying another contract.
   leave([giver==='Iris'?iris('You’re already carrying someone else’s cargo. Come back when your hold is free.'):admin('Finish the job you’re carrying first. Then we’ll talk.')]);return;
  }
  VoidMissions.track(state,d.id,C);save();
  const tracked=()=>announce(d.name.toUpperCase()+' ACCEPTED · '+C.stations[d.destination].name+', '+VoidUniverse.systems[VoidUniverse.system(d.destination)].name+' tracked.');
  if(giver==='Iris')leave([you('I’ll take the delivery.'),iris('Excellent. I’ve transferred the shipping details to your mission log. Try not to lose anything expensive.')],'RETURN TO DISTRICT',tracked);
  else leave([you(faction==='communion'?'I’ll take the Communion delivery.':'I’ll take the Natural Order delivery.')],'RETURN TO DISTRICT',tracked);
 }

 // ---- Admin (doc 05) ----
 const adminPrompt=admin('So, what do you think? Which direction you feel like heading?');
 function adminOptions(){return [
  {label:'TELL ME ABOUT THE COMMUNION DELIVERY',quiet:true,run:()=>ask([you('Tell me about the Communion delivery.'),admin('Advanced electronics. Research equipment, mostly. They’re always building something over there. Pays well enough.')],adminOptions(),HEAD)},
  {label:'WHAT ABOUT THE NATURAL ORDER?',quiet:true,run:()=>ask([you('What about the Natural Order?'),admin('Mechanical components. Industrial supplies. They prefer things that don’t think for themselves. Can’t say I blame them sometimes.')],adminOptions(),HEAD)},
  {label:'I’LL TAKE THE COMMUNION DELIVERY',run:()=>take('communion','Admin')},
  {label:'I’LL TAKE THE NATURAL ORDER DELIVERY',run:()=>take('natural-order','Admin')},
  {label:'I’LL THINK ABOUT IT',quiet:true,run:()=>leave([you('I’ll think about it.')])}
 ];}
 const adminIntro=[
  admin('Ah, you must be the pilot Rook sent. He mentioned you might stop by. Says you’re reliable enough. That’s usually all I need to hear.'),
  you('Rook said you might have some work.'),
  admin('Always got work. Just depends on where you’re willing to go.'),
  admin('Things have been getting a little interesting out there lately. The Communion and the Natural Order are at each other’s throats again.'),
  you('Who are they?'),
  admin('Communion’s big on artificial intelligence. Practically worship the stuff. Natural Order? They’d rather smash a computer than let one make a decision for them.'),
  admin('Been arguing about it for generations. Occasionally they shoot at each other. Usually somewhere inconvenient for the rest of us.'),
  you('Sounds like trouble.'),
  admin('Eh. Trouble’s good for business. Long as it stays somewhere else.'),
  admin('Anyway, I’ve got two deliveries that need moving. One’s headed into Communion territory, the other’s going to a Natural Order outpost. Both pay decent.'),
  you('What’s the cargo?'),
  admin('Equipment. Supplies. Nothing particularly exciting.'),
  admin('Well, nothing that’s supposed to be exciting.'),
  adminPrompt
 ];
 // ---- Admin's sealed cargo for Rook (step 3, Option A). UNREVIEWED: all lines are Claude's placeholders for David to rewrite. ----
 function sealedOffer(){
  const f=state.story.flags,again=f.sealedCargo==='seized',first=!f.sealedIntro;f.sealedIntro=true;save();
  const opening=again?[admin('Heard you ran into a patrol.'),you('They took the crate.'),admin('Happens. Rook still needs one. I’ve got another, if you’re feeling luckier.')]
   :first?[admin('Got a minute? I’ve got something for Rook. Small crate. Sealed.'),you('What’s in it?'),admin('Something Rook paid for, and something you don’t need to know about. It stays sealed.'),admin('Tessaly patrols have been scanning outbound traffic lately. Keep your head down and you’ll be fine. Rook pays well.')]
   :[admin('That crate for Rook is still here, if you want it.')];
  const options=()=>[
   {label:'WHAT IF THEY SCAN ME?',quiet:true,run:()=>ask([you('What if they scan me?'),admin('Then you’ve got a choice to make. Pay the fine and lose the crate, or don’t. Just don’t lead them back here.')],options(),HEAD)},
   {label:'I’LL TAKE IT',run:()=>{
    if(!C.acceptSealed(state))return leave([admin('Finish the job you’re carrying first. Then we’ll talk.')]);
    VoidMissions.track(state,C.sealedCargo.id,C);save();
    leave([you('I’ll take it.'),admin('Rook’s expecting it. Don’t open it.')],'RETURN TO DISTRICT',()=>announce('SEALED CARGO ACCEPTED · Rook, Meridian Station tracked. Tessaly patrols are scanning the outbound lane.'));
   }},
   {label:'NOT RIGHT NOW',quiet:true,run:()=>leave([you('Not right now.'),admin('Suit yourself. It’ll keep.')])}
  ];
  ask(opening,options(),HEAD);
 }
 VoidInteractions.register('admin',()=>{
  const f=state.story.flags;
  if(!state.universe.completedObjectives.includes('meet-admin'))state.universe.completedObjectives.push('meet-admin');
  f.metAdmin=true;f.metIris=true;const offers=C.factionOffers(state);
  if(offers.length&&!f.factionIntro){f.factionIntro=true;save();ask(adminIntro,adminOptions(),HEAD);return;}
  save();
  if(offers.length===2)return ask([adminPrompt],adminOptions(),HEAD);
  if(C.sealedOffered(state)&&!state.contract)return sealedOffer();
  // UNREVIEWED: Admin's idle lines once the introductions are done.
  const busy=[...Object.values(D),...Object.values(C.supplyDeliveries)].some(d=>['accepted','delivered'].includes(state.story.flags[d.flag]));
  leave([busy?admin('You’ve got a delivery to make. Come back when it’s done.'):admin('Iris has the contracts. I just make the introductions.')]);
 });

 // ---- Rook takes the sealed crate at Meridian and pays (UNREVIEWED placeholder lines) ----
 const sealedRook=rookConversation;
 rookConversation=function(){
  if(!C.sealedDeliverable(state))return sealedRook();
  const evaded=state.story.flags.sealedPatrolOutcome==='evaded';
  C.deliverSealed(state);VoidMissions.sync(state,C);save();hud();
  talk('',[you('Package from Admin.'),{who:'rook',text:'Seal’s intact. Good.'},...(evaded?[{who:'rook',text:'Heard a patrol chased you halfway to the gate. Nice flying.'}]:[]),{who:'rook',text:'Here’s your cut. And you never carried it.'}],
   ()=>{announce('PAYMENT RECEIVED · '+C.sealedCargo.payment.toLocaleString()+' credits · SEALED CARGO DELIVERED');resumeWalking();},'RETURN TO STATION');
 };

 // ---- Iris (doc 06) ----
 const offerLines={
  'natural-order':[iris('This one’s headed to the Natural Order. Mechanical components, industrial supplies. Nothing terribly sophisticated.'),iris('At least, not by my standards.')],
  communion:[iris('This shipment’s for the Communion. Electronics and research equipment. They do seem to have an endless appetite for technology.'),iris('Some of it is actually rather interesting.')]
 };
 function irisOffer(faction,opening){
  ask([...(opening?[iris('Oh, before you go. Admin had another shipment lined up. The one you didn’t take.'),you('Still available?'),iris('Apparently. Nobody’s been particularly eager to collect it.')]:[]),...offerLines[faction]],[
   {label:'I’LL TAKE THE DELIVERY',run:()=>take(faction,'Iris')},
   {label:'NOT RIGHT NOW',quiet:true,run:()=>leave([you('Not right now.'),iris('Of course. I’ll keep the contract available. For now.')])}
  ],HEAD);
 }
 // ---- Iris's follow-up contracts (doc 09) ----
 const S=C.supplyDeliveries,supplyPrompt=iris('Both destinations should be familiar to you by now. Interested?');
 function takeSupply(faction){
  const d=S[faction];
  // UNREVIEWED: shown only if the player is already carrying another contract.
  if(!C.acceptSupply(state,faction))return leave([iris('You’re already carrying someone else’s cargo. Come back when your hold is free.')]);
  VoidMissions.track(state,d.id,C);save();
  leave([you(faction==='communion'?'I’ll take the Communion delivery.':'I’ll take the Natural Order delivery.')],'RETURN TO DISTRICT',()=>announce(d.name.toUpperCase()+' ACCEPTED · '+C.stations[d.destination].name+', '+VoidUniverse.systems[VoidUniverse.system(d.destination)].name+' tracked.'));
 }
 function supplyOptions(){
  const open=C.supplyOffers(state),options=[];
  if(open.includes('communion'))options.push({label:'TELL ME ABOUT THE COMMUNION SHIPMENT',quiet:true,run:()=>ask([you('Tell me about the Communion shipment.'),iris('Specialized processing modules, sensor components, and research hardware. Apparently they’re expanding one of their projects.'),you('What kind of project?'),iris('They haven’t said. And I find it’s generally best not to ask too many questions when someone is paying for delivery.')],supplyOptions(),HEAD)});
  if(open.includes('natural-order'))options.push({label:'WHAT DOES THE NATURAL ORDER NEED?',quiet:true,run:()=>ask([you('What does the Natural Order need?'),iris('Industrial control assemblies, replacement machinery, and heavy-duty mechanical components.'),you('Nothing computerized?'),iris('Oh, they use computers. They simply prefer theirs to remain obedient.')],supplyOptions(),HEAD)});
  if(open.includes('communion'))options.push({label:'I’LL TAKE THE COMMUNION DELIVERY',run:()=>takeSupply('communion')});
  if(open.includes('natural-order'))options.push({label:'I’LL TAKE THE NATURAL ORDER DELIVERY',run:()=>takeSupply('natural-order')});
  options.push({label:'I’LL THINK ABOUT IT',quiet:true,run:()=>leave([you('I’ll think about it.'),iris('Of course. The contracts will remain available.')])});
  return options;
 }
 const irisDefault=VoidInteractions.handlers.get('district-iris');
 VoidInteractions.register('district-iris',arg=>{
  const delivered=Object.values(D).find(d=>C.factionStage(state,d.faction)==='delivered');
  if(delivered){
   const other=Object.values(D).find(d=>d!==delivered),second=C.factionStage(state,other.faction)==='paid';
   const paid=C.collectFactionPayment(state);state.story.flags.metIris=true;VoidMissions.sync(state,C);save();hud();
   const credited=()=>announce('PAYMENT RECEIVED · '+paid.reduce((n,d)=>n+d.payment,0).toLocaleString()+' credits · '+delivered.name.toUpperCase()+' COMPLETE');
   // Doc 09 replaces doc 06's closing: Iris pays, then offers the follow-up contracts.
   if(second){credited();ask([iris('Back again. You’re becoming something of a regular.'),you('Finished the delivery.'),iris('So I see. Both shipments delivered, both clients satisfied. Remarkable, considering they can barely tolerate each other’s existence.'),iris('There you are. All settled.'),iris('Actually, I have a little more work available. Both factions have requested additional supplies.'),you('More deliveries?'),iris('Essentially. Although these shipments are a little more specialized.'),you('Specialized how?'),iris('Each faction has rather particular requirements. The Communion wants technology. The Natural Order prefers equipment they can maintain without asking a machine for permission.'),supplyPrompt],supplyOptions(),HEAD);return;}
   talk('',[iris('Ah, Rook’s pilot. Back in one piece, I see. That’s encouraging.'),you('Where’s Admin?'),iris('Occupied. I’m handling things for now. Don’t worry, he left instructions to pay you.'),iris('Let’s see... cargo received, delivery confirmed, and no complaints from the recipient. How refreshingly uneventful.'),iris('There you are. Payment received. Pleasure doing business with you.')],()=>{credited();if(C.factionOffers(state).includes(other.faction))irisOffer(other.faction,true);else resumeWalking();},'NEXT →',HEAD);
   return;
  }
  // A delivered follow-up contract is paid with Iris's established line, then any remaining contract is offered.
  const supply=Object.values(C.supplyDeliveries).find(d=>C.supplyStage(state,d.faction)==='delivered');
  if(supply){
   const paid=C.collectFactionPayment(state);VoidMissions.sync(state,C);save();hud();
   const after=()=>{announce('PAYMENT RECEIVED · '+paid.reduce((n,d)=>n+d.payment,0).toLocaleString()+' credits · '+supply.name.toUpperCase()+' COMPLETE');if(C.supplyOffers(state).length)ask([supplyPrompt],supplyOptions(),HEAD);else resumeWalking();};
   talk('',[iris('There you are. Payment received. Pleasure doing business with you.')],after,'CONTINUE',HEAD);return;
  }
  const remaining=C.factionOffers(state);
  if(state.story.flags.factionFirst&&remaining.length)return irisOffer(remaining[0],false);
  if(C.supplyOffers(state).length)return ask([supplyPrompt],supplyOptions(),HEAD);
  return irisDefault(arg);
 });

 // ---- Recipients (doc 07) ----
 const recipients={
  communion:{who:elara,intro:[
   elara('You must be our delivery. From The Darknet District?'),you('That’s right. Got your equipment.'),
   elara('Good. We’ve been waiting on this shipment. Things have been a little unpredictable lately.'),you('Something going on?'),
   elara('Nothing new, really. The Natural Order’s been making noise again. They don’t much care for the way we do things here.'),you('Because of the AI?'),
   elara('Among other things. They seem convinced we’re building something that’s going to destroy civilization.'),elara('Funny. Most of us are just trying to keep civilization running.'),
   you('Think they’ll cause trouble?'),elara('Hard to say. They’ve been moving ships around near the border. Probably just trying to make a point.'),
   elara('Anyway, that’s above my pay grade. Let’s get this unloaded.')],
   questions:[['YOU DON’T SEEM TOO WORRIED','You don’t seem too worried.','Should I be? They’ve been threatening us since before I was born. Eventually you learn to get on with your day.'],
    ['WHAT’S THEIR PROBLEM WITH AI?','What’s their problem with AI?','They think we’re giving machines too much control. We think they’re afraid of anything they don’t understand. Truth’s probably more complicated.']],
   farewell:'Appreciate the delivery. Tell Admin everything arrived intact.'},
  'natural-order':{who:marcus,intro:[
   marcus('You’re the pilot from The Darknet District?'),you('That’s me. Got a shipment for you.'),
   marcus('About time. We’ve had three deliveries delayed this week.'),you('Pirates?'),
   marcus('Some of it. Communion patrols have been getting a little too curious about what comes through here.'),you('What’s their problem?'),
   marcus('Depends who you ask. Officially, they’re keeping the peace. Unofficially, they don’t like people who refuse to let machines run their lives.'),
   marcus('Funny thing is, we used to get along well enough. Trade, repairs, the occasional argument. Now everyone’s acting like the next war’s just around the corner.'),
   you('You think it is?'),marcus('I think people with expensive ships and important titles have too much time on their hands.'),
   marcus('Me? I just need these parts to keep the machinery running.')],
   questions:[['YOU REALLY DON’T TRUST AI?','You really don’t trust AI?','Nothing wrong with a useful machine. It’s when the machine starts deciding what’s useful about you that I get nervous.'],
    ['THINK THE COMMUNION’S PLANNING SOMETHING?','Think the Communion’s planning something?','Wouldn’t surprise me. But rumors travel faster than ships out here. Half of what you hear is nonsense.']],
   farewell:'Appreciate it. Tell Admin the shipment arrived. And watch yourself on the way back.'}
 };
 // Follow-up deliveries (doc 09): each recipient then raises a homeworld mission, kept as a placeholder.
 recipients.communion.supply=[
  elara('Back again? I was hoping we’d see you.'),you('I’ve got another shipment from The Darknet District.'),elara('Excellent. We’ve been waiting for these components.'),
  elara('Everything looks to be in order. Thank you.'),you('Seems like you need a lot of equipment.'),
  elara('We do. There’s quite a bit of work underway, and the situation with the Natural Order isn’t making things any easier.'),
  elara('Actually, since you’re here, there may be something else you could help us with.'),you('What kind of help?'),
  elara('A delivery on our homeworld. Something that would help our people. I’d rather explain the details once you’re there.')];
 recipients.communion.origin=recipients.communion.supply[recipients.communion.supply.length-1];
 recipients['natural-order'].supply=[
  marcus('Well, look who’s back. Starting to think you’re the only pilot out there who delivers anything on time.'),you('Got another shipment for you.'),
  marcus('Good. We can use these parts.'),marcus('Everything’s here. That’s a relief.'),you('Having problems?'),
  marcus('Nothing we can’t handle. Just seems like every time we get one thing running, something else needs fixing.'),
  marcus('And with the Communion stirring things up, supplies aren’t getting any easier to come by.'),you('Sounds like you could use some help.'),
  marcus('Actually, now that you mention it, there’s another job. Down on our homeworld. Something that could make a real difference to our people.'),you('What needs doing?'),
  marcus('I’ll explain the details when you’re ready to head down there.')];
 recipients['natural-order'].origin=recipients['natural-order'].supply[8];
 const paymentDue=()=>announce('MISSION UPDATE · Return to The Darknet District to collect payment.');
 // After agreeing to a homeworld run: either the shipment is aboard, or it waits for a free hold.
 function loaded(faction){
  const h=C.homeworlds[faction],owed=Object.values(C.supplyDeliveries).some(d=>C.supplyStage(state,d.faction)==='delivered');save();resumeWalking();
  if(C.originState(state,faction)==='loaded'){VoidMissions.track(state,h.contract.id,C);save();announce('SHIPMENT LOADED · '+h.contract.name.toUpperCase()+' tracked.'+(owed?' Iris still owes you for the last delivery.':''));}
  else announce('Your hold is busy. Come back with a free hold to collect the shipment.');
 }
 function originOptions(faction){
  const title=faction==='communion'?'COMMUNION HOMEWORLD MISSION':'NATURAL ORDER HOMEWORLD MISSION',owed=()=>Object.values(C.supplyDeliveries).some(d=>C.supplyStage(state,d.faction)==='delivered');
  return [{label:'I’M INTERESTED',run:()=>{C.acceptOrigin(state,faction);VoidMissions.sync(state,C);loaded(faction);}},
   {label:'NOT RIGHT NOW',quiet:true,run:()=>{save();resumeWalking();if(owed())paymentDue();}}];
 }
 function recipientOptions(faction){const r=recipients[faction],update=()=>announce('MISSION UPDATE · Return to The Darknet District to collect payment.');
  return [...r.questions.map(([label,question,answer])=>({label,quiet:true,run:()=>ask([you(question),r.who(answer)],recipientOptions(faction))})),
   {label:'I’LL LEAVE YOU TO IT',run:()=>leave([you('I’ll leave you to it.'),r.who(r.farewell)],'RETURN TO STATION',update)}];}
 const stationTalk=VoidInteractions.handlers.get('talk');
 VoidInteractions.register('talk',arg=>{
  const faction=Object.keys(recipients).find(id=>D[id].recipient===arg?.item?.character);if(!faction)return stationTalk(arg);
  const r=recipients[faction],delivered=C.deliverFaction(state,faction);
  if(delivered){VoidMissions.sync(state,C);save();if(delivered.kind==='supply')return ask(r.supply,originOptions(faction));return ask(r.intro,recipientOptions(faction));}
  // Agreed earlier with a full hold: the shipment is collected now.
  if(C.originState(state,faction)==='accepted'){C.loadOrigin(state,faction);VoidMissions.sync(state,C);return loaded(faction);}
  // The homeworld offer stays with the recipient until the player takes it.
  if(C.originState(state,faction)==='offered')return ask([r.origin],originOptions(faction));
  return leave([r.who(r.farewell)],'RETURN TO STATION');
 });

 // In NeoChinatown the arrow leads through the District door to Iris when payment is due.
 const factionUpdate=update;
 update=function(dt){factionUpdate(dt);
  if(mode!=='walking'||!walker||state.location!=='earth'||!walkingLocation?.interactions)return;
  const m=VoidMissions.tracked(state,C);if(m?.interaction!=='district-iris')return;
  const f=state.story.flags,goal=walkingLocation.interactions.find(i=>i.id===(!f.districtDoor?'tdd':!f.districtBadge?'district-scan':'district-iris'));
  if(goal){trackedWalkWaypoint=goal;$('walking-caption').textContent='YELLOW OBJECTIVE / '+goal.label;}
 };
})();
