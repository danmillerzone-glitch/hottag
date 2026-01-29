-- ============================================
-- HOTTAG DATABASE SCHEMA
-- Indie Wrestling Event Tracker
-- Version 1.0
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic queries

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('fan', 'wrestler', 'promotion', 'admin');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE attendance_status AS ENUM ('attending', 'interested', 'saved');

-- ============================================
-- CORE TABLES
-- ============================================

-- PROMOTIONS
-- Stores wrestling promotions (GCW, PWG, ROW, etc.)
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Branding
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7), -- Hex color
    
    -- Contact & Social
    website VARCHAR(500),
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    facebook_url VARCHAR(500),
    youtube_url VARCHAR(500),
    
    -- Location
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    region VARCHAR(100), -- e.g., "Pacific Northwest", "Texas", "Midwest"
    
    -- Verification
    verification_status verification_status DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    claimed_by UUID, -- References users.id (added later via FK)
    
    -- Scraping metadata
    cagematch_id INTEGER,
    cagematch_url TEXT,
    last_scraped_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX idx_promotions_slug ON promotions(slug);
CREATE INDEX idx_promotions_region ON promotions(region);
CREATE INDEX idx_promotions_search ON promotions USING GIN(search_vector);

-- VENUES
-- Stores venue information for events
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Geographic coordinates (for map display and distance filtering)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography type
    
    -- Venue details
    capacity INTEGER,
    venue_type VARCHAR(100), -- arena, bar, community center, etc.
    website VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_city_state ON venues(city, state);
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- WRESTLERS
-- Stores wrestler profiles
CREATE TABLE wrestlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Profile
    real_name VARCHAR(255), -- Only shown if wrestler chooses
    bio TEXT,
    hometown VARCHAR(255),
    height VARCHAR(20), -- e.g., "6'2\""
    weight VARCHAR(20), -- e.g., "225 lbs"
    
    -- Media
    photo_url TEXT,
    banner_url TEXT,
    photos TEXT[], -- Array of additional photo URLs
    
    -- Social & Links
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    youtube_url VARCHAR(500),
    merch_url VARCHAR(500),
    booking_email VARCHAR(255),
    website VARCHAR(500),
    
    -- Career info
    years_active_start INTEGER,
    signature_moves TEXT[], -- Array of signature move names
    
    -- Verification
    verification_status verification_status DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    claimed_by UUID, -- References users.id
    
    -- Stats (updated periodically)
    follower_count INTEGER DEFAULT 0,
    upcoming_events_count INTEGER DEFAULT 0,
    
    -- Scraping metadata
    cagematch_id INTEGER,
    cagematch_url TEXT,
    last_scraped_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(hometown, '')), 'C')
    ) STORED
);

CREATE INDEX idx_wrestlers_slug ON wrestlers(slug);
CREATE INDEX idx_wrestlers_cagematch_id ON wrestlers(cagematch_id);
CREATE INDEX idx_wrestlers_search ON wrestlers USING GIN(search_vector);

-- EVENTS
-- Stores wrestling events/shows
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    description TEXT,
    
    -- Event details
    event_date DATE NOT NULL,
    event_time TIME,
    doors_time TIME,
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    
    -- Status
    status event_status DEFAULT 'upcoming',
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Relations
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    -- Location (denormalized for quick access & in case venue is null)
    venue_name VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    
    -- Tickets
    ticket_url TEXT,
    ticket_price_min DECIMAL(10, 2),
    ticket_price_max DECIMAL(10, 2),
    is_free BOOLEAN DEFAULT FALSE,
    is_sold_out BOOLEAN DEFAULT FALSE,
    
    -- Media
    poster_url TEXT,
    banner_url TEXT,
    
    -- Stats (updated periodically)
    attending_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0,
    
    -- Scraping metadata
    source_url TEXT,
    source_name VARCHAR(100), -- 'cagematch', 'wrestlemap', 'promotion_website', etc.
    cagematch_id INTEGER,
    last_scraped_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(city, '')), 'C')
    ) STORED
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_promotion ON events(promotion_id);
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_search ON events USING GIN(search_vector);
CREATE INDEX idx_events_upcoming ON events(event_date) WHERE status = 'upcoming';

-- ============================================
-- USER TABLES
-- ============================================

-- USERS
-- Stores user accounts (fans, wrestlers, promotions)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Auth (Supabase Auth handles most of this, but we store profile data)
    auth_id UUID UNIQUE, -- Links to Supabase Auth user
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    
    -- Profile
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    
    -- Location (for geo-filtering)
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    default_radius_miles INTEGER DEFAULT 100,
    
    -- User type
    user_type user_type DEFAULT 'fan',
    
    -- Linked profiles (for wrestlers/promotions who claim their page)
    wrestler_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    
    -- Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    notification_radius_miles INTEGER DEFAULT 100,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users USING GIST(location);

