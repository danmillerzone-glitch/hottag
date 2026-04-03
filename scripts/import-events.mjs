#!/usr/bin/env node

/**
 * Event Import Script — parses events from import-events.txt and upserts into Supabase.
 *
 * Format per line:
 *   Day, M/DD - Promotion (Abbrev) - Venue, Address, City, STATE - Time - website
 *
 * Usage:
 *   node scripts/import-events.mjs                  # dry-run (default)
 *   node scripts/import-events.mjs --commit         # actually insert/update
 *   node scripts/import-events.mjs --commit --create-promos  # also create missing promotions
 *   node scripts/import-events.mjs --commit --geocode  # also geocode new events
 *
 * Env vars (auto-loaded from src/.env.local or scripts/.env):
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY / SUPABASE_KEY
 *   GOOGLE_MAPS_API_KEY (optional, for geocoding)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

// ─── Env Loading ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
for (const envFile of [resolve(__dirname, '../src/.env.local'), resolve(__dirname, '.env')]) {
  try {
    const lines = readFileSync(envFile, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const val = trimmed.slice(eq + 1)
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

const args = process.argv.slice(2)
const COMMIT = args.includes('--commit')
const GEOCODE = args.includes('--geocode')
const CREATE_PROMOS = args.includes('--create-promos')
const YEAR = 2026  // Default year for M/DD dates — adjust if needed

// ─── US State Abbreviations ───────────────────────────────────────────
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
])

// Canadian province abbreviations
const CA_PROVINCES = new Set([
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
])

// ─── Region Mapping ──────────────────────────────────────────────────
const STATE_TO_REGION = {
  CT: 'Northeast', ME: 'Northeast', MA: 'Northeast', NH: 'Northeast',
  NY: 'Northeast', RI: 'Northeast', VT: 'Northeast',
  DE: 'Mid Atlantic', DC: 'Mid Atlantic', MD: 'Mid Atlantic',
  NJ: 'Mid Atlantic', PA: 'Mid Atlantic', VA: 'Mid Atlantic', WV: 'Mid Atlantic',
  AL: 'Southeast', FL: 'Southeast', GA: 'Southeast', KY: 'Southeast',
  MS: 'Southeast', NC: 'Southeast', SC: 'Southeast', TN: 'Southeast',
  AR: 'South', LA: 'South', OK: 'South', TX: 'South',
  IL: 'Midwest', IN: 'Midwest', IA: 'Midwest', KS: 'Midwest',
  MI: 'Midwest', MN: 'Midwest', MO: 'Midwest', NE: 'Midwest',
  ND: 'Midwest', OH: 'Midwest', SD: 'Midwest', WI: 'Midwest',
  AZ: 'West', CA: 'West', CO: 'West', HI: 'West', ID: 'West',
  MT: 'West', NM: 'West', NV: 'West', UT: 'West', WY: 'West',
  AK: 'Pacific Northwest', OR: 'Pacific Northwest', WA: 'Pacific Northwest',
}

const COUNTRY_TO_REGION = {
  USA: null,  // use STATE_TO_REGION
  Canada: 'Canada',
  Japan: 'Japan',
  UK: 'United Kingdom',
  England: 'United Kingdom',
  Wales: 'United Kingdom',
  Scotland: 'United Kingdom',
  Ireland: 'Europe',
  Australia: 'Australia & New Zealand',
  'New Zealand': 'Australia & New Zealand',
  Mexico: 'Mexico',
  India: 'Asia',
}

function getRegion(country, state) {
  if (country === 'USA' && state && STATE_TO_REGION[state]) {
    return STATE_TO_REGION[state]
  }
  return COUNTRY_TO_REGION[country] || 'International'
}

// ─── Helpers ──────────────────────────────────────────────────────────

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Parse a time string like "7 PM", "7:30 PM", "11:30 AM" into HH:MM:SS (24h)
 */
function parseTime(timeStr) {
  if (!timeStr) return null
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = match[2] || '00'
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}:00`
}

/**
 * Parse a date like "Friday, 3/20" into "2025-03-20"
 */
function parseDate(dateStr) {
  // Strip day name: "Friday, 3/20" → "3/20"
  const parts = dateStr.split(',').map(s => s.trim())
  const mdd = parts.length > 1 ? parts[1] : parts[0]
  const [month, day] = mdd.split('/').map(Number)
  if (!month || !day) return null
  return `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Strip parenthetical abbreviations from promotion names.
 * "New Japan Pro Wrestling (NJPW)" → "New Japan Pro Wrestling"
 * "Action Packed Wrestling(APW)" → "Action Packed Wrestling"
 */
