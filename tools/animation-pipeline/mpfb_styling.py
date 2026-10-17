"""Cyberpunk styling for MPFB characters (used by build_mpfb_character.py; Blender only).

Spec keys (see characters/*.json):
  "style": {asset: {"recolor": [...], "glow": [...]}}   asset = a clothes name, "hair" or "body"
    recolor: {"color": [r,g,b], "level": 0.9, "strength": 1.0, "select": {...}}
             Re-tints the texture from its own brightness, so folds and stitching survive.
    glow:    {"mode": "boundary"|"seams"|"key", "color": [r,g,b], "width": 3, "strength": 2.0, "select": {...}}
             Paints an emission texture: "boundary" lights the garment's open edges (hems, cuffs, collar),
             "seams" also lights its UV seams (piping), "key" lights texture areas matched by "select".
    select:  {"hue": [lo, hi], "sat": [lo, hi], "val": [lo, hi]} in 0..1 (hue may wrap, e.g. [0.95, 0.05]).
  "accessories": [{"type": "visor"|"shades"|"mask"|"collar", "color": [r,g,b], "glow": [r,g,b]}]
             Simple hard-surface pieces fitted to the head or neck and parented to that bone.
Colours are 0..1 sRGB. Textures are worked at 1024 px; nothing outside this character is changed.
"""
import bmesh
import bpy
import math
import numpy as np

WORK = 1024


def _upstream_image(socket, seen=None):
    seen = seen or set()
    for link in socket.links:
        node = link.from_node
        if node.name in seen:
            continue
        seen.add(node.name)
        if node.type == 'TEX_IMAGE' and node.image:
            return node
        for inp in node.inputs:
            found = _upstream_image(inp, seen)
            if found:
                return found
    return None


def _bsdf(mat):
    return next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat and mat.use_nodes else None


def _pixels(img):
    work = img.copy()
    work.name = img.name + '.styled'
    if max(work.size) > WORK:
        work.scale(WORK, WORK)
    w, h = work.size
    px = np.empty(w * h * 4, dtype=np.float32)
    work.pixels.foreach_get(px)
    return work, px.reshape(h, w, 4)


def _hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    safe = np.maximum(d, 1e-6)
    hue = np.where(mx == r, ((g - b) / safe) % 6, np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) / 6
    return np.where(d > 1e-6, hue, 0), s, mx


def _select(rgb, sel):
    if not sel:
        return np.ones(rgb.shape[:2], dtype=bool)
    h, s, v = _hsv(rgb)
    m = np.ones(h.shape, dtype=bool)
    if 'hue' in sel:
        lo, hi = sel['hue']
        m &= ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    if 'sat' in sel:
        m &= (s >= sel['sat'][0]) & (s <= sel['sat'][1])
    if 'val' in sel:
        m &= (v >= sel['val'][0]) & (v <= sel['val'][1])
    return m


def _dilate(mask, width):
    out = mask.copy()
    for dy in range(-width, width + 1):
        for dx in range(-width, width + 1):
            if dx * dx + dy * dy <= width * width:
                out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def _edge_mask(obj, w, h, seams):
    mesh = obj.data
    uv = mesh.uv_layers.active.data
    edges = {}
    for poly in mesh.polygons:
        n = poly.loop_total
        for i in range(n):
            a, b = poly.loop_start + i, poly.loop_start + (i + 1) % n
            va, vb = mesh.loops[a].vertex_index, mesh.loops[b].vertex_index
            pair = (tuple(uv[a].uv), tuple(uv[b].uv)) if va < vb else (tuple(uv[b].uv), tuple(uv[a].uv))
            edges.setdefault(mesh.loops[a].edge_index, []).append(pair)
    segs = []
    for pairs in edges.values():
        if len(pairs) == 1:
            segs.append(pairs[0])
        elif seams and len(pairs) == 2:
            (a0, a1), (b0, b1) = pairs
            if max(abs(a0[0] - b0[0]), abs(a0[1] - b0[1]), abs(a1[0] - b1[0]), abs(a1[1] - b1[1])) > 1e-4:
                segs.extend(pairs)
    mask = np.zeros((h, w), dtype=bool)
    for (u0, v0), (u1, v1) in segs:
        n = int(max(abs(u1 - u0) * w, abs(v1 - v0) * h) * 2) + 2
        t = np.linspace(0, 1, n)
        x = np.clip(((u0 + (u1 - u0) * t) % 1.0) * w, 0, w - 1).astype(int)
        y = np.clip(((v0 + (v1 - v0) * t) % 1.0) * h, 0, h - 1).astype(int)
        mask[y, x] = True
    return mask


