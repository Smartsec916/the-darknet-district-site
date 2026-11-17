"""Display sheets for the in-game Admin & Iris shop: the goods on the website's store pages (store-apparel, store-survival).

    python tools/assets/store/build_atlas.py --apparel DIR

Apparel: each product picture has its plain background removed (flooded in from the picture's edges, so white parts inside the product stay) and is fitted
into one cell, standing on the cell's bottom edge. Survival: the pictures in attached_assets/ already have their own neon backdrop, so each is kept whole as a
square display card. store-atlas.json lists every cell (sheet, column, row, product name, the picture's width/height as a share of the cell).
Sources: survival = the photos already in attached_assets/ (read from store-survival.html); apparel = the store's own product pictures, fetched from its
storefront into DIR with a list.json of [title, file] (not kept in the repository). The electronics page is left out (the owner, Nov 2026).
The survival photos show other makers' products: see docs/VOID_RUNNER_ASSET_LICENSES.md."""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'textures', 'store')


def cutout(path, tol=26):
    im = Image.open(path).convert('RGBA')
    if im.width > 640:
        im = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS)
    if im.getextrema()[3][0] < 250:                    # already has a transparent background
        alpha = im.getchannel('A')
    else:
        rgb = im.convert('RGB')
        w, h = rgb.size
        mask = Image.new('L', (w + 2, h + 2), 0)       # a 1 px frame so one flood reaches every edge
        work = Image.new('RGB', (w + 2, h + 2), rgb.getpixel((0, 0)))
        work.paste(rgb, (1, 1))
        ImageDraw.floodfill(work, (0, 0), (255, 0, 255), thresh=tol)
        r, g, b = work.split()
        hit = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), g.point(lambda v: 255 if v == 0 else 0)), b.point(lambda v: 255 if v == 255 else 0))
        alpha = ImageChops.invert(hit).crop((1, 1, w + 1, h + 1)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    im.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(box) if box else im


def sheet(name, items, cols, cell, cut=True):
    rows = -(-len(items) // cols)
    out = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
    cells = []
    for i, (title, path) in enumerate(items):
        c = cutout(path) if cut else Image.open(path).convert('RGBA')
        k = (cell - 8) / max(c.size)
        c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
        x, y = (i % cols) * cell + (cell - c.width) // 2, (i // cols) * cell + (cell - c.height)   # stands on the bottom of its cell
        out.alpha_composite(c, (x, y - 4 if c.height < cell - 4 else y))
        cells.append({'sheet': name, 'col': i % cols, 'row': i // cols, 'name': title, 'w': round(c.width / cell, 3), 'h': round(c.height / cell, 3)})
    ext = '.png' if cut else '.jpg'
    (out if cut else out.convert('RGB')).save(os.path.join(OUT, name + ext), optimize=True, **({} if cut else {'quality': 84}))
    return {'file': name + ext, 'cols': cols, 'rows': rows, 'cells': cells}


def main():
    args = sys.argv[1:]
    arg = lambda k: next((args[i + 1] for i, a in enumerate(args) if a == k), None)
    os.makedirs(OUT, exist_ok=True)
    manifest = json.load(open(os.path.join(OUT, 'store-atlas.json'))) if os.path.exists(os.path.join(OUT, 'store-atlas.json')) else {}
    html = open(os.path.join(REPO, 'store-survival.html'), encoding='utf-8').read()
    survival = [(alt, os.path.join(REPO, src)) for src, alt in re.findall(r'<img[^>]*src="(attached_assets/[^"]+)"[^>]*alt="([^"]*)"', html)]
    manifest['survival'] = sheet('store-survival', [s for s in survival if os.path.exists(s[1])], 8, 160, cut=False)
    if arg('--apparel'):
        d = arg('--apparel')
        manifest['apparel'] = sheet('store-apparel', [(t, os.path.join(d, f)) for t, f in json.load(open(os.path.join(d, 'list.json')))], 3, 384)
    manifest.pop('electronics', None)
    json.dump(manifest, open(os.path.join(OUT, 'store-atlas.json'), 'w'), indent=1)
    for k, v in manifest.items():
        print(k, len(v['cells']), 'cells', os.path.getsize(os.path.join(OUT, v['file'])), 'bytes')


if __name__ == '__main__':
    main()
