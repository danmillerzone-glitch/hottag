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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
    .select('id, name')
    .eq('promotion_id', promotion.id)

  const existingNames = (existingChamps || []).map(c => c.name.toLowerCase())
  let created = 0, updated = 0, skipped = 0

  for (const title of championships) {
    const existingIdx = existingNames.indexOf(title.name.toLowerCase())

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
      if (existingIdx >= 0) {
        const existingId = existingChamps[existingIdx].id
        await supabase.from('promotion_championships').update({
          current_champion_id: championIds[0] || null,
          current_champion_2_id: championIds[1] || null,
          won_date: title.won_date,
        }).eq('id', existingId)
        updated++
        console.log(`    ✏️  Updated: ${title.name}`)
      } else if (title.is_vacant) {
        // Never create new championships with vacant title holders
        skipped++
        console.log(`    ⏭️  Skipped (vacant): ${title.name}`)
      } else {
        const { error: insertError } = await supabase
          .from('promotion_championships')
          .insert({
            promotion_id: promotion.id,
            name: title.name,
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
  console.log('\n🏆 Batch Championship Scraper\n')

  const { data: promotions, error } = await supabase
    .from('promotions')
    .select('id, name, slug, cagematch_id')
    .not('cagematch_id', 'is', null)
    .order('name')

  if (error) {
    console.error('Error fetching promotions:', error)
    process.exit(1)
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
