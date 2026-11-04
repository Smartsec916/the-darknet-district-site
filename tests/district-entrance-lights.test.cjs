/* The entrance lamps light the alley face of the District door. They must not be added inside the District: at high quality
   the interior already carries 12 lights, and 14 made materials exceed GL_MAX_VERTEX_UNIFORM_BUFFERS (a compile error that
   left the scene never ready). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('void-runner/neochinatown.js','utf8'),line=src.split('\n').find(l=>l.includes("'district-entrance-light'"));
test('the entrance lamps are skipped when only the interior is built, and still built before areas exist',()=>{
 assert(line,'lamp line present');assert(/if\(typeof area==='undefined'\|\|area!=='interior'\)for\(const \[p,c,i,r\]/.test(line),'guarded by the area');
 const guard=new Function('area',"return typeof area==='undefined'||area!=='interior';");
 assert.equal(guard(undefined),true,'before areas exist (no area variable)');assert.equal(guard('all'),true);assert.equal(guard('street'),true);assert.equal(guard('interior'),false,'not inside the District');
});
test('there are at most two lamps, and one on the low tier',()=>{assert(/\.slice\(0,low\?1:2\)/.test(line));});
