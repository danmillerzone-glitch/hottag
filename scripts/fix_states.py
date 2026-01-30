"""
Fix missing states in the events table based on known city-state mappings
"""

import requests

SUPABASE_URL = "https://floznswkfodjuigfzkki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb3puc3drZm9kanVpZ2Z6a2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMzMzOSwiZXhwIjoyMDg1MjA5MzM5fQ.dRzAdv_LPUXeMv8Ns2HPR2VVQ3PxFZ3TGBtWznCA-Qk"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Known city to state mappings
CITY_STATE_MAP = {
    # California
    'los angeles': 'CA', 'la': 'CA', 'hollywood': 'CA', 'san diego': 'CA',
    'san francisco': 'CA', 'oakland': 'CA', 'sacramento': 'CA', 'fresno': 'CA',
    'long beach': 'CA', 'anaheim': 'CA', 'santa ana': 'CA', 'riverside': 'CA',
    'bakersfield': 'CA', 'stockton': 'CA', 'irvine': 'CA', 'chula vista': 'CA',
    'fremont': 'CA', 'san bernardino': 'CA', 'modesto': 'CA', 'fontana': 'CA',
    'santa clarita': 'CA', 'san jose': 'CA', 'cudahy': 'CA', 'hawaiian gardens': 'CA',
    'reseda': 'CA', 'pomona': 'CA', 'ontario': 'CA', 'corona': 'CA',
    
    # Texas
    'houston': 'TX', 'dallas': 'TX', 'austin': 'TX', 'san antonio': 'TX',
    'fort worth': 'TX', 'el paso': 'TX', 'arlington': 'TX', 'corpus christi': 'TX',
    'plano': 'TX', 'laredo': 'TX', 'lubbock': 'TX', 'garland': 'TX',
    'irving': 'TX', 'amarillo': 'TX', 'grand prairie': 'TX', 'mckinney': 'TX',
    'frisco': 'TX', 'baytown': 'TX', 'pasadena': 'TX', 'wharton': 'TX',
    
    # Nevada
    'las vegas': 'NV', 'henderson': 'NV', 'reno': 'NV', 'north las vegas': 'NV',
    'sparks': 'NV', 'carson city': 'NV',
    
    # New York
    'new york': 'NY', 'new york city': 'NY', 'nyc': 'NY', 'brooklyn': 'NY',
    'queens': 'NY', 'bronx': 'NY', 'manhattan': 'NY', 'buffalo': 'NY',
    'rochester': 'NY', 'yonkers': 'NY', 'syracuse': 'NY', 'albany': 'NY',
    'deer park': 'NY', 'long island': 'NY', 'queens village': 'NY',
    
    # Florida
    'miami': 'FL', 'orlando': 'FL', 'tampa': 'FL', 'jacksonville': 'FL',
    'st. petersburg': 'FL', 'hialeah': 'FL', 'fort lauderdale': 'FL',
    'tallahassee': 'FL', 'cape coral': 'FL', 'pembroke pines': 'FL',
    'hollywood': 'FL', 'gainesville': 'FL', 'coral springs': 'FL',
    'ybor city': 'FL',
    
    # Pennsylvania
    'philadelphia': 'PA', 'pittsburgh': 'PA', 'allentown': 'PA', 'erie': 'PA',
    'reading': 'PA', 'scranton': 'PA', 'bethlehem': 'PA', 'lancaster': 'PA',
    
    # Illinois
    'chicago': 'IL', 'aurora': 'IL', 'naperville': 'IL', 'joliet': 'IL',
    'rockford': 'IL', 'springfield': 'IL', 'elgin': 'IL', 'peoria': 'IL',
    'cicero': 'IL', 'waukegan': 'IL', 'berwyn': 'IL',
    
    # Georgia
    'atlanta': 'GA', 'augusta': 'GA', 'columbus': 'GA', 'savannah': 'GA',
    'athens': 'GA', 'macon': 'GA', 'sandy springs': 'GA', 'roswell': 'GA',
    'newnan': 'GA',
    
    # Tennessee
    'nashville': 'TN', 'memphis': 'TN', 'knoxville': 'TN', 'chattanooga': 'TN',
    'clarksville': 'TN', 'murfreesboro': 'TN', 'jackson': 'TN', 'johnson city': 'TN',
    
    # Alabama
    'birmingham': 'AL', 'montgomery': 'AL', 'huntsville': 'AL', 'mobile': 'AL',
    'tuscaloosa': 'AL', 'hoover': 'AL', 'dothan': 'AL', 'auburn': 'AL',
    
    # Ohio
    'columbus': 'OH', 'cleveland': 'OH', 'cincinnati': 'OH', 'toledo': 'OH',
    'akron': 'OH', 'dayton': 'OH', 'parma': 'OH', 'canton': 'OH',
    
    # New Jersey
    'newark': 'NJ', 'jersey city': 'NJ', 'paterson': 'NJ', 'elizabeth': 'NJ',
    'edison': 'NJ', 'woodbridge': 'NJ', 'trenton': 'NJ', 'camden': 'NJ',
    'rahway': 'NJ',
    
    # Arizona
    'phoenix': 'AZ', 'tucson': 'AZ', 'mesa': 'AZ', 'chandler': 'AZ',
    'gilbert': 'AZ', 'glendale': 'AZ', 'scottsdale': 'AZ', 'tempe': 'AZ',
    
    # Massachusetts
    'boston': 'MA', 'worcester': 'MA', 'springfield': 'MA', 'cambridge': 'MA',
    'lowell': 'MA', 'brockton': 'MA', 'quincy': 'MA', 'lynn': 'MA',
    
    # North Carolina
    'charlotte': 'NC', 'raleigh': 'NC', 'greensboro': 'NC', 'durham': 'NC',
    'winston-salem': 'NC', 'fayetteville': 'NC', 'cary': 'NC', 'wilmington': 'NC',
    'high point': 'NC', 'gibsonville': 'NC',
    
    # Virginia
    'virginia beach': 'VA', 'norfolk': 'VA', 'chesapeake': 'VA', 'richmond': 'VA',
    'newport news': 'VA', 'alexandria': 'VA', 'hampton': 'VA', 'roanoke': 'VA',
    
    # Michigan
    'detroit': 'MI', 'grand rapids': 'MI', 'warren': 'MI', 'sterling heights': 'MI',
    'ann arbor': 'MI', 'lansing': 'MI', 'flint': 'MI', 'dearborn': 'MI',
    
    # Indiana
    'indianapolis': 'IN', 'fort wayne': 'IN', 'evansville': 'IN', 'south bend': 'IN',
    'carmel': 'IN', 'fishers': 'IN', 'bloomington': 'IN', 'hammond': 'IN',
    
    # Missouri
    'kansas city': 'MO', 'st. louis': 'MO', 'springfield': 'MO', 'columbia': 'MO',
    'independence': 'MO', "lee's summit": 'MO', "o'fallon": 'MO',
    
    # Wisconsin
    'milwaukee': 'WI', 'madison': 'WI', 'green bay': 'WI', 'kenosha': 'WI',
    'racine': 'WI', 'appleton': 'WI', 'waukesha': 'WI', 'oshkosh': 'WI',
    'new richmond': 'WI', 'st. nazianz': 'WI',
    
    # Minnesota
    'minneapolis': 'MN', 'st. paul': 'MN', 'rochester': 'MN', 'duluth': 'MN',
    'bloomington': 'MN', 'brooklyn park': 'MN', 'plymouth': 'MN',
    
    # Colorado
    'denver': 'CO', 'colorado springs': 'CO', 'aurora': 'CO', 'fort collins': 'CO',
    'lakewood': 'CO', 'thornton': 'CO', 'arvada': 'CO', 'westminster': 'CO',
    
    # Louisiana
    'new orleans': 'LA', 'baton rouge': 'LA', 'shreveport': 'LA', 'metairie': 'LA',
    'lafayette': 'LA', 'lake charles': 'LA', 'kenner': 'LA', 'bossier city': 'LA',
    
    # Mississippi
    'jackson': 'MS', 'gulfport': 'MS', 'southaven': 'MS', 'hattiesburg': 'MS',
    'biloxi': 'MS', 'meridian': 'MS', 'tupelo': 'MS', 'magee': 'MS',
    
    # Rhode Island
    'providence': 'RI', 'warwick': 'RI', 'cranston': 'RI', 'pawtucket': 'RI',
    
    # Vermont
    'burlington': 'VT', 'south burlington': 'VT', 'rutland': 'VT', 'barre': 'VT',
    
    # Delaware
    'wilmington': 'DE', 'dover': 'DE', 'newark': 'DE', 'cordovil': 'DE',
    
    # Maryland
    'baltimore': 'MD', 'frederick': 'MD', 'rockville': 'MD', 'gaithersburg': 'MD',
    
    # Connecticut
    'bridgeport': 'CT', 'new haven': 'CT', 'stamford': 'CT', 'hartford': 'CT',
    'waterbury': 'CT', 'norwalk': 'CT',
    
    # Oregon
    'portland': 'OR', 'eugene': 'OR', 'salem': 'OR', 'gresham': 'OR',
    
    # Washington
    'seattle': 'WA', 'spokane': 'WA', 'tacoma': 'WA', 'vancouver': 'WA',
    'bellevue': 'WA', 'everett': 'WA',
    
    # Kentucky
    'louisville': 'KY', 'lexington': 'KY', 'bowling green': 'KY', 'owensboro': 'KY',
    
    # Oklahoma
    'oklahoma city': 'OK', 'tulsa': 'OK', 'norman': 'OK', 'broken arrow': 'OK',
    
    # Iowa
    'des moines': 'IA', 'cedar rapids': 'IA', 'davenport': 'IA', 'sioux city': 'IA',
    
    # Kansas
    'wichita': 'KS', 'overland park': 'KS', 'kansas city': 'KS', 'olathe': 'KS',
    
    # Utah
    'salt lake city': 'UT', 'west valley city': 'UT', 'provo': 'UT', 'west jordan': 'UT',
    
    # South Carolina
    'columbia': 'SC', 'charleston': 'SC', 'north charleston': 'SC', 'mount pleasant': 'SC',
    
    # Arkansas
    'little rock': 'AR', 'fort smith': 'AR', 'fayetteville': 'AR', 'springdale': 'AR',
    
    # Nebraska
    'omaha': 'NE', 'lincoln': 'NE', 'bellevue': 'NE', 'grand island': 'NE',
    
    # West Virginia
    'charleston': 'WV', 'huntington': 'WV', 'morgantown': 'WV', 'parkersburg': 'WV',
    
    # New Mexico
    'albuquerque': 'NM', 'las cruces': 'NM', 'rio rancho': 'NM', 'santa fe': 'NM',
    
    # Maine
    'portland': 'ME', 'lewiston': 'ME', 'bangor': 'ME', 'auburn': 'ME',
    
    # New Hampshire
    'manchester': 'NH', 'nashua': 'NH', 'concord': 'NH', 'derry': 'NH',
    
    # Other specific venues
    'melbourne': 'FL',  # Melbourne, FL for wrestling
}


def get_events_missing_state():
    """Get all events with missing state"""
    url = f"{SUPABASE_URL}/rest/v1/events?state=is.null&select=id,name,city"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def update_event_state(event_id, state):
    """Update state for an event"""
    url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}"
    data = {"state": state}
    response = requests.patch(url, headers=HEADERS, json=data)
    return response.status_code == 204


def main():
    events = get_events_missing_state()
    print(f"Found {len(events)} events with missing state")
    
    updated = 0
    not_found = []
    
    for event in events:
        city = event.get('city', '')
        if not city:
            continue
        
        city_lower = city.lower().strip()
        
        if city_lower in CITY_STATE_MAP:
            state = CITY_STATE_MAP[city_lower]
            if update_event_state(event['id'], state):
                print(f"Updated: {city} -> {state}")
                updated += 1
            else:
                print(f"Failed to update: {city}")
        else:
            not_found.append(f"{city} - {event['name']}")
    
    print(f"\n{'='*50}")
    print(f"Updated: {updated}")
    print(f"Not found: {len(not_found)}")
    
    if not_found:
        print("\nCities not in mapping:")
        for item in not_found[:20]:
            print(f"  {item}")


if __name__ == '__main__':
    main()
