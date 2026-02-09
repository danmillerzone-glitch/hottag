// Hero style themes for wrestler profile customization

export interface HeroStyle {
  type: 'gradient' | 'flag' | 'texture' | 'solid'
  value: string
  accent?: string
}

export interface ThemeOption {
  id: string
  label: string
  style: HeroStyle
  preview: string // CSS for the preview swatch
}

// ─── GRADIENT PRESETS ────────────────────────────────────────
export const GRADIENT_THEMES: ThemeOption[] = [
  {
    id: 'default',
    label: 'Default',
    style: { type: 'solid', value: '#1c2228' },
    preview: 'linear-gradient(135deg, #1c2228 0%, #2a3440 100%)',
  },
  {
    id: 'crimson-black',
    label: 'Crimson',
    style: { type: 'gradient', value: 'crimson-black' },
    preview: 'linear-gradient(135deg, #1a0000 0%, #8b0000 40%, #1a0000 100%)',
  },
  {
    id: 'royal-blue',
    label: 'Royal',
    style: { type: 'gradient', value: 'royal-blue' },
    preview: 'linear-gradient(135deg, #000428 0%, #004e92 50%, #000428 100%)',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    style: { type: 'gradient', value: 'emerald' },
    preview: 'linear-gradient(135deg, #0a1a0a 0%, #065535 50%, #0a1a0a 100%)',
  },
  {
    id: 'gold-black',
    label: 'Gold',
    style: { type: 'gradient', value: 'gold-black' },
    preview: 'linear-gradient(135deg, #1a1500 0%, #b8860b 40%, #1a1500 100%)',
  },
  {
    id: 'purple-reign',
    label: 'Purple Reign',
    style: { type: 'gradient', value: 'purple-reign' },
    preview: 'linear-gradient(135deg, #0d001a 0%, #6a0dad 50%, #0d001a 100%)',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    style: { type: 'gradient', value: 'midnight' },
    preview: 'linear-gradient(135deg, #020111 0%, #191970 50%, #020111 100%)',
  },
  {
    id: 'inferno',
    label: 'Inferno',
    style: { type: 'gradient', value: 'inferno' },
    preview: 'linear-gradient(135deg, #1a0000 0%, #ff4500 30%, #8b0000 70%, #1a0000 100%)',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    style: { type: 'gradient', value: 'arctic' },
    preview: 'linear-gradient(135deg, #0a1628 0%, #1e90ff 30%, #00ced1 70%, #0a1628 100%)',
  },
  {
    id: 'toxic',
    label: 'Toxic',
    style: { type: 'gradient', value: 'toxic' },
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #39ff14 30%, #006400 70%, #0a0a0a 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    style: { type: 'gradient', value: 'sunset' },
    preview: 'linear-gradient(135deg, #1a0a00 0%, #ff6b35 30%, #ff1493 70%, #1a001a 100%)',
  },
  {
    id: 'steel',
    label: 'Steel',
    style: { type: 'gradient', value: 'steel' },
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 40%, #2a2a2a 60%, #1a1a1a 100%)',
  },
]

// ─── TEXTURE PRESETS ────────────────────────────────────────
export const TEXTURE_THEMES: ThemeOption[] = [
  {
    id: 'carbon-fiber',
    label: 'Carbon Fiber',
    style: { type: 'texture', value: 'carbon-fiber' },
    preview: 'repeating-linear-gradient(45deg, #111 0px, #111 2px, #1a1a1a 2px, #1a1a1a 4px)',
  },
  {
    id: 'diamond-plate',
    label: 'Diamond Plate',
    style: { type: 'texture', value: 'diamond-plate' },
    preview: 'repeating-conic-gradient(#222 0% 25%, #1a1a1a 0% 50%) 0 0 / 12px 12px',
  },
  {
    id: 'chain-link',
    label: 'Chain Link',
    style: { type: 'texture', value: 'chain-link' },
    preview: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px) 0 0 / 8px 8px',
  },
  {
    id: 'brushed-metal',
    label: 'Brushed Metal',
    style: { type: 'texture', value: 'brushed-metal' },
    preview: 'repeating-linear-gradient(90deg, #1a1a1a 0px, #252525 1px, #1a1a1a 2px)',
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    style: { type: 'texture', value: 'hexagon' },
    preview: 'linear-gradient(135deg, #1a1a2e 25%, #16213e 25%, #16213e 50%, #1a1a2e 50%, #1a1a2e 75%, #16213e 75%) 0 0 / 16px 16px',
  },
  {
    id: 'circuit',
    label: 'Circuit',
    style: { type: 'texture', value: 'circuit' },
    preview: 'linear-gradient(0deg, #0a0a0a 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, #0a0a0a 1px, transparent 1px) 0 0 / 20px 20px, #111',
  },
]

