
#!/usr/bin/env python3
import os
import re
import glob

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
                    
                # Find all references to attached_assets
                matches = re.findall(r'attached_assets/([^"\'\s\)]+)', content)
                for match in matches:
                    # Clean up any URL encoding
                    asset_name = match.replace('%20', ' ').replace('%2B', '+')
                    used_assets.add(asset_name)
                    
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
    print(f"Found {len(unused_assets)} unused assets")
    
    if unused_assets:
        print("\nUnused assets:")
        for asset in sorted(unused_assets):
            print(f"  - {asset}")
        
        response = input(f"\nDelete {len(unused_assets)} unused assets? (y/N): ")
        if response.lower() == 'y':
            deleted_count = 0
            for asset in unused_assets:
                asset_path = os.path.join("attached_assets", asset)
                try:
                    os.remove(asset_path)
                    print(f"Deleted: {asset}")
                    deleted_count += 1
                except Exception as e:
                    print(f"Error deleting {asset}: {e}")
            
            print(f"\nDeleted {deleted_count} unused assets")
        else:
            print("No assets deleted")
    else:
        print("\nNo unused assets found!")

if __name__ == "__main__":
    main()
