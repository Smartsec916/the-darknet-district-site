"""Vesper: Ward Repair workshop exterior and yard, and the road kit (docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_vesper.py [outdir]

Writes into void-runner/assets/models/vesper/:
  vesper-workshop.glb  the workshop's outside: corrugated cladding over the existing walls, a low pitched roof with eaves, gutters and a ridge vent, roof plant
                       (condensers on a frame, water tank, vent stacks, cable tray, access ladder), the roller-door barrel and two flood lamps on the front header,
                       a generator skid, stacked spare hull panels, a thruster nozzle on a cradle and a parts rack on the east side, a salvage gantry with a hanging
                       engine block and a tyre stack on the west side, a horizontal fuel tank on a skid (in the existing fuel-tank footprint), and in the yard a
                       ground power cart, a mobile engine hoist and a tarp-covered crate stack.
  vesper-roadkit.glb   one model per piece, placed by vesper.js along the road: reflector post, blank route sign, gate (two posts, raised boom, gate hut), and a
                       concrete kerb block.
Game coordinates (vesper layout, opening-data.js): workshop walls x -13..13, z -23..1, open front at z=1, roof at y 6.2; Kestrel pad x 1..23, z 13..37; shooting range
x 36..49 z -16..0 (fires toward +x); fuel-tank solid 5x5 at (-22, 14). Nothing here is solid or pickable; it stands against walls, inside existing solids, or out of the
walking lanes and Mara's routes. Lit by the scene's own sun and sky; vertex colours carry a tint and a little ambient occlusion only.
Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder, Mat  # noqa: E402
import vesper_textures  # noqa: E402
import bpy, bmesh  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vesper')
TEXDIR = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'vesper-tex')

MATS = [Mat('w_paint', tex='w_paint', tile=2.0), Mat('w_corr', tex='w_corr', tile=2.0), Mat('w_steel', tex='w_steel', tile=2.0), Mat('w_grime', tex='w_grime', tile=1.0),
        Mat('w_tarp', tex='w_tarp', tile=2.0), Mat('w_rubber', color=(.05, .05, .05), rough=.9, metal=0.0), Mat('w_concrete', color=(.55, .52, .48), rough=.95, metal=0.0),
        Mat('w_lens', emissive=(1.0, .78, .48), strength=3.0), Mat('w_amber', emissive=(1.0, .55, .15), strength=2.0), Mat('w_red', emissive=(1.0, .12, .06), strength=2.0),
        Mat('w_reflector', color=(.9, .55, .12), rough=.25, metal=0.0), Mat('w_glass', color=(.06, .08, .09), rough=.08, metal=.2),
        Mat('k_paint', color=(1, 1, 1), rough=.7, metal=.1), Mat('k_steel', color=(.55, .55, .54), rough=.5, metal=.7)]

# tints (multiply the near-white paint maps)
OCHRE, OLIVE, GREY, RED, SAND, DARK, WHITE, BLUE = (.80, .58, .30), (.47, .48, .36), (.62, .62, .60), (.60, .24, .16), (.78, .70, .58), (.30, .30, .30), (1, 1, 1), (.38, .45, .52)


class VB(Builder):
    """vcore Builder with a per-face tint and a sunlit-scene vertex colour (tint x soft ambient occlusion: darker low down and on downward faces)."""

    def __init__(self, mats, slab=1000):
        super().__init__(mats, slab)
        self.tint = WHITE
        self.tints = []

    def quad(self, pts, mat, hint, smooth=False):
        super().quad(pts, mat, hint, smooth)
        self.tints.append(self.tint)

    def shade(self, p, n, tint):
        ao = .78 + .22 * (.5 + .5 * n[1])
        ao *= .82 + .18 * min(1.0, max(0.0, p[1] / 1.2))      # ground contact darkening
        return np.power(np.array(tint, float), .6) * ao      # the colour layer is sRGB: lift the tint so dusk-lit metal stays readable (dark, not black)

    def write_objects(self, path, groups):
        """groups: {object name: [face indices]} -> one object per group, exported as one glb."""
        bpy.ops.wm.read_factory_settings(use_empty=True)
        mats = {n: self.make_material(m, TEXDIR) for n, m in self.mats.items()}
        objs, total = [], 0
        for name, idx in groups.items():
            me = bpy.data.meshes.new(name)
            bm = bmesh.new()
            col = bm.loops.layers.color.new('Col')
            uvl = bm.loops.layers.uv.new('UVMap')
            slots = []
            for k in idx:
                verts, mat, smooth, hint = self.faces[k]
                tint = self.tints[k]
                if mat not in slots:
                    slots.append(mat)
                P = [np.array(v) for v in verts]
                nrm = np.cross(P[1] - P[0], P[2] - P[0])
                if np.linalg.norm(nrm) < 1e-9 and len(P) > 3:
                    nrm = np.cross(P[2] - P[0], P[3] - P[0])
                if np.linalg.norm(nrm) < 1e-9:
                    continue
                nrm /= np.linalg.norm(nrm)
                if np.dot(nrm, hint) < 0:
                    P = P[::-1]
                    nrm = -nrm
                try:
                    f = bm.faces.new([bm.verts.new((-p[0], -p[2], p[1])) for p in P])
                except ValueError:
                    continue
                f.material_index = slots.index(mat)
                f.smooth = smooth
                m = self.mats[mat]
                ax = np.argmax(np.abs(nrm))
                for lp, p in zip(f.loops, P):
                    lp[uvl].uv = (p[0] / m.tile, p[2] / m.tile) if ax == 1 else (p[2] / m.tile, p[1] / m.tile) if ax == 0 else (p[0] / m.tile, p[1] / m.tile)
                    if m.emissive:
                        lp[col] = (1, 1, 1, 1)
                    else:
                        v = self.shade(p, nrm, tint)
                        lp[col] = (float(min(1, v[0])), float(min(1, v[1])), float(min(1, v[2])), 1.0)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
            bm.to_mesh(me)
            bm.free()
            # make 'Col' the active/render colour so the exporter writes it as COLOR_0 (otherwise it adds a white COLOR_0 and ships the tint as COLOR_1, which Babylon ignores)
            me.color_attributes.active_color = me.color_attributes['Col']
            me.color_attributes.render_color_index = 0
            for s in slots:
                me.materials.append(mats[s])
            ob = bpy.data.objects.new(name, me)
            bpy.context.scene.collection.objects.link(ob)
            objs.append(ob)
            total += len(me.polygons)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_materials='EXPORT',
                                  export_image_format='JPEG', export_jpeg_quality=82, export_vertex_color='ACTIVE', export_active_vertex_color_when_no_material=True,
                                  export_cameras=False, export_lights=False, export_attributes=True)
        return total


def corr_texture(d, n=512):
    """Corrugated sheet: the paint map with a vertical sine profile in the normal map (one corrugation per 7.6 cm at the 2 m tile)."""
    from vesper_textures import _normal, _orm, _spectral, _step, _jpg
    gy, gx = np.mgrid[0:n, 0:n]
    prof = .5 + .5 * np.sin(gx / n * 2 * np.pi * 26)
    dent = _spectral(n, 101, 2.6, lo=2)
    dust = _step(.5, .9, _spectral(n, 102, 2.2, ax=1.0, ay=.3, lo=2))
    rust = _step(.62, .85, _spectral(n, 103, 1.8, lo=3)) * (.4 + .6 * _step(.6, 1, gy / n))
    streak = _step(.55, .9, _spectral(n, 104, 2.0, ax=.15, ay=1.0, lo=4))
    h = .5 * prof + .3 * dent
    col = np.array([.80, .78, .74])[None, None, :] * (.85 + .2 * dent[..., None]) * (.9 + .1 * prof[..., None])
    col = col * (1 - .25 * dust[..., None]) + dust[..., None] * np.array([.70, .58, .44]) * .25
    col = col * (1 - .3 * streak[..., None])
    col = col * (1 - rust[..., None] * .65) + rust[..., None] * np.array([.42, .21, .10]) * .65
    _jpg(os.path.join(d, 'w_corr_color.jpg'), col * 255)
    _jpg(os.path.join(d, 'w_corr_normal.jpg'), _normal(h, 6.0), 90)
    _jpg(os.path.join(d, 'w_corr_orm.jpg'), _orm(.8 + .2 * prof, (.7 + .2 * dust - .2 * rust * 0).clip(0, 1), (.35 * (1 - rust)).clip(0, 1)), 90)


# ------------------------------------------------------------------ helpers ------------------------------------------------------------------
def tinted(B, t):
    B.tint = t
    return B


def louvres(B, x0, x1, y0, y1, z, mat='w_steel', step=.12, out=1):
    for y in np.arange(y0, y1, step):
        B.beam((x0, y, z), (x1, y, z), .04, .1, mat, up=(0, 0, 1))


def ladder(B, x, z0, y0, y1, dx=0.0, w=.45, mat='w_steel'):
    """Vertical ladder; rails at z0 +- w/2, offset in x by dx."""
    for s in (-1, 1):
        B.box((x - .03 + dx, y0, z0 + s * w / 2 - .03), (x + .03 + dx, y1, z0 + s * w / 2 + .03), mat)
    for y in np.arange(y0 + .3, y1, .3):
        B.cyl((x + dx, y, z0 - w / 2), (x + dx, y, z0 + w / 2), .016, mat, seg=6, caps=False)


def drum(B, x, z, r=.29, h=.88, tint=RED, y=0.0):
    tinted(B, tint)
    B.cyl((x, y, z), (x, y + h, z), r, 'w_paint', seg=14)
    for yy in (y + h * .33, y + h * .66):
        B.cyl((x, yy - .015, z), (x, yy + .015, z), r + .012, 'w_paint', seg=14, caps=False)


def crate(B, x, z, w=1.0, h=.7, d=.8, tint=OLIVE, y=0.0, yaw=0.0):
    tinted(B, tint)
    c, s = math.cos(yaw), math.sin(yaw)
    def P(a, b, yy):
        return (x + a * c + b * s, yy, z - a * s + b * c)
    hw, hd = w / 2, d / 2
    pts = [P(-hw, -hd, 0), P(hw, -hd, 0), P(hw, hd, 0), P(-hw, hd, 0)]
    top = [(p[0], y + h, p[2]) for p in pts]
    bot = [(p[0], y, p[2]) for p in pts]
    B.quad(top, 'w_paint', (0, 1, 0))
    for i in range(4):
        j = (i + 1) % 4
        mid = ((bot[i][0] + bot[j][0]) / 2 - x, 0, (bot[i][2] + bot[j][2]) / 2 - z)
        B.quad((bot[i], bot[j], top[j], top[i]), 'w_paint', mid)
    # corner straps
    tinted(B, DARK)
    for p in pts:
        B.box((p[0] - .03, y, p[2] - .03), (p[0] + .03, y + h + .005, p[2] + .03), 'w_steel')


def tyre(B, x, y, z, r=.48, w=.32, axis='y'):
    tinted(B, WHITE)
    a = np.array((x, y, z), float)
    d = {'y': (0, w, 0), 'x': (w, 0, 0), 'z': (0, 0, w)}[axis]
    b = a + np.array(d)
    B.cyl(a, b, r, 'w_rubber', seg=16)
    B.cyl(a - np.array(d) * .02, b + np.array(d) * .02, r * .55, 'w_grime', seg=12)


# ------------------------------------------------------------------ the workshop ------------------------------------------------------------------
def workshop():
    B = VB(MATS)
    groups = {}
    mark = lambda: len(B.faces)
    def group(name, start):
        groups.setdefault(name, []).extend(range(start, len(B.faces)))

    # --- cladding: corrugated sheets just outside the existing side and back walls (solids at x=+-13 and z=-23 are untouched) ---
    s0 = mark()
    rng = np.random.default_rng(7)
    for sx in (-1, 1):
        x = sx * 13.47
        z = -23.3
        while z < 1.2:
            w = min(2.2, 1.2 - z)
            tint = [SAND, SAND, SAND, OCHRE, GREY][rng.integers(0, 5)]
            tinted(B, tint)
            B.box((min(x, x + sx * .05), .35, z), (max(x, x + sx * .05), 6.2, z + w - .02), 'w_corr', faces='ew')
            z += w
        tinted(B, RED)
        B.box((min(x, x + sx * .09), 0, -23.3), (max(x, x + sx * .09), .38, 1.2), 'w_paint', faces='ewt')          # rusty kick plate
        tinted(B, DARK)
        for y in (2.1, 4.2):                                                                                       # girts
            B.box((min(x, x + sx * .1), y, -23.3), (max(x, x + sx * .1), y + .1, 1.2), 'w_steel')
        for z in (-21.2, -.4):                                                                                     # downpipes
            B.cyl((x + sx * .16, 0, z), (x + sx * .16, 6.3, z), .055, 'w_steel', seg=8)
    z = -23.47
    xx = -13.5
    while xx < 13.5:
        tinted(B, [SAND, GREY, SAND, OCHRE][rng.integers(0, 4)])
        B.box((xx, .35, z - .05), (xx + 2.2 - .02, 6.2, z), 'w_corr', faces='s')
        xx += 2.2
    tinted(B, RED)
    B.box((-13.6, 0, -23.56), (13.6, .38, -23.47), 'w_paint', faces='st')
    group('ws_cladding', s0)

    # --- pitched roof over the existing flat roof: eaves overhang, ridge along z at x=0 ---
    s0 = mark()
    eave_y, ridge_y, ov = 6.32, 7.55, .7
    for sx in (-1, 1):
        tinted(B, GREY)
        x0, x1 = sx * (13.5 + ov), 0.0
        for z0 in np.arange(-23.9, 1.9, 3.0):
            z1 = min(z0 + 3.0, 1.9)
            tinted(B, [GREY, SAND, GREY][int((z0 + 30) // 3) % 3])
            pts = ((x0, eave_y, z0), (x1, ridge_y, z0), (x1, ridge_y, z1), (x0, eave_y, z1))
            B.quad(pts, 'w_corr', (sx * .15, 1, 0))
            B.quad([(p[0], p[1] - .06, p[2]) for p in pts], 'w_corr', (0, -1, 0))
        tinted(B, DARK)
        B.box((min(x0, x0 + sx * .18), eave_y - .22, -23.9), (max(x0, x0 + sx * .18), eave_y + .02, 1.9), 'w_steel')     # gutter
    # gable ends (front and back), closing the space between flat roof and pitch
    tinted(B, SAND)
    for z, hz in ((1.32, 1), (-23.55, -1)):
        B.quad(((-13.5, 6.2, z), (13.5, 6.2, z), (13.5, eave_y, z), (-13.5, eave_y, z)), 'w_corr', (0, 0, hz))
        B.quad(((-13.5, eave_y, z), (13.5, eave_y, z), (0, ridge_y, z)), 'w_corr', (0, 0, hz))
    # ridge cap and ridge vent
    tinted(B, DARK)
    B.beam((0, ridge_y + .05, -23.9), (0, ridge_y + .05, 1.9), .5, .12, 'w_steel')
    for z in np.arange(-20, 0, 4.0):
        B.box((-.45, ridge_y, z), (.45, ridge_y + .42, z + 1.6), 'w_steel', faces='ewnst')
        louvres(B, -.46, .46, ridge_y + .08, ridge_y + .38, z - .005, step=.1)
        louvres(B, -.46, .46, ridge_y + .08, ridge_y + .38, z + 1.605, step=.1)
    # front barge board / fascia
    tinted(B, OCHRE)
    for sx in (-1, 1):
        B.beam((sx * (13.5 + ov), eave_y - .05, 1.95), (0, ridge_y - .05, 1.95), .25, .3, 'w_paint', up=(0, 0, 1))
    group('ws_roof', s0)

    # --- roof plant: condensers on a steel frame (west slope), water tank (east slope), vent stacks, cable tray, ladder ---
    s0 = mark()
    def roof_y(x):
        return eave_y + (ridge_y - eave_y) * (1 - abs(x) / (13.5 + ov))
    tinted(B, DARK)
    fx0, fx1, fz0, fz1, fy = -9.6, -3.2, -20.2, -15.8, roof_y(-3.2) + .55
    for x in (fx0, fx1):
        for z in (fz0, fz1):
            B.box((x - .06, roof_y(x) - .05, z - .06), (x + .06, fy, z + .06), 'w_steel')
    B.box((fx0 - .1, fy, fz0 - .1), (fx1 + .1, fy + .12, fz1 + .1), 'w_steel', faces='tnsewb')
    for i, cx in enumerate((-8.1, -4.7)):
        tinted(B, [GREY, SAND][i])
        B.box((cx - 1.25, fy + .12, fz0 + .3), (cx + 1.25, fy + 1.35, fz1 - .3), 'w_paint')
        tinted(B, DARK)
        for side in (fz0 + .29, fz1 - .29):
            louvres(B, cx - 1.15, cx + 1.15, fy + .25, fy + 1.25, side, step=.09)
        B.cyl((cx, fy + 1.35, (fz0 + fz1) / 2), (cx, fy + 1.42, (fz0 + fz1) / 2), .85, 'w_steel', seg=20)       # fan guard
        B.cyl((cx, fy + 1.42, (fz0 + fz1) / 2), (cx, fy + 1.45, (fz0 + fz1) / 2), .2, 'w_grime', seg=10)
        B.cyl((cx + 1.25, fy + .5, fz0 + 1.2), (cx + 2.4, fy + .5, fz0 + 1.2), .05, 'w_grime', seg=6, caps=False)
    # water tank on a stand
    tinted(B, DARK)
    tx, tz = 7.5, -9.0
    for dx, dz in ((-.8, -.8), (.8, -.8), (.8, .8), (-.8, .8)):
        B.box((tx + dx - .06, roof_y(tx + dx), tz + dz - .06), (tx + dx + .06, roof_y(tx) + 1.3, tz + dz + .06), 'w_steel')
    tinted(B, OLIVE)
    ty = roof_y(tx) + 1.3
    B.box((tx - 1.0, ty, tz - 1.0), (tx + 1.0, ty + .1, tz + 1.0), 'w_steel')
    B.cyl((tx, ty + .1, tz), (tx, ty + 2.2, tz), 1.05, 'w_paint', seg=20)
    for yy in (ty + .7, ty + 1.4):
        B.cyl((tx, yy, tz), (tx, yy + .05, tz), 1.07, 'w_steel', seg=20, caps=False)
    tinted(B, DARK)
    B.cyl((tx, ty + 2.2, tz), (tx, ty + 2.5, tz), 1.05, 'w_steel', seg=20, r2=.2)
    B.cyl((tx + .9, ty + .3, tz), (tx + .9, roof_y(tx + .9), tz), .06, 'w_steel', seg=8)
    # vent stacks with rain caps
    for x, z in ((4.0, -17.5), (-10.5, -4.0), (10.8, -20.0)):
        tinted(B, GREY)
        y0 = roof_y(x) - .1
        B.cyl((x, y0, z), (x, y0 + 1.5, z), .16, 'w_steel', seg=10)
        tinted(B, DARK)
        B.cyl((x, y0 + 1.62, z), (x, y0 + 1.82, z), .3, 'w_steel', seg=10, r2=.05)
    # cable tray up the ridge
    tinted(B, DARK)
    B.box((1.2, roof_y(1.2) + .05, -21.5), (1.6, roof_y(1.2) + .15, -1.0), 'w_steel', faces='tew')
    # access ladder on the east wall, near the back corner
    ladder(B, 13.75, -22.4, 0.0, 6.9)
    for y in (2.0, 4.0, 6.0):
        B.box((13.5, y, -22.65), (13.75, y + .05, -22.15), 'w_steel')
    group('ws_roofplant', s0)

    # --- front: roller-door barrel, header brackets, flood lamps (emissive lenses; the scene's own lights do the lighting) ---
    s0 = mark()
    tinted(B, GREY)
    B.cyl((-12.3, 6.0, 1.55), (12.3, 6.0, 1.55), .38, 'w_paint', seg=16)
    tinted(B, DARK)
    for x in (-12.4, 12.4):
        B.box((x - .1, 5.55, 1.15), (x + .1, 6.45, 1.95), 'w_steel')
    for x in (-9.5, 9.5):
        B.box((x - .05, 6.3, 1.4), (x + .05, 6.7, 1.9), 'w_steel')
        B.beam((x, 6.55, 1.9), (x, 6.35, 2.45), .55, .35, 'w_grime', up=(0, 1, 0))
        tinted(B, WHITE)
        B.quad(((x - .23, 6.2, 2.47), (x + .23, 6.2, 2.47), (x + .23, 6.43, 2.4), (x - .23, 6.43, 2.4)), 'w_lens', (0, -.6, 1))
        tinted(B, DARK)
    # electrical box and conduit by the east jamb
    tinted(B, GREY)
    B.box((13.5, 1.2, -.9), (13.85, 2.2, -.2), 'w_paint')
    tinted(B, DARK)
    B.cyl((13.68, 2.2, -.55), (13.68, 6.25, -.55), .035, 'w_steel', seg=6)
    tinted(B, WHITE)
    B.box((13.86, 1.95, -.5), (13.88, 2.05, -.4), 'w_amber')
    group('ws_front', s0)

    # --- east side yard: generator skid, panel stack, thruster nozzle on a cradle, parts rack ---
    s0 = mark()
    gx0, gx1, gz0, gz1 = 14.3, 16.6, -21.0, -17.4
    tinted(B, DARK)
    B.box((gx0 - .1, 0, gz0 - .1), (gx1 + .1, .18, gz1 + .1), 'w_steel')
    tinted(B, OLIVE)
    B.box((gx0, .18, gz0), (gx1, 1.85, gz1), 'w_paint')
    tinted(B, DARK)
    louvres(B, gx0 + .2, gx1 - .2, .45, 1.6, gz1 + .005, step=.1)
    louvres(B, gx0 + .2, gx1 - .2, .45, 1.6, gz0 - .005, step=.1)
    B.cyl((gx1 - .5, 1.85, gz0 + .6), (gx1 - .5, 3.7, gz0 + .6), .11, 'w_grime', seg=10)
    B.cyl((gx1 - .5, 3.7, gz0 + .6), (gx1 - .5, 3.85, gz0 + .6), .2, 'w_grime', seg=10, r2=.08)
    B.box((gx0 - .02, .9, gz1 - 1.1), (gx0 + .02, 1.5, gz1 - .5), 'w_steel')
    tinted(B, WHITE)
    B.box((gx0 - .04, 1.35, gz1 - .95), (gx0 - .02, 1.42, gz1 - .88), 'w_amber')
    tinted(B, DARK)
    B.cyl((gx0, .3, gz0 + .4), (13.5, .3, gz0 + .4), .05, 'w_rubber', seg=6, caps=False)
    # spare hull panels leaning on the wall
    for i in range(5):
        tinted(B, [SAND, GREY, OCHRE, SAND, BLUE][i])
        z0 = -14.2 + i * .9
        lean = .55 + .05 * i
        B.beam((13.62 + lean, 0, z0), (13.62, 2.6 - .15 * i, z0), 1.35 - .1 * i, .035, 'w_paint', up=(1, 0, 0))
    # thruster nozzle on a cradle
    nx, nz = 17.6, -11.8
    tinted(B, DARK)
    for dx in (-.7, .7):
        B.box((nx + dx - .08, 0, nz - .9), (nx + dx + .08, .55, nz + .9), 'w_steel')
    B.cyl((nx, 1.15, nz - 1.2), (nx, 1.15, nz + .55), .62, 'w_grime', seg=20, r2=.98)      # bell along z: seen side-on from the yard
    B.cyl((nx, 1.15, nz + .55), (nx, 1.15, nz + .9), .98, 'w_grime', seg=20, caps=False)
    B.cyl((nx, 1.15, nz - 1.5), (nx, 1.15, nz - 1.2), .45, 'w_steel', seg=14)
    tinted(B, (.25, .2, .18))
    B.cyl((nx, 1.15, nz + .6), (nx, 1.15, nz + .62), .9, 'w_grime', seg=20)        # sooted throat
    # open parts rack against the wall
    tinted(B, DARK)
    for z in (-8.2, -6.4, -4.6, -2.8):
        B.box((13.55, 0, z - .04), (14.35, 2.4, z + .04), 'w_steel')
    for y in (.35, 1.1, 1.85):
        B.box((13.55, y, -8.2), (14.35, y + .05, -2.8), 'w_steel', faces='tb')
    for i, (y, z) in enumerate([(.4, -7.8), (.4, -6.0), (1.15, -7.4), (1.15, -5.6), (1.15, -3.6), (1.9, -7.0), (1.9, -4.2), (.4, -3.4)]):
        crate(B, 13.95, z, w=.62, h=.38 + .08 * (i % 3), d=.65, y=y, tint=[OLIVE, GREY, OCHRE, RED][i % 4])
    tyre(B, 13.95, 1.9, -5.6, r=.3, w=.18)
    group('ws_east', s0)

    # --- west side: salvage gantry with a hanging engine block, tyre stack, drums ---
    s0 = mark()
    gx, za, zb, gh = -18.0, -20.2, -14.2, 5.0
    tinted(B, OCHRE)
    for z in (za, zb):
        for dx in (-1.6, 1.6):
            B.beam((gx + dx, 0, z), (gx, gh, z), .2, .2, 'w_paint', up=(0, 0, 1))
        B.beam((gx - 1.3, .9, z), (gx + 1.3, .9, z), .12, .12, 'w_paint')
    B.beam((gx, gh, za - .4), (gx, gh, zb + .4), .3, .36, 'w_paint')
    tinted(B, (.2, .2, .2))
    B.box((gx - .2, gh - .6, -17.45), (gx + .2, gh - .2, -16.95), 'w_steel')      # chain hoist
    B.cyl((gx, gh - .6, -17.2), (gx, 2.35, -17.2), .02, 'w_steel', seg=6, caps=False)
    tinted(B, (.36, .36, .36))
    B.box((gx - .55, 1.35, -17.75), (gx + .55, 2.3, -16.65), 'w_grime')            # engine block
    for i in range(3):
        B.cyl((gx - .55, 2.3, -17.5 + i * .35), (gx - .25, 2.55, -17.5 + i * .35), .13, 'w_grime', seg=10)
        B.cyl((gx + .55, 2.3, -17.5 + i * .35), (gx + .25, 2.55, -17.5 + i * .35), .13, 'w_grime', seg=10)
    B.cyl((gx, 1.85, -17.75), (gx, 1.85, -18.1), .28, 'w_steel', seg=14)
    # engine stand under it
    tinted(B, DARK)
    B.box((gx - .7, 0, -18.0), (gx + .7, .12, -16.4), 'w_steel')
    # tyre stack and loose tyres
    for i in range(4):
        tyre(B, -15.2, .32 * i, -3.6, r=.5, w=.3)
    tyre(B, -16.3, .45, -5.0, r=.48, w=.3, axis='x')
    drum(B, -14.4, -11.0, tint=RED)
    drum(B, -14.4, -10.3, tint=BLUE)
    drum(B, -15.1, -10.7, tint=OLIVE)
    group('ws_west', s0)

    # --- fuel tank (replaces the plain cylinder; the 5x5 m fuel-tank solid at (-22, 14) is unchanged) ---
    s0 = mark()
    fx, fz = -22.0, 14.0
    tinted(B, DARK)
    for dz in (-1.5, 1.5):
        B.box((fx - 1.5, 0, fz + dz - .2), (fx + 1.5, .6, fz + dz + .2), 'w_steel')
    B.box((fx - 1.7, 0, fz - 2.2), (fx - 1.45, .12, fz + 2.2), 'w_steel')
    B.box((fx + 1.45, 0, fz - 2.2), (fx + 1.7, .12, fz + 2.2), 'w_steel')
    tinted(B, SAND)
    B.cyl((fx, 1.85, fz - 2.15), (fx, 1.85, fz + 2.15), 1.45, 'w_paint', seg=24)
    tinted(B, GREY)
    for z in (fz - 2.15, fz + 2.15):
        B.cyl((fx, 1.85, z), (fx, 1.85, z + (.25 if z > fz else -.25)), 1.45, 'w_paint', seg=24, r2=1.0)
    tinted(B, RED)
    for z in (fz - 1.0, fz + 1.0):
        B.cyl((fx, 1.85, z - .08), (fx, 1.85, z + .08), 1.465, 'w_paint', seg=24, caps=False)
    tinted(B, DARK)
    B.box((fx - .5, 3.28, fz - .5), (fx + .5, 3.36, fz + .5), 'w_steel')                 # top hatch platform
    B.cyl((fx, 3.36, fz), (fx, 3.5, fz), .3, 'w_steel', seg=12)
    ladder(B, fx + 1.6, fz + .9, 0.0, 3.3, w=.45)
    for z in (fz - .6, fz + .6):
        B.cyl((fx + .3, 3.3, z), (fx + .3, 4.2, z), .025, 'w_steel', seg=6)
    B.cyl((fx + .3, 4.2, fz - .6), (fx + .3, 4.2, fz + .6), .025, 'w_steel', seg=6)
    B.cyl((fx + 1.1, .9, fz + 2.2), (fx + 1.1, .9, fz + 2.6), .07, 'w_grime', seg=8)        # outlet and valve
    tinted(B, RED)
    B.cyl((fx + 1.1, .78, fz + 2.45), (fx + 1.1, 1.02, fz + 2.45), .1, 'w_paint', seg=8)
    group('ws_fueltank', s0)

    # --- yard: ground power cart by the Kestrel, mobile engine hoist and a tarp-covered crate stack in front of the shop ---
    s0 = mark()
    cx, cz = 20.6, 31.0
    tinted(B, OCHRE)
    B.box((cx - .7, .35, cz - 1.1), (cx + .7, 1.35, cz + 1.1), 'w_paint')
    tinted(B, DARK)
    louvres(B, cx - .6, cx + .6, .55, 1.25, cz + 1.105, step=.1)
    B.box((cx - .75, .25, cz - 1.15), (cx + .75, .35, cz + 1.15), 'w_steel')
    for dz in (-.8, .8):
        tyre(B, cx - .87, .22, cz + dz, r=.22, w=.12, axis='x')
        tyre(B, cx + .75, .22, cz + dz, r=.22, w=.12, axis='x')
    B.beam((cx, .45, cz - 1.15), (cx, .2, cz - 2.1), .08, .08, 'w_steel')
    tinted(B, DARK)
    pts = [(cx - .7, 1.0, cz - .5), (cx - 1.6, .05, cz - 1.2), (cx - 2.8, .05, cz - 2.4), (cx - 3.4, .8, cz - 3.3)]
    for a, b in zip(pts[:-1], pts[1:]):
        B.cyl(a, b, .035, 'w_rubber', seg=6, caps=False)
    tinted(B, WHITE)
    B.box((cx + .71, 1.1, cz + .3), (cx + .73, 1.2, cz + .4), 'w_amber')
    # mobile engine hoist (folded boom), west of the shop door
    hx, hz = -9.6, 6.6
    tinted(B, RED)
    for dz in (-.45, .45):
        B.beam((hx - .2, .12, hz + dz), (hx + 1.6, .12, hz + dz * 1.3), .1, .1, 'w_paint')
    B.beam((hx - .2, .12, hz - .5), (hx - .2, .12, hz + .5), .12, .12, 'w_paint')
    B.beam((hx - .2, .12, hz), (hx - .2, 1.7, hz), .14, .14, 'w_paint')
    B.beam((hx - .3, 1.6, hz), (hx + 1.5, 1.9, hz), .12, .14, 'w_paint')
    tinted(B, DARK)
    B.cyl((hx - .1, .5, hz), (hx + .6, 1.65, hz), .05, 'w_steel', seg=8)
    B.cyl((hx + 1.45, 1.85, hz), (hx + 1.45, 1.2, hz), .015, 'w_steel', seg=5, caps=False)
    for dz in (-.45, .45):
        tyre(B, hx + 1.5, .0, hz + dz * 1.3, r=.08, w=.12)
    # tarp-covered crates
    crate(B, -6.2, 9.6, w=1.2, h=.8, d=1.0, tint=OLIVE)
    crate(B, -5.0, 9.8, w=1.0, h=.7, d=.9, tint=GREY, yaw=.2)
    crate(B, -5.7, 9.7, w=1.1, h=.6, d=.9, tint=OCHRE, y=.8, yaw=-.1)
    tinted(B, (.62, .58, .48))
    tp = np.zeros((6, 5, 3))
    for i in range(6):
        for j in range(5):
            u, v = i / 5, j / 4
            x = -6.9 + 2.0 * u
            z = 9.05 + 1.25 * v
            y = 1.42 - .9 * max(0, abs(u - .45) - .2) * 2.2 - .55 * max(0, abs(v - .5) - .25) * 4 + .04 * math.sin(u * 13 + v * 7)
            tp[i, j] = (x, max(.05, y), z)
    B.grid(tp, 'w_tarp', lambda c: (0, 1, 0))
    group('ws_yard', s0)
    return B, groups


# ------------------------------------------------------------------ road kit ------------------------------------------------------------------
def roadkit():
    """Each piece around its own origin (road side x = 0, ground y = 0); vesper.js places copies. The road runs along +z in the piece's frame."""
    B = VB(MATS)
    groups = {}
    mark = lambda: len(B.faces)
    def group(name, start):
        groups.setdefault(name, []).extend(range(start, len(B.faces)))
    # reflector post: 1.1 m, white-painted with a dark band and an amber reflector on each face
    s0 = mark()
    tinted(B, (.86, .84, .80))
    B.box((-.06, 0, -.06), (.06, 1.1, .06), 'k_paint')
    B.box((-.07, 1.1, -.07), (.07, 1.14, .07), 'k_paint')
    tinted(B, DARK)
    B.box((-.062, .78, -.062), (.062, .94, .062), 'k_paint')
    tinted(B, WHITE)
    B.box((-.03, .97, .061), (.03, 1.06, .064), 'w_reflector', faces='n')
    B.box((-.03, .97, -.064), (.03, 1.06, -.061), 'w_reflector', faces='s')
    group('kit_post', s0)
    # blank route sign on two posts (no text: any sign text is the owner's to choose)
    s0 = mark()
    tinted(B, GREY)
    for x in (-.7, .7):
        B.box((x - .04, 0, -.04), (x + .04, 2.5, .04), 'k_steel')
    tinted(B, (.36, .40, .34))
    B.box((-1.0, 1.5, -.03), (1.0, 2.6, .0), 'k_paint')
    tinted(B, (.85, .83, .78))
    B.box((-.95, 1.55, .0), (.95, 1.58, .006), 'k_paint', faces='n')
    B.box((-.95, 2.52, .0), (.95, 2.55, .006), 'k_paint', faces='n')
    group('kit_sign', s0)
    # gate: two steel posts, a raised boom (open: nothing blocks the road) and a small gate hut beside it
    s0 = mark()
    tinted(B, DARK)
    B.box((-.18, 0, -.18), (.18, 1.2, .18), 'k_steel')                    # boom pivot post
    B.box((-.25, 1.2, -.25), (.25, 1.5, .25), 'k_paint')
    tinted(B, (.85, .82, .76))
    ang = math.radians(78)
    L = 7.4
    tip = (0, 1.4 + math.sin(ang) * L, math.cos(ang) * L)
    B.beam((0, 1.4, 0), (0, tip[1], tip[2]), .14, .14, 'k_paint', up=(1, 0, 0))
    tinted(B, RED)
    for k in range(1, 7, 2):
        t0, t1 = k / 7, (k + .55) / 7
        B.beam((0, 1.4 + math.sin(ang) * L * t0, math.cos(ang) * L * t0), (0, 1.4 + math.sin(ang) * L * t1, math.cos(ang) * L * t1), .15, .15, 'k_paint', up=(1, 0, 0))
    tinted(B, DARK)
    B.box((-.12, 1.25, -.6), (.12, 1.55, -.2), 'k_steel')                 # counterweight
    # far-side rest post (road is 7 m wide: the boom would rest at z ~ 7.6 when closed)
    B.box((-.08, 0, 7.45), (.08, 1.0, 7.61), 'k_steel')
    tinted(B, (.85, .82, .76))
    B.box((-.09, 1.0, 7.44), (.09, 1.12, 7.62), 'k_paint')
    # gate hut beside the pivot post, off the road (the road lies across +z from the pivot; it runs along x)
    hx0, hx1, hz0, hz1 = -3.4, -1.0, -3.0, -.6
    tinted(B, SAND)
    B.box((hx0, 0, hz0), (hx1, 2.5, hz1), 'k_paint')
    tinted(B, DARK)
    B.box((hx0 - .25, 2.5, hz0 - .3), (hx1 + .25, 2.62, hz1 + .3), 'k_steel')
    tinted(B, WHITE)
    B.box((hx1 + .001, 1.15, hz0 + .5), (hx1 + .02, 1.95, hz1 - .5), 'w_glass', faces='e')
    B.box((hx0 + .5, 1.15, hz1 + .001), (hx1 - .5, 1.95, hz1 + .02), 'w_glass', faces='n')
    tinted(B, DARK)
    B.box((hx0 + .3, 0, hz0 - .02), (hx0 + 1.2, 2.1, hz0 - .001), 'k_steel', faces='s')
    tinted(B, WHITE)
    B.box((hx1 + .02, 2.25, -.1), (hx1 + .05, 2.38, .1), 'w_amber')
    group('kit_gate', s0)
    # concrete kerb / barrier block (for the parking edge and the bend)
    s0 = mark()
    tinted(B, WHITE)
    B.box((-.25, 0, -1.0), (.25, .45, 1.0), 'w_concrete')
    B.box((-.18, .45, -1.0), (.18, .6, 1.0), 'w_concrete', faces='tew')
    group('kit_block', s0)
    return B, groups


def main(outdir=OUTDIR):
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(TEXDIR, exist_ok=True)
    vesper_textures.build(TEXDIR)
    corr_texture(TEXDIR)
    B, groups = workshop()
    n = B.write_objects(os.path.join(outdir, 'vesper-workshop.glb'), groups)
    print('vesper-workshop.glb faces', n)
    B, groups = roadkit()
    n = B.write_objects(os.path.join(outdir, 'vesper-roadkit.glb'), groups)
    print('vesper-roadkit.glb faces', n)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else OUTDIR)
