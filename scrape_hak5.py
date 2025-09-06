
import json, time, re
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

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

def get_description_from_html(url: str) -> str:
    """Scrape description from the product page HTML"""
    try:
        r = S.get(url, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Try multiple selectors for product description
        description_selectors = [
            '.product-single__description',
            '.product__description',
            '.rte',
            '[data-section-type="product"] .rte',
            '.product-description',
            '.product-content .rte'
        ]
        
        for selector in description_selectors:
            desc_element = soup.select_one(selector)
            if desc_element:
                # Get text and clean it up
                desc_text = desc_element.get_text(strip=True)
                # Take first sentence or up to 150 characters
                if '.' in desc_text:
                    first_sentence = desc_text.split('.')[0] + '.'
                    if len(first_sentence) <= 150:
                        return first_sentence
                return desc_text[:150] + '...' if len(desc_text) > 150 else desc_text
        
        # Fallback: try meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            desc = meta_desc.get('content').strip()
            return desc[:150] + '...' if len(desc) > 150 else desc
            
        return None
        
    except Exception as e:
        print(f"Error getting description for {url}: {e}")
        return None

def main():
    out = []
    for url in PRODUCTS:
        try:
            # Get JSON data for image
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
            
            # Get description from HTML page
            description = get_description_from_html(url)
            if not description:
                # Use JSON description as fallback
                description = product.get("body_html")
                if description:
                    # Clean HTML tags and truncate
                    soup = BeautifulSoup(description, 'html.parser')
                    desc_text = soup.get_text(strip=True)
                    description = desc_text[:150] + '...' if len(desc_text) > 150 else desc_text
            
            # Generate short fallback description if none found
            if not description:
                if "pineapple" in name.lower():
                    description = "Wireless auditing and penetration testing platform"
                elif "ducky" in name.lower():
                    description = "Keystroke injection attack platform"
                elif "bunny" in name.lower():
                    description = "Multi-function USB attack platform"
                elif "cable" in name.lower():
                    description = "Covert implant cable for security testing"
                elif "jack" in name.lower():
                    description = "Ethernet network attack tool"
                elif "croc" in name.lower():
                    description = "Keylogger for physical security testing"
                elif "plug" in name.lower():
                    description = "Wireless implant for network attacks"
                elif "adapter" in name.lower():
                    description = "Covert network adapter implant"
                elif "squirrel" in name.lower():
                    description = "Network packet analysis tool"
                elif "turtle" in name.lower():
                    description = "Covert network reconnaissance tool"
                elif "crab" in name.lower():
                    description = "HDMI/VGA display capture device"
                elif "detector" in name.lower():
                    description = "Hardware implant detection tool"
                elif "c2" in name.lower() or "command" in name.lower():
                    description = "Cloud-based command and control platform"
                elif "payload" in name.lower():
                    description = "Advanced payload development environment"
                else:
                    description = "Professional security testing tool"
            
            item = {"name": name, "url": url, "image": src, "description": description}
            print(f"Found: {name} -> {description[:50]}...")
            out.append(item)
            
        except Exception as e:
            print(f"Error on {url}: {e}")
        
        time.sleep(1)  # Be respectful to the server
    
    with open("hak5_products.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    
    print(f"\nScraped {len(out)} products with descriptions!")

if __name__ == "__main__":
    main()
