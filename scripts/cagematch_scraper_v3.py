"""
HotTag - Cagematch Event Scraper v3
Scrapes from the upcoming events page (cleaner data)

Usage:
    python cagematch_scraper_v3.py --days 90
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

US_INDICATORS = ['USA', 'United States', 'U.S.A.', 'U.S.'] + US_STATES


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
    
    parts = [p.strip() for p in location_str.split(',')]
    
    # Check last part for country
    if len(parts) >= 2:
        last_part = parts[-1].strip()
        
        # Explicit non-USA countries
        non_usa = ['Canada', 'Mexico', 'Japan', 'UK', 'England', 'Germany', 'Deutschland',
                   'France', 'Australia', 'Saudi-Arabia', 'Saudi Arabia', 'Puerto Rico',
                   'Scotland', 'Ireland', 'Wales', 'Italy', 'Spain', 'Austria', 'Switzerland']
        
        for country in non_usa:
            if country.lower() in last_part.lower():
                return False
        
        # Check for US state abbreviation
        if len(parts) >= 2:
            # State is usually second-to-last or last
            for part in parts[-2:]:
                part_clean = part.strip()
                if part_clean.upper() in US_STATES:
                    return True
                # Check for state names
                if part_clean in US_INDICATORS:
                    return True
        
        # Check for USA explicitly
        if 'USA' in location_str or 'United States' in location_str:
            return True
    
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
        # Find the state
        for part in parts[1:]:
            part_clean = part.strip().upper()
            if part_clean in US_STATES:
                result['state'] = part_clean
                break
            # Try to extract state abbreviation
            words = part.strip().split()
            for word in words:
                if word.upper() in US_STATES:
                    result['state'] = word.upper()
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


def scrape_upcoming_events(max_days=90, usa_only=True):
    """Scrape upcoming events"""
    session = requests.Session()
    session.headers.update(HEADERS)
    
    events = []
    seen_ids = set()
    
    cutoff_date = datetime.now() + timedelta(days=max_days)
    
    page = 0
    max_pages = 50
    
    while page < max_pages:
        url = f"{BASE_URL}/?id=1&view=cards"
        if page > 0:
            url += f"&page={page}"
        
        logger.info(f"Fetching page {page + 1}...")
        
        try:
            time.sleep(1.5)
            response = session.get(url, timeout=30)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Request failed: {e}")
            break
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('div', class_='TableContents')
        
        if not table:
            logger.info("No table found")
            break
        
        rows = table.find_all('tr')
        if len(rows) <= 1:
            logger.info("No more events")
            break
        
        found = 0
        past_cutoff = False
        
        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 4:
                continue
            
            try:
                # Column 1: Date
                date_str = cells[1].get_text(strip=True)
                event_date = parse_date(date_str)
                
                if not event_date:
                    continue
                
                # Check if past cutoff
                event_dt = datetime.strptime(event_date, "%Y-%m-%d")
                if event_dt > cutoff_date:
                    past_cutoff = True
                    continue
                
                # Column 2: Event (with promotion logo)
                event_cell = cells[2]
                links = event_cell.find_all('a')
                
                event_name = None
                event_url = None
                promo_name = None
                promo_id = None
                
                for link in links:
                    href = link.get('href', '')
                    
                    if 'id=8' in href:
                        img = link.find('img')
                        if img:
                            promo_name = img.get('alt') or img.get('title')
                        promo_id = extract_id(href)
                    
                    elif 'id=1' in href and 'nr=' in href:
                        event_name = link.get_text(strip=True)
                        event_url = urljoin(BASE_URL, href)
                
                if not event_name:
                    continue
                
                # Column 3: Location
                location_str = cells[3].get_text(strip=True)
                
                # Filter USA only
                if usa_only and not is_usa_location(location_str):
                    continue
                
                location = parse_us_location(location_str)
                
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
                    'promotion_cagematch_id': promo_id,
                    'city': location['city'],
                    'state': location['state'],
                    'country': 'USA',
                    'cagematch_id': cagematch_id,
                    'cagematch_url': event_url,
                }
                
                events.append(event)
                found += 1
                
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue
        
        logger.info(f"Found {found} USA events on page {page + 1}")
        
        # Stop if we're past the cutoff date and found nothing
        if past_cutoff and found == 0:
            logger.info("Past date cutoff, stopping")
            break
        
        # Check if there's a next page
        pagination = soup.find('div', class_='NavigationPart')
        if pagination:
            next_link = pagination.find('a', string=lambda t: t and 'Next' in t if t else False)
            if not next_link:
                # Also check for » symbol
                next_link = pagination.find('a', string='»')
            
            if not next_link:
                logger.info("No more pages")
                break
        
        page += 1
    
    logger.info(f"Total unique USA events: {len(events)}")
    return events


def main():
    parser = argparse.ArgumentParser(description='Scrape upcoming wrestling events')
    parser.add_argument('--days', type=int, default=90, help='Days ahead to include')
    parser.add_argument('--all-countries', action='store_true', help='Include all countries')
    parser.add_argument('--output', type=str, default='events.json', help='Output file')
    
    args = parser.parse_args()
    
    events = scrape_upcoming_events(
        max_days=args.days,
        usa_only=not args.all_countries
    )
    
    # Save to file
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2)
    
    # Summary
    print(f"\n{'='*50}")
    print("SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(events)}")
    print(f"Date range: next {args.days} days")
    print(f"USA only: {not args.all_countries}")
    
    # By promotion
    promos = {}
    for e in events:
        p = e['promotion_name'] or 'Unknown'
        promos[p] = promos.get(p, 0) + 1
    
    if promos:
        print(f"\nEvents by promotion:")
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
