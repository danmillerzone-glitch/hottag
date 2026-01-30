"""
HotTag - Event Detail Scraper
Fetches additional details for events (venue, ticket links, etc.)

Usage:
    python scrape_event_details.py
"""

import requests
from bs4 import BeautifulSoup
import time
import logging
from supabase import create_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SUPABASE_URL = "https://floznswkfodjuigfzkki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb3puc3drZm9kanVpZ2Z6a2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMzMzOSwiZXhwIjoyMDg1MjA5MzM5fQ.dRzAdv_LPUXeMv8Ns2HPR2VVQ3PxFZ3TGBtWznCA-Qk"

BASE_URL = "https://www.cagematch.net"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_events_to_update():
    """Get events that have cagematch URLs but missing details"""
    response = supabase.table('events').select(
        'id, name, cagematch_url, venue_name, ticket_url'
    ).not_.is_('cagematch_url', 'null').is_('venue_name', 'null').limit(100).execute()
    
    return response.data


def scrape_event_details(cagematch_url):
    """Scrape venue and ticket info from Cagematch event page"""
    details = {
        'venue_name': None,
        'ticket_url': None,
        'event_time': None,
        'doors_time': None,
    }
    
    try:
        time.sleep(1.5)  # Be nice to the server
        response = requests.get(cagematch_url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the info box
        info_box = soup.find('div', class_='InformationBoxContents')
        if info_box:
            rows = info_box.find_all('div', class_='InformationBoxRow')
            
            for row in rows:
                title = row.find('div', class_='InformationBoxTitle')
                content = row.find('div', class_='InformationBoxContents')
                
                if not title or not content:
                    continue
                
                title_text = title.get_text(strip=True).lower()
                content_text = content.get_text(strip=True)
                
                # Venue/Arena
                if 'arena' in title_text or 'venue' in title_text or 'location' in title_text:
                    # Get venue name (might be in a link)
                    link = content.find('a')
                    if link:
                        details['venue_name'] = link.get_text(strip=True)
                    else:
                        # Parse from text - usually "Venue Name @ City, State"
                        if '@' in content_text:
                            details['venue_name'] = content_text.split('@')[0].strip()
                        elif ',' in content_text:
                            # Might just be the venue name
                            details['venue_name'] = content_text.split(',')[0].strip()
                
                # Time/Bell time
                if 'time' in title_text or 'bell' in title_text:
                    details['event_time'] = content_text
                
                # Doors
                if 'door' in title_text:
                    details['doors_time'] = content_text
        
        # Look for ticket links
        ticket_links = soup.find_all('a', href=True)
        for link in ticket_links:
            href = link.get('href', '').lower()
            text = link.get_text(strip=True).lower()
            
            # Common ticket platforms
            ticket_platforms = ['ticket', 'eventbrite', 'showclix', 'ticketmaster', 
                              'dice.fm', 'tixr', 'seetickets', 'universe', 'holdmyticket']
            
            if any(platform in href for platform in ticket_platforms):
                details['ticket_url'] = link.get('href')
                break
            elif 'ticket' in text and href.startswith('http'):
                details['ticket_url'] = link.get('href')
                break
        
    except Exception as e:
        logger.error(f"Error scraping {cagematch_url}: {e}")
    
    return details


def update_event(event_id, details):
    """Update event with new details"""
    update_data = {}
    
    if details['venue_name']:
        update_data['venue_name'] = details['venue_name']
    if details['ticket_url']:
        update_data['ticket_url'] = details['ticket_url']
    if details['event_time']:
        update_data['event_time'] = details['event_time']
    if details['doors_time']:
        update_data['doors_time'] = details['doors_time']
    
    if update_data:
        supabase.table('events').update(update_data).eq('id', event_id).execute()
        return True
    return False


def main():
    events = get_events_to_update()
    logger.info(f"Found {len(events)} events to check for details")
    
    updated = 0
    skipped = 0
    
    for event in events:
        if not event.get('cagematch_url'):
            skipped += 1
            continue
        
        logger.info(f"Checking: {event['name']}")
        
        details = scrape_event_details(event['cagematch_url'])
        
        if any(details.values()):
            if update_event(event['id'], details):
                logger.info(f"  Updated with: {details}")
                updated += 1
            else:
                skipped += 1
        else:
            logger.info("  No new details found")
            skipped += 1
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Events checked: {len(events)}")
    print(f"Events updated: {updated}")
    print(f"Events skipped: {skipped}")


if __name__ == '__main__':
    main()
