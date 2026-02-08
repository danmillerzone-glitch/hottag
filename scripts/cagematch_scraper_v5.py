"""
HotTag - Cagematch International Event Scraper v5
Scrapes upcoming events worldwide, EXCLUDING USA and WWE/AEW/TNA/IMPACT
Use v4 for USA events, v5 for international only.

Usage:
    python cagematch_scraper_v5.py --days 120
    python cagematch_scraper_v5.py --days 90 --output international_events.json
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import argparse
from urllib.parse import urljoin
import logging
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# Promotions to EXCLUDE (case-insensitive matching)
EXCLUDED_PROMOTIONS = [
    'world wrestling entertainment',
    'wwe',
    'all elite wrestling',
    'aew',
    'total nonstop action wrestling',
    'tna wrestling',
    'tna',
    'impact wrestling',
    'impact',
    'wwe nxt',
    'nxt',
    'wwe raw',
    'wwe smackdown',
    'aew dynamite',
    'aew collision',
    'aew rampage',
]

US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
             'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
             'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
             'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
             'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']


def is_excluded_promotion(promo_name):
    """Check if promotion should be excluded"""
    if not promo_name:
        return False
    name_lower = promo_name.lower().strip()
    for excluded in EXCLUDED_PROMOTIONS:
        if excluded in name_lower or name_lower in excluded:
            return True
    return False


def parse_date(date_str):
    """Parse DD.MM.YYYY format"""
    try:
        dt = datetime.strptime(date_str.strip(), "%d.%m.%Y")
        return dt.strftime("%Y-%m-%d")
    except:
        return None


def extract_id(url):
    """Extract nr= parameter from Cagematch URL"""
    if not url:
        return None
    match = re.search(r'nr=(\d+)', url)
    return match.group(1) if match else None


def parse_location(location_str):
    """Parse location into city, state/region, country"""
    if not location_str:
        return {'city': None, 'state': None, 'country': None}

    parts = [p.strip() for p in location_str.split(',')]

    city = None
    state = None
    country = None

    if len(parts) >= 1:
        city = parts[0]

    # Check if USA
    is_usa = False
    if 'USA' in location_str:
        is_usa = True
        country = 'USA'
    else:
        # Check for US state abbreviations in location
        for part in parts:
            for word in part.strip().split():
                if word.upper() in US_STATES:
                    is_usa = True
                    country = 'USA'
                    break
            if is_usa:
                break

    if is_usa and len(parts) >= 2:
        # Try to extract state from second part
        for part in parts[1:]:
            words = part.strip().split()
            for word in words:
                if word.upper() in US_STATES:
                    state = word.upper()
                    break
            if state:
                break
    elif len(parts) >= 2:
        # International: last part is usually country
        country = parts[-1].strip()
        if len(parts) >= 3:
            state = parts[1].strip()
        elif len(parts) == 2:
            # Could be "City, Country" — country is already set
            pass

    return {
        'city': city,
        'state': state,
        'country': country,
    }


def scrape_all_upcoming_events(max_days=120):
    """Scrape ALL upcoming events worldwide, excluding major promotions"""
    session = requests.Session()
    session.headers.update(HEADERS)

    events = []
    seen_ids = set()

    today = datetime.now()
    cutoff_date = today + timedelta(days=max_days)

    offset = 0
    max_offset = 3000  # Higher limit for international

    while offset < max_offset:
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

        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 4:
                continue

            try:
                date_str = cells[1].get_text(strip=True)
                event_date = parse_date(date_str)
                if not event_date:
                    continue

                event_dt = datetime.strptime(event_date, "%Y-%m-%d")
                if event_dt < today:
                    continue
                if event_dt > cutoff_date:
                    past_cutoff_count += 1
                    continue

                event_cell = cells[2]
                event_name = None
                event_url = None
                promo_name = None
                promo_id = None

                links = event_cell.find_all('a')
                for link in links:
                    href = link.get('href', '')
                    if 'id=8' in href and 'nr=' in href:
                        img = link.find('img')
                        if img:
                            promo_name = img.get('alt') or img.get('title')
                        promo_id = extract_id(href)
                    elif 'id=1' in href and 'nr=' in href:
                        event_name = link.get_text(strip=True)
                        event_url = urljoin(BASE_URL, href)

                if not event_name:
                    continue

                # EXCLUDE major promotions
                if is_excluded_promotion(promo_name):
                    continue

                location_str = cells[3].get_text(strip=True)
                location = parse_location(location_str)

                # EXCLUDE USA events — use v4 for those
                if location.get('country') == 'USA':
                    continue

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
                    'country': location['country'],
                    'cagematch_id': cagematch_id,
                    'cagematch_url': event_url,
                    'raw_location': location_str,
                }

                events.append(event)
                found_this_page += 1

            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue

        logger.info(f"Found {found_this_page} events on this page (offset {offset})")

        if found_this_page == 0 and past_cutoff_count > 50:
            logger.info("Most events past cutoff date, stopping")
            break

        if len(rows) < 50:
            logger.info("Likely last page")
            break

        offset += 100

    events.sort(key=lambda x: x['event_date'])
    logger.info(f"Total events (excluding WWE/AEW/TNA/IMPACT): {len(events)}")
    return events


def main():
    parser = argparse.ArgumentParser(description='Scrape international wrestling events (excluding WWE/AEW/TNA/IMPACT)')
    parser.add_argument('--days', type=int, default=120, help='Days ahead to include')
    parser.add_argument('--output', type=str, default='international_events.json', help='Output file')

    args = parser.parse_args()
    events = scrape_all_upcoming_events(max_days=args.days)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2)

    # Summary
    print(f"\n{'='*50}")
    print("INTERNATIONAL SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(events)}")

    # By country
    countries = {}
    for e in events:
        c = e['country'] or 'Unknown'
        countries[c] = countries.get(c, 0) + 1

    print(f"\nEvents by country:")
    for country, count in sorted(countries.items(), key=lambda x: -x[1])[:25]:
        print(f"  {country}: {count}")

    # By month
    months = {}
    for e in events:
        m = e['event_date'][:7]
        months[m] = months.get(m, 0) + 1
    print(f"\nEvents by month:")
    for m in sorted(months.keys()):
        print(f"  {m}: {months[m]}")

    # By promotion
    promos = {}
    for e in events:
        p = e['promotion_name'] or 'Unknown'
        promos[p] = promos.get(p, 0) + 1

    print(f"\nTop promotions:")
    for promo, count in sorted(promos.items(), key=lambda x: -x[1])[:30]:
        print(f"  {promo}: {count}")

    print(f"\nSaved to {args.output}")


if __name__ == '__main__':
    main()
