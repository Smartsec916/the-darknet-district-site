"""Blender 5.2: prepare BGShop's "Ava" v2.0 (ava_eevee_v2.0.blend) for build_imported_character.py.

blender -b --factory-startup --disable-autoexec ava_eevee_v2.0.blend --python prepare_ava.py -- OUT.blend TEXTURES_DIR

The source .blend is opened, never saved over (--disable-autoexec: its Rigify UI script does not run).
What it does, and why:
- Keeps everything she can wear: the red top and skirt, the bikini, all three hairstyles (long, bob, pixie) and
  both pairs of glasses. The game shows one hairstyle and at most one pair of glasses at a time (the supplied FBX
  exports wear all three hairstyles at once).
- The Rigify control rig is reduced to its deform bones with a clean parent chain (Rigify parents thighs,
  arms and fingers to non-deform ORG/MCH bones), so the converter's Mixamo bone map works. Hairstyles and glasses
  parented to the head bone are skinned to it instead.
- Skin the top hides (the source's "cloth_mask" MASK modifier) is split into its own part, "skin_under", which
  the game shows only with the bikini; both parts keep the unsplit body's normals so the join doesn't show. Skin
  under the skirt and the bikini is set a few millimetres inward so it can't push through as she moves.
- Blink shapes Eye_Blink_L/R (the names vr-suite.js blinks with) are made from Ava's own lid shapes.
- Clothing correctives ("pose", "brest", "cloth_deform") are baked at their current values.
- Materials are rebuilt as plain Principled BSDF from the images each source material uses (the source's EEVEE
  node set-ups do not export to glTF). Hair textures have their colour bled into the transparent texels, so
  the cut-out edges don't pick up the light background colour. Subdivision is dropped; mirror, solidify and
  geometry nodes are applied.
"""
import bpy
import bmesh
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0])
textures = Path(args[1]) if len(args) > 1 else None  # the "textures" folder from textures.zip (bikini maps)
KEEP = ['body', 'dress', 'skirt', 'underwear.001', 'hair_01', 'inner', 'outer', 'glasses_01', 'glasses_02',
        'shoes', 'eye', 'eyebrow', 'nail']
RIG = 'rig_ava'
HEAD = 'DEF-spine.006'

for o in list(bpy.data.objects):
    if o.name not in KEEP and o.name != RIG:
        bpy.data.objects.remove(o, do_unlink=True)
rig = bpy.data.objects[RIG]
meshes = [bpy.data.objects[n] for n in KEEP]
scene = bpy.context.scene
for o in [rig] + meshes:
    if o.name not in scene.collection.objects:
        scene.collection.objects.link(o)
    for c in list(o.users_collection):
        if c != scene.collection:
            c.objects.unlink(o)
    o.hide_set(False)
    o.hide_render = False

# Rest pose, no drivers or constraints.
rig.animation_data_clear()
for pb in rig.pose.bones:
    for c in list(pb.constraints):
        pb.constraints.remove(c)
    pb.matrix_basis.identity()
for o in meshes:
    if o.data.shape_keys:
        o.data.shape_keys.animation_data_clear()
bpy.context.view_layer.update()


def bake_keys(o):
    """Replace the mesh with its current shape-key mix and remove the keys."""
    keys = o.data.shape_keys
    if not keys:
        return
    basis = keys.key_blocks[0]
    co = [v.co.copy() for v in basis.data]
    for kb in keys.key_blocks[1:]:
        if kb.value and not kb.mute:
            print('BAKE', o.name, kb.name, round(kb.value, 3))
            for i, d in enumerate(kb.data):
                co[i] += (d.co - basis.data[i].co) * kb.value
    for kb in list(keys.key_blocks)[::-1]:
        o.shape_key_remove(kb)
    for v, c in zip(o.data.vertices, co):
        v.co = c


for n in ('dress', 'skirt', 'underwear.001', 'eye'):
    bake_keys(bpy.data.objects[n])

# Blinks: upper lid down plus lower lid up, per side, as new keys from the basis.
body = bpy.data.objects['body']
kbs = body.data.shape_keys.key_blocks
print('BODY_KEYS_NONZERO', [(k.name, round(k.value, 3)) for k in kbs[1:] if k.value])
for side in ('L', 'R'):
    parts = [kbs['blink_upper_down.' + side], kbs['blink_lower_up.' + side]]
    new = body.shape_key_add(name='Eye_Blink_' + side, from_mix=False)
    for i, d in enumerate(new.data):
        b = kbs[0].data[i].co
        d.co = b + sum(((p.data[i].co - b) for p in parts), b * 0)
