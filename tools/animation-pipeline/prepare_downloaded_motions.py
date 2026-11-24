"""Build local motion packs from inventoried FBXs, including ZIP members.

Use a fresh output directory for a new revision. No source is extracted by name.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import uuid

from prepare_library_candidates import glb_from


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for field in ('inventory','target','blender','output'):
        p.add_argument(field,type=Path)
    p.add_argument('--source-contains',required=True)
    args=p.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    index=json.loads(args.inventory.read_text(encoding='utf8'))['assets']
    selected=[r for r in index if args.source_contains in r['source'] and r['source'].lower().endswith('.fbx')]
    target_hash=hashlib.sha256(args.target.read_bytes()).hexdigest()
    report=[]
    manifest=args.output/'motions.json'
    previous={r['id']:r for r in json.loads(manifest.read_text())} if manifest.exists() else {}
    with tempfile.TemporaryDirectory(dir=args.output) as temp:
        work=Path(temp).resolve()
        for row in selected:
            stem=Path(row['source'].split('!')[-1]).stem
            if stem.lower()=='x bot':
                continue
            key='motion-'+uuid.uuid5(uuid.NAMESPACE_URL,row['source']+row['sha256']).hex[:20]
            dest=args.output/(key+'.glb')
            old=previous.get(key,{})
            if old.get('targetHash')==target_hash and dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest()==old.get('sha256'):
                report.append(old)
                continue
            record=dict(id=key,name=stem,source=row['source'],sourceHash=row['sha256'],targetHash=target_hash,file=dest.name)
            report.append(record)
            try:
                raw=glb_from(row['source'])
                if hashlib.sha256(raw).hexdigest()!=row['sha256']:raise ValueError('Source changed since inventory')
                fbx=work/'source.fbx'
                fbx.write_bytes(raw)
                name=stem.lower()
                record['category']='locomotion' if re.search('walk|strafe|run|jump',name) else 'idle' if 'idle' in name else 'reaction' if re.search('impact|death|fall',name) else 'combat'
                record['loop']=record['category'] in ('locomotion','idle') and not re.search(' to |jump|land',name)
                cfg=work/'motion.json'
                cfg.write_text(json.dumps({'fps':24,'clips':[{'file':str(fbx),'name':key,'loop':record['loop'],'root':'inplace'}]}))
                build=work/'motion.glb'
                result=subprocess.run([str(args.blender),'-b','-t','2','--factory-startup','--disable-autoexec','--python-exit-code','1','-P',
                    str(Path(__file__).with_name('retarget_library.py').resolve()),'--',str(args.target.resolve()),str(cfg),str(build)],
                    capture_output=True,timeout=180)
                match=re.search(rb'^LIBRARY (.+)$',result.stdout,re.M)
                if result.returncode or not match:raise ValueError('Blender failed: '+result.stderr.decode(errors='replace')[-320:])
                summary=json.loads(match[1])[0]
                if summary['mapped']<15 or summary['frames']<2:raise ValueError('Insufficient mapped motion')
                record.update(seconds=summary['seconds'],mapped=summary['mapped'],sha256=hashlib.sha256(build.read_bytes()).hexdigest())
                build.replace(dest)
            except Exception as e:
                record['error']=str(e)
            partial=manifest.with_suffix('.partial')
            partial.write_text(json.dumps(report,indent=2),encoding='utf8')
            partial.replace(manifest)


if __name__=='__main__':
    main()
