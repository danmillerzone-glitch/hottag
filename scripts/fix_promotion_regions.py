"""
HotTag - Assign regions to promotions based on their state
Also tries to infer state from promotion name or events

Usage:
    python fix_promotion_regions.py
"""

import requests
from config import SUPABASE_URL, SUPABASE_KEY, HEADERS

# State to region mapping
STATE_TO_REGION = {
    # Northeast
    'NY': 'Northeast',
    'NJ': 'Northeast',
    'CT': 'Northeast',
    'MA': 'Northeast',
    'RI': 'Northeast',
    'NH': 'Northeast',
    'VT': 'Northeast',
    'ME': 'Northeast',
    
    # Mid Atlantic
    'PA': 'Mid Atlantic',
    'DE': 'Mid Atlantic',
    'MD': 'Mid Atlantic',
    'DC': 'Mid Atlantic',
    'VA': 'Mid Atlantic',
    'WV': 'Mid Atlantic',
    
    # Southeast
    'NC': 'Southeast',
    'SC': 'Southeast',
    'GA': 'Southeast',
    'FL': 'Southeast',
    'AL': 'Southeast',
    'MS': 'Southeast',
    'TN': 'Southeast',
    'KY': 'Southeast',
    
    # South
    'TX': 'South',
    'LA': 'South',
    'AR': 'South',
    'OK': 'South',
    
    # Midwest
    'OH': 'Midwest',
    'MI': 'Midwest',
    'IN': 'Midwest',
    'IL': 'Midwest',
    'WI': 'Midwest',
    'MN': 'Midwest',
    'IA': 'Midwest',
    'MO': 'Midwest',
    'KS': 'Midwest',
    'NE': 'Midwest',
    'SD': 'Midwest',
    'ND': 'Midwest',
    
    # West
    'CA': 'West',
    'NV': 'West',
    'AZ': 'West',
    'NM': 'West',
    'CO': 'West',
    'UT': 'West',
    'WY': 'West',
    'MT': 'West',
    'ID': 'West',
    'HI': 'West',
    
    # Pacific Northwest
    'WA': 'Pacific Northwest',
    'OR': 'Pacific Northwest',
    'AK': 'Pacific Northwest',
}

# Known national promotions
NATIONAL_PROMOTIONS = [
    'gcw', 'game changer wrestling',
    'aew', 'all elite wrestling',
    'wwe', 'world wrestling entertainment',
    'tna', 'impact wrestling',
    'roh', 'ring of honor',
    'njpw', 'new japan',
    'mlw', 'major league wrestling',
]


def get_promotions():
    """Get all promotions"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?select=id,name,slug,state,region&order=name"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def get_promotion_events(promotion_id):
    """Get events for a promotion to infer location"""
    url = f"{SUPABASE_URL}/rest/v1/events?select=state&promotion_id=eq.{promotion_id}&state=not.is.null&limit=10"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def infer_state_from_name(name):
    """Try to infer state from promotion name"""
    name_lower = name.lower()
    
    state_keywords = {
        'TX': ['texas', ' tx ', 'houston', 'dallas', 'austin', 'san antonio'],
        'CA': ['california', 'socal', 'norcal', ' ca ', 'los angeles', 'san diego', 'bay area'],
        'FL': ['florida', ' fl ', 'miami', 'tampa', 'orlando'],
        'NY': ['new york', ' ny ', 'nyc', 'brooklyn', 'queens'],
        'PA': ['pennsylvania', ' pa ', 'philly', 'philadelphia', 'pittsburgh'],
        'OH': ['ohio', ' oh ', 'cleveland', 'cincinnati', 'columbus'],
        'IL': ['illinois', ' il ', 'chicago'],
        'GA': ['georgia', ' ga ', 'atlanta'],
        'NC': ['north carolina', ' nc ', 'carolina'],
        'NJ': ['new jersey', ' nj ', 'jersey'],
        'MA': ['massachusetts', ' ma ', 'boston'],
        'TN': ['tennessee', ' tn ', 'nashville', 'memphis'],
        'AZ': ['arizona', ' az ', 'phoenix'],
        'NV': ['nevada', ' nv ', 'vegas', 'las vegas'],
        'WA': ['washington', ' wa ', 'seattle', 'pacific northwest', 'pnw'],
        'OR': ['oregon', ' or ', 'portland'],
        'MI': ['michigan', ' mi ', 'detroit'],
        'IN': ['indiana', ' in ', 'indianapolis'],
        'WI': ['wisconsin', ' wi ', 'milwaukee'],
        'MN': ['minnesota', ' mn ', 'minneapolis'],
        'MO': ['missouri', ' mo ', 'st louis', 'kansas city'],
        'KY': ['kentucky', ' ky ', 'louisville'],
        'LA': ['louisiana', ' la ', 'new orleans'],
        'AL': ['alabama', ' al '],
        'SC': ['south carolina', ' sc '],
        'VA': ['virginia', ' va '],
        'MD': ['maryland', ' md ', 'baltimore'],
        'CO': ['colorado', ' co ', 'denver'],
    }
    
    for state, keywords in state_keywords.items():
        for kw in keywords:
            if kw in name_lower:
                return state
    
    return None


def update_promotion(promotion_id, updates):
    """Update a promotion"""
    url = f"{SUPABASE_URL}/rest/v1/promotions?id=eq.{promotion_id}"
    response = requests.patch(url, headers=HEADERS, json=updates)
    return response.status_code == 204


def main():
    promotions = get_promotions()
    print(f"Found {len(promotions)} promotions")
    
    updated = 0
    skipped = 0
    
    for promo in promotions:
        updates = {}
        
        # Check if it's a national promotion
        name_lower = promo['name'].lower()
        if any(nat in name_lower for nat in NATIONAL_PROMOTIONS):
            if promo.get('region') != 'National':
                updates['region'] = 'National'
        
        # Try to determine state
        state = promo.get('state')
        
        # If no state, try to infer from name
        if not state:
            state = infer_state_from_name(promo['name'])
            if state:
                updates['state'] = state
                print(f"  Inferred state {state} from name: {promo['name']}")
        
        # If still no state, check events
        if not state:
            events = get_promotion_events(promo['id'])
            if events:
                # Get most common state
                states = [e['state'] for e in events if e.get('state')]
                if states:
                    from collections import Counter
                    state = Counter(states).most_common(1)[0][0]
                    updates['state'] = state
                    print(f"  Inferred state {state} from events: {promo['name']}")
        
        # Determine region from state
        if state and state in STATE_TO_REGION:
            region = STATE_TO_REGION[state]
            if promo.get('region') != region and 'region' not in updates:
                updates['region'] = region
        
        # Apply updates
        if updates:
            if update_promotion(promo['id'], updates):
                print(f"Updated {promo['name']}: {updates}")
                updated += 1
            else:
                print(f"Failed to update {promo['name']}")
                skipped += 1
        else:
            skipped += 1
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Promotions checked: {len(promotions)}")
    print(f"Promotions updated: {updated}")
    print(f"Promotions skipped: {skipped}")


if __name__ == '__main__':
    main()
