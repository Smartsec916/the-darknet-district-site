# 2D paint-over of the Main Street view (view 2) for the NeoChinatown art-direction pass.
# Everything painted here is made from files the game already ships (assets/textures/ncz/*.jpg) plus flat shapes, gradients and text: no new models.
# The shapes are placed with the SAME camera as the screenshot (cameras.json), so the storefront line, the signs and the landmark sit where they would be built.
#   python3 tools/art/ncz-paintover.py <screenshot.png> <cameras.json> <out.jpg> <out-annotated.jpg>     (needs Pillow and numpy; fonts: WenQuanYi Zen Hei, DejaVu)
import sys, json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

SHOT, CAMS, OUT, OUT_ANN = sys.argv[1:5]
GB = lambda r: ImageFilter.GaussianBlur(float(r))
import os
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'void-runner', 'assets', 'textures', 'ncz') + os.sep
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
cam = [v for v in json.load(open(CAMS))['views'] if v['name'].startswith('2-')][0]
base = Image.open(SHOT).convert('RGB'); W, H = base.size
C = np.array(cam['position'], float); yaw = cam['yaw']; pitch = cam['pitch']; fov = cam.get('fov', 1.05)
f = np.array([math.sin(yaw) * math.cos(pitch), -math.sin(pitch), math.cos(yaw) * math.cos(pitch)])
r = np.array([math.cos(yaw), 0, -math.sin(yaw)])
u = np.array([math.sin(yaw) * math.sin(pitch), math.cos(pitch), math.cos(yaw) * math.sin(pitch)])
K = (H / 2) / math.tan(fov / 2)
def proj(p):
    d = np.array(p, float) - C; z = d @ f
    if z < .05: return None
    return (W / 2 + (d @ r) / z * K, H / 2 - (d @ u) / z * K, z)

PAL = {'sodium': '#ffb35c', 'window': '#f0bd80', 'teal': '#3fb8c4', 'lantern': '#ff5a2e', 'pink': '#ff5fb0', 'fog': '#13272b'}
USE = {'sodium': 'KEY: street lamps on the pavement, the bridge soffit, the chevron landmark', 'window': 'WINDOW LIGHT: lit rooms and shopfronts (about 4 in 10 windows)',
       'teal': 'FILL: sky light on walls and wet road, cool rooms, the haze', 'lantern': 'LANDMARK ACCENT: the lantern row, used only at the alley mouth',
       'pink': 'SIGN ACCENT: one sign in five; never as an outline', 'fog': 'FOG / AMBIENT: what distance fades to; shadows are this, not black'}
rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
rnd = random.Random(51515)
PX = 40  # elevation pixels per metre

def tiled(name, w_m, h_m, tile_m, tint=(1, 1, 1), dark=.5):
    t = Image.open(TEX + name + '.jpg').convert('RGB'); s = int(tile_m * PX); t = t.resize((s, s), Image.LANCZOS)
    im = Image.new('RGB', (max(1, int(w_m * PX)), max(1, int(h_m * PX))))
    for x in range(0, im.width, s):
        for y in range(0, im.height, s): im.paste(t, (x, im.height - s - y))
    a = np.asarray(im, float) / 255; a = a * np.array(tint) * dark
    # night: walls are lit by the teal sky and their own faint haze; darker toward the ground
    grad = np.linspace(1.0, .5, im.height)[:, None, None] ** 1.0
    a = a * (0.55 + 0.45 * grad[::-1][::-1])
    a = a * np.array([.62, .8, .88]) * .62
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8'))

def font(size, cjk=True): return ImageFont.truetype(FONT if cjk else MONO, max(6, int(size)))

class Elev:
    """A facade drawn flat: colour layer and a light layer (what glows), y measured in metres up from the ground."""
    def __init__(s, w_m, h_m, wall):
        s.w, s.h = w_m, h_m; s.im = wall.copy(); s.glow = Image.new('RGB', s.im.size); s.d = ImageDraw.Draw(s.im); s.g = ImageDraw.Draw(s.glow)
    def box(s, x0, y0, x1, y1): return [x0 * PX, s.im.height - y1 * PX, x1 * PX, s.im.height - y0 * PX]
    def rect(s, x0, y0, x1, y1, col, lit=None):
        s.d.rectangle(s.box(x0, y0, x1, y1), fill=col)
        if lit: s.g.rectangle(s.box(x0, y0, x1, y1), fill=lit)
    def text(s, cx, cy, txt, size_m, col, board=None, pad=.14):
        fnt = font(size_m * PX); l, t, r_, b = s.d.textbbox((0, 0), txt, font=fnt); tw, th = r_ - l, b - t
        x, y = cx * PX - tw / 2 - l, s.im.height - cy * PX - th / 2 - t
        if board: s.rect(cx - tw / PX / 2 - pad, cy - size_m * .62, cx + tw / PX / 2 + pad, cy + size_m * .62, board, board)
        s.d.text((x, y), txt, font=fnt, fill=col); s.g.text((x, y), txt, font=fnt, fill=col)
        return tw / PX

