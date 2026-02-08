"""
HotTag - Unified Event Pipeline
One script to rule them all: scrape worldwide events from Cagematch,
load into Supabase, fetch venue details, and geocode for maps.

Excludes: WWE, NXT, AEW, TNA, IMPACT

Usage:
    python hottag_sync.py                    # Default 120 days
    python hottag_sync.py --days 90          # Custom range
    python hottag_sync.py --skip-details     # Skip venue detail scraping (faster)
    python hottag_sync.py --skip-geocode     # Skip geocoding
    python hottag_sync.py --dry-run          # Scrape only, don't load into DB

Requires .env file with:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_KEY=your_service_role_key
    GOOGLE_MAPS_API_KEY=your_google_maps_key
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import argparse
import logging
import re
import os
from pathlib import Path

# ============================================
# CONFIG
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load .env
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
GOOGLE_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY') or os.environ.get('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')

DB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

SCRAPE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

BASE_URL = "https://www.cagematch.net"

# Promotions to EXCLUDE
EXCLUDED_PROMOTIONS = [
    'world wrestling entertainment', 'wwe',
    'all elite wrestling', 'aew',
    'total nonstop action wrestling', 'tna wrestling', 'tna',
    'impact wrestling', 'impact',
    'wwe nxt', 'nxt',
    'wwe raw', 'wwe smackdown', 'wwe speed',
    'aew dynamite', 'aew collision', 'aew rampage',
]

US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

COUNTRY_TO_REGION = {
    'USA': None,
    'Canada': 'Canada', 'Mexico': 'Mexico', 'Japan': 'Japan',
    'UK': 'United Kingdom', 'England': 'United Kingdom', 'Scotland': 'United Kingdom',
    'Wales': 'United Kingdom', 'Northern Ireland': 'United Kingdom',
    'Germany': 'Europe', 'Deutschland': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
    'Spain': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe', 'Netherlands': 'Europe',
    'Belgium': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Sweden': 'Europe',
    'Norway': 'Europe', 'Finland': 'Europe', 'Denmark': 'Europe', 'Ireland': 'Europe',
    'Portugal': 'Europe', 'Romania': 'Europe', 'Hungary': 'Europe', 'Bulgaria': 'Europe',
    'Croatia': 'Europe', 'Serbia': 'Europe', 'Greece': 'Europe', 'Turkey': 'Europe',
    'Australia': 'Australia & New Zealand', 'New Zealand': 'Australia & New Zealand',
    'Brazil': 'Latin America', 'Argentina': 'Latin America', 'Chile': 'Latin America',
    'Colombia': 'Latin America', 'Peru': 'Latin America',
    'India': 'Asia', 'China': 'Asia', 'South Korea': 'Asia', 'Korea': 'Asia',
    'Philippines': 'Asia', 'Singapore': 'Asia', 'Malaysia': 'Asia', 'Thailand': 'Asia',
    'Indonesia': 'Asia', 'Vietnam': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia',
    'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
    'Saudi Arabia': 'Middle East', 'Saudi-Arabia': 'Middle East', 'UAE': 'Middle East',
    'Israel': 'Middle East', 'Puerto Rico': 'Puerto Rico',
}

TICKET_PLATFORMS = [
    'ticket', 'eventbrite', 'showclix', 'ticketmaster', 'dice.fm', 'tixr',
    'seetickets', 'universe', 'holdmyticket', 'eventeny', 'freshtix', 'simpletix',
]


# ============================================
# STEP 1: SCRAPE EVENTS FROM CAGEMATCH
# ============================================

def is_excluded(promo_name):
    if not promo_name:
        return False
    name_lower = promo_name.lower().strip()
    for excl in EXCLUDED_PROMOTIONS:
        if excl in name_lower or name_lower in excl:
            return True
    return False


def parse_date(date_str):
    try:
        return datetime.strptime(date_str.strip(), "%d.%m.%Y").strftime("%Y-%m-%d")
    except:
        return None


def extract_id(url):
    if not url:
        return None
    match = re.search(r'nr=(\d+)', url)
    return match.group(1) if match else None


def parse_location(location_str):
    if not location_str:
        return {'city': None, 'state': None, 'country': None}

    parts = [p.strip() for p in location_str.split(',')]
    city = parts[0] if parts else None
    state = None
    country = None

    # Check for USA
    is_usa = 'USA' in location_str
    if not is_usa:
        for part in parts:
            for word in part.strip().split():
                if word.upper() in US_STATES:
                    is_usa = True
                    break
            if is_usa:
                break

    if is_usa:
        country = 'USA'
        for part in parts[1:]:
            for word in part.strip().split():
                if word.upper() in US_STATES:
                    state = word.upper()
                    break
            if state:
                break
    elif len(parts) >= 2:
        country = parts[-1].strip()
        if len(parts) >= 3:
            state = parts[1].strip()

    return {'city': city, 'state': state, 'country': country}


def scrape_events(max_days=120):
    """Scrape all upcoming events worldwide from Cagematch"""
    session = requests.Session()
    session.headers.update(SCRAPE_HEADERS)

    events = []
    seen_ids = set()
    today = datetime.now()
    cutoff = today + timedelta(days=max_days)

    offset = 0
    while offset < 3000:
        url = f"{BASE_URL}/?id=1&view=cards&s={offset}"
        logger.info(f"Fetching offset {offset}...")

        try:
            time.sleep(1.5)
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            logger.error(f"Request failed: {e}")
            break

        soup = BeautifulSoup(resp.text, 'html.parser')
        table = soup.find('div', class_='TableContents')
        if not table:
            break

        rows = table.find_all('tr')
        if len(rows) <= 1:
            break

        found = 0
        past_cutoff = 0

        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 4:
                continue
            try:
                event_date = parse_date(cells[1].get_text(strip=True))
                if not event_date:
                    continue

                event_dt = datetime.strptime(event_date, "%Y-%m-%d")
                if event_dt < today:
                    continue
                if event_dt > cutoff:
                    past_cutoff += 1
                    continue

                event_cell = cells[2]
                event_name = event_url = promo_name = promo_id = None

                for link in event_cell.find_all('a'):
                    href = link.get('href', '')
                    if 'id=8' in href and 'nr=' in href:
                        img = link.find('img')
                        if img:
                            promo_name = img.get('alt') or img.get('title')
                        promo_id = extract_id(href)
                    elif 'id=1' in href and 'nr=' in href:
                        event_name = link.get_text(strip=True)
                        event_url = f"{BASE_URL}/{href}" if not href.startswith('http') else href

                if not event_name:
                    continue
                if is_excluded(promo_name):
                    continue

                location_str = cells[3].get_text(strip=True)
                location = parse_location(location_str)

                cm_id = extract_id(event_url)
                if cm_id:
                    if cm_id in seen_ids:
                        continue
                    seen_ids.add(cm_id)

                events.append({
                    'name': event_name,
                    'event_date': event_date,
                    'promotion_name': promo_name,
                    'promotion_cagematch_id': promo_id,
                    'city': location['city'],
                    'state': location['state'],
                    'country': location['country'],
                    'cagematch_id': cm_id,
                    'cagematch_url': event_url,
                    'raw_location': location_str,
                })
                found += 1
            except Exception as e:
                logger.warning(f"Row parse error: {e}")

        logger.info(f"  Found {found} events")
        if found == 0 and past_cutoff > 50:
            break
        if len(rows) < 50:
            break
        offset += 100

    events.sort(key=lambda x: x['event_date'])
    logger.info(f"Total scraped: {len(events)} events")
    return events


# ============================================
# STEP 2: LOAD INTO SUPABASE
# ============================================

def db_get(endpoint):
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/{endpoint}", headers=DB_HEADERS)
    return resp.json() if resp.status_code == 200 else []


def db_post(table, data):
    headers = {**DB_HEADERS, "Prefer": "return=representation"}
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers, json=data)
    if resp.status_code == 201:
        return resp.json()[0]
    return None


def db_patch(table, filter_str, data):
    resp = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?{filter_str}", headers=DB_HEADERS, json=data)
    return resp.status_code == 204


def load_events(events):
    """Load scraped events into Supabase, creating promotions as needed"""
    logger.info("Fetching existing promotions...")
    promos = {p['name'].lower(): p for p in db_get("promotions?select=id,name,slug")}
    logger.info(f"  {len(promos)} promotions in DB")

    logger.info("Fetching existing event IDs...")
    existing = set(
        e['cagematch_id'] for e in db_get("events?select=cagematch_id&not.cagematch_id.is.null")
        if e.get('cagematch_id')
    )
    logger.info(f"  {len(existing)} existing events")

    created = skipped = errors = new_promos = 0
    new_event_ids = []

    for i, event in enumerate(events):
        if (i + 1) % 100 == 0:
            logger.info(f"  Loading {i+1}/{len(events)}...")

        if event.get('cagematch_id') and event['cagematch_id'] in existing:
            skipped += 1
            continue

        # Find or create promotion
        promo_id = None
        promo_name = event.get('promotion_name')
        if promo_name:
            key = promo_name.lower()
            if key in promos:
                promo_id = promos[key]['id']
            else:
                # Partial match
                for k, p in promos.items():
                    if key in k or k in key:
                        promo_id = p['id']
                        break
                if not promo_id:
                    country = event.get('country', 'USA')
                    region = COUNTRY_TO_REGION.get(country, 'International')
                    slug = re.sub(r'[^a-z0-9-]', '', promo_name.lower().replace(' ', '-'))
                    new_data = {"name": promo_name, "slug": slug, "country": country}
                    if region:
                        new_data["region"] = region
                    new_promo = db_post("promotions", new_data)
                    if new_promo:
                        promos[key] = new_promo
                        promo_id = new_promo['id']
                        new_promos += 1
                        logger.info(f"  New promotion: {promo_name} ({country})")

        # Insert event
        event_data = {
            "name": event['name'],
            "event_date": event['event_date'],
            "city": event.get('city'),
            "state": event.get('state'),
            "country": event.get('country', 'USA'),
            "promotion_id": promo_id,
            "cagematch_id": event.get('cagematch_id'),
            "source_url": event.get('cagematch_url'),
            "source_name": "cagematch",
            "status": "upcoming",
        }

        result = db_post("events", event_data)
        if result:
            created += 1
            new_event_ids.append(result['id'])
            if event.get('cagematch_id'):
                existing.add(event['cagematch_id'])
        else:
            errors += 1

    logger.info(f"Load complete: {created} created, {skipped} skipped, {errors} errors, {new_promos} new promotions")
    return new_event_ids


# ============================================
# STEP 3: SCRAPE VENUE DETAILS
# ============================================

def scrape_event_detail(source_url):
    """Scrape venue, address, time, ticket from a Cagematch event page"""
    details = {}

    if '&page=' in source_url:
        source_url = source_url.split('&page=')[0]

    try:
        time.sleep(1.5)
        resp = requests.get(source_url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        info_box = soup.find('div', class_='InformationBoxTable')
        if info_box:
            for row in info_box.find_all('div', class_='InformationBoxRow'):
                title_div = row.find('div', class_='InformationBoxTitle')
                content_div = row.find('div', class_='InformationBoxContents')
                if not title_div or not content_div:
                    continue

                title = title_div.get_text(strip=True).lower()
                content = content_div.get_text(strip=True)

                if 'arena' in title:
                    link = content_div.find('a')
                    details['venue_name'] = link.get_text(strip=True) if link else content
                elif 'location' in title or 'address' in title:
                    details['venue_address'] = content
                elif 'bell' in title or 'start' in title:
                    details['event_time'] = content
                elif 'door' in title:
                    details['doors_time'] = content

        # Ticket links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '').lower()
            text = link.get_text(strip=True).lower()
            if any(p in href for p in TICKET_PLATFORMS) and link['href'].startswith('http'):
                details['ticket_url'] = link['href']
                break
            elif 'ticket' in text and link['href'].startswith('http'):
                details['ticket_url'] = link['href']
                break

    except Exception as e:
        logger.warning(f"Detail scrape error for {source_url}: {e}")

    return details


def fetch_venue_details():
    """Scrape venue details for events that are missing them"""
    all_events = []
    offset = 0
    while True:
        batch = db_get(f"events?select=id,name,source_url,venue_name&source_url=not.is.null&venue_name=is.null&limit=500&offset={offset}")
        if not batch:
            break
        all_events.extend(batch)
        if len(batch) < 500:
            break
        offset += 500

    if not all_events:
        logger.info("All events have venue details")
        return

    logger.info(f"Fetching venue details for {len(all_events)} events...")
    updated = 0

    for i, event in enumerate(all_events):
        if not event.get('source_url'):
            continue

        if (i + 1) % 25 == 0:
            logger.info(f"  Detail scraping {i+1}/{len(all_events)}...")

        details = scrape_event_detail(event['source_url'])
        if details:
            if db_patch("events", f"id=eq.{event['id']}", details):
                updated += 1

    logger.info(f"Venue details updated: {updated}/{len(all_events)}")


# ============================================
# STEP 4: GEOCODE
# ============================================

def geocode(venue, city, state, country):
    """Get lat/lng from Google Geocoding API"""
    if not GOOGLE_API_KEY:
        return None, None

    address = ', '.join(filter(None, [venue, city, state, country]))
    if not address:
        return None, None

    try:
        resp = requests.get('https://maps.googleapis.com/maps/api/geocode/json', params={
            'address': address, 'key': GOOGLE_API_KEY
        })
        data = resp.json()
        if data['status'] == 'OK' and data['results']:
            loc = data['results'][0]['geometry']['location']
            return loc['lat'], loc['lng']
    except Exception as e:
        logger.warning(f"Geocode error for '{address}': {e}")

    return None, None


def geocode_events():
    """Geocode events that are missing coordinates"""
    if not GOOGLE_API_KEY:
        logger.warning("No GOOGLE_MAPS_API_KEY — skipping geocoding")
        return

    all_events = []
    offset = 0
    while True:
        batch = db_get(f"events?select=id,name,venue_name,venue_address,city,state,country&or=(latitude.is.null,longitude.is.null)&limit=500&offset={offset}")
        if not batch:
            break
        all_events.extend(batch)
        if len(batch) < 500:
            break
        offset += 500

    if not all_events:
        logger.info("All events have coordinates")
        return

    logger.info(f"Geocoding {len(all_events)} events...")
    coded = 0

    for i, e in enumerate(all_events):
        if (i + 1) % 50 == 0:
            logger.info(f"  Geocoding {i+1}/{len(all_events)}...")

        # Try venue_address first (more specific), fall back to venue_name
        venue = e.get('venue_address') or e.get('venue_name')
        lat, lng = geocode(venue, e.get('city'), e.get('state'), e.get('country', 'USA'))

        if lat and lng:
            if db_patch("events", f"id=eq.{e['id']}", {'latitude': lat, 'longitude': lng}):
                coded += 1

        time.sleep(0.1)  # Rate limit

    logger.info(f"Geocoded: {coded}/{len(all_events)}")


# ============================================
# STEP 5: CHAMPIONSHIPS
# ============================================

def find_promotion_on_cagematch(promo_name):
    """Search Cagematch for a promotion and return its ID"""
    search_url = f"{BASE_URL}/?id=8&view=promotions&search={requests.utils.quote(promo_name)}"
    try:
        time.sleep(1.5)
        resp = requests.get(search_url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if 'id=8' in href and 'nr=' in href and 'page=' not in href:
                link_text = link.get_text(strip=True)
                if link_text.lower() == promo_name.lower() or promo_name.lower() in link_text.lower():
                    match = re.search(r'nr=(\d+)', href)
                    if match:
                        return match.group(1)
    except Exception as e:
        logger.warning(f"Cagematch search error for {promo_name}: {e}")
    return None


def scrape_title_page(cm_promo_id):
    """Scrape current titles from Cagematch promotion page"""
    url = f"{BASE_URL}/?id=8&nr={cm_promo_id}&page=5&reign=current"
    titles = []
    try:
        time.sleep(1.5)
        resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        tables = soup.find_all('div', class_='TableContents')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows[1:]:
                cells = row.find_all('td')
                if len(cells) < 2:
                    continue
                title_name = None
                champion_names = []
                for link in cells[0].find_all('a'):
                    if 'id=5' in link.get('href', ''):
                        title_name = link.get_text(strip=True)
                        break
                if not title_name:
                    title_name = cells[0].get_text(strip=True)
                for cell in cells[1:]:
                    for link in cell.find_all('a'):
                        if 'id=2' in link.get('href', '') and 'nr=' in link.get('href', ''):
                            name = link.get_text(strip=True)
                            if name:
                                champion_names.append(name)
                if title_name and not title_name.startswith('«'):
                    # Filter vacant
                    champion_names = [c for c in champion_names if c.lower() != 'vacant']
                    if champion_names:
                        titles.append({'name': title_name, 'champions': champion_names})
    except Exception as e:
        logger.warning(f"Title scrape error for promo {cm_promo_id}: {e}")
    return titles


def find_wrestler_by_name(name):
    """Match wrestler name to database"""
    encoded = requests.utils.quote(name)
    results = db_get(f"wrestlers?select=id,name,slug&name=ilike.{encoded}&limit=1")
    if results:
        return results[0]
    results = db_get(f"wrestlers?select=id,name,slug&name=ilike.%25{encoded}%25&limit=3")
    if results:
        for r in results:
            if r['name'].lower() == name.lower():
                return r
        if len(results) == 1:
            return results[0]
    return None


def sync_championships():
    """Scrape championships for all promotions in DB"""
    promos = db_get("promotions?select=id,name,slug,country")
    # Exclude WWE/AEW etc
    filtered = []
    for p in promos:
        name_lower = p['name'].lower()
        excluded = any(excl in name_lower or name_lower in excl for excl in EXCLUDED_PROMOTIONS)
        if not excluded:
            filtered.append(p)

    logger.info(f"Checking championships for {len(filtered)} promotions...")
    total_updated = 0
    processed = 0

    for promo in filtered:
        try:
            cm_id = find_promotion_on_cagematch(promo['name'])
            if not cm_id:
                continue

            titles = scrape_title_page(cm_id)
            if not titles:
                continue

            existing = db_get(f"promotion_championships?select=id,name,short_name,current_champion_id,current_champion_2_id,is_active&promotion_id=eq.{promo['id']}")
            existing_by_name = {c['name'].lower(): c for c in existing}

            for i, title in enumerate(titles):
                champ_1_id = champ_2_id = None
                if len(title['champions']) >= 1:
                    w = find_wrestler_by_name(title['champions'][0])
                    if w:
                        champ_1_id = w['id']
                if len(title['champions']) >= 2:
                    w = find_wrestler_by_name(title['champions'][1])
                    if w:
                        champ_2_id = w['id']

                # Short name
                short_name = title['name']
                for long, short in [('Heavyweight Championship', 'Heavyweight'), ('World Championship', 'World'),
                                    ('Tag Team Championship', 'Tag Team'), ("Women's Championship", "Women's"),
                                    ('Television Championship', 'TV'), ('Cruiserweight Championship', 'Cruiserweight')]:
                    if long.lower() in title['name'].lower():
                        short_name = short
                        break

                existing_champ = existing_by_name.get(title['name'].lower())
                if existing_champ:
                    update_data = {}
                    if champ_1_id and existing_champ.get('current_champion_id') != champ_1_id:
                        update_data['current_champion_id'] = champ_1_id
                    if champ_2_id and existing_champ.get('current_champion_2_id') != champ_2_id:
                        update_data['current_champion_2_id'] = champ_2_id
                    if not champ_2_id and len(title['champions']) < 2:
                        update_data['current_champion_2_id'] = None
                    if update_data:
                        db_patch("promotion_championships", f"id=eq.{existing_champ['id']}", update_data)
                        total_updated += 1
                else:
                    result = db_post("promotion_championships", {
                        "promotion_id": promo['id'], "name": title['name'], "short_name": short_name,
                        "current_champion_id": champ_1_id, "current_champion_2_id": champ_2_id,
                        "is_active": True, "sort_order": i,
                    })
                    if result:
                        total_updated += 1

            processed += 1
        except Exception as e:
            logger.error(f"Championship error for {promo['name']}: {e}")

    logger.info(f"Championships: {processed} promotions processed, {total_updated} created/updated")


# ============================================
# MAIN
# ============================================

def main():
    parser = argparse.ArgumentParser(description='HotTag - Unified event sync pipeline')
    parser.add_argument('--days', type=int, default=120, help='Days ahead to scrape (default: 120)')
    parser.add_argument('--skip-details', action='store_true', help='Skip venue detail scraping')
    parser.add_argument('--skip-geocode', action='store_true', help='Skip geocoding')
    parser.add_argument('--skip-championships', action='store_true', help='Skip championship scraping')
    parser.add_argument('--dry-run', action='store_true', help='Scrape only, save to JSON, don\'t load into DB')
    parser.add_argument('--output', type=str, default='events_sync.json', help='JSON output file for dry-run')
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in .env")
        return

    start = time.time()

    # Step 1: Scrape
    print(f"\n{'='*60}")
    print("STEP 1: SCRAPING CAGEMATCH")
    print(f"{'='*60}")
    events = scrape_events(max_days=args.days)

    # Country breakdown
    countries = {}
    for e in events:
        c = e.get('country') or 'Unknown'
        countries[c] = countries.get(c, 0) + 1
    print(f"\nBy country:")
    for c, n in sorted(countries.items(), key=lambda x: -x[1])[:20]:
        print(f"  {c}: {n}")

    if args.dry_run:
        with open(args.output, 'w') as f:
            json.dump(events, f, indent=2)
        print(f"\nDry run — saved {len(events)} events to {args.output}")
        return

    # Step 2: Load
    print(f"\n{'='*60}")
    print("STEP 2: LOADING INTO SUPABASE")
    print(f"{'='*60}")
    new_ids = load_events(events)

    # Step 3: Venue details
    if not args.skip_details:
        print(f"\n{'='*60}")
        print("STEP 3: SCRAPING VENUE DETAILS")
        print(f"{'='*60}")
        fetch_venue_details()
    else:
        print("\nSkipping venue details (--skip-details)")

    # Step 4: Geocode
    if not args.skip_geocode:
        print(f"\n{'='*60}")
        print("STEP 4: GEOCODING")
        print(f"{'='*60}")
        geocode_events()
    else:
        print("\nSkipping geocoding (--skip-geocode)")

    # Step 5: Championships
    if not args.skip_championships:
        print(f"\n{'='*60}")
        print("STEP 5: SCRAPING CHAMPIONSHIPS")
        print(f"{'='*60}")
        sync_championships()
    else:
        print("\nSkipping championships (--skip-championships)")

    elapsed = time.time() - start
    print(f"\n{'='*60}")
    print(f"DONE in {elapsed/60:.1f} minutes")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
