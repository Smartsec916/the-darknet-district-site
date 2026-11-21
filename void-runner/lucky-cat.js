/* THE LUCKY CAT (maneki-neko): ONE MODEL AND ONE STAND-IN FOR EVERY PLACE THAT SHOWS ONE. First made for Milked's reception desk (milked-build.js: the owner's Meshy
   model, docs/development/MILKED.md); since 20 Nov 2026 also on the tea station of the underground tea room (module-build.js 'tea-under'; the owner: "put a maneki-neko on
   the tea station counter"). The model has no animation (a still figure: no waving paw). FILE: its path under assets/models/. PARTS: the stand-in built in code when the
   model is missing or on Low (two balls and a raised paw), in metres from the point it stands on; each builder supplies its own ball / box and material.
   Pure data (Node tests and the browser). */
(function(root){
 'use strict';
 const FILE='milked/milked-lucky-cat.glb',HEIGHT=.3,COLOUR=['#e9e4dc','#55504a'];
 // [kind, size (a ball's diameter, or a box's [w, h, d]), x, y, z]
 const PARTS=[['ball',.16,0,.08,0],['ball',.12,0,.2,0],['box',[.03,.09,.03],.07,.25,0]];
 /* Build the stand-in at (x, y, z) with the caller's helpers: ball(diameter, x, y, z), box(w, h, d, x, y, z). */
 function standIn(x,y,z,{ball,box}){for(const [k,s,dx,dy,dz] of PARTS){if(k==='ball')ball(s,x+dx,y+dy,z+dz);else box(s[0],s[1],s[2],x+dx,y+dy,z+dz);}}
 const api={FILE,HEIGHT,COLOUR,PARTS,standIn};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidLuckyCat=api;
})(typeof globalThis!=='undefined'?globalThis:this);