for k in kbs:
    k.value = 0


def apply_mod(o, m):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


for o in meshes:
    for m in list(o.modifiers):
        if m.type == 'SUBSURF':
            o.modifiers.remove(m)
        elif m.type in ('MIRROR', 'SOLIDIFY', 'NODES') or (m.type == 'MASK' and o.name == 'dress'):
            apply_mod(o, m)
        elif m.type == 'MASK':
            o.modifiers.remove(m)


def split(o, inside, name):
    """Move the faces whose vertices are all in `inside` to a new object `name` (same rig and materials)."""
    part = o.copy()
    part.data = o.data.copy()
    part.name = name
    scene.collection.objects.link(part)
    for target, keep_inside in ((o, False), (part, True)):
        bm = bmesh.new()
        bm.from_mesh(target.data)
        doomed = [f for f in bm.faces if all(v.index in inside for v in f.verts) != keep_inside]
        bmesh.ops.delete(bm, geom=doomed, context='FACES')
        bm.to_mesh(target.data)
        bm.free()
    if part.data.shape_keys:
        for kb in list(part.data.shape_keys.key_blocks)[::-1]:
            part.shape_key_remove(kb)
    print('SPLIT', o.name, len(o.data.polygons), name, len(part.data.polygons))
    return part


# Only the skin under the top is split off: it pokes through the shirt (why the source masks it). The skin under
# the skirt stays on the body, set 4 mm inward so it can't show through the skirt but fills the lap when she sits
# (a hole there would show under the hem).
gi = body.vertex_groups['cloth_mask'].index
covered = {v.index for v in body.data.vertices if any(g.group == gi and g.weight > .5 for g in v.groups)}
skirt_top = max((bpy.data.objects['skirt'].matrix_world @ v.co).z for v in bpy.data.objects['skirt'].data.vertices)
under_skirt = {i for i in covered if (body.matrix_world @ body.data.vertices[i].co).z < skirt_top}
for kb in body.data.shape_keys.key_blocks:
    for i in under_skirt:
        kb.data[i].co -= body.data.vertices[i].normal * .004
for i in under_skirt:
    body.data.vertices[i].co -= body.data.vertices[i].normal * .004
print('UNDER_SKIRT', len(under_skirt), 'vertices set inward; skirt top', round(skirt_top, 3))
# Both halves keep the whole body's vertex normals, so the lighting matches across the join (no seam under the
# bikini top). The original vertex number rides along as an attribute through the split.
body.data.update()
whole = [v.normal.copy() for v in body.data.vertices]
idx = body.data.attributes.new('orig_index', 'INT', 'POINT')
idx.data.foreach_set('value', list(range(len(whole))))
skin = split(body, covered - under_skirt, 'skin_under')
meshes.append(skin)
for o in (body, skin):
    ids = [0] * len(o.data.vertices)
    o.data.attributes['orig_index'].data.foreach_get('value', ids)
    o.data.normals_split_custom_set_from_vertices([whole[i] for i in ids])
    o.data.attributes.remove(o.data.attributes['orig_index'])


# The skirt follows only the hips in the source, so when she sits her thighs push through it. It takes the body's
# skin weights instead (nearest surface), limited to the hips, pelvis and thighs and renormalised, so the hem
# follows the legs and nothing pulls it toward the hands. The bikini keeps its own weights: body weights on it let
# the skin push through the cups.
def weights_from_body(o):
    for g in list(o.vertex_groups):
        o.vertex_groups.remove(g)
    for g in body.vertex_groups:
        o.vertex_groups.new(name=g.name)
    m = o.modifiers.new('weights', 'DATA_TRANSFER')
    m.object = body
    m.use_vert_data = True
    m.data_types_verts = {'VGROUP_WEIGHTS'}
    m.vert_mapping = 'POLYINTERP_NEAREST'
    m.layers_vgroup_select_src = 'ALL'
    m.layers_vgroup_select_dst = 'NAME'
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_move_to_index(modifier=m.name, index=0)
    bpy.ops.object.modifier_apply(modifier=m.name)
    keep = {'DEF-spine', 'DEF-spine.001', 'DEF-pelvis.L', 'DEF-pelvis.R', 'DEF-thigh.L', 'DEF-thigh.R', 'DEF-thigh.L.001', 'DEF-thigh.R.001'}
    for g in list(o.vertex_groups):
        if g.name not in keep:
            o.vertex_groups.remove(g)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    print('WEIGHTS', o.name, sorted(g.name for g in o.vertex_groups))


