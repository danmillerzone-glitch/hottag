"""
HotTag - Cagematch Event Scraper
Scrapes upcoming events from Cagematch.net

Usage:
    python scrapers/cagematch_events.py --days 90
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import re
import argparse
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse, parse_qs
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
BASE_URL = "https://www.cagematch.net"
EVENTS_URL = f"{BASE_URL}/?id=1&view=search"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Rate limiting
REQUEST_DELAY = 2  # seconds between requests


@dataclass
class ScrapedEvent:
    """Represents an event scraped from Cagematch"""
    name: str
    event_date: str  # ISO format YYYY-MM-DD
    promotion_name: str
    promotion_cagematch_id: Optional[int] = None
    venue_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    cagematch_id: Optional[int] = None
    cagematch_url: Optional[str] = None
    event_type: Optional[str] = None  # TV, PPV, House Show, etc.
    wrestlers: List[str] = None
    
    def __post_init__(self):
        if self.wrestlers is None:
            self.wrestlers = []


@dataclass 
class ScrapedWrestler:
    """Represents a wrestler scraped from Cagematch"""
    name: str
    cagematch_id: int
    cagematch_url: str
    photo_url: Optional[str] = None
    hometown: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    twitter_handle: Optional[str] = None
    bio: Optional[str] = None


@dataclass
class ScrapedPromotion:
    """Represents a promotion scraped from Cagematch"""
    name: str
    cagematch_id: int
    cagematch_url: str
    abbreviation: Optional[str] = None
    location: Optional[str] = None
    founded: Optional[str] = None
    website: Optional[str] = None


class CagematchScraper:
    """Scraper for Cagematch.net"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        
    def _make_request(self, url: str, params: dict = None) -> Optional[BeautifulSoup]:
        """Make a rate-limited request and return parsed HTML"""
        try:
            time.sleep(REQUEST_DELAY)
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
    
    def _extract_cagematch_id(self, url: str) -> Optional[int]:
        """Extract the Cagematch ID from a URL"""
        if not url:
            return None
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        if 'nr' in params:
            try:
                return int(params['nr'][0])
            except (ValueError, IndexError):
                pass
        return None
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats into ISO format"""
        if not date_str:
            return None
            
        # Clean up the string
        date_str = date_str.strip()
        
        # Try various formats
        formats = [
            "%d.%m.%Y",      # 28.01.2025
            "%Y-%m-%d",      # 2025-01-28
            "%m/%d/%Y",      # 01/28/2025
            "%B %d, %Y",     # January 28, 2025
            "%b %d, %Y",     # Jan 28, 2025
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    def _parse_location(self, location_str: str) -> Dict[str, Optional[str]]:
        """Parse location string into city, state, country components"""
        result = {'city': None, 'state': None, 'country': None}
        
        if not location_str:
            return result
            
        # Clean and split
        parts = [p.strip() for p in location_str.split(',')]
        
        if len(parts) >= 1:
            result['city'] = parts[0]
        if len(parts) >= 2:
            # Check if it's a US state or country
            second = parts[1].strip()
            if len(second) == 2 and second.isupper():
                result['state'] = second
                result['country'] = 'USA'
            else:
                result['country'] = second
        if len(parts) >= 3:
            result['country'] = parts[2].strip()
            
        return result
    
    def scrape_upcoming_events(
        self, 
        days_ahead: int = 90,
        country: str = "USA",
        promotion_ids: List[int] = None
    ) -> List[ScrapedEvent]:
        """
        Scrape upcoming events from Cagematch
        
        Args:
            days_ahead: How many days in the future to look
            country: Filter by country (default USA)
            promotion_ids: Optional list of specific promotion IDs to scrape
            
        Returns:
            List of ScrapedEvent objects
        """
        events = []
        
        # Calculate date range
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days_ahead)
        
        logger.info(f"Scraping events from {start_date.date()} to {end_date.date()}")
        
        # Build search parameters
        params = {
            'id': '1',
            'view': 'search',
            'sDateFromDay': start_date.day,
            'sDateFromMonth': start_date.month,
            'sDateFromYear': start_date.year,
            'sDateTillDay': end_date.day,
            'sDateTillMonth': end_date.month,
            'sDateTillYear': end_date.year,
            'sEventType': 'All',
            'sPromotion': '',
        }
        
        # Add country filter if specified
        if country:
            # Cagematch uses country codes
            country_codes = {
                'USA': '2',
                'Canada': '3',
                'Mexico': '4',
                'UK': '5',
                'Japan': '6',
            }
            if country in country_codes:
                params['sCountry'] = country_codes[country]
        
        page = 0
        max_pages = 50  # Safety limit
        
        while page < max_pages:
            params['page'] = page
            
            logger.info(f"Fetching page {page + 1}...")
            soup = self._make_request(EVENTS_URL, params)
            
            if not soup:
                break
                
            # Find the events table
            table = soup.find('div', class_='TableContents')
            if not table:
                logger.info("No more events found")
                break
            
            rows = table.find_all('tr')
            if not rows or len(rows) <= 1:  # Header row only
                break
                
            found_events = 0
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all('td')
                if len(cells) < 4:
                    continue
                    
                try:
                    # Extract event data
                    date_cell = cells[0]
                    event_cell = cells[1]
                    promotion_cell = cells[2]
                    location_cell = cells[3] if len(cells) > 3 else None
                    
                    # Get event link and name
                    event_link = event_cell.find('a')
                    if not event_link:
                        continue
                        
                    event_name = event_link.get_text(strip=True)
                    event_url = urljoin(BASE_URL, event_link.get('href', ''))
                    cagematch_id = self._extract_cagematch_id(event_url)
                    
                    # Get date
                    date_str = date_cell.get_text(strip=True)
                    event_date = self._parse_date(date_str)
                    
                    if not event_date:
                        continue
                    
                    # Get promotion
                    promo_link = promotion_cell.find('a')
                    promotion_name = promo_link.get_text(strip=True) if promo_link else promotion_cell.get_text(strip=True)
                    promo_url = urljoin(BASE_URL, promo_link.get('href', '')) if promo_link else None
                    promo_cagematch_id = self._extract_cagematch_id(promo_url)
                    
                    # Get location
                    location_str = location_cell.get_text(strip=True) if location_cell else None
                    location = self._parse_location(location_str)
                    
                    # Create event object
                    event = ScrapedEvent(
                        name=event_name,
                        event_date=event_date,
                        promotion_name=promotion_name,
                        promotion_cagematch_id=promo_cagematch_id,
                        city=location['city'],
                        state=location['state'],
                        country=location['country'] or country,
                        cagematch_id=cagematch_id,
                        cagematch_url=event_url,
                    )
                    
                    events.append(event)
                    found_events += 1
                    
                except Exception as e:
                    logger.warning(f"Error parsing event row: {e}")
                    continue
            
            logger.info(f"Found {found_events} events on page {page + 1}")
            
            if found_events == 0:
                break
                
            page += 1
        
        logger.info(f"Total events scraped: {len(events)}")
        return events
    
    def scrape_event_details(self, cagematch_id: int) -> Optional[ScrapedEvent]:
        """Scrape detailed information for a specific event"""
        url = f"{BASE_URL}/?id=1&nr={cagematch_id}"
        
        soup = self._make_request(url)
        if not soup:
            return None
        
        # TODO: Parse detailed event page for:
        # - Full card/wrestlers
        # - Match results
        # - Venue details
        # This would require more detailed parsing of the event page
        
        pass
    
    def scrape_promotion_events(self, promotion_id: int, days_ahead: int = 90) -> List[ScrapedEvent]:
        """Scrape events for a specific promotion"""
        events = []
        
        url = f"{BASE_URL}/?id=8&nr={promotion_id}&page=4"  # page=4 is Events
        
        soup = self._make_request(url)
        if not soup:
            return events
        
        # Find upcoming events
        # TODO: Parse the promotion's event listing
        
        return events
    
    def scrape_wrestler(self, cagematch_id: int) -> Optional[ScrapedWrestler]:
        """Scrape wrestler profile"""
        url = f"{BASE_URL}/?id=2&nr={cagematch_id}"
        
        soup = self._make_request(url)
        if not soup:
            return None
        
        try:
            # Get name
            name_elem = soup.find('h1', class_='TextHeader')
            if not name_elem:
                return None
            name = name_elem.get_text(strip=True)
            
            # Get info box
            info_box = soup.find('div', class_='InformationBoxTable')
            
            wrestler = ScrapedWrestler(
                name=name,
                cagematch_id=cagematch_id,
                cagematch_url=url,
            )
            
            if info_box:
                rows = info_box.find_all('tr')
                for row in rows:
                    label = row.find('td', class_='InformationBoxTitle')
                    value = row.find('td', class_='InformationBoxContents')
                    
                    if not label or not value:
                        continue
                        
                    label_text = label.get_text(strip=True).lower()
                    value_text = value.get_text(strip=True)
                    
                    if 'hometown' in label_text or 'billed from' in label_text:
                        wrestler.hometown = value_text
                    elif 'height' in label_text:
                        wrestler.height = value_text
                    elif 'weight' in label_text:
                        wrestler.weight = value_text
                    elif 'twitter' in label_text:
                        twitter_link = value.find('a')
                        if twitter_link:
                            handle = twitter_link.get('href', '').split('/')[-1]
                            wrestler.twitter_handle = handle
            
            # Get photo
            photo_elem = soup.find('img', class_='WorkerPicture')
            if photo_elem:
                wrestler.photo_url = urljoin(BASE_URL, photo_elem.get('src', ''))
            
            return wrestler
            
        except Exception as e:
            logger.error(f"Error scraping wrestler {cagematch_id}: {e}")
            return None
    
    def scrape_promotion(self, cagematch_id: int) -> Optional[ScrapedPromotion]:
        """Scrape promotion profile"""
        url = f"{BASE_URL}/?id=8&nr={cagematch_id}"
        
        soup = self._make_request(url)
        if not soup:
            return None
        
        try:
            # Get name
            name_elem = soup.find('h1', class_='TextHeader')
            if not name_elem:
                return None
            name = name_elem.get_text(strip=True)
            
            promotion = ScrapedPromotion(
                name=name,
                cagematch_id=cagematch_id,
                cagematch_url=url,
            )
            
            # Get info box
            info_box = soup.find('div', class_='InformationBoxTable')
            
            if info_box:
                rows = info_box.find_all('tr')
                for row in rows:
                    label = row.find('td', class_='InformationBoxTitle')
                    value = row.find('td', class_='InformationBoxContents')
                    
                    if not label or not value:
                        continue
                        
                    label_text = label.get_text(strip=True).lower()
                    value_text = value.get_text(strip=True)
                    
                    if 'abbreviation' in label_text:
                        promotion.abbreviation = value_text
                    elif 'location' in label_text:
                        promotion.location = value_text
                    elif 'founded' in label_text:
                        promotion.founded = value_text
                    elif 'website' in label_text or 'www' in label_text:
                        link = value.find('a')
                        if link:
                            promotion.website = link.get('href', '')
            
            return promotion
            
        except Exception as e:
            logger.error(f"Error scraping promotion {cagematch_id}: {e}")
            return None


def main():
    parser = argparse.ArgumentParser(description='Scrape wrestling events from Cagematch')
    parser.add_argument('--days', type=int, default=90, help='Days ahead to scrape')
    parser.add_argument('--country', type=str, default='USA', help='Country filter')
    parser.add_argument('--output', type=str, default='events.json', help='Output file')
    
    args = parser.parse_args()
    
    scraper = CagematchScraper()
    
    # Scrape events
    events = scraper.scrape_upcoming_events(
        days_ahead=args.days,
        country=args.country
    )
    
    # Convert to JSON-serializable format
    events_data = [asdict(e) for e in events]
    
    # Save to file
    with open(args.output, 'w') as f:
        json.dump(events_data, f, indent=2)
    
    logger.info(f"Saved {len(events)} events to {args.output}")
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"SCRAPE SUMMARY")
    print(f"{'='*50}")
    print(f"Total events: {len(events)}")
    print(f"Date range: {args.days} days")
    print(f"Country: {args.country}")
    
    # Show by promotion
    promos = {}
    for e in events:
        promos[e.promotion_name] = promos.get(e.promotion_name, 0) + 1
    
    print(f"\nTop promotions:")
    for promo, count in sorted(promos.items(), key=lambda x: -x[1])[:10]:
        print(f"  {promo}: {count} events")


if __name__ == '__main__':
    main()
