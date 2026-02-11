/**
 * Geocode a venue/address to lat/lng coordinates using Mapbox Geocoding API.
 * Returns { latitude, longitude } or null if not found.
 * 
 * IMPORTANT: This geocoder rejects city/region-level results to prevent
 * pinning events to city centers when the venue can't be found.
 * Only POI (point of interest) and address-level results are accepted.
 */
export async function geocodeVenue(parts: {
  venue_name?: string | null
  venue_address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}): Promise<{ latitude: number; longitude: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    console.error('Mapbox token not configured')
    return null
  }

  // Accepted place types - must be specific enough to be useful
  const ACCEPTED_TYPES = ['poi', 'address', 'poi.landmark']

  // Try 1: Full query with venue name + city + state
  const fullParts = [
    parts.venue_name,
    parts.city,
    parts.state,
    parts.country,
  ].filter(Boolean)

  if (fullParts.length === 0) return null

  const result = await tryGeocode(fullParts.join(', '), token, ACCEPTED_TYPES)
  if (result) return result

  // Try 2: Venue name + address (if different from city/state)
  if (parts.venue_name && parts.venue_address) {
    const addrParts = [parts.venue_name, parts.venue_address].filter(Boolean)
    const result2 = await tryGeocode(addrParts.join(', '), token, ACCEPTED_TYPES)
    if (result2) return result2
  }

  // Try 3: Just venue address if it looks like a real street address (has numbers)
  if (parts.venue_address && /\d/.test(parts.venue_address)) {
    const addrWithContext = [parts.venue_address, parts.city, parts.state].filter(Boolean)
    const result3 = await tryGeocode(addrWithContext.join(', '), token, ACCEPTED_TYPES)
    if (result3) return result3
  }

  // Do NOT fall back to city/state only — that produces city-center pins
  // which are worse than having no coordinates at all
  console.log(`Geocoding: No precise result found for "${fullParts.join(', ')}" — skipping`)
  return null
}

async function tryGeocode(
  query: string, 
  token: string, 
  acceptedTypes: string[]
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`
    )

    if (!res.ok) return null

    const data = await res.json()
    if (!data.features || data.features.length === 0) return null

    const feature = data.features[0]
    const placeTypes = feature.place_type || []

    // Check if the result is specific enough (POI or address)
    const isSpecific = placeTypes.some((t: string) => acceptedTypes.includes(t))

    if (!isSpecific) {
      // Result is too vague (city, region, country) — reject it
      return null
    }

    const [longitude, latitude] = feature.center
    return { latitude, longitude }
  } catch {
    return null
  }
}
