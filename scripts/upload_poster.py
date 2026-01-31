"""
HotTag - Upload Event Poster
Uploads a poster image and links it to an event

Usage:
    python upload_poster.py <event_id> <image_path>
    python upload_poster.py --list  (to see events without posters)
    
Example:
    python upload_poster.py 123e4567-e89b-12d3-a456-426614174000 poster.jpg
"""

import sys
import os
import requests
import base64
import mimetypes
from config import SUPABASE_URL, SUPABASE_KEY, HEADERS

STORAGE_BUCKET = "event-posters"


def list_events_without_posters():
    """List upcoming events that don't have posters"""
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    
    url = f"{SUPABASE_URL}/rest/v1/events?select=id,name,event_date,promotions(name)&poster_url=is.null&event_date=gte.{today}&order=event_date&limit=50"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200:
        events = response.json()
        print(f"\nUpcoming events without posters ({len(events)}):\n")
        print("-" * 80)
        for e in events:
            promo = e.get('promotions', {})
            promo_name = promo.get('name', 'Unknown') if promo else 'Unknown'
            print(f"{e['event_date']} | {promo_name}")
            print(f"  {e['name']}")
            print(f"  ID: {e['id']}")
            print()
    else:
        print(f"Error: {response.text}")


def upload_to_storage(file_path, event_id):
    """Upload image to Supabase Storage"""
    
    # Get file info
    filename = os.path.basename(file_path)
    extension = os.path.splitext(filename)[1].lower()
    content_type = mimetypes.guess_type(file_path)[0] or 'image/jpeg'
    
    # Create unique filename
    storage_path = f"{event_id}{extension}"
    
    # Read file
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    # Upload to Supabase Storage
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"
    
    upload_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"  # Overwrite if exists
    }
    
    response = requests.post(upload_url, headers=upload_headers, data=file_data)
    
    if response.status_code in [200, 201]:
        # Get public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
        return public_url
    else:
        print(f"Storage upload failed: {response.status_code} - {response.text}")
        return None


def update_event_poster(event_id, poster_url):
    """Update the event's poster_url field"""
    url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}"
    response = requests.patch(url, headers=HEADERS, json={'poster_url': poster_url})
    return response.status_code == 204


def get_event_info(event_id):
    """Get event details"""
    url = f"{SUPABASE_URL}/rest/v1/events?select=id,name,event_date,promotions(name)&id=eq.{event_id}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        events = response.json()
        return events[0] if events else None
    return None


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    if sys.argv[1] == '--list':
        list_events_without_posters()
        return
    
    if len(sys.argv) < 3:
        print("Usage: python upload_poster.py <event_id> <image_path>")
        return
    
    event_id = sys.argv[1]
    image_path = sys.argv[2]
    
    # Validate image exists
    if not os.path.exists(image_path):
        print(f"Error: File not found: {image_path}")
        return
    
    # Get event info
    event = get_event_info(event_id)
    if not event:
        print(f"Error: Event not found: {event_id}")
        return
    
    promo = event.get('promotions', {})
    promo_name = promo.get('name', 'Unknown') if promo else 'Unknown'
    print(f"\nEvent: {event['name']}")
    print(f"Date: {event['event_date']}")
    print(f"Promotion: {promo_name}")
    print(f"Image: {image_path}")
    
    confirm = input("\nUpload poster? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled")
        return
    
    # Upload to storage
    print("\nUploading to storage...")
    poster_url = upload_to_storage(image_path, event_id)
    
    if not poster_url:
        print("Failed to upload to storage.")
        print("\nAlternative: You can manually set a poster URL.")
        manual_url = input("Enter poster URL (or press Enter to cancel): ").strip()
        if manual_url:
            poster_url = manual_url
        else:
            return
    
    # Update event
    print("Updating event...")
    if update_event_poster(event_id, poster_url):
        print(f"\n✓ Success! Poster uploaded.")
        print(f"  URL: {poster_url}")
    else:
        print("Failed to update event.")


if __name__ == '__main__':
    main()
