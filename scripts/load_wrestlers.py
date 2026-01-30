"""
HotTag - Load wrestlers into Supabase

Usage:
    python load_wrestlers.py wrestlers.json
"""

import json
import requests
import argparse
import re

# Supabase configuration
SUPABASE_URL = "https://floznswkfodjuigfzkki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb3puc3drZm9kanVpZ2Z6a2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMzMzOSwiZXhwIjoyMDg1MjA5MzM5fQ.dRzAdv_LPUXeMv8Ns2HPR2VVQ3PxFZ3TGBtWznCA-Qk"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


def create_slug(name):
    """Create URL-safe slug from name"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug


def get_existing_wrestlers():
    """Get existing wrestler cagematch_ids"""
    url = f"{SUPABASE_URL}/rest/v1/wrestlers?select=cagematch_id"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return set(w['cagematch_id'] for w in response.json() if w['cagematch_id'])
    return set()


def insert_wrestler(wrestler):
    """Insert a wrestler into the database"""
    data = {
        'name': wrestler.get('name') or wrestler.get('ring_name'),
        'slug': create_slug(wrestler.get('name') or wrestler.get('ring_name', 'unknown')),
        'hometown': wrestler.get('hometown') or wrestler.get('birthplace'),
        'photo_url': wrestler.get('photo_url'),
        'twitter_handle': wrestler.get('twitter_handle'),
        'cagematch_id': wrestler.get('cagematch_id'),
        'bio': None,
    }
    
    # Skip if no name
    if not data['name']:
        return False
    
    url = f"{SUPABASE_URL}/rest/v1/wrestlers"
    response = requests.post(url, headers=HEADERS, json=data)
    
    return response.status_code == 201


def main():
    parser = argparse.ArgumentParser(description='Load wrestlers into Supabase')
    parser.add_argument('input', help='Input JSON file')
    args = parser.parse_args()
    
    # Load wrestlers from file
    with open(args.input, 'r', encoding='utf-8') as f:
        wrestlers = json.load(f)
    
    print(f"Loaded {len(wrestlers)} wrestlers from {args.input}")
    
    # Get existing wrestlers
    print("Checking existing wrestlers...")
    existing = get_existing_wrestlers()
    print(f"Found {len(existing)} existing wrestlers")
    
    # Insert wrestlers
    created = 0
    skipped = 0
    errors = 0
    
    for wrestler in wrestlers:
        cagematch_id = wrestler.get('cagematch_id')
        name = wrestler.get('name') or wrestler.get('ring_name')
        
        if not name:
            errors += 1
            continue
        
        if cagematch_id and cagematch_id in existing:
            skipped += 1
            continue
        
        if insert_wrestler(wrestler):
            created += 1
            print(f"  ✓ {name}")
            if cagematch_id:
                existing.add(cagematch_id)
        else:
            errors += 1
            print(f"  ✗ {name}")
    
    # Summary
    print(f"\n{'='*50}")
    print("LOAD SUMMARY")
    print(f"{'='*50}")
    print(f"Wrestlers created: {created}")
    print(f"Skipped (duplicates): {skipped}")
    print(f"Errors: {errors}")


if __name__ == '__main__':
    main()
