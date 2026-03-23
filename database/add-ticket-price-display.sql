-- Add ticket_price_display text column for international currency support
-- Promoters type their own price string (e.g., "$25", "¥2500", "€10 - €20")
-- When set, this overrides the formatted $min - $max display
-- Existing numeric fields (ticket_price_min, ticket_price_max) remain for scraped data
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price_display TEXT;
