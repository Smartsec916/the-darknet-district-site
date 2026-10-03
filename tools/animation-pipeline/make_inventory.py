"""Convert Blender's FBX scan into a reviewed-work queue, not runtime assets."""
import json, re, sys
from pathlib import Path

scan_path, output_path = map(Path, sys.argv[1:3])
raw = json.loads(scan_path.read_text(encoding='utf-8'))


def classify(filename):
    name = filename.lower()
    if any(x in name for x in ('hammer','blacksmith','nail gun','saw','sawzall')):
        return 'work', 'mechanic', ['workshop','station'], 'tool'
    if any(x in name for x in ('pistol','rifle','shotgun','rpg','gunfu','execution','combat','fight','boxing','kick','sword','knife')):
        weapon = next((x for x in ('pistol','rifle','shotgun','rpg','sword','knife') if x in name), None)
        return 'combat', 'security', ['station','derelict'], weapon
    if any(x in name for x in ('dance','party','flirty','drink','twist','shimmy','robot')):
        return 'nightlife', 'civilian', ['district','station'], 'drink' if 'drink' in name else None
    if any(x in name for x in ('pilot','driving','flying')):
        return 'pilot', 'pilot', ['cockpit'], None
    if any(x in name for x in ('zero','floating','space','suit','helmet')):
        return 'eva', 'crew', ['station','space'], 'suit' if 'suit' in name or 'helmet' in name else None
    if any(x in name for x in ('sit','couch','laptop')):
        return 'sitting', 'civilian', ['station','district'], 'chair' if 'laptop' not in name else 'laptop'
    if any(x in name for x in ('typing','clipboard','computer','lever')):
        return 'work', 'worker', ['station','district'], 'terminal' if 'typing' in name or 'computer' in name else 'clipboard'
    if any(x in name for x in ('smok','lean')):
        return 'social', 'civilian', ['district','station'], 'cigarette' if 'smok' in name else None
    if any(x in name for x in ('clap','laugh','shrug','headtilt','look','point','talk','conversation','gesture','facepalm','fistpump')):
        return 'conversation', 'civilian', ['station','district'], None
    if 'idle' in name:
        return 'idle', 'civilian', ['station','district'], None
    return 'reaction', 'civilian', ['station','district'], None


def rig_type(bones):
    if any(name.startswith('mixamorig:') for name in bones): return 'Mixamo'
    if any(name.startswith('Character1_') for name in bones): return 'HumanIK'
    if 'pelvis' in bones and 'spine_01' in bones: return 'Unreal'
    return 'Unreadable'


entries=[]
for item in raw:
    filename=item['filename'];name=filename[:-4];category,role,locations,prop=classify(name)
    rig=rig_type(item.get('boneNames',[]))
    weapon=prop if prop in ('pistol','rifle','shotgun','rpg','sword','knife') else None
    if weapon:prop=None
    loop_candidate=bool(re.search(r'idle|loop|dance|typing|floating|leaning|driving|flying',name,re.I))
    if item.get('error'):status='DISABLED'
    elif rig!='Mixamo':status='NEEDS_RETARGET'
    elif prop:status='NEEDS_PROP'
    else:status='NEEDS_REVIEW'
    if name in ('Idle_FightingIdle_mixamo','Clap_SlowClap_mixamo'):status='NEEDS_REVIEW'
    poc_clip={'Idle_FightingIdle_mixamo':'idle_fighting','Clap_SlowClap_mixamo':'clap_slow'}.get(name)
    entries.append({
      'id':re.sub(r'[^a-z0-9]+','_',name.lower()).strip('_'),
      'sourceFilename':filename,
      'sourceRig':rig,
      'boneCount':item.get('bones'),
      'sourceFrames':item.get('frames'),
      'sourceFps':item.get('fps'),
      'sourceDurationSeconds':item.get('durationSec'),
      'categoryCandidate':category,
      'loopCandidate':loop_candidate,
      'horizontalTravelMeasuredMeters':item.get('horizontalTravelM'),
      'rootMotionPolicy':'REVIEW' if item.get('horizontalTravelM') is None else 'IN_PLACE_CANDIDATE' if category in ('idle','conversation','sitting','work','nightlife') else 'REVIEW',
      'weaponType':weapon,
      'requiredPropCandidate':prop,
      'characterRolesCandidate':[role],
      'locationTagsCandidate':locations,
      'blendInSecondsCandidate':0.3,
      'blendOutSecondsCandidate':0.3,
      'priorityCandidate':1 if category in ('idle','work','conversation') else 2,
      'variantGroupCandidate':re.sub(r'_(heavy|medium|light|0[1-9]|0?[1-9]|mixamo|humanik.*|ue)$','',name.lower()),
      'status':status,
      'conversionRequired':True,
      'safeForProduction':False,
      'proofOfConcept':{'asset':'void-runner/assets/animations/mara-poc.glb','clip':poc_clip,'babylonPlaybackVerified':True} if poc_clip else None,
      'notes':item.get('error','Actual FBX opened in Blender. Category, loop, prop and role are candidates; visual review is still required.'),
    })
output={'schema':1,'sourceArchive':'VOID_RUNNER_KEEP.zip','canonicalRig':'VR_Humanoid_v1','sourceCount':len(entries),
        'warning':'The supplied TXT uses seven older generic names; actual ZIP filenames are authoritative. No FBX is shipped to players.',
        'animations':entries}
output_path.parent.mkdir(parents=True,exist_ok=True)
output_path.write_text(json.dumps(output,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('CATALOG',len(entries),output_path)
