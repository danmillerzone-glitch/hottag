-- Hero slides for homepage slideshow
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public read
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides_read" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "hero_slides_admin" ON hero_slides FOR ALL USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);
