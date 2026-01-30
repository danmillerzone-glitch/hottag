"""
HotTag - Configuration
Loads environment variables from .env file

Create a .env file in the scripts folder with:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
"""

import os
from pathlib import Path

# Load .env file if it exists
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Get values from environment
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not set!")
    print("Create a .env file in the scripts folder with:")
    print("  SUPABASE_URL=https://your-project.supabase.co")
    print("  SUPABASE_KEY=your_service_role_key")

# Headers for Supabase REST API
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}
