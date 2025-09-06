
import json, time, re
from urllib.parse import urlparse
import requests

PRODUCTS = [
    "https://shop.hak5.org/products/wifi-pineapple",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/wifi-pineapple-enterprise",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/wifi-pineapple-pager",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/usb-rubber-ducky",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/bash-bunny",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/omg-cable",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/shark-jack",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/key-croc",
    "https://shop.hak5.org/products/bug",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/omg-plug",
    "https://shop.hak5.org/collections/homepage-collection-grid/products/omg-adapter",
    "https://shop.hak5.org/products/omg-unblocker",
    "https://shop.hak5.org/products/packet-squirrel-mark-ii",
    "https://shop.hak5.org/products/screen-crab",
    "https://shop.hak5.org/products/lan-turtle",
    "https://shop.hak5.org/collections/mischief-gadgets/products/o-mg-field-kit",
    "https://shop.hak5.org/products/malicious-cable-detector-by-o-mg",
    "https://shop.hak5.org/products/glytch-crash-kit",
    "https://shop.hak5.org/products/c2",
    "https://shop.hak5.org/products/payload-studio-pro",
]

S = requests.Session()
S.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; Hak5Scraper/1.0)",
    "Accept": "application/json,text/html,*/*"
})

def to_product_json_url(url: str) -> str:
    path = urlparse(url).path
    m = re.search(r"/products/([^/?#]+)", path)
    handle = m.group(1) if m else None
    if not handle:
        raise ValueError(f"Couldn't extract product handle from {url}")
    return f"https://shop.hak5.org/products/{handle}.json"

def main():
    out = []
    for url in PRODUCTS:
        try:
            pj = to_product_json_url(url)
            r = S.get(pj, timeout=15)
            r.raise_for_status()
            data = r.json()
            product = data.get("product", {})
            name = product.get("title") or "Unknown"
            images = product.get("images") or []
            src = images[0]["src"] if images else None
            if src and src.startswith("//"):
                src = "https:" + src
            item = {"name": name, "url": url, "image": src, "description": None}
            print(f"Found: {name} -> {src or 'NO IMAGE'}")
            out.append(item)
        except Exception as e:
            print(f"Error on {url}: {e}")
        time.sleep(0.6)
    with open("hak5_products.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
