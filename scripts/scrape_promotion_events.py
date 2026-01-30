"""
HotTag - Cagematch Promotion Event Scraper
Scrapes upcoming events from a specific promotion's page

Usage:
    python scrape_promotion_events.py --promotion 2812 --days 120
    python scrape_promotion_events.py --promotions promotions.txt --days 120
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import argparse
from urllib.parse import urljoin, urlparse, parse_qs
import logging

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
    if 'USA' in location_str or 'United States' in location_str:
        return True
    
    # Check for state abbreviations
    parts = [p.strip() for p in location_str.split(',')]
    for part in parts:
        if part.strip().upper() in US_STATES:
            return True
        # Check words in part
        for word in part.split():
            if word.strip().upper() in US_STATES:
                return True
    
    # Explicit non-USA countries
    non_usa = ['Canada', 'Mexico', 'Japan', 'UK', 'England', 'Germany', 'Deutschland',
               'France', 'Australia', 'Saudi-Arabia', 'Saudi Arabia', 'Puerto Rico',
               'Scotland', 'Ireland', 'Wales', 'Italy', 'Spain', 'Austria', 'Switzerland']
    
    for country in non_usa:
        if country.lower() in location_str.lower():
            return False
    
    return False


def parse_us_location(location_str):
    """Parse US location into city, state"""
    result = {'city': None, 'state': None, 'country': 'USA'}
    
    if not location_str:
        return result
    
    parts = [p.strip() for p in location_str.split(',')]
    
    if len(parts) >= 1:
        result['city'] = parts[0]
    
    if len(parts) >= 2:
        for part in parts[1:]:
            part_clean = part.strip()
            # Check for state abbreviation
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


def scrape_promotion_events(promotion_id, max_days=120, usa_only=True):
    """Scrape upcoming events from a specific promotion"""
    session = requests.Session()
    session.headers.update(HEADERS)
    
    events = []
    seen_ids = set()
    
    today = datetime.now()
    cutoff_date = today + timedelta(days=max_days)
    
    # Get promotion's events page
    url = f"{BASE_URL}/?id=8&nr={promotion_id}&page=4"
    
    logger.info(f"Fetching promotion {promotion_id} events...")
    
    try:
        time.sleep(1)
        response = session.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Request failed: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Get promotion name from page
    promo_name = None
    h1 = soup.find('h1')
    if h1:
        promo_name = h1.get_text(strip=True)
        # Clean up - remove (Short Name) format
        if '(' in promo_name:
            promo_name = promo_name.split('(')[0].strip()
    
    logger.info(f"Promotion: {promo_name}")
    
    # Find events table
    table = soup.find('table', class_='TBase')
    if not table:
        logger.info("No events table found")
        return []
    
    rows = table.find_all('tr')
    
    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 5:
            continue
        
        try:
            # Find date cell (contains DD.MM.YYYY format)
            date_str = None
            event_name = None
            event_url = None
            location_str = None
            
            for i, cell in enumerate(cells):
                text = cell.get_text(strip=True)
                
                # Check if this is a date (DD.MM.YYYY)
                if len(text) == 10 and text[2] == '.' and text[5] == '.':
                    date_str = text
                
                # Check for event link
                link = cell.find('a', href=lambda h: h and 'id=1' in h and 'nr=' in h)
                if link and not event_name:
                    event_name = link.get_text(strip=True)
                    event_url = urljoin(BASE_URL, link.get('href', ''))
                
                # Location is usually after event name, contains comma
                if ',' in text and not date_str == text and not event_name == text:
                    if any(state in text.upper() for state in US_STATES) or 'USA' in text:
                        location_str = text
            
            if not date_str or not event_name:
                continue
            
            event_date = parse_date(date_str)
            if not event_date:
                continue
            
            # Check if event is in the future and within cutoff
            event_dt = datetime.strptime(event_date, "%Y-%m-%d")
            if event_dt < today:
                continue
            if event_dt > cutoff_date:
                continue
            
            # Filter USA only
            if usa_only and location_str and not is_usa_location(location_str):
                continue
            
            location = parse_us_location(location_str) if location_str else {'city': None, 'state': None, 'country': 'USA'}
            
            # Deduplicate
            cagematch_id = extract_id(event_url)
            if cagematch_id:
                if cagematch_id in seen_ids:
                    continue
                seen_ids.add(cagematch_id)
            
            event = {
                'name': event_name,
                'event_date': event_date,
                'promotion_name': promo_name,
                'promotion_cagematch_id': promotion_id,
                'city': location['city'],
                'state': location['state'],
                'country': 'USA',
                'cagematch_id': cagematch_id,
                'cagematch_url': event_url,
            }
            
            events.append(event)
            logger.info(f"  Found: {event_date} - {event_name}")
            
        except Exception as e:
            logger.warning(f"Error parsing row: {e}")
            continue
    
    logger.info(f"Found {len(events)} upcoming USA events for {promo_name}")
    return events


def main():
    parser = argparse.ArgumentParser(description='Scrape upcoming events from specific promotions')
    parser.add_argument('--promotion', type=int, help='Single promotion Cagematch ID')
    parser.add_argument('--promotions', type=str, help='File with promotion IDs (one per line)')
    parser.add_argument('--days', type=int, default=120, help='Days ahead to include')
    parser.add_argument('--output', type=str, default='promotion_events.json', help='Output file')
    
    args = parser.parse_args()
    
    promotion_ids = []
    
    if args.promotion:
        promotion_ids.append(args.promotion)
    
    if args.promotions:
        try:
            with open(args.promotions, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and line.isdigit():
                        promotion_ids.append(int(line))
        except Exception as e:
            logger.error(f"Error reading promotions file: {e}")
    
    if not promotion_ids:
        # Default list of Texas/regional indie promotions
        promotion_ids = [
            2812,   # New Texas Pro
            2518,   # Reality of Wrestling
            12550,  # Branded Outlaw Wrestling
            # Add more as needed
        ]
    
    all_events = []
    
    for promo_id in promotion_ids:
        events = scrape_promotion_events(promo_id, max_days=args.days)
        all_events.extend(events)
        time.sleep(2)  # Be nice to the server
    
    # Deduplicate across promotions
    seen_ids = set()
    unique_events = []
    for e in all_events:
        if e['cagematch_id'] and e['cagematch_id'] not in seen_ids:
            seen_ids.add(e['cagematch_id'])
            unique_events.append(e)
        elif not e['cagematch_id']:
            unique_events.append(e)
    
    # Sort by date
    unique_events.sort(key=lambda x: x['event_date'])
    
    # Save to file
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(unique_events, f, indent=2)
    
    # Summary
    print(f"\n{'='*50}")
    print("SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(unique_events)}")
    print(f"Promotions scraped: {len(promotion_ids)}")
    print(f"Date range: next {args.days} days")
    
    # By promotion
    promos = {}
    for e in unique_events:
        p = e['promotion_name'] or 'Unknown'
        promos[p] = promos.get(p, 0) + 1
    
    if promos:
        print(f"\nEvents by promotion:")
        for promo, count in sorted(promos.items(), key=lambda x: -x[1]):
            print(f"  {promo}: {count}")
    
    # List events
    if unique_events:
        print(f"\nUpcoming events:")
        for e in unique_events:
            print(f"  {e['event_date']} - {e['promotion_name']}: {e['name']}")
            print(f"    Location: {e['city']}, {e['state']}")
    
    print(f"\nSaved to {args.output}")


if __name__ == '__main__':
    main()
