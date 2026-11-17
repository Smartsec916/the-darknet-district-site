#!/usr/bin/env python3
"""Converts the two purchased CGTrader packs used by The Outskirts into game GLBs (this script holds no asset; the models are Royalty Free, NO AI use, NO redistribution:
they are kept out of this public repository and published only as scrambled .vrpak through the private repository, see docs/VOID_RUNNER_ASSET_LICENSES.md).
  1. "Low Poly PBR Shipping Container 20ft": OBJ, centimetres, 3ds Max export. Nodes: c01_LOD0..3, c02_LOD0..3, doorL_LOD0..1, doorR_LOD0..1.
  2. "solar panels with clean and dirty textures": Collada. The five DIRTY arrays become nodes solar-1..5 (each stood on y 0 around its own middle).
  3. "Satellite Dish Low-poly" (GLB, 10.7k triangles kept as they are; its three 16 MB PNG pictures become 1024 px JPEGs, with a little grime laid over the colour).
Usage: python3 tools/assets/pack_outskirts_licensed.py <containers-dir> <solar-dir> <out-dir> [<dish-dir>]   then: node tools/assets/pack-model.cjs <glb> <vrpak>
Run on the owner's side or here after fetching; nothing is sent anywhere. Needs Pillow."""
import sys, os, re, json, struct, io, math
from PIL import Image

def jpeg(path, size=1024):
    im = Image.open(path).convert('RGB')
    if max(im.size) > size: im = im.resize((size, size), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=86); return b.getvalue()

class Glb:
    def __init__(s): s.bin = bytearray(); s.views = []; s.acc = []; s.images = []; s.textures = []; s.materials = []; s.meshes = []; s.nodes = []
    def blob(s, data, target=None):
        while len(s.bin) % 4: s.bin.append(0)
        s.views.append(dict(buffer=0, byteOffset=len(s.bin), byteLength=len(data), **({'target': target} if target else {}))); s.bin += data; return len(s.views) - 1
    def image(s, jpg):
        v = s.blob(jpg); s.images.append(dict(bufferView=v, mimeType='image/jpeg')); s.textures.append(dict(source=len(s.images) - 1, sampler=0)); return len(s.textures) - 1
    def accessor(s, arr, comp, typ, target, mn=None):
        fmt = '<%d%s' % (len(arr), 'f' if comp == 5126 else 'I'); v = s.blob(struct.pack(fmt, *arr), target)
        a = dict(bufferView=v, componentType=comp, count=len(arr) // {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[typ], type=typ)
        if mn: a['min'], a['max'] = mn
        s.acc.append(a); return len(s.acc) - 1
    def mesh(s, name, prims):   # prims: [(material, pos, nrm, uv, idx)]
        out = []
        for m, pos, nrm, uv, idx in prims:
            xs, ys, zs = pos[0::3], pos[1::3], pos[2::3]
            out.append(dict(attributes=dict(POSITION=s.accessor(pos, 5126, 'VEC3', 34962, [[min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]]), NORMAL=s.accessor(nrm, 5126, 'VEC3', 34962), TEXCOORD_0=s.accessor(uv, 5126, 'VEC2', 34962)), indices=s.accessor(idx, 5125, 'SCALAR', 34963), material=m))
        s.meshes.append(dict(name=name, primitives=out)); s.nodes.append(dict(name=name, mesh=len(s.meshes) - 1))
    def write(s, path):
        j = dict(asset=dict(version='2.0', generator='void-runner outskirts pack'), scene=0, scenes=[dict(nodes=list(range(len(s.nodes))))], nodes=s.nodes, meshes=s.meshes, materials=s.materials, textures=s.textures, images=s.images,
                 samplers=[dict(magFilter=9729, minFilter=9987, wrapS=10497, wrapT=10497)], accessors=s.acc, bufferViews=s.views, buffers=[dict(byteLength=len(s.bin))])
        js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4); b = bytes(s.bin) + b'\0' * (-len(s.bin) % 4)
        open(path, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(b)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(b), 0x004E4942) + b)

def read_obj(path, scale):
    V, T, N, groups, cur = [], [], [], {}, None
    for l in open(path, encoding='utf8', errors='ignore'):
        a = l.split()
        if not a: continue
        if a[0] == 'v': V.append([float(x) * scale for x in a[1:4]])
        elif a[0] == 'vt': T.append([float(a[1]), 1 - float(a[2])])
        elif a[0] == 'vn': N.append([float(x) for x in a[1:4]])
        elif a[0] == 'usemtl': cur = a[1]; groups.setdefault(cur, dict(pos=[], nrm=[], uv=[], idx=[], map={}))
        elif a[0] == 'f':
            g = groups[cur]; ids = []
            for t in a[1:]:
                p = (t.split('/') + ['', ''])[:3]; key = tuple(p)
                if key not in g['map']:
                    g['map'][key] = len(g['map']); v = V[int(p[0]) - 1]; g['pos'] += v
                    g['uv'] += T[int(p[1]) - 1] if p[1] else [0, 0]; g['nrm'] += N[int(p[2]) - 1] if p[2] else [0, 1, 0]
                ids.append(g['map'][key])
            for k in range(1, len(ids) - 1): g['idx'] += [ids[0], ids[k], ids[k + 1]]
    return groups

