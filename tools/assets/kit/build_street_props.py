"""NeoChinatown street props, batch 1 of the graphics modernization (docs/development/GRAPHICS_AUDIT.md). Run with Blender's Python (the `bpy` package, 5.x):

    python tools/assets/kit/build_street_props.py [--preview out.png] [--no-export]

Made in Blender by code for this project (no third-party models or textures). Each prop replaces a box-and-cylinder stand-in in the back alleys
(void-runner/ncz-backalleys.js): the dumpster, crate, pallet, oil drum, generator, wall utility box and caged wall lamp. Their sizes are the stand-ins' sizes,
so nothing about collision or walkable space changes (collision never came from these meshes: it is VoidBackAlleys.solids()).

ONE file, void-runner/assets/models/ncz-props/ncz_street_props.glb, holds every prop as its own top-level node (the game picks one with
VoidAssets.instance(id, parent, '<prop>')). All of them share ONE material, `ncz_props`, whose three textures (colour, normal, metal/roughness) are a 2048 px
atlas of 4 x 4 regions (painted steel, galvanised steel, rust, wood, rubber, hazard paint, labels...), embedded in the file: one download, one material, so
every copy of every prop draws through hardware instancing. Wear and dirt are in the textures; ambient occlusion and worn chamfers are in the vertex colours
(COLOR_0: bright bevels, dark recesses, grime towards the ground). Lamp lenses and the generator's status LED are separate child nodes (`<prop>__lens`,
`<prop>__led`) with their own small material, so the game can give them its own glowing colour.

Conventions: metres. Built here with X = width (along the wall), Y = depth (the FRONT, toward the alley, at -Y), Z = up; exported Y-up, so in the game X = width,
Y = up and the front faces +Z. Origin: floor props at the centre of their footprint on the ground; wall props (utility box, lamp) at the wall, on their centre line."""
import bpy, bmesh, json, math, os, random, sys
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kit_textures as KT  # noqa: E402  (the kit's own tileable noise helpers)
from PIL import Image, ImageDraw, ImageFont, ImageFilter  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'ncz-props')
WORK = os.environ.get('PROPS_WORK') or os.path.join(REPO, 'work', 'street-props')
N, GRID, SPAN, PAD = 2048, 4, 2.0, 10          # atlas size, regions per side, metres one region covers, padding in pixels
R = N // GRID

# The atlas regions (index -> column, row from the top-left).
REG = {name: i for i, name in enumerate(['paint_green', 'paint_blue', 'galv', 'rust', 'plastic', 'crate_wood', 'pallet_wood', 'hazard',
                                         'paint_olive', 'steel_dark', 'labels', 'paint_grey', 'rubber', 'lens', 'spare1', 'spare2'])}
LABELS = {'danger': (0, 0, .5, .25), 'nodump': (.5, 0, 1, .25), 'crate': (0, .25, .5, .5), 'gen': (.5, .25, 1, .5), 'drum': (0, .5, .5, .75),
          'bin_no': (.5, .5, 1, .75), 'panel': (0, .75, .5, 1), 'meter': (.5, .75, 1, 1)}          # sub-rectangles of the `labels` region (u0, v0, u1, v1, from its top-left)


