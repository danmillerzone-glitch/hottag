-- Featured video URL for wrestler pages (YouTube embed)
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS featured_video_url TEXT;

-- Merch gallery items
CREATE TABLE IF NOT EXISTS wrestler_merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  price TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wrestler_merch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merch_read" ON wrestler_merch_items FOR SELECT USING (true);
CREATE POLICY "merch_owner" ON wrestler_merch_items FOR ALL USING (
  wrestler_id IN (SELECT id FROM wrestlers WHERE claimed_by = auth.uid())
);

CREATE INDEX idx_merch_wrestler ON wrestler_merch_items(wrestler_id);

-- Promoter coupon codes for events
ALTER TABLE events ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS coupon_label TEXT DEFAULT 'Use code for discount';
