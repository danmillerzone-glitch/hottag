-- ============================================
-- HOTTAG MIGRATION: Admin Powers Expansion
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Site-wide Announcements
-- ============================================
CREATE TABLE IF NOT EXISTS site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- info, warning, success, promo
  link_url TEXT,
  link_text VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
  ON site_announcements FOR SELECT
  USING (is_active = true);

-- Admins can do everything with announcements
CREATE POLICY "Admins can manage announcements"
  ON site_announcements FOR ALL
  USING (is_admin(auth.uid()));

-- ============================================
-- 2. User Bans
-- ============================================
CREATE TABLE IF NOT EXISTS banned_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage bans
CREATE POLICY "Admins can manage bans"
  ON banned_users FOR ALL
  USING (is_admin(auth.uid()));

-- Users can check if they are banned
CREATE POLICY "Users can check own ban status"
  ON banned_users FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 3. Admin RLS additions for full editing
-- ============================================

-- Admins can update any event
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update any event'
  ) THEN
    CREATE POLICY "Admins can update any event"
      ON events FOR UPDATE
      USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can delete any event
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete any event'
  ) THEN
    CREATE POLICY "Admins can delete any event"
      ON events FOR DELETE
      USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can insert events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert events'
  ) THEN
    CREATE POLICY "Admins can insert events"
      ON events FOR INSERT
      WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can insert promotions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert promotions'
  ) THEN
    CREATE POLICY "Admins can insert promotions"
      ON promotions FOR INSERT
      WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can delete promotions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete promotions'
  ) THEN
    CREATE POLICY "Admins can delete promotions"
      ON promotions FOR DELETE
      USING (is_admin(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 4. Merge wrestler helper function
-- ============================================
CREATE OR REPLACE FUNCTION merge_wrestlers(keep_id UUID, remove_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Move event_wrestlers references
  UPDATE event_wrestlers SET wrestler_id = keep_id WHERE wrestler_id = remove_id
    AND NOT EXISTS (SELECT 1 FROM event_wrestlers ew2 WHERE ew2.event_id = event_wrestlers.event_id AND ew2.wrestler_id = keep_id);
  DELETE FROM event_wrestlers WHERE wrestler_id = remove_id;

  -- Move match_participants references
  UPDATE match_participants SET wrestler_id = keep_id WHERE wrestler_id = remove_id
    AND NOT EXISTS (SELECT 1 FROM match_participants mp2 WHERE mp2.match_id = match_participants.match_id AND mp2.wrestler_id = keep_id);
  DELETE FROM match_participants WHERE wrestler_id = remove_id;

  -- Move event_announced_talent references
  UPDATE event_announced_talent SET wrestler_id = keep_id WHERE wrestler_id = remove_id
    AND NOT EXISTS (SELECT 1 FROM event_announced_talent eat2 WHERE eat2.event_id = event_announced_talent.event_id AND eat2.wrestler_id = keep_id);
  DELETE FROM event_announced_talent WHERE wrestler_id = remove_id;

  -- Move follows
  UPDATE user_follows_wrestler SET wrestler_id = keep_id WHERE wrestler_id = remove_id
    AND NOT EXISTS (SELECT 1 FROM user_follows_wrestler ufw2 WHERE ufw2.user_id = user_follows_wrestler.user_id AND ufw2.wrestler_id = keep_id);
  DELETE FROM user_follows_wrestler WHERE wrestler_id = remove_id;

  -- Move championship_reigns if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'championship_reigns') THEN
    UPDATE championship_reigns SET wrestler_id = keep_id WHERE wrestler_id = remove_id;
  END IF;

  -- Transfer claim if the kept wrestler is unclaimed but removed one was claimed
  UPDATE wrestlers SET
    claimed_by = COALESCE((SELECT claimed_by FROM wrestlers WHERE id = keep_id), (SELECT claimed_by FROM wrestlers WHERE id = remove_id)),
    pwi_ranking = COALESCE((SELECT pwi_ranking FROM wrestlers WHERE id = keep_id), (SELECT pwi_ranking FROM wrestlers WHERE id = remove_id)),
    photo_url = COALESCE((SELECT photo_url FROM wrestlers WHERE id = keep_id), (SELECT photo_url FROM wrestlers WHERE id = remove_id)),
    bio = COALESCE((SELECT bio FROM wrestlers WHERE id = keep_id), (SELECT bio FROM wrestlers WHERE id = remove_id)),
    hometown = COALESCE((SELECT hometown FROM wrestlers WHERE id = keep_id), (SELECT hometown FROM wrestlers WHERE id = remove_id))
  WHERE id = keep_id;

  -- Delete the merged-away wrestler
  DELETE FROM wrestlers WHERE id = remove_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE 'Admin powers expansion complete!';
END $$;
