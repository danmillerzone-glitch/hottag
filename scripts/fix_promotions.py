"""
HotTag - Fix Promotion Data
- Delete WWE, AEW, TNA/Impact
- Set International region for foreign promotions
- Update specific promotion details

Usage:
    python fix_promotions.py
"""

import requests
from config import SUPABASE_URL, HEADERS

# Promotions to DELETE (major companies we don't want)
PROMOTIONS_TO_DELETE = [
    'all elite wrestling',
    'aew',
    'world wrestling entertainment',
    'wwe',
    'total nonstop action',
    'tna',
    'impact wrestling',
    'impact!',
]

# International promotions (set region to 'International')
INTERNATIONAL_PROMOTIONS = [
    'marvelous',
    'cmll',
    'consejo mundial de lucha libre',
    'aaa',
    'lucha libre aaa',
    'njpw',
    'new japan',
    'stardom',
    'noah',
    'pro wrestling noah',
    'dragon gate',
    'ddt',
    'ajpw',
    'all japan',
    'joshi',
    'ice ribbon',
    'tjpw',
    'tokyo joshi',
    'oz academy',
    'sendai girls',
    'wave',
    'revpro',
    'progress',
    'riptide',
    'attack!',
    'fight club pro',
    'defiant',
    'wcpw',
    'wxxw',
    'gfw',
]

# Promotion details to update (name -> {field: value})
PROMOTION_UPDATES = {
    'new texas pro wrestling': {
        'city': 'Austin',
        'state': 'TX',
        'twitter_handle': 'NewTexasPro',
        'website': 'https://newtexaspro.com',
        'region': 'South',
    },
    'game changer wrestling': {
        'city': 'Atlantic City',
        'state': 'NJ',
        'twitter_handle': 'GCWrestling_',
        'website': 'https://www.gcwrestling.com',
        'region': 'National',
    },
    'gcw': {
        'city': 'Atlantic City',
        'state': 'NJ',
        'twitter_handle': 'GCWrestling_',
        'website': 'https://www.gcwrestling.com',
        'region': 'National',
    },
    'pro wrestling guerrilla': {
        'city': 'Los Angeles',
        'state': 'CA',
        'twitter_handle': 'OfficialPWG',
        'website': 'https://www.prowrestlingguerrilla.com',
        'region': 'West',
    },
    'pwg': {
        'city': 'Los Angeles',
        'state': 'CA',
        'twitter_handle': 'OfficialPWG',
        'website': 'https://www.prowrestlingguerrilla.com',
        'region': 'West',
    },
    'black label pro': {
        'city': 'Crown Point',
        'state': 'IN',
        'twitter_handle': 'BLabelPro',
        'website': 'https://blacklabelpro.com',
        'region': 'Midwest',
    },
    'beyond wrestling': {
        'city': 'Worcester',
        'state': 'MA',
        'twitter_handle': 'beyaborhood',
        'website': 'https://beyondwrestlingonline.com',
        'region': 'Northeast',
    },
    'defy wrestling': {
        'city': 'Seattle',
        'state': 'WA',
        'twitter_handle': 'DEFYNorthwest',
        'website': 'https://defywrestling.com',
        'region': 'Pacific Northwest',
    },
    'ring of honor': {
        'region': 'National',
    },
    'roh': {
        'region': 'National',
    },
    'major league wrestling': {
        'region': 'National',
    },
    'mlw': {
        'region': 'National',
    },
}


def get_all_promotions():
    """Get all promotions"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?select=*&order=name"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def delete_promotion(promo_id, name):
    """Delete a promotion and its events"""
    # First delete events for this promotion
    url = f"{SUPABASE_URL}/rest/v1/events?promotion_id=eq.{promo_id}"
    response = requests.delete(url, headers=HEADERS)
    if response.status_code == 204:
        print(f"  Deleted events for {name}")
    
    # Then delete the promotion
    url = f"{SUPABASE_URL}/rest/v1/promotions?id=eq.{promo_id}"
    response = requests.delete(url, headers=HEADERS)
    return response.status_code == 204


def update_promotion(promo_id, updates):
    """Update a promotion"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?id=eq.{promo_id}"
    response = requests.patch(url, headers=HEADERS, json=updates)
    return response.status_code == 204


def main():
    promotions = get_all_promotions()
    print(f"Found {len(promotions)} promotions\n")
    
    deleted = 0
    updated = 0
    international = 0
    
    for promo in promotions:
        name = promo['name']
        name_lower = name.lower()
        
        # Check if should be deleted
        should_delete = any(d in name_lower for d in PROMOTIONS_TO_DELETE)
        if should_delete:
            print(f"DELETING: {name}")
            if delete_promotion(promo['id'], name):
                deleted += 1
            continue
        
        # Check if international
        is_international = any(i in name_lower for i in INTERNATIONAL_PROMOTIONS)
        if is_international and promo.get('region') != 'International':
            print(f"Setting International: {name}")
            if update_promotion(promo['id'], {'region': 'International'}):
                international += 1
            continue
        
        # Check for specific updates
        for key, updates in PROMOTION_UPDATES.items():
            if key in name_lower:
                # Only update if there are actual changes
                changes = {}
                for field, value in updates.items():
                    if promo.get(field) != value:
                        changes[field] = value
                
                if changes:
                    print(f"Updating {name}: {changes}")
                    if update_promotion(promo['id'], changes):
                        updated += 1
                break
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Promotions deleted: {deleted}")
    print(f"Set to International: {international}")
    print(f"Details updated: {updated}")


if __name__ == '__main__':
    main()
