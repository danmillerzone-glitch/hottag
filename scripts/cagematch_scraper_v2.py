"""
HotTag - Cagematch Event Scraper (Fixed)
Scrapes upcoming events from Cagematch.net

Usage:
    python cagematch_scraper_v2.py --days 90
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import re
import argparse
from urllib.parse import urljoin, urlparse, parse_qs
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

REQUEST_DELAY = 2  # seconds between requests


def parse_date(date_str):
    """Parse date from DD.MM.YYYY format"""
    if not date_str:
        return None
    try:
        # Cagematch uses DD.MM.YYYY format
        dt = datetime.strptime(date_str.strip(), "%d.%m.%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        logger.warning(f"Could not parse date: {date_str}")
        return None


def parse_location(location_str):
    """Parse location string into city, state, country"""
    result = {'city': None, 'state': None, 'country': None}
    
    if not location_str:
        return result
    
    parts = [p.strip() for p in location_str.split(',')]
    
    if len(parts) >= 1:
        result['city'] = parts[0]
    
    if len(parts) >= 2:
        # Check for US state abbreviations
        second = parts[-1].strip() if len(parts) == 2 else parts[1].strip()
        
        # US states
        us_states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                     'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                     'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                     'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                     'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
        
        if len(second) == 2 and second.upper() in us_states:
            result['state'] = second.upper()
            result['country'] = 'USA'
        elif second in ['USA', 'United States', 'US']:
            result['country'] = 'USA'
            if len(parts) >= 3:
                result['state'] = parts[1].strip()
        else:
            result['country'] = parts[-1].strip()
    
    if len(parts) >= 3:
        result['state'] = parts[1].strip()
        result['country'] = parts[2].strip()
    
    return result


def extract_cagematch_id(url):
    """Extract the nr= parameter from a Cagematch URL"""
    if not url:
        return None
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    if 'nr' in params:
        try:
            return int(params['nr'][0])
        except (ValueError, IndexError):
            pass
    return None


def scrape_events(days_ahead=90, usa_only=True):
    """Scrape upcoming events from Cagematch"""
    session = requests.Session()
    session.headers.update(HEADERS)
    
    events = []
    
    start_date = datetime.now()
    end_date = start_date + timedelta(days=days_ahead)
    
    logger.info(f"Scraping events from {start_date.date()} to {end_date.date()}")
    
    page = 0
    max_pages = 20
    
    while page < max_pages:
        # Build URL with parameters
        params = {
            'id': '1',
            'view': 'search',
            'sDateFromDay': start_date.day,
            'sDateFromMonth': start_date.month,
            'sDateFromYear': start_date.year,
            'sDateTillDay': end_date.day,
            'sDateTillMonth': end_date.month,
            'sDateTillYear': end_date.year,
        }
        
        if usa_only:
            params['sCountry'] = '2'  # USA country code
        
        if page > 0:
            params['page'] = page
        
        url = BASE_URL + "/?" + "&".join(f"{k}={v}" for k, v in params.items())
        
        logger.info(f"Fetching page {page + 1}...")
        
        try:
            time.sleep(REQUEST_DELAY)
            response = session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            break
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the events table
        table = soup.find('div', class_='TableContents')
        if not table:
            logger.info("No table found")
            break
        
        rows = table.find_all('tr')
        if len(rows) <= 1:  # Only header row
            logger.info("No more events")
            break
        
        found_on_page = 0
        
        for row in rows[1:]:  # Skip header row
            cells = row.find_all('td')
            if len(cells) < 4:
                continue
            
            try:
                # Column 0: Row number (#)
                # Column 1: Date (DD.MM.YYYY)
                # Column 2: Event name with promotion logo
                # Column 3: Location
                
                date_cell = cells[1]
                event_cell = cells[2]
                location_cell = cells[3]
                
                # Parse date
                date_str = date_cell.get_text(strip=True)
                event_date = parse_date(date_str)
                if not event_date:
                    continue
                
                # Parse event name and promotion
                # The cell contains: <a href="promotion">logo</a> <a href="event">Event Name</a>
                links = event_cell.find_all('a')
                
                event_name = None
                event_url = None
                promotion_name = None
                promotion_id = None
                
                for link in links:
                    href = link.get('href', '')
                    
                    # Check if it's a promotion link (id=8)
                    if 'id=8' in href:
                        img = link.find('img')
                        if img:
                            promotion_name = img.get('alt') or img.get('title')
                        promotion_id = extract_cagematch_id(href)
                    
                    # Check if it's an event link (id=1 with nr=)
                    elif 'id=1' in href and 'nr=' in href:
                        event_name = link.get_text(strip=True)
                        event_url = urljoin(BASE_URL, href)
                
                if not event_name:
                    continue
                
                # Parse location
                location_str = location_cell.get_text(strip=True)
                location = parse_location(location_str)
                
                # Filter for USA only if requested
                if usa_only:
                    if location['country'] and location['country'] not in ['USA', 'United States', 'US']:
                        continue
                    # Also check if state looks like a US state
                    if not location['state'] and not location['country']:
                        # Unknown location, skip
                        continue
                
                event = {
                    'name': event_name,
                    'event_date': event_date,
                    'promotion_name': promotion_name,
                    'promotion_cagematch_id': promotion_id,
                    'city': location['city'],
                    'state': location['state'],
                    'country': location['country'] or 'USA',
                    'cagematch_id': extract_cagematch_id(event_url),
                    'cagematch_url': event_url,
                }
                
                events.append(event)
                found_on_page += 1
                
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue
        
        logger.info(f"Found {found_on_page} USA events on page {page + 1}")
        
        if found_on_page == 0 and page > 0:
            break
        
        page += 1
    
    logger.info(f"Total events scraped: {len(events)}")
    return events


def main():
    parser = argparse.ArgumentParser(description='Scrape wrestling events from Cagematch')
    parser.add_argument('--days', type=int, default=90, help='Days ahead to scrape')
    parser.add_argument('--all-countries', action='store_true', help='Include all countries, not just USA')
    parser.add_argument('--output', type=str, default='events.json', help='Output file')
    
    args = parser.parse_args()
    
    events = scrape_events(
        days_ahead=args.days,
        usa_only=not args.all_countries
    )
    
    # Save to file
    with open(args.output, 'w') as f:
        json.dump(events, f, indent=2)
    
    logger.info(f"Saved {len(events)} events to {args.output}")
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(events)}")
    print(f"Date range: {args.days} days")
    print(f"USA only: {not args.all_countries}")
    
    # Show by promotion
    promos = {}
    for e in events:
        pname = e['promotion_name'] or 'Unknown'
        promos[pname] = promos.get(pname, 0) + 1
    
    if promos:
        print(f"\nEvents by promotion:")
        for promo, count in sorted(promos.items(), key=lambda x: -x[1])[:15]:
            print(f"  {promo}: {count}")
    
    # Show some sample events
    if events:
        print(f"\nSample events:")
        for e in events[:5]:
            print(f"  {e['event_date']} - {e['promotion_name']}: {e['name']} ({e['city']}, {e['state']})")


if __name__ == '__main__':
    main()
