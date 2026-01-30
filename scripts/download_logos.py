"""
HotTag - Download Promotion Logos from Cagematch
Downloads logos and saves them locally with promotion names

Usage:
    python download_logos.py
"""

import requests
from bs4 import BeautifulSoup
import os
import time
import re
import json

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

# Promotion name -> Cagematch ID mapping
# You can find these by searching on cagematch.net
PROMOTIONS = {
    'WWE': 1,
    'AEW': 87,
    'GCW': 3927,
    'PWG': 4619,
    'ROH': 28,
    'Beyond Wrestling': 8370,
    'Reality of Wrestling': 8656,
    'DEFY Wrestling': 8518,
    'West Coast Pro': 8809,
    'Prestige Wrestling': 8868,
    'Black Label Pro': 8478,
    'ACTION Wrestling': 8442,
    'Freelance Wrestling': 4989,
    'Shimmer': 2889,
    'Wrestling Revolver': 8473,
    'ICW No Holds Barred': 8719,
    'Warrior Wrestling': 8684,
    'Mission Pro': 8912,
    'New Texas Pro': 8869,
    'Terminus': 8895,
    'Glory Pro': 8371,
    'Limitless Wrestling': 8236,
    'Enjoy Wrestling': 8677,
    'St Louis Anarchy': 8495,
    'House of Glory': 2936,
    'CMLL': 28,
    'AAW': 332,
    'AIW': 357,
    'Metroplex Wrestling': 8701,
    'Future Stars of Wrestling': 4026,
    'CCW Florida': 8927,
    'NJPW': 7,
    'Impact Wrestling': 5,
    'MLW': 4478,
}


def get_logo_url(cagematch_id):
    """Fetch the logo URL from a promotion's Cagematch page"""
    url = f"{BASE_URL}/?id=8&nr={cagematch_id}"
    
    try:
        time.sleep(1)
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for the promotion logo image
        logo_img = soup.find('img', class_='ImagePromotionLogo')
        if logo_img:
            src = logo_img.get('src')
            if src:
                return BASE_URL + src if src.startswith('/') else src
        
        # Alternative: look in the header area
        header = soup.find('div', class_='HeaderBox')
        if header:
            img = header.find('img')
            if img:
                src = img.get('src')
                if src and 'ligen' in src:
                    return BASE_URL + src if src.startswith('/') else src
        
        return None
        
    except Exception as e:
        print(f"  Error fetching {cagematch_id}: {e}")
        return None


def download_image(url, filepath):
    """Download an image to a local file"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"  Error downloading {url}: {e}")
        return False


def sanitize_filename(name):
    """Convert promotion name to safe filename"""
    # Remove special characters, replace spaces with underscores
    safe = re.sub(r'[^\w\s-]', '', name)
    safe = re.sub(r'\s+', '_', safe)
    return safe.lower()


def main():
    # Create logos directory
    logos_dir = 'logos'
    os.makedirs(logos_dir, exist_ok=True)
    
    print(f"Downloading logos to '{logos_dir}/' directory...\n")
    
    results = {}
    
    for name, cagematch_id in PROMOTIONS.items():
        print(f"Fetching {name} (ID: {cagematch_id})...")
        
        logo_url = get_logo_url(cagematch_id)
        
        if logo_url:
            # Determine file extension
            ext = '.png'
            if '.gif' in logo_url.lower():
                ext = '.gif'
            elif '.jpg' in logo_url.lower() or '.jpeg' in logo_url.lower():
                ext = '.jpg'
            
            filename = sanitize_filename(name) + ext
            filepath = os.path.join(logos_dir, filename)
            
            if download_image(logo_url, filepath):
                print(f"  ✓ Saved: {filename}")
                results[name] = {
                    'cagematch_id': cagematch_id,
                    'logo_url': logo_url,
                    'local_file': filename
                }
            else:
                print(f"  ✗ Failed to download")
                results[name] = {
                    'cagematch_id': cagematch_id,
                    'logo_url': logo_url,
                    'local_file': None,
                    'error': 'Download failed'
                }
        else:
            print(f"  ✗ No logo found")
            results[name] = {
                'cagematch_id': cagematch_id,
                'logo_url': None,
                'local_file': None,
                'error': 'No logo found'
            }
    
    # Save results to JSON
    with open(os.path.join(logos_dir, 'logo_manifest.json'), 'w') as f:
        json.dump(results, f, indent=2)
    
    # Summary
    successful = sum(1 for r in results.values() if r.get('local_file'))
    print(f"\n{'='*50}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'='*50}")
    print(f"Total promotions: {len(PROMOTIONS)}")
    print(f"Logos downloaded: {successful}")
    print(f"Failed: {len(PROMOTIONS) - successful}")
    print(f"\nLogos saved to: {os.path.abspath(logos_dir)}/")
    print(f"Manifest saved to: {os.path.abspath(logos_dir)}/logo_manifest.json")


if __name__ == '__main__':
    main()
