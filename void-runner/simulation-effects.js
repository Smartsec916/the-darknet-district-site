/* VR owns a detached working state and an inert campaign-effect sink. The original state is never simulated. */
(function(root){
 const clone=value=>JSON.parse(JSON.stringify(value));
 function create(){let session=null;
  return {get active(){return !!session;},get session(){return session;},
   begin(campaign){if(session)throw Error('A simulation already owns the effect boundary.');session={campaign,state:clone(campaign),effects:[],progress:{}};return session;},
   effect(kind,apply,...args){if(session){if(session.effects.length<64)session.effects.push(kind);return false;}return apply(...args);},
   end(){const campaign=session?.campaign;session=null;return campaign;}
  };
 }
 const api={create};if(typeof module!=='undefined')module.exports=api;else root.VoidSimulationEffects=create();
})(globalThis);
