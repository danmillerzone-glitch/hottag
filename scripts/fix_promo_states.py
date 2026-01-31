"""
HotTag - Quick Fix for Promotion Data Issues
"""

import requests
from config import SUPABASE_URL, HEADERS

# Fixes needed (name -> updates)
FIXES = {
    # International - remove incorrect US states
    'Consejo Mundial De Lucha Libre': {'state': None, 'country': 'Mexico'},
    'Dragon Gate USA': {'state': None, 'country': 'Japan'},
    'Marvelous That\'s Women Pro Wrestling': {'state': None, 'country': 'Japan'},
    'New Japan Pro Wrestling': {'state': None, 'country': 'Japan'},
    'PROGRESS Wrestling': {'state': None, 'country': 'UK'},
    'Rixe Catch': {'state': None, 'country': 'Canada'},
    
    # State corrections
    'Combat Zone Wrestling': {'state': 'NJ'},
    'East Coast Wrestling Association': {'state': 'DE'},
    'Pro Wrestling Unplugged': {'state': 'PA'},
    'Juggalo Championship Wrestling': {'state': 'MI'},
    'Saint Louis Anarchy': {'state': 'MO'},
    'Federacao Internacional de Luta Livre': {'state': 'PA'},
    'Guerra de Titanes': {'state': 'PA'},
    'National Wrestling Alliance': {'state': 'GA'},
    'WrestleCon': {'state': None},
}


def get_all_promotions():
    """Get all promotions"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?select=*&order=name"
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
    promotions = get_all_promotions()
    print(f"Found {len(promotions)} promotions\n")
    
    updated = 0
    
    for promo in promotions:
        name = promo['name']
        
        if name in FIXES:
            updates = FIXES[name]
            print(f"Fixing {name}: {updates}")
            if update_promotion(promo['id'], updates):
                updated += 1
            else:
                print(f"  Failed!")
    
    print(f"\n{'='*50}")
    print(f"Fixed {updated} promotions")


if __name__ == '__main__':
    main()
