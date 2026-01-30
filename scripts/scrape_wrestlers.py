"""
HotTag - Wrestler Scraper for Cagematch
Scrapes wrestler profiles and saves to JSON

Usage:
    python scrape_wrestlers.py
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

# Popular indie wrestlers to scrape (name -> cagematch_id)
# You can add more wrestlers here
WRESTLERS = {
    'Jon Moxley': 3940,
    'MJF': 16628,
    'Will Ospreay': 13761,
    'Kenny Omega': 8446,
    'Chris Jericho': 429,
    'Orange Cassidy': 12997,
    'Swerve Strickland': 15057,
    'Hangman Adam Page': 14433,
    'Darby Allin': 18963,
    'Samoa Joe': 1495,
    'Nick Wayne': 25709,
    'Daniel Garcia': 22188,
    'Konosuke Takeshita': 16249,
    'Kazuchika Okada': 8723,
    'Tetsuya Naito': 3593,
    'Hiroshi Tanahashi': 3247,
    'Jay White': 16198,
    'Zack Sabre Jr': 6108,
    'KUSHIDA': 9042,
    'Bandido': 18052,
    'Nick Gage': 2088,
    'Matt Cardona': 10577,
    'Effy': 14601,
    'Mance Warner': 17930,
    'Alex Colon': 12094,
    'Jordan Oliver': 20313,
    'Blake Christian': 18645,
    'Gringo Loco': 11847,
    'Jimmy Lloyd': 17029,
    'Tony Deppen': 16339,
    'Cole Radrick': 23916,
    'Jack Cartwheel': 24681,
    'Joey Janela': 13579,
    'Lio Rush': 14986,
    'Mike Bailey': 9540,
    'Josh Alexander': 13154,
    'Trey Miguel': 17215,
    'Laredo Kid': 5815,
    'Psycho Clown': 10400,
    'LA Park': 1089,
    'Rush': 9833,
    'Dragon Lee': 11469,
    'Mascara Dorada': 9082,
    'Vikingo': 19426,
    'Komander': 24178,
    'Matt Riddle': 12612,
    'Wheeler Yuta': 20314,
    'Claudio Castagnoli': 1013,
    'Bryan Danielson': 11,
    'CM Punk': 203,
    'Edge': 414,
    'Christian Cage': 415,
    'Malakai Black': 9893,
    'Buddy Matthews': 10970,
    'Brody King': 12413,
    'Juice Robinson': 13001,
    'Jeff Cobb': 9028,
    'Tomohiro Ishii': 1497,
    'Minoru Suzuki': 737,
    'EVIL': 11266,
    'SANADA': 11088,
    'Shingo Takagi': 5691,
    'El Desperado': 9934,
    'Hiromu Takahashi': 14001,
    'El Phantasmo': 14619,
    'Gabe Kidd': 16933,
    'David Finlay': 11909,
    'Great O-Khan': 19605,
    'JONAH': 11426,
}


def scrape_wrestler(cagematch_id):
    """Scrape a wrestler's profile from Cagematch"""
    url = f"{BASE_URL}/?id=2&nr={cagematch_id}"
    
    try:
        time.sleep(1)
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        wrestler = {
            'cagematch_id': cagematch_id,
            'cagematch_url': url,
        }
        
        # Get name from header
        header = soup.find('h1', class_='TextHeader')
        if header:
            wrestler['name'] = header.get_text(strip=True)
        
        # Get photo
        img = soup.find('img', class_='WorkerPicture')
        if img:
            src = img.get('src', '')
            if src:
                wrestler['photo_url'] = BASE_URL + src if src.startswith('/') else src
        
        # Parse information box (uses divs, not table)
        info_box = soup.find('div', class_='InformationBoxTable')
        if info_box:
            rows = info_box.find_all('div', class_='InformationBoxRow')
            for row in rows:
                title_div = row.find('div', class_='InformationBoxTitle')
                content_div = row.find('div', class_='InformationBoxContents')
                
                if not title_div or not content_div:
                    continue
                
                title = title_div.get_text(strip=True).lower().rstrip(':')
                content = content_div.get_text(strip=True)
                
                if 'gimmick' in title:
                    wrestler['ring_name'] = content
                elif 'age' in title:
                    wrestler['age'] = content
                elif 'birth' in title:
                    wrestler['birthplace'] = content
                elif 'billed' in title and 'height' in title:
                    wrestler['height'] = content
                elif 'billed' in title and 'weight' in title:
                    wrestler['weight'] = content
                elif 'billed from' in title or 'hometown' in title:
                    wrestler['hometown'] = content
                elif 'beginning' in title:
                    wrestler['career_start'] = content
                elif 'twitter' in title:
                    link = content_div.find('a')
                    if link:
                        href = link.get('href', '')
                        handle = href.split('/')[-1]
                        wrestler['twitter_handle'] = handle
                elif 'promotion' in title:
                    wrestler['current_promotion'] = content
        
        return wrestler
        
    except Exception as e:
        print(f"  Error scraping {cagematch_id}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description='Scrape wrestler profiles')
    parser.add_argument('--output', default='wrestlers.json', help='Output file')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of wrestlers')
    args = parser.parse_args()
    
    wrestlers_to_scrape = list(WRESTLERS.items())
    if args.limit:
        wrestlers_to_scrape = wrestlers_to_scrape[:args.limit]
    
    print(f"Scraping {len(wrestlers_to_scrape)} wrestlers...\n")
    
    wrestlers = []
    
    for name, cagematch_id in wrestlers_to_scrape:
        print(f"Scraping {name}...", end=" ")
        
        wrestler = scrape_wrestler(cagematch_id)
        
        if wrestler and wrestler.get('name'):
            wrestlers.append(wrestler)
            print(f"✓ {wrestler.get('name')}")
        else:
            print("✗ Failed")
    
    # Save to JSON
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(wrestlers, f, indent=2, ensure_ascii=False)
    
    # Summary
    print(f"\n{'='*50}")
    print("SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total attempted: {len(wrestlers_to_scrape)}")
    print(f"Successfully scraped: {len(wrestlers)}")
    print(f"Saved to: {args.output}")
    
    # Show sample
    if wrestlers:
        print(f"\nSample wrestlers:")
        for w in wrestlers[:5]:
            print(f"  - {w.get('name')} ({w.get('hometown', 'Unknown')})")


if __name__ == '__main__':
    main()
