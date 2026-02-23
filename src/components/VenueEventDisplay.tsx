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
const AMENITY_DISPLAY: Record<string, { label: string; icon: any; color: string }> = {
  // Age
  all_ages: { label: 'All Ages', icon: Baby, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  eighteen_plus: { label: '18+', icon: Users, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  twenty_one_plus: { label: '21+', icon: Users, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  // Food & Drink
  food_available: { label: 'Food Available', icon: UtensilsCrossed, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  alcohol_available: { label: 'Alcohol Available', icon: Beer, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  byob: { label: 'BYOB', icon: Beer, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  no_outside_food: { label: 'No Outside Food/Drink', icon: Ban, color: 'text-foreground-muted bg-background-tertiary border-border' },
  // Parking
  parking_free_onsite: { label: 'Free Parking', icon: ParkingCircle, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  parking_paid_onsite: { label: 'Paid Parking', icon: ParkingCircle, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  parking_street: { label: 'Street Parking', icon: Car, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  parking_garage_nearby: { label: 'Garage Nearby', icon: Building2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  parking_limited: { label: 'Limited Parking', icon: Car, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  // Accessibility
  wheelchair_accessible: { label: 'Wheelchair Accessible', icon: Accessibility, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  ada_seating: { label: 'ADA Seating', icon: Accessibility, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  // Seating
  seating_ga_standing: { label: 'General Admission', icon: Users, color: 'text-foreground-muted bg-background-tertiary border-border' },
  seating_assigned: { label: 'Assigned Seating', icon: Armchair, color: 'text-foreground-muted bg-background-tertiary border-border' },
  seating_folding_chairs: { label: 'Folding Chairs', icon: Armchair, color: 'text-foreground-muted bg-background-tertiary border-border' },
  seating_bleachers: { label: 'Bleachers', icon: Armchair, color: 'text-foreground-muted bg-background-tertiary border-border' },
  seating_standing_only: { label: 'Standing Only', icon: Users, color: 'text-foreground-muted bg-background-tertiary border-border' },
  // Venue Type
  venue_indoor: { label: 'Indoor', icon: Home, color: 'text-foreground-muted bg-background-tertiary border-border' },
  venue_outdoor: { label: 'Outdoor', icon: TreePine, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  venue_indoor_outdoor: { label: 'Indoor / Outdoor', icon: TreePine, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  // Amenities
  merch_area: { label: 'Merch Area', icon: ShoppingBag, color: 'text-accent bg-accent/10 border-accent/20' },
  meet_and_greet: { label: 'Meet & Greet', icon: HandMetal, color: 'text-accent bg-accent/10 border-accent/20' },
  atm_onsite: { label: 'ATM On-Site', icon: Banknote, color: 'text-foreground-muted bg-background-tertiary border-border' },
  restrooms: { label: 'Restrooms', icon: Building2, color: 'text-foreground-muted bg-background-tertiary border-border' },
  // Payment
  cash_only: { label: 'Cash Only', icon: Banknote, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  card_accepted: { label: 'Card / Tap Accepted', icon: CreditCard, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  // Policies
  no_reentry: { label: 'No Re-Entry', icon: Ban, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  bag_search: { label: 'Bag Search', icon: Search, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  no_smoking: { label: 'No Smoking', icon: Cigarette, color: 'text-foreground-muted bg-background-tertiary border-border' },
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
const TAG_GROUP_COLORS: Record<string, string> = {
  // Match Style — red/orange
  deathmatch: 'text-red-400 bg-red-500/10 border-red-500/20',
  strong_style: 'text-red-400 bg-red-500/10 border-red-500/20',
  lucha_libre: 'text-red-400 bg-red-500/10 border-red-500/20',
  hardcore: 'text-red-400 bg-red-500/10 border-red-500/20',
  comedy: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  submission_only: 'text-red-400 bg-red-500/10 border-red-500/20',
  // Roster — purple
  all_women: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  intergender: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  student_showcase: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  micro_wrestling: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  all_ages_talent: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  // Format — blue
  tournament: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  battle_royal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  supercard: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  tv_taping: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ppv_ippv: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  anniversary_show: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  debut_show: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  // Special — accent
  fan_fest: 'text-accent bg-accent/10 border-accent/20',
  meet_and_greet: 'text-accent bg-accent/10 border-accent/20',
  watch_party: 'text-accent bg-accent/10 border-accent/20',
  fundraiser_charity: 'text-green-400 bg-green-500/10 border-green-500/20',
  double_header: 'text-accent bg-accent/10 border-accent/20',
  outdoor_special: 'text-green-400 bg-green-500/10 border-green-500/20',
  // Vibe — varies
  family_friendly: 'text-green-400 bg-green-500/10 border-green-500/20',
  eighteen_plus_content: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  extreme_adults_only: 'text-red-400 bg-red-500/10 border-red-500/20',
  live_music: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  themed_event: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
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
