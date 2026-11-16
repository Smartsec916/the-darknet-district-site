/* Zoom and detail (David, 16 Nov 2026: "if a player is zooming with the camera I want detail to render").
   The camera app (device-camera.js) narrows the view: at 2x a person 60 m away fills the screen like one 30 m away. Everything outdoors that hides, simplifies
   or stops animating people and props BY DISTANCE must therefore judge the distance as the picture shows it, not as the ground measures it.
     factor(zoom)            1 with no zoom, 1/2 at 2x, 1/3 at 3x
     effective(metres, zoom) the distance to judge by: metres x factor
     now()                   the factor right now (1 unless the camera app is up and zoomed)
   Users: ncz-nightlife.js (who is shown, who walks), ncz-alley.js, ncz-nightclub.js (NULL's interior and people), milked-build.js (the shell's moving parts),
   neochinatown.js (streaming Milked's shell), remote-players.js (other players' name tags and faces). street-sight.js already did this from the camera's own
   field of view; fromFov() is that same rule. PURE except now(). Tests: tests/zoom-detail.test.cjs. */
(function(root){
 'use strict';
 const MIN=.2,REF_FOV=1.05;
 const factor=zoom=>{const z=Number(zoom);return z>1?Math.max(MIN,1/z):1;};
 const effective=(metres,zoom)=>metres*factor(zoom);
 // The same thing from a field of view (radians) against the walking view's: a narrower view is a zoom.
 const fromFov=(fov,ref=REF_FOV)=>{const f=Math.tan((Number(fov)||ref)/2)/Math.tan(ref/2);return Math.max(MIN,Math.min(1,f));};
 // within(metres, limit, zoom): is something at `metres` inside a limit meant for the unzoomed view?
 const within=(metres,limit,zoom)=>effective(metres,zoom)<limit;
 const now=()=>{try{const C=root.VoidDeviceCamera;return C&&C.active?factor(C.zoom):1;}catch{return 1;}};
 const api={MIN,REF_FOV,factor,effective,fromFov,within,now};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidZoom=api;
})(typeof globalThis!=='undefined'?globalThis:this);
