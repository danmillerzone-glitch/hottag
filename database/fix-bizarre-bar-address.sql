-- Fix Bizarre Bar events: set correct street address and coordinates
-- The venue is new/renamed and Google Maps doesn't recognize "Bizarre Bar" yet,
-- so it falls back to "Bazaar Meat" at a completely different location.
-- Real address: 1301 S Main St, Las Vegas, NV 89104

-- Update venue_address for all Bizarre Bar events
UPDATE events
SET venue_address = '1301 S Main St, Las Vegas, NV 89104',
    city = 'Las Vegas',
    state = 'NV',
    country = 'USA',
    latitude = 36.1574,
    longitude = -115.1530
WHERE LOWER(venue_name) LIKE '%bizarre bar%';

-- Fix FSW Arena events: set correct street address and coordinates
-- Real address: 6035 Harrison Dr, Las Vegas, NV 89120
UPDATE events
SET venue_address = '6035 Harrison Dr, Las Vegas, NV 89120',
    city = 'Las Vegas',
    state = 'NV',
    country = 'USA',
    latitude = 36.0720,
    longitude = -115.1190
WHERE LOWER(venue_name) LIKE '%fsw arena%'
   OR LOWER(venue_name) LIKE '%fsw %arena%';

-- Also clean up any events where venue_address is just city/state/country info (no street number)
-- These cause duplicate city display and don't help Google Maps
UPDATE events
SET venue_address = NULL
WHERE venue_address IS NOT NULL
  AND venue_address !~ '\d';
