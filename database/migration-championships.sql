-- ============================================
-- HOTTAG MIGRATION: Promotion Championships
-- Run this in Supabase SQL Editor
-- ============================================

-- Championships / Titles table
CREATE TABLE promotion_championships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL, -- e.g., "World Heavyweight Championship"
    short_name VARCHAR(100), -- e.g., "World Title"
    
    -- Current champion(s)
    current_champion_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
    current_champion_2_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL, -- For tag titles
    
    -- Meta
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    image_url TEXT, -- Belt image
    
    won_at_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    won_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotion_championships_promotion ON promotion_championships(promotion_id);

-- Trigger for updated_at
CREATE TRIGGER update_promotion_championships_updated_at 
    BEFORE UPDATE ON promotion_championships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE promotion_championships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view championships"
    ON promotion_championships FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage championships"
    ON promotion_championships FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM promotions p
            WHERE p.id = promotion_championships.promotion_id
            AND p.claimed_by = auth.uid()
        )
    );

-- Also ensure wrestler_promotions has proper RLS for reading
ALTER TABLE wrestler_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wrestler promotions"
    ON wrestler_promotions FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage roster"
    ON wrestler_promotions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM promotions p
            WHERE p.id = wrestler_promotions.promotion_id
            AND p.claimed_by = auth.uid()
        )
    );

DO $$ BEGIN RAISE NOTICE 'Championships migration complete!'; END $$;