def weathered(path):
    """The pack's own picture, modified for The Outskirts (remixing is allowed by the licence): the seller's printed company logo is painted out with the plain corrugated strip beside it
    (nothing in this game carries a real-looking company name) and rust streaks and grime are laid over everything, since these homes are rundown."""
    import random
    im = Image.open(path).convert('RGB'); W, H = im.size; k = W / 1024
    box = (int(365 * k), int(835 * k), int(930 * k), int(962 * k)); w = box[2] - box[0]; src = im.crop((0, box[1], int(360 * k), box[3]))
    for x in range(box[0], box[2], src.size[0]): im.paste(src, (x, box[1]))
    # grime and rust streaks (seeded: the same picture every time)
    rnd = random.Random(2026); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); from PIL import ImageDraw; d = ImageDraw.Draw(ov)
    for _ in range(260):
        x = rnd.randrange(W); y = rnd.randrange(H); l = rnd.randrange(40, 260); c = rnd.choice([(120, 60, 28), (70, 36, 20), (20, 16, 12)])
        d.line([(x, y), (x + rnd.randrange(-3, 4), y + l)], fill=c + (rnd.randrange(30, 90),), width=rnd.randrange(2, 9))
    from PIL import ImageFilter
    ov = ov.filter(ImageFilter.GaussianBlur(1.2)); im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
    b = io.BytesIO(); im.save(b, 'JPEG', quality=86); return b.getvalue()

def containers(src, out):
    g = Glb(); od = os.path.join(src, 'extracted', 'Meshes Container 20ft', 'obj'); dd = os.path.join(src, 'extracted', 'Meshes Container Doors', 'obj')
    ct = g.image(weathered(os.path.join(od, 'T_ShipContainer_20ft_A_Blue.jpg'))); dt = g.image(jpeg(os.path.join(dd, 'T_ShipContainer_Doors_A_Blue.jpg')))
    mats = {'Container': len(g.materials), 'Doors': len(g.materials) + 1}
    g.materials += [dict(name='container', pbrMetallicRoughness=dict(baseColorTexture=dict(index=ct), metallicFactor=.3, roughnessFactor=.75), doubleSided=True),
                    dict(name='doors', pbrMetallicRoughness=dict(baseColorTexture=dict(index=dt), metallicFactor=.3, roughnessFactor=.75), doubleSided=True)]
    for n in ('01', '02'):
        for lod in range(4):
            gr = read_obj(os.path.join(od, 'SM_Container_20ft_%s_LOD%d.obj' % (n, lod)), .01)
            g.mesh('c%s_LOD%d' % (n, lod), [(mats.get(k, 0), v['pos'], v['nrm'], v['uv'], v['idx']) for k, v in gr.items() if v['idx']])
    for side in ('L', 'R'):
        for lod in range(2):
            p = os.path.join(dd, 'SM_Container_Door_%s_LOD%d.obj' % (side, lod))
            if not os.path.exists(p): continue
            gr = read_obj(p, .01); g.mesh('door%s_LOD%d' % (side, lod), [(1, v['pos'], v['nrm'], v['uv'], v['idx']) for k, v in gr.items() if v['idx']])
    g.write(os.path.join(out, 'outskirts-containers.glb'))

