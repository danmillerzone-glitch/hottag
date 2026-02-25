-- =============================================
-- Set Cagematch IDs for newly added promotions
-- Run BEFORE the batch champion scraper
-- =============================================

-- US Promotions
UPDATE promotions SET cagematch_id = 4181 WHERE name = '4th Rope Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3420 WHERE name = '880 Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3675 WHERE name = 'Colorado Wrestling Connection' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3219 WHERE name ILIKE 'Destination Pro%' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 724  WHERE name = 'DREAMWAVE Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 2917 WHERE name = 'Flophouse Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1770 WHERE name = 'Pro Wrestling Entertainment' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3501 WHERE name ILIKE 'Rad Pro Rasslin%' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1623 WHERE name = 'Sideshow Pro Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3580 WHERE name = 'SPARK Joshi Puroresu Of America' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3627 WHERE name = 'Squared Circle Expo' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 2835 WHERE name = 'Total Professional Wrestling' AND cagematch_id IS NULL;

-- France
UPDATE promotions SET cagematch_id = 266  WHERE name = 'Association les Professionnels du Catch' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 2153 WHERE name = 'Catch As Catch Can' AND country IN ('France', 'Frankreich') AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3321 WHERE name = 'Catch Prod' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4107 WHERE name = 'Drag Attack Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4190 WHERE name = 'Freyja' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4238 WHERE name = 'KHAO' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4258 WHERE name = 'Lyon Wrestling Association' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3776 WHERE name = 'Neo Catch Club Var' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 2416 WHERE name = 'Nevez Web Catch' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4104 WHERE name = 'North France Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3363 WHERE name = 'La Bagarre' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1683 WHERE name ILIKE 'Wrestling In Europa%' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 2235 WHERE name = 'Wrestling Pro Essonne' AND cagematch_id IS NULL;

-- Belgium
UPDATE promotions SET cagematch_id = 3694 WHERE name = 'BodyZoi Wrestling Factory' AND cagematch_id IS NULL;

-- Poland
UPDATE promotions SET cagematch_id = 3787 WHERE name = 'PpW Ewenement Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1747 WHERE name = 'Kombat Pro Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3149 WHERE name = 'Prime Time Wrestling' AND country IN ('Poland', 'Polen') AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1343 WHERE name = 'Maniac Zone Wrestling' AND cagematch_id IS NULL;

-- Austria
UPDATE promotions SET cagematch_id = 65   WHERE name = 'European Wrestling Association' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 3087 WHERE name ILIKE 'Pro Wrestling Österreich%' OR name ILIKE 'Pro Wrestling Osterreich%' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 1222 WHERE name = 'Ultimate Kombat Wrestling Association' AND cagematch_id IS NULL;

-- Netherlands
UPDATE promotions SET cagematch_id = 97   WHERE name = 'Pro Wrestling Holland' AND cagematch_id IS NULL;

-- Italy
UPDATE promotions SET cagematch_id = 3365 WHERE name = 'Squash A Jobber Wrestling' AND cagematch_id IS NULL;
UPDATE promotions SET cagematch_id = 4494 WHERE name = 'Bestya Wrestling' AND cagematch_id IS NULL;

-- Cyprus
UPDATE promotions SET cagematch_id = 4170 WHERE name = 'Absolute Cyprus Wrestling' AND cagematch_id IS NULL;

-- Singapore
UPDATE promotions SET cagematch_id = 2793 WHERE name = 'Grapplemax' AND cagematch_id IS NULL;

-- Brazil
UPDATE promotions SET cagematch_id = 1496 WHERE name = 'Evolution Wrestling Force' AND cagematch_id IS NULL;

-- Europe general
UPDATE promotions SET cagematch_id = 59   WHERE name = 'Rings Of Europe' AND cagematch_id IS NULL;

-- Mexico
UPDATE promotions SET cagematch_id = 122  WHERE name = 'Lucha Libre AAA World Wide' AND cagematch_id IS NULL;

-- Verify: show all newly tagged promotions
SELECT name, cagematch_id, region FROM promotions
WHERE cagematch_id IN (4181, 3420, 3675, 3219, 724, 2917, 1770, 3501, 1623, 3580, 3627, 2835,
  266, 2153, 3321, 4107, 4190, 4238, 4258, 3776, 2416, 4104, 3363, 1683, 2235,
  3694, 3787, 1747, 3149, 1343, 65, 3087, 1222, 97, 3365, 4494, 4170, 2793, 1496, 59, 122)
ORDER BY name;
