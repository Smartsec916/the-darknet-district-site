#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import time
import re

def scrape_hak5_product(url):
    """Scrape individual Hak5 product page"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract product name
        title_selectors = [
            'h1.product-title',
            'h1[data-testid="product-title"]',
            '.product-title',
            'h1',
            '.pdp-product-name'
        ]

        title = None
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                title = title_elem.get_text().strip()
                break

        # Extract product image
        img_selectors = [
            'img[data-testid="product-image"]',
            '.product-image img',
            '.product-gallery img',
            'img[src*="cdn.shopify.com"]',
            '.featured-image img'
        ]

        image_url = None
        for selector in img_selectors:
            img_elem = soup.select_one(selector)
            if img_elem:
                image_url = img_elem.get('src') or img_elem.get('data-src')
                if image_url and image_url.startswith('//'):
                    image_url = 'https:' + image_url
                elif image_url and not image_url.startswith('http'):
                    image_url = 'https://shop.hak5.org' + image_url
                break

        # Extract description
        desc_selectors = [
            '.product-description',
            '.product-details',
            '[data-testid="product-description"]',
            '.product-content p'
        ]

        description = None
        for selector in desc_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                description = desc_elem.get_text().strip()
                break

        # Clean up product name for alt text in case it's used later
        alt_text = re.sub(r'[^\w\s-]', '', title).strip() if title else "Product Image"

        return {
            'name': title, # Renamed from 'title' to 'name' for consistency with original script's output structure
            'image': image_url, # Renamed from 'image_url' to 'image'
            'url': url, # Renamed from 'product_url' to 'url'
            'description': description
        }

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def main():
    # Specific product URLs provided by the user
    product_urls = [
        'https://shop.hak5.org/products/wifi-pineapple',
        'https://shop.hak5.org/collections/homepage-collection-grid/products/wifi-pineapple-enterprise',
        'https://shop.hak5.org/collections/homepage-collection-grid/products/wifi-pineapple-pager',
        'https://shop.hak5.org/collections/homepage-collection-grid/products/usb-rubber-ducky',
        'https://shop.hak5.org/collections/homepage-collection-grid/products/bash-bunny'
    ]

    products = []

    for url in product_urls:
        print(f"Scraping: {url}")
        product = scrape_hak5_product(url)
        if product:
            products.append(product)
            print(f"Found: {product['name']}")

        # Be respectful with requests
        time.sleep(2)

    # Save to JSON file
    with open('hak5_products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2)

    print(f"\nScraped {len(products)} products")
    print("Product data saved to 'hak5_products.json'")

    # Print results
    print("\nFirst few products found:")
    for i, product in enumerate(products[:3]):
        print(f"{i+1}. {product['name']}")
        print(f"   URL: {product['url']}")
        print()


if __name__ == "__main__":
    main()