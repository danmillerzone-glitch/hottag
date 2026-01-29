"""
HotTag - Data Loader
Loads scraped data into Supabase database

Usage:
    python scripts/data_loader.py --events events.json
    python scripts/data_loader.py --sync-all
"""

import os
import json
import argparse
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
import logging
import re
from slugify import slugify  # pip install python-slugify

# Supabase client
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class LoaderStats:
    """Statistics for a data load operation"""
    items_processed: int = 0
    items_created: int = 0
    items_updated: int = 0
    items_skipped: int = 0
    errors: int = 0


class HotTagDataLoader:
    """Loads scraped wrestling data into Supabase"""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize the data loader with Supabase credentials.
        
        Credentials can be passed directly or set via environment variables:
        - SUPABASE_URL
        - SUPABASE_KEY (use the service_role key for write access)
        """
        self.supabase_url = supabase_url or os.environ.get('SUPABASE_URL')
        self.supabase_key = supabase_key or os.environ.get('SUPABASE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Supabase credentials required. Set SUPABASE_URL and SUPABASE_KEY "
                "environment variables or pass them to the constructor."
            )
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Cache for lookups
        self._promotion_cache: Dict[str, str] = {}  # slug -> id
        self._wrestler_cache: Dict[str, str] = {}  # slug -> id
        self._venue_cache: Dict[str, str] = {}  # key -> id
    
    def _make_slug(self, name: str) -> str:
        """Generate a URL-safe slug from a name"""
        return slugify(name, lowercase=True, max_length=200)
    
    def _get_or_create_promotion(self, promotion_data: Dict) -> Optional[str]:
        """Get or create a promotion, returns the promotion ID"""
        name = promotion_data.get('name') or promotion_data.get('promotion_name')
        if not name:
            return None
        
        slug = promotion_data.get('slug') or self._make_slug(name)
        
        # Check cache first
        if slug in self._promotion_cache:
            return self._promotion_cache[slug]
        
        # Check database
        result = self.client.table('promotions').select('id').eq('slug', slug).execute()
        
        if result.data:
            promotion_id = result.data[0]['id']
            self._promotion_cache[slug] = promotion_id
            return promotion_id
        
        # Create new promotion
        insert_data = {
            'name': name,
            'slug': slug,
            'website': promotion_data.get('website'),
            'twitter_handle': promotion_data.get('twitter_handle'),
            'city': promotion_data.get('city'),
            'state': promotion_data.get('state'),
            'country': promotion_data.get('country', 'USA'),
            'region': promotion_data.get('region'),
            'cagematch_id': promotion_data.get('cagematch_id') or promotion_data.get('promotion_cagematch_id'),
        }
        
        # Remove None values
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        try:
            result = self.client.table('promotions').insert(insert_data).execute()
            if result.data:
                promotion_id = result.data[0]['id']
                self._promotion_cache[slug] = promotion_id
                logger.info(f"Created promotion: {name}")
                return promotion_id
        except Exception as e:
            logger.error(f"Error creating promotion {name}: {e}")
        
        return None
    
    def _get_or_create_venue(self, venue_data: Dict) -> Optional[str]:
        """Get or create a venue, returns the venue ID"""
        name = venue_data.get('venue_name')
        city = venue_data.get('city')
        
        if not name or not city:
            return None
        
        # Create a cache key
        cache_key = f"{name}|{city}|{venue_data.get('state', '')}"
        
        if cache_key in self._venue_cache:
            return self._venue_cache[cache_key]
        
        # Check database - look for matching name and city
        result = (self.client.table('venues')
                  .select('id')
                  .eq('name', name)
                  .eq('city', city)
                  .execute())
        
        if result.data:
            venue_id = result.data[0]['id']
            self._venue_cache[cache_key] = venue_id
            return venue_id
        
        # Create new venue
        insert_data = {
            'name': name,
            'slug': self._make_slug(f"{name}-{city}"),
            'city': city,
            'state': venue_data.get('state'),
            'country': venue_data.get('country', 'USA'),
            'address_line1': venue_data.get('address'),
            'latitude': venue_data.get('latitude'),
            'longitude': venue_data.get('longitude'),
        }
        
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        try:
            result = self.client.table('venues').insert(insert_data).execute()
            if result.data:
                venue_id = result.data[0]['id']
                self._venue_cache[cache_key] = venue_id
                logger.info(f"Created venue: {name}, {city}")
                return venue_id
        except Exception as e:
            logger.error(f"Error creating venue {name}: {e}")
        
        return None
    
    def _get_or_create_wrestler(self, wrestler_data: Dict) -> Optional[str]:
        """Get or create a wrestler, returns the wrestler ID"""
        name = wrestler_data.get('name')
        if not name:
            return None
        
        slug = wrestler_data.get('slug') or self._make_slug(name)
        
        if slug in self._wrestler_cache:
            return self._wrestler_cache[slug]
        
        result = self.client.table('wrestlers').select('id').eq('slug', slug).execute()
        
        if result.data:
            wrestler_id = result.data[0]['id']
            self._wrestler_cache[slug] = wrestler_id
            return wrestler_id
        
        # Create new wrestler
        insert_data = {
            'name': name,
            'slug': slug,
            'hometown': wrestler_data.get('hometown'),
            'height': wrestler_data.get('height'),
            'weight': wrestler_data.get('weight'),
            'photo_url': wrestler_data.get('photo_url'),
            'twitter_handle': wrestler_data.get('twitter_handle'),
            'cagematch_id': wrestler_data.get('cagematch_id'),
            'cagematch_url': wrestler_data.get('cagematch_url'),
        }
        
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        try:
            result = self.client.table('wrestlers').insert(insert_data).execute()
            if result.data:
                wrestler_id = result.data[0]['id']
                self._wrestler_cache[slug] = wrestler_id
                logger.info(f"Created wrestler: {name}")
                return wrestler_id
        except Exception as e:
            logger.error(f"Error creating wrestler {name}: {e}")
        
        return None
    
    def load_events(self, events: List[Dict], source: str = "unknown") -> LoaderStats:
        """
        Load a list of events into the database.
        
        Args:
            events: List of event dictionaries
            source: Source identifier for logging
            
        Returns:
            LoaderStats with operation counts
        """
        stats = LoaderStats()
        
        for event_data in events:
            stats.items_processed += 1
            
            try:
                # Get or create promotion
                promotion_id = None
                if event_data.get('promotion_name') or event_data.get('promotion_slug'):
                    promotion_id = self._get_or_create_promotion(event_data)
                
                # Get or create venue
                venue_id = None
                if event_data.get('venue_name') and event_data.get('city'):
                    venue_id = self._get_or_create_venue(event_data)
                
                # Check if event already exists (by cagematch_id or name+date+promotion)
                existing = None
                
                if event_data.get('cagematch_id'):
                    result = (self.client.table('events')
                              .select('id')
                              .eq('cagematch_id', event_data['cagematch_id'])
                              .execute())
                    if result.data:
                        existing = result.data[0]
                
                if not existing and event_data.get('event_date'):
                    # Look for matching event by name, date, and promotion
                    query = (self.client.table('events')
                             .select('id')
                             .eq('event_date', event_data['event_date']))
                    
                    if promotion_id:
                        query = query.eq('promotion_id', promotion_id)
                    
                    # Fuzzy name match would be better, but for now exact match
                    result = query.execute()
                    
                    for row in result.data:
                        # If same date and same promotion, likely the same event
                        existing = row
                        break
                
                # Prepare event data
                event_record = {
                    'name': event_data.get('name'),
                    'event_date': event_data.get('event_date'),
                    'event_time': event_data.get('event_time'),
                    'doors_time': event_data.get('doors_time'),
                    'promotion_id': promotion_id,
                    'venue_id': venue_id,
                    'venue_name': event_data.get('venue_name'),
                    'city': event_data.get('city'),
                    'state': event_data.get('state'),
                    'country': event_data.get('country', 'USA'),
                    'latitude': event_data.get('latitude'),
                    'longitude': event_data.get('longitude'),
                    'ticket_url': event_data.get('ticket_url'),
                    'ticket_price_min': event_data.get('ticket_price_min'),
                    'ticket_price_max': event_data.get('ticket_price_max'),
                    'is_sold_out': event_data.get('is_sold_out', False),
                    'poster_url': event_data.get('poster_url'),
                    'description': event_data.get('description'),
                    'source_url': event_data.get('source_url') or event_data.get('cagematch_url'),
                    'source_name': source,
                    'cagematch_id': event_data.get('cagematch_id'),
                    'last_scraped_at': datetime.utcnow().isoformat(),
                }
                
                # Generate slug
                if event_data.get('name') and event_data.get('event_date'):
                    event_record['slug'] = self._make_slug(
                        f"{event_data['name']}-{event_data['event_date']}"
                    )
                
                # Remove None values
                event_record = {k: v for k, v in event_record.items() if v is not None}
                
                if existing:
                    # Update existing event
                    self.client.table('events').update(event_record).eq('id', existing['id']).execute()
                    stats.items_updated += 1
                    logger.debug(f"Updated event: {event_data.get('name')}")
                else:
                    # Create new event
                    result = self.client.table('events').insert(event_record).execute()
                    if result.data:
                        stats.items_created += 1
                        logger.info(f"Created event: {event_data.get('name')} ({event_data.get('event_date')})")
                        
                        # Link wrestlers if provided
                        event_id = result.data[0]['id']
                        wrestlers = event_data.get('wrestlers', []) or event_data.get('announced_wrestlers', [])
                        
                        for wrestler_name in wrestlers:
                            wrestler_id = self._get_or_create_wrestler({'name': wrestler_name})
                            if wrestler_id:
                                try:
                                    self.client.table('event_wrestlers').insert({
                                        'event_id': event_id,
                                        'wrestler_id': wrestler_id,
                                    }).execute()
                                except Exception:
                                    pass  # Ignore duplicate errors
                
            except Exception as e:
                logger.error(f"Error loading event: {e}")
                stats.errors += 1
        
        return stats
    
    def load_events_from_file(self, filepath: str, source: str = None) -> LoaderStats:
        """Load events from a JSON file"""
        with open(filepath, 'r') as f:
            events = json.load(f)
        
        source = source or os.path.basename(filepath).replace('.json', '')
        return self.load_events(events, source)
    
    def load_wrestlers(self, wrestlers: List[Dict]) -> LoaderStats:
        """Load a list of wrestlers into the database"""
        stats = LoaderStats()
        
        for wrestler_data in wrestlers:
            stats.items_processed += 1
            
            try:
                wrestler_id = self._get_or_create_wrestler(wrestler_data)
                if wrestler_id:
                    stats.items_created += 1
            except Exception as e:
                logger.error(f"Error loading wrestler: {e}")
                stats.errors += 1
        
        return stats
    
    def load_promotions(self, promotions: List[Dict]) -> LoaderStats:
        """Load a list of promotions into the database"""
        stats = LoaderStats()
        
        for promo_data in promotions:
            stats.items_processed += 1
            
            try:
                promo_id = self._get_or_create_promotion(promo_data)
                if promo_id:
                    stats.items_created += 1
            except Exception as e:
                logger.error(f"Error loading promotion: {e}")
                stats.errors += 1
        
        return stats
    
    def log_scrape(self, source: str, scrape_type: str, stats: LoaderStats, 
                   started_at: datetime, error_message: str = None):
        """Log a scrape operation to the database"""
        completed_at = datetime.utcnow()
        duration = int((completed_at - started_at).total_seconds())
        
        log_entry = {
            'source': source,
            'scrape_type': scrape_type,
            'status': 'failed' if error_message else 'completed',
            'items_found': stats.items_processed,
            'items_created': stats.items_created,
            'items_updated': stats.items_updated,
            'items_skipped': stats.items_skipped,
            'error_message': error_message,
            'started_at': started_at.isoformat(),
            'completed_at': completed_at.isoformat(),
            'duration_seconds': duration,
        }
        
        try:
            self.client.table('scrape_logs').insert(log_entry).execute()
        except Exception as e:
            logger.error(f"Error logging scrape: {e}")


# Sample promotions data for initial load
INITIAL_PROMOTIONS = [
    {
        "name": "Game Changer Wrestling",
        "slug": "gcw",
        "website": "https://www.longlivegcw.com",
        "twitter_handle": "GCWrestling_",
        "region": "National",
        "city": "Jersey City",
        "state": "NJ",
        "country": "USA"
    },
    {
        "name": "Pro Wrestling Guerrilla",
        "slug": "pwg",
        "website": "https://www.prowrestlingguerrilla.com",
        "twitter_handle": "OfficialPWG",
        "region": "California",
        "city": "Los Angeles",
        "state": "CA",
        "country": "USA"
    },
    {
        "name": "Reality of Wrestling",
        "slug": "row",
        "website": "https://realityofwrestling.com",
        "twitter_handle": "TheOfficialROW",
        "region": "Texas",
        "city": "Texas City",
        "state": "TX",
        "country": "USA"
    },
    {
        "name": "DEFY Wrestling",
        "slug": "defy",
        "website": "https://defywrestling.com",
        "twitter_handle": "defywrestling",
        "region": "Pacific Northwest",
        "city": "Seattle",
        "state": "WA",
        "country": "USA"
    },
    {
        "name": "West Coast Pro Wrestling",
        "slug": "wcpw",
        "website": "https://www.westcoastprowrestling.com",
        "twitter_handle": "WCProWrestling",
        "region": "California",
        "city": "San Francisco",
        "state": "CA",
        "country": "USA"
    },
    {
        "name": "Prestige Wrestling",
        "slug": "prestige",
        "website": "https://www.prestigewrestling.net",
        "twitter_handle": "WeArePrestige",
        "region": "Pacific Northwest",
        "city": "Portland",
        "state": "OR",
        "country": "USA"
    },
    {
        "name": "Black Label Pro",
        "slug": "blp",
        "website": "https://blacklabelpro.com",
        "twitter_handle": "BLabelPro",
        "region": "Midwest",
        "city": "Crown Point",
        "state": "IN",
        "country": "USA"
    },
    {
        "name": "Beyond Wrestling",
        "slug": "beyond",
        "website": "https://beyondwrestlingonline.com",
        "twitter_handle": "beyondwrestling",
        "region": "New England",
        "city": "Worcester",
        "state": "MA",
        "country": "USA"
    },
    {
        "name": "ACTION Wrestling",
        "slug": "action",
        "website": "https://actionwrestling.net",
        "twitter_handle": "ACTIONWrestling",
        "region": "Southeast",
        "city": "Tyrone",
        "state": "GA",
        "country": "USA"
    },
    {
        "name": "Freelance Wrestling",
        "slug": "freelance",
        "website": "https://freelancewrestling.com",
        "twitter_handle": "FreelanceWres",
        "region": "Midwest",
        "city": "Chicago",
        "state": "IL",
        "country": "USA"
    },
    {
        "name": "Shimmer Women Athletes",
        "slug": "shimmer",
        "website": "https://shimmerwrestling.com",
        "twitter_handle": "shaboringwrestling",
        "region": "Midwest",
        "city": "Chicago",
        "state": "IL",
        "country": "USA"
    },
    {
        "name": "Wrestling Revolver",
        "slug": "revolver",
        "website": "https://wrestlingrevolver.com",
        "twitter_handle": "TheWrestlingRev",
        "region": "Midwest",
        "city": "Des Moines",
        "state": "IA",
        "country": "USA"
    },
    {
        "name": "ICW No Holds Barred",
        "slug": "icw-nhb",
        "website": "https://icwnhb.com",
        "twitter_handle": "ICWNHB",
        "region": "Florida",
        "city": "Tampa",
        "state": "FL",
        "country": "USA"
    },
    {
        "name": "Warrior Wrestling",
        "slug": "warrior",
        "website": "https://warriorwrestling.net",
        "twitter_handle": "WarriorWrstlng",
        "region": "Midwest",
        "city": "Chicago Heights",
        "state": "IL",
        "country": "USA"
    },
    {
        "name": "Mission Pro Wrestling",
        "slug": "mission-pro",
        "website": "https://missionprowrestling.com",
        "twitter_handle": "MissionProWres",
        "region": "Texas",
        "city": "San Antonio",
        "state": "TX",
        "country": "USA"
    },
]


def main():
    parser = argparse.ArgumentParser(description='Load scraped data into HotTag database')
    parser.add_argument('--events', type=str, help='JSON file with events to load')
    parser.add_argument('--wrestlers', type=str, help='JSON file with wrestlers to load')
    parser.add_argument('--init-promotions', action='store_true', help='Load initial promotions')
    parser.add_argument('--dry-run', action='store_true', help='Print what would be done without making changes')
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("DRY RUN MODE - No changes will be made")
        return
    
    try:
        loader = HotTagDataLoader()
    except ValueError as e:
        print(f"Error: {e}")
        print("\nSet environment variables:")
        print("  export SUPABASE_URL='your-project-url'")
        print("  export SUPABASE_KEY='your-service-role-key'")
        return
    
    if args.init_promotions:
        print("Loading initial promotions...")
        stats = loader.load_promotions(INITIAL_PROMOTIONS)
        print(f"Promotions: {stats.items_created} created, {stats.errors} errors")
    
    if args.events:
        print(f"Loading events from {args.events}...")
        stats = loader.load_events_from_file(args.events)
        print(f"Events: {stats.items_created} created, {stats.items_updated} updated, {stats.errors} errors")
    
    if args.wrestlers:
        print(f"Loading wrestlers from {args.wrestlers}...")
        with open(args.wrestlers, 'r') as f:
            wrestlers = json.load(f)
        stats = loader.load_wrestlers(wrestlers)
        print(f"Wrestlers: {stats.items_created} created, {stats.errors} errors")


if __name__ == '__main__':
    main()
