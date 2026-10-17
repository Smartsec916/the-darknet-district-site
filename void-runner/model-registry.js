/* The registry of approved 3D models (graphics brief §6). Gameplay uses stable ids (ship:raider,
   prop:crate); this file maps them to files, so a model can be swapped without touching gameplay.
   Every entry is approved by David and listed in docs/VOID_RUNNER_ASSET_LICENSES.md. If a file fails
   to load, the procedural model is used automatically (asset-pipeline.js).
   scale: model metres -> game units. yaw: turn so the nose points along +z (the game's forward). */
(function(root){
 const quaternius='Quaternius (CC0 1.0)';
 const registry={
  // Pirates and traffic (approved 2026-10-16). The Kestrel and faction ships stay procedural.
  ships:{
   raider:{src:'assets/models/ships/striker.glb',scale:.55,yaw:0,model:'Striker',pack:'Ultimate Spaceships',license:quaternius},
   interceptor:{src:'assets/models/ships/challenger.glb',scale:.45,yaw:0,model:'Challenger',pack:'Ultimate Spaceships',license:quaternius},
   gunship:{src:'assets/models/ships/insurgent.glb',scale:.42,yaw:0,model:'Insurgent',pack:'Ultimate Spaceships',license:quaternius},
   courier:{src:'assets/models/ships/dispatcher.glb',scale:.45,yaw:0,model:'Dispatcher',pack:'Ultimate Spaceships',license:quaternius},
   shuttle:{src:'assets/models/ships/imperial.glb',scale:.32,yaw:0,model:'Imperial',pack:'Ultimate Spaceships',license:quaternius},
   security:{src:'assets/models/ships/omen.glb',scale:.38,yaw:0,model:'Omen',pack:'Ultimate Spaceships',license:quaternius}
  },
  // Meridian exterior cladding (approved 2026-10-16), applied by meridian-kitbash.js wherever the
  // station is built: main menu, campaign and skirmish. Textures 512 px (seen at a distance).
  kit:Object.fromEntries(Object.entries({wall:'Walls/ShortWall_Metal2_Straight',wallDark:'Walls/ShortWall_DarkMetal2_Straight',wallBand:'Walls/ShortWall_Band2_Straight',wallCables:'Walls/TopCables_Straight',deck:'Platforms/Platform_Metal2',rib:'Columns/Column_Large_Straight',pipes:'Props/Prop_PipeHolder',vent:'Props/Prop_Vent_Big',light:'Props/Prop_Light_Wide'})
   .map(([key,model])=>[key,{src:'assets/models/meridian-kit/'+key+'.glb',scale:1,model,pack:'Modular Sci-Fi MegaKit',license:quaternius}])),
  // Station dressing in real metres (approved 2026-10-16).
  props:{
   crate:{src:'assets/models/props/crate.glb',scale:1,model:'Prop_Crate',pack:'Sci-Fi Essentials Kit',license:quaternius},
   'crate-large':{src:'assets/models/props/crate-large.glb',scale:1,model:'Prop_Crate_Large',pack:'Sci-Fi Essentials Kit',license:quaternius},
   barrel:{src:'assets/models/props/barrel1.glb',scale:1,model:'Prop_Barrel1',pack:'Sci-Fi Essentials Kit',license:quaternius},
   'barrel-closed':{src:'assets/models/props/barrel2-closed.glb',scale:1,model:'Prop_Barrel2_Closed',pack:'Sci-Fi Essentials Kit',license:quaternius},
   locker:{src:'assets/models/props/locker.glb',scale:1,model:'Prop_Locker',pack:'Sci-Fi Essentials Kit',license:quaternius},
   'shelves-tall':{src:'assets/models/props/shelves-widetall.glb',scale:1,model:'Prop_Shelves_WideTall',pack:'Sci-Fi Essentials Kit',license:quaternius},
   'shelves-short':{src:'assets/models/props/shelves-wideshort.glb',scale:1,model:'Prop_Shelves_WideShort',pack:'Sci-Fi Essentials Kit',license:quaternius},
   desk:{src:'assets/models/props/desk-medium.glb',scale:1,model:'Prop_Desk_Medium',pack:'Sci-Fi Essentials Kit',license:quaternius},
   // Meridian's crew quarters and bar (approved 2026-10-17). The pack is modelled at about twice real size.
   bunk:{src:'assets/models/meridian-interior/house-bed-bunk.glb',scale:.5,model:'Bed_Bunk',pack:'Ultimate House Interior Pack',license:quaternius},
   toilet:{src:'assets/models/meridian-interior/house-bathroom-toilet.glb',scale:.42,model:'Bathroom_Toilet',pack:'Ultimate House Interior Pack',license:quaternius},
   basin:{src:'assets/models/meridian-interior/house-bathroom-sink.glb',scale:.5,model:'Bathroom_Sink',pack:'Ultimate House Interior Pack',license:quaternius},
   'bar-stool':{src:'assets/models/meridian-interior/house-stool.glb',scale:.55,model:'Stool',pack:'Ultimate House Interior Pack',license:quaternius}
  }
 };
 const assets=root.VoidAssets;
 if(assets){Object.assign(assets.models.ships,registry.ships);assets.models.props=Object.assign(assets.models.props||{},registry.props);assets.models.kit=Object.assign(assets.models.kit||{},registry.kit);}
 if(typeof module!=='undefined')module.exports=registry;else root.VoidModelRegistry=registry;
})(globalThis);