def solar(src, out):
    s = open([os.path.join(src, f) for f in os.listdir(src) if f.endswith('.dae')][0], encoding='utf8').read()
    td = os.path.join(src, 'extracted', 'dirty textures'); g = Glb()
    base = g.image(jpeg(os.path.join(td, 'DefaultMaterial_Base_Color.jpg'))); nrm = g.image(jpeg(os.path.join(td, 'DefaultMaterial_Normal_OpenGL.jpg')))
    ao, ro, me = [Image.open(os.path.join(td, 'DefaultMaterial_%s.jpg' % k)).convert('L').resize((1024, 1024)) for k in ('Mixed_AO', 'Roughness', 'Metallic')]
    orm = Image.merge('RGB', (ao, ro, me)); b = io.BytesIO(); orm.save(b, 'JPEG', quality=86); om = g.image(b.getvalue())
    g.materials.append(dict(name='solar-dirty', pbrMetallicRoughness=dict(baseColorTexture=dict(index=base), metallicRoughnessTexture=dict(index=om), metallicFactor=1, roughnessFactor=1), normalTexture=dict(index=nrm), occlusionTexture=dict(index=om), doubleSided=True))
    geoms = {m.group(1): m.group(2) for m in re.finditer(r'<geometry id="([^"]+)"[^>]*>(.*?)</geometry>', s, re.S)}
    nodes = re.findall(r'<node id="[^"]+" name="[^"]*" type="NODE">\s*<matrix sid="transform">([^<]+)</matrix>\s*<instance_geometry url="#([^"]+)"[^>]*>.*?instance_material symbol="([^"]+)"', s, re.S)
    k = 0
    for mat, gid, sym in nodes:
        if 'dirty' not in sym: continue
        body = geoms[gid]; M = [float(x) for x in mat.split()]
        src_ = {m.group(1): [float(x) for x in m.group(2).split()] for m in re.finditer(r'<source id="([^"]+)">\s*<float_array[^>]*>([^<]*)</float_array>', body)}
        inputs = re.findall(r'<input semantic="(\w+)" source="#([^"]+)" offset="(\d+)"', body); vsrc = re.search(r'<vertices id="([^"]+)">\s*<input semantic="POSITION" source="#([^"]+)"', body)
        off = {sem: (srcid, int(o)) for sem, srcid, o in inputs}; stride = max(o for _, o in off.values()) + 1; p = [int(x) for x in re.search(r'<p>([^<]*)</p>', body).group(1).split()]
        P = src_[vsrc.group(2)]; Nn = src_[off['NORMAL'][0]]; Tt = src_[off['TEXCOORD'][0]]; vo, no, to = off['VERTEX'][1], off['NORMAL'][1], off['TEXCOORD'][1]
        def tr(v): x = M[0] * v[0] + M[1] * v[1] + M[2] * v[2] + M[3]; y = M[4] * v[0] + M[5] * v[1] + M[6] * v[2] + M[7]; z = M[8] * v[0] + M[9] * v[1] + M[10] * v[2] + M[11]; return [x, z, -y]   # Z up to Y up
        def rot(v): x = M[0] * v[0] + M[1] * v[1] + M[2] * v[2]; y = M[4] * v[0] + M[5] * v[1] + M[6] * v[2]; z = M[8] * v[0] + M[9] * v[1] + M[10] * v[2]; return [x, z, -y]
        pos, nr, uv, idx, mp = [], [], [], [], {}
        for i in range(0, len(p), stride):
            key = (p[i + vo], p[i + no], p[i + to])
            if key not in mp:
                mp[key] = len(mp); pos += tr(P[key[0] * 3:key[0] * 3 + 3]); nr += rot(Nn[key[1] * 3:key[1] * 3 + 3]); uv += [Tt[key[2] * 2], 1 - Tt[key[2] * 2 + 1]]
            idx.append(mp[key])
        xs, ys, zs = pos[0::3], pos[1::3], pos[2::3]; cx, cz, y0 = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, min(ys)
        for i in range(0, len(pos), 3): pos[i] -= cx; pos[i + 1] -= y0; pos[i + 2] -= cz
        k += 1; g.mesh('solar-%d' % k, [(0, pos, nr, uv, idx)])
    g.write(os.path.join(out, 'outskirts-solar.glb'))

def dish(src, out):
    f = [os.path.join(src, n) for n in os.listdir(src) if n.endswith('.glb')][0]; b = open(f, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); m = 20 + n; bl = struct.unpack('<I', b[m:m + 4])[0]; binb = b[m + 8:m + 8 + bl]
    import random
    from PIL import ImageDraw, ImageFilter
    newbin = bytearray(); views = []; keep = {im['bufferView'] for im in j['images']}
    for i, v in enumerate(j['bufferViews']):
        while len(newbin) % 4: newbin.append(0)
        data = binb[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        if i in keep:
            im = Image.open(io.BytesIO(data)).convert('RGB')
            if max(im.size) > 1024: im = im.resize((1024, 1024), Image.LANCZOS)
            if 'BaseColor' in str(next(x.get('name', '') for x in j['images'] if x['bufferView'] == i)):   # grime and rust over the colour: these dishes are old
                rnd = random.Random(7); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
                for _ in range(120): x = rnd.randrange(1024); y = rnd.randrange(1024); d.line([(x, y), (x + rnd.randrange(-2, 3), y + rnd.randrange(30, 200))], fill=rnd.choice([(120, 62, 30), (60, 40, 26), (24, 20, 16)]) + (rnd.randrange(40, 100),), width=rnd.randrange(2, 8))
                im = Image.alpha_composite(im.convert('RGBA'), ov.filter(ImageFilter.GaussianBlur(1.2))).convert('RGB')
            bb = io.BytesIO(); im.save(bb, 'JPEG', quality=88); data = bb.getvalue()
        nv = dict(v); nv['byteOffset'] = len(newbin); nv['byteLength'] = len(data); views.append(nv); newbin += data
    j['bufferViews'] = views
    for im in j['images']: im['mimeType'] = 'image/jpeg'
    j['buffers'] = [dict(byteLength=len(newbin))]
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4); nb = bytes(newbin) + b'\0' * (-len(newbin) % 4)
    open(os.path.join(out, 'outskirts-dish.glb'), 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(nb)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(nb), 0x004E4942) + nb)

if __name__ == '__main__':
    c, s_, o = sys.argv[1:4]; os.makedirs(o, exist_ok=True); containers(c, o); solar(s_, o)
    if len(sys.argv) > 4: dish(sys.argv[4], o)
    print('written to', o)
