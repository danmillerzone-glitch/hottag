"""
HotTag - Promotion Website Scrapers
Individual scrapers for each promotion's website and social media

These scrapers supplement Cagematch data with:
- More current event info
- Ticket links
- Card announcements
- Venue details
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import time
import re
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict, field
from abc import ABC, abstractmethod
import logging
from urllib.parse import urljoin

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

REQUEST_DELAY = 2


@dataclass
class PromotionEvent:
    """Event data from a promotion's website"""
    name: str
    event_date: str  # YYYY-MM-DD
    promotion_slug: str
    
    # Optional fields
    event_time: Optional[str] = None
    doors_time: Optional[str] = None
    venue_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "USA"
    
    ticket_url: Optional[str] = None
    ticket_price_min: Optional[float] = None
    ticket_price_max: Optional[float] = None
    is_sold_out: bool = False
    
    poster_url: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    
    # Card/wrestlers
    announced_wrestlers: List[str] = field(default_factory=list)
    announced_matches: List[Dict[str, Any]] = field(default_factory=list)


class PromotionScraper(ABC):
    """Base class for promotion-specific scrapers"""
    
    SLUG: str = ""
    NAME: str = ""
    WEBSITE: str = ""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
    
    def _request(self, url: str) -> Optional[BeautifulSoup]:
        """Make rate-limited request"""
        try:
            time.sleep(REQUEST_DELAY)
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            logger.error(f"Request failed: {url} - {e}")
            return None
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str:
            return None
        
        date_str = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_str)
        
        formats = [
            "%B %d, %Y",
            "%b %d, %Y", 
            "%m/%d/%Y",
            "%m-%d-%Y",
            "%Y-%m-%d",
            "%d.%m.%Y",
            "%A, %B %d, %Y",
            "%A %B %d, %Y",
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        return None
    
    @abstractmethod
    def scrape_events(self) -> List[PromotionEvent]:
        """Scrape upcoming events - implement in subclass"""
        pass


class GCWScraper(PromotionScraper):
    """Scraper for Game Changer Wrestling"""
    
    SLUG = "gcw"
    NAME = "Game Changer Wrestling"
    WEBSITE = "https://www.longlivegcw.com"
    
    def scrape_events(self) -> List[PromotionEvent]:
        events = []
        
        # GCW uses an events page
        url = f"{self.WEBSITE}/pages/upcoming-events"
        soup = self._request(url)
        
        if not soup:
            # Try alternative URL patterns
            url = f"{self.WEBSITE}/events"
            soup = self._request(url)
        
        if not soup:
            logger.warning(f"Could not fetch GCW events page")
            return events
        
        # GCW often uses Shopify, look for event blocks
        # This is a template - actual structure may vary
        event_blocks = soup.find_all(['div', 'article'], class_=re.compile(r'event|show|card', re.I))
        
        for block in event_blocks:
            try:
                # Extract event info - structure varies by site design
                name_elem = block.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name', re.I))
                date_elem = block.find(['span', 'p', 'time'], class_=re.compile(r'date', re.I))
                
                if not name_elem:
                    continue
                
                name = name_elem.get_text(strip=True)
                date_str = date_elem.get_text(strip=True) if date_elem else None
                event_date = self._parse_date(date_str) if date_str else None
                
                if not event_date:
                    continue
                
                # Look for ticket link
                ticket_link = block.find('a', href=re.compile(r'ticket|eventbrite|showclix', re.I))
                ticket_url = ticket_link.get('href') if ticket_link else None
                
                # Look for venue info
                venue_elem = block.find(['span', 'p', 'div'], class_=re.compile(r'venue|location', re.I))
                venue_name = venue_elem.get_text(strip=True) if venue_elem else None
                
                event = PromotionEvent(
                    name=name,
                    event_date=event_date,
                    promotion_slug=self.SLUG,
                    venue_name=venue_name,
                    ticket_url=ticket_url,
                    source_url=url,
                )
                events.append(event)
                
            except Exception as e:
                logger.warning(f"Error parsing GCW event block: {e}")
                continue
        
        logger.info(f"GCW: Found {len(events)} events")
        return events


class ROWScraper(PromotionScraper):
    """Scraper for Reality of Wrestling (Houston)"""
    
    SLUG = "row"
    NAME = "Reality of Wrestling"
    WEBSITE = "https://realityofwrestling.com"
    
    def scrape_events(self) -> List[PromotionEvent]:
        events = []
        
        # ROW uses WordPress with events
        url = f"{self.WEBSITE}/events/"
        soup = self._request(url)
        
        if not soup:
            return events
        
        # Look for event listings
        event_items = soup.find_all(['article', 'div'], class_=re.compile(r'event|tribe-events', re.I))
        
        for item in event_items:
            try:
                # Extract event info
                title_elem = item.find(['h1', 'h2', 'h3', 'a'], class_=re.compile(r'title|name', re.I))
                
                if not title_elem:
                    title_elem = item.find('a')
                
                if not title_elem:
                    continue
                
                name = title_elem.get_text(strip=True)
                
                # Get event URL
                event_url = None
                if title_elem.name == 'a':
                    event_url = title_elem.get('href')
                else:
                    link = item.find('a')
                    event_url = link.get('href') if link else None
                
                # Look for date
                date_elem = item.find(['time', 'span', 'div'], class_=re.compile(r'date|start', re.I))
                if date_elem and date_elem.has_attr('datetime'):
                    event_date = date_elem['datetime'][:10]  # YYYY-MM-DD
                else:
                    date_str = date_elem.get_text(strip=True) if date_elem else None
                    event_date = self._parse_date(date_str) if date_str else None
                
                if not event_date:
                    continue
                
                # Look for venue
                venue_elem = item.find(['span', 'div'], class_=re.compile(r'venue', re.I))
                venue_name = venue_elem.get_text(strip=True) if venue_elem else None
                
                # Default to Texas City for ROW
                event = PromotionEvent(
                    name=name,
                    event_date=event_date,
                    promotion_slug=self.SLUG,
                    venue_name=venue_name,
                    city="Texas City",
                    state="TX",
                    source_url=event_url or url,
                )
                events.append(event)
                
            except Exception as e:
                logger.warning(f"Error parsing ROW event: {e}")
                continue
        
        logger.info(f"ROW: Found {len(events)} events")
        return events


class PrestigeScraper(PromotionScraper):
    """Scraper for Prestige Wrestling"""
    
    SLUG = "prestige"
    NAME = "Prestige Wrestling"
    WEBSITE = "https://www.prestigewrestling.net"
    
    def scrape_events(self) -> List[PromotionEvent]:
        events = []
        
        soup = self._request(self.WEBSITE)
        
        if not soup:
            return events
        
        # Prestige uses a custom site with event blocks
        event_blocks = soup.find_all(['div', 'section'], class_=re.compile(r'event|show', re.I))
        
        for block in event_blocks:
            try:
                # Parse event info
                name_elem = block.find(['h1', 'h2', 'h3', 'h4'])
                if not name_elem:
                    continue
                
                name = name_elem.get_text(strip=True)
                
                # Look for date
                text = block.get_text()
                date_match = re.search(r'(\d{1,2}/\d{1,2}(?:/\d{2,4})?)', text)
                
                if date_match:
                    date_str = date_match.group(1)
                    if len(date_str.split('/')) == 2:
                        date_str += f"/{datetime.now().year}"
                    event_date = self._parse_date(date_str)
                else:
                    continue
                
                if not event_date:
                    continue
                
                # Look for ticket link
                ticket_link = block.find('a', href=re.compile(r'ticket', re.I))
                ticket_url = ticket_link.get('href') if ticket_link else None
                
                event = PromotionEvent(
                    name=name,
                    event_date=event_date,
                    promotion_slug=self.SLUG,
                    city="Portland",
                    state="OR",
                    ticket_url=ticket_url,
                    source_url=self.WEBSITE,
                )
                events.append(event)
                
            except Exception as e:
                logger.warning(f"Error parsing Prestige event: {e}")
                continue
        
        logger.info(f"Prestige: Found {len(events)} events")
        return events


class WestCoastProScraper(PromotionScraper):
    """Scraper for West Coast Pro Wrestling"""
    
    SLUG = "wcpw"
    NAME = "West Coast Pro Wrestling"
    WEBSITE = "https://www.westcoastprowrestling.com"
    
    def scrape_events(self) -> List[PromotionEvent]:
        events = []
        
        soup = self._request(self.WEBSITE)
        
        if not soup:
            return events
        
        # West Coast Pro structure
        event_sections = soup.find_all(['div', 'section'], class_=re.compile(r'event', re.I))
        
        for section in event_sections:
            try:
                name_elem = section.find(['h1', 'h2', 'h3', 'h4'])
                if not name_elem:
                    continue
                
                name = name_elem.get_text(strip=True)
                
                # Look for date info
                date_elem = section.find(string=re.compile(r'\d{1,2}/\d{1,2}|\w+ \d{1,2}', re.I))
                if date_elem:
                    event_date = self._parse_date(str(date_elem).strip())
                else:
                    continue
                
                if not event_date:
                    continue
                
                event = PromotionEvent(
                    name=name,
                    event_date=event_date,
                    promotion_slug=self.SLUG,
                    city="San Francisco",
                    state="CA",
                    source_url=self.WEBSITE,
                )
                events.append(event)
                
            except Exception as e:
                logger.warning(f"Error parsing WCPW event: {e}")
                continue
        
        logger.info(f"WCPW: Found {len(events)} events")
        return events


# Registry of all promotion scrapers
PROMOTION_SCRAPERS = {
    'gcw': GCWScraper,
    'row': ROWScraper,
    'prestige': PrestigeScraper,
    'wcpw': WestCoastProScraper,
}


class PromotionScraperManager:
    """Manages multiple promotion scrapers"""
    
    def __init__(self, promotions: List[str] = None):
        """
        Args:
            promotions: List of promotion slugs to scrape, or None for all
        """
        self.promotions = promotions or list(PROMOTION_SCRAPERS.keys())
    
    def scrape_all(self) -> Dict[str, List[PromotionEvent]]:
        """Scrape events from all configured promotions"""
        results = {}
        
        for slug in self.promotions:
            if slug not in PROMOTION_SCRAPERS:
                logger.warning(f"Unknown promotion: {slug}")
                continue
            
            try:
                scraper_class = PROMOTION_SCRAPERS[slug]
                scraper = scraper_class()
                events = scraper.scrape_events()
                results[slug] = events
            except Exception as e:
                logger.error(f"Error scraping {slug}: {e}")
                results[slug] = []
        
        return results
    
    def scrape_to_json(self, output_file: str = "promotion_events.json"):
        """Scrape all promotions and save to JSON"""
        results = self.scrape_all()
        
        # Flatten to list
        all_events = []
        for slug, events in results.items():
            for event in events:
                all_events.append(asdict(event))
        
        with open(output_file, 'w') as f:
            json.dump(all_events, f, indent=2)
        
        logger.info(f"Saved {len(all_events)} events to {output_file}")
        
        # Summary
        print(f"\n{'='*50}")
        print("SCRAPE SUMMARY")
        print(f"{'='*50}")
        for slug, events in results.items():
            print(f"  {slug}: {len(events)} events")
        print(f"\nTotal: {len(all_events)} events")
        
        return all_events


def main():
    """Run all promotion scrapers"""
    manager = PromotionScraperManager()
    manager.scrape_to_json()


if __name__ == '__main__':
    main()
