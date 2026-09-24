"""Validate non-premium progression independently of account entitlements."""
import json

FLAGS = 'move look sprint jump interact pickup draw aim fire reload holster groundCombat inventory sightOwned sightEquipped sightAim board throttle steer roll navigation jumpTravel dock shipInventory hangar moduleInstalled vendor modulePurchased purchasedInstalled laserCombat missileSelected targetSelected missileLocked missileFired'.split()
MODULES = {'capacitor':'power','cooling':'cooling','pulse':'weapon','shield':'shield','engine':'engine'}

def clean_progression(raw, locations):
    if not isinstance(raw, dict) or len(json.dumps(raw)) > 16000:
        raise ValueError('Invalid progression state.')
    def count(value, maximum, default=0):
        if value is None: return default
        if type(value) is not int or not 0 <= value <= maximum: raise ValueError('Invalid equipment quantity.')
        return value
    def entries(value, allowed, limit=64):
        if not isinstance(value,list) or len(value)>limit or any(type(x) is not str or x not in allowed for x in value): raise ValueError('Invalid inventory.')
        return list(dict.fromkeys(value))
    flags=raw.get('flags',{})
    if not isinstance(flags,dict) or any(k not in FLAGS or type(v) is not bool for k,v in flags.items()): raise ValueError('Invalid tutorial flags.')
    p=raw.get('personal',{}); e=raw.get('equipment',{})
    if not isinstance(p,dict) or not isinstance(e,dict): raise ValueError('Invalid equipment.')
    owned=entries(e.get('owned',[]),MODULES)
    installed={}
    for ship,slots in e.get('installed',{}).items():
        if ship not in ['starter','ship2','ship3'] or not isinstance(slots,dict): raise ValueError('Invalid ship slots.')
        installed[ship]={}
        for slot,item in slots.items():
            if slot not in MODULES.values() or item is not None and (item not in owned or MODULES[item]!=slot): raise ValueError('Incompatible module.')
            installed[ship][slot]=item
    attachments=entries(p.get('attachments',[]),['red-dot'])
    optic=p.get('optic')
    if optic is not None and optic not in attachments: raise ValueError('Unowned attachment.')
    location=raw.get('checkpoint',{}).get('location')
    if location not in locations: raise ValueError('Invalid safe checkpoint.')
    reputation=raw.get('reputation',{})
    factions=['player','civilian','pirate','erebus-local','sol-local','communion','natural-order','neutral']
    if not isinstance(reputation,dict) or any(k not in factions or type(v) is not int or abs(v)>100 for k,v in reputation.items()): raise ValueError('Invalid reputation.')
    relays=raw.get('relays',{})
    if not isinstance(relays,dict) or any(k not in ['erebus','sol'] or v not in ['online','offline','damaged'] for k,v in relays.items()): raise ValueError('Invalid relays.')
    cargo=raw.get('cargo',[])
    if not isinstance(cargo,list) or len(cargo)>3: raise ValueError('Invalid cargo.')
    clean_cargo=[]
    for c in cargo:
        if not isinstance(c,dict) or not isinstance(c.get('id'),str) or len(c['id'])>80 or type(c.get('units')) is not int or not 1<=c['units']<=3: raise ValueError('Invalid cargo unit.')
        clean_cargo.append({'id':c['id'],'units':c['units']})
    data=raw.get('data',[])
    if not isinstance(data,list) or len(data)>16 or any(not isinstance(x,str) or len(x)>80 for x in data): raise ValueError('Invalid data cargo.')
    return {'version':1,'flags':dict(flags),'completed':raw.get('completed') is True and all(flags.get(f) for f in FLAGS),'migrated':raw.get('migrated') is True,
            'personal':{'weapon':'ward-pistol','ammo':count(p.get('ammo'),8,8),'reserve':count(p.get('reserve'),999,48),'items':entries(p.get('items',[]),['ward-kit']),'attachments':attachments,'optic':optic},
            'equipment':{'owned':owned,'installed':installed},'missiles':None if raw.get('missiles') is None else count(raw['missiles'],30),
            'checkpoint':{'location':location},'reputation':reputation,'cargo':clean_cargo,'data':data,'relays':relays}
