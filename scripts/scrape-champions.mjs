#!/usr/bin/env node

/**
 * Cagematch Championship Scraper for HotTag
 * 
 * Scrapes a promotion's current championships and champions from Cagematch,
 * then populates the HotTag database.
 * 
 * Usage: node scripts/scrape-champions.mjs <promotion_slug>
 * 
 * What it does:
 * 1. Looks up the promotion in HotTag DB by slug
 * 2. Fetches the promotion's titles page from Cagematch
 * 3. Parses current active titles and champions
 * 4. For each champion, checks if they exist in wrestlers table (by name match)
 * 5. If not found, creates a new wrestler record
 * 6. Creates championship records and links to champion wrestlers
 * 
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Parse the Cagematch titles HTML table to extract championships and champions
 */
function parseTitlesPage(html) {
  const championships = []

  // Find the table rows - each row has: #, Title, Champion(s), Since, Rating, Votes
  // The table is inside the main content area after "Active Titles"
  const tableRegex = /<tr[^>]*class="TRow[12]"[^>]*>([\s\S]*?)<\/tr>/gi
  let match

  while ((match = tableRegex.exec(html)) !== null) {
    const row = match[1]

    // Extract title name and cagematch ID
    const titleMatch = row.match(/<a[^>]*href="\?id=5&nr=(\d+)"[^>]*>([^<]+)<\/a>/)
    if (!titleMatch) continue

    const titleCagematchId = parseInt(titleMatch[1])
    const titleName = titleMatch[2].trim()

    // Extract champion(s) - could be multiple links for tag teams
    const championLinks = []
    const champRegex = /<a[^>]*href="\?id=2&nr=(\d+)(?:&[^"]*)?"\s*[^>]*>([^<]+)<\/a>/g
    let champMatch

    // We need to get champions from the right cell (3rd td)
    const cells = row.split(/<\/td>/i)
    const championCell = cells.length >= 3 ? cells[2] : ''

    while ((champMatch = champRegex.exec(championCell)) !== null) {
      championLinks.push({
        cagematch_id: parseInt(champMatch[1]),
        name: champMatch[2].trim(),
      })
    }

    // Also check for stable/team names
    const stableMatch = championCell.match(/<a[^>]*href="\?id=29&nr=(\d+)[^"]*"[^>]*>([^<]+)<\/a>/)
    const stableName = stableMatch ? stableMatch[2].trim() : null

    // Extract "since" date
    const sinceMatch = row.match(/(\d{2}\.\d{2}\.\d{4})/)
    let wonDate = null
    if (sinceMatch) {
      const [day, month, year] = sinceMatch[1].split('.')
      wonDate = `${year}-${month}-${day}`
    }

    // Check if vacant
    const isVacant = championCell.toLowerCase().includes('vacant') || championLinks.length === 0

    championships.push({
      cagematch_title_id: titleCagematchId,
      name: titleName,
      champions: championLinks,
      stable_name: stableName,
      won_date: wonDate,
      is_vacant: isVacant,
    })
  }

  return championships
}

/**
 * Find or create a wrestler by name (and optionally cagematch_id)
 */
async function findOrCreateWrestler(name, cagematchId) {
  // First try by cagematch_id
  if (cagematchId) {
    const { data: existing } = await supabase
      .from('wrestlers')
      .select('id, name, slug')
      .eq('cagematch_id', cagematchId)
      .maybeSingle()

    if (existing) {
      console.log(`  ✓ Found wrestler by cagematch_id: ${existing.name} (${existing.id})`)
      return existing
    }
  }

  // Try by exact name match
  const { data: byName } = await supabase
    .from('wrestlers')
    .select('id, name, slug')
    .ilike('name', name)
    .maybeSingle()

  if (byName) {
    // Update cagematch_id if we have it
    if (cagematchId) {
      await supabase.from('wrestlers').update({ cagematch_id: cagematchId }).eq('id', byName.id)
    }
    console.log(`  ✓ Found wrestler by name: ${byName.name} (${byName.id})`)
    return byName
  }

  // Create new wrestler
  const slug = slugify(name)
  const { data: created, error } = await supabase
    .from('wrestlers')
    .insert({
      name,
      slug,
      cagematch_id: cagematchId || null,
      cagematch_url: cagematchId ? `https://www.cagematch.net/?id=2&nr=${cagematchId}` : null,
    })
    .select('id, name, slug')
    .single()

  if (error) {
    // Slug might conflict, try with a suffix
    if (error.code === '23505') {
      const { data: created2, error: error2 } = await supabase
        .from('wrestlers')
        .insert({
          name,
          slug: `${slug}-${Date.now()}`,
          cagematch_id: cagematchId || null,
        })
        .select('id, name, slug')
        .single()

      if (error2) throw error2
      console.log(`  ★ Created new wrestler: ${name} (${created2.id})`)
      return created2
    }
    throw error
  }

  console.log(`  ★ Created new wrestler: ${name} (${created.id})`)
  return created
}

/**
 * Main scraper function
 */
