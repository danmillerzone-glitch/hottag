-- ============================================
-- HOTTAG DATABASE SCHEMA - PHASE 1 MVP
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('fan', 'wrestler', 'promotion', 'admin');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE attendance_status AS ENUM ('attending', 'interested', 'saved');

-- ============================================
-- PROMOTIONS TABLE
-- ============================================

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website VARCHAR(500),
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    region VARCHAR(100),
    verification_status verification_status DEFAULT 'unverified',
    cagematch_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_slug ON promotions(slug);
CREATE INDEX idx_promotions_region ON promotions(region);

-- ============================================
-- VENUES TABLE
-- ============================================

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    address_line1 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_city_state ON venues(city, state);

-- ============================================
-- WRESTLERS TABLE
-- ============================================

CREATE TABLE wrestlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    hometown VARCHAR(255),
    photo_url TEXT,
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    merch_url VARCHAR(500),
    verification_status verification_status DEFAULT 'unverified',
    follower_count INTEGER DEFAULT 0,
    upcoming_events_count INTEGER DEFAULT 0,
    cagematch_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wrestlers_slug ON wrestlers(slug);
CREATE INDEX idx_wrestlers_cagematch_id ON wrestlers(cagematch_id);

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    doors_time TIME,
    status event_status DEFAULT 'upcoming',
    is_featured BOOLEAN DEFAULT FALSE,
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    venue_name VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ticket_url TEXT,
    ticket_price_min DECIMAL(10, 2),
    ticket_price_max DECIMAL(10, 2),
    is_free BOOLEAN DEFAULT FALSE,
    is_sold_out BOOLEAN DEFAULT FALSE,
    poster_url TEXT,
    attending_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0,
    source_url TEXT,
    source_name VARCHAR(100),
    cagematch_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_promotion ON events(promotion_id);
CREATE INDEX idx_events_city_state ON events(city, state);
CREATE INDEX idx_events_upcoming ON events(event_date) WHERE status = 'upcoming';

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    default_radius_miles INTEGER DEFAULT 100,
    user_type user_type DEFAULT 'fan',
    wrestler_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- JUNCTION TABLES
-- ============================================

-- Event Wrestlers (the card)
CREATE TABLE event_wrestlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    match_type VARCHAR(255),
    match_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, wrestler_id)
);

CREATE INDEX idx_event_wrestlers_event ON event_wrestlers(event_id);
CREATE INDEX idx_event_wrestlers_wrestler ON event_wrestlers(wrestler_id);

-- Wrestler Promotions
CREATE TABLE wrestler_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wrestler_id, promotion_id)
);

-- ============================================
-- USER INTERACTION TABLES
-- ============================================

-- User Follows Wrestlers
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

-- User Follows Promotions
CREATE TABLE user_follows_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    notify_new_events BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, promotion_id)
);

CREATE INDEX idx_user_follows_promotions_user ON user_follows_promotions(user_id);

-- User Event Attendance
CREATE TABLE user_event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_event_attendance_user ON user_event_attendance(user_id);
CREATE INDEX idx_user_event_attendance_event ON user_event_attendance(event_id);

-- ============================================
-- SCRAPE LOGS TABLE
-- ============================================

CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL,
    scrape_type VARCHAR(100),
    status VARCHAR(50),
    items_found INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- ============================================
-- INITIAL PROMOTIONS DATA
-- ============================================

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
('Freelance Wrestling', 'freelance', 'https://freelancewrestling.com', 'FreelanceWres', 'Midwest', 'Chicago', 'IL'),
('Shimmer Women Athletes', 'shimmer', 'https://shimmerwrestling.com', 'shimaboringwrestling', 'Midwest', 'Chicago', 'IL'),
('Wrestling Revolver', 'revolver', 'https://wrestlingrevolver.com', 'TheWrestlingRev', 'Midwest', 'Des Moines', 'IA'),
('ICW No Holds Barred', 'icw-nhb', 'https://icwnhb.com', 'ICWNHB', 'Florida', 'Tampa', 'FL'),
('Warrior Wrestling', 'warrior', 'https://warriorwrestling.net', 'WarriorWrstlng', 'Midwest', 'Chicago Heights', 'IL'),
('Mission Pro Wrestling', 'mission-pro', 'https://missionprowrestling.com', 'MissionProWres', 'Texas', 'San Antonio', 'TX'),
('New Texas Pro Wrestling', 'new-texas-pro', 'https://newtexaspro.com', 'NewTexasPro', 'Texas', 'Dallas', 'TX'),
('Terminus', 'terminus', 'https://terminusprowrestling.com', 'TerminusATL', 'Southeast', 'Atlanta', 'GA'),
('Glory Pro Wrestling', 'glory-pro', 'https://gloryprowrestling.com', 'GloryProWrestle', 'Midwest', 'St. Louis', 'MO'),
('Limitless Wrestling', 'limitless', 'https://limitlesswrestling.com', 'LWMaine', 'New England', 'Portland', 'ME'),
('Enjoy Wrestling', 'enjoy', 'https://enjoywrestling.com', 'EnjoyWrestling', 'Northeast', 'Pittsburgh', 'PA');

-- ============================================
-- DONE!
-- ============================================

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
