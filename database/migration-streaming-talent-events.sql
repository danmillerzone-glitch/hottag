-- ============================================
-- HOTTAG MIGRATION: Streaming Links, Event CRUD, Announced Talent
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. STREAMING LINKS TABLE (multiple per event)
-- ============================================

CREATE TABLE event_streaming_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    platform VARCHAR(100) NOT NULL, -- 'FITE/Triller TV', 'YouTube', 'Twitch', 'IWTV', etc.
    url TEXT NOT NULL,
    label VARCHAR(255), -- Optional custom label e.g. "English Commentary"
    is_live BOOLEAN DEFAULT TRUE, -- true = live stream, false = VOD
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_streaming_links_event ON event_streaming_links(event_id);

-- Trigger for updated_at
CREATE TRIGGER update_event_streaming_links_updated_at 
    BEFORE UPDATE ON event_streaming_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE event_streaming_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streaming links"
    ON event_streaming_links FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage streaming links"
    ON event_streaming_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN promotions p ON e.promotion_id = p.id
            WHERE e.id = event_streaming_links.event_id
            AND p.claimed_by = auth.uid()
        )
    );

-- ============================================
-- 2. ANNOUNCED TALENT TABLE (talent without matches)
-- ============================================

CREATE TABLE event_announced_talent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    
    announcement_note VARCHAR(500), -- e.g. "Championship Opportunity", "Special Appearance"
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, wrestler_id)
);

CREATE INDEX idx_event_announced_talent_event ON event_announced_talent(event_id);
CREATE INDEX idx_event_announced_talent_wrestler ON event_announced_talent(wrestler_id);

-- RLS
ALTER TABLE event_announced_talent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announced talent"
    ON event_announced_talent FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage announced talent"
    ON event_announced_talent FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN promotions p ON e.promotion_id = p.id
            WHERE e.id = event_announced_talent.event_id
            AND p.claimed_by = auth.uid()
        )
    );

-- ============================================
-- 3. RLS POLICIES FOR EVENT CREATION/DELETION
-- ============================================

-- Allow promotion owners to INSERT new events
CREATE POLICY "Promotion owners can create events"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM promotions p
            WHERE p.id = promotion_id
            AND p.claimed_by = auth.uid()
        )
    );

-- Allow promotion owners to DELETE their events
CREATE POLICY "Promotion owners can delete their events"
    ON events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM promotions p
            WHERE p.id = events.promotion_id
            AND p.claimed_by = auth.uid()
        )
    );

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Streaming links, announced talent, and event CRUD migration completed!';
END $$;
