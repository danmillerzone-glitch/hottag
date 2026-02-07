-- Add is_tag_team column to promotion_championships
ALTER TABLE promotion_championships ADD COLUMN IF NOT EXISTS is_tag_team BOOLEAN DEFAULT false;