LITS = ['#e09a55', '#f0bd80', '#f0bd80', '#5fb4dc', '#d0629c', '#8fc7a0']
def windows(e, gh=4.2, fh=3.15, lit_rate=.42, skip=()):
    cols = max(1, int((e.w - .8) / 2.5)); pad = (e.w - cols * 2.5) / 2; floors = int((e.h - gh - 1.1) / fh)
    for fl in range(floors):
        y = gh + .75 + fl * fh + 1.05
        if fl % 2: e.rect(0, y - 1.12, e.w, y - .98, (22, 24, 27))
        for c in range(cols):
            x = pad + 2.5 * (c + .5)
            if rnd.random() < .06 or (fl, c) in skip: continue
            e.rect(x - .66, y - .88, x + .66, y + .88, (9, 10, 12))
            if rnd.random() < lit_rate:
                col = rgb(rnd.choice(LITS)); e.rect(x - .57, y - .8, x + .57, y + .8, col, col)
                for k in range(5): e.rect(x - .57, y - .7 + k * .32, x + .57, y - .62 + k * .32, tuple(int(v * .45) for v in col), tuple(int(v * .45) for v in col))
                if rnd.random() < .5: e.rect(x - .57, y - .8, x - .1, y + .8, tuple(int(v * .5) for v in col), tuple(int(v * .5) for v in col))
            else: e.rect(x - .57, y - .8, x + .57, y + .8, (14, 22, 28)); e.rect(x - .5, y - .7, x - .3, y + .7, (24, 36, 44))
            e.rect(x - .03, y - .8, x + .03, y + .8, (16, 18, 21)); e.rect(x - .57, y + .22, x + .57, y + .28, (16, 18, 21))
            e.rect(x - .72, y - .97, x + .72, y - .88, (38, 40, 44))  # sill
            q = rnd.random()
            if q < .16: e.rect(x - .42, y - 1.62, x + .42, y - 1.06, (46, 50, 56)); e.rect(x - .3, y - 1.5, x + .1, y - 1.2, (16, 18, 20))  # AC
            elif q < .26 and fl > 0:  # balcony
                e.rect(x - 1.2, y - 1.05, x + 1.2, y - .93, (40, 42, 46))
                for k in range(9): e.rect(x - 1.2 + k * .3, y - .93, x - 1.17 + k * .3, y - .05, (26, 28, 31))
                e.rect(x - 1.2, y - .1, x + 1.2, y - .04, (30, 32, 36))
    # pipes and streaks
    for i in range(max(1, int(e.w / 5))):
        x = e.w * (i + .2 + rnd.random() * .6) / max(1, int(e.w / 5)); e.rect(x - .07, 0, x + .07, e.h * (.7 + rnd.random() * .3), (34, 28, 24) if i % 2 else (40, 44, 50))
    return cols, pad

