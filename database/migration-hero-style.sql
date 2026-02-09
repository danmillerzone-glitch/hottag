-- Add hero_style JSONB column for wrestler page customization
-- Stores: { type: 'gradient' | 'flag' | 'texture' | 'solid', value: string, accent?: string }
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS hero_style JSONB DEFAULT NULL;

-- Examples:
-- Gradient:  {"type":"gradient","value":"red-black"}
-- Flag:      {"type":"flag","value":"US"}
-- Texture:   {"type":"texture","value":"carbon-fiber"}
-- Solid:     {"type":"solid","value":"#1a1a2e"}
