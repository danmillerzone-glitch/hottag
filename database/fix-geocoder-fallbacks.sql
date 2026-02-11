-- =============================================
-- COMPREHENSIVE GEOCODER FALLBACK FIX
-- =============================================
-- These events all have venue_address = "City, State, USA" pattern
-- meaning the geocoder couldn't find the venue and fell back to city center.
-- Many also have wrong state geocoding (e.g. Portland ME → Portland OR).
--
-- Strategy: NULL out the bad lat/lng so these events don't show wrong pins.
-- Then fix the venue_address field. The auto-geocoder can retry later,
-- or we fix coordinates via the improved audit.

-- STEP 1: NULL out all coordinates from geocoder city-center fallbacks
-- These are ALL wrong or imprecise — better to have no pin than a wrong pin.
UPDATE events
SET 
  latitude = NULL,
  longitude = NULL,
  venue_address = NULL
WHERE id IN (
  'bf030bcb-d818-4e23-aa74-5e75e364b644', -- AAW @ 115 Bourbon Street, Merrionette Park IL
  'ac50e891-3fd4-4659-b3d8-ba6496daf47f', -- GCW @ 2300 Arena, Philadelphia PA
  '354fa25f-d75b-470f-831f-16675b351758', -- PPL @ Alburtis Area Community Center, Alburtis PA
  'ad5a884b-d019-4c2d-93b8-766064e9d0b0', -- 907 @ Arctic Rec Center, Anchorage AK
  '02b4d263-e126-44ed-821c-2fc42c78b667', -- PPL @ Arlen Specter US Squash Center, Philadelphia PA
  '6feab4d5-1722-479b-a071-dc6995593ccc', -- New Texas Pro @ Backwood Bar, Austin TX
  'c4e4d911-c90c-4e8a-acf3-0df4c75609ae', -- GMW @ Barre Elks Lodge, Barre VT
  '2ea71ef1-7b23-454a-be86-e7ce35af8eea', -- New Texas Pro @ Baytown Community Center, Baytown TX
  '6f4fad7b-b69d-464d-9fcf-eec63e84a6ce', -- AAW @ Berwyn Eagles Club, Berwyn IL
  'bd3d54a7-265a-4067-b4ff-4b0c5f3de206', -- Epic Pro @ Bill Greene Sports Complex, Cudahy CA
  '5678df47-7045-415a-81c5-5314bb2fe82f', -- GCW @ Bourbon Hall, Louisville KY
  '43b4e949-f85b-4940-8d54-99c10c6ff3b4', -- Limitless @ Brick South, Portland ME (geocoded to Portland OR!)
  '42bc521d-c1ef-418e-93c3-111f021b1c40', -- PWF @ Carolina Wrestling Academy, Newport NC (geocoded to Newport RI!)
  '0dee7901-01f9-41c6-acb1-298b32e91c14', -- MIW @ Chanhassen American Legion, Chanhassen MN
  '26cecb5c-5987-4baa-887b-88465f0e8c88', -- TLW @ Community Center, Rocky Top TN
  'c71dfe8f-1b19-4e69-a34e-537369aaf80d', -- TLW @ Community Center, Rocky Top TN
  '1b2315ef-b058-498b-812b-76db6393e7e0', -- TLW @ Community Center, Rocky Top TN
  '69dbc949-02fb-4001-afce-ba3df20d382b', -- TLW @ Community Center, Rocky Top TN
  'b510e4f9-5cd8-4d97-8372-33ba75d7ebe0', -- CZW @ Cooper's Riverview, Trenton NJ
  '8e833672-a60c-4567-aa59-2b63520eaa03', -- West Coast Pro @ Dirt Dog Compound, Commerce CA
  '2ead31ba-9837-47de-8719-730fec4f7969', -- XBW @ Dive Bar, Las Vegas NV
  'ccfb7d9a-e33c-4232-bc24-76e1f0bdbb7a', -- B!P @ East Mountain Country Club, Westfield MA (geocoded to Westfield NJ!)
  '69fb9e99-263a-491a-82ca-a5cc1c74ccf9', -- PWS @ Eastside Bowl, Nashville TN
  '71d1d053-1cb0-4156-b29d-4a701373d676', -- SOS @ Edison Square, Tacoma WA
  '6e710a38-ea8d-4947-84c9-b08f789102a5', -- MLW/NJPW @ Festival Hall, Charleston SC
  '7672e2a8-2079-459d-912e-1348a513bd6e', -- CCW @ FSW Arena, Las Vegas NV
  'dbb39d94-ca4f-4262-9d80-a439c4bb0f87', -- FSW @ FSW Arena, Las Vegas NV
  '993624fa-8f86-4c0b-9465-c02c632a6d51', -- DEFY x DG @ Hawthorne Theatre, Portland OR
  '3c63d506-4ec1-4c9e-ac18-d7df72325a69', -- FEW @ HJ Ricks Theatre, Greenfield IN (geocoded to Greenfield MA!)
  '61bcdd5d-3ad2-422d-ab44-1835fe1f31ee', -- RCW @ Holliday Inn, Mishawaka IN
  '096f2d1a-6d6f-4a2a-8bb9-24507d936a47', -- WLW @ Kosir's, Athelstane WI
  '38bd2c01-9492-4521-ab3e-d3d8d6122c51', -- HOG @ Logan Square Auditorium, Chicago IL
  '472ce599-776a-4002-8e74-2a8831911079', -- Freelance @ Logan Square Auditorium, Chicago IL
  '2e4f1882-ed0b-450f-975e-47d5bb787e6a', -- EWA @ Madison County Fairgrounds, Richmond KY (geocoded to Richmond VA!)
  'e827a8f4-d3a3-47f0-8e61-16eee430f7fe', -- MAW @ Maplewood Mall, Maplewood MN (geocoded to Maplewood NJ!)
  '20a3ddcd-9f31-4ce1-86bf-006e61dd9271', -- ACW @ MJN Convention Center, Poughkeepsie NY
  'd8bc43ec-db73-4b89-8b12-a6d430612f3a', -- PrideStyle @ Mujeres Brew House, San Diego CA
  '99b04ed4-9af5-41b0-8fcc-c7f8f29ab179', -- HCW @ National Guard Armory, Evansville IN
  '04ba2173-16d9-45ef-91bf-d6802707ec51', -- CZW @ Neshaminy Creek Brewing, Croydon PA
  'ebc380be-7c78-4932-bf7e-1ade815948c6', -- BTW @ Newark Pavilion, Newark CA (geocoded to Newark NJ!)
  '1ce94bc5-166d-45de-82ef-96d3305d59c0', -- HOG @ NYC Arena, New York City NY
  'f4060d79-3f2f-43db-ac3a-2e56bc794501', -- LPW @ NYC Arena, New York City NY
  '78a1d04e-39b5-4c2a-8a83-1dc97e1c7619', -- FIP @ OCC Roadhouse, Clearwater FL
  '20c207cf-6d15-48a8-a731-294547128c86', -- Sideshow Pro @ Pro Wrestling Star Academy, Mount Holly NJ
  '561b739d-e1dd-4d9e-930a-a7320295bad1', -- Wrestling Open @ Rhodes On The Pawtuxet, Cranston RI
  '65787335-0c21-4ccc-9667-35cd804c0a5e', -- PWJ @ Ridgefield Park Knights Of Columbus, NJ
  '4a0d1ecd-e726-4f80-8136-756197cac0c1', -- ETU @ Ridgefield Park Knights Of Columbus, NJ
  '30bb7172-79ff-4a51-9013-ccf528e198dc', -- GCW @ Showboat Hotel, Atlantic City NJ
  '6cf80f2c-1987-4e6d-9a7e-4c0c8648bfd8', -- SLA @ Spaulding Hall, Alton IL
  'f913b8f7-6633-444b-8b7d-6105a00b5485', -- HOG @ Suffolk Credit Union Arena, Brentwood NY (geocoded to Brentwood CA!)
  'c944eb48-dcdd-453a-a247-7600a8480597', -- AW @ Sun On The Beach, Kissimmee FL
  '1a87b51f-3667-44f8-ab61-73ee7378e9db', -- ICW @ Tennessee Ave Beer Hall, Atlantic City NJ
  '492926b1-0e2a-4492-a937-cb13e70fbc6e', -- GCW @ Thalia Hall, Chicago IL
  '12baa159-22c3-44ff-b4c0-187050bb05ef', -- ECWA @ The Jersey Dugout, Morganville NJ (geocoded to Morganville KS!)
  '2dbefb69-48d9-4b7b-a155-86a79dce1c4e', -- AIW @ The Roxy At Mahall's, Lakewood OH (geocoded to Lakewood CO!)
  '1bca0351-80e9-4ec6-8a2e-f5614d4f3870', -- GCW @ The Webster Theatre, Hartford CT
  '40718557-5f19-41a6-9d01-ff718f92cab7', -- WLW @ Northwoods, Dunbar WI (geocoded to Dunbar WV!)
  '4c9549e7-2c9b-4f2a-a81b-1404ccbe6c0c', -- LOL @ Thunderbird Hall, Philadelphia PA
  '0254caff-19f0-4ddb-99fc-2f13c4ae0630', -- ICW @ TWE Arena, Red Bank TN (geocoded to Red Bank NJ!)
  '9d5104a4-de4d-4bc9-a925-e733abe98e46', -- Jamesen Shook @ TWE Arena, Red Bank TN
  '111e1b43-af92-4400-b7f2-b82f56445c74', -- ICW @ TWE Arena, Red Bank TN
  '8ad13b48-1064-4288-9415-def125c7ab33', -- GCW @ Valley Dale Ballroom, Columbus OH
  '1c356c6f-f2f9-44ac-8b48-ca74d6857e5b', -- SBW @ VFW Azusa, Azusa CA
  '7fd37e2c-c32a-4a18-8e76-8fa48ae664dc', -- BRCW @ VIP Ballroom at CBI, Boca Raton FL
  '9d4f2fd6-77f8-4bef-912f-ca08cb51a15b', -- TCW @ Waretown Volunteer Fire Company, Waretown NJ
  '8b8b14e4-39a0-45e4-94f6-446ca4769bd5', -- GCW @ Water Street Music Hall, Rochester NY
  '016affd6-924c-4c37-9079-721e559496d0', -- Limitless @ Yarmouth Amvets, Yarmouth ME (geocoded to Yarmouth MA!)
  '83f031ab-ad89-4c2c-9574-2b9576c9a22b', -- CCW (no venue, California center)
  '0b485b8a-78db-432c-b351-815b10010a6b', -- PWK (no venue, Indiana center)
  'c374682e-1066-498e-a212-a5eff4fa668a', -- UFW (no venue, Ocala FL city center)
  '5f992b3f-e4a2-4779-b7da-27ba44bc625f'  -- LAW (no venue, Taylorsville MS geocoded to Taylorsville UT!)
);

