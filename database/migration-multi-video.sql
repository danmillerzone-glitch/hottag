-- Multi-video system for wrestlers and promotions
CREATE TABLE IF NOT EXISTS profile_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_owner CHECK (
    (wrestler_id IS NOT NULL AND promotion_id IS NULL) OR
    (wrestler_id IS NULL AND promotion_id IS NOT NULL)
  )
);

ALTER TABLE profile_videos ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "videos_public_read" ON profile_videos FOR SELECT USING (true);

-- Wrestler owner write
CREATE POLICY "videos_wrestler_owner" ON profile_videos FOR ALL USING (
  wrestler_id IN (SELECT id FROM wrestlers WHERE claimed_by = auth.uid())
) WITH CHECK (
  wrestler_id IN (SELECT id FROM wrestlers WHERE claimed_by = auth.uid())
);

-- Promotion owner write
CREATE POLICY "videos_promotion_owner" ON profile_videos FOR ALL USING (
  promotion_id IN (SELECT promotion_id FROM promotion_admins WHERE user_id = auth.uid())
) WITH CHECK (
  promotion_id IN (SELECT promotion_id FROM promotion_admins WHERE user_id = auth.uid())
);

CREATE INDEX idx_profile_videos_wrestler ON profile_videos(wrestler_id) WHERE wrestler_id IS NOT NULL;
CREATE INDEX idx_profile_videos_promotion ON profile_videos(promotion_id) WHERE promotion_id IS NOT NULL;

-- Migrate existing featured_video_url data into the new table
INSERT INTO profile_videos (wrestler_id, title, url, sort_order)
SELECT id, featured_video_title, featured_video_url, 0
FROM wrestlers
WHERE featured_video_url IS NOT NULL AND featured_video_url != '';

INSERT INTO profile_videos (promotion_id, title, url, sort_order)
SELECT id, featured_video_title, featured_video_url, 0
FROM promotions
WHERE featured_video_url IS NOT NULL AND featured_video_url != '';
