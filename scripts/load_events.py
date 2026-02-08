"""
HotTag - Load scraped events into Supabase
Uses the Supabase REST API directly (no SDK needed)

Usage:
    python load_events.py events.json
"""

import json
import requests
import argparse
from datetime import datetime
from config import SUPABASE_URL, SUPABASE_KEY, HEADERS

# Add Prefer header for this script
HEADERS = {**HEADERS, "Prefer": "return=minimal"}


def get_promotions():
    """Fetch all promotions from database"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?select=id,name,slug"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return {p['name'].lower(): p for p in response.json()}
    return {}


def get_existing_events():
    """Fetch existing event cagematch_ids to avoid duplicates"""
    url = f"{SUPABASE_URL}/rest/v1/events?select=cagematch_id&not.cagematch_id.is.null"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return set(e['cagematch_id'] for e in response.json() if e['cagematch_id'])
    return set()


COUNTRY_TO_REGION = {
    'USA': None,  # US promotions get region from state
    'Canada': 'Canada',
    'Mexico': 'Mexico',
    'Japan': 'Japan',
    'UK': 'United Kingdom', 'England': 'United Kingdom', 'Scotland': 'United Kingdom', 'Wales': 'United Kingdom', 'Northern Ireland': 'United Kingdom',
    'Germany': 'Europe', 'Deutschland': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
    'Austria': 'Europe', 'Switzerland': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
    'Poland': 'Europe', 'Czech Republic': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe',
    'Finland': 'Europe', 'Denmark': 'Europe', 'Ireland': 'Europe', 'Portugal': 'Europe',
    'Romania': 'Europe', 'Hungary': 'Europe', 'Bulgaria': 'Europe', 'Croatia': 'Europe',
    'Serbia': 'Europe', 'Greece': 'Europe', 'Turkey': 'Europe',
    'Australia': 'Australia & New Zealand', 'New Zealand': 'Australia & New Zealand',
    'Brazil': 'Latin America', 'Argentina': 'Latin America', 'Chile': 'Latin America', 'Colombia': 'Latin America', 'Peru': 'Latin America',
    'India': 'Asia', 'China': 'Asia', 'South Korea': 'Asia', 'Korea': 'Asia',
    'Philippines': 'Asia', 'Singapore': 'Asia', 'Malaysia': 'Asia', 'Thailand': 'Asia',
    'Indonesia': 'Asia', 'Vietnam': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia',
    'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
    'Saudi Arabia': 'Middle East', 'Saudi-Arabia': 'Middle East', 'UAE': 'Middle East', 'Israel': 'Middle East',
    'Puerto Rico': 'Puerto Rico',
}


def get_region_for_country(country):
    """Map country to a region"""
    if not country:
        return None
    return COUNTRY_TO_REGION.get(country, 'International')


def create_promotion(name, country=None):
    """Create a new promotion and return its ID"""
    slug = name.lower().replace(' ', '-').replace(':', '').replace("'", '')
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    promo_country = country or 'USA'
    region = get_region_for_country(promo_country)
    
    data = {
        "name": name,
        "slug": slug,
        "country": promo_country,
    }
    if region:
        data["region"] = region
    
    url = f"{SUPABASE_URL}/rest/v1/promotions"
    headers = {**HEADERS, "Prefer": "return=representation"}
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        return response.json()[0]
    else:
        print(f"  Failed to create promotion {name}: {response.text}")
        return None


def insert_event(event, promotion_id):
    """Insert a single event"""
    data = {
        "name": event['name'],
        "event_date": event['event_date'],
        "city": event.get('city'),
        "state": event.get('state'),
        "country": event.get('country', 'USA'),
        "promotion_id": promotion_id,
        "cagematch_id": event.get('cagematch_id'),
        "source_url": event.get('cagematch_url'),
        "source_name": "cagematch",
        "status": "upcoming"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/events"
    response = requests.post(url, headers=HEADERS, json=data)
    
    return response.status_code == 201


def main():
    parser = argparse.ArgumentParser(description='Load events into Supabase')
    parser.add_argument('input', help='Input JSON file')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of events to load')
    args = parser.parse_args()
    
    # Load events from file
    with open(args.input, 'r') as f:
        events = json.load(f)
    
    print(f"Loaded {len(events)} events from {args.input}")
    
    if args.limit:
        events = events[:args.limit]
        print(f"Limited to {len(events)} events")
    
    # Get existing data
    print("Fetching existing promotions...")
    promotions = get_promotions()
    print(f"Found {len(promotions)} existing promotions")
    
    print("Fetching existing events...")
    existing_ids = get_existing_events()
    print(f"Found {len(existing_ids)} existing events with cagematch_id")
    
    # Process events
    created = 0
    skipped = 0
    errors = 0
    new_promotions = 0
    
    for i, event in enumerate(events):
        if (i + 1) % 50 == 0:
            print(f"Processing event {i + 1}/{len(events)}...")
        
        # Skip if already exists
        if event.get('cagematch_id') and event['cagematch_id'] in existing_ids:
            skipped += 1
            continue
        
        # Find or create promotion
        promo_name = event.get('promotion_name')
        promotion_id = None
        
        if promo_name:
            promo_key = promo_name.lower()
            
            if promo_key in promotions:
                promotion_id = promotions[promo_key]['id']
            else:
                # Try to find by partial match
                found = False
                for key, promo in promotions.items():
                    if promo_key in key or key in promo_key:
                        promotion_id = promo['id']
                        found = True
                        break
                
                if not found:
                    # Create new promotion
                    event_country = event.get('country', 'USA')
                    print(f"  Creating new promotion: {promo_name} ({event_country})")
                    new_promo = create_promotion(promo_name, country=event_country)
                    if new_promo:
                        promotions[promo_key] = new_promo
                        promotion_id = new_promo['id']
                        new_promotions += 1
        
        # Insert event
        if insert_event(event, promotion_id):
            created += 1
            if event.get('cagematch_id'):
                existing_ids.add(event['cagematch_id'])
        else:
            errors += 1
    
    # Summary
    print(f"\n{'='*50}")
    print("LOAD SUMMARY")
    print(f"{'='*50}")
    print(f"Events created: {created}")
    print(f"Events skipped (duplicates): {skipped}")
    print(f"Errors: {errors}")
    print(f"New promotions created: {new_promotions}")
    
    # Country breakdown of created events
    if created > 0:
        countries = {}
        for event in events:
            c = event.get('country', 'USA')
            if c:
                countries[c] = countries.get(c, 0) + 1
        print(f"\nEvents by country:")
        for c, count in sorted(countries.items(), key=lambda x: -x[1])[:15]:
            print(f"  {c}: {count}")


if __name__ == '__main__':
    main()
