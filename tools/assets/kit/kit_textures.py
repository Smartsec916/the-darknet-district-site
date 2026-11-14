"""Textures for the building kit (docs/development/BUILDING_KIT.md). Run by build_kit.py; needs numpy and Pillow, nothing else.

Four shared materials, each one texture set, generated here (nothing downloaded, nothing to license):
  kit_concrete  2K, tiles every 4 m   colour toned to sit beside the game's ambientCG brick (brick-color.jpg averages RGB 133,106,83)
  kit_metal     1K, tiles every 2 m   dark painted steel with rust
  kit_glass     512, one pane         dark, dirty window glass
  kit_emissive  1K ATLAS              the only light-giving texture: lit windows, neon tube, sign face (see EMISSIVE_REGIONS)
Each set is <name>_color.png, <name>_normal.png and <name>_orm.png (glTF packing: R occlusion, G roughness, B metallic).
Everything is seeded: the same files come out every time."""
import numpy as np
from PIL import Image

BRICK = np.array([133.2, 106.0, 83.5])
# Regions of the emissive atlas in UV (u0, v0, u1, v1), v up. build_kit.py maps faces into these.
EMISSIVE_REGIONS = {'window_magenta': (0, .5, .25, 1), 'window_cyan': (.25, .5, .5, 1), 'window_violet': (.5, .5, .75, 1), 'window_green': (.75, .5, 1, 1),
                    'neon_magenta': (0, .375, .5, .5), 'neon_cyan': (0, .25, .5, .375), 'neon_amber': (0, .125, .5, .25), 'neon_white': (0, 0, .5, .125),
                    'sign_magenta': (.5, .25, .75, .5), 'sign_cyan': (.75, .25, 1, .5), 'sign_amber': (.5, 0, .75, .25), 'sign_violet': (.75, 0, 1, .25)}