// ─── FLAG PRESETS ────────────────────────────────────────
// Flags use image files from /flags/ directory. Upload custom flag images there.
export const FLAG_THEMES: ThemeOption[] = [
  { id: 'flag-US', label: '🇺🇸 USA', style: { type: 'flag', value: 'US' }, preview: 'linear-gradient(180deg, #002868 0%, #002868 46%, #fff 46%, #fff 54%, #BF0A30 54%, #BF0A30 100%)' },
  { id: 'flag-MX', label: '🇲🇽 Mexico', style: { type: 'flag', value: 'MX' }, preview: 'linear-gradient(90deg, #006847 0%, #006847 33%, #fff 33%, #fff 67%, #ce1126 67%, #ce1126 100%)' },
  { id: 'flag-JP', label: '🇯🇵 Japan', style: { type: 'flag', value: 'JP' }, preview: 'radial-gradient(circle at 50% 50%, #BC002D 20%, #fff 20%)' },
  { id: 'flag-GB', label: '🇬🇧 UK', style: { type: 'flag', value: 'GB' }, preview: 'linear-gradient(180deg, #012169 0%, #012169 40%, #C8102E 40%, #C8102E 60%, #012169 60%)' },
  { id: 'flag-CA', label: '🇨🇦 Canada', style: { type: 'flag', value: 'CA' }, preview: 'linear-gradient(90deg, #ff0000 0%, #ff0000 25%, #fff 25%, #fff 75%, #ff0000 75%, #ff0000 100%)' },
  { id: 'flag-DE', label: '🇩🇪 Germany', style: { type: 'flag', value: 'DE' }, preview: 'linear-gradient(180deg, #000 0%, #000 33%, #DD0000 33%, #DD0000 67%, #FFCE00 67%)' },
  { id: 'flag-IE', label: '🇮🇪 Ireland', style: { type: 'flag', value: 'IE' }, preview: 'linear-gradient(90deg, #169B62 0%, #169B62 33%, #fff 33%, #fff 67%, #FF883E 67%)' },
  { id: 'flag-IT', label: '🇮🇹 Italy', style: { type: 'flag', value: 'IT' }, preview: 'linear-gradient(90deg, #009246 0%, #009246 33%, #fff 33%, #fff 67%, #CE2B37 67%)' },
  { id: 'flag-PR', label: '🇵🇷 Puerto Rico', style: { type: 'flag', value: 'PR' }, preview: 'linear-gradient(180deg, #ff0000 0%, #ff0000 20%, #fff 20%, #fff 40%, #ff0000 40%, #ff0000 60%, #fff 60%, #fff 80%, #ff0000 80%)' },
  { id: 'flag-AU', label: '🇦🇺 Australia', style: { type: 'flag', value: 'AU' }, preview: 'linear-gradient(135deg, #012169 0%, #012169 100%)' },
  { id: 'flag-BR', label: '🇧🇷 Brazil', style: { type: 'flag', value: 'BR' }, preview: 'linear-gradient(135deg, #009c3b 0%, #009c3b 30%, #ffdf00 50%, #009c3b 70%, #009c3b 100%)' },
  { id: 'flag-IN', label: '🇮🇳 India', style: { type: 'flag', value: 'IN' }, preview: 'linear-gradient(180deg, #FF9933 0%, #FF9933 33%, #fff 33%, #fff 67%, #138808 67%)' },
]

// Flag image path helper — checks for custom uploaded flag first
export function getFlagImagePath(countryCode: string): string {
  return `https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${countryCode.toLowerCase()}.jpg`
}

// ─── ALL THEMES ────────────────────────────────────────
export const ALL_THEMES = [...GRADIENT_THEMES, ...TEXTURE_THEMES, ...FLAG_THEMES]

// ─── GENERATE CSS FOR A HERO STYLE ────────────────────────────────────────
export function getHeroCSS(style: HeroStyle | null): { background: string; texture?: string } {
  if (!style) return { background: '#1c2228' }

  switch (style.type) {
    case 'solid':
      return { background: style.value }

    case 'gradient':
      return { background: getGradientCSS(style.value) }

    case 'flag':
      return { background: getFlagCSS(style.value) }

    case 'texture':
      return getTextureCSS(style.value)

    default:
      return { background: '#1c2228' }
  }
}