def ground_floor(e, bays, gh=4.2):
    """bays: list of (kind, width or 0, extra) from the facade's LEFT as you look at it."""
    fixed = sum(b[1] for b in bays); free = sum(1 for b in bays if not b[1]); share = (e.w - fixed) / free if free else 0; x = 0; out = []
    e.rect(0, 0, e.w, gh, (20, 21, 24))
    for kind, w, extra in bays:
        w = w or share; x0, x1, mid = x, x + w, x + w / 2; x = x1; out.append((kind, x0, x1, extra))
        if kind == 'shop':
            col = rgb(extra.get('color', PAL['window'])); dim = extra.get('dim', .55); c2 = tuple(int(v * dim) for v in col)
            e.rect(x0 + .4, 1.0, x1 - .4, 3.2, c2, c2)
            for k in range(1, 4): e.rect(x0 + .4, 1.0 + k * .55, x1 - .4, 1.05 + k * .55, tuple(int(v * .4) for v in c2), tuple(int(v * .4) for v in c2))
            e.rect(x0 + .4, 1.0, x1 - .4, 1.5, tuple(int(v * .35) for v in c2), tuple(int(v * .35) for v in c2))  # goods in shadow along the sill
            for k in range(1, 3): e.rect(x0 + .4 + (w - .8) * k / 3 - .03, 1.0, x0 + .4 + (w - .8) * k / 3 + .03, 3.2, (14, 15, 17))
            e.rect(x0 + .33, .1, x1 - .33, .95, (30, 31, 35))
        elif kind == 'shutter':
            for k in range(int(3.1 / .16)): v = 34 + (k % 2) * 16; e.rect(x0 + .35, k * .16, x1 - .35, k * .16 + .16, (v, v + 2, v + 6))
            e.rect(x0 + .35, 0, x1 - .35, .3, (120, 92, 20))
            e.rect(x0 + .2, 3.1, x1 - .2, 3.44, (26, 27, 31))
        elif kind == 'door':
            e.rect(mid - .75, 0, mid + .75, 2.6, (8, 9, 11)); e.rect(mid - .53, .06, mid + .53, 2.26, (44, 48, 56)); e.rect(mid + .2, 1.2, mid + .36, 1.9, rgb('#ffca8a'), rgb('#ffca8a'))
            e.rect(mid - .22, 2.5, mid + .22, 2.74, (22, 24, 28)); e.text(mid, 2.62, str(extra.get('number', '')), .17, (216, 221, 226))
            e.rect(mid - .08, 2.72, mid + .08, 2.92, rgb('#ffca8a'), rgb('#ffca8a')); e.rect(mid + .86, 1.2, mid + 1.1, 1.64, (40, 44, 50)); e.rect(mid + .9, 1.5, mid + 1.06, 1.6, rgb('#39d8ff'), rgb('#39d8ff'))
            e.rect(mid - .85, 0, mid + .85, .14, (60, 62, 66))
        e.rect(x0, 0, x0 + .22, gh, (26, 27, 31)); e.rect(x1 - .22, 0, x1, gh, (26, 27, 31))  # piers
    e.rect(0, gh - .15, e.w, gh + .19, (26, 27, 31)); e.rect(0, gh - .2, e.w, gh - .15, (8, 8, 10))  # lintel and the canopy's shadow line
    e.rect(e.w * .04, gh + .34, e.w * .96, gh + .41, (52, 56, 62)); e.rect(e.w * .1, gh + .47, e.w * .8, gh + .52, (70, 46, 32))
    return out

SIGNS = [('藥房 · PHARMACY 24H', '#6cff9e'), ('茶 · TEA HOUSE', '#ffb347'), ('REPAIR · 修理', '#7ff0ff'), ('電子 · ELECTRONICS', '#9b7bff'), ('LAUNDRY', '#e8f0ff'), ('龍麵館 · DRAGON NOODLES', '#ffcf5a')]
sign_i = [0]
def sign_band(e, bays):
    for kind, x0, x1, extra in bays:
        if kind != 'shop': continue
        txt, col = SIGNS[sign_i[0] % len(SIGNS)]; sign_i[0] += 1; size = .4
        while font(size * PX).getlength(txt) / PX > (x1 - x0) - 1.1 and size > .2: size -= .02
        e.text((x0 + x1) / 2, 3.6, txt, size, rgb(col), board=(8, 9, 12))

def fog_fade(im, z_left, z_right, amount=.012):
    """Blend toward the fog colour by distance (z in metres from the camera at the image's left and right edges)."""
    a = np.asarray(im, float); w = a.shape[1]; z = np.linspace(z_left, z_right, w); k = 1 - np.exp(-(z * amount) ** 1.4); fogc = np.array(rgb(PAL['fog']), float) * 1.25
    return Image.fromarray((a * (1 - k[None, :, None]) + fogc * k[None, :, None]).astype('uint8'))

def coeffs(dst, src):
    A = []
    for (x, y), (X, Y) in zip(dst, src): A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y])
    return np.linalg.solve(np.array(A, float), np.array(src, float).reshape(8))

