-- Fix: Normalize "Bizarre Bar" / "Swan Dive" to same coordinates
-- First find what coords each has
-- SELECT venue_name, latitude, longitude FROM events WHERE venue_name ILIKE '%bizarre%' OR venue_name ILIKE '%swan dive%';

-- Set Swan Dive events to match Bizarre Bar coordinates (or vice versa)
-- Uncomment and adjust after checking which coords are correct:

-- UPDATE events 
-- SET latitude = (SELECT latitude FROM events WHERE venue_name ILIKE '%bizarre bar%' LIMIT 1),
--     longitude = (SELECT longitude FROM events WHERE venue_name ILIKE '%bizarre bar%' LIMIT 1)
-- WHERE venue_name ILIKE '%swan dive%';

-- Fix: Normalize Horseshoe Las Vegas coordinates
-- All events at Horseshoe Las Vegas should share the same pin
-- UPDATE events 
-- SET latitude = 36.1147, longitude = -115.1728
-- WHERE venue_name ILIKE '%horseshoe%' AND city ILIKE '%las vegas%';
