
#!/usr/bin/env python3
import os
import re
import glob
import urllib.parse

def find_used_assets():
    """Find all assets referenced in code files"""
    used_assets = set()
    
    # File types to search
    file_patterns = ['*.html', '*.js', '*.css', '*.py']
    
    for pattern in file_patterns:
        for filepath in glob.glob(f"**/{pattern}", recursive=True):
            if 'attached_assets' in filepath:
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # Find all references to attached_assets with various patterns
                patterns = [
                    r'attached_assets/([^"\'\s\)\>\,\;]+)',  # Basic pattern
                    r'"attached_assets/([^"]+)"',         # Quoted patterns
                    r"'attached_assets/([^']+)'",         # Single quoted
                    r'src="attached_assets/([^"]+)"',     # Image src
                    r"src='attached_assets/([^']+)'",     # Image src single quote
                    r'image:\s*"attached_assets/([^"]+)"', # CSS/JS image references
                    r'href="attached_assets/([^"]+)"',     # Links
                    r"href='attached_assets/([^']+)'",     # Links single quote
                ]
                
                for pattern_regex in patterns:
                    matches = re.findall(pattern_regex, content)
                    for match in matches:
                        if isinstance(match, tuple):
                            match = match[0]
                        # Clean up any URL encoding
                        asset_name = urllib.parse.unquote(match)
                        used_assets.add(asset_name)
                        # Also add the URL encoded version
                        used_assets.add(match)
                
                # Also look for partial filename matches that might be referenced
                all_assets = get_all_assets()
                for asset in all_assets:
                    # Check if the asset filename (without extension) appears in content
                    base_name = os.path.splitext(asset)[0]
                    # Remove timestamp suffixes like "_1749345883376"
                    clean_base_name = re.sub(r'_\d+$', '', base_name)
                    
                    if (base_name.lower() in content.lower() or 
                        clean_base_name.lower() in content.lower() or
                        asset.lower() in content.lower()):
                        used_assets.add(asset)
                        
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    return used_assets

def get_all_assets():
    """Get list of all assets in attached_assets folder"""
    assets_dir = "attached_assets"
    if not os.path.exists(assets_dir):
        return set()
    
    all_assets = set()
    for filename in os.listdir(assets_dir):
        if os.path.isfile(os.path.join(assets_dir, filename)):
            all_assets.add(filename)
    
    return all_assets

def main():
    print("Scanning for used assets...")
    used_assets = find_used_assets()
    
    print("Getting all assets...")
    all_assets = get_all_assets()
    
    unused_assets = all_assets - used_assets
    
    print(f"\nFound {len(all_assets)} total assets")
    print(f"Found {len(used_assets)} used assets")
    print(f"Found {len(unused_assets)} potentially unused assets")
    
    if used_assets:
        print("\nUsed assets:")
        for asset in sorted(used_assets):
            print(f"  ✓ {asset}")
    
    if unused_assets:
        print("\nPotentially unused assets:")
        for asset in sorted(unused_assets):
            print(f"  ? {asset}")
        
        print("\n⚠️  WARNING: This script may not detect all asset references.")
        print("   Review the list carefully before deleting anything.")
        print("   Consider manually checking if these assets are actually unused.")
        
        response = input(f"\nDelete {len(unused_assets)} potentially unused assets? (y/N): ")
        if response.lower() == 'y':
            print("\nAre you absolutely sure? This cannot be undone! (type 'DELETE' to confirm)")
            confirm = input("Confirmation: ")
            if confirm == 'DELETE':
                deleted_count = 0
                for asset in unused_assets:
                    asset_path = os.path.join("attached_assets", asset)
                    try:
                        os.remove(asset_path)
                        print(f"Deleted: {asset}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"Error deleting {asset}: {e}")
                
                print(f"\nDeleted {deleted_count} assets")
            else:
                print("Deletion cancelled - confirmation not received")
        else:
            print("No assets deleted")
    else:
        print("\nNo potentially unused assets found!")

if __name__ == "__main__":
    main()
