"""Vantor textures (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). Generated from seeded noise; nothing downloaded.
Run by build_vantor.py (needs numpy and Pillow). Writes 1K tileable colour / normal / ORM (glTF packing: R occlusion, G roughness, B metallic) JPEGs
into the directory it is given:
  v_rock    rust-red excavated rock: strata, mineral veins, pitting, wet streaks (tiles every 6 m)
  v_steel   dark weathered structural steel: scratches, rust blooms, grime, bolt rows (tiles every 3 m)
  v_floor   heavy deck plate / poured concrete with tread, oil stains and worn walkways (tiles every 4 m)
  v_hazard  yellow/black hazard stripe on worn paint (tiles every 2 m)
Sources of the modelling: made by Claude for this project; no third-party assets."""
import os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kit'))
from kit_textures import _normal, _orm, _spectral, _step, _hairlines  # noqa: E402


def _jpg(path, arr, q=90):
    Image.fromarray(np.asarray(arr).clip(0, 255).astype(np.uint8)).save(path, quality=q, optimize=True)


def _out(d, name, color, height, ao, rough, metal, ns):
    _jpg(os.path.join(d, name + '_color.jpg'), color)
    _jpg(os.path.join(d, name + '_normal.jpg'), _normal(height, ns), 92)
    _jpg(os.path.join(d, name + '_orm.jpg'), _orm(ao, rough, metal), 92)


def rock(d, n=1024, name='v_rock', base=(.46, .24, .165), alt=(.30, .18, .145), vein_a=(.62, .38, .20), vein_b=(.18, .36, .36)):
    h = .55 * _spectral(n, 11, 2.6) + .30 * _spectral(n, 12, 1.6, lo=6) + .15 * _spectral(n, 13, .9, lo=24)
    strata = _spectral(n, 14, 3.2, ax=.15, ay=1.0, lo=2)              # horizontal bands
    h = h * .75 + strata * .35
    ledge = np.abs(np.sin((np.arange(n)[:, None] / n * 9 + strata * 2.2) * np.pi))   # terraced steps
    h = h * .8 + ledge * .18
    h = (h - h.min()) / (h.max() - h.min())
    base, alt = np.array(base), np.array(alt)                        # Vantor: dark rust-red
    mix = _step(.35, .75, strata + .25 * _spectral(n, 15, 1.8))[..., None]
    col = base * (1 - mix) + alt * mix
    col = col * (.55 + .8 * h[..., None])
    # mineral veins: thin pale/teal-ish and orange lines
    veins = _spectral(n, 16, 2.2, lo=3)
    vein = (1 - _step(0, .018, np.abs(veins - .5))) * _step(.3, .7, _spectral(n, 17, 1.5))
    col = col * (1 - vein[..., None] * .9) + vein[..., None] * np.array(vein_a) * .9
    v2 = (1 - _step(0, .012, np.abs(_spectral(n, 18, 2.2, lo=4) - .5))) * _step(.5, .8, _spectral(n, 19, 1.5))
    col = col * (1 - v2[..., None] * .8) + v2[..., None] * np.array(vein_b) * .8
    wet = _step(.55, .8, _spectral(n, 20, 2.0, ax=.35, ay=1.0, lo=2))   # wet streaks run down
    col = col * (1 - .35 * wet[..., None])
    ao = (.35 + .65 * h) ** 1.2
    rough = (.92 - .5 * wet - .1 * h).clip(.3, 1)
    metal = np.clip(vein * .25, 0, 1)
    _out(d, name, col * 255, h, ao, rough, metal, 5.0)


