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
from config import SUPABASE_URL, SUPABASE_KEY, HEADERS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "https://www.cagematch.net"
SCRAPE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def get_events_to_update():
    """Get events that have cagematch URLs but missing venue details"""
    all_events = []
    offset = 0
    batch = 500
    while True:
        url = f"{SUPABASE_URL}/rest/v1/events?select=id,name,source_url,venue_name,ticket_url&source_url=not.is.null&venue_name=is.null&limit={batch}&offset={offset}"
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            break
        data = response.json()
        if not data:
            break
        all_events.extend(data)
        if len(data) < batch:
            break
        offset += batch
    return all_events


def scrape_event_details(source_url):
    """Scrape venue, address, and ticket info from Cagematch event page"""
    details = {
        'venue_name': None,
        'venue_address': None,
        'ticket_url': None,
        'event_time': None,
        'doors_time': None,
    }
    
    # Make sure we're on the main info page, not the card page
    if '&page=' in source_url:
        source_url = source_url.split('&page=')[0]
    
    try:
        time.sleep(1.5)  # Be nice to the server
        response = requests.get(source_url, headers=SCRAPE_HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the info box
        info_box = soup.find('div', class_='InformationBoxTable')
        if info_box:
            rows = info_box.find_all('div', class_='InformationBoxRow')
            
            for row in rows:
                title_div = row.find('div', class_='InformationBoxTitle')
                content_div = row.find('div', class_='InformationBoxContents')
                
                if not title_div or not content_div:
                    continue
                
                title_text = title_div.get_text(strip=True).lower()
                content_text = content_div.get_text(strip=True)
                
                # Arena/Venue
                if 'arena' in title_text:
                    link = content_div.find('a')
                    if link:
                        details['venue_name'] = link.get_text(strip=True)
                    else:
                        details['venue_name'] = content_text
                
                # Location / Address
                if 'location' in title_text or 'address' in title_text:
                    details['venue_address'] = content_text
                
                # Bell time / Start time
                if 'bell' in title_text or 'start' in title_text:
                    details['event_time'] = content_text
                
                # Doors
                if 'door' in title_text:
                    details['doors_time'] = content_text
        
        # Look for ticket links in the page
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link.get('href', '').lower()
            text = link.get_text(strip=True).lower()
            
            # Common ticket platforms
            ticket_platforms = ['ticket', 'eventbrite', 'showclix', 'ticketmaster', 
                              'dice.fm', 'tixr', 'seetickets', 'universe', 'holdmyticket',
                              'eventeny', 'freshtix', 'simpletix']
            
            if any(platform in href for platform in ticket_platforms):
                full_url = link.get('href')
                if full_url.startswith('http'):
                    details['ticket_url'] = full_url
                    break
            elif 'ticket' in text and link.get('href', '').startswith('http'):
                details['ticket_url'] = link.get('href')
                break
        
    except Exception as e:
        logger.error(f"Error scraping {source_url}: {e}")
    
    return details


def update_event(event_id, details):
    """Update event with new details"""
    update_data = {}
    
    if details['venue_name']:
        update_data['venue_name'] = details['venue_name']
    if details.get('venue_address'):
        update_data['venue_address'] = details['venue_address']
    if details['ticket_url']:
        update_data['ticket_url'] = details['ticket_url']
    if details['event_time']:
        update_data['event_time'] = details['event_time']
    if details['doors_time']:
        update_data['doors_time'] = details['doors_time']
    
    if update_data:
        url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}"
        response = requests.patch(url, headers=HEADERS, json=update_data)
        return response.status_code == 204
    return False


def main():
    events = get_events_to_update()
    logger.info(f"Found {len(events)} events to check for details")
    
    updated = 0
    skipped = 0
    
    for event in events:
        if not event.get('source_url'):
            skipped += 1
            continue
        
        logger.info(f"Checking: {event['name']}")
        
        details = scrape_event_details(event['source_url'])
        
        if any(details.values()):
            if update_event(event['id'], details):
                logger.info(f"  Updated: venue={details['venue_name']}, addr={details.get('venue_address')}, ticket={details['ticket_url']}")
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
