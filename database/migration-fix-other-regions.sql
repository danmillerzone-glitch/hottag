-- =============================================
-- Fix "Other" and NULL region promotions
-- Assigns based on country field
-- =============================================

-- Japan
UPDATE promotions SET region = 'Japan'
WHERE (region = 'Other' OR region IS NULL) AND country = 'Japan';

-- United Kingdom
UPDATE promotions SET region = 'United Kingdom'
WHERE (region = 'Other' OR region IS NULL) AND country IN ('UK', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'United Kingdom');

-- Canada
UPDATE promotions SET region = 'Canada'
WHERE (region = 'Other' OR region IS NULL) AND country = 'Canada';

-- Mexico
UPDATE promotions SET region = 'Mexico'
WHERE (region = 'Other' OR region IS NULL) AND country IN ('Mexico', 'México');

-- Puerto Rico
UPDATE promotions SET region = 'Puerto Rico'
WHERE (region = 'Other' OR region IS NULL) AND country = 'Puerto Rico';

-- Europe
UPDATE promotions SET region = 'Europe'
WHERE (region = 'Other' OR region IS NULL) AND country IN (
  'Germany', 'Deutschland', 'France', 'Italy', 'Spain', 'Austria', 'Switzerland',
  'Netherlands', 'Belgium', 'Poland', 'Czech Republic', 'Sweden', 'Norway',
  'Finland', 'Denmark', 'Ireland', 'Portugal', 'Romania', 'Hungary', 'Bulgaria',
  'Croatia', 'Serbia', 'Greece', 'Turkey', 'Luxembourg', 'Slovakia', 'Slovenia',
  'Estonia', 'Latvia', 'Lithuania', 'Iceland', 'Malta', 'Cyprus'
);

-- Australia & New Zealand
UPDATE promotions SET region = 'Australia & New Zealand'
WHERE (region = 'Other' OR region IS NULL) AND country IN ('Australia', 'New Zealand');

-- Asia (non-Japan)
UPDATE promotions SET region = 'Asia'
WHERE (region = 'Other' OR region IS NULL) AND country IN (
  'India', 'China', 'South Korea', 'Korea', 'Philippines', 'Singapore',
  'Malaysia', 'Thailand', 'Indonesia', 'Vietnam', 'Taiwan', 'Hong Kong',
  'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia'
);

-- Latin America
UPDATE promotions SET region = 'Latin America'
WHERE (region = 'Other' OR region IS NULL) AND country IN (
  'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela',
  'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Costa Rica', 'Panama',
  'Honduras', 'Guatemala', 'El Salvador', 'Nicaragua', 'Dominican Republic',
  'Cuba', 'Trinidad and Tobago', 'Jamaica'
);

-- Middle East
UPDATE promotions SET region = 'Middle East'
WHERE (region = 'Other' OR region IS NULL) AND country IN (
  'Saudi Arabia', 'Saudi-Arabia', 'UAE', 'United Arab Emirates', 'Israel',
  'Qatar', 'Bahrain', 'Kuwait', 'Oman', 'Jordan', 'Lebanon', 'Iraq', 'Iran'
);

-- Africa
UPDATE promotions SET region = 'Africa'
WHERE (region = 'Other' OR region IS NULL) AND country IN (
  'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'Morocco',
  'Tanzania', 'Uganda', 'Ethiopia', 'Cameroon', 'Senegal', 'Tunisia'
);

-- Show what's still in Other so you can manually assign
SELECT id, name, country, region FROM promotions 
WHERE region = 'Other' OR region IS NULL
ORDER BY country, name;
