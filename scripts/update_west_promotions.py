"""
HotTag - Update West Region Promotion Details
Adds city, Twitter handles, and websites for West region promotions

Usage:
    python update_west_promotions.py
"""

import requests
from config import SUPABASE_URL, HEADERS

# West region promotion details
WEST_PROMOTIONS = {
    'big time wrestling': {
        'city': 'Sacramento',
        'state': 'CA',
        'twitter_handle': 'BTWrestling',
        'website': 'https://bigtimewrestling.net',
    },
    'crimson crown wrestling': {
        'city': 'Hawaiian Gardens',
        'state': 'CA',
        'twitter_handle': 'CrimsonCrown',
    },
    'epic pro wrestling': {
        'city': 'Cudahy',
        'state': 'CA',
        'twitter_handle': 'EpicProWrestle',
    },
    'future stars of wrestling': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'FSWVegas',
        'website': 'https://fswvegas.com',
    },
    'juggalo championship wrestling': {
        'city': 'Detroit',
        'state': 'MI',
        'twitter_handle': 'JCWwrestling',
        'region': 'Midwest',
    },
    'lucha libre and laughs': {
        'city': 'Denver',
        'state': 'CO',
        'twitter_handle': 'lucaborhood',
    },
    'pandemonium: pro wrestling': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'PandemoniumLV',
    },
    'poder~! wrestling': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'PODERwrestling',
    },
    'pridestyle pro wrestling': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'PrideStylePro',
    },
    'pro wrestling guerrilla': {
        'city': 'Los Angeles',
        'state': 'CA',
        'twitter_handle': 'OfficialPWG',
        'website': 'https://prowrestlingguerrilla.com',
    },
    'pro wrestling unplugged': {
        'city': 'Philadelphia',
        'state': 'PA',
        'twitter_handle': 'PWUnplugged',
        'region': 'Mid Atlantic',
    },
    'santino bros. wrestling': {
        'city': 'Bell Gardens',
        'state': 'CA',
        'twitter_handle': 'SantinoBros',
        'website': 'https://santinobros.net',
    },
    'sean henderson presents': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'BigSeanHendersn',
    },
    'supreme pro wrestling': {
        'city': 'San Jose',
        'state': 'CA',
        'twitter_handle': 'SupremePro_',
    },
    'underground wrestling alliance': {
        'city': 'Los Angeles',
        'state': 'CA',
        'twitter_handle': 'UWALosAngeles',
    },
    'west coast pro wrestling': {
        'city': 'San Francisco',
        'state': 'CA',
        'twitter_handle': 'WCProWrestling',
        'website': 'https://westcoastprowrestling.com',
    },
    'wrestlecon': {
        'city': 'Various',
        'twitter_handle': 'wrestlecon',
        'website': 'https://wrestlecon.com',
        'region': 'National',
    },
    'x brand wrestling': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'XBrandWrestling',
    },
}


def get_promotions_by_region(region):
    """Get all promotions in a region"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?select=*&region=eq.{region}&order=name"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def update_promotion(promo_id, updates):
    """Update a promotion"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?id=eq.{promo_id}"
    response = requests.patch(url, headers=HEADERS, json=updates)
    return response.status_code == 204


def main():
    promotions = get_promotions_by_region('West')
    print(f"Found {len(promotions)} West region promotions\n")
    
    updated = 0
    not_found = []
    
    for promo in promotions:
        name = promo['name']
        name_lower = name.lower()
        
        # Find matching update data
        update_data = None
        for key, data in WEST_PROMOTIONS.items():
            if key in name_lower or name_lower in key:
                update_data = data
                break
        
        if not update_data:
            print(f"No data for: {name}")
            not_found.append(name)
            continue
        
        # Build changes - only update empty/different fields
        changes = {}
        for field, value in update_data.items():
            current = promo.get(field)
            if not current or (field == 'region' and current != value):
                changes[field] = value
        
        if changes:
            print(f"Updating {name}: {list(changes.keys())}")
            if update_promotion(promo['id'], changes):
                updated += 1
            else:
                print(f"  Failed!")
        else:
            print(f"Already complete: {name}")
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Promotions updated: {updated}")
    if not_found:
        print(f"\nNo data found for:")
        for name in not_found:
            print(f"  - {name}")


if __name__ == '__main__':
    main()
