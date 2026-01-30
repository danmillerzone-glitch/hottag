"""
HotTag - Download Promotion Logos from Cagematch (v2)
Uses direct URL pattern: /site/main/img/ligen/normal/{id}.gif

Usage:
    python download_logos_v2.py
"""

import requests
import os
import time
import re
import json

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

# Promotion name -> Cagematch ID mapping
PROMOTIONS = {
    'WWE': 1,
    'AEW': 87,
    'GCW': 3927,
    'PWG': 4619,
    'Beyond_Wrestling': 8370,
    'Reality_of_Wrestling': 8656,
    'DEFY_Wrestling': 8518,
    'West_Coast_Pro': 8809,
    'Prestige_Wrestling': 8868,
    'Black_Label_Pro': 8478,
    'ACTION_Wrestling': 8442,
    'Freelance_Wrestling': 4989,
    'Shimmer': 2889,
    'Wrestling_Revolver': 8473,
    'ICW_No_Holds_Barred': 8719,
    'Warrior_Wrestling': 8684,
    'Mission_Pro': 8912,
    'New_Texas_Pro': 8869,
    'Terminus': 8895,
    'Glory_Pro': 8371,
    'Limitless_Wrestling': 8236,
    'Enjoy_Wrestling': 8677,
    'St_Louis_Anarchy': 8495,
    'House_of_Glory': 2936,
    'CMLL': 29,
    'AAW': 332,
    'AIW': 357,
    'Metroplex_Wrestling': 8701,
    'Future_Stars_of_Wrestling': 4026,
    'NJPW': 7,
    'Impact_Wrestling': 5,
    'MLW': 4478,
    'ROH': 3,
    'NWA': 2,
    'Atomic_Legacy_Wrestling': 10901,
    'Crimson_Crown_Wrestling': 11519,
    'Epic_Pro_Wrestling': 8827,
    'Higher_Ground_Wrestling': 11186,
    'Coastal_Championship_Wrestling': 9147,
    'Virginia_Championship_Wrestling': 8915,
    'Green_Mountain_Wrestling': 10679,
    'Pro_Wrestling_Alliance': 8909,
}


def download_logo(name, cagematch_id, logos_dir):
    """Download logo using direct URL pattern"""
    
    # Try different extensions
    extensions = ['.gif', '.png', '.jpg']
    
    for ext in extensions:
        url = f"{BASE_URL}/site/main/img/ligen/normal/{cagematch_id}{ext}"
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=15)
            
            if response.status_code == 200 and len(response.content) > 100:
                filename = f"{name}{ext}"
                filepath = os.path.join(logos_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                return filename, url
                
        except Exception as e:
            continue
    
    return None, None


def main():
    # Create logos directory
    logos_dir = 'logos'
    os.makedirs(logos_dir, exist_ok=True)
    
    print(f"Downloading logos to '{logos_dir}/' directory...\n")
    
    results = {}
    successful = 0
    failed = 0
    
    for name, cagematch_id in PROMOTIONS.items():
        print(f"Fetching {name} (ID: {cagematch_id})...", end=" ")
        
        time.sleep(0.5)  # Be nice to the server
        
        filename, url = download_logo(name, cagematch_id, logos_dir)
        
        if filename:
            print(f"✓ {filename}")
            results[name] = {
                'cagematch_id': cagematch_id,
                'source_url': url,
                'local_file': filename
            }
            successful += 1
        else:
            print("✗ Not found")
            results[name] = {
                'cagematch_id': cagematch_id,
                'local_file': None,
                'error': 'Not found'
            }
            failed += 1
    
    # Save manifest
    manifest_path = os.path.join(logos_dir, 'logo_manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'='*50}")
    print(f"Total promotions: {len(PROMOTIONS)}")
    print(f"Logos downloaded: {successful}")
    print(f"Failed: {failed}")
    print(f"\nLogos saved to: {os.path.abspath(logos_dir)}/")
    print(f"\nSuccessfully downloaded:")
    for name, data in results.items():
        if data.get('local_file'):
            print(f"  - {data['local_file']}")


if __name__ == '__main__':
    main()
