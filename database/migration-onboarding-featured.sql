-- Add onboarding_featured flag to promotions
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS onboarding_featured BOOLEAN DEFAULT false;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_promotions_onboarding_featured ON promotions (onboarding_featured) WHERE onboarding_featured = true;
