-- Multi-role: change role from single TEXT to TEXT array
ALTER TABLE professionals ALTER COLUMN role TYPE TEXT[] USING ARRAY[role];
ALTER TABLE professionals ALTER COLUMN role SET DEFAULT ARRAY['other']::TEXT[];

-- Cross-category linking
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS linked_wrestler_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL;
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS linked_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

CREATE INDEX idx_professionals_linked_wrestler ON professionals(linked_wrestler_id) WHERE linked_wrestler_id IS NOT NULL;
CREATE INDEX idx_wrestlers_linked_professional ON wrestlers(linked_professional_id) WHERE linked_professional_id IS NOT NULL;
