
#!/usr/bin/env python3
import os
import re
import glob

def remove_timestamp_suffixes():
    """Remove timestamp suffixes from all asset files"""
    
    # Directories to process
    directories = ["attached_assets", "blackout-protocol/assets"]
    
    for directory in directories:
        if not os.path.exists(directory):
            print(f"Directory {directory} not found, skipping...")
            continue
            
        print(f"\nProcessing {directory}...")
        renamed_count = 0
        
        for filename in os.listdir(directory):
            # Skip directories
            if os.path.isdir(os.path.join(directory, filename)):
                continue
                
            # Match timestamp patterns like "_1754770039353" at the end of filename
            new_name = re.sub(r'_\d{13}', '', filename)
            
            # Also handle other timestamp patterns
            new_name = re.sub(r'_\d{10,15}', '', new_name)
            
            if new_name != filename:
                old_path = os.path.join(directory, filename)
                new_path = os.path.join(directory, new_name)
                
                # Only rename if target doesn't already exist
                if not os.path.exists(new_path):
                    try:
                        os.rename(old_path, new_path)
                        print(f"Renamed: {filename} -> {new_name}")
                        renamed_count += 1
                    except Exception as e:
                        print(f"Error renaming {filename}: {e}")
                else:
                    print(f"Skipped {filename} (target already exists)")
        
        print(f"Renamed {renamed_count} files in {directory}")

if __name__ == "__main__":
    remove_timestamp_suffixes()
