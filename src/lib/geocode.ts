/**
 * Geocode a venue/address to lat/lng coordinates using Mapbox Geocoding API.
 * Returns { latitude, longitude } or null if not found.
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

  // Build search query from most specific to least
  const queryParts = [
    parts.venue_name,
    parts.venue_address,
    parts.city,
    parts.state,
    parts.country,
  ].filter(Boolean)

  if (queryParts.length === 0) return null

  const query = encodeURIComponent(queryParts.join(', '))

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`
    )

    if (!res.ok) {
      console.error('Geocoding failed:', res.status)
      return null
    }

    const data = await res.json()

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { latitude, longitude }
    }

    // If venue name search fails, try without venue name (just address/city/state)
    if (parts.venue_name) {
      const fallbackParts = [
        parts.venue_address,
        parts.city,
        parts.state,
        parts.country,
      ].filter(Boolean)

      if (fallbackParts.length > 0) {
        const fallbackQuery = encodeURIComponent(fallbackParts.join(', '))
        const fallbackRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${fallbackQuery}.json?access_token=${token}&limit=1`
        )

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          if (fallbackData.features && fallbackData.features.length > 0) {
            const [longitude, latitude] = fallbackData.features[0].center
            return { latitude, longitude }
          }
        }
      }
    }

    return null
  } catch (err) {
    console.error('Geocoding error:', err)
    return null
  }
}