-- Add foreign keys that reference users back to other tables
ALTER TABLE promotions ADD CONSTRAINT fk_promotions_claimed_by 
    FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE wrestlers ADD CONSTRAINT fk_wrestlers_claimed_by 
    FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- JUNCTION/RELATIONSHIP TABLES
-- ============================================

-- EVENT_WRESTLERS
-- Links wrestlers to events (the "card")
CREATE TABLE event_wrestlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    
    -- Match details (optional)
    match_type VARCHAR(255), -- "Singles Match", "Tag Team", "Championship Match"
    is_champion BOOLEAN DEFAULT FALSE,
    championship_name VARCHAR(255),
    opponent_ids UUID[], -- Array of opponent wrestler IDs
    match_order INTEGER, -- Order on the card
    
    -- Result (filled in after event)
    result VARCHAR(50), -- 'win', 'loss', 'draw', 'no_contest'
    match_rating DECIMAL(3, 2), -- e.g., 4.50 stars
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, wrestler_id)
);

CREATE INDEX idx_event_wrestlers_event ON event_wrestlers(event_id);
CREATE INDEX idx_event_wrestlers_wrestler ON event_wrestlers(wrestler_id);

-- WRESTLER_PROMOTIONS
-- Links wrestlers to promotions they regularly work for
CREATE TABLE wrestler_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_exclusive BOOLEAN DEFAULT FALSE,
    started_at DATE,
    ended_at DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(wrestler_id, promotion_id)
);

CREATE INDEX idx_wrestler_promotions_wrestler ON wrestler_promotions(wrestler_id);
CREATE INDEX idx_wrestler_promotions_promotion ON wrestler_promotions(promotion_id);

-- ============================================
-- USER INTERACTION TABLES
-- ============================================

-- USER_FOLLOWS_WRESTLERS
-- Fans following wrestlers
CREATE TABLE user_follows_wrestlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    
    notify_new_events BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, wrestler_id)
);

CREATE INDEX idx_user_follows_wrestlers_user ON user_follows_wrestlers(user_id);
CREATE INDEX idx_user_follows_wrestlers_wrestler ON user_follows_wrestlers(wrestler_id);

-- USER_FOLLOWS_PROMOTIONS
-- Fans following promotions
CREATE TABLE user_follows_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    notify_new_events BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, promotion_id)
);

CREATE INDEX idx_user_follows_promotions_user ON user_follows_promotions(user_id);
CREATE INDEX idx_user_follows_promotions_promotion ON user_follows_promotions(promotion_id);

-- USER_EVENT_ATTENDANCE
-- Users marking events as attending/interested/saved
CREATE TABLE user_event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    status attendance_status NOT NULL,
    is_public BOOLEAN DEFAULT TRUE, -- Whether to show on public profile
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_event_attendance_user ON user_event_attendance(user_id);
CREATE INDEX idx_user_event_attendance_event ON user_event_attendance(event_id);
CREATE INDEX idx_user_event_attendance_status ON user_event_attendance(status);

-- USER_FRIENDS
-- Friend connections between users
CREATE TABLE user_friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX idx_user_friends_user ON user_friends(user_id);
CREATE INDEX idx_user_friends_friend ON user_friends(friend_id);

-- ============================================
-- SCRAPING/ADMIN TABLES
-- ============================================

-- SCRAPE_LOGS
-- Logs scraping runs for debugging and monitoring
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source VARCHAR(100) NOT NULL, -- 'cagematch', 'wrestlemap', 'gcw', etc.
    scrape_type VARCHAR(100), -- 'events', 'wrestlers', 'promotions'
    
    status VARCHAR(50), -- 'started', 'completed', 'failed'
    
    items_found INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    
    error_message TEXT,
    error_details JSONB,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

CREATE INDEX idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX idx_scrape_logs_started ON scrape_logs(started_at);

-- SCRAPE_QUEUE
-- Queue for items to be scraped
CREATE TABLE scrape_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    item_type VARCHAR(100), -- 'event', 'wrestler', 'promotion'
    
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    last_error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ
);

