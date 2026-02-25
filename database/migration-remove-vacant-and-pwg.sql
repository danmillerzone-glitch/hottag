-- =============================================
-- 1. Remove all vacant championships
-- (no current champion = vacant)
-- =============================================

DELETE FROM promotion_championships
WHERE current_champion_id IS NULL;

-- Verify: should return 0
SELECT COUNT(*) AS remaining_vacant FROM promotion_championships WHERE current_champion_id IS NULL;


-- =============================================
-- 2. Remove Pro Wrestling Guerrilla
-- Also clean up related data first
-- =============================================

-- Remove championships
DELETE FROM promotion_championships
WHERE promotion_id = (SELECT id FROM promotions WHERE slug = 'pwg');

-- Remove roster links
DELETE FROM wrestler_promotions
WHERE promotion_id = (SELECT id FROM promotions WHERE slug = 'pwg');

-- Remove any news referencing this promotion
DELETE FROM homepage_news
WHERE related_promotion_id = (SELECT id FROM promotions WHERE slug = 'pwg');

-- Remove the promotion itself
DELETE FROM promotions WHERE slug = 'pwg';

-- Verify
SELECT COUNT(*) AS remaining FROM promotions WHERE slug = 'pwg';