def _noise(n, octaves, seed, persistence=.55, base=4):
    """Tileable value noise, 0..1."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n))
    amp, total, cells = 1.0, 0.0, base
    ys, xs = np.mgrid[0:n, 0:n] / n
    for _ in range(octaves):
        g = rng.random((cells, cells))
        fx, fy = xs * cells, ys * cells
        x0, y0 = np.floor(fx).astype(int) % cells, np.floor(fy).astype(int) % cells
        x1, y1 = (x0 + 1) % cells, (y0 + 1) % cells
        tx, ty = fx - np.floor(fx), fy - np.floor(fy)
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        out += amp * ((g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty)
        total += amp
        amp *= persistence
        cells *= 2
    return out / total


def _normal(height, strength):
    dx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * strength
    dy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * strength
    nz = np.ones_like(height)
    length = np.sqrt(dx * dx + dy * dy + nz * nz)
    n = np.stack([-dx / length, dy / length, nz / length], -1)   # image rows run downward, glTF normal maps are +Y up
    return ((n * .5 + .5) * 255).clip(0, 255).astype(np.uint8)


def _save(path, arr):
    Image.fromarray(arr.astype(np.uint8)).save(path, optimize=True)


def _orm(ao, rough, metal):
    return (np.stack([ao, rough, metal], -1) * 255).clip(0, 255)


def concrete(out, n=2048):
    big, mid, fine = _noise(n, 5, 11), _noise(n, 6, 12, base=16), _noise(n, 4, 13, base=128)
    tone = (BRICK * .34 + np.array([84, 90, 100]) * .66) * .8      # a dark, cool grey that still carries a little of the brick's warmth
    value = .62 + .30 * (big - .5) + .16 * (mid - .5) + .10 * (fine - .5)
    # shutter-board lines of the casting, one every metre (the texture spans 4 m)
    ys, xs = np.mgrid[0:n, 0:n]
    board = np.minimum((ys % (n // 4)), (n // 4) - (ys % (n // 4))) < 2
    height = big * .5 + mid * .35 + fine * .15 - board * .5
    # rain streaks running down from random points, and damp patches
    rng = np.random.default_rng(14)
    streak = np.zeros((n, n))
    for _ in range(150):
        x, y0, length, width = rng.integers(0, n), rng.integers(0, n), rng.integers(n // 10, n // 2), rng.integers(3, 14)
        rows = (np.arange(length) + y0) % n
        fade = np.linspace(1, 0, length) ** 1.5
        for dx in range(-width, width + 1):
            streak[rows, (x + dx) % n] = np.maximum(streak[rows, (x + dx) % n], fade * (1 - abs(dx) / (width + 1)))
    damp = np.clip((_noise(n, 3, 15, base=3) - .55) * 4, 0, 1)
    value = value * (1 - .30 * streak) * (1 - .22 * damp) * (1 - .25 * board)
    color = tone[None, None, :] * value[..., None]
    color += (np.array([10, 16, 8]) * (damp * .6)[..., None]) - (np.array([18, 20, 22]) * streak[..., None] * .5)   # a little green in the damp, soot in the streaks
    _save(out + '/kit_concrete_color.png', color.clip(0, 255))
    _save(out + '/kit_concrete_normal.png', _normal(height, 2.2 * n / 1024))
    rough = .9 - .32 * damp - .12 * streak + .05 * (fine - .5)
    _save(out + '/kit_concrete_orm.png', _orm(.72 + .28 * mid, rough.clip(.3, 1), np.zeros((n, n))))


def metal(out, n=1024):
    big, mid, fine = _noise(n, 5, 21), _noise(n, 6, 22, base=12), _noise(n, 3, 23, base=96)
    rust = np.clip((big * .6 + mid * .4 - .52) * 7, 0, 1)
    ys, xs = np.mgrid[0:n, 0:n]
    scratch = (_noise(n, 2, 24, base=64)[ys, (xs * 9) % n] > .86) * (fine > .45)
    paint = np.array([44, 52, 58]) * (.82 + .3 * (mid - .5))[..., None]
    rusty = np.array([122, 62, 30]) * (.7 + .6 * (fine - .5) + .3 * (mid - .5))[..., None]
    color = paint * (1 - rust[..., None]) + rusty * rust[..., None]
    color = color * (1 - .25 * scratch[..., None]) + np.array([150, 152, 150]) * (.25 * scratch[..., None])
    height = mid * .3 + rust * (.5 + .5 * fine) - scratch * .3
    _save(out + '/kit_metal_color.png', color.clip(0, 255))
    _save(out + '/kit_metal_normal.png', _normal(height, 1.6))
    rough = .5 + .42 * rust - .2 * scratch + .08 * (fine - .5)
    metalness = (.55 * (1 - rust) + .15 * rust + .4 * scratch).clip(0, 1)     # paint is half-worn through; rust is not metallic
    _save(out + '/kit_metal_orm.png', _orm(.8 + .2 * mid, rough.clip(.2, 1), metalness))


def glass(out, n=512):
    mid, fine = _noise(n, 5, 31), _noise(n, 4, 32, base=48)
    ys, xs = np.mgrid[0:n, 0:n] / n
    dirt = np.clip(1.4 * ys ** 3 + .35 * (mid - .4), 0, 1)            # grime gathers at the bottom of a pane
    color = np.array([14, 20, 26])[None, None, :] * (1 + .5 * (mid - .5))[..., None] * (1 - dirt[..., None]) + np.array([52, 50, 44]) * dirt[..., None]
    _save(out + '/kit_glass_color.png', color.clip(0, 255))
    _save(out + '/kit_glass_normal.png', _normal(fine * .2, .6))
    _save(out + '/kit_glass_orm.png', _orm(np.ones((n, n)), (.08 + .6 * dirt).clip(0, 1), np.zeros((n, n))))


def emissive(out, n=1024):
    """Atlas: top half four lit-window looks (magenta, cyan with blinds, violet, green with blinds), bottom-left four neon tube colours (magenta, cyan, amber, white), bottom-right a blank sign face."""
    img = np.zeros((n, n, 3))
    h = n // 2
    q = n // 4
    rng = np.random.default_rng(41)
    ys, xs = np.mgrid[0:h, 0:q]
    v, u = ys / h, xs / q

    def window(col, blinds=False, dim=1.0, seed=0):
        base = np.array(col, float)[None, None, :] * (dim * (.75 + .35 * np.exp(-((u - .5) ** 2) * 3 - ((v - .35) ** 2) * 4)))[..., None]
        r = np.random.default_rng(seed)
        # a curtain edge and something standing in the room, as darker shapes
        cx = r.uniform(.15, .85)
        base *= (1 - .45 * ((u > cx - .12) & (u < cx + .12) & (v > .45)))[..., None]
        base *= (1 - .35 * (u < r.uniform(.08, .22)))[..., None]
        if blinds:
            base *= (.55 + .45 * (((v * 22) % 1) > .35))[..., None]
        return base

    # coloured room light, the way a street of signs and screens lights its rooms: no warm or white windows
    img[0:h, 0:q] = window([255, 50, 170], seed=1)
    img[0:h, q:2 * q] = window([40, 225, 255], blinds=True, seed=2)
    img[0:h, 2 * q:3 * q] = window([150, 80, 255], seed=3, dim=.95)
    img[0:h, 3 * q:4 * q] = window([70, 255, 150], blinds=True, seed=4, dim=.8)
    # neon: bright core fading to the edge of the tube, along the texture's v
    yy, xx = np.mgrid[0:h, 0:h]
    for name, col in (('neon_magenta', (255, 60, 190)), ('neon_cyan', (60, 230, 255)), ('neon_amber', (255, 170, 60)), ('neon_white', (255, 255, 255))):
        _, v0, _, v1 = EMISSIVE_REGIONS[name]
        r0, r1 = int(n - v1 * n), int(n - v0 * n)
        core = np.exp(-((np.linspace(0, 1, r1 - r0) - .5) ** 2) * 10)
        img[r0:r1, 0:h] = ((.8 + .2 * core)[:, None, None] * np.array(col, float)[None, None, :])
    # sign face: an even, slightly mottled light box with a darker rim
    # four coloured light-box faces, each with rows of dark blocks standing in for lettering (no real words: a shop's own sign picture can replace them)
    sy, sx = np.mgrid[0:q, 0:q]
    rim = np.minimum.reduce([sy, sx, q - 1 - sy, q - 1 - sx]) / q
    for k, (name, col) in enumerate((('sign_magenta', (255, 50, 170)), ('sign_cyan', (40, 225, 255)), ('sign_amber', (255, 165, 50)), ('sign_violet', (160, 90, 255)))):
        u0, v0, u1, v1 = EMISSIVE_REGIONS[name]
        face = (.5 + .5 * np.clip(rim * 14, 0, 1)) * (.9 + .2 * (_noise(q, 3, 42 + k, base=8) - .5))
        r = np.random.default_rng(70 + k)
        for row in range(6):
            y0 = int(q * (.1 + row * .14))
            x = int(q * .12)
            while x < q * .86:
                w = int(q * r.uniform(.05, .16))
                face[y0:y0 + int(q * .08), x:min(x + w, int(q * .88))] *= .08
                x += w + int(q * r.uniform(.03, .07))
        img[int(n - v1 * n):int(n - v0 * n), int(u0 * n):int(u1 * n)] = face[..., None] * np.array(col, float)
    _save(out + '/kit_emissive_color.png', img.clip(0, 255))


def asphalt(out, n=1024):
    big, mid, fine = _noise(n, 4, 51), _noise(n, 5, 52, base=24), _noise(n, 3, 53, base=160)
    wet = np.clip((big - .45) * 5, 0, 1)                               # puddled, shiny areas
    value = .5 + .3 * (mid - .5) + .35 * (fine - .5)
    color = np.array([44, 46, 52])[None, None, :] * value[..., None] * (1 - .35 * wet[..., None])
    _save(out + '/kit_asphalt_color.png', color.clip(0, 255))
    _save(out + '/kit_asphalt_normal.png', _normal(fine * (1 - wet) + mid * .3, 2.0))
    _save(out + '/kit_asphalt_orm.png', _orm(.85 + .15 * mid, (.85 - .7 * wet).clip(.08, 1), np.zeros((n, n))))


# The scrolling sign above the shops: one long LED strip of text that repeats every TICKER_METRES. The game scrolls it by sliding the texture sideways.
# PLACEHOLDER WORDING (shop names already on the street, plus generic shop talk): David approves the final text.
TICKER_METRES = 20
TICKER_TEXT = [('NIGHT MARKET', (255, 60, 190)), ('OPEN 24H', (60, 230, 255)), ('DRAGON NOODLES', (255, 170, 60)), ('HOT // FAST // CHEAP', (255, 60, 190)),
               ('ELECTRONICS', (60, 230, 255)), ('REPAIRS WHILE YOU WAIT', (90, 255, 150)), ('PHARMACY 24H', (90, 255, 150)), ('NO CREDIT', (255, 70, 70)),
               ('DATA RECOVERY', (170, 110, 255)), ('CASH ONLY', (255, 170, 60))]


def ticker(out, cols=1024, rows=32, dot=4):
    from PIL import ImageDraw, ImageFont
    font = None
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'):
        try:
            font = ImageFont.truetype(path, 24)
            break
        except OSError:
            pass
    font = font or ImageFont.load_default()
    # lay the phrases out end to end, then stretch the gaps so the strip closes on itself exactly
    widths = [int(font.getlength(t)) for t, _ in TICKER_TEXT]
    gap = max(8, (cols - sum(widths)) // len(TICKER_TEXT))
    small = Image.new('RGB', (cols, rows))
    draw, x = ImageDraw.Draw(small), gap // 2
    for (text, col), w in zip(TICKER_TEXT, widths):
        draw.text((x, 2), text, font=font, fill=col)
        draw.rectangle((x + w + gap // 2 - 2, 13, x + w + gap // 2 + 1, 18), fill=(110, 120, 140))      # a separator pip
        x += w + gap
    lit = np.asarray(small, float)
    lit = np.where(lit.max(-1, keepdims=True) > 90, lit / np.maximum(lit.max(-1, keepdims=True), 1) * 255, 0)   # hard on/off LEDs, full brightness
    big = np.repeat(np.repeat(lit, dot, 0), dot, 1)
    yy, xx = np.mgrid[0:rows * dot, 0:cols * dot]
    mask = (((yy % dot) - (dot - 1) / 2) ** 2 + ((xx % dot) - (dot - 1) / 2) ** 2) <= (dot * .47) ** 2
    off = np.array([10, 9, 14]) * mask[..., None]                                                 # unlit LEDs are just visible
    _save(out + '/kit_ticker_color.png', np.maximum(big * mask[..., None], off).clip(0, 255))


def fabric(out, n=512):
    """Awning cloth: broad faded stripes (the texture spans 2 m, four stripes), a weave, and dirt run down by rain."""
    ys, xs = np.mgrid[0:n, 0:n] / n
    mid, fine = _noise(n, 5, 61, base=6), _noise(n, 3, 62, base=96)
    stripe = ((xs * 4).astype(int) % 2)[..., None]
    color = np.array([24, 84, 92]) * stripe + np.array([30, 28, 36]) * (1 - stripe)
    streak = _noise(n, 3, 63, base=4)[:, :1] * 0 + _noise(n, 4, 64, base=32)[:1, :]          # varies across, constant down: run-off lines
    value = (.75 + .35 * (mid - .5)) * (1 - .35 * np.clip((streak - .5) * 3, 0, 1)) * (.85 + .3 * ys)
    weave = .5 + .25 * np.sin(xs * n * .8) + .25 * np.sin(ys * n * .8)
    _save(out + '/kit_fabric_color.png', (color * value[..., None] * (.92 + .16 * weave[..., None])).clip(0, 255))
    _save(out + '/kit_fabric_normal.png', _normal(weave * .5 + fine * .3, 1.2))
    _save(out + '/kit_fabric_orm.png', _orm(.85 + .15 * mid, (.88 + .08 * (fine - .5)).clip(0, 1), np.zeros((n, n))))


def tile(out, n=1024):
    """Interior floor: dark worn tiles, half a metre each (the texture spans 2 m), semi-gloss with duller scuffed paths and damp patches."""
    big, mid, fine = _noise(n, 4, 81), _noise(n, 5, 82, base=20), _noise(n, 3, 83, base=128)
    ys, xs = np.mgrid[0:n, 0:n]
    cell = n // 4
    gy, gx = ys % cell, xs % cell
    grout = (np.minimum(gy, cell - gy) < 3) | (np.minimum(gx, cell - gx) < 3)
    shade = _noise(4, 1, 84, base=4)[(ys // cell) % 4, (xs // cell) % 4]                 # each tile its own tone
    wear = np.clip((big - .48) * 5, 0, 1)
    value = (.55 + .25 * (shade - .5) + .18 * (mid - .5) + .1 * (fine - .5)) * (1 - .25 * wear)
    color = np.array([46, 52, 62])[None, None, :] * value[..., None]
    color = color * (1 - .6 * grout[..., None])
    _save(out + '/kit_tile_color.png', color.clip(0, 255))
    _save(out + '/kit_tile_normal.png', _normal(mid * .25 + fine * .15 - grout * .8, 1.8))
    rough = (.3 + .35 * wear + .1 * (fine - .5) - .18 * np.clip((_noise(n, 3, 85, base=3) - .6) * 5, 0, 1)).clip(.08, 1)
    rough = np.where(grout, .9, rough)
    _save(out + '/kit_tile_orm.png', _orm(.8 + .2 * mid - .3 * grout, rough, np.zeros((n, n))))


# Merchandise colours for shop shelves and counters: a 4 x 4 sheet of muted, slightly worn swatches (not light-giving). build_kit.py maps a face into one swatch.
GOODS_COLOURS = [(196, 150, 40), (44, 86, 140), (150, 44, 40), (30, 110, 110), (214, 200, 170), (24, 24, 28), (190, 96, 36), (96, 100, 108),
                 (120, 60, 130), (60, 120, 70), (226, 180, 60), (70, 40, 30), (150, 160, 170), (200, 70, 110), (40, 50, 70), (110, 90, 60)]
GOODS_REGIONS = {'goods_%d' % i: ((i % 4) / 4, (i // 4) / 4, (i % 4 + 1) / 4, (i // 4 + 1) / 4) for i in range(16)}


def goods(out, n=256):
    q = n // 4
    img = np.zeros((n, n, 3))
    wear = _noise(n, 4, 91, base=8)
    for i, col in enumerate(GOODS_COLOURS):
        u0, v0, u1, v1 = GOODS_REGIONS['goods_%d' % i]
        img[int(n - v1 * n):int(n - v0 * n), int(u0 * n):int(u1 * n)] = np.array(col, float)
    img *= (.8 + .3 * (wear - .5))[..., None]
    _save(out + '/kit_goods_color.png', img.clip(0, 255))
    _save(out + '/kit_goods_normal.png', _normal(wear * .1, .5))
    _save(out + '/kit_goods_orm.png', _orm(np.ones((n, n)), (.6 + .2 * (wear - .5)), np.zeros((n, n))))


def canvas(out, n=512):
    """Dark pack cloth: near-black olive with a weave and rubbed edges."""
    ys, xs = np.mgrid[0:n, 0:n] / n
    mid, fine = _noise(n, 5, 95, base=8), _noise(n, 3, 96, base=96)
    weave = .5 + .25 * np.sin(xs * n * 1.1) + .25 * np.sin(ys * n * 1.1)
    value = (.7 + .4 * (mid - .5)) * (.88 + .24 * weave)
    _save(out + '/kit_canvas_color.png', (np.array([38, 40, 36])[None, None, :] * value[..., None]).clip(0, 255))
    _save(out + '/kit_canvas_normal.png', _normal(weave * .5 + fine * .3, 1.4))
    _save(out + '/kit_canvas_orm.png', _orm(.8 + .2 * mid, (.9 + .08 * (fine - .5)).clip(0, 1), np.zeros((n, n))))


SETS = {'kit_concrete': concrete, 'kit_metal': metal, 'kit_glass': glass, 'kit_emissive': emissive, 'kit_asphalt': asphalt, 'kit_ticker': ticker, 'kit_fabric': fabric, 'kit_tile': tile, 'kit_goods': goods, 'kit_canvas': canvas}


def build_all(out):
    import os
    os.makedirs(out, exist_ok=True)
    for make in SETS.values():
        make(out)


# ---------------------------------------------------------------- District wall metals ----------------------------------------------------------------
# Three shared sets for the District's Blender-made wall modules (district_hall_wall_4m_a and later pieces): dark gunmetal plate, bare worn steel and chipped
# petrol-blue paint. They are deliberately CALM: broad tonal drift, a few rust blooms, a few drip stains and hairline scratches, not an even layer of noise.
# The pieces add their own wear on top with vertex colours (bright worn edges, dark recesses, floor grime), so one small set serves every piece.
def _spectral(n, seed, beta, ax=1.0, ay=1.0, lo=1.0):
    """Tileable filtered noise, 0..1. beta: how smooth; ax/ay stretch it (ay large = long vertical streaks); lo: the largest feature, in cycles per tile."""
    rng = np.random.default_rng(seed)
    spec = np.fft.rfft2(rng.standard_normal((n, n)))
    fy = np.fft.fftfreq(n, 1.0 / n)[:, None]
    fx = np.fft.rfftfreq(n, 1.0 / n)[None, :]
    f = np.sqrt((fx * ax) ** 2 + (fy * ay) ** 2)
    filt = np.maximum(f, lo) ** (-beta / 2.0)
    filt[0, 0] = 0.0
    out = np.fft.irfft2(spec * filt, s=(n, n))
    a, b = np.percentile(out, (1, 99))
    return np.clip((out - a) / (b - a), 0, 1)


def _step(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def _hairlines(n, seed, count=46):
    """A few thin scratches, mostly along and across the plate, drawn so they wrap at the tile's edges. 0..1."""
    from PIL import ImageDraw, ImageFilter
    rng = np.random.default_rng(seed)
    im = Image.new('L', (n, n), 0)
    draw = ImageDraw.Draw(im)
    for _ in range(count):
        x, y, length = rng.uniform(0, n), rng.uniform(0, n), rng.uniform(.02, .16) * n
        a = rng.choice([0, np.pi / 2]) + rng.normal(0, .12)
        dx, dy, shade = np.cos(a) * length, np.sin(a) * length, int(rng.uniform(90, 255))
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                draw.line((x + ox, y + oy, x + dx + ox, y + dy + oy), fill=shade, width=1)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(.6)), dtype=float) / 255