CREATE INDEX idx_scrape_queue_status ON scrape_queue(status);
CREATE INDEX idx_scrape_queue_priority ON scrape_queue(priority, created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wrestlers_updated_at BEFORE UPDATE ON wrestlers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_event_attendance_updated_at BEFORE UPDATE ON user_event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update wrestler follower count
CREATE OR REPLACE FUNCTION update_wrestler_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE wrestlers SET follower_count = follower_count + 1 WHERE id = NEW.wrestler_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE wrestlers SET follower_count = follower_count - 1 WHERE id = OLD.wrestler_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wrestler_followers AFTER INSERT OR DELETE ON user_follows_wrestlers
    FOR EACH ROW EXECUTE FUNCTION update_wrestler_follower_count();

-- Function to update event attendance counts
CREATE OR REPLACE FUNCTION update_event_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE events SET 
            attending_count = (SELECT COUNT(*) FROM user_event_attendance WHERE event_id = NEW.event_id AND status = 'attending'),
            interested_count = (SELECT COUNT(*) FROM user_event_attendance WHERE event_id = NEW.event_id AND status = 'interested')
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events SET 
            attending_count = (SELECT COUNT(*) FROM user_event_attendance WHERE event_id = OLD.event_id AND status = 'attending'),
            interested_count = (SELECT COUNT(*) FROM user_event_attendance WHERE event_id = OLD.event_id AND status = 'interested')
        WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_attendance AFTER INSERT OR UPDATE OR DELETE ON user_event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_event_attendance_count();

-- Function to update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_location_geography()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venue_location BEFORE INSERT OR UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_location_geography();

CREATE TRIGGER update_event_location BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_location_geography();

CREATE TRIGGER update_user_location BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_location_geography();

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Upcoming events with promotion info
CREATE VIEW upcoming_events_view AS
SELECT 
    e.*,
    p.name as promotion_name,
    p.slug as promotion_slug,
    p.logo_url as promotion_logo
FROM events e
LEFT JOIN promotions p ON e.promotion_id = p.id
WHERE e.status = 'upcoming' AND e.event_date >= CURRENT_DATE
ORDER BY e.event_date ASC;

-- Wrestler with upcoming event count
CREATE VIEW wrestlers_with_events_view AS
SELECT 
    w.*,
    COUNT(DISTINCT ew.event_id) FILTER (WHERE e.event_date >= CURRENT_DATE) as upcoming_count
FROM wrestlers w
LEFT JOIN event_wrestlers ew ON w.id = ew.wrestler_id
LEFT JOIN events e ON ew.event_id = e.id AND e.status = 'upcoming'
GROUP BY w.id;

-- ============================================
-- HELPER FUNCTION FOR DISTANCE QUERIES
-- ============================================

-- Get events within X miles of a point
CREATE OR REPLACE FUNCTION get_events_within_radius(
    lat DECIMAL,
    lng DECIMAL,
    radius_miles INTEGER,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    event_date DATE,
    city VARCHAR,
    state VARCHAR,
    promotion_name VARCHAR,
    distance_miles FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.event_date,
        e.city,
        e.state,
        p.name as promotion_name,
        (ST_Distance(
            e.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1609.34)::FLOAT as distance_miles
    FROM events e
    LEFT JOIN promotions p ON e.promotion_id = p.id
    WHERE e.status = 'upcoming'
        AND e.event_date >= CURRENT_DATE
        AND ST_DWithin(
            e.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_miles * 1609.34 -- Convert miles to meters
        )
    ORDER BY e.event_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample promotions
INSERT INTO promotions (name, slug, website, twitter_handle, region, city, state) VALUES
('Game Changer Wrestling', 'gcw', 'https://www.longlivegcw.com', 'GCWrestling_', 'National', 'Jersey City', 'NJ'),
('Pro Wrestling Guerrilla', 'pwg', 'https://www.prowrestlingguerrilla.com', 'OfficialPWG', 'California', 'Los Angeles', 'CA'),
('Reality of Wrestling', 'row', 'https://realityofwrestling.com', 'TheOfficialROW', 'Texas', 'Texas City', 'TX'),
('DEFY Wrestling', 'defy', 'https://defywrestling.com', 'defywrestling', 'Pacific Northwest', 'Seattle', 'WA'),
('West Coast Pro Wrestling', 'wcpw', 'https://www.westcoastprowrestling.com', 'WCProWrestling', 'California', 'San Francisco', 'CA'),
('Prestige Wrestling', 'prestige', 'https://www.prestigewrestling.net', 'WeArePrestige', 'Pacific Northwest', 'Portland', 'OR'),
('Black Label Pro', 'blp', 'https://blacklabelpro.com', 'BLabelPro', 'Midwest', 'Crown Point', 'IN'),
('Beyond Wrestling', 'beyond', 'https://beyondwrestlingonline.com', 'beyondwrestling', 'New England', 'Worcester', 'MA'),
('ACTION Wrestling', 'action', 'https://actionwrestling.net', 'ACTIONWrestling', 'Southeast', 'Tyrone', 'GA'),
('Freelance Wrestling', 'freelance', 'https://freelancewrestling.com', 'FreelanceWres', 'Midwest', 'Chicago', 'IL');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'HotTag database schema created successfully!';
END $$;
