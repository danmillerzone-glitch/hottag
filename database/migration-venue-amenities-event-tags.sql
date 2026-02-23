-- =============================================
-- VENUE AMENITIES & EVENT TYPE TAGS
-- =============================================

-- Venue amenities stored as JSONB for flexible checkbox groups
-- Event tags stored as text[] for multi-select labels
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_amenities jsonb DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_tags text[] DEFAULT '{}';

-- Index for filtering events by tags
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN (event_tags);

-- VENUE AMENITIES JSONB STRUCTURE:
-- {
--   "age_restriction": "all_ages" | "eighteen_plus" | "twenty_one_plus",
--   "food_available": boolean,
--   "alcohol_available": boolean,
--   "byob": boolean,
--   "no_outside_food": boolean,
--   "parking_free_onsite": boolean,
--   "parking_paid_onsite": boolean,
--   "parking_street": boolean,
--   "parking_garage_nearby": boolean,
--   "parking_limited": boolean,
--   "wheelchair_accessible": boolean,
--   "ada_seating": boolean,
--   "seating_ga_standing": boolean,
--   "seating_assigned": boolean,
--   "seating_folding_chairs": boolean,
--   "seating_bleachers": boolean,
--   "seating_standing_only": boolean,
--   "venue_indoor": boolean,
--   "venue_outdoor": boolean,
--   "venue_indoor_outdoor": boolean,
--   "merch_area": boolean,
--   "meet_and_greet": boolean,
--   "atm_onsite": boolean,
--   "cash_only": boolean,
--   "card_accepted": boolean,
--   "restrooms": boolean,
--   "no_reentry": boolean,
--   "bag_search": boolean,
--   "no_smoking": boolean
-- }

-- EVENT TAGS are stored as text[] with values from the predefined list
-- in the application constants (EVENT_TAGS / EVENT_TAG_LABELS)
