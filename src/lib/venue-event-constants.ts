// =============================================
// ADD THESE CONSTANTS TO src/lib/supabase.ts
// =============================================

// --- VENUE AMENITY GROUPS ---

export const VENUE_AMENITY_GROUPS = [
  {
    label: 'Age Restriction',
    type: 'radio' as const,
    key: 'age_restriction',
    options: [
      { value: 'all_ages', label: 'All Ages' },
      { value: 'eighteen_plus', label: '18+' },
      { value: 'twenty_one_plus', label: '21+' },
    ]
  },
  {
    label: 'Food & Drink',
    type: 'checkbox' as const,
    options: [
      { key: 'food_available', label: 'Food Available for Purchase' },
      { key: 'alcohol_available', label: 'Alcohol Available for Purchase' },
      { key: 'byob', label: 'BYOB Allowed' },
      { key: 'no_outside_food', label: 'No Outside Food/Drink' },
    ]
  },
  {
    label: 'Parking',
    type: 'checkbox' as const,
    options: [
      { key: 'parking_free_onsite', label: 'Free Parking On-Site' },
      { key: 'parking_paid_onsite', label: 'Paid Parking On-Site' },
      { key: 'parking_street', label: 'Street Parking Available' },
      { key: 'parking_garage_nearby', label: 'Parking Garage Nearby' },
      { key: 'parking_limited', label: 'Limited Parking' },
    ]
  },
  {
    label: 'Accessibility',
    type: 'checkbox' as const,
    options: [
      { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
      { key: 'ada_seating', label: 'ADA Seating Available' },
    ]
  },
  {
    label: 'Seating',
    type: 'checkbox' as const,
    options: [
      { key: 'seating_ga_standing', label: 'General Admission (Standing)' },
      { key: 'seating_assigned', label: 'Assigned Seating' },
      { key: 'seating_folding_chairs', label: 'Folding Chairs' },
      { key: 'seating_bleachers', label: 'Bleacher Seating' },
      { key: 'seating_standing_only', label: 'Standing Room Only' },
    ]
  },
  {
    label: 'Venue Type',
    type: 'checkbox' as const,
    options: [
      { key: 'venue_indoor', label: 'Indoor' },
      { key: 'venue_outdoor', label: 'Outdoor' },
      { key: 'venue_indoor_outdoor', label: 'Indoor / Outdoor' },
    ]
  },
  {
    label: 'Amenities',
    type: 'checkbox' as const,
    options: [
      { key: 'merch_area', label: 'Merch Area' },
      { key: 'meet_and_greet', label: 'Meet & Greet' },
      { key: 'atm_onsite', label: 'ATM On-Site' },
      { key: 'restrooms', label: 'Restrooms Available' },
    ]
  },
  {
    label: 'Payment',
    type: 'checkbox' as const,
    options: [
      { key: 'cash_only', label: 'Cash Only' },
      { key: 'card_accepted', label: 'Card / Tap Accepted' },
    ]
  },
  {
    label: 'Policies',
    type: 'checkbox' as const,
    options: [
      { key: 'no_reentry', label: 'No Re-Entry' },
      { key: 'bag_search', label: 'Bags Subject to Search' },
      { key: 'no_smoking', label: 'No Smoking Inside' },
    ]
  },
] as const

// --- EVENT TAGS ---

export const EVENT_TAGS = [
  // Event Style
  'deathmatch', 'strong_style', 'lucha_libre', 'hardcore', 'comedy',
  // Roster
  'all_women', 'intergender', 'student_showcase', 'micro_wrestling',
  // Format
  'tournament', 'supercard', 'tv_taping', 'ppv_ippv', 'anniversary_show', 'debut_show',
  // Special
  'fan_fest', 'meet_and_greet', 'watch_party', 'fundraiser_charity',
  // Vibe
  'family_friendly', 'parental_discretion', 'extreme_adults_only', 'live_music', 'themed_event',
] as const

export const EVENT_TAG_LABELS: Record<string, string> = {
  // Event Style
  deathmatch: 'Deathmatch',
  strong_style: 'Strong Style',
  lucha_libre: 'Lucha Libre',
  hardcore: 'Hardcore',
  comedy: 'Comedy',
  // Roster
  all_women: 'All Women',
  intergender: 'Intergender',
  student_showcase: 'Student Showcase',
  micro_wrestling: 'Micro Wrestling',
  // Format
  tournament: 'Tournament',
  supercard: 'Supercard',
  tv_taping: 'TV Taping',
  ppv_ippv: 'PPV / iPPV',
  anniversary_show: 'Anniversary Show',
  debut_show: 'Debut Show',
  // Special
  fan_fest: 'Fan Fest / Convention',
  meet_and_greet: 'Meet & Greet',
  watch_party: 'Watch Party',
  fundraiser_charity: 'Fundraiser / Charity',
  // Vibe
  family_friendly: 'Family Friendly',
  parental_discretion: 'Parental Discretion',
  extreme_adults_only: 'Extreme / Adults Only',
  live_music: 'Live Music + Wrestling',
  themed_event: 'Themed Event',
}

export const EVENT_TAG_GROUPS = [
  { label: 'Event Style', tags: ['deathmatch', 'strong_style', 'lucha_libre', 'hardcore', 'comedy'] },
  { label: 'Roster', tags: ['all_women', 'intergender', 'student_showcase', 'micro_wrestling'] },
  { label: 'Format', tags: ['tournament', 'supercard', 'tv_taping', 'ppv_ippv', 'anniversary_show', 'debut_show'] },
  { label: 'Special', tags: ['fan_fest', 'meet_and_greet', 'watch_party', 'fundraiser_charity'] },
  { label: 'Vibe', tags: ['family_friendly', 'parental_discretion', 'extreme_adults_only', 'live_music', 'themed_event'] },
] as const
