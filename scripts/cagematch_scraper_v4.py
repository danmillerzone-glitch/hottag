"""
HotTag - Cagematch Full Event Scraper v4
Uses advanced search to get ALL upcoming USA events

Usage:
    python cagematch_scraper_v4.py --days 120
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import argparse
from urllib.parse import urljoin, urlparse, parse_qs
import logging
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
             'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
             'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
             'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
             'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']


def parse_date(date_str):
    """Parse DD.MM.YYYY format"""
    try:
        dt = datetime.strptime(date_str.strip(), "%d.%m.%Y")
        return dt.strftime("%Y-%m-%d")
    except:
        return None


def is_usa_location(location_str):
    """Check if location is in USA"""
    if not location_str:
        return False
    
    # Check for USA explicitly
    if 'USA' in location_str:
        return True
    
    # Check for state abbreviations at end
    parts = [p.strip() for p in location_str.split(',')]
    for part in parts:
        # Check if it's a state abbreviation
        words = part.strip().split()
        for word in words:
            if word.upper() in US_STATES:
                return True
    
    # Explicit non-USA countries
    non_usa = ['Canada', 'Mexico', 'Japan', 'UK', 'England', 'Germany', 'Deutschland',
               'France', 'Australia', 'Saudi-Arabia', 'Saudi Arabia', 'Puerto Rico',
               'Scotland', 'Ireland', 'Wales', 'Italy', 'Spain', 'Austria', 'Switzerland',
               'Netherlands', 'Belgium', 'Poland', 'Czech', 'Sweden', 'Norway', 'Finland',
               'Denmark', 'Brazil', 'Argentina', 'Chile', 'India', 'China', 'Korea',
               'Philippines', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Vietnam',
               'New Zealand', 'South Africa', 'Russia', 'Ukraine', 'Turkey', 'Greece',
               'Portugal', 'Romania', 'Hungary', 'Bulgaria', 'Croatia', 'Serbia']
    
    location_lower = location_str.lower()
    for country in non_usa:
        if country.lower() in location_lower:
            return False
    
    return False


def parse_us_location(location_str):
    """Parse US location into city, state"""
    result = {'city': None, 'state': None, 'country': 'USA'}
    
    if not location_str:
        return result
    
    parts = [p.strip() for p in location_str.split(',')]
    
    # City is always first part
    if len(parts) >= 1:
        result['city'] = parts[0]
    
    # State can be in various positions
    # Common formats:
    # "Las Vegas, Nevada, USA"
    # "Philadelphia, Pennsylvania, USA" 
    # "Nashville, TN"
    # "New York City, New York, USA"
    
    # State name to abbreviation mapping
    STATE_NAMES = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
        'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
        'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
        'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
        'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
        'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
        'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
        'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
        'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
        'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
        'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
    }
    
    if len(parts) >= 2:
        for part in parts[1:]:
            part_clean = part.strip()
            part_lower = part_clean.lower()
            
            # Check if it's a full state name
            if part_lower in STATE_NAMES:
                result['state'] = STATE_NAMES[part_lower]
                break
            
            # Check if it's an abbreviation
            if part_clean.upper() in US_STATES:
                result['state'] = part_clean.upper()
                break
            
            # Check words within the part
            words = part_clean.split()
            for word in words:
                if word.upper() in US_STATES:
                    result['state'] = word.upper()
                    break
            
            if result['state']:
                break
    
    return result


def extract_id(url):
    """Extract nr= from URL"""
    if not url:
        return None
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    if 'nr' in params:
        try:
            return int(params['nr'][0])
        except:
            pass
    return None


def scrape_all_upcoming_events(max_days=120):
    """Scrape ALL upcoming events using the cards view with pagination"""
    session = requests.Session()
    session.headers.update(HEADERS)
    
    events = []
    seen_ids = set()
    
    today = datetime.now()
    cutoff_date = today + timedelta(days=max_days)
    
    # Cagematch shows 100 events per page
    # We need to paginate through s=0, s=100, s=200, etc.
    offset = 0
    max_offset = 2000  # Safety limit - enough for ~2000 events
    
    while offset < max_offset:
        # Use the cards view with offset
        url = f"{BASE_URL}/?id=1&view=cards&s={offset}"
        
        logger.info(f"Fetching events starting at offset {offset}...")
        
        try:
            time.sleep(1.5)
            response = session.get(url, timeout=30)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Request failed: {e}")
            break
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the table
        table = soup.find('div', class_='TableContents')
        if not table:
            logger.info("No table found")
            break
        
        rows = table.find_all('tr')
        
        if len(rows) <= 1:
            logger.info("No more events found")
            break
        
        found_this_page = 0
        past_cutoff_count = 0
        
        for row in rows[1:]:  # Skip header row
            cells = row.find_all('td')
            if len(cells) < 4:
                continue
            
            try:
                # Cell 1: Date (DD.MM.YYYY)
                date_str = cells[1].get_text(strip=True)
                event_date = parse_date(date_str)
                
                if not event_date:
                    continue
                
                # Check if event is in the past
                event_dt = datetime.strptime(event_date, "%Y-%m-%d")
                if event_dt < today:
                    continue
                
                # Check if past cutoff
                if event_dt > cutoff_date:
                    past_cutoff_count += 1
                    continue
                
                # Cell 2: Event Name (with links)
                event_cell = cells[2]
                
                event_name = None
                event_url = None
                promo_name = None
                promo_id = None
                
                links = event_cell.find_all('a')
                for link in links:
                    href = link.get('href', '')
                    
                    # Promotion link (id=8)
                    if 'id=8' in href and 'nr=' in href:
                        img = link.find('img')
                        if img:
                            promo_name = img.get('alt') or img.get('title')
                        promo_id = extract_id(href)
                    
                    # Event link (id=1)
                    elif 'id=1' in href and 'nr=' in href:
                        event_name = link.get_text(strip=True)
                        event_url = urljoin(BASE_URL, href)
                
                if not event_name:
                    continue
                
                # Cell 3: Location
                location_str = cells[3].get_text(strip=True)
                
                # Filter USA only
                if not is_usa_location(location_str):
                    continue
                
                location = parse_us_location(location_str)
                
                # Deduplicate by cagematch_id
                cagematch_id = extract_id(event_url)
                if cagematch_id:
                    if cagematch_id in seen_ids:
                        continue
                    seen_ids.add(cagematch_id)
                
                event = {
                    'name': event_name,
                    'event_date': event_date,
                    'promotion_name': promo_name,
                    'promotion_cagematch_id': promo_id,
                    'city': location['city'],
                    'state': location['state'],
                    'country': 'USA',
                    'cagematch_id': cagematch_id,
                    'cagematch_url': event_url,
                }
                
                events.append(event)
                found_this_page += 1
                
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue
        
        logger.info(f"Found {found_this_page} USA events on this page (offset {offset})")
        
        # If we found no new events and many are past cutoff, stop
        if found_this_page == 0 and past_cutoff_count > 50:
            logger.info("Most events past cutoff date, stopping")
            break
        
        # Check if there's a next page by looking at pagination
        if len(rows) < 50:  # Less than 50 rows means we're probably at the end
            logger.info("Likely last page")
            break
        
        offset += 100
    
    # Sort by date
    events.sort(key=lambda x: x['event_date'])
    
    logger.info(f"Total unique USA events: {len(events)}")
    return events


def main():
    parser = argparse.ArgumentParser(description='Scrape ALL upcoming USA wrestling events')
    parser.add_argument('--days', type=int, default=120, help='Days ahead to include')
    parser.add_argument('--output', type=str, default='events.json', help='Output file')
    
    args = parser.parse_args()
    
    events = scrape_all_upcoming_events(max_days=args.days)
    
    # Save to file
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2)
    
    # Summary
    print(f"\n{'='*50}")
    print("SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(events)}")
    print(f"Date range: next {args.days} days")
    
    # By date
    dates = {}
    for e in events:
        d = e['event_date']
        dates[d] = dates.get(d, 0) + 1
    
    print(f"\nEvents by month:")
    months = {}
    for d, c in dates.items():
        m = d[:7]
        months[m] = months.get(m, 0) + c
    for m in sorted(months.keys()):
        print(f"  {m}: {months[m]} events")
    
    # By promotion
    promos = {}
    for e in events:
        p = e['promotion_name'] or 'Unknown'
        promos[p] = promos.get(p, 0) + 1
    
    if promos:
        print(f"\nTop promotions:")
        for promo, count in sorted(promos.items(), key=lambda x: -x[1])[:20]:
            print(f"  {promo}: {count}")
    
    # Sample events
    if events:
        print(f"\nSample events:")
        for e in events[:10]:
            print(f"  {e['event_date']} - {e['promotion_name']}: {e['name']}")
            print(f"    Location: {e['city']}, {e['state']}")
    
    print(f"\nSaved to {args.output}")


if __name__ == '__main__':
    main()