def _wall_masks(n, seed):
    low, mid, fine = _spectral(n, seed, 3.2, lo=1.0), _spectral(n, seed + 1, 2.4, lo=5.0), _spectral(n, seed + 2, 1.0, lo=48.0)
    brushed = _spectral(n, seed + 3, 1.2, ax=.03, ay=6.0, lo=3.0)                                        # faint horizontal mill lines
    rust = _step(.90, .985, _spectral(n, seed + 4, 3.0, lo=2.0)) * (.35 + .65 * _step(.35, .7, fine))      # a few blooms, speckled at the edges
    drip = _step(.82, .97, _spectral(n, seed + 5, 3.0, ax=.5, ay=12.0, lo=3.0)) * _step(.35, .7, low)    # a few vertical stains
    scratch = _hairlines(n, seed + 6)
    return low, mid, fine, brushed, rust, drip, scratch


def _wall_metal(out, name, tint, scratch_tint, seed, rough0, metal0, n=1024):
    low, mid, fine, brushed, rust, drip, scratch = _wall_masks(n, seed)
    value = (.86 + .28 * low) * (.96 + .08 * mid) * (.98 + .04 * brushed)
    color = np.array(tint)[None, None, :] * value[..., None]
    color = color * (1 - .55 * drip[..., None])
    color = color * (1 - rust[..., None]) + np.array([92, 56, 38]) * (.75 + .5 * fine)[..., None] * rust[..., None]
    color = color * (1 - .7 * scratch[..., None]) + np.array(scratch_tint)[None, None, :] * (.7 * scratch[..., None])
    _save(out + '/%s_color.png' % name, color.clip(0, 255))
    rough = rough0 + .16 * (low - .5) + .06 * (brushed - .5) + .32 * drip + .38 * rust - .16 * scratch
    metalness = metal0 * (1 - .6 * drip - .85 * rust) + (1 - metal0) * scratch      # not a mirror: oxidised plate with bare metal only where it is scratched
    _save(out + '/%s_orm.png' % name, _orm(.86 + .14 * mid, rough.clip(.14, .96), metalness.clip(0, 1)))
    _save(out + '/%s_normal.png' % name, _normal(.12 * brushed + .10 * mid + .8 * rust * fine - 1.2 * scratch, 1.0))