# ---------------------------------------------------------------- textures ----------------------------------------------------------------
def _region_maps(name, n, seed):
    """One region: (colour 0..255, roughness, metalness, height). Wear and dirt here; the vertical axis of a region is height above the ground on side faces,
    so the dirt collects towards the bottom."""
    rng = np.random.default_rng(seed)
    low, mid, fine = KT._spectral(n, seed, 3.0, lo=1.0), KT._spectral(n, seed + 1, 2.2, lo=6.0), KT._spectral(n, seed + 2, 1.0, lo=60.0)
    ys = np.linspace(0, 1, n)[:, None] * np.ones((1, n))             # 0 at the top of the region (high up), 1 at the bottom (the ground)
    ground = KT._step(.55, 1.0, ys)
    drip = KT._step(.80, .97, KT._spectral(n, seed + 5, 3.0, ax=.4, ay=14.0, lo=3.0)) * KT._step(.3, .7, low)
    scratch = KT._hairlines(n, seed + 6, 28) * .55

    def paint(rgb, chip_amt=1.0, under=(118, 112, 104)):
        chip = np.maximum(KT._step(.84, .9, KT._spectral(n, seed + 7, 2.6, lo=4.0)) * KT._step(.3, .62, KT._spectral(n, seed + 8, 2.0, lo=12.0)) * chip_amt, scratch * .9)
        rust = KT._step(.86, .98, KT._spectral(n, seed + 4, 3.0, lo=3.0)) * (.4 + .6 * fine) * (.4 + .6 * ground)
        base = np.array(rgb)[None, None, :] * ((.84 + .3 * low) * (.95 + .1 * mid))[..., None]
        base = base * (1 - .45 * drip[..., None]) * (1 - .35 * ground[..., None])
        bare = np.array(under)[None, None, :] * (.8 + .4 * fine)[..., None]
        c = base * (1 - chip[..., None]) + bare * chip[..., None]
        rustc = np.array([96, 52, 30])[None, None, :] * (.7 + .6 * fine)[..., None]
        c = c * (1 - rust[..., None]) + rustc * rust[..., None]
        rough = (.55 + .18 * (low - .5) + .25 * drip + .15 * ground) * (1 - chip) + .35 * chip
        rough = rough * (1 - rust) + .92 * rust
        metal = .85 * chip * (1 - rust)
        h = .25 * mid + .08 * fine - .9 * chip + .6 * rust * fine
        return c, rough, metal, h

    if name == 'paint_green':
        return paint((60, 90, 68))
    if name == 'paint_blue':
        return paint((52, 72, 106))
    if name == 'paint_olive':
        return paint((84, 86, 66), .8)
    if name == 'paint_grey':
        return paint((92, 96, 100), .7)
    if name in ('galv', 'steel_dark'):
        spangle = KT._spectral(n, seed + 9, .6, lo=90.0)
        tint = (138, 142, 146) if name == 'galv' else (40, 42, 46)
        white = KT._step(.85, .97, KT._spectral(n, seed + 10, 2.8, lo=4.0)) * (name == 'galv')
        c = np.array(tint)[None, None, :] * ((.82 + .3 * low) * (.92 + .16 * spangle))[..., None] * (1 - .5 * drip[..., None]) * (1 - .4 * ground[..., None])
        c = c * (1 - .6 * white[..., None]) + np.array([180, 178, 170]) * .6 * white[..., None]
        c = c * (1 - .6 * scratch[..., None]) + np.array([200, 200, 200]) * .6 * scratch[..., None]
        rough = .42 + .2 * (low - .5) + .1 * spangle + .3 * drip + .2 * ground + .3 * white - .15 * scratch
        metal = (.9 if name == 'galv' else .6) * (1 - .5 * drip - .6 * white) + .3 * scratch
        return c, rough, metal, .1 * spangle + .2 * mid - .8 * scratch
    if name == 'rust':
        pits = KT._step(.6, .9, fine)
        c = np.array([88, 50, 30])[None, None, :] * ((.7 + .5 * low) * (.8 + .4 * mid))[..., None]
        c = c * (1 - .3 * pits[..., None]) + np.array([150, 84, 40]) * (.35 * KT._step(.7, .95, mid))[..., None]
        c = c * (1 - .4 * ground[..., None])
        return c, .78 + .15 * pits, .25 * (1 - pits), .5 * mid + .4 * fine - .5 * pits
    if name in ('plastic', 'rubber'):
        tint = (24, 25, 27) if name == 'plastic' else (18, 18, 19)
        c = np.array(tint)[None, None, :] * ((.85 + .3 * low) * (.95 + .1 * fine))[..., None] * (1 + .5 * scratch[..., None]) * (1 - .2 * ground[..., None])
        c = c + np.array([40, 36, 30]) * (.35 * drip)[..., None]                     # dried dirt streaks
        return c, (.55 if name == 'plastic' else .85) + .15 * (low - .5) + .2 * drip, np.zeros((n, n)), .15 * fine + .2 * mid
    if name in ('crate_wood', 'pallet_wood'):
        boards = 6 if name == 'crate_wood' else 5
        rowpos = (ys * boards) % 1.0
        board_id = np.minimum(np.floor(ys * boards).astype(int), boards - 1)
        grain = KT._spectral(n, seed + 11, 1.6, ax=8.0, ay=.15, lo=4.0)          # long grain along the board
        knots = KT._step(.93, .99, KT._spectral(n, seed + 12, 3.0, lo=8.0))
        tone = rng.uniform(.75, 1.15, boards)[board_id]
        base = (96, 74, 50) if name == 'crate_wood' else (142, 116, 82)
        c = np.array(base)[None, None, :] * (tone * (.78 + .35 * grain) * (1 - .5 * knots))[..., None]
        gap = (KT._step(.0, .03, rowpos) * (1 - KT._step(.97, 1.0, rowpos)))     # dark gaps between boards
        c = c * (.25 + .75 * gap[..., None])
        c = c * (1 - .35 * ground[..., None]) * (1 - .4 * drip[..., None])
        grey = KT._step(.4, .8, low) * .35                                          # weathered to grey in places
        c = c * (1 - grey[..., None]) + np.array([96, 92, 86]) * (.9 + .2 * grain)[..., None] * grey[..., None]
        return c, .82 + .12 * grain, np.zeros((n, n)), .35 * grain + .9 * gap - .3 * knots
    if name == 'hazard':
        xs = np.linspace(0, 1, n)[None, :] * np.ones((n, 1))
        stripe = ((xs + ys) * 10 % 1.0) < .5
        c = np.where(stripe[..., None], np.array([186, 146, 32]), np.array([22, 20, 18])).astype(float)
        chip = np.maximum(KT._step(.8, .9, KT._spectral(n, seed + 7, 2.4, lo=5.0)), scratch)
        c = c * (1 - chip[..., None]) + np.array([90, 86, 80]) * chip[..., None]
        c = c * ((.85 + .3 * low) * (1 - .4 * ground))[..., None]
        return c, .6 + .2 * chip, .4 * chip, .2 * mid - .8 * chip
    if name == 'lens':
        c = np.full((n, n, 3), 210.) * (.9 + .1 * fine)[..., None]
        return c, .25 + .1 * fine, np.zeros((n, n)), .2 * fine
    if name == 'labels':
        return _labels(n, seed)
    c = np.full((n, n, 3), 30.)
    return c, np.full((n, n), .8), np.zeros((n, n)), np.zeros((n, n))


