# Flag Images for Hero Themes

Place flag images here with lowercase country code filenames.

## Naming Convention
- `us.png` — United States
- `mx.png` — Mexico  
- `jp.png` — Japan
- `gb.png` — United Kingdom
- `ca.png` — Canada
- `de.png` — Germany
- `ie.png` — Ireland
- `it.png` — Italy
- `pr.png` — Puerto Rico
- `au.png` — Australia
- `br.png` — Brazil
- `in.png` — India

## Specs
- Recommended size: 1920×1080px or larger (landscape)
- Format: PNG or JPG
- These are displayed as hero backgrounds at 30% opacity with a dark overlay
- Stylized/artistic flag designs work better than plain rectangular flags
- Consider dark/moody treatments that complement the site's dark theme

## How it works
When a wrestler selects a flag theme, the system:
1. Uses CSS gradient colors as the base background
2. Overlays the flag image at 30% opacity (if file exists)
3. If no image file exists, falls back to CSS-only gradient