layer = Image.new('RGBA', (W, H)); glow_layer = Image.new('RGB', (W, H))
def place(im, corners, glow=None):
    """corners: world points for the image's top-left, top-right, bottom-right, bottom-left."""
    pts = [proj(p) for p in corners]
    if any(p is None for p in pts): return
    dst = [(p[0], p[1]) for p in pts]; src = [(0, 0), (im.width, 0), (im.width, im.height), (0, im.height)]
    co = coeffs(dst, src); warped = im.convert('RGBA').transform((W, H), Image.PERSPECTIVE, co, Image.BICUBIC)
    mask = Image.new('L', (W, H)); ImageDraw.Draw(mask).polygon(dst, fill=255)
    layer.paste(warped, (0, 0), mask)
    if glow is not None:
        gw = glow.transform((W, H), Image.PERSPECTIVE, co, Image.BICUBIC); glow_layer.paste(gw, (0, 0), mask)
    else: glow_layer.paste((0, 0, 0), (0, 0), mask)

X = 71.0
def dist(z): return float(np.linalg.norm(np.array([X, 1.7, z]) - C))
def wall_west_face(e, z_north, z_south, x=X):
    # the facade faces west; seen from the street its LEFT is its north end
    im = fog_fade(e.im, dist(z_north), dist(z_south)); place(im, [(x, e.h, z_north), (x, e.h, z_south), (x, 0, z_south), (x, 0, z_north)], e.glow)

T = [(1, 1, 1), (.92, .9, .86), (.82, .86, .9), (.9, .84, .8), (.8, .82, .8), (.95, .92, .98), (.76, .78, .84)]
# ---- far to near ----
# the gate end (z -31.8 to -26; the North Gate's own building is beyond and is left as it is)
e = Elev(5.8, 25, tiled('corrugated-blue-color', 5.8, 25, 3.5, T[0])); windows(e, lit_rate=.4); b = ground_floor(e, [('door', 2.6, {'number': 31}), ('shutter', 0, {})]); wall_west_face(e, -26, -31.8)
# mid (z -43.7 to -31.8)
e = Elev(11.9, 17.5, tiled('concrete-mold-color', 11.9, 17.5, 7, T[4], .62)); windows(e); b = ground_floor(e, [('shutter', 3.6, {}), ('shop', 0, {'color': '#9fc4d0', 'dim': .42}), ('shop', 4, {})]); sign_band(e, b); wall_west_face(e, -31.8, -43.7)
# corner north (z -55.5 to -43.7)
e = Elev(11.8, 22, tiled('concrete-old-color', 11.8, 22, 6, T[2], .62)); windows(e, lit_rate=.46); b = ground_floor(e, [('shop', 4.2, {'color': '#d98f5a', 'dim': .62}), ('shop', 0, {}), ('door', 2.6, {'number': 55})]); sign_band(e, b); wall_west_face(e, -43.7, -55.5)
# the alley seen through its mouth: the north wall's brick lit warm under the bridge, the soffit
brick = tiled('brick-color', 6, 5.2, 2, (1, .86, .72), .95); place(fog_fade(brick, dist(-55.5), dist(-55.5) + 5), [(71, 5.2, -55.5), (77, 5.2, -55.5), (77, 0, -55.5), (71, 0, -55.5)])
deep = Image.new('RGB', (200, 200), (24, 30, 34)); place(deep, [(77, 13, -55.5), (95, 13, -55.5), (95, 0, -55.5), (77, 0, -55.5)])
soff = Image.new('RGB', (240, 240), (30, 24, 18)); place(soff, [(71, 5.2, -55.5), (77, 5.2, -55.5), (77, 5.2, -61.6), (71, 5.2, -61.6)])
# the Lantern Bridge (z -61.6 to -55.5, from 5.2 m to 15 m)
bw, bh = 6.1, 9.8; e = Elev(bw, bh, tiled('metal-leaks-color', bw, bh, 4, (.78, .82, .9), .7))
e.rect(0, 0, bw, .5, (24, 25, 29)); e.rect(0, bh - .25, bw, bh, (24, 25, 29))
for c in range(3):
    x = 1.02 + c * 2.03
    for (y, hh, cols) in [(3.0, 1.9, ['#f0bd80', '#e09a55']), (6.8, 1.5, [rnd.choice(['#f0bd80', '#000000']), rnd.choice(['#5fb4dc', '#000000'])])]:
        e.rect(x - .88, y - hh / 2 - .1, x + .88, y + hh / 2 + .1, (9, 10, 12))
        for k, col in enumerate(cols):
            cc = rgb(col) if col != '#000000' else (14, 22, 28); e.rect(x - .82 + k * .84, y - hh / 2, x - .02 + k * .84, y + hh / 2, cc, cc if col != '#000000' else None)
            if col != '#000000':
                for j in range(4): e.rect(x - .82 + k * .84, y - hh / 2 + .2 + j * .36, x - .02 + k * .84, y - hh / 2 + .27 + j * .36, tuple(int(v * .5) for v in cc), tuple(int(v * .5) for v in cc))
