"""
HotTag - Championship Scraper
Scrapes current championship holders from Cagematch for all promotions
in the database and creates/updates championship records.

Usage:
    python scrape_championships.py                  # All promotions
    python scrape_championships.py --promotion NTP   # Specific promotion by name/slug
    python scrape_championships.py --country Japan   # All promotions in a country
    python scrape_championships.py --dry-run         # Preview without saving

Requires .env with SUPABASE_URL and SUPABASE_KEY
"""

import requests
from bs4 import BeautifulSoup
import time
import argparse
import logging
import re
import os
from pathlib import Path

# ============================================
# CONFIG
# ============================================

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

DB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

SCRAPE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

BASE_URL = "https://www.cagematch.net"

# Skip these promotions (already excluded from events)
EXCLUDED_PROMOTIONS = [
    'world wrestling entertainment', 'wwe', 'all elite wrestling', 'aew',
    'total nonstop action wrestling', 'tna wrestling', 'tna',
    'impact wrestling', 'impact', 'wwe nxt', 'nxt',
]


# ============================================
# DATABASE HELPERS
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
    resp = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?{filter_str}", headers={**DB_HEADERS, "Prefer": "return=minimal"}, json=data)
    return resp.status_code == 204


def get_promotions(filter_name=None, filter_country=None):
    """Get promotions that have cagematch events (meaning we know their cagematch presence)"""
    # Get promotions that have events with cagematch source
    query = "promotions?select=id,name,slug,country"
    if filter_country:
        query += f"&country=eq.{filter_country}"
    
    promos = db_get(query)
    
    if filter_name:
        filter_lower = filter_name.lower()
        promos = [p for p in promos if filter_lower in p['name'].lower() or filter_lower in p.get('slug', '').lower()]
    
    # Exclude WWE/AEW etc
    filtered = []
    for p in promos:
        name_lower = p['name'].lower()
        excluded = False
        for excl in EXCLUDED_PROMOTIONS:
            if excl in name_lower or name_lower in excl:
                excluded = True
                break
        if not excluded:
            filtered.append(p)
    
    return filtered


def get_existing_championships(promotion_id):
    """Get existing championships for a promotion"""
    return db_get(f"promotion_championships?select=id,name,short_name,current_champion_id,current_champion_2_id,is_active&promotion_id=eq.{promotion_id}")


def find_wrestler_by_name(name):
    """Search for wrestler in database by name"""
    # Try exact match first
    results = db_get(f"wrestlers?select=id,name,slug&name=ilike.{requests.utils.quote(name)}&limit=1")
    if results:
        return results[0]
    
    # Try partial/fuzzy match
    # Remove common prefixes/suffixes
    clean = name.strip()
    for prefix in ['The ', 'El ', 'La ', 'Los ', 'Las ']:
        if clean.startswith(prefix):
            alt = clean[len(prefix):]
            results = db_get(f"wrestlers?select=id,name,slug&name=ilike.%25{requests.utils.quote(alt)}%25&limit=3")
            if results:
                # Find best match
                for r in results:
                    if r['name'].lower() == name.lower():
                        return r
                return results[0]
    
    # Wildcard search
    results = db_get(f"wrestlers?select=id,name,slug&name=ilike.%25{requests.utils.quote(clean)}%25&limit=3")
    if results:
        for r in results:
            if r['name'].lower() == name.lower():
                return r
        # Only return if single confident match
        if len(results) == 1:
            return results[0]
    
    return None


# ============================================
# CAGEMATCH SCRAPING
# ============================================

