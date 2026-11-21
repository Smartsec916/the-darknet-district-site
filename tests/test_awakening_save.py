"""The Awakening continuation and cloud saves (20 Nov 2026): a character played through Missions 001-012 by the real mission engine (node) passes
void_runner_api.clean_save() unchanged in what matters (missions, credits, the Kestrel, the evidence flag, the in-game wait and feed flags), well under the
256 story flags the server accepts; the server's content check refuses broken new step kinds."""
import json
import subprocess
import unittest
from pathlib import Path

import void_runner_api as vr
import void_runner_live_content as live

ROOT = Path(__file__).resolve().parent.parent
PLAY = r"""
const path=require('path'),fs=require('fs'),R=p=>path.join(process.cwd(),p);
const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),DP=require(R('void-runner/district-people.js'));
B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);const s=C.startDistrictCampaign(C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;
const ev=x=>MC.treeEvent(s,e,x,M,C),pl=(p,x={})=>ev({type:'place',places:p,...x}),k=(m,o)=>m+'/'+o,t=n=>{s.story.flags.gameMin=(s.story.flags.gameMin||0)+n;},T=()=>{for(const x of MC.timersNow(s,e))MC.timerSet(s,x,0);ev({type:'timer'});};
ev({type:'pod-exit',at:1});ev({type:'talk',npcs:['admin']});ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m002-eyes-on-the-street'});pl(['null']);ev({type:'photo',subjects:['juno-vex','halden-reyes']});
ev({type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:['m002-eyes-on-the-street/photograph'],place:'null',at:1}});ev({type:'talk',npcs:['admin']});
ev({type:'accept',mission:'m003-corporate-connections'});pl(['milked']);ev({type:'talk',npcs:['milked-eva']});ev({type:'talk',npcs:['milked-fish']});t(400);pl(['x']);
const m4='m004-a-promising-investment';pl(['under-tea-room']);for(const [a,b] of [['observe','locate'],['observe','blend-in'],['overhear','overhear'],['report','report']])ev({type:a,step:k(m4,b)});
const m5='m005-behind-closed-doors';pl(['avenue']);pl(['avenue']);pl(['avenue'],{apt:m5+'/reyes',mod:'hall'});ev({type:'hack',ap:'reyes/hall.d0',mission:m5});pl(['avenue'],{apt:m5+'/reyes',mod:'flat'});ev({type:'apt-use',mission:m5,apt:'reyes',object:'computer',mod:'flat'});ev({type:'collect',step:k(m5,'copy')});pl(['avenue']);ev({type:'report',step:k(m5,'send')});
const m6='m006-hostile-takeover';pl(['avenue']);for(const md of ['lobby','hall','office'])pl(['avenue'],{apt:m6+'/veyra',mod:md});ev({type:'apt-use',mission:m6,apt:'veyra',object:'manager-pc',mod:'office'});ev({type:'collect',step:k(m6,'download')});ev({type:'collect',step:k(m6,'documents')});pl(['avenue']);T();T();pl(['x']);
const m7='m007-the-house-always-wins';pl(['under-fight-pit']);ev({type:'observe',step:k(m7,'find-juno')});ev({type:'overhear',step:k(m7,'observe')});ev({type:'photo',subjects:['blackrock-associate']});ev({type:'tail',step:k(m7,'follow')});ev({type:'observe',step:k(m7,'see-entrance')});ev({type:'photo',subjects:['blackrock-entrance']});ev({type:'report',step:k(m7,'send-location')});
const m8='m008-private-network';pl(['far-south']);pl(['far-south']);ev({type:'observe',step:k(m8,'locate')});ev({type:'hack',ap:'biz-main-w-166',mission:m8});pl(['x'],{apt:m8+'/contractor',mod:'shop'});ev({type:'apt-use',mission:m8,apt:'contractor',object:'computer',mod:'shop'});ev({type:'apt-use',mission:m8,apt:'contractor',object:'panel',mod:'maint'});ev({type:'collect',step:k(m8,'destination')});ev({type:'collect',step:k(m8,'records')});pl(['far-south']);
const m9='m009-ghost-in-the-network';pl(['corporate']);ev({type:'observe',step:k(m9,'locate')});ev({type:'hack',ap:'biz-corp-s-40',mission:m9});pl(['x'],{apt:m9+'/facility',mod:'servers'});pl(['x'],{apt:m9+'/facility',mod:'servers'});for(const o of ['core']){ev({type:'apt-use',mission:m9,apt:'facility',object:o,mod:'servers'});}ev({type:'hack',ap:'facility/servers.s1',mission:m9});ev({type:'apt-use',mission:m9,apt:'facility',object:'terminal',mod:'servers'});ev({type:'apt-use',mission:m9,apt:'facility',object:'core',mod:'servers'});pl(['corporate']);
const m10='m010-the-price-of-admission';t(61);pl(['x']);ev({type:'feed-stage',mission:m10,feed:'br-04',stage:'saved'});T();pl(['district']);
const m11='m011-leverage';pl(['district-meeting']);ev({type:'report',step:k(m11,'deliver')});MC.mechanicsNow(s,e);t(121);ev({type:'game-wait',step:k(m11,'await-sale')});ev({type:'talk',npcs:['admin']});for(let i=0;i<3;i++)ev({type:'heard',mission:m11});
pl(['x']);ev({type:'v1-app',app:'loadout'});pl(['port']);pl(['landing-pad']);ev({type:'flight',stage:'board'});for(let i=0;i<4;i++)T();ev({type:'flight',stage:'launch'});ev({type:'flight',stage:'jump',place:'meridian'});pl(['meridian']);ev({type:'talk',npcs:['rook']});ev({type:'heard',mission:'m012-first-cargo-delivery'});
process.stdout.write(JSON.stringify({...s,savedAt:1700000000000}));
"""


