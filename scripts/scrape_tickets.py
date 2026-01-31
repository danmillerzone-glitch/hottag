"""
HotTag - Scrape Ticket Links
Finds ticket URLs for events by checking promotion websites

Usage:
    python scrape_tickets.py
"""

import requests
from bs4 import BeautifulSoup
import time
import re
from datetime import datetime
from config import SUPABASE_URL, HEADERS

SCRAPE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# Known promotion ticket pages
PROMOTION_TICKET_PAGES = {
    'gcw': [
        'https://www.eventbrite.com/o/gcw-17677498541',
    ],
    'game changer wrestling': [
        'https://www.eventbrite.com/o/gcw-17677498541',
    ],
    'new texas pro': [
        'https://newtexaspro.com/events-tickets/',
    ],
    'new texas pro wrestling': [
        'https://newtexaspro.com/events-tickets/',
    ],
    'reality of wrestling': [
        'https://realityofwrestling.com/tickets/',
        'https://www.eventbrite.com/o/reality-of-wrestling-8498923689',
    ],
    'black label pro': [
        'https://blacklabelpro.com/tickets/',
    ],
    'defy wrestling': [
        'https://defywrestling.com/tickets/',
    ],
    'pro wrestling guerrilla': [
        'https://www.prowrestlingguerrilla.com/tickets/',
    ],
    'pwg': [
        'https://www.prowrestlingguerrilla.com/tickets/',
    ],
    'beyond wrestling': [
        'https://www.eventbrite.com/o/beyond-wrestling-17741498383',
    ],
    'east coast wrestling association': [
        'https://www.eventbrite.com/o/east-coast-wrestling-association-ecwa-34613897563',
    ],
    'warrior wrestling': [
        'https://www.eventbrite.com/o/warrior-wrestling-17998498565',
    ],
    'glory pro wrestling': [
        'https://www.eventbrite.com/o/glory-pro-wrestling-18267498369',
    ],
    'freelance wrestling': [
        'https://www.eventbrite.com/o/freelance-wrestling-12736808498',
    ],
    'action wrestling': [
        'https://www.eventbrite.com/o/action-wrestling-18434298271',
    ],
    'west coast pro wrestling': [
        'https://www.eventbrite.com/o/west-coast-pro-wrestling-33673498683',
    ],
    'prestige wrestling': [
        'https://www.eventbrite.com/o/prestige-wrestling-32147498763',
    ],
}