for k in range(12): e.rect(.2 + k * .5, .72, .23 + k * .5, 1.52, (22, 23, 26))
e.rect(0, 1.5, bw, 1.56, (26, 27, 31))
im = fog_fade(e.im, dist(-55.5), dist(-61.6)); place(im, [(70.85, 15, -55.5), (70.85, 15, -61.6), (70.85, 5.2, -61.6), (70.85, 5.2, -55.5)], e.glow)
# corner south (z -68.5 to -61.6), and its side on Milked's street (faces south, toward the camera)
e = Elev(6.9, 16.5, tiled('brick-color', 6.9, 16.5, 3, T[3], .8)); windows(e, lit_rate=.4); b = ground_floor(e, [('door', 2.6, {'number': 61}), ('shop', 0, {})]); sign_band(e, b); wall_west_face(e, -61.6, -68.5)
e = Elev(9.6, 16.5, tiled('brick-color', 9.6, 16.5, 3, T[3], .7)); windows(e, lit_rate=.3); e.rect(0, 0, 9.6, .5, (16, 17, 19))
place(fog_fade(e.im, dist(-68.5), dist(-68.5) + 6), [(71, 16.5, -68.5), (80.6, 16.5, -68.5), (80.6, 0, -68.5), (71, 0, -68.5)], e.glow)

# what already stands nearer the camera hides the new block: the existing building south of Milked's street (x 71, z -90 to -74)
occ = [proj(p) for p in [(71, 0, -74), (71, 26, -74), (71, 26, -89.5), (71, 0, -89.5)]]
om = Image.new('L', (W, H)); ImageDraw.Draw(om).polygon([(occ[0][0], H), (occ[0][0], occ[1][1]), (W, -4000), (W, H)], fill=255)
layer.paste((0, 0, 0, 0), (0, 0), om); glow_layer.paste((0, 0, 0), (0, 0), om)
# ---- composite: the painted wall over the photograph, then light ----
img = base.copy(); img.paste(layer, (0, 0), layer)
a = np.asarray(img, float)
gl = np.asarray(glow_layer, float)
bloom = np.asarray(glow_layer.filter(GB(14)), float) * .9 + np.asarray(glow_layer.filter(GB(46)), float) * .7
a = np.clip(a + bloom * .55, 0, 255)
canvas = Image.fromarray(a.astype('uint8'))

def add_glow(pt3, radius_px, col, k=1.0):
    p = proj(pt3)
    if not p: return
    g = Image.new('RGB', (W, H)); d = ImageDraw.Draw(g); rr = radius_px * K / (p[2] * 1000) * 28
    d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=tuple(int(v * k) for v in rgb(col)))
    return g.filter(GB(max(2, rr * .9)))
def add(canvas, g, amt=1.0):
    if g is None: return canvas
    return Image.fromarray(np.clip(np.asarray(canvas, float) + np.asarray(g, float) * amt, 0, 255).astype('uint8'))
def pool(canvas, cx, cz, rx, rz, col, amt=.55, y=.19):
    pts = [proj((cx + rx * math.cos(t), y, cz + rz * math.sin(t))) for t in np.linspace(0, 2 * math.pi, 40)]
    if any(p is None for p in pts): return canvas
    g = Image.new('RGB', (W, H)); ImageDraw.Draw(g).polygon([(p[0], p[1]) for p in pts], fill=rgb(col))
    span = max(p[0] for p in pts) - min(p[0] for p in pts)
    return add(canvas, g.filter(GB(max(3, span * .16))), amt)
# street lamps: warm sodium at a steady spacing, one cold lamp at the gate
LAMPS = [(-65.0, PAL['sodium']), (-50.3, PAL['sodium']), (-37.7, PAL['sodium']), (-29.4, '#bfe9ff')]
for z, col in LAMPS:
    canvas = pool(canvas, 69.6, z, 2.6, 3.2, col, .5)
    p = proj((69.9, 4.95, z))
    if p:
        # a soft cone of light in the wet air
        top = proj((69.9, 4.9, z)); bl = proj((69.9, .2, z - 1.6)); br = proj((69.9, .2, z + 1.6))
        g = Image.new('RGB', (W, H)); ImageDraw.Draw(g).polygon([(top[0], top[1]), (bl[0], bl[1]), (br[0], br[1])], fill=tuple(int(v * .5) for v in rgb(col)))
        canvas = add(canvas, g.filter(GB(max(3, 260 / p[2]))), .28)
        d = ImageDraw.Draw(canvas); s = max(2, 150 / p[2]); arm0 = proj((71, 5.05, z))
        d.line([(arm0[0], arm0[1]), (p[0], p[1] - s * .3)], fill=(20, 21, 24), width=max(1, int(s * .25)))
        d.rectangle([p[0] - s, p[1] - s * .35, p[0] + s, p[1] + s * .35], fill=(255, 236, 200))
        canvas = add(canvas, add_glow((69.9, 4.95, z), 16, col, 1), .9)