def _font(size, cjk=False):
    for f in (['/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', '/usr/share/fonts/opentype/unifont/unifont.otf'] if cjk else []) + \
             ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def _labels(n, seed):
    """Small printed plates and stencils (fictional operators and wording; English, Chinese and Russian as in the city's signs)."""
    big = 1024                                                      # drawn at 1024 px (cells 512 x 256), then scaled to the region
    im = Image.new('RGB', (big, big), (30, 30, 30))
    d = ImageDraw.Draw(im)
    W, H = big // 2, big // 4

    def cell(key):
        u0, v0, u1, v1 = LABELS[key]
        return int(u0 * big), int(v0 * big)
    x, y = cell('danger')                                           # yellow high-voltage plate
    d.rectangle((x, y, x + W, y + H), fill=(196, 160, 40))
    d.rectangle((x + 8, y + 8, x + W - 8, y + H - 8), outline=(20, 18, 14), width=6)
    d.polygon([(x + 40, y + 100), (x + 80, y + 24), (x + 120, y + 100)], outline=(20, 18, 14), width=6)
    d.line([(x + 82, y + 44), (x + 72, y + 70), (x + 88, y + 68), (x + 76, y + 92)], fill=(20, 18, 14), width=5)
    d.text((x + 140, y + 22), 'DANGER', font=_font(40), fill=(20, 18, 14))
    d.text((x + 140, y + 66), '400 V  高压危险', font=_font(26, True), fill=(20, 18, 14))
    x, y = cell('nodump')                                           # white stencil on dark: no dumping
    d.rectangle((x, y, x + W, y + H), fill=(34, 36, 38))
    d.text((x + 24, y + 20), 'NO DUMPING', font=_font(44), fill=(206, 204, 196))
    d.text((x + 24, y + 74), '禁止倾倒  НЕ БРОСАТЬ', font=_font(28, True), fill=(206, 204, 196))
    x, y = cell('crate')                                            # crate stencil
    d.rectangle((x, y, x + W, y + H), fill=(96, 74, 50))
    d.text((x + 20, y + 14), 'TSL-0419', font=_font(52), fill=(24, 20, 16))
    d.text((x + 20, y + 76), 'KEEP DRY  ↑↑  怕湿', font=_font(28, True), fill=(24, 20, 16))
    x, y = cell('gen')                                              # generator data plate
    d.rectangle((x, y, x + W, y + H), fill=(170, 172, 168))
    d.rectangle((x + 6, y + 6, x + W - 6, y + H - 6), outline=(40, 40, 40), width=3)
    for i, t in enumerate(['GEN-07   45 kVA', '400 V  3~  50 Hz', 'DIESEL ONLY  ДИЗЕЛЬ']):
        d.text((x + 20, y + 14 + i * 38), t, font=_font(28, True), fill=(30, 30, 30))
    x, y = cell('drum')                                             # drum band: flammable
    d.rectangle((x, y, x + W, y + H), fill=(150, 36, 28))
    d.text((x + 24, y + 26), 'FLAMMABLE  易燃', font=_font(42, True), fill=(220, 210, 190))
    d.text((x + 24, y + 80), 'UN 1203   ОГНЕОПАСНО', font=_font(26, True), fill=(220, 210, 190))
    x, y = cell('bin_no')                                           # dumpster number stencil
    d.rectangle((x, y, x + W, y + H), fill=(52, 78, 60))
    d.text((x + 30, y + 18), 'NCZ  SANITATION', font=_font(36), fill=(214, 212, 200))
    d.text((x + 30, y + 70), 'UNIT 3-117   环卫', font=_font(34, True), fill=(214, 212, 200))
    x, y = cell('panel')                                            # utility box control/door label
    d.rectangle((x, y, x + W, y + H), fill=(200, 200, 196))
    d.text((x + 20, y + 16), 'TESSALY GRID', font=_font(36), fill=(30, 30, 30))
    d.text((x + 20, y + 66), 'DISTRIBUTION  配电箱  №14', font=_font(26, True), fill=(30, 30, 30))
    x, y = cell('meter')                                            # gauges and switches
    d.rectangle((x, y, x + W, y + H), fill=(26, 28, 30))
    for k in range(3):
        cx, cy = x + 70 + k * 150, y + 64
        d.ellipse((cx - 46, cy - 46, cx + 46, cy + 46), fill=(220, 216, 200), outline=(80, 80, 80), width=4)
        a = -2.4 + k * 1.1
        d.line((cx, cy, cx + int(36 * math.cos(a)), cy + int(36 * math.sin(a))), fill=(170, 30, 20), width=4)
    arr = np.asarray(im.resize((n, n), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.5)), dtype=float)
    fine, mid = KT._spectral(n, seed + 2, 1.0, lo=60.0), KT._spectral(n, seed + 1, 2.2, lo=6.0)
    scratch = KT._hairlines(n, seed + 6, 120)
    wear = KT._step(.78, .9, KT._spectral(n, seed + 7, 2.4, lo=8.0))
    arr = arr * ((.82 + .25 * mid) * (1 - .35 * wear))[..., None]
    arr = arr * (1 - .5 * scratch[..., None]) + 120 * .5 * scratch[..., None]
    return arr, .6 + .2 * wear + .1 * fine, .2 * scratch, .1 * fine - .5 * scratch


