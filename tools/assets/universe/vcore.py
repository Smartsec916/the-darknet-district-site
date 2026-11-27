"""Shared helpers for the universe-graphics Blender builds (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). Run with the `bpy` package (5.x).

Everything is authored in GAME coordinates (X right, Y up, Z forward, metres) and written into Blender as (-x, -z, y) (Babylon's loader mirrors X), which the glTF exporter (Y up) and Babylon's
loader bring back to exactly the same game coordinates. Faces are given an outward hint, so winding is always right whatever the mapping does to handedness.
Light is baked into vertex colours (COLOR_0) from a lamp list, so the room needs no per-frame lights and no shadow maps.
Made by Claude for this project; no third-party assets."""
import bpy, bmesh, math, os
import numpy as np
from mathutils import Vector

SLAB = 12.0


class Mat:
    def __init__(self, name, tex=None, tile=4.0, emissive=None, strength=1.0, rough=.6, metal=0.0, color=(.5, .5, .5)):
        self.name, self.tex, self.tile, self.emissive, self.strength, self.rough, self.metal, self.color = name, tex, tile, emissive, strength, rough, metal, color


class Builder:
    """Collects faces by (slab along z, material); bake() adds vertex-colour light; write() exports one glb with one object per slab."""

    def __init__(self, mats, slab=SLAB):
        self.mats = {m.name: m for m in mats}
        self.names = list(self.mats)
        self.slab = slab
        self.faces = []      # (verts[game xyz tuples], matname, smooth, normal hint)
        self.lamps = []      # (pos, rgb, intensity, radius)
        self.tris = 0

    # ---- primitives (game coordinates) ----
    def quad(self, pts, mat, hint, smooth=False):
        self.faces.append(([tuple(map(float, p)) for p in pts], mat, smooth, tuple(map(float, hint))))

    def tri(self, pts, mat, hint, smooth=False):
        self.quad(pts, mat, hint, smooth)

    def box(self, lo, hi, mat, faces='all'):
        x0, y0, z0 = lo; x1, y1, z1 = hi
        q = [((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1), (1, 0, 0), 'e'), ((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0), 'w'),
             ((x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (0, 1, 0), 't'), ((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0), 'b'),
             ((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1), 'n'), ((x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (0, 0, -1), 's')]
        for a, b, c, d, n, k in q:
            if faces == 'all' or k in faces:
                self.quad((a, b, c, d), mat, n)

    def beam(self, a, b, w, h, mat, up=(0, 1, 0)):
        """An oriented box from a to b, w wide and h deep (h along `up` projected)."""
        a, b = np.array(a, float), np.array(b, float)
        d = b - a
        L = np.linalg.norm(d)
        if L < 1e-6:
            return
        d /= L
        u = np.array(up, float)
        s = np.cross(d, u)
        if np.linalg.norm(s) < 1e-6:
            s = np.cross(d, (1, 0, 0))
        s /= np.linalg.norm(s)
        t = np.cross(s, d)
        c = [a + s * sx * w / 2 + t * ty * h / 2 for sx, ty in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        e = [p + d * L for p in c]
        self.quad((c[0], c[1], c[2], c[3]), mat, -d)
        self.quad((e[3], e[2], e[1], e[0]), mat, d)
        for i in range(4):
            j = (i + 1) % 4
            mid = (c[i] + c[j]) / 2 - (a)
            self.quad((c[i], e[i], e[j], c[j]), mat, mid - d * np.dot(mid, d))

    def cyl(self, a, b, r, mat, seg=10, caps=True, r2=None):
        a, b = np.array(a, float), np.array(b, float)
        d = b - a
        L = np.linalg.norm(d)
        d /= L
        s = np.cross(d, (0, 1, 0))
        if np.linalg.norm(s) < 1e-6:
            s = np.array((1, 0, 0.))
        s /= np.linalg.norm(s)
        t = np.cross(d, s)
        r2 = r if r2 is None else r2
        ring = lambda p, rr: [p + (s * math.cos(2 * math.pi * i / seg) + t * math.sin(2 * math.pi * i / seg)) * rr for i in range(seg)]
        A, B = ring(a, r), ring(b, r2)
        for i in range(seg):
            j = (i + 1) % seg
            mid = (A[i] + A[j]) / 2 - a
            self.quad((A[i], B[i], B[j], A[j]), mat, mid - d * np.dot(mid, d), smooth=True)
        if caps:
            self.quad(A[::-1], mat, -d)
            self.quad(B, mat, d)

    def grid(self, P, mat, hint_fn, smooth=True):
        nu, nv = P.shape[:2]
        for i in range(nu - 1):
            for j in range(nv - 1):
                q = (P[i, j], P[i + 1, j], P[i + 1, j + 1], P[i, j + 1])
                c = sum(q) / 4
                self.quad(q, mat, hint_fn(c), smooth)

    def lamp(self, pos, rgb, intensity=1.0, radius=10.0):
        self.lamps.append((np.array(pos, float), np.array(rgb, float), intensity, radius))

    # ---- baking ----
    def light(self, p, n):
        """Baked light at a point: a cool dark ambient (a little more from above) plus every lamp."""
        up = .5 + .5 * n[1]
        c = np.array([.25, .23, .24]) * (.55 + .7 * up)
        for pos, rgb, inten, rad in self.lamps:
            d = pos - p
            dist = np.linalg.norm(d)
            if dist > rad * 1.6:
                continue
            ndl = max(0.0, np.dot(n, d / (dist + 1e-6))) * .85 + .15
            fall = 1.6 / (1.0 + (dist / (rad * .45)) ** 2)
            fall *= max(0.0, 1 - (dist / (rad * 1.6)) ** 2)
            c = c + rgb * inten * ndl * fall
        return c

    # ---- materials / export ----
    def make_material(self, m, texdir):
        mat = bpy.data.materials.new(m.name)
        mat.use_nodes = True
        nt = mat.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        bsdf.inputs['Roughness'].default_value = m.rough
        bsdf.inputs['Metallic'].default_value = m.metal
        base = None
        if m.tex:
            def img(suffix, cs):
                node = nt.nodes.new('ShaderNodeTexImage')
                node.image = bpy.data.images.load(os.path.join(texdir, f'{m.tex}_{suffix}.jpg'))
                node.image.colorspace_settings.name = cs
                return node
            c = img('color', 'sRGB'); nrm = img('normal', 'Non-Color'); orm = img('orm', 'Non-Color')
            vc = nt.nodes.new('ShaderNodeAttribute'); vc.attribute_name = 'Col'; vc.attribute_type = 'GEOMETRY'
            mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
            nt.links.new(c.outputs['Color'], mul.inputs[6]); nt.links.new(vc.outputs['Color'], mul.inputs[7])
            nt.links.new(mul.outputs[2], bsdf.inputs['Base Color'])
            nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0
            nt.links.new(nrm.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
            sep = nt.nodes.new('ShaderNodeSeparateColor')
            nt.links.new(orm.outputs['Color'], sep.inputs['Color'])
            nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
        else:
            bsdf.inputs['Base Color'].default_value = (*m.color, 1)
        if m.emissive:
            bsdf.inputs['Emission Color'].default_value = (*m.emissive, 1)
            bsdf.inputs['Emission Strength'].default_value = m.strength
        return mat

    def write(self, path, texdir, mapping=None):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        mats = {n: self.make_material(m, texdir) for n, m in self.mats.items()}
        # bake and bucket faces by slab
        buckets = {}
        for verts, mat, smooth, hint in self.faces:
            c = np.mean(verts, 0)
            buckets.setdefault(int(math.floor(c[2] / self.slab)), []).append((verts, mat, smooth, hint))
        objs = []
        total = 0
        for slab, faces in sorted(buckets.items()):
            me = bpy.data.meshes.new(f'vantor_s{slab}')
            bm = bmesh.new()
            col = bm.loops.layers.color.new('Col')
            uvl = bm.loops.layers.uv.new('UVMap')
            slots = []
            vmap = {}
            for verts, mat, smooth, hint in faces:
                if mat not in slots:
                    slots.append(mat)
                P = [np.array(v) for v in verts]
                nrm = np.cross(P[1] - P[0], P[2] - P[0])
                if np.linalg.norm(nrm) < 1e-9:
                    nrm = np.cross(P[2] - P[0], P[3 % len(P)] - P[0]) if len(P) > 3 else nrm
                if np.linalg.norm(nrm) < 1e-9:
                    continue
                nrm /= np.linalg.norm(nrm)
                if np.dot(nrm, hint) < 0:
                    P = P[::-1]
                    nrm = -nrm
                bverts = [bm.verts.new((-p[0], -p[2], p[1])) for p in P]
                try:
                    f = bm.faces.new(bverts)
                except ValueError:
                    continue
                f.material_index = slots.index(mat)
                f.smooth = smooth
                m = self.mats[mat]
                tile = m.tile
                ax = np.argmax(np.abs(nrm))
                for lp, p in zip(f.loops, P):
                    if ax == 1:
                        uv = (p[0] / tile, p[2] / tile)
                    elif ax == 0:
                        uv = (p[2] / tile, p[1] / tile)
                    else:
                        uv = (p[0] / tile, p[1] / tile)
                    lp[uvl].uv = uv
                    if m.emissive and not m.tex:
                        lp[col] = (1, 1, 1, 1)
                    else:
                        v = self.light(p + nrm * .05, nrm)
                        lp[col] = (float(min(1, v[0])), float(min(1, v[1])), float(min(1, v[2])), 1.0)
            bm.to_mesh(me)
            bm.free()
            for s in slots:
                me.materials.append(mats[s])
            ob = bpy.data.objects.new(f'vantor_s{slab}', me)
            bpy.context.scene.collection.objects.link(ob)
            objs.append(ob)
            total += len(me.polygons)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_materials='EXPORT',
                                  export_image_format='JPEG', export_jpeg_quality=88, export_vertex_color='ACTIVE', export_active_vertex_color_when_no_material=True,
                                  export_cameras=False, export_lights=False, export_attributes=True)
        self.tris = total
        return total
