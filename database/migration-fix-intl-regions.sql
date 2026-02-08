-- =============================================
-- Fix "International" region → proper regions
-- =============================================

-- United Kingdom
UPDATE promotions SET region = 'United Kingdom'
WHERE region = 'International' AND country IN ('UK', 'England', 'Scotland', 'Wales', 'Northern Ireland');

-- Japan
UPDATE promotions SET region = 'Japan'
WHERE region = 'International' AND country = 'Japan';

-- Canada
UPDATE promotions SET region = 'Canada'
WHERE region = 'International' AND country = 'Canada';

-- Mexico
UPDATE promotions SET region = 'Mexico'
WHERE region = 'International' AND country = 'Mexico';

-- Europe
UPDATE promotions SET region = 'Europe'
WHERE region = 'International' AND country IN (
  'Germany', 'Deutschland', 'France', 'Italy', 'Spain', 'Austria', 'Switzerland',
  'Netherlands', 'Belgium', 'Poland', 'Czech Republic', 'Sweden', 'Norway',
  'Finland', 'Denmark', 'Ireland', 'Portugal', 'Romania', 'Hungary', 'Bulgaria',
  'Croatia', 'Serbia', 'Greece', 'Turkey'
);

-- Australia & New Zealand
UPDATE promotions SET region = 'Australia & New Zealand'
WHERE region = 'International' AND country IN ('Australia', 'New Zealand');

-- Asia
UPDATE promotions SET region = 'Asia'
WHERE region = 'International' AND country IN (
  'India', 'China', 'South Korea', 'Korea', 'Philippines', 'Singapore',
  'Malaysia', 'Thailand', 'Indonesia', 'Vietnam', 'Taiwan', 'Hong Kong'
);

-- Latin America
UPDATE promotions SET region = 'Latin America'
WHERE region = 'International' AND country IN (
  'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'
);

-- Middle East
UPDATE promotions SET region = 'Middle East'
WHERE region = 'International' AND country IN (
  'Saudi Arabia', 'Saudi-Arabia', 'UAE', 'Israel'
);

-- Africa
UPDATE promotions SET region = 'Africa'
WHERE region = 'International' AND country IN ('South Africa', 'Nigeria', 'Kenya');

-- Puerto Rico
UPDATE promotions SET region = 'Puerto Rico'
WHERE region = 'International' AND country = 'Puerto Rico';

-- Catch-all: anything still "International" becomes "Other"
UPDATE promotions SET region = 'Other'
WHERE region = 'International';


-- =============================================
-- Populate promotion city from their most common event city
-- Only for promotions that don't have a city set yet
-- =============================================

UPDATE promotions p
SET city = sub.city
FROM (
  SELECT DISTINCT ON (e.promotion_id)
    e.promotion_id,
    e.city
  FROM events e
  WHERE e.city IS NOT NULL AND e.city != ''
  GROUP BY e.promotion_id, e.city
  ORDER BY e.promotion_id, COUNT(*) DESC
) sub
WHERE p.id = sub.promotion_id
AND (p.city IS NULL OR p.city = '');


-- Also set state for US promotions missing it
UPDATE promotions p
SET state = sub.state
FROM (
  SELECT DISTINCT ON (e.promotion_id)
    e.promotion_id,
    e.state
  FROM events e
  WHERE e.state IS NOT NULL AND e.state != ''
  GROUP BY e.promotion_id, e.state
  ORDER BY e.promotion_id, COUNT(*) DESC
) sub
WHERE p.id = sub.promotion_id
AND (p.state IS NULL OR p.state = '');


-- Set country for promotions missing it based on events
UPDATE promotions p
SET country = sub.country
FROM (
  SELECT DISTINCT ON (e.promotion_id)
    e.promotion_id,
    e.country
  FROM events e
  WHERE e.country IS NOT NULL AND e.country != ''
  GROUP BY e.promotion_id, e.country
  ORDER BY e.promotion_id, COUNT(*) DESC
) sub
WHERE p.id = sub.promotion_id
AND (p.country IS NULL OR p.country = '');
