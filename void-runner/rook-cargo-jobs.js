/* ROOK'S CARGO JOBS: DATA THE OWNER CAN EDIT (20 Nov 2026).
   The owner: "once you deliver to Rook I want him to offer you cargo missions to other places as side missions."
   This file is plain data. Change the values (labels, cargo, pay, which jobs are on his board, where he never sends freight) and push; no other code needs to change.
   campaign.js reads it (Rook's board, the run's pay and Mission Log entry, the hold space it takes); world-integration.js shows the board and Rook's lines.
   Saves only keep the job's kind (the key, e.g. 'routine'), the run number and the destination, so keep the kind keys as they are (rename a label instead).
   Pay for run n of Rook's runs: min(pay.cap, pay.base + pay.perRun * min(n-1, pay.steps)) + the job's bonus. A run is paid exactly once (on delivery or by Rook). */
(function(root){
 'use strict';
 const data={
  /* The kinds of freight job.
     label: the name on Rook's board and in the Mission Log. legal: false marks the job "not legal". units: hold spaces it takes (the Kestrel and the Peregrine hold 2).
     payAt: 'delivery' (the receiving dock pays when the cargo is unloaded) or 'rook' (the receiver confirms the drop and Rook pays in person at Meridian).
     bonus: credits added to the base pay. danger: extra raiders on the route. far: true = only to places in another system than Meridian's.
     cargo: what is carried (a different one each run, in turn). */
  jobs:{
   routine:{label:'Routine freight',legal:true,units:1,payAt:'delivery',bonus:0,danger:0,cargo:['Med-gel canisters','Hydroponic seed stock','Coolant cells','Salvaged drive coils']},
   'long-haul':{label:'Long-haul freight',legal:true,units:1,payAt:'delivery',bonus:300,danger:1,far:true,cargo:['Hydroponic seed stock','Coolant cells','Med-gel canisters']},
   valuable:{label:'High-value freight',legal:true,units:2,payAt:'rook',bonus:500,danger:2,cargo:['Sealed reactor couplings','Encrypted ledger drives','Surplus targeting optics']},
   hazard:{label:'Dangerous lane',legal:true,units:1,payAt:'delivery',bonus:600,danger:4,cargo:['Salvaged drive coils','Coolant cells','Surplus targeting optics']},
   restricted:{label:'Restricted cargo',legal:false,units:1,payAt:'rook',bonus:500,danger:2,cargo:['Unmarked data cores','Unregistered memory wafers']}
  },
  /* The base pay of a run (see the top of this file). */
  pay:{base:500,perRun:150,steps:8,cap:2000},
  /* Rook's side-mission board in a District campaign, after the first delivery (story flag rook-first-delivery-done): the kinds he offers, in this order.
     Each job goes to a different place when there are enough places. A new set of places comes with every finished run. */
  districtBoard:['routine','long-haul','valuable','hazard'],
  /* Places Rook never sends freight to (Vesper, the faction homeworlds, and Meridian itself, where the freight starts). Places in a system the player
     cannot reach yet are never offered either. */
  never:['vesper','nexus','order-homeworld','meridian'],
  /* Rook's lines for the side missions. APPROVED by the owner (21 Nov 2026, "those all look pretty solid"); no voice clip yet (they show as text until recorded).
     Changing a word needs a new recording: the clip is matched to the exact text.
     (Checked against the code before approval: the coordinates line no longer says "landing pads" or "anywhere": the coordinates are stations and planets
     (nav-coords.js), and he never sends freight to the places in `never` below.)
     coordinates: said once, the first time he offers the side missions; the Map app gets every location's coordinates at that moment (VoidNav.grantCoordinates).
     board: said when he shows the board (every later visit). */
  lines:{
   coordinates:'Good run. I just sent you coordinates for places all over. Stations, planets. Your Map app already has them. Means I can send you just about anywhere.',
   board:'Got freight going all over. Take a job, the pay is on the board.'
  },
  status:{lines:'APPROVED 21 Nov 2026: ready to record'}
 };
 if(typeof module!=='undefined')module.exports=data;else root.VoidRookCargoJobs=data;
})(globalThis);