def find_promotion_on_cagematch(promo_name):
    """Search Cagematch for a promotion and return its ID"""
    search_url = f"{BASE_URL}/?id=8&view=promotions&search={requests.utils.quote(promo_name)}"
    
    try:
        time.sleep(1.5)
        resp = requests.get(search_url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Look for promotion links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if 'id=8' in href and 'nr=' in href and 'page=' not in href:
                link_text = link.get_text(strip=True)
                if link_text.lower() == promo_name.lower() or promo_name.lower() in link_text.lower():
                    match = re.search(r'nr=(\d+)', href)
                    if match:
                        return match.group(1)
    except Exception as e:
        logger.warning(f"Error searching Cagematch for {promo_name}: {e}")
    
    return None


def scrape_promotion_titles(cagematch_promo_id):
    """Scrape current title holders from a promotion's Cagematch page"""
    # Promotion title history page
    url = f"{BASE_URL}/?id=8&nr={cagematch_promo_id}&page=5"
    titles = []
    
    try:
        time.sleep(1.5)
        resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find title sections - each title is in a div or table
        # Cagematch shows titles with current champion info
        table = soup.find('div', class_='TableContents')
        if not table:
            return titles
        
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 3:
                continue
            
            try:
                # Look for title name link
                title_link = None
                title_name = None
                for link in cells[0].find_all('a'):
                    href = link.get('href', '')
                    if 'id=5' in href and 'nr=' in href:
                        title_name = link.get_text(strip=True)
                        title_link = href
                        break
                
                if not title_name:
                    # Try getting text directly
                    title_name = cells[0].get_text(strip=True)
                    if not title_name:
                        continue
                
                # Get champion name(s)
                champion_names = []
                for link in row.find_all('a'):
                    href = link.get('href', '')
                    if 'id=2' in href and 'nr=' in href:  # Wrestler links
                        wrestler_name = link.get_text(strip=True)
                        if wrestler_name and wrestler_name != title_name:
                            champion_names.append(wrestler_name)
                
                if title_name and not title_name.startswith('«'):
                    titles.append({
                        'name': title_name,
                        'champions': champion_names,
                    })
            except Exception as e:
                logger.warning(f"Error parsing title row: {e}")
                continue
    
    except Exception as e:
        logger.warning(f"Error scraping titles for promo {cagematch_promo_id}: {e}")
    
    return titles


def scrape_title_page(cagematch_promo_id):
    """Alternative: scrape the promotion's main page for active titles"""
    url = f"{BASE_URL}/?id=8&nr={cagematch_promo_id}&page=5&reign=current"
    titles = []
    
    try:
        time.sleep(1.5)
        resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Look for InformationBoxTable or standard table
        tables = soup.find_all('div', class_='TableContents')
        if not tables:
            # Try the title overview page instead
            return scrape_promotion_titles(cagematch_promo_id)
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header
                cells = row.find_all('td')
                if len(cells) < 2:
                    continue
                
                try:
                    title_name = None
                    champion_names = []
                    
                    # First cell usually has the title name
                    for link in cells[0].find_all('a'):
                        href = link.get('href', '')
                        if 'id=5' in href:
                            title_name = link.get_text(strip=True)
                            break
                    
                    if not title_name:
                        title_name = cells[0].get_text(strip=True)
                    
                    # Look through all cells for wrestler links
                    for cell in cells[1:]:
                        for link in cell.find_all('a'):
                            href = link.get('href', '')
                            if 'id=2' in href and 'nr=' in href:
                                name = link.get_text(strip=True)
                                if name:
                                    champion_names.append(name)
                    
                    if title_name and not title_name.startswith('«'):
                        titles.append({
                            'name': title_name,
                            'champions': champion_names,
                        })
                except Exception as e:
                    continue
    
    except Exception as e:
        logger.warning(f"Error scraping title page: {e}")
    
    return titles


# ============================================
# MAIN LOGIC
# ============================================

def process_promotion(promotion, dry_run=False):
    """Process a single promotion: find titles and update DB"""
    promo_name = promotion['name']
    promo_id = promotion['id']
    
    logger.info(f"\nProcessing: {promo_name}")
    
    # Find promotion on Cagematch
    cm_id = find_promotion_on_cagematch(promo_name)
    if not cm_id:
        logger.info(f"  Not found on Cagematch, skipping")
        return 0
    
    logger.info(f"  Cagematch ID: {cm_id}")
    
    # Scrape titles
    titles = scrape_title_page(cm_id)
    if not titles:
        logger.info(f"  No titles found")
        return 0
    
    logger.info(f"  Found {len(titles)} titles")
    
    # Get existing championships
    existing = get_existing_championships(promo_id)
    existing_by_name = {c['name'].lower(): c for c in existing}
    
    updated = 0
    
    for i, title in enumerate(titles):
        title_name = title['name']
        champions = title['champions']
        
        logger.info(f"  Title: {title_name}")
        if champions:
            # Check for "Vacant" as champion name
            champions = [c for c in champions if c.lower() != 'vacant']
        
        if not champions:
            logger.info(f"    Vacant — skipping")
            continue
        
        logger.info(f"    Champion(s): {', '.join(champions)}")
        
        if dry_run:
            continue
        
        # Find champion wrestler IDs
        champ_1_id = None
        champ_2_id = None
        
        if len(champions) >= 1:
            wrestler = find_wrestler_by_name(champions[0])
            if wrestler:
                champ_1_id = wrestler['id']
                logger.info(f"    Matched: {champions[0]} → {wrestler['name']} ({wrestler['id'][:8]}...)")
            else:
                logger.info(f"    Not in DB: {champions[0]}")
        
        if len(champions) >= 2:
            wrestler = find_wrestler_by_name(champions[1])
            if wrestler:
                champ_2_id = wrestler['id']
                logger.info(f"    Matched: {champions[1]} → {wrestler['name']} ({wrestler['id'][:8]}...)")
            else:
                logger.info(f"    Not in DB: {champions[1]}")
        
        # Determine short name
        short_name = title_name
        # Common shortenings
        for long, short in [
            ('Heavyweight Championship', 'Heavyweight'),
            ('World Championship', 'World'),
            ('Tag Team Championship', 'Tag Team'),
            ('Women\'s Championship', 'Women\'s'),
            ('Junior Heavyweight', 'Jr. Heavyweight'),
            ('Cruiserweight Championship', 'Cruiserweight'),
            ('Television Championship', 'TV'),
            ('Intercontinental Championship', 'Intercontinental'),
            ('Heritage Championship', 'Heritage'),
        ]:
            if long.lower() in title_name.lower():
                short_name = short
                break
        
        # Check if championship exists
        existing_champ = existing_by_name.get(title_name.lower())
        
        if existing_champ:
            # Update existing
            update_data = {}
            if champ_1_id and existing_champ.get('current_champion_id') != champ_1_id:
                update_data['current_champion_id'] = champ_1_id
            if champ_2_id and existing_champ.get('current_champion_2_id') != champ_2_id:
                update_data['current_champion_2_id'] = champ_2_id
            if not champ_2_id and len(champions) < 2:
                update_data['current_champion_2_id'] = None
            
            if update_data:
                db_patch("promotion_championships", f"id=eq.{existing_champ['id']}", update_data)
                logger.info(f"    Updated championship")
                updated += 1
            else:
                logger.info(f"    Already up to date")
        else:
            # Create new championship
            new_champ = db_post("promotion_championships", {
                "promotion_id": promo_id,
                "name": title_name,
                "short_name": short_name,
                "current_champion_id": champ_1_id,
                "current_champion_2_id": champ_2_id,
                "is_active": True,
                "sort_order": i,
            })
            if new_champ:
                logger.info(f"    Created championship")
                updated += 1
            else:
                logger.info(f"    Failed to create championship")
    
    return updated


def main():
    parser = argparse.ArgumentParser(description='Scrape championships from Cagematch')
    parser.add_argument('--promotion', type=str, help='Filter by promotion name/slug')
    parser.add_argument('--country', type=str, help='Filter by country')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of promotions to process')
    args = parser.parse_args()
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in .env")
        return
    
    promotions = get_promotions(filter_name=args.promotion, filter_country=args.country)
    
    if args.limit:
        promotions = promotions[:args.limit]
    
    print(f"Found {len(promotions)} promotions to process")
    
    if args.dry_run:
        print("DRY RUN — no changes will be saved\n")
    
    total_updated = 0
    processed = 0
    
    for promo in promotions:
        try:
            count = process_promotion(promo, dry_run=args.dry_run)
            total_updated += count
            processed += 1
        except Exception as e:
            logger.error(f"Error processing {promo['name']}: {e}")
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Promotions processed: {processed}")
    print(f"Championships created/updated: {total_updated}")


if __name__ == '__main__':
    main()
