-- =============================================
-- Fix promotion locations & regions (Feb 2026)
-- Promotions currently in "Other" or "International"
-- that need proper region assignment and location data
-- =============================================

-- =============================================
-- 1. US PROMOTIONS — set city, state, country, region
-- =============================================

-- National promotions (touring, no fixed city)
UPDATE promotions SET region = 'National', country = 'USA'
WHERE name = '4th Rope Wrestling';

UPDATE promotions SET region = 'National', country = 'USA'
WHERE name = 'SPARK Joshi Puroresu Of America';

-- Mid Atlantic
UPDATE promotions SET city = 'Pittsburgh', state = 'PA', country = 'USA', region = 'Mid Atlantic'
WHERE name = '880 Wrestling';

UPDATE promotions SET city = 'Philadelphia', state = 'PA', country = 'USA', region = 'Mid Atlantic'
WHERE name = 'Pro Wrestling Entertainment';

UPDATE promotions SET city = 'Mount Holly', state = 'NJ', country = 'USA', region = 'Mid Atlantic'
WHERE name = 'Sideshow Pro Wrestling';

-- Northeast
UPDATE promotions SET city = 'Amesbury', state = 'MA', country = 'USA', region = 'Northeast'
WHERE name ILIKE 'Rad Pro Rasslin%';

-- Midwest
UPDATE promotions SET city = 'Thief River Falls', state = 'MN', country = 'USA', region = 'Midwest'
WHERE name ILIKE 'Destination Pro%';

UPDATE promotions SET city = 'LaSalle', state = 'IL', country = 'USA', region = 'Midwest'
WHERE name = 'DREAMWAVE Wrestling';

UPDATE promotions SET city = 'Hamtramck', state = 'MI', country = 'USA', region = 'Midwest'
WHERE name = 'Flophouse Wrestling';

UPDATE promotions SET city = 'Indianapolis', state = 'IN', country = 'USA', region = 'Midwest'
WHERE name = 'Squared Circle Expo';

-- Southeast
UPDATE promotions SET city = 'Knoxville', state = 'TN', country = 'USA', region = 'Southeast'
WHERE name = 'Total Professional Wrestling';

-- West
UPDATE promotions SET state = 'CO', country = 'USA', region = 'West'
WHERE name = 'Colorado Wrestling Connection';


-- =============================================
-- 2. EUROPEAN PROMOTIONS — set country & region
--    (most already have city/state from Cagematch)
-- =============================================

-- France
UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Association les Professionnels du Catch';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Catch As Catch Can' AND (city ILIKE '%Douai%' OR region IS NULL OR region = 'Other');

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Catch Prod';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Drag Attack Wrestling';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Freyja';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'KHAO';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Lyon Wrestling Association';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Neo Catch Club Var';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Nevez Web Catch';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'North France Wrestling';

UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name ILIKE 'Wrestling In Europa%';

UPDATE promotions SET city = 'Ploudalmezeau', country = 'France', region = 'Europe'
WHERE name = 'La Bagarre';

-- Belgium
UPDATE promotions SET country = 'Belgium', region = 'Europe'
WHERE name = 'BodyZoi Wrestling Factory';

-- Poland
UPDATE promotions SET country = 'Poland', region = 'Europe'
WHERE name = 'PpW Ewenement Wrestling';

UPDATE promotions SET country = 'Poland', region = 'Europe'
WHERE name = 'Kombat Pro Wrestling';

UPDATE promotions SET country = 'Poland', region = 'Europe'
WHERE name = 'Prime Time Wrestling' AND (city ILIKE '%Koslow%' OR state ILIKE '%Oberschlesien%' OR region IS NULL OR region = 'Other');

UPDATE promotions SET city = 'Wroclaw', country = 'Poland', region = 'Europe'
WHERE name = 'Maniac Zone Wrestling';

-- Austria
UPDATE promotions SET country = 'Austria', region = 'Europe'
WHERE name = 'European Wrestling Association';

UPDATE promotions SET country = 'Austria', region = 'Europe'
WHERE name ILIKE 'Pro Wrestling Österreich%' OR name ILIKE 'Pro Wrestling Osterreich%';

UPDATE promotions SET country = 'Austria', region = 'Europe'
WHERE name = 'Ultimate Kombat Wrestling Association';

-- Netherlands
UPDATE promotions SET country = 'Netherlands', region = 'Europe'
WHERE name = 'Pro Wrestling Holland';

-- Italy
UPDATE promotions SET country = 'Italy', region = 'Europe'
WHERE name = 'Squash A Jobber Wrestling';

UPDATE promotions SET city = 'Crema', country = 'Italy', region = 'Europe'
WHERE name = 'Bestya Wrestling';

-- Cyprus
UPDATE promotions SET city = 'Nicosia', country = 'Cyprus', region = 'Europe'
WHERE name = 'Absolute Cyprus Wrestling';

-- General Europe
UPDATE promotions SET region = 'Europe'
WHERE name = 'Rings Of Europe';


-- =============================================
-- 3. OTHER INTERNATIONAL PROMOTIONS
-- =============================================

-- United Kingdom
UPDATE promotions SET country = 'United Kingdom', region = 'United Kingdom'
WHERE name = 'Premier Wrestling Federation';

-- Singapore / Asia
UPDATE promotions SET country = 'Singapore', region = 'Asia'
WHERE name = 'Grapplemax';

-- Brazil / Latin America
UPDATE promotions SET country = 'Brazil', region = 'Latin America'
WHERE name = 'Evolution Wrestling Force';

-- Mexico
UPDATE promotions SET country = 'Mexico', region = 'Mexico'
WHERE name = 'Lucha Libre AAA World Wide';


-- =============================================
-- 4. STRAGGLERS — fix remaining unmatched rows
-- =============================================

-- Prime Time Wrestling: country stored as 'Polen' (German), broaden match
UPDATE promotions SET country = 'Poland', region = 'Europe'
WHERE name ILIKE '%Prime Time Wrestling%' AND country IN ('Polen', 'Poland') AND region IN ('Other', 'International') OR (name ILIKE '%Prime Time Wrestling%' AND region IS NULL AND country IN ('Polen', 'Poland'));

-- Pro Wrestling Entertainment: use TRIM + ILIKE in case of whitespace/encoding
UPDATE promotions SET city = 'Philadelphia', state = 'PA', country = 'USA', region = 'Mid Atlantic'
WHERE TRIM(name) ILIKE 'Pro Wrestling Entertainment' AND (region IS NULL OR region = 'Other');

-- Wrestling Pro Essonne: French promotion (Villepinte), country stored as 'Frankreich'
UPDATE promotions SET country = 'France', region = 'Europe'
WHERE name = 'Wrestling Pro Essonne';


-- =============================================
-- Verify: show any remaining Other/International/NULL
-- =============================================
SELECT name, city, state, country, region
FROM promotions
WHERE region IS NULL OR region = 'Other' OR region = 'International'
ORDER BY name;
