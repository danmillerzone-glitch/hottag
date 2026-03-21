import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const NA_COUNTRIES = new Set([
  'USA', 'US', 'Canada', 'Mexico', 'México', 'Puerto Rico',
])

const EUROPE_COUNTRIES = new Set([
  'UK', 'United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland',
  'Ireland', 'Germany', 'Deutschland', 'France', 'Italy', 'Spain',
  'Austria', 'Österreich', 'Switzerland', 'Netherlands', 'Belgium',
  'Poland', 'Czech Republic', 'Sweden', 'Norway', 'Finland', 'Denmark',
  'Portugal', 'Romania', 'Hungary', 'Bulgaria', 'Croatia', 'Serbia',
  'Greece', 'Turkey', 'Luxembourg', 'Slovakia', 'Slovenia',
  'Estonia', 'Latvia', 'Lithuania', 'Iceland', 'Malta', 'Cyprus',
])

const JAPAN_COUNTRIES = new Set(['Japan'])

function getRegion(country: string | null): string {
  if (!country) return 'north_america' // default is USA
  if (NA_COUNTRIES.has(country)) return 'north_america'
  if (EUROPE_COUNTRIES.has(country)) return 'europe'
  if (JAPAN_COUNTRIES.has(country)) return 'japan'
  return 'other'
}

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Optional date param — defaults to today (Hawaii time)
  const dateParam = request.nextUrl.searchParams.get('date')
  const targetDate = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' })

  const dateFormatted = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Day of week for "Tonight" vs "Today"
  const dayOfWeek = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })

  const { data: events } = await supabase
    .from('events')
    .select('id, name, country, promotions (name, country)')
    .eq('event_date', targetDate)
    .eq('status', 'upcoming')

  // Group events by region
  const regions: Record<string, { count: number; promos: Map<string, string> }> = {
    north_america: { count: 0, promos: new Map() },
    europe: { count: 0, promos: new Map() },
    japan: { count: 0, promos: new Map() },
    other: { count: 0, promos: new Map() },
  }

  for (const event of events ?? []) {
    const region = getRegion((event as any).country)
    regions[region].count++
    const promo = (event as any).promotions
    if (promo?.name && !regions[region].promos.has(promo.name)) {
      regions[region].promos.set(promo.name, promo.country || '')
    }
  }

  function buildText(regionKey: string, label: string) {
    const r = regions[regionKey]
    if (r.count === 0) return null
    const showWord = r.count === 1 ? 'show' : 'shows'
    const promoNames = Array.from(r.promos.keys())
    let promoStr = ''
    if (promoNames.length <= 3) {
      promoStr = promoNames.join(', ')
    } else {
      promoStr = promoNames.slice(0, 3).join(', ') + ' and more'
    }
    const line1 = `Tonight in ${label}: ${r.count} ${showWord}`
    const line2 = promoStr ? `— ${promoStr}` : ''
    const line3 = `\nhottag.app/events/today`
    return `${line1} ${line2}${line3}`.trim()
  }

  const content = {
    date: targetDate,
    dateFormatted,
    dayOfWeek,
    totalEvents: (events ?? []).length,
    regions: {
      north_america: {
        label: 'North America',
        count: regions.north_america.count,
        promotions: Array.from(regions.north_america.promos.keys()),
        tweet: buildText('north_america', 'North America'),
      },
      europe: {
        label: 'UK & Europe',
        count: regions.europe.count,
        promotions: Array.from(regions.europe.promos.keys()),
        tweet: buildText('europe', 'the UK & Europe'),
      },
      japan: {
        label: 'Japan',
        count: regions.japan.count,
        promotions: Array.from(regions.japan.promos.keys()),
        tweet: buildText('japan', 'Japan'),
      },
      other: {
        label: 'Other',
        count: regions.other.count,
        promotions: Array.from(regions.other.promos.keys()),
        tweet: buildText('other', 'other regions'),
      },
    },
  }

  // If browser request (Accept: text/html), return readable page
  const accept = request.headers.get('accept') || ''
  if (accept.includes('text/html')) {
    const regionEntries = Object.values(content.regions).filter(r => r.count > 0)
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Social Content — ${content.dateFormatted}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #14181c; color: #fff; padding: 2rem; max-width: 700px; margin: 0 auto; }
  h1 { color: #ff6b35; font-size: 1.5rem; }
  h2 { color: #99aabb; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2rem; }
  .card { background: #1c2228; border: 1px solid #2d333b; border-radius: 12px; padding: 1.25rem; margin-top: 0.75rem; }
  .count { color: #ff6b35; font-size: 2rem; font-weight: 800; }
  .promos { color: #99aabb; margin-top: 0.5rem; font-size: 0.875rem; }
  .tweet { background: #242c34; border-radius: 8px; padding: 1rem; margin-top: 0.75rem; white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; cursor: pointer; position: relative; }
  .tweet:hover { background: #2a3038; }
  .tweet::after { content: 'Click to copy'; position: absolute; top: 0.5rem; right: 0.75rem; font-size: 0.7rem; color: #99aabb; }
  .copied::after { content: 'Copied!'; color: #ff6b35; }
  .date-form { margin-bottom: 1rem; }
  .date-form input { background: #242c34; border: 1px solid #2d333b; color: #fff; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 1rem; }
  .date-form button { background: #ff6b35; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; cursor: pointer; margin-left: 0.5rem; }
  .total { color: #99aabb; font-size: 0.875rem; margin-top: 0.25rem; }
</style></head><body>
<h1>Social Content Generator</h1>
<div class="date-form">
  <input type="date" id="dateInput" value="${content.date}" />
  <button onclick="window.location.href='/api/social-content?date='+document.getElementById('dateInput').value">Load</button>
</div>
<p class="total">${content.dateFormatted} — ${content.totalEvents} total events</p>
${regionEntries.map(r => `
<h2>${r.label} (${r.count})</h2>
<div class="card">
  <div class="count">${r.count} ${r.count === 1 ? 'show' : 'shows'}</div>
  <div class="promos">${r.promotions.join(', ') || 'No promotion data'}</div>
  ${r.tweet ? `<div class="tweet" onclick="navigator.clipboard.writeText(this.textContent.replace('Click to copy','').replace('Copied!','').trim());this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1500)">${r.tweet}</div>` : ''}
</div>
`).join('')}
${regionEntries.length === 0 ? '<p style="color:#99aabb;margin-top:2rem;">No events found for this date.</p>' : ''}
</body></html>`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }

  return NextResponse.json(content)
}