def style_object(obj, rules):
    for slot in obj.material_slots:
        mat = slot.material
        bsdf = _bsdf(mat)
        if not bsdf:
            continue
        tex = _upstream_image(bsdf.inputs['Base Color'])
        if not tex:
            print('VR_STYLE no texture on', obj.name)
            continue
        work, px = _pixels(tex.image)
        original = px[..., :3].copy()
        h, w = px.shape[:2]
        for rc in rules.get('recolor', []):
            sel = _select(original, rc.get('select'))
            lum = original @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
            ref = np.percentile(lum[sel], 90) if sel.any() else 1.0
            tint = np.clip(lum / max(ref, 1e-3) * rc.get('level', 0.9), 0, 1.2)[..., None] * np.array(rc['color'], dtype=np.float32)
            k = rc.get('strength', 1.0)
            px[..., :3] = np.where(sel[..., None], px[..., :3] * (1 - k) + tint * k, px[..., :3])
        work.pixels.foreach_set(np.clip(px, 0, 1).ravel())
        work.pack()
        tex.image = work
        glow = np.zeros((h, w, 3), dtype=np.float32)
        strength = 0.0
        for g in rules.get('glow', []):
            if g['mode'] == 'key':
                m = _select(original, g.get('select'))
            else:
                m = _edge_mask(obj, w, h, g['mode'] == 'seams')
            m = _dilate(m, g.get('width', 3))
            if g['mode'] != 'key' and g.get('select'):
                m &= _select(original, g['select'])
            glow = np.where(m[..., None], np.array(g['color'], dtype=np.float32), glow)
            strength = max(strength, g.get('strength', 2.0))
        if strength:
            img = bpy.data.images.new(mat.name + '.glow', w, h, alpha=False)
            img.pixels.foreach_set(np.concatenate([glow, np.ones((h, w, 1), np.float32)], -1).ravel())
            img.pack()
            node = mat.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = img
            uvsrc = tex.inputs['Vector'].links[0].from_socket if tex.inputs['Vector'].is_linked else None
            if uvsrc:
                mat.node_tree.links.new(uvsrc, node.inputs['Vector'])
            mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Emission Color'])
            bsdf.inputs['Emission Strength'].default_value = strength
        print('VR_STYLE', obj.name, 'recolor', len(rules.get('recolor', [])), 'glow', len(rules.get('glow', [])))


def _slice(objs, z0, z1, near, radius):
    pts = []
    for o in objs:
        mw = o.matrix_world
        for v in o.data.vertices:
            p = mw @ v.co
            if z0 <= p.z <= z1 and math.hypot(p.x - near.x, p.y - near.y) < radius:
                pts.append((p.x, p.y))
    a = np.array(pts)
    lo, hi = a.min(0), a.max(0)
    return (lo + hi) / 2, (hi - lo) / 2


