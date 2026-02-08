-- Add render_url column for transparent PNG wrestler hero images
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS render_url TEXT;
