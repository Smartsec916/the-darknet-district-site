const test=require('node:test'),assert=require('node:assert/strict');
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','void-runner','assets','audio','voice'),manifest=require(path.join(dir,'manifest.json'));

test('every fixed NPC line has a recorded clip and the manifest matches the game',()=>{
  // Fails if dialogue was edited without re-running tools/audio/extract-lines.cjs and generate.py.
  execFileSync(process.execPath,[path.join(__dirname,'..','tools','audio','extract-lines.cjs'),'--check'],{stdio:'pipe'});
});
test('each recurring NPC has a distinct voice and the player is never voiced',()=>{
  const voices=Object.values(manifest.cast).map(c=>c.voice);assert.equal(new Set(voices).size,voices.length,'no two NPCs share a voice');
  for(const who of ['mara','elias','rook','admin','iris','elara','marcus'])assert(manifest.cast[who],who+' is cast');
  assert(!Object.values(manifest.lines).some(l=>['pilot','you'].includes(l.speaker)));
  assert.equal(manifest.cast.iris.effect,'android');assert.equal(manifest.cast.elias.effect,'hologram');
});
test('clips are small Ogg files with stable ids',()=>{
  for(const [id,l] of Object.entries(manifest.lines)){
    assert.match(id,/^[a-z]+(-[a-z]+)*-[0-9a-f]{10}$/);assert.equal(l.file,id+'.ogg');
    const bytes=fs.readFileSync(path.join(dir,l.file));assert.equal(bytes.subarray(0,4).toString(),'OggS',l.file);assert(bytes.length<200000,l.file+' size');
  }
});