def _band(name, center, half, z0, z1, arc_deg, margin, thickness=0.004, segments=40):
    cx, cy = center
    ax, by = half[0] + margin, half[1] + margin
    bm = bmesh.new()
    full = arc_deg >= 360
    n = segments if full else segments + 1
    rings = []
    for i in range(n):
        t = math.radians(-arc_deg / 2 + arc_deg * i / segments)
        x, y = cx + ax * math.sin(t), cy - by * math.cos(t)
        rings.append((bm.verts.new((x, y, z0)), bm.verts.new((x, y, z1))))
    for i in range(segments):
        a, b = rings[i], rings[(i + 1) % n]
        bm.faces.new((a[0], b[0], b[1], a[1]))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    mod = obj.modifiers.new('thick', 'SOLIDIFY')
    mod.thickness = thickness
    mod.offset = 1.0
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def _material(name, color, glow=None, strength=1.5, metallic=0.6, roughness=0.3):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = _bsdf(mat)
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if glow:
        bsdf.inputs['Emission Color'].default_value = (*glow, 1)
        bsdf.inputs['Emission Strength'].default_value = strength
    mat.use_backface_culling = False
    return mat


def _attach(obj, rig, bone, mat):
    obj.data.materials.append(mat)
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = 'BONE'
    obj.parent_bone = bone
    obj.matrix_world = world


def add_accessories(rig, basemesh, accessories, name):
    if not accessories:
        return
    bpy.context.view_layer.update()
    kids = [c for c in rig.children if c.type == 'MESH']
    eyes = next(c for c in kids if 'low-poly' in c.name)
    ez = sum((eyes.matrix_world @ v.co).z for v in eyes.data.vertices) / len(eyes.data.vertices)
    head = rig.matrix_world @ rig.data.bones['mixamorig:Head'].head_local
    neck = rig.matrix_world @ rig.data.bones['mixamorig:Neck'].head_local
    for i, acc in enumerate(accessories):
        kind, color, glow = acc['type'], acc.get('color', [0.03, 0.035, 0.045]), acc.get('glow')
        tag = f'{name}.{kind}{i}'
        if kind in ('visor', 'shades'):
            z0, z1 = (ez - 0.02, ez + 0.022) if kind == 'visor' else (ez - 0.012, ez + 0.012)
            c, r = _slice([basemesh], z0, z1, head, 0.14)
            band = _band(tag, c, r, z0, z1, 210 if kind == 'visor' else 160, 0.012)
            _attach(band, rig, 'mixamorig:Head', _material(tag, color, glow or [0.1, 0.9, 1.0], acc.get('strength', 0.45), 0.8, 0.15))
        elif kind == 'mask':
            z0, z1 = ez - 0.105, ez - 0.032
            c, r = _slice([basemesh], z0, z1, head, 0.14)
            band = _band(tag, c, r, z0, z1, 200, 0.007, 0.005)
            _attach(band, rig, 'mixamorig:Head', _material(tag, color, None, 0, 0.3, 0.55))
            if glow:
                for j, dz in enumerate((0.022, 0.042)):
                    slit = _band(f'{tag}.slit{j}', c, r, z0 + dz, z0 + dz + 0.004, 70, 0.0125, 0.002, 16)
                    _attach(slit, rig, 'mixamorig:Head', _material(f'{tag}.slit{j}', [0.05, 0.05, 0.05], glow, acc.get('strength', 2.0)))
        elif kind == 'collar':
            z0, z1 = neck.z + 0.0, neck.z + 0.03
            c, r = _slice(kids, z0, z1, neck, 0.16)
            band = _band(tag, c, r, z0, z1, 360, 0.004, 0.006, 48)
            _attach(band, rig, 'mixamorig:Neck', _material(tag, color, glow, acc.get('strength', 2.0)))
        print('VR_ACCESSORY', tag)


def apply_style(spec, rig, basemesh):
    for asset, rules in spec.get('style', {}).items():
        key = spec['hair'] if asset == 'hair' else asset
        targets = [basemesh] if asset == 'body' else [c for c in rig.children if c.type == 'MESH' and c is not basemesh and (key in c.name or any(key in (s.material.name if s.material else '') for s in c.material_slots))]
        if not targets:
            raise RuntimeError(f'style: no mesh for {asset}')
        for obj in targets:
            style_object(obj, rules)
