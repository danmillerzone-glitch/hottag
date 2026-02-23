'use client'

import { useState } from 'react'
import { VENUE_AMENITY_GROUPS, EVENT_TAG_GROUPS, EVENT_TAG_LABELS } from '@/lib/venue-event-constants'
import { Building2, Tag, ChevronDown, ChevronUp } from 'lucide-react'

// =============================================
// VENUE AMENITIES EDITOR
// =============================================

interface VenueAmenitiesEditorProps {
  amenities: Record<string, any>
  onChange: (amenities: Record<string, any>) => void
}

export function VenueAmenitiesEditor({ amenities, onChange }: VenueAmenitiesEditorProps) {
  const [expanded, setExpanded] = useState(true)

  const toggleCheckbox = (key: string) => {
    onChange({ ...amenities, [key]: !amenities[key] })
  }

  const setRadio = (key: string, value: string) => {
    // If clicking the same value, unset it
    onChange({ ...amenities, [key]: amenities[key] === value ? null : value })
  }

  return (
    <div className="card p-5">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent" />
          Venue Info
        </h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
      </button>

      {expanded && (
        <div className="space-y-5">
          {VENUE_AMENITY_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.type === 'radio' && 'key' in group ? (
                  // Radio group — single select
                  group.options.map((opt) => {
                    const isActive = amenities[group.key] === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRadio(group.key, opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          isActive
                            ? 'bg-accent/15 text-accent border-accent/40'
                            : 'bg-background-tertiary text-foreground-muted border-border hover:border-foreground-muted/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })
                ) : (
                  // Checkbox group — multi select
                  'options' in group && group.options.map((opt) => {
                    const key = (opt as { key: string; label: string }).key
                    const label = (opt as { key: string; label: string }).label
                    const isActive = !!amenities[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCheckbox(key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          isActive
                            ? 'bg-accent/15 text-accent border-accent/40'
                            : 'bg-background-tertiary text-foreground-muted border-border hover:border-foreground-muted/30'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================
// EVENT TAGS EDITOR
// =============================================

interface EventTagsEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function EventTagsEditor({ tags, onChange }: EventTagsEditorProps) {
  const [expanded, setExpanded] = useState(true)

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onChange(tags.filter(t => t !== tag))
    } else {
      onChange([...tags, tag])
    }
  }

  return (
    <div className="card p-5">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-400" />
          Event Tags
        </h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
      </button>

      {expanded && (
        <div className="space-y-5">
          {EVENT_TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const isActive = tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/40'
                          : 'bg-background-tertiary text-foreground-muted border-border hover:border-foreground-muted/30'
                      }`}
                    >
                      {EVENT_TAG_LABELS[tag] || tag}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