-- STEP 2: Fix missing state fields using the city/state info from venue_address
-- This helps the geocoder get the right city when we re-geocode
UPDATE events SET state = 'IL' WHERE id = 'bf030bcb-d818-4e23-aa74-5e75e364b644';
UPDATE events SET state = 'PA' WHERE id = 'ac50e891-3fd4-4659-b3d8-ba6496daf47f';
UPDATE events SET state = 'PA' WHERE id = '354fa25f-d75b-470f-831f-16675b351758';
UPDATE events SET state = 'AK' WHERE id = 'ad5a884b-d019-4c2d-93b8-766064e9d0b0';
UPDATE events SET state = 'PA' WHERE id = '02b4d263-e126-44ed-821c-2fc42c78b667';
UPDATE events SET state = 'VT' WHERE id = 'c4e4d911-c90c-4e8a-acf3-0df4c75609ae';
UPDATE events SET state = 'TX' WHERE id = '2ea71ef1-7b23-454a-be86-e7ce35af8eea';
UPDATE events SET state = 'IL' WHERE id = '6f4fad7b-b69d-464d-9fcf-eec63e84a6ce';
UPDATE events SET state = 'CA' WHERE id = 'bd3d54a7-265a-4067-b4ff-4b0c5f3de206';
UPDATE events SET state = 'KY' WHERE id = '5678df47-7045-415a-81c5-5314bb2fe82f';
UPDATE events SET state = 'ME' WHERE id = '43b4e949-f85b-4940-8d54-99c10c6ff3b4';
UPDATE events SET state = 'NC' WHERE id = '42bc521d-c1ef-418e-93c3-111f021b1c40';
UPDATE events SET state = 'MN' WHERE id = '0dee7901-01f9-41c6-acb1-298b32e91c14';
UPDATE events SET state = 'TN' WHERE id IN ('26cecb5c-5987-4baa-887b-88465f0e8c88','c71dfe8f-1b19-4e69-a34e-537369aaf80d','1b2315ef-b058-498b-812b-76db6393e7e0','69dbc949-02fb-4001-afce-ba3df20d382b');
UPDATE events SET state = 'NJ' WHERE id = 'b510e4f9-5cd8-4d97-8372-33ba75d7ebe0';
UPDATE events SET state = 'CA' WHERE id = '8e833672-a60c-4567-aa59-2b63520eaa03';
UPDATE events SET state = 'NV' WHERE id = '2ead31ba-9837-47de-8719-730fec4f7969';
UPDATE events SET state = 'MA' WHERE id = 'ccfb7d9a-e33c-4232-bc24-76e1f0bdbb7a';
UPDATE events SET state = 'TN' WHERE id = '69fb9e99-263a-491a-82ca-a5cc1c74ccf9';
UPDATE events SET state = 'WA' WHERE id = '71d1d053-1cb0-4156-b29d-4a701373d676';
UPDATE events SET state = 'SC' WHERE id = '6e710a38-ea8d-4947-84c9-b08f789102a5';
UPDATE events SET state = 'NV' WHERE id IN ('7672e2a8-2079-459d-912e-1348a513bd6e','dbb39d94-ca4f-4262-9d80-a439c4bb0f87');
UPDATE events SET state = 'OR' WHERE id = '993624fa-8f86-4c0b-9465-c02c632a6d51';
UPDATE events SET state = 'IN' WHERE id = '3c63d506-4ec1-4c9e-ac18-d7df72325a69';
UPDATE events SET state = 'IN' WHERE id = '61bcdd5d-3ad2-422d-ab44-1835fe1f31ee';
UPDATE events SET state = 'WI' WHERE id = '096f2d1a-6d6f-4a2a-8bb9-24507d936a47';
UPDATE events SET state = 'IL' WHERE id IN ('38bd2c01-9492-4521-ab3e-d3d8d6122c51','472ce599-776a-4002-8e74-2a8831911079');
UPDATE events SET state = 'KY' WHERE id = '2e4f1882-ed0b-450f-975e-47d5bb787e6a';
UPDATE events SET state = 'MN' WHERE id = 'e827a8f4-d3a3-47f0-8e61-16eee430f7fe';
UPDATE events SET state = 'NY' WHERE id = '20a3ddcd-9f31-4ce1-86bf-006e61dd9271';
UPDATE events SET state = 'CA' WHERE id = 'd8bc43ec-db73-4b89-8b12-a6d430612f3a';
UPDATE events SET state = 'IN' WHERE id = '99b04ed4-9af5-41b0-8fcc-c7f8f29ab179';
UPDATE events SET state = 'PA' WHERE id = '04ba2173-16d9-45ef-91bf-d6802707ec51';
UPDATE events SET state = 'CA' WHERE id = 'ebc380be-7c78-4932-bf7e-1ade815948c6';
UPDATE events SET state = 'NY' WHERE id IN ('1ce94bc5-166d-45de-82ef-96d3305d59c0','f4060d79-3f2f-43db-ac3a-2e56bc794501');
UPDATE events SET state = 'FL' WHERE id = '78a1d04e-39b5-4c2a-8a83-1dc97e1c7619';
UPDATE events SET state = 'NJ' WHERE id = '20c207cf-6d15-48a8-a731-294547128c86';
UPDATE events SET state = 'RI' WHERE id = '561b739d-e1dd-4d9e-930a-a7320295bad1';
UPDATE events SET state = 'NJ' WHERE id IN ('65787335-0c21-4ccc-9667-35cd804c0a5e','4a0d1ecd-e726-4f80-8136-756197cac0c1');
UPDATE events SET state = 'NJ' WHERE id = '30bb7172-79ff-4a51-9013-ccf528e198dc';
UPDATE events SET state = 'IL' WHERE id = '6cf80f2c-1987-4e6d-9a7e-4c0c8648bfd8';
UPDATE events SET state = 'NY' WHERE id = 'f913b8f7-6633-444b-8b7d-6105a00b5485';
UPDATE events SET state = 'FL' WHERE id = 'c944eb48-dcdd-453a-a247-7600a8480597';
UPDATE events SET state = 'NJ' WHERE id = '1a87b51f-3667-44f8-ab61-73ee7378e9db';
UPDATE events SET state = 'IL' WHERE id = '492926b1-0e2a-4492-a937-cb13e70fbc6e';
UPDATE events SET state = 'NJ' WHERE id = '12baa159-22c3-44ff-b4c0-187050bb05ef';
UPDATE events SET state = 'OH' WHERE id = '2dbefb69-48d9-4b7b-a155-86a79dce1c4e';
UPDATE events SET state = 'CT' WHERE id = '1bca0351-80e9-4ec6-8a2e-f5614d4f3870';
UPDATE events SET state = 'WI' WHERE id = '40718557-5f19-41a6-9d01-ff718f92cab7';
UPDATE events SET state = 'PA' WHERE id = '4c9549e7-2c9b-4f2a-a81b-1404ccbe6c0c';
UPDATE events SET state = 'TN' WHERE id IN ('0254caff-19f0-4ddb-99fc-2f13c4ae0630','9d5104a4-de4d-4bc9-a925-e733abe98e46','111e1b43-af92-4400-b7f2-b82f56445c74');
UPDATE events SET state = 'OH' WHERE id = '8ad13b48-1064-4288-9415-def125c7ab33';
UPDATE events SET state = 'CA' WHERE id = '1c356c6f-f2f9-44ac-8b48-ca74d6857e5b';
UPDATE events SET state = 'FL' WHERE id = '7fd37e2c-c32a-4a18-8e76-8fa48ae664dc';
UPDATE events SET state = 'NJ' WHERE id = '9d4f2fd6-77f8-4bef-912f-ca08cb51a15b';
UPDATE events SET state = 'NY' WHERE id = '8b8b14e4-39a0-45e4-94f6-446ca4769bd5';
UPDATE events SET state = 'ME' WHERE id = '016affd6-924c-4c37-9079-721e559496d0';
UPDATE events SET state = 'FL' WHERE id = 'c374682e-1066-498e-a212-a5eff4fa668a';
UPDATE events SET state = 'MS' WHERE id = '5f992b3f-e4a2-4779-b7da-27ba44bc625f';

-- STEP 3: Now use venue_name majority-vote to backfill coordinates
-- from other events at the same venue that DO have correct coords
WITH venue_good_coords AS (
  SELECT DISTINCT ON (venue_name)
    venue_name,
    latitude,
    longitude
  FROM events
  WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND venue_name IS NOT NULL
    AND venue_name != ''
    AND (venue_address IS NULL OR venue_address NOT LIKE '%, USA')
  GROUP BY venue_name, latitude, longitude
  ORDER BY venue_name, COUNT(*) DESC
)
UPDATE events e
SET 
  latitude = vgc.latitude,
  longitude = vgc.longitude
FROM venue_good_coords vgc
WHERE e.venue_name = vgc.venue_name
  AND e.latitude IS NULL
  AND e.venue_name IS NOT NULL;

-- STEP 4: Verify — check how many events still have NULL coordinates
SELECT COUNT(*) as events_without_coords, 
  COUNT(*) FILTER (WHERE venue_name IS NOT NULL) as with_venue_no_coords
FROM events
WHERE latitude IS NULL 
  AND event_date >= CURRENT_DATE;