def get_events_without_tickets():
    """Get upcoming events without ticket URLs"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f'{SUPABASE_URL}/rest/v1/events?select=id,name,event_date,promotion_id,promotions(name,website)&ticket_url=is.null&event_date=gte.{today}&order=event_date&limit=300'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []


def search_eventbrite(event_name, promo_name):
    """Search Eventbrite for an event"""
    try:
        # Clean event name for search
        search_term = f"{promo_name} {event_name}".replace(':', '').replace('#', '')
        url = f"https://www.eventbrite.com/d/united-states/wrestling/?q={requests.utils.quote(search_term)}"
        
        time.sleep(1)
        response = requests.get(url, headers=SCRAPE_HEADERS, timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for event links
            event_links = soup.find_all('a', href=re.compile(r'eventbrite\.com/e/'))
            for link in event_links:
                href = link.get('href', '')
                text = link.get_text(strip=True).lower()
                
                # Check if event name matches
                event_words = event_name.lower().split()[:3]  # First 3 words
                if any(word in text for word in event_words if len(word) > 3):
                    # Clean URL
                    if '?' in href:
                        href = href.split('?')[0]
                    return href
    except Exception as e:
        print(f"  Eventbrite search error: {e}")
    
    return None


def scrape_promotion_page(url, event_name, event_date):
    """Scrape a promotion's ticket page for matching event"""
    try:
        time.sleep(1.5)
        response = requests.get(url, headers=SCRAPE_HEADERS, timeout=30)
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all links
        all_links = soup.find_all('a', href=True)
        
        # Keywords from event name (lowercase)
        event_words = [w.lower() for w in event_name.split() if len(w) > 3]
        
        # Format date for matching
        date_obj = datetime.strptime(event_date, '%Y-%m-%d')
        date_formats = [
            date_obj.strftime('%m/%d'),
            date_obj.strftime('%m-%d'),
            date_obj.strftime('%B %d'),
            date_obj.strftime('%b %d'),
            str(date_obj.month) + '/' + str(date_obj.day),  # Windows-safe format
            str(date_obj.month) + '-' + str(date_obj.day),
        ]
        
        for link in all_links:
            href = link.get('href', '')
            text = link.get_text(strip=True).lower()
            parent_text = link.parent.get_text(strip=True).lower() if link.parent else ''
            
            # Check for ticket platforms in href
            ticket_platforms = ['eventbrite', 'showclix', 'ticketmaster', 'tixr', 
                              'seetickets', 'freshtix', 'simpletix', 'holdmyticket',
                              'universe.com', 'eventeny', 'ticketstripe', 'tickets.']
            
            is_ticket_link = any(platform in href.lower() for platform in ticket_platforms)
            has_ticket_word = 'ticket' in text or 'buy' in text or 'purchase' in text
            
            if is_ticket_link or has_ticket_word:
                # Check if event name matches
                text_to_check = text + ' ' + parent_text
                
                # Match by event name words
                matches = sum(1 for word in event_words if word in text_to_check)
                
                # Match by date
                date_match = any(df.lower() in text_to_check for df in date_formats if df)
                
                if matches >= 2 or (matches >= 1 and date_match):
                    # Get full URL
                    if href.startswith('http'):
                        return href
                    elif href.startswith('/'):
                        base = '/'.join(url.split('/')[:3])
                        return base + href
        
    except Exception as e:
        print(f"  Error scraping {url}: {e}")
    
    return None


def update_event_ticket(event_id, ticket_url):
    """Update event with ticket URL"""
    url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}"
    response = requests.patch(url, headers=HEADERS, json={'ticket_url': ticket_url})
    return response.status_code == 204


def main():
    events = get_events_without_tickets()
    print(f"Found {len(events)} events without ticket URLs")
    
    updated = 0
    checked = 0
    
    for event in events:
        promo = event.get('promotions')
        if not promo:
            continue
        
        promo_name = promo.get('name', '').lower()
        promo_website = promo.get('website')
        event_name = event['name']
        event_date = event['event_date']
        
        print(f"\nChecking: {event_name} ({promo.get('name', 'Unknown')})")
        checked += 1
        
        ticket_url = None
        
        # Check known promotion ticket pages
        for key, urls in PROMOTION_TICKET_PAGES.items():
            if key in promo_name:
                for page_url in urls:
                    print(f"  Checking {page_url}...")
                    ticket_url = scrape_promotion_page(page_url, event_name, event_date)
                    if ticket_url:
                        break
                if ticket_url:
                    break
        
        # Try promotion website if available
        if not ticket_url and promo_website:
            print(f"  Checking promotion website: {promo_website}")
            # Try common ticket page paths
            for path in ['', '/tickets', '/events', '/shows', '/schedule']:
                try_url = promo_website.rstrip('/') + path
                ticket_url = scrape_promotion_page(try_url, event_name, event_date)
                if ticket_url:
                    break
        
        # Try Eventbrite search as fallback
        if not ticket_url:
            print(f"  Searching Eventbrite...")
            ticket_url = search_eventbrite(event_name, promo.get('name', ''))
        
        # Update if found
        if ticket_url:
            print(f"  Found: {ticket_url}")
            if update_event_ticket(event['id'], ticket_url):
                updated += 1
            else:
                print(f"  Failed to update database")
        else:
            print(f"  No ticket link found")
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Events checked: {checked}")
    print(f"Ticket URLs found: {updated}")


if __name__ == '__main__':
    main()
