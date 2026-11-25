/* Writes a plain (uncompressed) copy of a GLB whose views use EXT_meshopt_compression, so numpy tools (retarget_world.py) can read its animations.
   Lossless: the same decoder the game ships. Usage: node unmeshopt.cjs IN.glb OUT.glb */
const L=require('../assets/glb-lib.cjs');
(async()=>{await L.ready;const [i,o]=process.argv.slice(2),g=L.parseGlb(i);
 for(const k of ['extensionsUsed','extensionsRequired'])if(g.json[k]){g.json[k]=g.json[k].filter(e=>e!=='EXT_meshopt_compression');if(!g.json[k].length)delete g.json[k];}
 L.writeGlb(g.json,[g.bin],o);console.log('wrote',o);})();
