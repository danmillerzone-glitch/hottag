"""
HotTag - Update All Promotion Details
Updates city, state, Twitter handles, and websites for all promotions

Usage:
    python update_all_promotions.py
"""

import requests
from config import SUPABASE_URL, HEADERS

# All promotion details by name (lowercase)
ALL_PROMOTIONS = {
    # ==================== INTERNATIONAL ====================
    'consejo mundial de lucha libre': {
        'city': 'Mexico City',
        'state': None,
        'country': 'Mexico',
        'twitter_handle': 'ABORRECMLL',
    },
    'dragon gate usa': {
        'city': 'Tokyo',
        'state': None,
        'country': 'Japan',
        'twitter_handle': 'DragonGateEN',
    },
    'marvelous': {
        'city': 'Tokyo',
        'state': None,
        'country': 'Japan',
        'twitter_handle': 'maraborusjoshi',
    },
    'new japan pro wrestling': {
        'city': 'Tokyo',
        'state': None,
        'country': 'Japan',
        'twitter_handle': 'njpwglobal',
        'website': 'https://njpwworld.com',
    },
    'progress wrestling': {
        'city': 'London',
        'state': None,
        'country': 'UK',
        'twitter_handle': 'ThisIs_Progress',
        'website': 'https://progresswrestling.com',
    },
    
    # ==================== MID ATLANTIC ====================
    'bloodstone wrestling': {
        'city': 'Pittsburgh',
        'state': 'PA',
        'twitter_handle': 'BloodStoneWres',
    },
    'combat zone wrestling': {
        'city': 'Voorhees',
        'state': 'NJ',
        'twitter_handle': 'combaborezone',
        'website': 'https://czwrestling.com',
    },
    'enjoy wrestling': {
        'city': 'Pittsburgh',
        'state': 'PA',
        'twitter_handle': 'EnjoyWrestling',
    },
    'federacao internacional de luta livre': {
        'city': 'Philadelphia',
        'state': 'PA',
        'twitter_handle': 'fill_wrestling',
        'region': 'Mid Atlantic',
    },
    'guerra de titanes': {
        'city': 'Philadelphia',
        'state': 'PA',
        'region': 'Mid Atlantic',
    },
    'labor of love': {
        'city': 'Philadelphia',
        'state': 'PA',
        'twitter_handle': 'laboroflovepa',
    },
    'pennsylvania premiere wrestling': {
        'city': 'Pottsville',
        'state': 'PA',
        'twitter_handle': 'PPWrestling_',
    },
    'power pro lucha': {
        'city': 'Philadelphia',
        'state': 'PA',
        'twitter_handle': 'PowerProLucha',
    },
    'pro wrestling unplugged': {
        'city': 'Philadelphia',
        'state': 'PA',
        'twitter_handle': 'PWUnplugged',
        'region': 'Mid Atlantic',
    },
    'the establishment wrestling': {
        'city': 'Richmond',
        'state': 'VA',
        'twitter_handle': 'EstablishWres',
    },
    'virginia championship wrestling': {
        'city': 'Virginia Beach',
        'state': 'VA',
        'twitter_handle': 'VCWonline',
    },
    
    # ==================== MIDWEST ====================
    'aaw': {
        'city': 'Chicago',
        'state': 'IL',
        'twitter_handle': 'AAWPro',
        'website': 'https://aaborregon.com',
    },
    'absolute intense wrestling': {
        'city': 'Cleveland',
        'state': 'OH',
        'twitter_handle': 'aaborregon',
        'website': 'https://aiwrestling.com',
    },
    'black label pro': {
        'city': 'Crown Point',
        'state': 'IN',
        'twitter_handle': 'BLabelPro',
        'website': 'https://blacklabelpro.com',
    },
    'freelance wrestling': {
        'city': 'Chicago',
        'state': 'IL',
        'twitter_handle': 'FreelanceWres',
    },
    'frontier elite wrestling': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'FEWrestling',
    },
    'generation next pro wrestling': {
        'city': 'Columbus',
        'state': 'OH',
        'twitter_handle': 'GenNextPro',
    },
    'girl fight wrestling': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'GirlFightWres',
    },
    'glory pro wrestling': {
        'city': 'St. Louis',
        'state': 'MO',
        'twitter_handle': 'GloryProWrestle',
    },
    'higher ground wrestling': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'HigherGroundPro',
    },
    'hooligan championship wrestling': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'HooliganCW',
    },
    'juggalo championship wrestling': {
        'city': 'Detroit',
        'state': 'MI',
        'twitter_handle': 'JCWwrestling',
        'region': 'Midwest',
    },
    'midwest all-star wrestling': {
        'city': 'Beloit',
        'state': 'WI',
        'twitter_handle': 'MidwestAllStar',
    },
    'midwest territory': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'MWTerritory',
    },
    'minnesota independent wrestling': {
        'city': 'Minneapolis',
        'state': 'MN',
        'twitter_handle': 'MIWrestling',
    },
    'ragin pro wrestling': {
        'city': 'St. Nazianz',
        'state': 'WI',
        'twitter_handle': 'RaginProWres',
    },
    'revolution championship wrestling': {
        'city': 'Fort Wayne',
        'state': 'IN',
        'twitter_handle': 'RCWrestling',
    },
    'saint louis anarchy': {
        'city': 'St. Louis',
        'state': 'MO',
        'twitter_handle': 'STLAnarchy',
    },
    'shimmer women athletes': {
        'city': 'Chicago',
        'state': 'IL',
        'twitter_handle': 'SHIMMERwomen',
        'website': 'https://shimmerwrestling.com',
    },
    'warrior wrestling': {
        'city': 'Chicago Heights',
        'state': 'IL',
        'twitter_handle': 'WarriorWrstlng',
        'website': 'https://warriorwrestling.net',
    },
    'we love wrestling': {
        'city': 'Detroit',
        'state': 'MI',
        'twitter_handle': 'WeLoveWrestle',
    },
    'wrestlearts': {
        'city': 'Indianapolis',
        'state': 'IN',
        'twitter_handle': 'WrestleARTS',
    },
    'wrestling in the usa': {
        'city': 'Chicago',
        'state': 'IL',
        'twitter_handle': 'FreelanceWres',
    },
    'wrestling revolver': {
        'city': 'Des Moines',
        'state': 'IA',
        'twitter_handle': 'TheWrestlingRev',
    },
    
    # ==================== NATIONAL ====================
    'game changer wrestling': {
        'city': 'Atlantic City',
        'state': 'NJ',
        'twitter_handle': 'GCWrestling_',
        'website': 'https://gcwrestling.com',
    },
    'major league wrestling': {
        'city': 'Atlanta',
        'state': 'GA',
        'twitter_handle': 'MLW',
        'website': 'https://mlw.com',
    },
    'wrestlecon': {
        'city': 'Various',
        'state': None,
        'twitter_handle': 'wrestlecon',
        'website': 'https://wrestlecon.com',
    },
    
    # ==================== NORTHEAST ====================
    'awesome championship wrestling': {
        'city': 'Long Island',
        'state': 'NY',
        'twitter_handle': 'ACWonline',
    },
    'beyond wrestling': {
        'city': 'Worcester',
        'state': 'MA',
        'twitter_handle': 'beyaborhood',
        'website': 'https://beyondwrestlingonline.com',
    },
    'blitzkrieg! pro': {
        'city': 'Boston',
        'state': 'MA',
        'twitter_handle': 'BlsitzkriegPro',
    },
    'east coast wrestling association': {
        'city': 'Newark',
        'state': 'DE',
        'twitter_handle': 'ECWAonline',
        'website': 'https://ecwapro.com',
    },
    'expect the unexpected wrestling': {
        'city': 'New Jersey',
        'state': 'NJ',
        'twitter_handle': 'ETUWrestling',
    },
    'focus pro wrestling': {
        'city': 'Boston',
        'state': 'MA',
        'twitter_handle': 'FocusProWres',
    },
    'green mountain wrestling': {
        'city': 'Burlington',
        'state': 'VT',
        'twitter_handle': 'GMWrestling',
    },
    'house of glory': {
        'city': 'New York',
        'state': 'NY',
        'twitter_handle': 'HOGwrestling',
        'website': 'https://hogwrestling.net',
    },
    'limitless wrestling': {
        'city': 'Portland',
        'state': 'ME',
        'twitter_handle': 'LWMaine',
        'website': 'https://limitlesswrestling.com',
    },
    'new fear city': {
        'city': 'New York',
        'state': 'NY',
        'twitter_handle': 'NewFearCity',
    },
    'new york wrestling connection': {
        'city': 'Deer Park',
        'state': 'NY',
        'twitter_handle': 'NYWCwrestling',
        'website': 'https://nywcwrestling.com',
    },
    'pro wrestling junkie': {
        'city': 'New Jersey',
        'state': 'NJ',
        'twitter_handle': 'PWJunkieNJ',
    },
    'pro wrestling symphony': {
        'city': 'Boston',
        'state': 'MA',
        'twitter_handle': 'ProWresSymphony',
    },
    'super nova wrestling': {
        'city': 'Boston',
        'state': 'MA',
        'twitter_handle': 'SuperNovaWres',
    },
    'titan championship wrestling': {
        'city': 'New Jersey',
        'state': 'NJ',
        'twitter_handle': 'TitanCWrestling',
    },
    
    # ==================== PACIFIC NORTHWEST ====================
    '907 pro wrestling': {
        'city': 'Anchorage',
        'state': 'AK',
        'twitter_handle': '907ProWrestling',
    },
    'defy wrestling': {
        'city': 'Seattle',
        'state': 'WA',
        'twitter_handle': 'DEFYNorthwest',
        'website': 'https://defywrestling.com',
    },
    'prestige wrestling': {
        'city': 'Portland',
        'state': 'OR',
        'twitter_handle': 'WeArePrestige',
        'website': 'https://prestigewrestling.com',
    },
    'sos pro wrestling': {
        'city': 'Tacoma',
        'state': 'WA',
        'twitter_handle': 'SOSProWrestling',
    },
    
    # ==================== SOUTH ====================
    'lost art of wrestling': {
        'city': 'New Orleans',
        'state': 'LA',
        'twitter_handle': 'LostArtWres',
    },
    'metroplex wrestling': {
        'city': 'Dallas',
        'state': 'TX',
        'twitter_handle': 'MetroplexWres',
        'website': 'https://metroplexwrestling.com',
    },
    'mission pro wrestling': {
        'city': 'San Antonio',
        'state': 'TX',
        'twitter_handle': 'MissionProWres',
        'website': 'https://missionprowrestling.com',
    },
    'new texas pro wrestling': {
        'city': 'Austin',
        'state': 'TX',
        'twitter_handle': 'NewTexasPro',
        'website': 'https://newtexaspro.com',
    },
    'reality of wrestling': {
        'city': 'Texas City',
        'state': 'TX',
        'twitter_handle': 'TheOfficialROW',
        'website': 'https://realityofwrestling.com',
    },
    
    # ==================== SOUTHEAST ====================
    'action wrestling': {
        'city': 'Tyrone',
        'state': 'GA',
        'twitter_handle': 'ACTIONWrestling',
    },
    'amazonas wrestling': {
        'city': 'Miami',
        'state': 'FL',
        'twitter_handle': 'AmazonasWres',
    },
    'atomic legacy wrestling': {
        'city': 'Melbourne',
        'state': 'FL',
        'twitter_handle': 'AtomicLegacyW',
    },
    'boca raton championship wrestling': {
        'city': 'Boca Raton',
        'state': 'FL',
        'twitter_handle': 'BRCW_Wrestling',
    },
    'coastal championship wrestling': {
        'city': 'Largo',
        'state': 'FL',
        'twitter_handle': 'CCWwrestling',
    },
    'elite wrestling alliance': {
        'city': 'Louisville',
        'state': 'KY',
        'twitter_handle': 'EWAWrestling',
    },
    'icw no holds barred': {
        'city': 'Tampa',
        'state': 'FL',
        'twitter_handle': 'ICWNHB',
    },
    'iwa deep south': {
        'city': 'Nashville',
        'state': 'TN',
        'twitter_handle': 'IWADeepSouth',
    },
    'lionheart wrestling association': {
        'city': 'Orlando',
        'state': 'FL',
        'twitter_handle': 'LionheartWA',
    },
    'local pro wrestling': {
        'city': 'Orlando',
        'state': 'FL',
        'twitter_handle': 'LocalProWres',
    },
    'national wrestling alliance': {
        'city': 'Atlanta',
        'state': 'GA',
        'twitter_handle': 'NWA',
        'website': 'https://nationalwrestlingalliance.com',
        'region': 'National',
    },
    'pro wrestling action': {
        'city': 'Tampa',
        'state': 'FL',
        'twitter_handle': 'PWAction',
    },
    'pro wrestling alliance': {
        'city': 'Nashville',
        'state': 'TN',
        'twitter_handle': 'PWAWrestling',
    },
    'resolute wrestling': {
        'city': 'Atlanta',
        'state': 'GA',
        'twitter_handle': 'ResoluteWres',
    },
    'royalty wrestling': {
        'city': 'Charlotte',
        'state': 'NC',
        'twitter_handle': 'RoyaltyWres',
    },
    'tennessee legacy wrestling': {
        'city': 'Nashville',
        'state': 'TN',
        'twitter_handle': 'TNLegacyWres',
    },
    'terminus': {
        'city': 'Atlanta',
        'state': 'GA',
        'twitter_handle': 'TerminusATL',
    },
    'world wrestling network': {
        'city': 'Orlando',
        'state': 'FL',
        'twitter_handle': 'WWNLive',
    },
    
    # ==================== NO REGION (to be assigned) ====================
    'pro wrestling king': {
        'city': 'Las Vegas',
        'state': 'NV',
        'twitter_handle': 'PWKingLV',
        'region': 'West',
    },
    'rixe catch': {
        'city': 'Montreal',
        'state': None,
        'country': 'Canada',
        'twitter_handle': 'RixeCatch',
        'region': 'International',
    },
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
    print(f"Found {len(promotions)} total promotions\n")
    
    updated = 0
    not_found = []
    
    for promo in promotions:
        name = promo['name']
        name_lower = name.lower()
        
        # Find matching update data
        update_data = None
        for key, data in ALL_PROMOTIONS.items():
            if key in name_lower or name_lower in key:
                update_data = data
                break
        
        if not update_data:
            not_found.append(name)
            continue
        
        # Build changes - only update empty or specifically overridden fields
        changes = {}
        for field, value in update_data.items():
            current = promo.get(field)
            # Update if current is empty OR if we're changing region
            if value is not None and (not current or field == 'region'):
                if current != value:
                    changes[field] = value
        
        if changes:
            print(f"Updating {name}: {list(changes.keys())}")
            if update_promotion(promo['id'], changes):
                updated += 1
            else:
                print(f"  Failed!")
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Promotions updated: {updated}")
    if not_found:
        print(f"\nNo data found for ({len(not_found)}):")
        for name in not_found:
            print(f"  - {name}")


if __name__ == '__main__':
    main()
