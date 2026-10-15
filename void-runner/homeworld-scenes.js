/* Homeworld scenes (design doc 10): Dr. Adrian Kess on The Nexus and Daniel Mercer on the Natural
   Order homeworld receive Elara's and Marcus's shipments and offer optional work for a faction ship
   module. Dialogue is David's script; lines marked UNREVIEWED are Claude's placeholders. */
(function(){
 for(const id of ['nexus','order-homeworld'])VoidExplorationData.locations['planet-'+id]=VoidPlanets.layout(id);
 Object.assign(characters,{kess:{name:'Dr. Adrian Kess',role:'NEXUS INFRASTRUCTURE RECOVERY COORDINATOR'},mercer:{name:'Daniel Mercer',role:'AGRICULTURAL SUPPLY COORDINATOR'}});
 const line=who=>text=>({who,text}),you=line('pilot'),kess=line('kess'),mercer=line('mercer');
 const H=C.homeworlds,factionOf={kess:'communion',mercer:'natural-order'};
 // Land on a homeworld into its own walkable area instead of a station hangar.
 const homeDock=dock;
 dock=async function(tab='dock'){if(tab==='dock'&&!(walkingLocation&&walker)&&VoidUniverse.locations[state.location]?.planet)return enterWalking('planet-'+state.location);return homeDock(tab);};
 const say=(lines,after)=>talk('',lines,()=>{after?.();resumeWalking();},'RETURN','');
 const choose=(lines,options)=>{let choices=null;const menu=()=>{const last=lines[lines.length-1];talk('',[last],menu,'','');speech.shown=last.text.length;$('speech-next').style.display='none';screen.querySelector('.dialogue-window')?.classList.add('choice-menu');choices=options;
   screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend',options.map((o,i)=>button(o.label,'home-choice:'+i,o.quiet===true)).join(''));
   const pick=e=>{const a=e.target.closest('button')?.dataset.action;if(!a?.startsWith('home-choice:')||!choices)return;screen.removeEventListener('click',pick);const o=choices[Number(a.split(':')[1])];choices=null;speech=null;VoidAudio.cancel();o.run();};
   screen.addEventListener('click',pick);};
  if(lines.length>1)talk('',lines.slice(0,-1),menu,'NEXT →','');else menu();};
 const scripts={
  communion:{who:kess,
   arrival:[kess('You must be the pilot Elara sent.'),you('Got a shipment for you.'),kess('Good. Very good. We’ve been waiting for these supplies.'),
    kess('Everything’s here. Thank you. You have no idea how difficult it has become to keep things functioning.'),you('What happened here?'),
    kess('The Nexus happened. Or rather, what happened to it.'),kess('The Natural Order used an electromagnetic weapon against our central systems. The damage was catastrophic.'),
    you('Looks like you’re still recovering.'),kess('We are. Most of our people spent their entire lives connected to the Nexus. It helped us communicate, work, learn... practically everything.'),
    kess('Without it, many of us are having to learn how to live all over again.'),you('And the people praying?'),
    kess('Some believe the Nexus can hear them. Others simply hope that one day it will answer.'),kess('Actually, there may be something you could help us with.')],
   offer:[kess('We have equipment that needs repairing, supplies that need moving, and people who could use a little help.'),you('What kind of work?'),
    kess('Nothing glamorous. Repairing essential systems. Delivering medical supplies. Helping restore basic services.'),you('What’s the payment?'),
    kess('We have a scanner upgrade. Communion technology. It can significantly reduce the time your ship needs to acquire a missile lock.'),you('Sounds useful.'),
    kess('It is. But I should warn you about something.'),you('What?'),
    kess('The Natural Order won’t appreciate seeing Communion technology installed on your ship. Particularly something like this.'),you('I’ll keep that in mind.'),kess('So, are you interested?')],
   labels:['I’LL HELP','TELL ME MORE ABOUT THE SCANNER','NOT RIGHT NOW'],accept:'I’ll help.',decline:[you('Not right now.'),kess('Understood. The offer will remain open.')],
   info:'COMMUNION TARGETING SCANNER · Sensor module. Missile lock-on time ×0.7 (Kestrel 1.5 s → 1.05 s). Range, damage and ammunition unchanged. Fit it at any hangar maintenance terminal.',
   // UNREVIEWED: Kess hands over the reward.
   reward:kess('Thank you. As promised, the scanner. Any hangar can fit it to your ship.'),
   title:'HELPING HANDS',done:{'nexus-depot':'Medical supplies collected. Take them to the aid station.','nexus-aid':'Supplies delivered to the aid station.','nexus-relay':'Relay junction repaired. The sparks die away.','nexus-power':'Power terminal restored. Grid 04 is back online.'}},
  'natural-order':{who:mercer,
   arrival:[mercer('You the pilot Marcus sent?'),you('That’s right. Got your equipment.'),mercer('Good. We could certainly use it.'),mercer('Everything’s here. Appreciate it.'),
    you('Looks like you’ve got plenty of work.'),mercer('Always do. Crops don’t plant themselves. Machines don’t fix themselves either.'),you('Ever think about automating some of it?'),
    mercer('We automate what makes sense. But there’s a difference between a machine doing a job and a machine deciding how we ought to live.'),
    mercer('People here prefer to make their own decisions.'),you('Fair enough.'),mercer('Actually, if you’ve got some time, we could use another pair of hands.')],
   offer:[mercer('We’ve got farms waiting on equipment, settlements short on food, and solar installations that need replacement parts.'),you('Sounds like delivery work.'),
    mercer('Mostly. Some hands-on work too.'),you('What’s the payment?'),mercer('We’ve got a set of maneuvering thrusters. Simple design, reliable components, and plenty of power.'),
    you('What do they do?'),mercer('Improve your ship’s handling. Faster maneuvering, better response when changing direction.'),you('Sounds useful.'),
    mercer('Just understand something. The Communion won’t be thrilled if they see Natural Order hardware bolted onto your ship.'),you('Why?'),
    mercer('They don’t particularly like our approach to engineering. And they like being reminded of it even less.'),mercer('So, interested?')],
   labels:['I’LL HELP','TELL ME MORE ABOUT THE THRUSTERS','NOT RIGHT NOW'],accept:'I’ll help.',decline:[you('Not right now.'),mercer('Suit yourself. We’ll have work if you change your mind.')],
   info:'NATURAL ORDER MANEUVERING THRUSTERS · Thruster module. Turn rates ×1.12, turn response ×1.4, quicker settling ×1.25. Top speed, weapons and shields unchanged. Fit them at any hangar maintenance terminal.',
   // UNREVIEWED: Mercer hands over the reward.
   reward:mercer('Good work. The thrusters are yours. Any hangar can fit them.'),
   title:'KEEPING THINGS RUNNING',done:{'order-depot':'Farm equipment loaded. Take it to the farm.','order-farm':'Equipment delivered to the farm.','order-granary':'Food crates loaded. Take them to the distribution point.','order-market':'Food delivered to the distribution point.','order-workshop':'Replacement solar parts collected.','order-solar':'Solar installation repaired.'}}
 };
 function offer(faction,opening){
  const s=scripts[faction],options=[
   {label:s.labels[0],run:()=>{if(C.acceptWork(state,faction)){VoidMissions.track(state,H[faction].work.id,C);save();}say([you(s.accept)],()=>announce(s.title+' ACCEPTED · '+(VoidMissions.tracked(state,C)?.objective||'')));}},
   {label:s.labels[1],quiet:true,run:()=>{announce(s.info);offer(faction,false);}},
   {label:s.labels[2],quiet:true,run:()=>say(s.decline)}];
  choose(opening?s.offer:[s.offer[s.offer.length-1]],options);
 }
 VoidInteractions.register('homeworld-talk',({item})=>{
  const faction=factionOf[item.character],s=scripts[faction];
  if(C.deliverOrigin(state,faction)){VoidMissions.sync(state,C);save();return talk('',s.arrival,()=>offer(faction,true),'NEXT →','');}
  const work=C.workState(state,faction);
  if(work==='offered')return offer(faction,false);
  if(work==='accepted'&&C.workReady(state,faction)){C.completeWork(state,faction);VoidMissions.sync(state,C);save();return say([s.reward],()=>announce(s.title+' COMPLETE · '+P.modules[H[faction].reward].name+' added to your equipment. Fit it at any hangar.'));}
  if(work==='accepted'){announce(s.title+' · '+(VoidMissions.all(state,C).find(m=>m.id===H[faction].work.id)?.objective||''));return resumeWalking();}
  announce(characters[item.character].name+' is busy with the recovery work.');resumeWalking();
 });
 VoidInteractions.register('homeworld-task',({item})=>{
  const faction=item.id.startsWith('nexus')?'communion':'natural-order';
  if(C.workStep(state,faction,item.id)){VoidMissions.sync(state,C);save();VoidAudio.event?.('confirm');announce(scripts[faction].done[item.id]+(C.workReady(state,faction)?' Return to '+(faction==='communion'?'Dr. Adrian Kess':'Daniel Mercer')+'.':''));}
  resumeWalking();
 });
})();