# shop light on the pavement
for z0, z1, col in [(-68.5 + 0, -64.4, PAL['window']), (-51.6, -46.5, PAL['window']), (-47.9, -43.7, '#d98f5a'), (-39.7, -35.4, '#9fc4d0'), (-35.8, -31.8, PAL['window'])]:
    canvas = pool(canvas, 69.7, (z0 + z1) / 2, 1.5, (z1 - z0) / 2, col, .28)
# under the bridge: warm soffit light on the alley floor, the lantern row and its red pool, the chevron column
canvas = pool(canvas, 73.5, -58.55, 3.2, 2.7, PAL['sodium'], .7, .02)
canvas = pool(canvas, 69.6, -58.55, 2.4, 3.6, PAL['lantern'], .5)
d = ImageDraw.Draw(canvas)
for i in range(5):
    z = -61.6 + .75 + i * (6.1 - 1.5) / 4; y = 5.2 - .62 - (i % 2) * .12; p = proj((70.72, y, z)); t = proj((70.72, 5.2, z))
    if p:
        s = .25 * K / p[2]; d.line([(t[0], t[1]), (p[0], p[1] - s)], fill=(12, 10, 10), width=1)
        for k, colr in enumerate([(120, 22, 12), (214, 60, 28), (255, 132, 64)]): q = s * (1 - k * .28); d.ellipse([p[0] - q, p[1] - q * .86, p[0] + q, p[1] + q * .86], fill=colr)
        canvas = add(canvas, add_glow((70.72, y, z), 9, PAL['lantern'], 1), .9); d = ImageDraw.Draw(canvas)
# the chevron light: a tall board on the north pier, standing out from the wall (seen edge-on from here, so it is drawn facing the camera a little)
cz, cy, ch, cw = -54.75, 10.2, 8.2, 1.15
board = Image.new('RGB', (int(cw * 80), int(ch * 80)), (7, 8, 11)); bd = ImageDraw.Draw(board); bd.rectangle([3, 3, board.width - 4, board.height - 4], outline=rgb(PAL['sodium']), width=3)
for i in range(7):
    y = board.height * (i + .5) / 7; s = board.width * .3; col = rgb(PAL['sodium']) if i % 2 else (255, 217, 160)
    bd.line([(board.width / 2 - s, y - s * .45), (board.width / 2, y + s * .45), (board.width / 2 + s, y - s * .45)], fill=col, width=int(board.width * .11), joint='curve')
x_in, x_out = 70.55, 70.55 - cw
pts = [proj(p) for p in [(x_out, cy + ch / 2, cz), (x_in, cy + ch / 2, cz), (x_in, cy - ch / 2, cz), (x_out, cy - ch / 2, cz)]]
if all(pts):
    dst = [(p[0], p[1]) for p in pts]; co = coeffs(dst, [(0, 0), (board.width, 0), (board.width, board.height), (0, board.height)])
    wb = board.transform((W, H), Image.PERSPECTIVE, co, Image.BICUBIC); m = Image.new('L', (W, H)); ImageDraw.Draw(m).polygon(dst, fill=255); canvas.paste(wb, (0, 0), m)
    g = Image.new('RGB', (W, H)); g.paste(wb, (0, 0), m); canvas = add(canvas, g.filter(GB(16)), 1.1); canvas = add(canvas, g.filter(GB(50)), .8)
    canvas = pool(canvas, 69.4, cz, 2.2, 2.2, PAL['sodium'], .4)

