"""Texture sets for the space-station kit (docs/development/STATION_GRAPHICS.md). Run by build_station_kit.py --textures; needs numpy and Pillow.

Everything is generated here from seeded noise and drawn shapes (nothing downloaded, nothing to license). Written to
void-runner/assets/textures/station/ as JPEG (colour q90, the others q92):
  st_hull    2K, tiles every 8 m   exterior hull plating: irregular plates, seams, fasteners, faded patches, streaks and pitting
  st_wall    1K, tiles every 4 m   interior painted wall panel: fine seams, fasteners, scuffs low down, chipped paint
  st_deck    1K, tiles every 4 m   deck plating: 1 m plates with anti-slip tread, worn walk paths, stains
  st_trim    2K ATLAS (not tiling) hazard stripes, vents, gratings, screens, light diffusers, lit windows, placards, cables, solar cells
Each set is <name>_color.jpg, <name>_normal.jpg, <name>_orm.jpg (glTF packing: R occlusion, G roughness, B metallic); st_trim also has
st_trim_emissive.jpg. Colours are kept near neutral grey so the game can tint a station (Meridian graphite, Rusthaven oxide, the Vigil pale)."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kit'))
from kit_textures import _normal, _orm, _spectral, _step, _hairlines  # noqa: E402

# Atlas regions in UV (u0, v0, u1, v1), v up, on an 8 x 8 grid of 256 px cells. build_station_kit.py maps faces into these by name.
G = 1 / 8
TRIM_REGIONS = {
    'hazard': (0, 7 * G, 4 * G, 1), 'vent': (4 * G, 6 * G, 6 * G, 1), 'grate': (6 * G, 6 * G, 1, 1),
    'screen_a': (0, 5 * G, 2 * G, 7 * G), 'screen_b': (2 * G, 5 * G, 4 * G, 7 * G),
    'win_a': (4 * G, 5 * G, 5 * G, 6 * G), 'win_b': (5 * G, 5 * G, 6 * G, 6 * G), 'win_c': (6 * G, 5 * G, 7 * G, 6 * G), 'win_dark': (7 * G, 5 * G, 1, 6 * G),
    'solar': (0, 3 * G, 2 * G, 5 * G), 'cable': (2 * G, 4 * G, 6 * G, 5 * G),
    'label_a': (6 * G, 4 * G, 7 * G, 5 * G), 'label_b': (7 * G, 4 * G, 1, 5 * G), 'label_c': (6 * G, 3 * G, 7 * G, 4 * G), 'label_d': (7 * G, 3 * G, 1, 4 * G),
    'light_warm': (2 * G, 3 * G, 4 * G, 4 * G), 'light_cool': (4 * G, 3 * G, 6 * G, 4 * G),
    'led_red': (0, 2 * G, 1 * G, 3 * G), 'led_green': (1 * G, 2 * G, 2 * G, 3 * G), 'led_amber': (2 * G, 2 * G, 3 * G, 3 * G), 'led_white': (3 * G, 2 * G, 4 * G, 3 * G),
    'chevron': (4 * G, 2 * G, 1, 3 * G),
    'rubber': (0, 1 * G, 1 * G, 2 * G), 'keypad': (1 * G, 1 * G, 2 * G, 2 * G), 'stripe': (2 * G, 1 * G, 6 * G, 2 * G), 'fins': (6 * G, 1 * G, 1, 2 * G),
    'marking': (0, 0, 4 * G, 1 * G), 'bay_no': (4 * G, 0, 6 * G, 1 * G), 'tread': (6 * G, 0, 1, 1 * G),
}


def _font(size):
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _jpg(path, arr, q=90):
    Image.fromarray(np.asarray(arr).clip(0, 255).astype(np.uint8)).save(path, quality=q, optimize=True)


def _blur(a, r):
    return np.asarray(Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=float) / 255


def _plates(n, px_per_m, rows_m, rng, widths=(1, 2, 2, 4), sub=.35):
    """An irregular plate layout that wraps: returns (id map, seam mask, rects). Seams lie on a grid so the tile repeats cleanly."""
    ids = np.zeros((n, n), np.int32)
    seam = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(seam)
    rects, k, y = [], 1, 0
    for rh in rows_m:
        h = int(rh * px_per_m)
        x = 0
        while x < n:
            w = int(rng.choice(widths) * px_per_m)
            w = min(w, n - x)
            cells = [(x, y, x + w, y + h)]
            if rng.random() < sub and w >= px_per_m * 2 and h >= px_per_m * 2:      # some plates are split again
                if rng.random() < .5:
                    cells = [(x, y, x + w // 2, y + h), (x + w // 2, y, x + w, y + h)]
                else:
                    cells = [(x, y, x + w, y + h // 2), (x, y + h // 2, x + w, y + h)]
            for c in cells:
                ids[c[1]:c[3], c[0]:c[2]] = k
                d.rectangle((c[0], c[1], c[2] - 1, c[3] - 1), outline=255, width=1)
                rects.append(c)
                k += 1
            x += w
        y += h
    return ids, np.asarray(seam, dtype=float) / 255, rects


def _dots(n, pts, r, soft=.8):
    im = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(im)
    for x, y in pts:
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                d.ellipse((x - r + ox, y - r + oy, x + r + ox, y + r + oy), fill=255)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(soft)), dtype=float) / 255


def hull(out, n=2048):
    rng = np.random.default_rng(4101)
    ppm = n / 8
    ids, seam, rects = _plates(n, ppm, (2, 1, 2, 1, 2), rng)
    tone = rng.uniform(.82, 1.08, ids.max() + 1)[ids]
    tone = np.where(rng.random(ids.max() + 1)[ids] > .86, tone * .72, tone)                     # a few darker replacement plates
    seam_w = _blur(seam, 1.2)
    groove = np.clip(seam_w * 3, 0, 1)
    pts, hatch = [], Image.new('L', (n, n), 0)
    hd = ImageDraw.Draw(hatch)
    for (x0, y0, x1, y1) in rects:
        step = ppm * .5
        for x in np.arange(x0 + step / 2, x1, step):
            pts += [(x, y0 + 9), (x, y1 - 9)]
        for y in np.arange(y0 + step / 2, y1, step):
            pts += [(x0 + 9, y), (x1 - 9, y)]
        if rng.random() < .22 and x1 - x0 >= ppm * 2:                                           # an access hatch with rounded corners
            w, h = rng.uniform(.5, .9) * ppm, rng.uniform(.4, .7) * ppm
            cx, cy = rng.uniform(x0 + w, x1 - w), (y0 + y1) / 2
            hd.rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), radius=10, outline=255, width=3)
    rivet = _dots(n, pts, 3.2)
    hatchm = _blur(np.asarray(hatch, dtype=float) / 255, .8)
    low, mid, fine = _spectral(n, 4110, 3.0, lo=1.0), _spectral(n, 4111, 2.2, lo=6.0), _spectral(n, 4112, 1.0, lo=64.0)
    streak = _step(.72, .96, _spectral(n, 4113, 3.0, ax=.4, ay=14.0, lo=3.0)) * _step(.3, .7, low)
    stain = _step(.8, .97, _spectral(n, 4114, 3.2, lo=2.0))
    pit = _step(.992, .999, _spectral(n, 4115, .4, lo=90.0))
    scratch = _hairlines(n, 4116, 120)
    edge = _blur(seam, 5) * (1 - groove) * (.4 + .6 * fine)                                      # bright worn edge beside each seam
    value = tone * (.9 + .2 * low) * (.95 + .1 * mid) * (.97 + .06 * fine)
    col = np.array([150, 154, 160])[None, None] * value[..., None]
    col *= (1 - .45 * streak)[..., None] * (1 - .35 * stain)[..., None]
    col = col * (1 - .5 * edge[..., None]) + np.array([205, 208, 212]) * .5 * edge[..., None]
    col = col * (1 - .8 * groove[..., None]) + 18 * .8 * groove[..., None]
    col = col * (1 - .6 * hatchm[..., None]) + 30 * .6 * hatchm[..., None]
    col = col * (1 - .35 * rivet[..., None]) + 190 * .35 * rivet[..., None]
    col = col * (1 - .6 * scratch[..., None]) + 215 * .6 * scratch[..., None]
    col *= (1 - .7 * pit)[..., None]
    _jpg(out + '/st_hull_color.jpg', col)
    height = .5 * tone - 1.6 * groove - .9 * hatchm + .9 * rivet + .08 * mid + .05 * fine - 1.2 * pit - .5 * scratch
    _jpg(out + '/st_hull_normal.jpg', _normal(height, 2.2), 92)
    rough = .52 + .16 * (low - .5) + .25 * streak + .2 * stain - .2 * edge - .2 * scratch + .2 * groove
    metal = .55 - .35 * streak - .3 * stain + .35 * edge + .4 * scratch + .25 * rivet
    ao = 1 - .75 * groove - .4 * hatchm - .2 * pit
    _jpg(out + '/st_hull_orm.jpg', _orm(ao.clip(0, 1), rough.clip(.18, .95), metal.clip(0, 1)), 92)


def wall(out, n=1024):
    rng = np.random.default_rng(4201)
    ppm = n / 4
    ids, seam, rects = _plates(n, ppm, (1, 1, 1, 1), rng, widths=(1, 1, 2), sub=0)
    tone = rng.uniform(.94, 1.04, ids.max() + 1)[ids]
    groove = np.clip(_blur(seam, .9) * 3, 0, 1)
    pts = []
    for (x0, y0, x1, y1) in rects:
        pts += [(x0 + 12, y0 + 12), (x1 - 12, y0 + 12), (x0 + 12, y1 - 12), (x1 - 12, y1 - 12)]
    screw = _dots(n, pts, 3.5)
    low, mid, fine = _spectral(n, 4210, 3.0, lo=1.0), _spectral(n, 4211, 2.2, lo=6.0), _spectral(n, 4212, 1.0, lo=48.0)
    smudge = _step(.7, .95, _spectral(n, 4213, 3.0, lo=3.0))
    drip = _step(.84, .97, _spectral(n, 4214, 3.0, ax=.5, ay=12.0, lo=3.0)) * _step(.3, .7, low)
    scratch = _hairlines(n, 4215, 60)
    chip = np.maximum(_step(.9, .94, _spectral(n, 4216, 2.6, lo=5.0)) * _step(.4, .6, _spectral(n, 4217, 2.0, lo=12.0)), scratch * .8)
    value = tone * (.92 + .16 * low) * (.97 + .06 * mid)
    col = np.array([176, 178, 174])[None, None] * value[..., None]
    col *= (1 - .22 * smudge)[..., None] * (1 - .35 * drip)[..., None]
    col = col * (1 - chip[..., None]) + (np.array([92, 96, 100]) * (.85 + .3 * fine)[..., None]) * chip[..., None]
    col = col * (1 - .8 * groove[..., None]) + 22 * .8 * groove[..., None]
    col = col * (1 - .5 * screw[..., None]) + 70 * .5 * screw[..., None]
    _jpg(out + '/st_wall_color.jpg', col)
    _jpg(out + '/st_wall_normal.jpg', _normal(-1.5 * groove + .5 * screw + .07 * mid + .04 * fine - .8 * chip, 2.0), 92)
    rough = (.62 + .14 * (low - .5) + .18 * smudge + .2 * drip) * (1 - chip) + .34 * chip
    _jpg(out + '/st_wall_orm.jpg', _orm((1 - .7 * groove).clip(0, 1), rough.clip(.2, .95), (.08 + .75 * chip + .5 * screw).clip(0, 1)), 92)


def deck(out, n=1024):
    rng = np.random.default_rng(4301)
    ppm = n / 4
    ids, seam, rects = _plates(n, ppm, (1, 1, 1, 1), rng, widths=(1, 2), sub=0)
    tone = rng.uniform(.88, 1.06, ids.max() + 1)[ids]
    groove = np.clip(_blur(seam, 1.1) * 3, 0, 1)
    ys, xs = np.mgrid[0:n, 0:n].astype(float)
    # Anti-slip tread: short raised bars in a herringbone, 32 px pitch (wraps: n is a multiple of 32).
    p = 32
    cx, cy = (xs % p) - p / 2, (ys % p) - p / 2
    odd = ((xs // p + ys // p) % 2).astype(bool)
    a, b = np.where(odd, cx + cy, cx - cy) / 1.414, np.where(odd, cx - cy, cx + cy) / 1.414
    tread = (_step(9, 7, np.abs(a)) * _step(2.6, 1.4, np.abs(b)))
    plain = (rng.random(ids.max() + 1)[ids] > .7)                                                # some plates are smooth
    tread = tread * (~plain)
    pts = []
    for (x0, y0, x1, y1) in rects:
        pts += [(x0 + 14, y0 + 14), (x1 - 14, y0 + 14), (x0 + 14, y1 - 14), (x1 - 14, y1 - 14)]
    bolt = _dots(n, pts, 5)
    low, mid, fine = _spectral(n, 4310, 3.0, lo=1.0), _spectral(n, 4311, 2.2, lo=6.0), _spectral(n, 4312, 1.0, lo=48.0)
    path = _step(.45, .8, _spectral(n, 4313, 3.4, ax=3.0, ay=.5, lo=1.0))                          # worn walk paths
    oil = _step(.86, .97, _spectral(n, 4314, 3.2, lo=3.0))
    scratch = _hairlines(n, 4315, 140)
    wear = np.clip(tread * (.25 + .75 * path) * (.5 + .5 * fine) + scratch * .7, 0, 1)
    value = tone * (.9 + .2 * low) * (.96 + .08 * mid)
    col = np.array([92, 96, 100])[None, None] * value[..., None]
    col *= (1 - .5 * oil)[..., None]
    col = col * (1 - .55 * wear[..., None]) + np.array([170, 172, 172]) * .55 * wear[..., None]
    col = col * (1 - .85 * groove[..., None]) + 12 * .85 * groove[..., None]
    col = col * (1 - .5 * bolt[..., None]) + 150 * .5 * bolt[..., None]
    _jpg(out + '/st_deck_color.jpg', col)
    _jpg(out + '/st_deck_normal.jpg', _normal(1.2 * tread - 1.8 * groove + .9 * bolt + .1 * mid + .05 * fine - .4 * scratch, 2.4), 92)
    rough = .58 + .12 * (low - .5) - .22 * wear - .3 * oil + .2 * groove
    metal = .55 + .4 * wear - .2 * oil
    _jpg(out + '/st_deck_orm.jpg', _orm((1 - .8 * groove - .15 * (1 - tread) * (~plain)).clip(0, 1), rough.clip(.16, .95), metal.clip(0, 1)), 92)


def trim(out, n=2048):
    """The detail atlas. Drawn region by region; a height picture, a roughness/metal picture and an emissive picture are drawn alongside."""
    c = n // 8
    col, emi = Image.new('RGB', (n, n), (40, 44, 48)), Image.new('RGB', (n, n), (0, 0, 0))
    hgt, rgh, mtl = Image.new('L', (n, n), 128), Image.new('L', (n, n), 150), Image.new('L', (n, n), 90)
    dc, de, dh, dr, dm = [ImageDraw.Draw(i) for i in (col, emi, hgt, rgh, mtl)]
    rng = np.random.default_rng(4401)

    def px(name):
        u0, v0, u1, v1 = TRIM_REGIONS[name]
        return int(u0 * n), int((1 - v1) * n), int(u1 * n), int((1 - v0) * n)

    def fill(name, rgb, rough=150, metal=90, height=128):
        x0, y0, x1, y1 = px(name)
        dc.rectangle((x0, y0, x1 - 1, y1 - 1), fill=rgb); dr.rectangle((x0, y0, x1 - 1, y1 - 1), fill=rough)
        dm.rectangle((x0, y0, x1 - 1, y1 - 1), fill=metal); dh.rectangle((x0, y0, x1 - 1, y1 - 1), fill=height)
        return x0, y0, x1, y1

    # hazard: diagonal yellow and black
    x0, y0, x1, y1 = fill('hazard', (24, 24, 26), 150, 40)
    w = 64
    for i in range(-8, 32):
        if i % 2 == 0:
            dc.polygon([(x0 + i * w, y1), (x0 + i * w + w, y1), (x0 + i * w + w + (y1 - y0), y0), (x0 + i * w + (y1 - y0), y0)], fill=(214, 160, 34))
    # vent louvres
    x0, y0, x1, y1 = fill('vent', (46, 50, 54), 120, 170)
    for y in range(y0 + 14, y1 - 10, 22):
        dc.rectangle((x0 + 16, y, x1 - 16, y + 12), fill=(8, 9, 10)); dh.rectangle((x0 + 16, y, x1 - 16, y + 12), fill=30)
        dc.rectangle((x0 + 16, y + 12, x1 - 16, y + 15), fill=(120, 124, 128)); dh.rectangle((x0 + 16, y + 12, x1 - 16, y + 17), fill=220)
    dc.rectangle((x0 + 6, y0 + 6, x1 - 7, y1 - 7), outline=(96, 100, 104), width=5); dh.rectangle((x0 + 6, y0 + 6, x1 - 7, y1 - 7), outline=230, width=5)
    # floor grating
    x0, y0, x1, y1 = fill('grate', (70, 74, 78), 110, 200, 200)
    for y in range(y0 + 10, y1 - 6, 24):
        for x in range(x0 + 10, x1 - 6, 64):
            dc.rounded_rectangle((x, y, x + 52, y + 12), radius=5, fill=(4, 4, 5)); dh.rounded_rectangle((x, y, x + 52, y + 12), radius=5, fill=10)
    # screens
    f1, f2, f3 = _font(22), _font(15), _font(40)
    x0, y0, x1, y1 = fill('screen_a', (4, 14, 16), 40, 0)
    de.rectangle((x0, y0, x1 - 1, y1 - 1), fill=(3, 16, 18))
    for i in range(9):
        yy = y0 + 70 + i * 44
        wbar = int(rng.uniform(.25, .9) * (x1 - x0 - 80))
        de.rectangle((x0 + 30, yy, x0 + 30 + wbar, yy + 14), fill=(60, 200, 180) if i % 4 else (230, 170, 60))
        de.rectangle((x0 + 30 + wbar + 12, yy, x0 + 30 + wbar + 40, yy + 14), fill=(30, 90, 84))
    de.rectangle((x0 + 12, y0 + 12, x1 - 13, y1 - 13), outline=(70, 210, 190), width=3)
    de.text((x0 + 30, y0 + 24), 'SYSTEMS', font=f1, fill=(140, 240, 225))
    x0, y0, x1, y1 = fill('screen_b', (16, 10, 4), 40, 0)
    de.rectangle((x0, y0, x1 - 1, y1 - 1), fill=(18, 10, 3))
    pts = [(x0 + 30 + i * 24, y1 - 120 - int(60 * np.sin(i * .7) + rng.uniform(-18, 18))) for i in range(19)]
    de.line(pts, fill=(250, 170, 50), width=4)
    for gx in range(x0 + 30, x1 - 20, 48):
        de.line((gx, y0 + 80, gx, y1 - 40), fill=(60, 36, 8), width=1)
    for i in range(4):
        de.rectangle((x0 + 30 + i * 112, y1 - 34, x0 + 120 + i * 112, y1 - 20), fill=(230, 140, 40) if i != 2 else (220, 60, 40))
    de.text((x0 + 30, y0 + 24), 'PRESSURE', font=f1, fill=(255, 196, 96))
    de.rectangle((x0 + 12, y0 + 12, x1 - 13, y1 - 13), outline=(210, 140, 40), width=3)
    # lit windows (warm, with blinds or a shelf line) and a dark one
    for i, name in enumerate(('win_a', 'win_b', 'win_c')):
        x0, y0, x1, y1 = fill(name, (30, 26, 20), 30, 0)
        base = [(255, 206, 140), (250, 190, 120), (214, 226, 240)][i]
        for y in range(y0, y1):
            t = (y - y0) / (y1 - y0)
            de.line((x0, y, x1 - 1, y), fill=tuple(int(v * (1 - .45 * t)) for v in base))
        if i == 0:
            for y in range(y0 + 20, y1, 22):
                de.rectangle((x0, y, x1, y + 5), fill=tuple(int(v * .45) for v in base))
        if i == 1:
            de.rectangle((x0 + 150, y0 + 90, x1, y1), fill=(80, 56, 34)); de.rectangle((x0, y1 - 60, x1, y1), fill=(96, 70, 44))
        if i == 2:
            de.rectangle((x0 + 30, y0 + 110, x0 + 90, y1), fill=(60, 66, 74))
    x0, y0, x1, y1 = fill('win_dark', (10, 13, 18), 25, 0)
    dc.rectangle((x0 + 30, y0 + 40, x0 + 110, y0 + 46), fill=(40, 48, 58))
    # solar cells
    x0, y0, x1, y1 = fill('solar', (16, 30, 52), 45, 120)
    for y in range(y0, y1, 64):
        for x in range(x0, x1, 64):
            shade = int(rng.uniform(-6, 6))
            dc.rectangle((x + 3, y + 3, x + 60, y + 60), fill=(22 + shade, 42 + shade, 72 + shade))
            for k in range(1, 4):
                dc.line((x + 3, y + 3 + k * 14, x + 60, y + 3 + k * 14), fill=(60, 84, 112), width=1)
            dc.line((x + 31, y + 3, x + 31, y + 60), fill=(150, 160, 170), width=2)
            dh.rectangle((x + 3, y + 3, x + 60, y + 60), fill=150)
    # cable bundle (runs along u)
    x0, y0, x1, y1 = fill('cable', (12, 12, 13), 170, 0, 40)
    cols = [(30, 30, 32), (44, 44, 46), (120, 40, 30), (34, 36, 40), (150, 120, 40), (30, 30, 32), (40, 60, 90), (36, 36, 38)]
    hh = (y1 - y0) / len(cols)
    for i, cc in enumerate(cols):
        ya = y0 + i * hh
        for k in range(int(hh)):
            t = 1 - abs(k / hh - .5) * 2
            dc.line((x0, ya + k, x1, ya + k), fill=tuple(int(v * (.35 + .75 * t)) for v in cc)); dh.line((x0, ya + k, x1, ya + k), fill=int(60 + 180 * np.sqrt(max(t, 0))))
    for x in range(x0 + 120, x1, 250):
        dc.rectangle((x, y0, x + 16, y1), fill=(70, 74, 78)); dh.rectangle((x, y0, x + 16, y1), fill=250); dm.rectangle((x, y0, x + 16, y1), fill=220)
    # placards
    x0, y0, x1, y1 = fill('label_a', (206, 158, 36), 130, 20)
    dc.polygon([(x0 + 128, y0 + 34), (x0 + 50, y0 + 170), (x0 + 206, y0 + 170)], outline=(20, 20, 20), width=12)
    dc.rectangle((x0 + 122, y0 + 90, x0 + 134, y0 + 130), fill=(20, 20, 20)); dc.ellipse((x0 + 120, y0 + 140, x0 + 136, y0 + 156), fill=(20, 20, 20))
    dc.text((x0 + 46, y0 + 186), 'CAUTION', font=_font(34), fill=(20, 20, 20))
    x0, y0, x1, y1 = fill('label_b', (200, 204, 204), 130, 20)
    dc.rectangle((x0, y0, x1, y0 + 70), fill=(170, 40, 34)); dc.text((x0 + 22, y0 + 14), 'EMERGENCY', font=_font(34), fill=(240, 240, 236))
    for i in range(5):
        dc.rectangle((x0 + 22, y0 + 92 + i * 30, x0 + 22 + int(rng.uniform(90, 210)), y0 + 104 + i * 30), fill=(60, 64, 68))
    x0, y0, x1, y1 = fill('label_c', (38, 60, 86), 130, 20)
    dc.text((x0 + 24, y0 + 30), 'O2', font=_font(110), fill=(220, 226, 230)); dc.rectangle((x0 + 24, y0 + 180, x1 - 24, y0 + 196), fill=(220, 226, 230))
    dc.text((x0 + 24, y0 + 206), 'LIFE SUPPORT', font=_font(24), fill=(220, 226, 230))
    x0, y0, x1, y1 = fill('label_d', (30, 32, 34), 130, 20)
    dc.rectangle((x0 + 10, y0 + 10, x1 - 11, y1 - 11), outline=(206, 158, 36), width=6)
    dc.text((x0 + 30, y0 + 40), 'PWR', font=_font(84), fill=(206, 158, 36)); dc.text((x0 + 30, y0 + 150), '440 V', font=_font(44), fill=(206, 158, 36))
    # light diffusers
    for name, rgb in (('light_warm', (255, 214, 160)), ('light_cool', (206, 226, 255))):
        x0, y0, x1, y1 = fill(name, (60, 62, 64), 60, 0)
        de.rectangle((x0 + 14, y0 + 14, x1 - 15, y1 - 15), fill=rgb)
        for x in range(x0 + 14, x1 - 14, 62):
            de.line((x, y0 + 14, x, y1 - 15), fill=tuple(int(v * .7) for v in rgb), width=3)
        dc.rectangle((x0, y0, x1 - 1, y1 - 1), outline=(86, 90, 94), width=12); dh.rectangle((x0, y0, x1 - 1, y1 - 1), outline=240, width=12)
    for name, rgb in (('led_red', (255, 50, 36)), ('led_green', (70, 240, 150)), ('led_amber', (255, 170, 50)), ('led_white', (240, 240, 230))):
        x0, y0, x1, y1 = fill(name, tuple(int(v * .5) for v in rgb), 40, 0)
        de.rectangle((x0, y0, x1 - 1, y1 - 1), fill=rgb)
    # floor chevrons
    x0, y0, x1, y1 = fill('chevron', (26, 28, 30), 150, 40)
    for i in range(8):
        cx = x0 + 64 + i * 128
        dc.polygon([(cx - 44, y0 + 40), (cx - 8, y0 + 40), (cx + 44, y0 + 128), (cx - 8, y1 - 40), (cx - 44, y1 - 40), (cx + 8, y0 + 128)], fill=(214, 160, 34))
    fill('rubber', (14, 15, 16), 220, 0)
    x0, y0, x1, y1 = fill('keypad', (30, 33, 36), 120, 120)
    for r in range(4):
        for k in range(3):
            bx, by = x0 + 40 + k * 62, y0 + 30 + r * 54
            dc.rounded_rectangle((bx, by, bx + 48, by + 40), radius=6, fill=(70, 74, 78)); dh.rounded_rectangle((bx, by, bx + 48, by + 40), radius=6, fill=220)
            if (r, k) in ((0, 0), (3, 2)):
                de.rounded_rectangle((bx, by, bx + 48, by + 40), radius=6, fill=(70, 240, 150) if r else (255, 60, 40))
    x0, y0, x1, y1 = fill('stripe', (180, 184, 184), 130, 30)
    dc.rectangle((x0, y0 + 70, x1, y0 + 186), fill=(190, 60, 40)); dc.rectangle((x0, y0 + 110, x1, y0 + 124), fill=(226, 226, 220))
    x0, y0, x1, y1 = fill('fins', (150, 154, 156), 90, 220)
    for x in range(x0, x1, 16):
        dc.rectangle((x, y0, x + 5, y1), fill=(30, 32, 34)); dh.rectangle((x, y0, x + 5, y1), fill=20); dh.rectangle((x + 6, y0, x + 15, y1), fill=230)
    # hangar deck marking: a long yellow line with tick marks, and a bay numeral plate
    x0, y0, x1, y1 = fill('marking', (30, 32, 34), 150, 40)
    dc.rectangle((x0, y0 + 96, x1, y0 + 160), fill=(214, 160, 34))
    for x in range(x0 + 40, x1, 128):
        dc.rectangle((x, y0 + 40, x + 24, y0 + 96), fill=(214, 160, 34))
    x0, y0, x1, y1 = fill('bay_no', (30, 32, 34), 150, 40)
    dc.rectangle((x0 + 12, y0 + 12, x1 - 13, y1 - 13), outline=(214, 160, 34), width=10)
    dc.text((x0 + 60, y0 + 60), 'BAY · SERVICE', font=_font(52), fill=(214, 160, 34))
    x0, y0, x1, y1 = fill('tread', (60, 63, 66), 110, 190)
    for y in range(y0, y1, 32):
        for x in range(x0 + (16 if (y // 32) % 2 else 0), x1, 32):
            dc.ellipse((x + 6, y + 10, x + 26, y + 22), fill=(110, 114, 116)); dh.ellipse((x + 6, y + 10, x + 26, y + 22), fill=240)

    # grime and wear over the non-glowing parts
    colour = np.asarray(col, dtype=float)
    em = np.asarray(emi, dtype=float)
    lit = (em.sum(-1) > 30)[..., None]
    grime = _spectral(n, 4410, 2.6, lo=6.0)[..., None]
    scratch = _hairlines(n, 4411, 260)[..., None]
    colour = np.where(lit, colour, colour * (.78 + .3 * grime) * (1 - .35 * scratch) + 200 * .35 * scratch)
    _jpg(out + '/st_trim_color.jpg', colour)
    _jpg(out + '/st_trim_emissive.jpg', em, 92)
    h = _blur(np.asarray(hgt, dtype=float) / 255, 1.0)
    _jpg(out + '/st_trim_normal.jpg', _normal(h * 4 + .15 * grime[..., 0], 1.6), 92)
    rough = np.asarray(rgh, dtype=float) / 255 + .12 * (grime[..., 0] - .5)
    metal = np.asarray(mtl, dtype=float) / 255
    ao = (.55 + .45 * _step(.1, .45, h))
    _jpg(out + '/st_trim_orm.jpg', _orm(ao, rough.clip(.1, .98), metal), 92)


def build_all(out):
    os.makedirs(out, exist_ok=True)
    hull(out); wall(out); deck(out); trim(out)


if __name__ == '__main__':
    build_all(sys.argv[1])
    print('station textures written to', sys.argv[1])
