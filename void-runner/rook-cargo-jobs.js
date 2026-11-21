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
     cargo: what is carried (a different one each run, in turn) on the older board; the District board picks its goods from `procedural` below
     (valueGoods: true = only goods marked value). */
  jobs:{
   routine:{label:'Routine freight',legal:true,units:1,payAt:'delivery',bonus:0,danger:0,cargo:['Med-gel canisters','Hydroponic seed stock','Coolant cells','Salvaged drive coils']},
   'long-haul':{label:'Long-haul freight',legal:true,units:1,payAt:'delivery',bonus:300,danger:1,far:true,cargo:['Hydroponic seed stock','Coolant cells','Med-gel canisters']},
   valuable:{label:'High-value freight',legal:true,units:2,payAt:'rook',bonus:500,danger:2,valueGoods:true,cargo:['Sealed reactor couplings','Encrypted ledger drives','Surplus targeting optics']},
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
  /* PROCEDURAL BOARD (District campaign, 21 Nov 2026). The owner: "For Rook after this make cargo missions Procedural".
     rook-cargo-gen.js builds each job of the districtBoard kinds above from these lists, seeded per player and per run, so a reload shows the same board
     and every finished run brings a new one. All of this is plain flavour text: change, add or remove entries freely (old saves keep their accepted job's text).
     goods: name (what it is), container (what it comes in), min/max (how many containers), kg (each container), value: true = can be high-value freight.
     holdKg: the weight one hold space takes (a heavier load takes more spaces, never more than the ship's hold).
     distance: pay factors added for a landing (a planet's surface), another system, and a faction's system. variance: +/- this share of the pay, at random.
     extraSpace: pay added (as a share) for each hold space beyond the kind's own. titles: the first word of a job's name, and the word for the trip. */
  procedural:{
   goods:[
    {name:'general freight',container:'sealed crates',min:3,max:10,kg:180,value:true},
    {name:'medical supplies',container:'cases',min:6,max:20,kg:40,value:true},
    {name:'machine parts',container:'crates',min:3,max:9,kg:260},
    {name:'data cores',container:'padded cases',min:2,max:6,kg:25,value:true},
    {name:'perishable food',container:'cold boxes',min:6,max:16,kg:70},
    {name:'water filters',container:'crates',min:4,max:12,kg:90},
    {name:'coolant cells',container:'racks',min:2,max:8,kg:150},
    {name:'spare electronics',container:'cases',min:4,max:14,kg:35,value:true},
    {name:'building materials',container:'pallets',min:2,max:6,kg:420}
   ],
   holdKg:1200,
   distance:{landing:.1,interstellar:.3,faction:.15},
   variance:.1,
   extraSpace:.15,
   titles:{first:['Standard','Priority','Quiet','Steady','Short-notice','Overnight','Scheduled'],trip:['run','haul','drop','delivery']}
  },
  /* Rook's lines for the side missions. APPROVED by the owner (21 Nov 2026, "those all look pretty solid"); recorded in his chosen voice (extra/rook-coordinates, extra/rook-board).
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