class AwakeningSaveTests(unittest.TestCase):
    def test_full_run_save_is_kept_by_clean_save(self):
        out = subprocess.run(['node', '-e', PLAY], cwd=str(ROOT), capture_output=True, text=True, check=True)
        save = json.loads(out.stdout)
        ids = ['m%03d' % n for n in range(1, 13)]
        done = {k: v['completed'] for k, v in save['universe']['missions'].items()}
        for i in ids:
            self.assertTrue(any(k.startswith(i + '-') and v for k, v in done.items()), i + ' completed in the engine run')
        cleaned = vr.clean_save(save)
        flags = cleaned['story']['flags']
        self.assertLess(len(flags), 200, 'well under the 256 story flags the server accepts')
        self.assertEqual(flags.get('evidence'), save['story']['flags']['evidence'])
        self.assertIn('induction-rec', flags['evidence'])
        self.assertEqual(flags.get('ts_first-cargo-delivery'), True)
        self.assertEqual(flags.get('shipAccess'), 'granted')
        self.assertIs(flags.get('rook-first-delivery-done'), True, 'the shared flag survives clean_save')
        self.assertEqual(cleaned['ownedShips'].count('starter'), 1)
        self.assertEqual(cleaned['credits'], save['credits'])
        self.assertGreaterEqual(cleaned['credits'], 25000 + 500)
        for k, v in cleaned['universe']['missions'].items():
            self.assertEqual(v['completed'], save['universe']['missions'][k]['completed'])

    def test_server_refuses_broken_new_kinds(self):
        out = subprocess.run(['node', '-e', "const MC=require('./void-runner/mission-content.js'),MS=require('./void-runner/main-story.js'),G=require('./void-runner/mission-givers.js');process.stdout.write(JSON.stringify(MC.treesContent(MS.trees(),{givers:G.roster()}).trees))"],
                             cwd=str(ROOT), capture_output=True, text=True, check=True)
        trees = json.loads(out.stdout)
        content = {'format': 'darknet-district-mission-content', 'version': 1, 'trees': trees}
        base = [p for p in live.check(content)]
        self.assertEqual(base, [], 'the shipped trees pass the server check')
        import copy
        m4, m11 = 3, 10
        for change in [lambda t: t[0]['missions'][m4]['objectives'][4].update(near=500), lambda t: t[0]['missions'][m4]['objectives'][4].pop('say'),
                       lambda t: t[0]['missions'][m11]['objectives'][2].update(minutes=0), lambda t: t[0]['missions'][m11]['objectives'][1].update(evidence=['ghost']),
                       lambda t: t[0]['missions'][m4]['cast'][0].update(model='dragon'), lambda t: t[0]['missions'][m4]['evidence'][0].update(text='<b>x</b>'),
                       lambda t: t[0]['missions'][9]['objectives'][1].update(stage='later'), lambda t: t[0]['missions'][m11]['objectives'][3].pop('via'),
                       lambda t: t[0]['missions'][m11]['objectives'][0].update(unseen=True), lambda t: t[0]['missions'][m11]['unlocks'].append({'kind': 'evidence', 'id': 'ghost'})]:
            bad = copy.deepcopy(content)
            change(bad['trees'])
            self.assertTrue([p for p in live.check(bad)], 'refused')


if __name__ == '__main__':
    unittest.main()