def build_atlas(work):
    os.makedirs(work, exist_ok=True)
    col, rough, metal, height = np.zeros((N, N, 3)), np.zeros((N, N)), np.zeros((N, N)), np.zeros((N, N))
    for name, i in REG.items():
        c, r, m, h = _region_maps(name, R, 900 + 37 * i)
        y0, x0 = (i // GRID) * R, (i % GRID) * R
        col[y0:y0 + R, x0:x0 + R] = c
        rough[y0:y0 + R, x0:x0 + R] = np.clip(r, .08, 1)
        metal[y0:y0 + R, x0:x0 + R] = np.clip(m, 0, 1)
        height[y0:y0 + R, x0:x0 + R] = h
    paths = {k: os.path.join(work, 'ncz_props_%s.jpg' % k) for k in ('color', 'normal', 'orm')}
    Image.fromarray(col.clip(0, 255).astype(np.uint8)).save(paths['color'], quality=90)
    Image.fromarray(KT._normal(height, 3.0)).save(paths['normal'], quality=92)
    orm = np.stack([np.ones((N, N)), rough, metal], -1) * 255
    Image.fromarray(orm.clip(0, 255).astype(np.uint8)).save(paths['orm'], quality=90)
    return paths


# ---------------------------------------------------------------- geometry ----------------------------------------------------------------
class Model:
    """One prop: bmeshes per node ('' is the prop itself, others are its child nodes). Each face carries an atlas region (or an explicit sub-rectangle of
    the labels region) and a wear tone; the vertex colours are worked out from those at the end."""

    def __init__(self, name):
        self.name, self.nodes, self.rng = name, {}, random.Random(name)

    def bm(self, node=''):
        if node not in self.nodes:
            b = bmesh.new()
            b.faces.layers.int.new('reg')
            b.faces.layers.int.new('label')
            b.faces.layers.float.new('tone')
            self.nodes[node] = b
        return self.nodes[node]

    def _tag(self, b, faces, reg, tone, label=None):
        L, T, Lb = b.faces.layers.int['reg'], b.faces.layers.float['tone'], b.faces.layers.int['label']
        for f in faces:
            if f.is_valid:
                f[L], f[T], f[Lb] = REG[reg], tone, (list(LABELS).index(label) + 1) if label else 0
        return faces

    def _finish(self, b, made_verts, reg, tone, bevel, old):
        faces = list({f for v in made_verts for f in v.link_faces})
        for f in faces:
            f.normal_update()
        flats = [f.normal.copy() for f in faces]
        if bevel:
            bmesh.ops.bevel(b, geom=list({e for f in faces for e in f.edges}), offset=bevel, segments=1, affect='EDGES', profile=.5)
            faces = [f for f in b.faces if f not in old]
        self._tag(b, faces, reg, tone)
        for f in faces:                                             # worn chamfers: brighter
            f.normal_update()
            if bevel and not any(f.normal.dot(n) > .999 for n in flats):
                f[b.faces.layers.float['tone']] = tone * 1.45
        return faces

    def box(self, p0, p1, reg, tone=1.0, bevel=.01, node=''):
        b = self.bm(node)
        old = set(b.faces)
        x0, y0, z0 = [min(a, c) for a, c in zip(p0, p1)]
        x1, y1, z1 = [max(a, c) for a, c in zip(p0, p1)]
        made = bmesh.ops.create_cube(b, size=1)
        for v in made['verts']:
            v.co = Vector((x0 + (v.co.x + .5) * (x1 - x0), y0 + (v.co.y + .5) * (y1 - y0), z0 + (v.co.z + .5) * (z1 - z0)))
        return self._finish(b, made['verts'], reg, tone, bevel if min(x1 - x0, y1 - y0, z1 - z0) > bevel * 3 else 0, old)

    def frustum(self, c0, c1, z0, z1, reg, tone=1.0, bevel=.01, node='', off=(0, 0)):
        """A box whose bottom rectangle (half sizes c0) and top rectangle (half sizes c1) differ: a tapered bin body."""
        b = self.bm(node)
        old = set(b.faces)
        made = bmesh.ops.create_cube(b, size=1)
        for v in made['verts']:
            top = v.co.z > 0
            hx, hy = (c1 if top else c0)
            v.co = Vector((off[0] + math.copysign(hx, v.co.x), off[1] + math.copysign(hy, v.co.y), z1 if top else z0))
        return self._finish(b, made['verts'], reg, tone, bevel, old)

    def cyl(self, p0, p1, r, reg, tone=1.0, seg=12, node='', caps=True, r2=None, bevel=0):
        b = self.bm(node)
        old = set(b.faces)
        a, c = Vector(p0), Vector(p1)
        axis = c - a
        made = bmesh.ops.create_cone(b, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=axis.length)
        rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
        for v in made['verts']:
            v.co = rot @ v.co + (a + c) / 2
        return self._finish(b, made['verts'], reg, tone, bevel, old)

    def ring(self, z, r_in, r_out, h, reg, tone=1.0, seg=24, node='', at=(0, 0)):
        """A raised hoop round a vertical drum (a rolling ring or chime): a short tube with a rounded outside."""
        b = self.bm(node)
        old = set(b.faces)
        verts = []
        prof = [(r_in, z - h / 2), (r_out - .004, z - h / 2), (r_out, z - h / 4), (r_out, z + h / 4), (r_out - .004, z + h / 2), (r_in, z + h / 2)]
        rows = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            rows.append([b.verts.new((at[0] + math.cos(a) * rr, at[1] + math.sin(a) * rr, zz)) for rr, zz in prof])
        for i in range(seg):
            r0, r1 = rows[i], rows[(i + 1) % seg]
            for k in range(len(prof) - 1):
                b.faces.new((r0[k], r1[k], r1[k + 1], r0[k + 1]))
            verts += r0
        faces = [f for f in b.faces if f not in old]
        bmesh.ops.recalc_face_normals(b, faces=faces)
        return self._tag(b, faces, reg, tone)

    def plate(self, x0, x1, z0, z1, y, label, node='', facing=-1, axis='y'):
        """A thin printed plate mapped onto one of the labels' sub-rectangles. facing -1: it looks toward -Y (the front)."""
        b = self.bm(node)
        if axis == 'y':
            vs = [b.verts.new(c) for c in ((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1))]
        else:                                                       # on a side wall (x = const), looking toward +X when facing > 0
            vs = [b.verts.new(c) for c in ((y, x0, z0), (y, x1, z0), (y, x1, z1), (y, x0, z1))]
        f = b.faces.new(vs if (facing < 0) == (axis == 'y') else vs[::-1])
        f.normal_update()
        self._tag(b, [f], 'labels', 1.0, label)
        return f


def _unwrap_and_colour(b, origin_lo):
    """UVs: a box projection in metres from the prop's own corner, into each face's atlas region (2 m per region, padded). Labels: stretched over their
    sub-rectangle, mirrored so they read the right way round. Vertex colours: the face's tone times ambient occlusion from height (dark at the ground) and
    a small random spread, so every part reads slightly differently."""
    uv = b.loops.layers.uv.verify()
    col = b.loops.layers.color.verify()
    L, T, Lb = b.faces.layers.int['reg'], b.faces.layers.float['tone'], b.faces.layers.int['label']
    rnd = random.Random(7)
    pad = PAD / R
    for f in b.faces:
        f.normal_update()
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        ua, va = [(1, 2), (0, 2), (0, 1)][ax]
        reg = f[L]
        cx, cy = reg % GRID, reg // GRID
        lab = f[Lb]
        if lab:
            u0, v0, u1, v1 = LABELS[list(LABELS)[lab - 1]]
            us, vs = [l.vert.co[ua] for l in f.loops], [l.vert.co[va] for l in f.loops]
            a0, a1, b0, b1 = min(us), max(us), min(vs), max(vs)
            flip = (ax == 1 and n[1] > 0) or (ax == 0 and n[0] < 0)
            for l in f.loops:
                tu = (l.vert.co[ua] - a0) / max(a1 - a0, 1e-6)
                tv = (l.vert.co[va] - b0) / max(b1 - b0, 1e-6)
                if flip:
                    tu = 1 - tu
                px = (cx + u0 + (u1 - u0) * (.02 + .96 * tu)) / GRID
                py = (cy + v0 + (v1 - v0) * (.02 + .96 * (1 - tv))) / GRID     # image rows run down; tv runs up
                l[uv].uv = (px, 1 - py)
        else:
            flip = (ax == 1 and n[1] > 0) or (ax == 0 and n[0] < 0)
            for l in f.loops:
                tu = (l.vert.co[ua] - origin_lo[ua]) / SPAN
                tv = (l.vert.co[va] - origin_lo[va]) / SPAN
                tu, tv = min(max(tu, 0), 1), min(max(tv, 0), 1)
                if flip:
                    tu = 1 - tu
                px = (cx + pad + (1 - 2 * pad) * tu) / GRID
                py = (cy + pad + (1 - 2 * pad) * (1 - tv)) / GRID
                l[uv].uv = (px, 1 - py)
        tone = f[T] * (.93 + .14 * rnd.random())
        for l in f.loops:
            z = l.vert.co.z - origin_lo[2]
            ao = .55 + .45 * min(1.0, z / .35)                     # contact shadow at the ground
            if n.z < -.5:
                ao *= .6                                            # undersides
            k = max(0, min(1.4, tone * ao))
            l[col] = (min(1, k), min(1, k), min(1, k), 1)


# ---------------------------------------------------------------- the props ----------------------------------------------------------------
def dumpster(colour):
    """A 2 m commercial waste container (the stand-in: 2.0 x 1.1 x 1.3 m). Tapered welded body with ribs, a channel rim, fork pockets, castors, two black
    plastic lids (one slightly lifted), a push bar and a sanitation stencil."""
    m = Model('dumpster_' + colour)
    reg = 'paint_' + colour
    W, D = 2.0, 1.1
    m.frustum((.93, .48), (.99, .54), .12, 1.12, reg, 1.0, .018)
    m.box((-1.0, -.55, 1.08), (1.0, .55, 1.16), reg, .95, .012)                       # the rim channel
    for x in (-.66, -.22, .22, .66):                                                     # vertical ribs, front and back
        for y in (-1, 1):
            m.box((x - .03, y * .555 - .02, .16), (x + .03, y * .555 + .02, 1.06), reg, 1.0, .008)
    for y in (-1, 1):                                                                    # a horizontal band
        m.box((-.97, y * .545 - .018, .55), (.97, y * .545 + .018, .61), reg, 1.0, .008)
    for x in (-1, 1):                                                                    # fork pockets on the ends
        m.box((x * .985 - .03, -.42, .22), (x * .985 + .03, .42, .36), 'steel_dark', .8, .01)
        m.box((x * 1.0 - .02, -.36, .245), (x * 1.0 + .02, .36, .335), 'plastic', .35, 0)   # the pocket's dark opening
        m.box((x * .99 - .025, -.3, .7), (x * .99 + .025, .3, .82), 'steel_dark', .9, .008)  # lifting trunnion bar
    m.box((-.92, -.47, .08), (.92, .47, .13), 'steel_dark', .7, .01)                    # base frame
    for x in (-.78, .78):                                                                # castors: fork, wheel
        for y in (-.36, .36):
            m.box((x - .06, y - .05, .07), (x + .06, y + .05, .12), 'steel_dark', .8, .006)
            m.cyl((x - .035, y, .055), (x + .035, y, .055), .055, 'rubber', .9, 10)
    # lids: hinged at the back (+Y), the front edge on a lip; the right one lifted a little
    for i, x in enumerate((-.5, .5)):
        lift = .05 if i else 0
        m.box((x - .49, -.575, 1.16 + lift), (x + .49, .56, 1.2 + lift), 'plastic', 1.0, .012)
        m.box((x - .46, -.55, 1.2 + lift), (x + .46, .5, 1.235 + lift * .9), 'plastic', 1.05, .01)   # the moulded dome
        for k in (-.3, 0, .3):                                                           # moulded ribs on the lid
            m.box((x + k - .015, -.5, 1.23 + lift), (x + k + .015, .45, 1.255 + lift), 'plastic', 1.15, .004)
        m.box((x - .2, -.6, 1.165 + lift), (x + .2, -.575, 1.19 + lift), 'plastic', 1.2, .004)   # the grip lip
    m.cyl((-.98, .575, 1.17), (.98, .575, 1.17), .022, 'steel_dark', 1.1, 8)               # hinge rod
    m.cyl((-.8, -.605, .9), (.8, -.605, .9), .02, 'galv', 1.2, 8)                       # push bar on stand-offs
    for x in (-.8, .8):
        m.box((x - .02, -.605, .88), (x + .02, -.55, .92), 'galv', 1.0, 0)
    m.plate(-.32, .32, .62, .94, -.575, 'bin_no' if colour == 'green' else 'nodump')
    m.plate(-.3, .3, .64, .94, .575, 'nodump', facing=1)
    return m


def crate():
    """A 1 m wooden shipping crate: plank faces inside a frame of battens, a diagonal brace on the sides, steel corner caps and a stencil."""
    m = Model('crate')
    s, t = .5, .045
    m.box((-s + .02, -s + .02, .02), (s - .02, s - .02, 2 * s - .02), 'crate_wood', 1.0, .006)
    for z0, z1 in ((0, .1), (2 * s - .1, 2 * s)):                                        # top and bottom battens round the four sides
        for y in (-1, 1):
            m.box((-s, y * s - t / 2 - y * t / 2, z0), (s, y * s + t / 2 - y * t / 2, z1), 'crate_wood', 1.12, .008)
        for x in (-1, 1):
            m.box((x * s - t / 2 - x * t / 2, -s + t, z0), (x * s + t / 2 - x * t / 2, s - t, z1), 'crate_wood', 1.12, .008)
    for x in (-1, 1):                                                                     # corner posts
        for y in (-1, 1):
            m.box((x * s - x * .1, y * s - y * .1, .1), (x * s, y * s, 2 * s - .1), 'crate_wood', 1.1, .008)
    for y in (-1, 1):                                                                     # diagonal braces, front and back
        b = m.bm()
        old = set(b.faces)
        made = bmesh.ops.create_cube(b, size=1)
        L = math.hypot(2 * s - .2, 2 * s - .2)
        for v in made['verts']:
            v.co = Vector((v.co.x * L, v.co.y * t, v.co.z * .09))
        bmesh.ops.rotate(b, verts=made['verts'], cent=(0, 0, 0), matrix=__import__('mathutils').Matrix.Rotation(math.radians(45 * y), 3, 'Y'))
        bmesh.ops.translate(b, verts=made['verts'], vec=(0, y * (s - t / 2 + .005), s))
        m._finish(b, made['verts'], 'crate_wood', 1.08, .006, old)
    for x in (-1, 1):                                                                     # steel corner caps on the top corners
        for y in (-1, 1):
            m.box((x * s - x * .12, y * s - y * .12, 2 * s - .06), (x * s + x * .006, y * s + y * .006, 2 * s + .006), 'galv', 1.1, .004)
    m.plate(-.28, .28, .28, .56, -s - .002, 'crate')
    m.plate(-.28, .28, .28, .56, s + .002, 'crate', facing=1)
    return m


def pallet():
    """A 1.2 x 1.0 m pallet, 0.12 m high: five top boards, three stringer boards on nine blocks, three bottom boards."""
    m = Model('pallet')
    W, D = 1.2, 1.0
    for i in range(5):                                                                    # top deck boards run along X
        y = -D / 2 + .07 + i * (D - .14) / 4
        m.box((-W / 2, y - .07, .1), (W / 2, y + .07, .12), 'pallet_wood', .9 + .2 * m.rng.random(), .005)
    for x in (-W / 2 + .05, 0, W / 2 - .05):
        m.box((x - .05, -D / 2, .078), (x + .05, D / 2, .1), 'pallet_wood', .85, 0)   # stringer boards
        for y in (-D / 2 + .05, 0, D / 2 - .05):
            m.box((x - .05, y - .05, .02), (x + .05, y + .05, .078), 'pallet_wood', .75, 0)
        m.box((x - .05, -D / 2, 0), (x + .05, D / 2, .02), 'pallet_wood', .7, 0)      # bottom boards
    return m


def drum(colour):
    """A 200 litre steel drum (r 0.29 m, 0.9 m): rolled chimes top and bottom, two rolling hoops, a lid with two bungs and a hazard band."""
    m = Model('drum_' + colour)
    reg = 'paint_blue' if colour == 'blue' else 'rust'
    r = .285
    m.cyl((0, 0, .015), (0, 0, .885), r, reg, 1.0, 24, caps=False)
    for z in (.3, .6):
        m.ring(z, r - .004, r + .012, .035, reg, 1.2, 24)
    for z in (.015, .885):
        m.ring(z, r - .01, r + .006, .03, reg, 1.3, 24)
    m.cyl((0, 0, .02), (0, 0, .86), r - .006, reg, .6, 24)                                    # the lid / base discs (caps)
    m.cyl((.15, .06, .86), (.15, .06, .885), .032, 'steel_dark', 1.1, 10)                    # bungs
    m.cyl((-.16, -.04, .86), (-.16, -.04, .876), .022, 'steel_dark', 1.1, 8)
    if colour != 'blue':
        b = m.bm()                                                                           # a flammable band wrapped on the front
        old = set(b.faces)
        made = bmesh.ops.create_cone(b, cap_ends=False, segments=24, radius1=r + .002, radius2=r + .002, depth=.16)
        bmesh.ops.translate(b, verts=made['verts'], vec=(0, 0, .45))
        keep = [f for f in b.faces if f not in old]
        drop = [f for f in keep if f.calc_center_median().y > -.12]
        bmesh.ops.delete(b, geom=drop, context='FACES')
        keep = [f for f in b.faces if f not in old]
        m._tag(b, keep, 'labels', 1.0, 'drum')
    return m


def generator():
    """A wheeled-out diesel generator in a sound-proof enclosure (the stand-in: 1.8 x 1.0 x 1.25 m on a skid, an exhaust to 2 m). Louvred front, a control
    panel with gauges and a data plate, latch handles, lifting eyes, a fuel cap, an exhaust with a rain cap, a cable gland, and a status LED (child `__led`)."""
    m = Model('generator')
    W, D = 1.8, 1.0
    m.box((-W / 2, -D / 2, 0), (W / 2, D / 2, .1), 'steel_dark', .7, .01)                  # skid
    for x in (-.6, .6):
        m.box((x - .09, -D / 2 - .01, .02), (x + .09, D / 2 + .01, .08), 'plastic', .4, 0)  # fork channels
    m.box((-W / 2 + .02, -D / 2 + .02, .1), (W / 2 - .02, D / 2 - .02, 1.2), 'paint_olive', 1.0, .03)   # enclosure
    m.box((-W / 2, -D / 2, 1.18), (W / 2, D / 2, 1.25), 'paint_olive', 1.05, .02)          # roof
    for x in (-W / 2 + .02, W / 2 - .02):                                                    # corner pillars
        for y in (-D / 2 + .02, D / 2 - .02):
            m.box((x - .04, y - .04, .1), (x + .04, y + .04, 1.18), 'paint_olive', 1.1, .01)
    # front: a door with louvres (left), the control panel (right)
    m.box((-.82, -.52, .18), (.12, -.49, 1.12), 'paint_olive', .9, .006)                    # door skin
    for k in range(9):
        z = .32 + k * .075
        b = m.box((-.74, -.56, z), (.04, -.5, z + .035), 'paint_olive', .55, .004)            # louvre slats (dark under)
    m.box((-.76, -.53, .3), (.06, -.505, .98), 'plastic', .25, 0)                             # the dark gap behind the slats
    for z in (.3, 1.0):
        m.box((.04, -.56, z - .04), (.08, -.52, z + .04), 'steel_dark', 1.2, .004)            # hinges
    m.box((-.8, -.555, .64), (-.77, -.52, .78), 'galv', 1.3, .004)                            # latch
    m.box((.22, -.53, .5), (.82, -.505, 1.1), 'steel_dark', .8, .006)                         # control panel recess
    m.plate(.26, .78, .84, 1.06, -.533, 'meter')
    m.plate(.26, .78, .56, .78, -.533, 'gen')
    for x in (.33, .45):
        m.cyl((x, -.54, .51), (x, -.56, .51), .02, 'plastic', 1.0, 10)                        # switch knobs
    m.box((.7, -.545, .5), (.78, -.53, .54), 'lens', 1.0, 0, node='led')                     # status LED
    m.plate(-.6, -.12, .16, .28, -.505, 'danger')
    for x in (-.7, .7):                                                                        # lifting eyes
        m.cyl((x, -.03, 1.25), (x, -.03, 1.33), .035, 'steel_dark', 1.1, 8)
        m.ring(1.34, .03, .05, .02, 'steel_dark', 1.2, 10, at=(x, -.03))
    m.cyl((.6, .25, 1.25), (.6, .25, 1.9), .055, 'rust', 1.0, 12)                          # exhaust stack
    m.cyl((.6, .25, 1.9), (.6, .25, 2.0), .075, 'steel_dark', .9, 12, r2=.02)               # rain cap
    m.cyl((.6, .25, 1.3), (.6, .25, 1.36), .08, 'steel_dark', .8, 12)                       # flange
    m.cyl((-.5, .25, 1.25), (-.5, .25, 1.3), .06, 'paint_grey', 1.1, 12)                    # fuel cap
    for x in (W / 2 + .001, -W / 2 - .001):                                                  # side louvres
        for k in range(5):
            z = .45 + k * .1
            s = 1 if x > 0 else -1
            m.box((x - s * .03, -.3, z), (x + s * .02, .3, z + .045), 'paint_olive', .6, .004)
    m.cyl((W / 2 - .1, .48, .3), (W / 2 - .1, .58, .3), .045, 'plastic', .8, 10)            # cable gland at the back
    return m


def utility_box():
    """A wall-mounted electrical cabinet, 0.9 x 0.6 x 0.3 m: a door with a raised seam, hinges, a lock handle, a high-voltage plate, a rain hood, mounting
    rails and two conduits leaving through the bottom."""
    m = Model('utility_box')
    W, H, D = .9, .6, .3
    m.box((-W / 2 - .03, -.025, -H / 2 - .06), (-W / 2 + .03, 0, H / 2 + .06), 'steel_dark', .8, .004)   # mounting rails
    m.box((W / 2 - .03, -.025, -H / 2 - .06), (W / 2 + .03, 0, H / 2 + .06), 'steel_dark', .8, .004)
    m.box((-W / 2, -D, -H / 2), (W / 2, -.025, H / 2), 'paint_grey', 1.0, .012)
    m.box((-W / 2 - .02, -D - .03, H / 2), (W / 2 + .02, -.02, H / 2 + .03), 'paint_grey', 1.1, .006)     # rain hood
    m.box((-W / 2 + .03, -D - .012, -H / 2 + .03), (W / 2 - .03, -D + .002, H / 2 - .03), 'paint_grey', 1.05, .006)   # door
    m.box((-.005, -D - .016, -H / 2 + .04), (.005, -D - .01, H / 2 - .04), 'plastic', .4, 0)          # split between two leaves
    for x in (-W / 2 + .03, W / 2 - .03):
        for z in (-.18, .18):
            m.cyl((x, -D - .01, z - .04), (x, -D - .01, z + .04), .012, 'steel_dark', 1.2, 8)            # hinges
    for x in (-.06, .06):
        m.box((x - .012, -D - .045, -.06), (x + .012, -D - .012, .06), 'galv', 1.3, .004)                 # lock handles
    m.plate(-.38, -.1, .08, .22, -D - .0125, 'danger')
    m.plate(.1, .38, .08, .22, -D - .0125, 'panel')
    for k in range(6):                                                                     # vent slots, low on the door
        x = -.3 + k * .12
        m.box((x - .04, -D - .014, -.22), (x + .04, -D - .011, -.205), 'plastic', .3, 0)
    for x in (-.25, .2):                                                                   # conduits out of the bottom and down the wall
        m.cyl((x, -.16, -H / 2 - .04), (x, -.16, -H / 2), .035, 'steel_dark', .9, 10)
        m.cyl((x, -.16, -H / 2 - .9), (x, -.16, -H / 2 - .04), .022, 'galv', .9, 10)
        m.box((x - .04, -.06, -H / 2 - .5), (x + .04, 0, -H / 2 - .46), 'steel_dark', .8, .003)
        m.box((x - .03, -.19, -H / 2 - .52), (x + .03, -.06, -H / 2 - .44), 'steel_dark', .8, .003)       # saddle clip
    return m


def wall_lamp():
    """A caged bulkhead flood on a short arm (the stand-in: arm 0.36 m, housing 0.42 x 0.16 x 0.3 m centred 0.32 m out). Wall plate, gusseted arm, a sloped
    hood with fins, a wire guard, and the lens as its own child node (`__lens`) so the game gives it its glow."""
    m = Model('wall_lamp')
    m.box((-.08, -.02, -.02), (.08, 0, .2), 'steel_dark', .9, .005)                         # wall plate
    for x in (-.06, .06):
        for z in (0, .18):
            m.cyl((x, -.02, z), (x, -.03, z), .008, 'galv', 1.2, 6)                          # bolts
    m.box((-.035, -.2, .05), (.035, -.02, .11), 'steel_dark', 1.0, .006)                    # the arm
    b = m.bm()                                                                               # a triangular gusset under the arm
    old = set(b.faces)
    vs = [b.verts.new(c) for c in ((-.006, -.02, .05), (-.006, -.16, .05), (-.006, -.02, -.0))]
    vs2 = [b.verts.new((.006, v.co.y, v.co.z)) for v in vs]
    for f in ((vs[0], vs[1], vs[2]), (vs2[2], vs2[1], vs2[0]), (vs[0], vs2[0], vs2[1], vs[1]), (vs[1], vs2[1], vs2[2], vs[2]), (vs[2], vs2[2], vs2[0], vs[0])):
        b.faces.new(f)
    m._tag(b, [f for f in b.faces if f not in old], 'steel_dark', .9)
    m.frustum((.21, .15), (.19, .12), -.04, .07, 'steel_dark', 1.0, .01, off=(0, -.32))     # hood, centred 0.32 m out
    for k in range(5):                                                                       # cooling fins on the hood
        x = -.12 + k * .06
        m.box((x - .006, -.44, .07), (x + .006, -.2, .1), 'steel_dark', 1.1, 0)
    m.box((-.2, -.47, -.085), (.2, -.17, -.04), 'steel_dark', .85, .006)                    # bezel
    m.box((-.17, -.44, -.095), (.17, -.2, -.085), 'lens', 1.0, 0, node='lens')
    for k in range(4):                                                                       # wire guard
        x = -.15 + k * .1
        m.cyl((x, -.45, -.1), (x, -.19, -.1), .006, 'galv', .9, 6)
    m.cyl((-.18, -.32, -.105), (.18, -.32, -.105), .006, 'galv', .9, 6)
    return m


PROPS = [lambda: dumpster('green'), lambda: dumpster('blue'), crate, pallet, lambda: drum('rust'), lambda: drum('blue'), generator, utility_box, wall_lamp]


# ---------------------------------------------------------------- realise and export ----------------------------------------------------------------
def material(paths):
    m = bpy.data.materials.new('ncz_props')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out, bsdf = nt.nodes.new('ShaderNodeOutputMaterial'), nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    def img(k, colour):
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = bpy.data.images.load(paths[k])
        if not colour:
            n.image.colorspace_settings.name = 'Non-Color'
        return n
    col = img('color', True)
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Col'
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1
    nt.links.new(col.outputs['Color'], mix.inputs['A'])
    nt.links.new(vc.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    orm = img('orm', False)
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(orm.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    nrm = img('normal', False)
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(nrm.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    glow = bpy.data.materials.new('ncz_props_glow')                 # lens / LED: the game replaces it with its own glowing colour
    glow.use_nodes = True
    g = glow.node_tree.nodes.get('Principled BSDF')
    g.inputs['Base Color'].default_value = (.9, .8, .6, 1)
    g.inputs['Emission Color'].default_value = (1, .7, .4, 1)
    g.inputs['Emission Strength'].default_value = 2
    return m, glow


def realise(model, mat, glow, x_offset=0.0):
    lo = Vector((1e9,) * 3)
    for b in model.nodes.values():
        for v in b.verts:
            for i in range(3):
                lo[i] = min(lo[i], v.co[i])
    objs, tris, size_lo, size_hi = {}, 0, Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for node, b in model.nodes.items():
        bmesh.ops.remove_doubles(b, verts=b.verts, dist=1e-5)
        _unwrap_and_colour(b, lo)
        for v in b.verts:
            for i in range(3):
                size_lo[i], size_hi[i] = min(size_lo[i], v.co[i]), max(size_hi[i], v.co[i])
        tris += sum(len(f.verts) - 2 for f in b.faces)
        mesh = bpy.data.meshes.new(model.name + ('__' + node if node else ''))
        b.to_mesh(mesh)
        b.free()
        mesh.materials.append(glow if node in ('lens', 'led') else mat)
        if mesh.color_attributes:
            mesh.color_attributes.active_color = mesh.color_attributes[0]
            mesh.color_attributes.render_color_index = 0
        obj = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        objs[node] = obj
    main = objs['']
    for node, obj in objs.items():
        if node:
            obj.parent = main
    main.location.x = x_offset                                       # only for the preview line-up; reset before export
    return main, tris, [round(size_hi[i] - size_lo[i], 3) for i in range(3)], [round(v, 3) for v in size_lo]


def preview(objs, path):
    import mathutils
    s = bpy.context.scene
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.02, .025, .035, 1)
    s.world = world
    bpy.ops.mesh.primitive_plane_add(size=30, location=(5, 0, 0))
    fl = bpy.context.active_object
    fm = bpy.data.materials.new('floor')
    fm.use_nodes = True
    fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.05, .05, .055, 1)
    fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .35
    fl.data.materials.append(fm)
    for loc, e, c in (((3, -6, 5), 900, (1, .75, .5)), ((13, -4, 3), 600, (.5, .8, 1)), ((6, 4, 4), 400, (1, 1, 1))):
        L = bpy.data.lights.new('l', 'AREA')
        L.energy, L.color, L.size = e, c, 3
        o = bpy.data.objects.new('l', L)
        o.location = loc
        o.rotation_euler = (Vector((6.5, 0, .6)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        s.collection.objects.link(o)
    cam = bpy.data.cameras.new('c')
    cam.lens = 24
    co = bpy.data.objects.new('c', cam)
    co.location = (6.6, -9.6, 3.4)
    co.rotation_euler = (Vector((6.6, 0, .6)) - co.location).to_track_quat('-Z', 'Y').to_euler()
    s.collection.objects.link(co)
    s.camera = co
    s.render.engine = 'CYCLES'
    s.cycles.device, s.cycles.samples, s.cycles.use_denoising = 'CPU', 48, True
    s.render.resolution_x, s.render.resolution_y = 1400, 640
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    bpy.ops.wm.read_factory_settings(use_empty=True)
    paths = build_atlas(WORK)
    mat, glow = material(paths)
    made, manifest, x = [], {}, 0.0
    for make in PROPS:
        model = make()
        obj, tris, size, lo = realise(model, mat, glow, x)
        made.append(obj)
        manifest[model.name] = {'triangles': tris, 'size': {'x': size[0], 'y_up': size[2], 'z_depth': size[1]}, 'nodes': [c.name for c in obj.children]}
        x += max(size[0], 1.0) + .5
        print('%-16s %5d triangles  size %s' % (model.name, tris, size))
    if prev:
        preview(made, prev)
    if '--no-export' in args:
        return
    os.makedirs(OUT, exist_ok=True)
    for o in made:
        o.location.x = 0
    bpy.ops.object.select_all(action='DESELECT')
    for o in made:
        o.select_set(True)
        for c in o.children:
            c.select_set(True)
    path = os.path.join(OUT, 'ncz_street_props.glb')
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    extra = {k: v for k, v in (('export_vertex_color', 'ACTIVE'), ('export_active_vertex_color_when_no_material', True), ('export_jpeg_quality', 88)) if k in props}
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_draco_mesh_compression_enable=False,
                              export_image_format='JPEG', export_materials='EXPORT', export_normals=True, export_texcoords=True, export_cameras=False, export_lights=False,
                              export_animations=False, export_extras=False, **extra)
    total = sum(v['triangles'] for v in manifest.values())
    with open(os.path.join(OUT, 'ncz-props-manifest.json'), 'w', newline='\n') as f:
        json.dump({'file': 'ncz_street_props.glb', 'source': 'tools/assets/kit/build_street_props.py (made in Blender by code for this project; no third-party assets)',
                   'units': 'metres', 'up': '+Y', 'front': '+Z', 'origin': 'floor props: centre of the footprint on the ground; utility_box and wall_lamp: on the wall, centre line',
                   'material': 'ncz_props (one 2048 px atlas: colour, normal, metal/roughness; wear in COLOR_0); lens/led nodes: ncz_props_glow, replaced by the game',
                   'atlasRegions': list(REG), 'triangles': total, 'props': manifest}, f, indent=1)
        f.write('\n')
    print('exported', path, os.path.getsize(path), 'bytes,', total, 'triangles in all')


if __name__ == '__main__':
    main()
