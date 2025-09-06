
#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import re

def scrape_hak5_products():
    """Scrape products from Hak5 shop and return formatted data"""
    
    url = "https://shop.hak5.org/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        products = []
        
        # Look for product containers (adjust selectors based on actual HTML structure)
        product_containers = soup.find_all(['div', 'article'], class_=re.compile(r'product|item'))
        
        if not product_containers:
            # Try alternative selectors
            product_containers = soup.find_all('a', href=re.compile(r'/products/'))
        
        for container in product_containers:
            try:
                # Extract product name
                name_elem = container.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name|product'))
                if not name_elem:
                    name_elem = container.find(['h1', 'h2', 'h3', 'h4'])
                
                name = name_elem.get_text(strip=True) if name_elem else "Unknown Product"
                
                # Extract product image
                img_elem = container.find('img')
                image_url = ""
                if img_elem:
                    image_url = img_elem.get('src') or img_elem.get('data-src') or ""
                    if image_url and not image_url.startswith('http'):
                        image_url = f"https://shop.hak5.org{image_url}"
                
                # Extract product link
                link_elem = container if container.name == 'a' else container.find('a')
                product_url = ""
                if link_elem:
                    href = link_elem.get('href', '')
                    if href and not href.startswith('http'):
                        product_url = f"https://shop.hak5.org{href}"
                    else:
                        product_url = href
                
                # Extract description (if available)
                desc_elem = container.find(['p', 'div'], class_=re.compile(r'description|summary'))
                description = desc_elem.get_text(strip=True)[:200] if desc_elem else ""
                
                # Only add if we have essential information
                if name and name != "Unknown Product" and product_url:
                    products.append({
                        'name': name,
                        'image': image_url,
                        'url': product_url,
                        'description': description
                    })
                    
            except Exception as e:
                print(f"Error processing product container: {e}")
                continue
        
        return products
        
    except requests.RequestException as e:
        print(f"Error fetching website: {e}")
        return []

def generate_product_cards_html(products):
    """Generate HTML for product cards"""
    
    cards_html = []
    
    for product in products:
        # Clean up product name for alt text
        alt_text = re.sub(r'[^\w\s-]', '', product['name']).strip()
        
        card_html = f'''      <!-- {product['name']} product card -->
      <div class="product-card">
        <h3>{product['name']}</h3>
        <img src="{product['image']}" alt="{alt_text}" style="max-width: 300px;">
        <p>
          {product['description'] if product['description'] else f"High-quality {product['name']} from Hak5. Professional-grade security and penetration testing equipment."}
          <br><br>
          The "Buy Now" button will take you to the Hak5 website.
        </p>
        <a href="{product['url']}" target="_blank" class="buy-button">Buy Now</a>
      </div>'''
        
        cards_html.append(card_html)
    
    return '\n\n'.join(cards_html)

def main():
    print("Scraping Hak5 products...")
    products = scrape_hak5_products()
    
    if products:
        print(f"Found {len(products)} products")
        
        # Generate HTML
        cards_html = generate_product_cards_html(products)
        
        # Save to file
        with open('hak5_product_cards.html', 'w', encoding='utf-8') as f:
            f.write(cards_html)
        
        # Also save raw data as JSON for inspection
        with open('hak5_products.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2)
        
        print("Product cards generated and saved to 'hak5_product_cards.html'")
        print("Raw product data saved to 'hak5_products.json'")
        print("\nFirst few products found:")
        for i, product in enumerate(products[:3]):
            print(f"{i+1}. {product['name']}")
            print(f"   URL: {product['url']}")
            print()
            
    else:
        print("No products found. The website structure may have changed.")
        print("You may need to manually copy product information.")

if __name__ == "__main__":
    main()
