'use client'

import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import {
  GRADIENT_THEMES, TEXTURE_THEMES, FLAG_THEMES,
  type HeroStyle, type ThemeOption,
} from '@/lib/hero-themes'

interface Props {
  currentStyle: HeroStyle | null
  onSelect: (style: HeroStyle | null) => void
}

export default function HeroThemePicker({ currentStyle, onSelect }: Props) {
  const [tab, setTab] = useState<'gradients' | 'textures' | 'flags'>('gradients')

  const currentId = currentStyle
    ? `${currentStyle.type === 'flag' ? 'flag-' : ''}${currentStyle.value}`
    : 'default'

  const isSelected = (theme: ThemeOption) => {
    if (theme.id === 'default' && !currentStyle) return true
    if (!currentStyle) return false
    if (theme.style.type !== currentStyle.type) return false
    return theme.style.value === currentStyle.value
  }

  const tabs = [
    { key: 'gradients' as const, label: 'Gradients', count: GRADIENT_THEMES.length },
    { key: 'textures' as const, label: 'Textures', count: TEXTURE_THEMES.length },
    { key: 'flags' as const, label: 'Flags', count: FLAG_THEMES.length },
  ]

  const themes = tab === 'gradients' ? GRADIENT_THEMES : tab === 'textures' ? TEXTURE_THEMES : FLAG_THEMES

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Page Theme</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-background-tertiary rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-md transition-colors ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {themes.map((theme) => {
          const selected = isSelected(theme)
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id === 'default' ? null : theme.style)}
              className={`relative group rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                selected
                  ? 'border-accent ring-2 ring-accent/30 scale-105'
                  : 'border-border/50 hover:border-accent/50 hover:scale-105'
              }`}
              title={theme.label}
            >
              {/* Preview background — use actual image for flags */}
              {theme.style.type === 'flag' ? (
                <img
                  src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${theme.style.value.toLowerCase()}.jpg`}
                  alt={theme.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: theme.preview }}
                />
              )}
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="w-5 h-5 text-accent" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                <span className="text-[9px] font-medium text-white/80 truncate block text-center">
                  {theme.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
