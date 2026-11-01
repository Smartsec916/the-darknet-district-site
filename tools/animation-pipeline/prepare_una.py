"""Blender 5.2: rig "Una" (CGTrader; a static mesh with 4K UDIM textures) on the Female Base's Unreal skeleton and
build her outfits, for build_imported_character.py.

blender -b --factory-startup --python prepare_una.py -- UNA.fbx UNA_TEXTURES FEMALE_BASE.fbx OUT.blend VARIANT_DIR

Rigging (David approved, 2026-10-31): the Female Base figure is scaled to Una's height and posed so each arm and leg
chain runs from her shoulder to her fingertips and from her hip to her toes; the posed base body lends its skin
weights to Una's body by nearest surface (bone heat fails on her body's separate eye and teeth pieces), the pose
becomes the rest pose, the clothing takes Una's body weights, and hair and the tear line follow the head. Nearest
surface can pick the wrong limb where the two bodies differ (her right foot took the base's left foot, her chin the
upper spine), so prune() then drops every weight on a bone far from the vertex or on the other side of the body. She
has no face shapes, so she does not blink.

Eyes: tile 1007 holds the sclera (lower half, the "Eyeball" mesh) and the irises (upper half, the "Pupil" mesh, a
shell a few millimetres behind the sclera, taking the same texture); the sclera is opened where Eyeball_A marks the
cornea so the iris shows.

Textures: her UDIM tiles (skin 1001-1006, outfit 1001-1003) become one material per tile (glTF has no UDIMs; UVs keep
their tile offset and the textures repeat). Each garment gets its own material (outfit_jacket, outfit_pants,
outfit_top, outfit_shoes) so a look can recolour one without the others.

Outfits (David chose Style A as her default): extra parts made from her own garments, never replacing them -
"shorts" (the leggings cut at 0.75 m with a clean hem) and thin emissive piping bands (cyan on the top hem and the
waistband, magenta on the shorts' hem and the jacket's hem), plus recoloured outfit tiles written to VARIANT_DIR
(charcoal top and leggings, violet leggings, violet jacket) for pack-variant-textures.cjs.
"""
import bpy
import bmesh
import math
import sys
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix

una_src, tex, base_src, out, variants = sys.argv[sys.argv.index('--') + 1:][:5]
tex, variants = Path(tex), Path(variants)
variants.mkdir(parents=True, exist_ok=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
scene = bpy.context.scene


def imported(path, **kw):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, **kw)
    new = [o for o in bpy.data.objects if o not in before]
    bpy.ops.object.select_all(action='DESELECT')
    for o in new:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return new


una = {o.name: o for o in imported(una_src) if o.type == 'MESH'}
base_objs = imported(base_src, use_anim=False, automatic_bone_orientation=True)
rig = next(o for o in base_objs if o.type == 'ARMATURE')
base_body = next(o for o in base_objs if o.type == 'MESH' and o.data.shape_keys and len(o.data.shape_keys.key_blocks) > 60)
deforming = {g.name for g in base_body.vertex_groups}
world = lambda o: np.array([tuple(o.matrix_world @ v.co) for v in o.data.vertices])
B, U = world(base_body), world(una['Body'])
s = U[:, 2].max() / B[:, 2].max()
B *= s
print('SCALE', round(s, 4), 'base height', round(B[:, 2].max(), 3), 'una height', round(U[:, 2].max(), 3))


def centre_y(P, z, band=.03, half=.13):
    m = (abs(P[:, 2] - z) < band) & (abs(P[:, 0]) < half)
    return P[m, 1].mean() if m.any() else None


def tip(P, side, kind):
    if kind == 'hand':
        return P[np.argmax(P[:, 0] * side)]
    m = (P[:, 2] < .12) & (P[:, 0] * side > .02)
    return P[m][np.argmin(P[m][:, 1])]


# Fit by posing: the whole base figure is scaled to Una's height, then each arm and leg chain is turned and
# stretched about its root joint so it ends where Una's limb ends. The base body follows the pose; its posed surface
# lends its skin weights to Una by nearest surface, and the pose becomes the skeleton's rest pose.
for o in (rig, base_body):
    o.scale = (s, s, s)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
base_body.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.mode_set(mode='POSE')
pb = rig.pose.bones
# The FBX carries a stray pose (calf_r moved about 20 cm, small offsets elsewhere); start from the symmetric rest.
for b in pb:
    b.location, b.rotation_quaternion, b.rotation_euler, b.scale = (0, 0, 0), (1, 0, 0, 0), (0, 0, 0), (1, 1, 1)
bpy.context.view_layer.update()


