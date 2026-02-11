-- Add a special row for the Vegas Weekend page hero banner
INSERT INTO vegas_weekend_collectives (key, name, description, sort_order) VALUES
  ('page-hero', 'Page Hero Banner', 'The main hero image at the top of the Vegas Weekend page', 0)
ON CONFLICT (key) DO NOTHING;