# a passer-by the new wall has covered: their legs are painted out with the road beside them
_fix = canvas.crop((1540, 690, 1630, 790)); canvas.paste(_fix, (1630, 690))
# ---- the wet road: what stands on the east side is mirrored in it, softly ----
pa, pb = proj((71, .0, -26)), proj((71, .0, -68.5))
arr = np.asarray(canvas, float); ys, xs = np.mgrid[0:H, 0:W]
slope = (pb[1] - pa[1]) / (pb[0] - pa[0]); yb = pa[1] + (xs - pa[0]) * slope
below = (ys - yb); valid = (below > 0) & (xs > min(pa[0], pb[0]) - 400) & (xs < max(pa[0], pb[0]) + 200)
src_y = np.clip((yb - below * 1.0).astype(int), 0, H - 1); refl = arr[src_y, xs]
# only the painted wall and its lights are mirrored, and only on the road in front of it
lay = np.asarray(layer.split()[3], float) / 255; lit_src = lay[src_y, xs]
wgt = np.clip(1 - below / (H * .34), 0, 1) ** 1.3 * valid * lit_src
ground_mask = (np.asarray(layer.split()[3], float) < 10)  # do not mirror onto the painted wall itself
wgt = wgt * ground_mask
refl_img = Image.fromarray(refl.astype('uint8')).filter(GB(5)); refl = np.asarray(refl_img, float)
streak = Image.fromarray(refl.astype('uint8')).filter(ImageFilter.BoxBlur(1)); refl = np.asarray(streak, float)
wg = np.asarray(Image.fromarray((wgt * 255).astype('uint8')).filter(GB(6)), float) / 255
arr = arr * (1 - wg[..., None] * .42) + refl * wg[..., None] * .5
canvas = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))

# ---- air: teal haze toward the far end of the street, a cool fill on the whole picture, rain, a little vignette ----
arr = np.asarray(canvas, float)
vp = proj((61, 6, -10)); hz = Image.new('L', (W, H)); ImageDraw.Draw(hz).ellipse([vp[0] - W * .22, vp[1] - H * .34, vp[0] + W * .22, vp[1] + H * .3], fill=255)
hz = np.asarray(hz.filter(GB(120)), float) / 255
arr = arr * (1 - hz[..., None] * .3) + np.array(rgb('#1d3c42'), float) * hz[..., None] * .55
lum = arr.mean(axis=2, keepdims=True) / 255; arr = arr * (1 - (1 - lum) * .1) + np.array(rgb(PAL['fog']), float) * (1 - lum) * .22   # shadows lean teal, never black
rain = Image.new('L', (W, H)); rd = ImageDraw.Draw(rain); rr = random.Random(7)
for i in range(900): x, y, l = rr.random() * W, rr.random() * H, 14 + rr.random() * 30; rd.line([(x, y), (x - l * .08, y + l)], fill=int(40 + rr.random() * 70), width=1)
arr = np.clip(arr + np.asarray(rain.filter(GB(.6)), float)[..., None] * np.array([.55, .7, .8]) * .22, 0, 255)
yy, xx = np.mgrid[0:H, 0:W]; vig = 1 - .22 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2); arr = arr * vig[..., None]
canvas = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))
d = ImageDraw.Draw(canvas); d.rectangle([0, 0, W, 46], fill=(0, 0, 0)); d.text((16, 9), 'PAINT-OVER (2D, existing textures, sign names and lamp style only)  ·  view 2: Main Street toward the alley  ·  over the Low screenshot', font=ImageFont.truetype(SANS, 20), fill=(240, 240, 240))
canvas.save(OUT, quality=92)

# ---- the annotated copy: numbered marks on the picture, the explanations and the palette on a panel under it ----
PANEL = 470
an = Image.new('RGB', (W, H + PANEL), (10, 11, 13)); an.paste(canvas, (0, 0)); ov = Image.new('RGBA', (W, H + PANEL)); d = ImageDraw.Draw(ov); F = lambda s: ImageFont.truetype(SANS, s); R = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
YEL, CY, MG, WH, OR = (255, 220, 60, 255), (90, 230, 255, 255), (255, 120, 200, 255), (255, 255, 255, 255), (255, 179, 92, 255)
def wline(y, z0, z1, col, width=3, dash=False):
    a, b = proj((70.6, y, z0)), proj((70.6, y, z1))
    if a and b:
        n = 36 if dash else 1
        for i in range(0, n, 2 if dash else 1): d.line([(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n), (a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n)], fill=col, width=width)
    return a, b
def tag(x, y, n, col):
    d.ellipse([x - 19, y - 19, x + 19, y + 19], fill=(0, 0, 0, 235), outline=col, width=3); l, t, r_, b = d.textbbox((0, 0), n, font=F(24)); d.text((x - (r_ - l) / 2 - l, y - (b - t) / 2 - t), n, font=F(24), fill=col)
