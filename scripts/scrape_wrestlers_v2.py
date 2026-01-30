"""
HotTag - Wrestler Scraper v2
Searches for wrestlers by name to get correct IDs

Usage:
    python scrape_wrestlers_v2.py
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import argparse

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

# Wrestlers to search for
WRESTLER_NAMES = [
    # AEW
    'Jon Moxley',
    'MJF',
    'Will Ospreay',
    'Kenny Omega',
    'Chris Jericho',
    'Orange Cassidy',
    'Swerve Strickland',
    'Adam Page',
    'Darby Allin',
    'Samoa Joe',
    'Daniel Garcia',
    'Konosuke Takeshita',
    'Bryan Danielson',
    'Claudio Castagnoli',
    'Wheeler Yuta',
    'Malakai Black',
    'Buddy Matthews',
    'Brody King',
    'Christian Cage',
    
    # NJPW
    'Kazuchika Okada',
    'Tetsuya Naito',
    'Hiroshi Tanahashi',
    'Jay White',
    'Zack Sabre Jr',
    'Shingo Takagi',
    'EVIL',
    'SANADA',
    'Hiromu Takahashi',
    'El Desperado',
    'Tomohiro Ishii',
    'Minoru Suzuki',
    'Great-O-Khan',
    'Jeff Cobb',
    'David Finlay',
    
    # GCW / Indie
    'Nick Gage',
    'Matt Cardona',
    'Effy',
    'Mance Warner',
    'Alex Colon',
    'Joey Janela',
    'Blake Christian',
    'Jordan Oliver',
    'Tony Deppen',
    'Cole Radrick',
    'Gringo Loco',
    'Jimmy Lloyd',
    'Lio Rush',
    'Mike Bailey',
    'Bandido',
    'Laredo Kid',
    'Vikingo',
    'Komander',
    
    # Impact / Other
    'Josh Alexander',
    'Trey Miguel',
    'Moose',
    'Eddie Edwards',
    'Matt Hardy',
    'Jeff Hardy',
    
    # Legends / Part-timers
    'CM Punk',
    'Edge',
    'Sting',
]


def search_wrestler(name):
    """Search for a wrestler by name and return their info"""
    search_url = f"{BASE_URL}/?id=2&view=workers&search={requests.utils.quote(name)}"
    
    try:
        time.sleep(1)
        response = requests.get(search_url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('div', class_='TableContents')
        
        if not table:
            return None
        
        rows = table.find_all('tr')
        if len(rows) <= 1:
            return None
        
        # Get first result (usually most relevant)
        first_row = rows[1]
        link = first_row.find('a', href=lambda h: h and 'id=2' in h and 'nr=' in h)
        
        if not link:
            return None
        
        href = link.get('href', '')
        match = re.search(r'nr=(\d+)', href)
        if not match:
            return None
        
        cagematch_id = int(match.group(1))
        found_name = link.get_text(strip=True)
        
        return {
            'search_name': name,
            'found_name': found_name,
            'cagematch_id': cagematch_id,
        }
        
    except Exception as e:
        print(f"  Error searching for {name}: {e}")
        return None


def scrape_wrestler_profile(cagematch_id):
    """Scrape full profile for a wrestler"""
    url = f"{BASE_URL}/?id=2&nr={cagematch_id}"
    
    try:
        time.sleep(0.5)
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        wrestler = {
            'cagematch_id': cagematch_id,
            'cagematch_url': url,
        }
        
        # Get name
        header = soup.find('h1', class_='TextHeader')
        if header:
            wrestler['name'] = header.get_text(strip=True)
        
        # Get photo
        img = soup.find('img', class_='WorkerPicture')
        if img:
            src = img.get('src', '')
            if src:
                wrestler['photo_url'] = BASE_URL + src if src.startswith('/') else src
        
        # Parse info box
        info_box = soup.find('div', class_='InformationBoxTable')
        if info_box:
            rows = info_box.find_all('div', class_='InformationBoxRow')
            for row in rows:
                title_div = row.find('div', class_='InformationBoxTitle')
                content_div = row.find('div', class_='InformationBoxContents')
                
                if not title_div or not content_div:
                    continue
                
                title = title_div.get_text(strip=True).lower()
                content = content_div.get_text(strip=True)
                
                if 'billed from' in title or 'hometown' in title:
                    wrestler['hometown'] = content
                elif 'billed height' in title:
                    wrestler['height'] = content
                elif 'billed weight' in title:
                    wrestler['weight'] = content
                elif 'twitter' in title or 'x.com' in title:
                    link = content_div.find('a')
                    if link:
                        href = link.get('href', '')
                        handle = href.rstrip('/').split('/')[-1]
                        if handle and handle != 'twitter.com':
                            wrestler['twitter_handle'] = handle
        
        return wrestler
        
    except Exception as e:
        print(f"  Error scraping profile {cagematch_id}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description='Scrape wrestlers by name')
    parser.add_argument('--output', default='wrestlers.json', help='Output file')
    parser.add_argument('--limit', type=int, default=None, help='Limit number')
    args = parser.parse_args()
    
    names = WRESTLER_NAMES[:args.limit] if args.limit else WRESTLER_NAMES
    
    print(f"Searching for {len(names)} wrestlers...\n")
    
    wrestlers = []
    found = 0
    not_found = 0
    
    for name in names:
        print(f"Searching: {name}...", end=" ")
        
        # Search for wrestler
        result = search_wrestler(name)
        
        if not result:
            print("✗ Not found")
            not_found += 1
            continue
        
        print(f"Found: {result['found_name']} (ID: {result['cagematch_id']})")
        
        # Get full profile
        profile = scrape_wrestler_profile(result['cagematch_id'])
        
        if profile:
            wrestlers.append(profile)
            found += 1
        else:
            not_found += 1
    
    # Save to JSON
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(wrestlers, f, indent=2, ensure_ascii=False)
    
    # Summary
    print(f"\n{'='*50}")
    print("SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total searched: {len(names)}")
    print(f"Found & scraped: {found}")
    print(f"Not found: {not_found}")
    print(f"Saved to: {args.output}")
    
    if wrestlers:
        print(f"\nSample wrestlers:")
        for w in wrestlers[:10]:
            hometown = w.get('hometown', 'Unknown')
            print(f"  - {w.get('name')} ({hometown})")


if __name__ == '__main__':
    main()