def gunmetal(out, n=1024):
    _wall_metal(out, 'kit_gunmetal', (86, 92, 102), (176, 178, 182), 301, .5, .55, n)


def steel(out, n=1024):
    _wall_metal(out, 'kit_steel', (150, 152, 156), (206, 206, 208), 331, .4, .72, n)


def paint(out, n=1024):
    low, mid, fine, brushed, rust, drip, scratch = _wall_masks(n, 361)
    chip = np.maximum(_step(.86, .9, _spectral(n, 371, 2.6, lo=4.0)) * _step(.35, .6, _spectral(n, 372, 2.0, lo=10.0)), scratch)   # paint knocked off in a few places
    under = np.array([150, 150, 152]) * (.85 + .3 * fine)[..., None]
    value = (.86 + .28 * low) * (.96 + .08 * mid)
    color = np.array([40, 84, 98])[None, None, :] * value[..., None] * (1 - .5 * drip[..., None])
    color = color * (1 - chip[..., None]) + under * chip[..., None]
    color = color * (1 - .6 * rust[..., None] * chip[..., None]) + np.array([104, 54, 30]) * (.6 * rust * chip)[..., None]
    _save(out + '/kit_paint_color.png', color.clip(0, 255))
    rough = (.6 + .16 * (low - .5) + .25 * drip) * (1 - chip) + .36 * chip
    _save(out + '/kit_paint_orm.png', _orm(.86 + .14 * mid, rough.clip(.14, .96), (.8 * chip * (1 - .6 * drip)).clip(0, 1)))
    _save(out + '/kit_paint_normal.png', _normal(.10 * mid + .05 * fine - 1.2 * chip, 1.0))


INTERIOR_SETS = {'kit_gunmetal': gunmetal, 'kit_steel': steel, 'kit_paint': paint}
