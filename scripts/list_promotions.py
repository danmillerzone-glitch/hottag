"""
List all promotions by region to see what needs updating
"""
import requests
from config import SUPABASE_URL, HEADERS

url = f"{SUPABASE_URL}/rest/v1/promotions?select=name,city,state,region,twitter_handle&order=region,name"
response = requests.get(url, headers=HEADERS)
promotions = response.json()

current_region = None
for p in promotions:
    if p['region'] != current_region:
        current_region = p['region']
        print(f"\n{'='*50}")
        print(f"  {current_region or 'No Region'}")
        print(f"{'='*50}")
    
    city = p.get('city') or '?'
    state = p.get('state') or '?'
    twitter = p.get('twitter_handle') or '?'
    print(f"  {p['name']}: {city}, {state} | @{twitter}")