function cleanPromotionName(raw) {
  return raw.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

/**
 * Parse the location segment into venue, address, city, state, country.
 *
 * US format (last segment is 2-letter state):
 *   "Venue, 123 Main St, City, ST"
 *
 * Canadian format (last segment is "Canada", second-to-last is province):
 *   "Venue, 123 Main St, City, ON, Canada"
 *
 * International format (last segment is country name):
 *   "Venue, 123 Main St, City, Region, Country"
 */
function parseLocation(locationStr) {
  const segments = locationStr.split(',').map(s => s.trim())

  if (segments.length < 3) {
    // Bare minimum: "Venue, City, State"
    return {
      venue_name: segments[0] || null,
      venue_address: null,
      city: segments[1] || null,
      state: segments[2] || null,
      country: 'USA',
    }
  }

  const last = segments[segments.length - 1].toUpperCase()

  // Check if last segment is a US state abbreviation
  if (US_STATES.has(last)) {
    // US format: Venue, [Address parts...], City, STATE
    const state = last
    const city = segments[segments.length - 2]
    const venue_name = segments[0]
    // Street address only (between venue name and city) — no venue/city/state duplication
    const addressParts = segments.slice(1, segments.length - 2)
    const venue_address = addressParts.length > 0 ? addressParts.join(', ') : null

    return { venue_name, venue_address, city, state, country: 'USA' }
  }

  // Check for Canadian format: ..., Province, Canada
  if (last === 'CANADA' && segments.length >= 4) {
    const province = segments[segments.length - 2].toUpperCase()
    const city = segments[segments.length - 3]
    const venue_name = segments[0]
    const addressParts = segments.slice(1, segments.length - 3)
    const venue_address = addressParts.length > 0 ? addressParts.join(', ') : null

    return { venue_name, venue_address, city, state: province, country: 'Canada' }
  }

  // International format: Venue, [Address...], City, Region, Country
  const country = segments[segments.length - 1]
  const region = segments[segments.length - 2]
  const city = segments[segments.length - 3]
  const venue_name = segments[0]
  const addressParts = segments.slice(1, segments.length - 3)
  const venue_address = addressParts.length > 0 ? addressParts.join(', ') : null

  return { venue_name, venue_address, city, state: region, country }
}

/**
 * Geocode an address using Google Maps Geocoding API.
 * Returns { lat, lng } or null.
 */
function geocodeAddress(address) {
  if (!googleMapsKey) return Promise.resolve(null)
  const encoded = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${googleMapsKey}`

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.status === 'OK' && json.results.length > 0) {
            const loc = json.results[0].geometry.location
            resolve({ lat: loc.lat, lng: loc.lng })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
      res.on('error', () => resolve(null))
    }).on('error', () => resolve(null))
  })
}

/**
 * Parse a single line from the import file.
 * Returns a structured event object or null if unparseable.
 */
function parseLine(line) {
  let trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  // Strip trailing " -" or " - " (lines with no URL at the end)
  trimmed = trimmed.replace(/\s*-\s*$/, '')

  // Split by " - " to get segments
  // Format: "Day, M/DD - Promotion (Abbrev) - Location - Time - website"
  const parts = trimmed.split(' - ')
  if (parts.length < 3) {
    return { error: `Too few segments: "${trimmed}"` }
  }

  // First segment is always the date
  const dateStr = parts[0].trim()
  const event_date = parseDate(dateStr)
  if (!event_date) {
    return { error: `Cannot parse date from "${dateStr}"` }
  }

  // Work backwards from the end to identify optional fields
  let website = null
  let timeStr = null
  let locationIdx = parts.length - 1  // last index that is part of the location

  // Check if last segment looks like a website/URL
  const lastPart = parts[parts.length - 1].trim()
  if (lastPart && (
    lastPart.includes('.com') || lastPart.includes('.net') || lastPart.includes('.org') ||
    lastPart.includes('.co.') || lastPart.includes('.jp') || lastPart.includes('.au') ||
    lastPart.includes('.uk') || lastPart.includes('bit.ly') || lastPart.includes('linktr.ee') ||
    lastPart.includes('x.com') || lastPart.includes('facebook.com')
  )) {
    website = lastPart.startsWith('http') ? lastPart : `https://${lastPart}`
    locationIdx--
  } else if (!lastPart) {
    // Empty last segment
    locationIdx--
  }

  // Check if the current last segment looks like a time
  if (locationIdx >= 3) {
    const possibleTime = parts[locationIdx].trim()
    if (/^\d{1,2}(:\d{2})?\s*(AM|PM)$/i.test(possibleTime)) {
      timeStr = possibleTime
      locationIdx--
    }
  }

  // Second segment is always the promotion name
  const rawPromotion = parts[1].trim()
  const promotionName = cleanPromotionName(rawPromotion)

  // Everything between promotion (index 1) and the end marker is the location
  const locationStr = parts.slice(2, locationIdx + 1).join(' - ').trim()
  if (!locationStr) {
    return { error: `No location found in: "${trimmed}"` }
  }

  const location = parseLocation(locationStr)
  const event_time = parseTime(timeStr)

  return {
    event_date,
    promotionName,
    rawPromotion,
    ...location,
    event_time,
    source_url: website,
    raw: trimmed,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Event Import Script ===`)
  console.log(`Mode: ${COMMIT ? '🔴 COMMIT (will write to DB)' : '🟢 DRY-RUN (no changes)'}`)
  console.log(`Create promotions: ${CREATE_PROMOS ? 'yes' : 'no'}`)
  console.log(`Geocoding: ${GEOCODE ? 'enabled' : 'disabled'}\n`)

  // 1. Read and parse the import file
  const filePath = resolve(__dirname, 'import-events.txt')
  let fileContent
  try {
    fileContent = readFileSync(filePath, 'utf-8')
  } catch {
    console.error(`Cannot read ${filePath}`)
    process.exit(1)
  }

  const lines = fileContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
  console.log(`Found ${lines.length} lines to process.\n`)

  // 2. Load all promotions from DB for matching (paginate to get all)
  console.log('Loading promotions from database...')
  const allPromos = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('promotions')
      .select('id, name, slug')
      .order('name')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('Failed to load promotions:', error.message)
      process.exit(1)
    }
    allPromos.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`Loaded ${allPromos.length} promotions.\n`)

  // Build lookup maps: lowercase name → promo, lowercase slug → promo
  const promoByName = new Map()
  const promoBySlug = new Map()
  for (const p of allPromos) {
    promoByName.set(p.name.toLowerCase(), p)
    promoBySlug.set(p.slug.toLowerCase(), p)
  }

  /**
   * Match a promotion name against the DB.
   * 1. Exact match (case-insensitive)
   * 2. Slug match
   * 3. Substring match with length guard (shorter must be ≥60% of longer)
   * Returns { promo, matchType } or null
   */
  function matchPromotion(name) {
    const lower = name.toLowerCase()

    // Exact match
    if (promoByName.has(lower)) return { promo: promoByName.get(lower), matchType: 'exact' }

    // Slug match
    const slug = generateSlug(name)
    if (promoBySlug.has(slug)) return { promo: promoBySlug.get(slug), matchType: 'slug' }

    // "Starts with" match — input is a prefix of DB name or vice versa (word boundary)
    // Catches "New South" → "New South Pro Wrestling", "AAW" → "AAW: Professional Wrestling Redefined"
    let startsWithMatch = null
    let startsWithLen = Infinity
    for (const [dbLower, promo] of promoByName) {
      const isPrefix = dbLower.startsWith(lower) || lower.startsWith(dbLower)
      if (isPrefix && lower.length >= 3 && dbLower.length >= 3) {
        // Prefer the closest length match
        const diff = Math.abs(lower.length - dbLower.length)
        if (diff < startsWithLen) {
          startsWithLen = diff
          startsWithMatch = promo
        }
      }
    }
    if (startsWithMatch) return { promo: startsWithMatch, matchType: 'prefix' }

    // Substring match with length guard to prevent false positives
    // e.g. "City Championship Wrestling" should NOT match "NWA New Mexico Duke City Championship Wrestling"
    let bestMatch = null
    let bestLen = Infinity
    for (const [dbLower, promo] of promoByName) {
      if (dbLower.includes(lower) || lower.includes(dbLower)) {
        const shorter = Math.min(lower.length, dbLower.length)
        const longer = Math.max(lower.length, dbLower.length)
        // Require the shorter name to be at least 60% of the longer
        if (shorter / longer >= 0.6) {
          // Prefer the closest length match
          if (Math.abs(lower.length - dbLower.length) < bestLen) {
            bestLen = Math.abs(lower.length - dbLower.length)
            bestMatch = promo
          }
        }
      }
    }
    if (bestMatch) return { promo: bestMatch, matchType: 'fuzzy' }

    return null
  }

  // 3. Parse all lines
  const parsed = lines.map((line, i) => {
    const result = parseLine(line)
    if (!result) return null
    if (result.error) {
      console.warn(`  ⚠ Line ${i + 1}: ${result.error}`)
      return null
    }
    return { lineNum: i + 1, ...result }
  }).filter(Boolean)

  console.log(`Successfully parsed ${parsed.length}/${lines.length} lines.\n`)

  // 4. Match promotions
  const unmatched = new Set()
  const fuzzyMatches = []
  for (const event of parsed) {
    const result = matchPromotion(event.promotionName)
    if (result) {
      event.promotion_id = result.promo.id
      event.matchedPromoName = result.promo.name
      event.matchType = result.matchType
      if (result.matchType === 'fuzzy' || result.matchType === 'prefix') {
        fuzzyMatches.push({ input: event.promotionName, matched: result.promo.name, type: result.matchType })
      }
    } else {
      unmatched.add(event.promotionName)
    }
  }

  if (fuzzyMatches.length > 0) {
    const unique = [...new Map(fuzzyMatches.map(m => [m.input, m])).values()]
    console.log(`⚡ ${unique.length} fuzzy/prefix matches (review these):`)
    for (const m of unique) {
      console.log(`   [${m.type}] "${m.input}" → "${m.matched}"`)
    }
    console.log()
  }

  if (unmatched.size > 0 && !CREATE_PROMOS) {
    console.log(`❌ ${unmatched.size} unmatched promotions (these events will be SKIPPED):`)
    for (const name of [...unmatched].sort()) {
      console.log(`   • ${name}`)
    }
    console.log()
  }

  // ─── Create missing promotions if --create-promos ────────────────────
  if (unmatched.size > 0 && CREATE_PROMOS) {
    // Collect info for each unmatched promotion from its events
    const promoInfo = new Map()
    for (const event of parsed) {
      if (!event.promotion_id && unmatched.has(event.promotionName)) {
        if (!promoInfo.has(event.promotionName)) {
          promoInfo.set(event.promotionName, {
            name: event.promotionName,
            country: event.country || 'USA',
            state: event.state,
            city: event.city,
            source_url: event.source_url,
          })
        }
      }
    }

    console.log(`📋 ${promoInfo.size} promotions to create:`)
    for (const [name, info] of [...promoInfo].sort((a, b) => a[0].localeCompare(b[0]))) {
      const region = getRegion(info.country, info.state)
      console.log(`   + ${name} | ${info.city}, ${info.state || ''} ${info.country} | region: ${region}`)
    }
    console.log()

    if (COMMIT) {
      console.log('Creating promotions...')
      let created = 0
      for (const [name, info] of promoInfo) {
        const slug = generateSlug(name)
        const region = getRegion(info.country, info.state)
        const row = {
          name,
          slug,
          country: info.country,
          region,
        }
        // Use source_url as website if it looks like a real site (not facebook profile)
        if (info.source_url && !info.source_url.includes('facebook.com/profile.php')) {
          row.website = info.source_url
        }

        const { data: newPromo, error } = await supabase
          .from('promotions')
          .insert(row)
          .select('id, name, slug')
          .single()

        if (error) {
          console.error(`  ✗ ${name}: ${error.message}`)
        } else {
          created++
          console.log(`  ✓ ${name} (${slug})`)
          // Add to lookup maps so event matching works
          promoByName.set(name.toLowerCase(), newPromo)
          promoBySlug.set(slug, newPromo)
        }
      }
      console.log(`Created ${created}/${promoInfo.size} promotions.\n`)

      // Re-match previously unmatched events
      for (const event of parsed) {
        if (!event.promotion_id) {
          const result = matchPromotion(event.promotionName)
          if (result) {
            event.promotion_id = result.promo.id
            event.matchedPromoName = result.promo.name
            event.matchType = result.matchType
          }
        }
      }
    } else {
      console.log('(Dry-run: promotions will be created with --commit)\n')
    }
  }

  const withPromo = parsed.filter(e => e.promotion_id)
  console.log(`${withPromo.length} events have matched promotions.\n`)

  // 5. Check for duplicates against existing events
  // Load existing events for the date range in the import
  const dates = withPromo.map(e => e.event_date)
  const minDate = dates.reduce((a, b) => a < b ? a : b)
  const maxDate = dates.reduce((a, b) => a > b ? a : b)

  console.log(`Checking for duplicates (${minDate} to ${maxDate})...`)

  const { data: existingEvents, error: eventsErr } = await supabase
    .from('events')
    .select('id, name, event_date, event_time, venue_name, venue_address, city, state, country, promotion_id, source_url, admin_edited')
    .gte('event_date', minDate)
    .lte('event_date', maxDate)

  if (eventsErr) {
    console.error('Failed to load existing events:', eventsErr.message)
    process.exit(1)
  }

  console.log(`Found ${existingEvents.length} existing events in date range.\n`)

  // Build duplicate lookup: "promotion_id|date|city_lower" → existing event
  const existingMap = new Map()
  for (const ev of existingEvents) {
    const key = `${ev.promotion_id}|${ev.event_date}|${(ev.city || '').toLowerCase()}`
    existingMap.set(key, ev)
  }

  // 6. Categorize events
  const toInsert = []
  const toBackfill = []
  const skipped = []

  for (const event of withPromo) {
    const dupeKey = `${event.promotion_id}|${event.event_date}|${(event.city || '').toLowerCase()}`
    const existing = existingMap.get(dupeKey)

    if (existing) {
      // Never touch events that have been edited by an admin/promoter
      if (existing.admin_edited) {
        skipped.push(event)
        continue
      }

      // Check if we can backfill any null fields
      const updates = {}
      if (!existing.event_time && event.event_time) updates.event_time = event.event_time
      if (!existing.venue_name && event.venue_name) updates.venue_name = event.venue_name
      if (!existing.venue_address && event.venue_address) updates.venue_address = event.venue_address
      if (!existing.source_url && event.source_url) updates.source_url = event.source_url

      if (Object.keys(updates).length > 0) {
        toBackfill.push({ id: existing.id, name: existing.name, updates })
      } else {
        skipped.push(event)
      }
    } else {
      toInsert.push(event)
    }
  }

  // 7. Report
  console.log('─── Summary ───')
  console.log(`  New events to insert:  ${toInsert.length}`)
  console.log(`  Duplicates to backfill: ${toBackfill.length}`)
  console.log(`  Duplicates (no changes): ${skipped.length}`)
  console.log(`  Unmatched promotions:   ${unmatched.size}`)
  console.log()

  // Show inserts
  if (toInsert.length > 0) {
    console.log('── New Events ──')
    for (const e of toInsert) {
      const name = `${e.matchedPromoName} - ${e.city}`
      console.log(`  + ${e.event_date} | ${name} | ${e.venue_name || '?'}, ${e.city}, ${e.state} ${e.country || 'USA'}${e.event_time ? ' @ ' + e.event_time : ''}`)
    }
    console.log()
  }

  // Show backfills
  if (toBackfill.length > 0) {
    console.log('── Backfills ──')
    for (const b of toBackfill) {
      const fields = Object.keys(b.updates).join(', ')
      console.log(`  ~ ${b.name} → fill: ${fields}`)
    }
    console.log()
  }

  if (!COMMIT) {
    console.log('Dry-run complete. Pass --commit to write to the database.\n')
    return
  }

  // ─── COMMIT MODE ────────────────────────────────────────────────────

  // 8. Backfill existing events
  if (toBackfill.length > 0) {
    console.log('Backfilling existing events...')
    for (const b of toBackfill) {
      const { error } = await supabase
        .from('events')
        .update(b.updates)
        .eq('id', b.id)
      if (error) {
        console.error(`  ✗ Failed to backfill ${b.name}: ${error.message}`)
      } else {
        console.log(`  ✓ Backfilled ${b.name}: ${Object.keys(b.updates).join(', ')}`)
      }
    }
    console.log()
  }

  // 9. Insert new events
  if (toInsert.length > 0) {
    console.log('Inserting new events...')
    let insertCount = 0

    for (const event of toInsert) {
      const eventName = `${event.matchedPromoName} - ${event.city}`
      const slug = generateSlug(eventName)

      const row = {
        name: eventName,
        slug,
        event_date: event.event_date,
        event_time: event.event_time,
        promotion_id: event.promotion_id,
        venue_name: event.venue_name,
        venue_address: event.venue_address,
        city: event.city,
        state: event.state,
        country: event.country || 'USA',
        status: 'upcoming',
        source_url: event.source_url,
        source_name: 'manual_import',
      }

      // Optional geocoding
      if (GEOCODE && event.venue_address) {
        const coords = await geocodeAddress(event.venue_address)
        if (coords) {
          row.latitude = coords.lat
          row.longitude = coords.lng
        }
      }

      const { error } = await supabase.from('events').insert(row)
      if (error) {
        console.error(`  ✗ ${eventName}: ${error.message}`)
      } else {
        insertCount++
        console.log(`  ✓ ${eventName} (${event.event_date})`)
      }
    }

    console.log(`\nInserted ${insertCount}/${toInsert.length} events.`)
  }

  console.log('\nDone!\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
