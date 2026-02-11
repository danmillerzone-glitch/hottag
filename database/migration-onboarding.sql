-- ============================================
-- USER PROFILES TABLE (onboarding tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT CHECK (user_type IN ('fan', 'wrestler', 'promoter', 'crew')),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_read" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_own_write" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_own_update" ON user_profiles FOR UPDATE USING (id = auth.uid());

-- Backfill all existing users as onboarding completed
INSERT INTO user_profiles (id, user_type, onboarding_completed, onboarding_step)
SELECT id, 'fan', true, 99
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Function to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, onboarding_completed, onboarding_step)
  VALUES (NEW.id, false, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