a, b = wline(4.2, -26, -68.5, YEL, 4); wline(0.19, -26, -68.5, YEL, 2); tag(b[0] + 30, b[1] - 4, '1', YEL)
a2, b2 = wline(3.93, -26, -68.5, CY, 2, True); wline(3.27, -26, -68.5, CY, 2, True); tag(b2[0] + 30, b2[1] + 44, '2', CY)
for z in [-68.5, -61.6, -55.5, -43.7, -31.8, -26]:
    p0, p1 = proj((70.6, 0, z)), proj((70.6, 16, z))
    if p0 and p1: d.line([(p0[0], p0[1]), (p1[0], p1[1])], fill=MG, width=2)
pm = proj((70.6, 17.5, -43.7)); tag(pm[0], pm[1] - 22, '3', MG)
for z in [-67.2, -54.2, -27.3]:
    p = proj((70.6, 1.3, z))
    if p: d.ellipse([p[0] - 13, p[1] - 22, p[0] + 13, p[1] + 22], outline=WH, width=3)
pd_ = proj((70.6, 1.3, -67.2)); tag(pd_[0] + 44, pd_[1] + 30, '4', WH)
lp = proj((70.6, 10.5, -58.5)); d.line([(lp[0] - 150, lp[1] - 150), (lp[0] - 12, lp[1] - 8)], fill=OR, width=4); tag(lp[0] - 164, lp[1] - 164, '5', OR)
y0 = H + 16; d.text((20, y0), 'WHAT THE PAINT-OVER SETS  (same camera as view 2; everything drawn from textures, sign names and lamp style the game already has)', font=F(22), fill=WH)
rows = [('1', YEL, 'STOREFRONT ALIGNMENT: one street wall on the street line. One lintel and canopy at 4.2 m along the whole block (solid yellow), one pavement line.'),
        ('2', CY, 'ONE SIGN BAND at 3.3 to 3.9 m (dashed): every shop name hangs on it under the canopy. No signs at random heights; the old tall boards are gone from this block.'),
        ('3', MG, 'FACADES MEET on shared party walls (magenta): five buildings of different height and surface, no gap or set-back between them, from Milked\'s street to the North Gate.'),
        ('4', WH, 'DOOR RHYTHM: a housing door (ringed) at an end of each building, shops and shutters between: door / shop / shop / shutter. Doors are numbered, lit by one lamp each, and do not open.'),
        ('5', OR, 'THE LANDMARK, the LANTERN BRIDGE: flats built across the alley mouth (x 71 to 77, z -61.6 to -55.5, 5.2 m to 15 m up), five red lanterns under it at x 70.7, and a chevron light 8.2 m tall on its north pier at (70.0, 10.2, -54.75). It is the only thing that crosses an opening on the street and the warmest light on it, so the eye goes to the alley.')]
yy_ = y0 + 40
for n, col, txt in rows:
    tag(38, yy_ + 14, n, col); words = txt.split(' '); line = ''; x = 70
    for w_ in words:
        if d.textlength((line + ' ' + w_).strip(), font=R(19)) > W - 100: d.text((x, yy_), line, font=R(19), fill=(232, 234, 238, 255)); yy_ += 25; line = w_
        else: line = (line + ' ' + w_).strip()
    d.text((x, yy_), line, font=R(19), fill=(232, 234, 238, 255)); yy_ += 36
py = H + PANEL - 128; d.text((20, py - 34), 'LIGHTING PALETTE', font=F(22), fill=WH)
for i, (name, hx) in enumerate(PAL.items()):
    x = 20 + i * (W - 40) / 6; d.rectangle([x, py, x + 84, py + 84], fill=rgb(hx) + (255,), outline=WH); d.text((x + 94, py - 2), name.upper() + '  ' + hx, font=F(19), fill=WH)
    words = USE[name].split(' '); line = ''; ty = py + 26
    for w_ in words:
        if d.textlength((line + ' ' + w_).strip(), font=R(15)) > (W - 40) / 6 - 108: d.text((x + 94, ty), line, font=R(15), fill=(210, 214, 220, 255)); ty += 19; line = w_
        else: line = (line + ' ' + w_).strip()
    d.text((x + 94, ty), line, font=R(15), fill=(210, 214, 220, 255))
an = Image.alpha_composite(an.convert('RGBA'), ov).convert('RGB'); an.save(OUT_ANN, quality=92)
print('ok', OUT, OUT_ANN)
