/* Map spaces and exploration fog for areas that are separate scenes (Corporate District, later the Zen Zephyr Temple).
   NeoChinatown's own map (district-map.js) is unchanged; a separate area registers a SPACE here and district-map.js draws it with this fog.
   PURE: runs in Node and the browser (tests/area-map.test.cjs).
   Fog is a grid of cells packed into bits and stored as base64 text in story.flags[space.flag] (a safe string, under 200 characters), so it saves and restores
   with the normal save and needs no server change. A save made before an area existed simply has no flag and starts unexplored. */
(function(root){
 'use strict';
 const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 const spaces=new Map();
 // bounds: [x0,x1,z0,z1] in world metres, cell: metres per fog cell.
 function createFog(bounds,cell=8){
  const [x0,x1,z0,z1]=bounds,w=Math.ceil((x1-x0)/cell),h=Math.ceil((z1-z0)/cell),bits=new Uint8Array(w*h);
  const index=(x,z)=>{const i=Math.floor((x-x0)/cell),j=Math.floor((z-z0)/cell);return i<0||j<0||i>=w||j>=h?-1:j*w+i;};
  const fog={bounds,cell,w,h,bits,
   // Reveal every cell whose centre is within `radius` of (x,z). Returns the number of cells newly revealed.
   reveal(x,z,radius=14){let n=0;const r=Math.ceil(radius/cell)+1,ci=Math.floor((x-x0)/cell),cj=Math.floor((z-z0)/cell);
    for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){if(i<0||j<0||i>=w||j>=h)continue;const cx=x0+(i+.5)*cell,cz=z0+(j+.5)*cell;if(Math.hypot(cx-x,cz-z)<=radius&&!bits[j*w+i]){bits[j*w+i]=1;n++;}}return n;},
   isExplored(x,z){const k=index(x,z);return k>=0&&bits[k]===1;},
   explored(){let n=0;for(const b of bits)n+=b;return n;},total:w*h,
   fraction(){return bits.length?fog.explored()/bits.length:0;},
   // Packed to base64 (6 cells per character). The first character is a format tag, so a future change can still read old saves.
   encode(){let s='A';for(let i=0;i<bits.length;i+=6){let v=0;for(let k=0;k<6;k++)v|=(bits[i+k]?1:0)<<k;s+=B64[v];}return s;},
   decode(text){if(typeof text!=='string'||text[0]!=='A'||text.length!==1+Math.ceil(bits.length/6))return false;const next=new Uint8Array(bits.length);
    for(let c=1;c<text.length;c++){const v=B64.indexOf(text[c]);if(v<0)return false;for(let k=0;k<6;k++){const i=(c-1)*6+k;if(i<bits.length)next[i]=(v>>k)&1;}}bits.set(next);return true;},   // all or nothing: a bad value never wipes what is known
   clear(){bits.fill(0);}};
  return fog;
 }
 // A space: {id, name, flag (story.flags key for the fog), bounds, cell, model():{streets,buildings,walls,pois,bounds}}. Registered once by the area's module.
 function register(space){if(!space?.id||(!space.publicMap&&!space.flag)||!Array.isArray(space.bounds))throw new Error('A map space needs id and bounds, plus a flag for exploration fog.');spaces.set(space.id,{cell:8,...space});return spaces.get(space.id);}
 const get=id=>spaces.get(id)||null,list=()=>[...spaces.values()];
 // Save and restore through story.flags. Never throws: an unreadable value just means "unexplored".
 function load(space,flags){const fog=createFog(space.bounds,space.cell);try{fog.decode(flags?.[space.flag]);}catch{}return fog;}
 function save(space,fog,flags){if(!flags)return false;const text=fog.encode();if(text.length>190)return false;flags[space.flag]=text;return true;}
 const api={createFog,register,get,list,load,save,spaces};
 if(root.VoidLowQuay?.mapSpace)register(root.VoidLowQuay.mapSpace);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidAreaMap=api;
})(typeof globalThis!=='undefined'?globalThis:this);