def steel(d, n=1024):
    base = _spectral(n, 31, 2.4)
    fine = _spectral(n, 32, 1.2, lo=40)
    scr = _hairlines(n, 33, 60) if callable(_hairlines) else np.zeros((n, n))
    h = .3 * base + .2 * fine + .25 * np.asarray(scr)
    col = np.array([.17, .18, .19])[None, None, :] * (.7 + .5 * base[..., None])
    rust = _step(.55, .8, _spectral(n, 34, 2.0, lo=3)) * _step(.3, .6, _spectral(n, 35, 1.4))
    col = col * (1 - rust[..., None] * .75) + rust[..., None] * np.array([.34, .17, .08]) * .75
    grime = _step(.5, .9, _spectral(n, 36, 2.2, ax=.4, ay=1.0, lo=2))
    col = col * (1 - .4 * grime[..., None])
    # bolt rows every 0.25 m (4 per 1 m, tile 3 m => 12 across), rivets
    yy, xx = np.mgrid[0:n, 0:n] / n
    bolt = np.zeros((n, n))
    for gy in (0.0833, 0.5, 0.9166):
        dy = (yy - gy) * 3
        for k in range(12):
            dx = (xx - (k + .5) / 12) * 3
            bolt += np.exp(-(dx * dx + dy * dy) / .0012)
    h += .5 * bolt.clip(0, 1)
    ao = (.6 + .4 * (1 - grime)) * (1 - .3 * rust)
    rough = (.45 + .35 * rust + .2 * fine + .1 * grime).clip(.3, 1)
    metal = (.85 * (1 - rust) * (.7 + .3 * base)).clip(0, 1)
    _out(d, 'v_steel', col * 255, h, ao, rough, metal, 5.0)


def floor(d, n=1024):
    px = n / 4
    h = .25 * _spectral(n, 41, 2.2) + .15 * _spectral(n, 42, 1.0, lo=30)
    plate = np.zeros((n, n))
    gy, gx = np.mgrid[0:n, 0:n]
    for k in range(4):            # 1 m plates, seams 0.02 m
        plate[(gy % px) < 3] = 1
        plate[:, (gx[0] % px) < 3] = 1
    # diamond tread
    t = (np.sin((gx + gy) / n * 4 * 2 * np.pi * 4) * np.sin((gx - gy) / n * 4 * 2 * np.pi * 4)) > .2
    h = h + .12 * t * (1 - plate) - .3 * plate
    col = np.array([.15, .15, .155])[None, None, :] * (.7 + .6 * _spectral(n, 43, 1.8)[..., None])
    oil = _step(.62, .85, _spectral(n, 44, 2.0, lo=3))
    col = col * (1 - .6 * oil[..., None])
    path = _step(.4, .8, _spectral(n, 45, 3.0, ax=1.0, ay=.2, lo=1))       # worn walkways: lighter, polished
    col = col + .05 * path[..., None]
    rust = _step(.65, .9, _spectral(n, 46, 1.8, lo=4)) * plate
    col = col * (1 - rust[..., None] * .5) + rust[..., None] * np.array([.3, .15, .07]) * .5
    ao = (1 - .5 * plate) * (.7 + .3 * _spectral(n, 47, 1.5))
    rough = (.55 + .3 * (1 - oil) - .25 * path + .1 * t).clip(.25, 1)
    metal = (.4 * (1 - oil) * (1 - rust)).clip(0, 1)
    _out(d, 'v_floor', col * 255, h, ao, rough, metal, 2.2)


def hazard(d, n=512):
    gy, gx = np.mgrid[0:n, 0:n]
    stripe = (((gx + gy) / n * 8) % 1) < .5
    yellow = np.array([.62, .46, .08]); black = np.array([.05, .05, .055])
    col = np.where(stripe[..., None], yellow, black)
    wear = _step(.45, .85, _spectral(n, 51, 1.8, lo=3))
    base = np.array([.2, .2, .21])
    col = col * (1 - .55 * wear[..., None]) + base * .55 * wear[..., None]
    h = .3 * _spectral(n, 52, 1.5) - .15 * wear
    ao = .85 + 0 * h
    _out(d, 'v_hazard', col * 255, h, ao, (.55 + .3 * wear).clip(0, 1), .2 * (1 - wear), 3.0)


def build(d):
    os.makedirs(d, exist_ok=True)
    for f in (rock, steel, floor, hazard):
        f(d)
    rock(d, name='b_rock', base=(.34, .32, .30), alt=(.22, .21, .21), vein_a=(.70, .62, .50), vein_b=(.45, .5, .55))


if __name__ == '__main__':
    build(sys.argv[1])
