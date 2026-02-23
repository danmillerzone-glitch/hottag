import { VENUE_AMENITY_GROUPS, EVENT_TAG_LABELS } from '@/lib/venue-event-constants'
import { 
  Users, UtensilsCrossed, Beer, Car, Accessibility, Armchair, 
  Building2, ShoppingBag, CreditCard, ShieldAlert, Tag,
  Baby, Ban, Cigarette, HandMetal, Banknote, Search,
  ParkingCircle, TreePine, Home
} from 'lucide-react'

// =============================================
// VENUE AMENITIES DISPLAY (Event Page)
// =============================================

// Icon mapping for amenity categories
const AMENITY_ICONS: Record<string, any> = {
  'Age Restriction': Users,
  'Food & Drink': UtensilsCrossed,
  'Parking': Car,
  'Accessibility': Accessibility,
  'Seating': Armchair,
  'Venue Type': Building2,
  'Amenities': ShoppingBag,
  'Payment': CreditCard,
  'Policies': ShieldAlert,
}

// Individual amenity display config with icons
const GRAY_PILL = 'text-foreground-muted bg-background-tertiary border-border'

const AMENITY_DISPLAY: Record<string, { label: string; icon: any; color: string }> = {
  // Age
  all_ages: { label: 'All Ages', icon: Baby, color: GRAY_PILL },
  eighteen_plus: { label: '18+', icon: Users, color: GRAY_PILL },
  twenty_one_plus: { label: '21+', icon: Users, color: GRAY_PILL },
  // Food & Drink
  food_available: { label: 'Food Available', icon: UtensilsCrossed, color: GRAY_PILL },
  alcohol_available: { label: 'Alcohol Available', icon: Beer, color: GRAY_PILL },
  byob: { label: 'BYOB', icon: Beer, color: GRAY_PILL },
  no_outside_food: { label: 'No Outside Food/Drink', icon: Ban, color: GRAY_PILL },
  // Parking
  parking_free_onsite: { label: 'Free Parking', icon: ParkingCircle, color: GRAY_PILL },
  parking_paid_onsite: { label: 'Paid Parking', icon: ParkingCircle, color: GRAY_PILL },
  parking_street: { label: 'Street Parking', icon: Car, color: GRAY_PILL },
  parking_garage_nearby: { label: 'Garage Nearby', icon: Building2, color: GRAY_PILL },
  parking_limited: { label: 'Limited Parking', icon: Car, color: GRAY_PILL },
  // Accessibility
  wheelchair_accessible: { label: 'Wheelchair Accessible', icon: Accessibility, color: GRAY_PILL },
  ada_seating: { label: 'ADA Seating', icon: Accessibility, color: GRAY_PILL },
  // Seating
  seating_ga_standing: { label: 'General Admission', icon: Users, color: GRAY_PILL },
  seating_assigned: { label: 'Assigned Seating', icon: Armchair, color: GRAY_PILL },
  seating_folding_chairs: { label: 'Folding Chairs', icon: Armchair, color: GRAY_PILL },
  seating_bleachers: { label: 'Bleachers', icon: Armchair, color: GRAY_PILL },
  seating_standing_only: { label: 'Standing Only', icon: Users, color: GRAY_PILL },
  // Venue Type
  venue_indoor: { label: 'Indoor', icon: Home, color: GRAY_PILL },
  venue_outdoor: { label: 'Outdoor', icon: TreePine, color: GRAY_PILL },
  venue_indoor_outdoor: { label: 'Indoor / Outdoor', icon: TreePine, color: GRAY_PILL },
  // Amenities
  merch_area: { label: 'Merch Area', icon: ShoppingBag, color: GRAY_PILL },
  meet_and_greet: { label: 'Meet & Greet', icon: HandMetal, color: GRAY_PILL },
  atm_onsite: { label: 'ATM On-Site', icon: Banknote, color: GRAY_PILL },
  restrooms: { label: 'Restrooms', icon: Building2, color: GRAY_PILL },
  // Payment
  cash_only: { label: 'Cash Only', icon: Banknote, color: GRAY_PILL },
  card_accepted: { label: 'Card / Tap Accepted', icon: CreditCard, color: GRAY_PILL },
  // Policies
  no_reentry: { label: 'No Re-Entry', icon: Ban, color: GRAY_PILL },
  bag_search: { label: 'Bag Search', icon: Search, color: GRAY_PILL },
  no_smoking: { label: 'No Smoking', icon: Cigarette, color: GRAY_PILL },
}

interface VenueAmenitiesDisplayProps {
  amenities: Record<string, any>
}

export function VenueAmenitiesDisplay({ amenities }: VenueAmenitiesDisplayProps) {
  if (!amenities || Object.keys(amenities).length === 0) return null

  // Collect all active amenities
  const activePills: { key: string; label: string; icon: any; color: string }[] = []

  // Handle age restriction (radio)
  if (amenities.age_restriction && AMENITY_DISPLAY[amenities.age_restriction]) {
    const d = AMENITY_DISPLAY[amenities.age_restriction]
    activePills.push({ key: 'age', ...d })
  }

  // Handle all boolean amenities
  Object.entries(amenities).forEach(([key, value]) => {
    if (key === 'age_restriction') return // already handled
    if (value === true && AMENITY_DISPLAY[key]) {
      activePills.push({ key, ...AMENITY_DISPLAY[key] })
    }
  })

  if (activePills.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-accent" />
        Venue Info
      </h2>
      <div className="flex flex-wrap gap-2">
        {activePills.map(({ key, label, icon: Icon, color }) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// =============================================
// EVENT TAGS DISPLAY (Event Page)
// =============================================

// Color mapping for tag groups
const GRAY_TAG = 'text-foreground-muted bg-background-tertiary border-border'
const RED_TAG = 'text-red-400 bg-red-500/10 border-red-500/20'

const TAG_GROUP_COLORS: Record<string, string> = {
  // Event Style
  deathmatch: RED_TAG,
  strong_style: GRAY_TAG,
  lucha_libre: GRAY_TAG,
  hardcore: GRAY_TAG,
  comedy: GRAY_TAG,
  // Roster
  all_women: GRAY_TAG,
  intergender: GRAY_TAG,
  student_showcase: GRAY_TAG,
  micro_wrestling: GRAY_TAG,
  // Format
  tournament: GRAY_TAG,
  supercard: GRAY_TAG,
  tv_taping: GRAY_TAG,
  ppv_ippv: GRAY_TAG,
  anniversary_show: GRAY_TAG,
  debut_show: GRAY_TAG,
  // Special
  fan_fest: GRAY_TAG,
  meet_and_greet: GRAY_TAG,
  watch_party: GRAY_TAG,
  fundraiser_charity: GRAY_TAG,
  // Vibe
  family_friendly: GRAY_TAG,
  parental_discretion: GRAY_TAG,
  extreme_adults_only: RED_TAG,
  live_music: GRAY_TAG,
  themed_event: GRAY_TAG,
}

interface EventTagsDisplayProps {
  tags: string[]
}

export function EventTagsDisplay({ tags }: EventTagsDisplayProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${
            TAG_GROUP_COLORS[tag] || 'text-foreground-muted bg-background-tertiary border-border'
          }`}
        >
          <Tag className="w-3 h-3" />
          {EVENT_TAG_LABELS[tag] || tag}
        </span>
      ))}
    </div>
  )
}