weights_from_body(bpy.data.objects['skirt'])

# The bikini comes apart into top and bottom, so the bottom can be worn under the skirt (a short skirt
# otherwise shows bare skin when she sits). Both pieces are the source's own bikini.
bikini = bpy.data.objects['underwear.001']
low = {v.index for v in bikini.data.vertices if (bikini.matrix_world @ v.co).z < 1.15}
meshes.append(split(bikini, set(range(len(bikini.data.vertices))) - low, 'bikini_top'))

# Skin under the bikini (within 20 mm of either piece) is set 6 mm inward, so it can't push through the cups or
# the back band as she moves. Shape keys move with it.
from mathutils.bvhtree import BVHTree
pieces = [o for o in meshes if o.name in ('underwear.001', 'bikini_top')]
trees = [BVHTree.FromPolygons([o.matrix_world @ v.co for v in o.data.vertices], [p.vertices[:] for p in o.data.polygons]) for o in pieces]
for o in (body, skin):
    me = o.data
    near = [v.index for v in me.vertices if any(t.find_nearest(o.matrix_world @ v.co, .02)[0] for t in trees)]
    shift = {i: me.vertices[i].normal * .006 for i in near}
    for kb in (me.shape_keys.key_blocks if me.shape_keys else []):
        for i, d in shift.items():
            kb.data[i].co -= d
    for i, d in shift.items():
        me.vertices[i].co -= d
    print('UNDER_BIKINI', o.name, len(near), 'vertices set inward')

# Two hairstyles and both glasses are parented to the head bone; they are skinned to it instead (the converter
# expects skins).
for o in meshes:
    if o.parent == rig and o.parent_type == 'BONE':
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
        bpy.context.view_layer.objects.active = o
        for s in bpy.context.selected_objects:
            s.select_set(False)
        o.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        for g in list(o.vertex_groups):
            o.vertex_groups.remove(g)
        o.vertex_groups.new(name=HEAD).add(range(len(o.data.vertices)), 1.0, 'REPLACE')
        o.modifiers.new('rig', 'ARMATURE').object = rig
        print('ON_HEAD', o.name)

# Deform-only skeleton with a clean chain: each deform bone's new parent is the deform bone of its nearest
# ancestor (ORG-x stands for DEF-x). Driver bones (Bone, AI, E, ...) and every non-deform bone go.
arm = rig.data
drivers = {'Bone', 'AI', 'E', 'U', 'ShCh', 'FV', 'O', 'L', 'MBP', 'WQ'}
deform = {b.name for b in arm.bones if b.use_deform and b.name not in drivers}
explicit = {'DEF-shoulder.L': 'DEF-spine.003', 'DEF-shoulder.R': 'DEF-spine.003',
            'DEF-upper_arm.L': 'DEF-shoulder.L', 'DEF-upper_arm.R': 'DEF-shoulder.R',
            'DEF-thigh.L': 'DEF-spine', 'DEF-thigh.R': 'DEF-spine'}
for s in ('L', 'R'):
    for f in ('f_index', 'thumb', 'f_middle', 'f_ring', 'f_pinky'):
        explicit[f'DEF-{f}.01.{s}'] = f'DEF-hand.{s}'
    for p in ('01', '02', '03', '04'):
        explicit[f'DEF-palm.{p}.{s}'] = f'DEF-hand.{s}'


def deform_parent(b):
    if b.name in explicit:
        return explicit[b.name]
    p = b.parent
    while p:
        if p.name in deform and p.name != b.name:
            return p.name
        twin = 'DEF-' + p.name[4:] if p.name.startswith(('ORG-', 'MCH-')) else None
        if twin in deform and twin != b.name:
            return twin
        p = p.parent
    return None


parents = {n: deform_parent(arm.bones[n]) for n in deform}
bpy.context.view_layer.objects.active = rig
for o in bpy.context.selected_objects:
    o.select_set(False)
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.edit_bones
for n, p in parents.items():
    eb[n].parent = eb[p] if p else None
    eb[n].use_connect = False
