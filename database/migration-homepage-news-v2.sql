-- =============================================
-- HOMEPAGE NEWS V2: display_date, size, sort_order
-- + updated trigger with auto-expiry
-- =============================================

-- New columns
ALTER TABLE homepage_news ADD COLUMN IF NOT EXISTS display_date TIMESTAMPTZ;
ALTER TABLE homepage_news ADD COLUMN IF NOT EXISTS size TEXT NOT NULL DEFAULT 'small';
ALTER TABLE homepage_news ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Index for the updated query ordering
CREATE INDEX IF NOT EXISTS idx_homepage_news_sort ON homepage_news (is_active, sort_order ASC, created_at DESC);

-- =============================================
-- Replace trigger: add display_date, expires_at, size
-- =============================================

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
  display_ts TIMESTAMPTZ;
BEGIN
  -- Only fire when champion actually changes (not initial set from NULL)
  IF OLD.current_champion_id IS DISTINCT FROM NEW.current_champion_id
     AND OLD.current_champion_id IS NOT NULL
     AND NEW.current_champion_id IS NOT NULL THEN

    SELECT name, slug, photo_url INTO champion_name, champ_slug, champ_photo
    FROM wrestlers WHERE id = NEW.current_champion_id;

    championship_title := NEW.name;

    -- Use won_date from the championship record if available
    IF NEW.won_date IS NOT NULL THEN
      display_ts := NEW.won_date::timestamptz;
    ELSE
      display_ts := NULL;
    END IF;

    INSERT INTO homepage_news (
      type, title, image_url, link_url,
      related_wrestler_id, related_promotion_id, related_championship_id,
      is_auto, size, sort_order, display_date, expires_at
    ) VALUES (
      'title_change',
      champion_name || ' wins the ' || championship_title || '!',
      champ_photo,
      '/wrestlers/' || champ_slug,
      NEW.current_champion_id,
      NEW.promotion_id,
      NEW.id,
      true,
      'small',
      0,
      display_ts,
      NOW() + interval '5 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Backfill display_date for existing title changes
-- from the linked championship's won_date
-- =============================================

UPDATE homepage_news hn
SET display_date = pc.won_date::timestamptz
FROM promotion_championships pc
WHERE hn.related_championship_id = pc.id
  AND hn.type = 'title_change'
  AND hn.display_date IS NULL
  AND pc.won_date IS NOT NULL;

-- Verify: check how many title changes still have no display_date
SELECT COUNT(*) AS title_changes_without_display_date
FROM homepage_news
WHERE type = 'title_change' AND display_date IS NULL;