function getGradientCSS(value: string): string {
  const map: Record<string, string> = {
    'crimson-black': 'linear-gradient(135deg, #1a0000 0%, #8b0000 30%, #4a0000 60%, #1a0000 100%)',
    'royal-blue': 'linear-gradient(135deg, #000428 0%, #004e92 40%, #001a3a 70%, #000428 100%)',
    'emerald': 'linear-gradient(135deg, #0a1a0a 0%, #065535 35%, #032912 65%, #0a1a0a 100%)',
    'gold-black': 'linear-gradient(135deg, #1a1500 0%, #b8860b 30%, #6b4f00 60%, #1a1500 100%)',
    'purple-reign': 'linear-gradient(135deg, #0d001a 0%, #6a0dad 35%, #3a0070 65%, #0d001a 100%)',
    'midnight': 'linear-gradient(135deg, #020111 0%, #191970 40%, #0a0a40 70%, #020111 100%)',
    'inferno': 'linear-gradient(135deg, #1a0000 0%, #ff4500 25%, #8b0000 55%, #2d0000 80%, #1a0000 100%)',
    'arctic': 'linear-gradient(135deg, #0a1628 0%, #1e90ff 25%, #00ced1 55%, #0a2a3a 80%, #0a1628 100%)',
    'toxic': 'linear-gradient(135deg, #0a0a0a 0%, #39ff14 20%, #006400 50%, #003200 75%, #0a0a0a 100%)',
    'sunset': 'linear-gradient(135deg, #1a0a00 0%, #ff6b35 25%, #ff1493 55%, #6a0050 80%, #1a001a 100%)',
    'steel': 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 25%, #4a4a4a 40%, #2a2a2a 60%, #1a1a1a 100%)',
  }
  return map[value] || '#1c2228'
}

function getFlagCSS(countryCode: string): string {
  const map: Record<string, string> = {
    US: 'linear-gradient(180deg, #002868 0%, #002868 42%, #bf0a30 42%, #bf0a30 50%, #fff 50%, #fff 58%, #bf0a30 58%, #bf0a30 100%)',
    MX: 'linear-gradient(90deg, #006847 0%, #006847 33%, #f0f0e0 33%, #f0f0e0 67%, #ce1126 67%, #ce1126 100%)',
    JP: 'radial-gradient(circle at 60% 50%, #BC002D 15%, #BC002D22 15%, #e8e8e8 50%, #1c2228 100%)',
    GB: 'linear-gradient(135deg, #012169 0%, #1a2a5a 40%, #C8102E 50%, #1a2a5a 60%, #012169 100%)',
    CA: 'linear-gradient(90deg, #ff0000 0%, #ff0000 25%, #f0f0f0 25%, #f0f0f0 75%, #ff0000 75%, #ff0000 100%)',
    DE: 'linear-gradient(180deg, #111 0%, #111 33%, #DD0000 33%, #DD0000 67%, #FFCE00 67%)',
    IE: 'linear-gradient(90deg, #169B62 0%, #169B62 33%, #f0f0f0 33%, #f0f0f0 67%, #FF883E 67%)',
    IT: 'linear-gradient(90deg, #009246 0%, #009246 33%, #f0f0f0 33%, #f0f0f0 67%, #CE2B37 67%)',
    PR: 'linear-gradient(180deg, #ff0000 0%, #ff0000 20%, #fff 20%, #fff 40%, #ff0000 40%, #ff0000 60%, #fff 60%, #fff 80%, #ff0000 80%)',
    AU: 'linear-gradient(135deg, #012169 0%, #00008B 50%, #012169 100%)',
    BR: 'linear-gradient(135deg, #009c3b 0%, #009c3b 25%, #ffdf00 50%, #009c3b 75%, #009c3b 100%)',
    IN: 'linear-gradient(180deg, #FF9933 0%, #FF9933 33%, #f0f0f0 33%, #f0f0f0 67%, #138808 67%)',
  }
  return map[countryCode] || '#1c2228'
}

function getTextureCSS(value: string): { background: string; texture: string } {
  const base = '#111'
  const map: Record<string, { bg: string; tex: string }> = {
    'carbon-fiber': {
      bg: '#111',
      tex: 'repeating-linear-gradient(45deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
    },
    'diamond-plate': {
      bg: '#151515',
      tex: 'repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px',
    },
    'chain-link': {
      bg: '#0f0f0f',
      tex: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 1px, transparent 1px) 0 0 / 12px 12px',
    },
    'brushed-metal': {
      bg: '#141414',
      tex: 'repeating-linear-gradient(90deg, transparent 0px, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px)',
    },
    'hexagon': {
      bg: '#111122',
      tex: 'linear-gradient(60deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%) 0 0 / 20px 34px, linear-gradient(60deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%) 10px 17px / 20px 34px',
    },
    'circuit': {
      bg: '#0a0a0a',
      tex: 'linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 24px 24px',
    },
  }
  const t = map[value]
  if (!t) return { background: base, texture: '' }
  return { background: t.bg, texture: t.tex }
}
