-- =============================================
-- HOMEPAGE NEWS FEED
-- =============================================

-- Table for homepage news items (title changes, announcements, etc.)
CREATE TABLE IF NOT EXISTS homepage_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'announcement',  -- 'title_change', 'announcement'
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  link_url TEXT,
  related_wrestler_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  related_promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_championship_id UUID REFERENCES promotion_championships(id) ON DELETE SET NULL,
  is_auto BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_homepage_news_active ON homepage_news (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_news_type ON homepage_news (type);

-- RLS
ALTER TABLE homepage_news ENABLE ROW LEVEL SECURITY;

-- Public read for active, non-expired items
CREATE POLICY "Anyone can read active homepage news"
  ON homepage_news FOR SELECT
  USING (true);

-- Admin write (via service role or admin_users check)
CREATE POLICY "Admins can insert homepage news"
  ON homepage_news FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can update homepage news"
  ON homepage_news FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can delete homepage news"
  ON homepage_news FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- =============================================
-- AUTO-GENERATE TITLE CHANGE NEWS
-- =============================================

-- Allow the trigger function to insert into homepage_news
-- (runs as SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION generate_title_change_news()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  champion_name TEXT;
  champ_slug TEXT;
  champ_photo TEXT;
  championship_title TEXT;
BEGIN
  -- Only fire when champion actually changes (not initial set from NULL)
  IF OLD.current_champion_id IS DISTINCT FROM NEW.current_champion_id
     AND OLD.current_champion_id IS NOT NULL
     AND NEW.current_champion_id IS NOT NULL THEN

    SELECT name, slug, photo_url INTO champion_name, champ_slug, champ_photo
    FROM wrestlers WHERE id = NEW.current_champion_id;

    championship_title := NEW.name;

    INSERT INTO homepage_news (
      type, title, image_url, link_url,
      related_wrestler_id, related_promotion_id, related_championship_id,
      is_auto
    ) VALUES (
      'title_change',
      champion_name || ' wins the ' || championship_title || '!',
      champ_photo,
      '/wrestlers/' || champ_slug,
      NEW.current_champion_id,
      NEW.promotion_id,
      NEW.id,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_title_change_news
  AFTER UPDATE ON promotion_championships
  FOR EACH ROW
  EXECUTE FUNCTION generate_title_change_news();