def fit(root_name, kind):
    b = pb.get(root_name)
    if not b:
        return
    side = 1 if b.head.x > 0 else -1
    pivot = b.head.copy()
    tb, tu = Vector(tip(B, side, kind)), Vector(tip(U, side, kind))
    vb, vu = tb - pivot, tu - pivot
    R = vb.rotation_difference(vu).to_matrix().to_4x4()
    k = vu.length / vb.length
    b.matrix = Matrix.Translation(pivot) @ R @ Matrix.Scale(k, 4) @ Matrix.Translation(-pivot) @ b.matrix
    bpy.context.view_layer.update()
    print('FIT', root_name, 'turn', round(math.degrees(vb.angle(vu)), 1), 'stretch', round(k, 3))


for n in ('upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r'):
    fit(n, 'hand' if n.startswith('upper') else 'foot')
bpy.ops.object.mode_set(mode='OBJECT')
dg = bpy.context.evaluated_depsgraph_get()
proxy = bpy.data.objects.new('proxy', bpy.data.meshes.new_from_object(base_body.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg))
scene.collection.objects.link(proxy)
proxy.matrix_world = base_body.matrix_world.copy()
for g in base_body.vertex_groups:
    proxy.vertex_groups.new(name=g.name)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
for b in rig.data.bones:
    b.use_deform = b.name in deforming
for o in base_objs:
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
body = una['Body']


def follow(o, group=None, source=None):
    o.parent = rig
    o.matrix_parent_inverse = rig.matrix_world.inverted()
    o.modifiers.new('rig', 'ARMATURE').object = rig
    if group:
        o.vertex_groups.new(name=group).add(range(len(o.data.vertices)), 1.0, 'REPLACE')
        return
    src = source or body
    for g in src.vertex_groups:
        if g.name not in o.vertex_groups:
            o.vertex_groups.new(name=g.name)
    m = o.modifiers.new('weights', 'DATA_TRANSFER')
    m.object = src
    m.use_vert_data = True
    m.data_types_verts = {'VGROUP_WEIGHTS'}
    m.vert_mapping = 'POLYINTERP_NEAREST'
    m.layers_vgroup_select_src = 'ALL'
    m.layers_vgroup_select_dst = 'NAME'
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_move_to_index(modifier=m.name, index=0)
    bpy.ops.object.modifier_apply(modifier=m.name)


follow(body, source=proxy)
bpy.data.objects.remove(proxy, do_unlink=True)
print('BIND body groups', len(body.vertex_groups), 'unweighted', sum(1 for v in body.data.vertices if sum(g.weight for g in v.groups) < .01))


for n in ('Hair', 'Tear'):
    follow(una[n], 'head')


# ---- Outfit parts ----
def slice_at(o, zs):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for z in zs:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    bm.to_mesh(o.data)
    bm.free()


def keep(o, test):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not test(f.calc_center_median().z)], context='FACES')
    bm.to_mesh(o.data)
    bm.free()


def copy(o, name):
    c = o.copy()
    c.data = o.data.copy()
    c.name = name
    scene.collection.objects.link(c)
    return c


shorts = copy(una['Pants_Under'], 'shorts')
slice_at(shorts, [.75])
keep(shorts, lambda z: z >= .75)