for b in list(eb):
    if b.name not in deform:
        eb.remove(b)
bpy.ops.object.mode_set(mode='OBJECT')
print('RIG', len(arm.bones), 'bones; roots', [b.name for b in arm.bones if not b.parent])


# Materials: Principled BSDF from the images each source material uses (classified by name: *_d / Base_Color is
# colour, *_n / Normal is the normal map, *_r / Roughness is roughness), with fixed settings for the rest.
def img(name):
    im = bpy.data.images.get(name)
    if not im and textures and (textures / name).exists():
        im = bpy.data.images.load(str(textures / name), check_existing=True)
    if not im:
        print('NO_IMAGE', name)
    return im


def source_images(mat):
    found = {}
    for n in (mat.node_tree.nodes if mat.node_tree else []):
        if n.type != 'TEX_IMAGE' or not n.image:
            continue
        stem = n.image.name.split('.png')[0].lower()
        role = 'bc' if stem.endswith('_d') or 'base_color' in stem else 'n' if stem.endswith('_n') or 'normal' in stem else 'r' if stem.endswith('_r') or 'roughness' in stem else None
        if role and role not in found:
            found[role] = n.image.name
    return found


def bleed(im):
    """Colour of the transparent texels = average colour of the opaque ones (no light fringes at cut-out edges)."""
    import numpy
    px = numpy.empty(im.size[0] * im.size[1] * 4, dtype=numpy.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    solid = px[:, 3] >= .5
    if solid.any() and (~solid).any():
        px[~solid, :3] = px[solid, :3].mean(axis=0)
        im.pixels.foreach_set(px.ravel())
        im.pack()
        print('BLEED', im.name, int((~solid).sum()), 'texels')


def principled(mat, bc=None, n=None, r=None, color=None, rough=None, alpha_from_bc=False, metal=0.0):
    old = next((x for x in mat.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None) if mat.node_tree else None
    keep_color = tuple(old.inputs['Base Color'].default_value) if old else (.8, .8, .8, 1)
    keep_metal = old.inputs['Metallic'].default_value if old else metal
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(p.outputs[0], o.inputs[0])
    p.inputs['Metallic'].default_value = metal if metal else keep_metal
    if bc and img(bc):
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = img(bc)
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
        if alpha_from_bc:
            nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
    else:
        p.inputs['Base Color'].default_value = color or keep_color
    if n and img(n):
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = img(n)
        t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    if r and img(r):
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = img(r)
        t.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(t.outputs['Color'], p.inputs['Roughness'])
    else:
        p.inputs['Roughness'].default_value = rough if rough is not None else .5


HAIR = ('hair_front', 'hair_inner', 'hair_outer', 'hair_mid')
fixed = {
    'nail': dict(rough=.3), 'nail.001': dict(rough=.3), 'teeth': dict(rough=.3), 'gum_tongue': dict(rough=.4),
    'eyelash': dict(bc='eyelash.png', alpha_from_bc=True, rough=.6),
    'eyebrow': dict(color=(.07, .035, .022, 1), rough=.7),
    'pupil': dict(rough=.15),
    'button': dict(color=(.9, .9, .88, 1), rough=.35),
    'underwear': dict(color=(.2, .03, .04, 1), n='bikini_n.png', r='bikini_r.png'),
    'shoes': dict(rough=.35),
    # Hair: a little rougher than the source's EEVEE sheen, which shows as sparkle on alpha-tested cards.
    **{h: dict(alpha_from_bc=True, rough=.62) for h in HAIR},
}
used = {s.material.name for o in meshes for s in o.material_slots if s.material}
bled = set()
for name in sorted(used):
    mat = bpy.data.materials[name]
    spec = {**source_images(mat), **fixed.get(name, {})}
    if name in HAIR and spec.get('bc') and spec['bc'] not in bled:
        bleed(img(spec['bc']))
        bled.add(spec['bc'])
    print('MATERIAL', name, {k: v for k, v in spec.items() if k in ('bc', 'n', 'r')})
    principled(mat, **spec)

for o in meshes:
    print('PART', o.name, sum(len(p.vertices) - 2 for p in o.data.polygons), 'tris',
          [k.name for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else [])
for o in list(bpy.data.objects):
    if o not in meshes and o != rig:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.outliner.orphans_purge(do_recursive=True)
out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
print('PREPARED', out)