async function scrapeChampions(promotionSlug) {
  console.log(`\n🏆 Scraping champions for: ${promotionSlug}\n`)

  // 1. Look up promotion
  const { data: promotion, error: promoError } = await supabase
    .from('promotions')
    .select('id, name, cagematch_id')
    .eq('slug', promotionSlug)
    .single()

  if (promoError || !promotion) {
    console.error(`Promotion not found: ${promotionSlug}`)
    process.exit(1)
  }

  if (!promotion.cagematch_id) {
    console.error(`Promotion ${promotion.name} has no cagematch_id set. Please add it first.`)
    process.exit(1)
  }

  console.log(`Found: ${promotion.name} (cagematch_id: ${promotion.cagematch_id})`)

  // 2. Fetch titles page
  const url = `https://www.cagematch.net/?id=8&nr=${promotion.cagematch_id}&page=9`
  console.log(`Fetching: ${url}\n`)

  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status}`)
    process.exit(1)
  }

  const html = await response.text()

  // 3. Parse championships
  const championships = parseTitlesPage(html)

  if (championships.length === 0) {
    console.log('No active titles found on Cagematch.')
    return
  }

  console.log(`Found ${championships.length} active title(s):\n`)

  for (const champ of championships) {
    console.log(`📋 ${champ.name}`)
    if (champ.is_vacant) {
      console.log(`   Vacant`)
    } else {
      const names = champ.champions.map(c => c.name).join(' & ')
      console.log(`   Champion(s): ${names}`)
      if (champ.won_date) console.log(`   Since: ${champ.won_date}`)
    }
  }

  console.log(`\n--- Processing into database ---\n`)

  // 4. Get existing championships to avoid duplicates
  const { data: existingChamps } = await supabase
    .from('promotion_championships')
    .select('id, name')
    .eq('promotion_id', promotion.id)

  const existingNames = (existingChamps || []).map(c => c.name.toLowerCase())

  let created = 0
  let updated = 0
  let skipped = 0

  for (const title of championships) {
    // Check if championship already exists
    const existingIdx = existingNames.indexOf(title.name.toLowerCase())

    if (existingIdx >= 0) {
      const existingId = existingChamps[existingIdx].id
      console.log(`\n🔄 Updating: ${title.name}`)

      if (title.is_vacant) {
        await supabase.from('promotion_championships').update({
          current_champion_id: null,
          current_champion_2_id: null,
        }).eq('id', existingId)
        console.log(`   Set to vacant`)
        updated++
      } else {
        // Find/create champion wrestlers
        const championIds = []
        for (const c of title.champions) {
          const wrestler = await findOrCreateWrestler(c.name, c.cagematch_id)
          championIds.push(wrestler.id)

          // Also add to roster if not already
          const { data: rosterCheck } = await supabase
            .from('wrestler_promotions')
            .select('id, is_active')
            .eq('wrestler_id', wrestler.id)
            .eq('promotion_id', promotion.id)
            .maybeSingle()

          if (!rosterCheck) {
            await supabase.from('wrestler_promotions').insert({
              wrestler_id: wrestler.id,
              promotion_id: promotion.id,
              is_active: true,
            })
            console.log(`  ➕ Added to roster: ${c.name}`)
          } else if (!rosterCheck.is_active) {
            await supabase.from('wrestler_promotions').update({ is_active: true }).eq('id', rosterCheck.id)
            console.log(`  ♻️ Reactivated on roster: ${c.name}`)
          }
        }

        await supabase.from('promotion_championships').update({
          current_champion_id: championIds[0] || null,
          current_champion_2_id: championIds[1] || null,
          won_date: title.won_date,
        }).eq('id', existingId)
        updated++
      }
    } else {
      console.log(`\n✨ Creating: ${title.name}`)

      let champion1Id = null
      let champion2Id = null

      if (!title.is_vacant) {
        for (let i = 0; i < title.champions.length; i++) {
          const c = title.champions[i]
          const wrestler = await findOrCreateWrestler(c.name, c.cagematch_id)

          if (i === 0) champion1Id = wrestler.id
          else if (i === 1) champion2Id = wrestler.id

          // Add to roster
          const { data: rosterCheck } = await supabase
            .from('wrestler_promotions')
            .select('id, is_active')
            .eq('wrestler_id', wrestler.id)
            .eq('promotion_id', promotion.id)
            .maybeSingle()

          if (!rosterCheck) {
            await supabase.from('wrestler_promotions').insert({
              wrestler_id: wrestler.id,
              promotion_id: promotion.id,
              is_active: true,
            })
            console.log(`  ➕ Added to roster: ${c.name}`)
          } else if (!rosterCheck.is_active) {
            await supabase.from('wrestler_promotions').update({ is_active: true }).eq('id', rosterCheck.id)
          }
        }
      }

      const { error: insertError } = await supabase
        .from('promotion_championships')
        .insert({
          promotion_id: promotion.id,
          name: title.name,
          current_champion_id: champion1Id,
          current_champion_2_id: champion2Id,
          won_date: title.won_date,
          is_active: true,
          sort_order: created,
        })

      if (insertError) {
        console.error(`  ❌ Error creating: ${insertError.message}`)
        skipped++
      } else {
        created++
      }
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`)
}

// --- Run ---
const slug = process.argv[2]
if (!slug) {
  console.log('Usage: node scripts/scrape-champions.mjs <promotion_slug>')
  console.log('Example: node scripts/scrape-champions.mjs new-texas-pro-wrestling')
  process.exit(1)
}

scrapeChampions(slug).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
