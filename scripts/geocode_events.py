"""
HotTag - Geocode Events
Adds latitude/longitude coordinates to events based on venue, city, state

Usage:
    python geocode_events.py
    
Requires: Google Maps Geocoding API key in .env as GOOGLE_MAPS_API_KEY
"""

import requests
import time
import os
from config import SUPABASE_URL, HEADERS

# Load Google Maps API key from environment
from dotenv import load_dotenv
load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY') or os.getenv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')

def get_events_without_coords():
    """Get events that don't have coordinates"""
    url = f"{SUPABASE_URL}/rest/v1/events?select=id,name,venue_name,city,state,country&or=(latitude.is.null,longitude.is.null)&order=event_date"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    print(f"Error fetching events: {response.text}")
    return []


def geocode_address(venue, city, state, country='USA'):
    """Get lat/lng for an address using Google Geocoding API"""
    if not GOOGLE_API_KEY:
        print("Error: No Google Maps API key found")
        return None, None
    
    # Build address string
    parts = []
    if venue:
        parts.append(venue)
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    if country:
        parts.append(country)
    
    address = ', '.join(parts)
    
    if not address:
        return None, None
    
    url = 'https://maps.googleapis.com/maps/api/geocode/json'
    params = {
        'address': address,
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            location = data['results'][0]['geometry']['location']
            return location['lat'], location['lng']
        else:
            print(f"  Geocoding failed for '{address}': {data.get('status')}")
            return None, None
    except Exception as e:
        print(f"  Error geocoding '{address}': {e}")
        return None, None


def update_event_coords(event_id, lat, lng):
    """Update event with coordinates"""
    url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}"
    response = requests.patch(url, headers=HEADERS, json={
        'latitude': lat,
        'longitude': lng
    })
    return response.status_code == 204


def main():
    if not GOOGLE_API_KEY:
        print("=" * 50)
        print("ERROR: No Google Maps API key found!")
        print("=" * 50)
        print("\nAdd GOOGLE_MAPS_API_KEY to your scripts/.env file:")
        print("  GOOGLE_MAPS_API_KEY=your_api_key_here")
        print("\nOr use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY if you have that set.")
        return
    
    events = get_events_without_coords()
    print(f"Found {len(events)} events without coordinates\n")
    
    if not events:
        print("All events have coordinates!")
        return
    
    # Show sample
    print("Sample events to geocode:")
    for e in events[:5]:
        venue = e.get('venue_name') or ''
        city = e.get('city') or ''
        state = e.get('state') or ''
        print(f"  - {e['name']}: {venue}, {city}, {state}")
    
    if len(events) > 5:
        print(f"  ... and {len(events) - 5} more")
    
    print()
    confirm = input(f"Geocode {len(events)} events? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled")
        return
    
    print()
    geocoded = 0
    failed = 0
    
    for i, event in enumerate(events):
        venue = event.get('venue_name')
        city = event.get('city')
        state = event.get('state')
        country = event.get('country', 'USA')
        
        print(f"[{i+1}/{len(events)}] {event['name'][:50]}...")
        
        lat, lng = geocode_address(venue, city, state, country)
        
        if lat and lng:
            if update_event_coords(event['id'], lat, lng):
                print(f"  ✓ {lat:.4f}, {lng:.4f}")
                geocoded += 1
            else:
                print(f"  ✗ Failed to update database")
                failed += 1
        else:
            failed += 1
        
        # Rate limit - Google allows 50 requests/second, but let's be safe
        time.sleep(0.1)
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Successfully geocoded: {geocoded}")
    print(f"Failed: {failed}")


if __name__ == '__main__':
    main()
