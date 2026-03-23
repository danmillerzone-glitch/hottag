#!/usr/bin/env node

/**
 * Batch Cagematch Championship Scraper (Windows-safe)
 * Uses Node http/https modules instead of fetch() to avoid UV handle crashes.
 * Processes sequentially with generous delays between promotions.
 * 
 * Usage: node scripts/scrape-all-champions.mjs
 * 
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Auto-load env vars from src/.env.local or scripts/.env
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

// Use http(s).get instead of fetch() to avoid UV handle leaks on Windows
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Promotions to skip (Cagematch IDs) — too many historical/irrelevant titles
const SKIP_CAGEMATCH_IDS = new Set([
  122,  // Lucha Libre AAA World Wide
])

// Title prefixes belonging to major promotions — skip when scraping a different promotion
// Cagematch lists titles from other orgs that were defended at a promotion's events
const FOREIGN_TITLE_PREFIXES = [
  'NWA ', 'TNA ', 'WWE ', 'AEW ', 'IMPACT ', 'ROH ', 'NJPW ', 'CMLL ', 'AAA ',
  'GCW ', 'MLW ', 'ECW ', 'WCW ',
]

function isForeignTitle(titleName, promotionName) {
  const titleUpper = titleName.toUpperCase()
  const promoUpper = promotionName.toUpperCase()
  for (const prefix of FOREIGN_TITLE_PREFIXES) {
    if (titleUpper.startsWith(prefix) && !promoUpper.startsWith(prefix.trim())) {
      return true
    }
  }
  return false
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseTitlesPage(html) {
  const championships = []
  const tableRegex = /<tr\s+class="TRow[12]">([\s\S]*?)<\/tr>/gi
  let match

  while ((match = tableRegex.exec(html)) !== null) {
    const row = match[1]
    const cellRegex = /<td\s+class="TCol TColSeparator">([\s\S]*?)<\/td>/gi
    const cells = []
    let cellMatch
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(cellMatch[1])
    }

    if (cells.length < 3) continue

    const titleCell = cells[0]
    const championCell = cells[1]
    const sinceCell = cells[2]

    const titleMatch = titleCell.match(/<a\s+href="\?id=5&amp;nr=(\d+)">([^<]+)<\/a>/)
    if (!titleMatch) continue

    const titleName = titleMatch[2].trim()

    const championLinks = []
    const champRegex = /<a\s+href="\?id=2&amp;nr=(\d+)(?:&amp;[^"]*)?">([^<]+)<\/a>/g
    let champMatch
    while ((champMatch = champRegex.exec(championCell)) !== null) {
      championLinks.push({
        cagematch_id: parseInt(champMatch[1]),
        name: champMatch[2].trim(),
      })
    }

    const sinceMatch = sinceCell.match(/(\d{2}\.\d{2}\.\d{4})/)
    let wonDate = null
    if (sinceMatch) {
      const [day, month, year] = sinceMatch[1].split('.')
      wonDate = `${year}-${month}-${day}`
    }

    const isVacant = championCell.toLowerCase().includes('vacant') || championLinks.length === 0

    championships.push({
      name: titleName,
      champions: championLinks,
      won_date: wonDate,
      is_vacant: isVacant,
    })
  }

  return championships
}

async function findOrCreateWrestler(name, cagematchId) {
  if (cagematchId) {
    const { data: existing } = await supabase
      .from('wrestlers')
      .select('id, name, slug')
      .eq('cagematch_id', cagematchId)
      .maybeSingle()
    if (existing) return existing
  }

  const { data: byName } = await supabase
    .from('wrestlers')
    .select('id, name, slug')
    .ilike('name', name)
    .maybeSingle()

  if (byName) {
    if (cagematchId) {
      await supabase.from('wrestlers').update({ cagematch_id: cagematchId }).eq('id', byName.id)
    }
    return byName
  }

  const slug = slugify(name)
  const { data: created, error } = await supabase
    .from('wrestlers')
    .insert({ name, slug, cagematch_id: cagematchId || null })
    .select('id, name, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: created2, error: error2 } = await supabase
        .from('wrestlers')
        .insert({ name, slug: `${slug}-${Date.now()}`, cagematch_id: cagematchId || null })
        .select('id, name, slug')
        .single()
      if (error2) throw error2
      return created2
    }
    throw error
  }
  return created
}

async function addToRoster(wrestlerId, promotionId) {
  const { data: rosterCheck } = await supabase
    .from('wrestler_promotions')
    .select('id, is_active')
    .eq('wrestler_id', wrestlerId)
    .eq('promotion_id', promotionId)
    .maybeSingle()

  if (!rosterCheck) {
    await supabase.from('wrestler_promotions').insert({
      wrestler_id: wrestlerId,
      promotion_id: promotionId,
      is_active: true,
    })
  } else if (!rosterCheck.is_active) {
    await supabase.from('wrestler_promotions').update({ is_active: true }).eq('id', rosterCheck.id)
  }
}

async function scrapePromotion(promotion) {
  const url = `https://www.cagematch.net/?id=8&nr=${promotion.cagematch_id}&page=9`

  let html
  try {
    html = await fetchPage(url)
  } catch (err) {
    console.log(`  ❌ Fetch error: ${err.message}`)
    return { created: 0, updated: 0, skipped: 0 }
  }

  const championships = parseTitlesPage(html)
  if (championships.length === 0) {
    console.log(`  ⚪ No active titles found`)
    return { created: 0, updated: 0, skipped: 0 }
  }

  console.log(`  📋 Found ${championships.length} title(s)`)

  const { data: existingChamps } = await supabase
    .from('promotion_championships')
    .select('id, name, cagematch_name, locked, won_date, current_champion_id, current_champion_2_id')
    .eq('promotion_id', promotion.id)

  const existing = existingChamps || []
  let created = 0, updated = 0, skipped = 0

  for (const title of championships) {
    // Match by cagematch_name first, then by name (case-insensitive)
    const cmNameLower = title.name.toLowerCase()
    let match = existing.find(c => c.cagematch_name && c.cagematch_name.toLowerCase() === cmNameLower)
    if (!match) {
      match = existing.find(c => c.name.toLowerCase() === cmNameLower)
    }

    const championIds = []
    if (!title.is_vacant) {
      for (const c of title.champions) {
        try {
          const wrestler = await findOrCreateWrestler(c.name, c.cagematch_id)
          championIds.push(wrestler.id)
          await addToRoster(wrestler.id, promotion.id)
          await sleep(100)
        } catch (err) {
          console.log(`    ⚠️  ${c.name}: ${err.message}`)
        }
      }
    }

    try {
      if (match) {
        // Skip locked championships (promoter has manual control)
        if (match.locked) {
          skipped++
          console.log(`    🔒 Skipped (locked): ${title.name}`)
          await sleep(100)
          continue
        }

        // Skip if existing won_date is more recent (promoter already updated)
        if (match.won_date && title.won_date && match.won_date > title.won_date) {
          skipped++
          console.log(`    ⏭️  Skipped (won_date ${match.won_date} > scraped ${title.won_date}): ${title.name}`)
          await sleep(100)
          continue
        }

        // Detect actual champion change (not just a data refresh)
        const championChanged = championIds[0] && match.current_champion_id !== championIds[0]

        await supabase.from('promotion_championships').update({
          current_champion_id: championIds[0] || null,
          current_champion_2_id: championIds[1] || null,
          won_date: title.won_date,
        }).eq('id', match.id)
        updated++
        console.log(`    ✏️  Updated: ${title.name}`)

        // Create homepage news for champion changes (only if won recently)
        if (championChanged && title.won_date) {
          const wonDate = new Date(title.won_date)
          const daysSinceWon = (Date.now() - wonDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceWon <= 14) {
            const champName = title.champions[0]?.name || 'Unknown'
            const { data: wrestler } = await supabase
              .from('wrestlers')
              .select('id, slug')
              .eq('id', championIds[0])
              .single()
            const champLink = wrestler ? `/wrestlers/${wrestler.slug}` : null
            await supabase.from('homepage_news').insert({
              type: 'title_change',
              title: `${champName} wins the ${title.name}!`,
              link_url: champLink,
              related_wrestler_id: championIds[0],
              related_promotion_id: promotion.id,
              related_championship_id: match.id,
              is_auto: true,
              sort_order: 1,
              display_date: title.won_date,
              expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            })
            console.log(`    📰 News: ${champName} wins ${title.name}`)
          }
        }
      } else if (title.is_vacant) {
        // Never create new championships with vacant title holders
        skipped++
        console.log(`    ⏭️  Skipped (vacant): ${title.name}`)
      } else if (isForeignTitle(title.name, promotion.name)) {
        // Skip titles from other major promotions (e.g. NWA/TNA titles defended at indie shows)
        skipped++
        console.log(`    ⏭️  Skipped (foreign title): ${title.name}`)
      } else {
        const { error: insertError } = await supabase
          .from('promotion_championships')
          .insert({
            promotion_id: promotion.id,
            name: title.name,
            cagematch_name: title.name,
            current_champion_id: championIds[0] || null,
            current_champion_2_id: championIds[1] || null,
            won_date: title.won_date,
            is_active: true,
            sort_order: created,
          })

        if (insertError) {
          console.log(`    ❌ ${title.name}: ${insertError.message}`)
          skipped++
        } else {
          created++
          console.log(`    ✅ Created: ${title.name}`)
        }
      }
    } catch (err) {
      console.log(`    ❌ ${title.name}: ${err.message}`)
      skipped++
    }

    await sleep(100)
  }

  return { created, updated, skipped }
}

async function main() {
  // Parse --recent N flag (only scrape promotions with events in last N days)
  const recentIdx = process.argv.indexOf('--recent')
  const recentDays = recentIdx !== -1 ? parseInt(process.argv[recentIdx + 1] || '10') : 0

  if (recentDays > 0) {
    console.log(`\n🏆 Championship Scraper (promotions with events in last ${recentDays} days)\n`)
  } else {
    console.log('\n🏆 Batch Championship Scraper (all promotions)\n')
  }

  let promotions

  if (recentDays > 0) {
    // Find promotions that had events in the last N days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - recentDays)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const { data: recentEvents, error: evError } = await supabase
      .from('events')
      .select('promotion_id')
      .gte('event_date', cutoffStr)
      .lte('event_date', new Date().toISOString().split('T')[0])
      .not('promotion_id', 'is', null)

    if (evError) {
      console.error('Error fetching recent events:', evError)
      process.exit(1)
    }

    const recentPromoIds = [...new Set(recentEvents.map(e => e.promotion_id))]
    if (recentPromoIds.length === 0) {
      console.log('No promotions had events in the last ' + recentDays + ' days.')
      return
    }

    const { data, error } = await supabase
      .from('promotions')
      .select('id, name, slug, cagematch_id')
      .not('cagematch_id', 'is', null)
      .in('id', recentPromoIds)
      .order('name')

    if (error) {
      console.error('Error fetching promotions:', error)
      process.exit(1)
    }
    promotions = data
  } else {
    const { data, error } = await supabase
      .from('promotions')
      .select('id, name, slug, cagematch_id')
      .not('cagematch_id', 'is', null)
      .order('name')

    if (error) {
      console.error('Error fetching promotions:', error)
      process.exit(1)
    }
    promotions = data
  }

  console.log(`Found ${promotions.length} promotions with Cagematch IDs\n`)

  let totalCreated = 0, totalUpdated = 0, totalSkipped = 0

  for (let i = 0; i < promotions.length; i++) {
    const promo = promotions[i]
    console.log(`\n[${i + 1}/${promotions.length}] ${promo.name} (CM#${promo.cagematch_id})`)

    if (SKIP_CAGEMATCH_IDS.has(promo.cagematch_id)) {
      console.log(`  ⏭️  Skipped (in skip list)`)
      if (i < promotions.length - 1) await sleep(2000)
      continue
    }

    try {
      const result = await scrapePromotion(promo)
      totalCreated += result.created
      totalUpdated += result.updated
      totalSkipped += result.skipped
    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`)
      totalSkipped++
    }

    // 2 second delay between promotions to let Windows clean up handles
    if (i < promotions.length - 1) {
      await sleep(2000)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('✅ DONE!')
  console.log(`   Promotions scraped: ${promotions.length}`)
  console.log(`   Championships created: ${totalCreated}`)
  console.log(`   Championships updated: ${totalUpdated}`)
  console.log(`   Skipped/errors: ${totalSkipped}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