def glow(name, color, strength=3.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (.02, .02, .03, 1)
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = strength
    return m


cyan, magenta = glow('piping_cyan', (.1, .85, 1.0)), glow('piping_magenta', (1.0, .15, .75))
piping = {}
for name, src, z0, z1, mat in (('piping_top', una['Sleeveless'], 1.183, 1.19, cyan), ('piping_waist', una['Pants_Up'], 1.097, 1.104, cyan),
                               ('piping_shorts', shorts, .75, .758, magenta), ('piping_jacket', una['Jacket'], 1.044, 1.05, magenta)):
    p = copy(src, name)
    slice_at(p, [z0, z1])
    keep(p, lambda z: z0 <= z <= z1)
    for v in p.data.vertices:
        v.co += v.normal * .0015
    p.data.materials.clear()
    p.data.materials.append(mat)
    piping[name] = p
    print('PIPING', name, len(p.data.polygons), 'faces')

garments = {'jacket': una['Jacket'], 'jacket_item': una['Jacket_Item'], 'leggings': una['Pants_Under'], 'waistband': una['Pants_Up'],
            'top': una['Sleeveless'], 'shoes': una['Shoes'], 'shorts': shorts, **piping}
for o in garments.values():
    follow(o)


def prune(o, reach=.10, ratio=2.5, mid=.02, jaw=((-.08, 1.525), (.065, 1.575)), band=.012):
    """Drop weights on bones much farther from the vertex than its nearest bone (by reach metres or ratio times),
    and on the other side's bones (_l is +x) once a vertex is off the midline; above the middle of the neck only the
    neck, the head and its face bones count (the jaw had kept clavicle weights). Renormalise; a vertex left with no
    weight takes its nearest bone. Then the jaw line: her jaw is lower than the base figure's, so skin under it had
    neck weights and folded when she turned her head. Above a plane from under the chin to the base of the skull
    (jaw: (y, z) of each, measured on her midline) only the head's bones count, blended over +-band."""
    from mathutils.kdtree import KDTree
    from mathutils.geometry import intersect_point_line
    bones = [b for b in rig.data.bones if b.name in o.vertex_groups]
    seg = {b.name: (rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local) for b in bones}
    pts = [(h.lerp(t, i / 8), b) for b, (h, t) in seg.items() for i in range(9)]
    kd = KDTree(len(pts))
    for i, (c, _) in enumerate(pts):
        kd.insert(c, i)
    kd.balance()

    def dist(co, b):
        h, t = seg[b]
        q, f = intersect_point_line(co, h, t)
        return (co - (h if f < 0 else t if f > 1 else q)).length
    names = {g.index: g.name for g in o.vertex_groups}
    neck, head = rig.data.bones['neck_01'], rig.data.bones['head']
    above = (rig.matrix_world @ ((neck.head_local + neck.tail_local) / 2)).z
    headward = {'neck_01', 'head', *(b.name for b in head.children_recursive)}
    dropped = 0
    for v in o.data.vertices:
        co = o.matrix_world @ v.co
        _, near, d0 = kd.find(co)
        nearest = pts[near][1]
        limit = max(d0 + reach, d0 * ratio)
        keep = {}
        for g in v.groups:
            b = names[g.group]
            if g.weight <= 0 or b not in seg:
                continue
            if (b.endswith('_l') and co.x < -mid) or (b.endswith('_r') and co.x > mid) or dist(co, b) > limit or (co.z > above and b not in headward):
                dropped += 1
                continue
            keep[b] = g.weight
        if not keep:
            keep = {nearest if co.z <= above or nearest in headward else 'neck_01': 1.0}
        (y0, z0), (y1, z1) = jaw
        t = min(1, max(0, (co.z - (z0 + (co.y - y0) * (z1 - z0) / (y1 - y0)) + band) / (2 * band))) if abs(co.x) < .12 and co.z > 1.4 else 0
        if t > 0:
            hk = {b: w for b, w in keep.items() if b in headward and b != 'neck_01'} or {'head': 1.0}
            ht, kt = sum(hk.values()), sum(keep.values())
            keep = {b: (1 - t) * keep.get(b, 0) / kt + t * hk.get(b, 0) / ht for b in {*keep, *hk}}
        total = sum(keep.values())
        for g in list(v.groups):
            o.vertex_groups[g.group].remove([v.index])
        for b, w in ((b, w) for b, w in keep.items() if w > 0):
            o.vertex_groups[b].add([v.index], w / total, 'REPLACE')
    print('PRUNE', o.name, 'dropped', dropped)


for o in (body, *garments.values()):
    prune(o)


# The cornea: the iris shell sits a few millimetres behind the sclera, which is opaque; Eyeball_A marks the cornea
# (white discs) on the sclera's UVs, so those faces are opened and the iris shows through.
def cornea_window(o):
    me = o.data
    slot = next(i for i, s in enumerate(o.material_slots) if s.material and s.material.name.split('.')[0] == 'Eyeball')
    a = bpy.data.images.load(str(tex / 'Eyeball_A.png'), check_existing=True)
    w, h = a.size
    px = np.empty(w * h * a.channels, np.float32)
    a.pixels.foreach_get(px)
    px = px.reshape(h, w, a.channels)[:, :, 0]
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    cut = []
    for f in bm.faces:
        if f.material_index == slot:
            c = sum((l[uv].uv for l in f.loops), Vector((0, 0))) / len(f.loops)
            if px[min(h - 1, int(c.y % 1 * h)), min(w - 1, int(c.x % 1 * w))] > .5:
                cut.append(f)
    bmesh.ops.delete(bm, geom=cut, context='FACES')
    bm.to_mesh(me)
    bm.free()
    print('CORNEA opened', len(cut), 'faces')


cornea_window(body)


# ---- Materials: one per UDIM tile for the skin; one per garment for the outfit ----
def img(name, data=False):
    im = bpy.data.images.load(str(tex / name), check_existing=True)
    if data:
        im.colorspace_settings.name = 'Non-Color'
    return im


def principled(name, bc=None, n=None, r=None, alpha=None, color=None, rough=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], nt.nodes.new('ShaderNodeOutputMaterial').inputs[0])
    node = lambda im: (lambda t: (setattr(t, 'image', im), t)[1])(nt.nodes.new('ShaderNodeTexImage'))
    if bc:
        nt.links.new(node(img(bc)).outputs['Color'], p.inputs['Base Color'])
    elif color:
        p.inputs['Base Color'].default_value = (*color, 1)
    if alpha:
        nt.links.new(node(img(alpha, True)).outputs['Color'], p.inputs['Alpha'])
    if n:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(node(img(n, True)).outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    if r:
        nt.links.new(node(img(r, True)).outputs['Color'], p.inputs['Roughness'])
    else:
        p.inputs['Roughness'].default_value = .5 if rough is None else rough
    return m


tile_of = lambda me, poly: 1001 + int(math.floor(sum(me.uv_layers.active.data[l].uv.x for l in poly.loop_indices) / poly.loop_total))
skin = {t: principled(f'skin_{t}', f'Body_D_{t}.jpg', f'Body_N_{t}.png', f'Body_R_{t}.png') for t in range(1001, 1007)}
plain = {'Eyeball': principled('eyeball', 'Eyeball_D.jpg', 'Eyeball_N.png', rough=.12), 'Pupil': principled('pupil', 'Eyeball_D.jpg', rough=.08),
         'Teeth': principled('teeth', color=(.85, .82, .76), rough=.3), 'Hair': principled('hair', 'Hair_D.png', 'Hair_N.png', alpha='Hair_A.png', rough=.45),
         'Fade_Eyebrows': principled('eyebrows', color=(.06, .04, .03), n='Fade_Eyebrows_N.png', alpha='Fade_Eyebrows_A.png', rough=.6),
         'Tear-1': principled('tear', color=(.9, .9, .9), alpha='TearOpacity.jpg', rough=.05)}
outfit = {'jacket': 1001, 'pants': 1002, 'top': 1003, 'shoes': 1003}
outfit_mat = {k: principled('outfit_' + k, f'Outfit_D_{t}.jpg', f'Outfit_N_{t}.png', f'Outfit_R_{t}.png') for k, t in outfit.items()}
garment_mat = {'jacket': 'jacket', 'jacket_item': 'jacket', 'leggings': 'pants', 'waistband': 'pants', 'shorts': 'pants', 'top': 'top', 'shoes': 'shoes'}


def remap(o, table):
    """table(old material name, polygon) -> new material; slots are rebuilt from what is used."""
    me = o.data
    olds = [s.material.name.split('.')[0] if s.material else None for s in o.material_slots]
    want = [table(olds[p.material_index], p) for p in me.polygons]
    me.materials.clear()
    index = {}
    for m in want:
        if m.name not in index:
            index[m.name] = len(me.materials)
            me.materials.append(m)
    for p, m in zip(me.polygons, want):
        p.material_index = index[m.name]


remap(body, lambda old, p: skin[tile_of(body.data, p)] if old == 'Skin' else plain[old])
remap(una['Hair'], lambda old, p: plain[old])
remap(una['Tear'], lambda old, p: plain[old])
for name, gm in garment_mat.items():
    remap(garments[name], lambda old, p, gm=gm: outfit_mat[gm])

# ---- Recoloured outfit tiles for the looks (linear light; hue and saturation from the colour, value kept) ----
srgb2lin = lambda c: np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
lin2srgb = lambda c: np.where(c <= .0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - .055)


def recolour(tile, name, tint, k, lift, size=2048):
    im = bpy.data.images.load(str(tex / f'Outfit_D_{tile}.jpg'))
    im.scale(size, size)
    px = np.empty(size * size * 4, np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb = srgb2lin(px[:, :3])
    v = rgb.max(axis=1, keepdims=True)
    t = np.array(tint, np.float32)
    coloured = v * (t / t.max())
    rgb = np.clip((rgb * (1 - k) + coloured * k) * lift, 0, 1)
    px[:, :3] = lin2srgb(rgb)
    out_im = bpy.data.images.new(name, size, size)
    out_im.pixels.foreach_set(px.ravel())
    out_im.filepath_raw = str(variants / (name + '.png'))
    out_im.file_format = 'PNG'
    out_im.save()
    bpy.data.images.remove(im)
    bpy.data.images.remove(out_im)
    print('VARIANT', name)


recolour(1003, 'top-charcoal', (.16, .16, .19), .6, 1.25)
recolour(1002, 'pants-charcoal', (.16, .16, .19), .6, 1.25)
recolour(1002, 'pants-violet', (.55, .1, .85), 1.0, 2.2)
recolour(1001, 'jacket-violet', (.5, .15, .75), 1.0, 2.4)

# Final names (the converter's mesh spec matches these).
body.name = 'body'
una['Hair'].name = 'hair'
una['Tear'].name = 'tear'
for name, o in garments.items():
    o.name = name
for o in scene.objects:
    if o.type == 'MESH':
        print('PART', o.name, sum(len(p.vertices) - 2 for p in o.data.polygons), 'tris', [m.name for m in o.data.materials])
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.file.pack_all()
Path(out).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print('PREPARED', out)
