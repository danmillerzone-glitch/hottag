"""
HotTag - Link Wrestlers to Events
Scrapes event cards from Cagematch and links wrestlers to events

Usage:
    python link_wrestlers_to_events.py
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

# Supabase configuration
SUPABASE_URL = "https://floznswkfodjuigfzkki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb3puc3drZm9kanVpZ2Z6a2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMzMzOSwiZXhwIjoyMDg1MjA5MzM5fQ.dRzAdv_LPUXeMv8Ns2HPR2VVQ3PxFZ3TGBtWznCA-Qk"

API_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


def get_events_from_db():
    """Get all events with cagematch_id"""
    url = f"{SUPABASE_URL}/rest/v1/events?select=id,name,cagematch_id&not.cagematch_id.is.null"
    response = requests.get(url, headers=API_HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def get_wrestlers_from_db():
    """Get all wrestlers with cagematch_id"""
    url = f"{SUPABASE_URL}/rest/v1/wrestlers?select=id,name,cagematch_id"
    response = requests.get(url, headers=API_HEADERS)
    if response.status_code == 200:
        # Create lookup by cagematch_id and by name
        wrestlers = response.json()
        by_cm_id = {w['cagematch_id']: w for w in wrestlers if w['cagematch_id']}
        by_name = {w['name'].lower(): w for w in wrestlers}
        return by_cm_id, by_name
    return {}, {}


def get_existing_links():
    """Get existing event-wrestler links"""
    url = f"{SUPABASE_URL}/rest/v1/event_wrestlers?select=event_id,wrestler_id"
    response = requests.get(url, headers=API_HEADERS)
    if response.status_code == 200:
        return set((l['event_id'], l['wrestler_id']) for l in response.json())
    return set()


def scrape_event_card(cagematch_id):
    """Scrape wrestlers from an event card"""
    url = f"{BASE_URL}/?id=1&nr={cagematch_id}&page=2"
    
    try:
        time.sleep(1)
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        wrestlers = []
        wrestler_links = soup.find_all('a', href=lambda h: h and 'id=2' in h and 'nr=' in h)
        
        seen_ids = set()
        for link in wrestler_links:
            href = link.get('href', '')
            match = re.search(r'nr=(\d+)', href)
            if match:
                cm_id = int(match.group(1))
                if cm_id not in seen_ids:
                    seen_ids.add(cm_id)
                    name = link.get_text(strip=True)
                    wrestlers.append({
                        'name': name,
                        'cagematch_id': cm_id
                    })
        
        return wrestlers
        
    except Exception as e:
        print(f"  Error scraping card: {e}")
        return []


def link_wrestler_to_event(event_id, wrestler_id, match_order=None):
    """Create link between wrestler and event"""
    data = {
        'event_id': event_id,
        'wrestler_id': wrestler_id,
    }
    if match_order:
        data['match_order'] = match_order
    
    url = f"{SUPABASE_URL}/rest/v1/event_wrestlers"
    response = requests.post(url, headers=API_HEADERS, json=data)
    
    return response.status_code == 201


def create_wrestler(name, cagematch_id):
    """Create a new wrestler in the database"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    
    data = {
        'name': name,
        'slug': slug,
        'cagematch_id': cagematch_id,
    }
    
    url = f"{SUPABASE_URL}/rest/v1/wrestlers"
    headers = {**API_HEADERS, "Prefer": "return=representation"}
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        return response.json()[0]
    return None


def main():
    print("Loading data from database...\n")
    
    events = get_events_from_db()
    print(f"Found {len(events)} events with Cagematch IDs")
    
    wrestlers_by_cm_id, wrestlers_by_name = get_wrestlers_from_db()
    print(f"Found {len(wrestlers_by_cm_id)} wrestlers with Cagematch IDs")
    
    existing_links = get_existing_links()
    print(f"Found {len(existing_links)} existing wrestler-event links")
    
    print("\n" + "="*50)
    print("Scraping event cards...")
    print("="*50 + "\n")
    
    total_links_created = 0
    total_wrestlers_created = 0
    events_with_cards = 0
    
    for event in events:
        event_id = event['id']
        event_name = event['name']
        cagematch_id = event['cagematch_id']
        
        print(f"Checking: {event_name[:50]}...", end=" ")
        
        card_wrestlers = scrape_event_card(cagematch_id)
        
        if not card_wrestlers:
            print("No card")
            continue
        
        events_with_cards += 1
        links_created = 0
        
        print(f"{len(card_wrestlers)} wrestlers")
        
        for i, cw in enumerate(card_wrestlers):
            wrestler_cm_id = cw['cagematch_id']
            wrestler_name = cw['name']
            
            # Find wrestler in our database
            wrestler = wrestlers_by_cm_id.get(wrestler_cm_id)
            
            if not wrestler:
                # Try by name
                wrestler = wrestlers_by_name.get(wrestler_name.lower())
            
            if not wrestler:
                # Create new wrestler
                new_wrestler = create_wrestler(wrestler_name, wrestler_cm_id)
                if new_wrestler:
                    wrestler = new_wrestler
                    wrestlers_by_cm_id[wrestler_cm_id] = wrestler
                    wrestlers_by_name[wrestler_name.lower()] = wrestler
                    total_wrestlers_created += 1
                    print(f"    + Created wrestler: {wrestler_name}")
            
            if wrestler:
                link_key = (event_id, wrestler['id'])
                if link_key not in existing_links:
                    if link_wrestler_to_event(event_id, wrestler['id'], i + 1):
                        existing_links.add(link_key)
                        links_created += 1
        
        if links_created > 0:
            print(f"    → Linked {links_created} wrestlers")
            total_links_created += links_created
    
    # Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Events checked: {len(events)}")
    print(f"Events with cards: {events_with_cards}")
    print(f"New wrestlers created: {total_wrestlers_created}")
    print(f"Wrestler-event links created: {total_links_created}")


if __name__ == '__main__':
    main()
