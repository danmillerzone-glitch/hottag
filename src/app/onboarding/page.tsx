'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { formatRoles } from '@/lib/supabase'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'
import {
  Flame, ArrowRight, ArrowLeft, Users, Building2, Briefcase, Heart,
  Search, Loader2, Check, User, Plus, ChevronRight,
} from 'lucide-react'

type UserType = 'fan' | 'wrestler' | 'promoter' | 'crew'

// ============================================
// MAIN ONBOARDING PAGE
// ============================================

export default function OnboardingPage() {
  const { user, loading, onboardingCompleted, onboardingLoading, refreshOnboarding } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [saving, setSaving] = useState(false)

  const [selectedPromotions, setSelectedPromotions] = useState<string[]>([])
  const [selectedWrestlers, setSelectedWrestlers] = useState<string[]>([])

  useEffect(() => {
    if (loading || onboardingLoading) return
    if (!user) { router.replace('/welcome'); return }
    if (onboardingCompleted) { router.replace('/'); return }

    supabase
      .from('user_profiles')
      .select('user_type, onboarding_step')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.user_type) setUserType(data.user_type as UserType)
        if (data?.onboarding_step) setStep(data.onboarding_step)
      })
  }, [user, loading, onboardingCompleted, onboardingLoading])

  async function saveProgress(newStep: number, type?: UserType) {
    if (!user) return
    const updates: any = { onboarding_step: newStep }
    if (type) updates.user_type = type
    await supabase.from('user_profiles').update(updates).eq('id', user.id)
  }

  async function completeOnboarding() {
    if (!user) return
    setSaving(true)

    for (const promoId of selectedPromotions) {
      await supabase.from('user_follows_promotion').upsert({
        user_id: user.id, promotion_id: promoId,
      }, { onConflict: 'user_id,promotion_id' })
    }

    for (const wrestlerId of selectedWrestlers) {
      await supabase.from('user_follows_wrestler').upsert({
        user_id: user.id, wrestler_id: wrestlerId,
      }, { onConflict: 'user_id,wrestler_id' })
    }

    await supabase.from('user_profiles').update({
      onboarding_completed: true, onboarding_step: 99,
    }).eq('id', user.id)

    await refreshOnboarding()
    setSaving(false)
    router.replace('/')
  }

  function handleSelectType(type: UserType) {
    setUserType(type)
    saveProgress(1, type)
    setStep(1)
  }

  function handleBack() {
    const prev = step - 1
    setStep(prev)
    saveProgress(prev)
  }

  if (loading || onboardingLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background-tertiary">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${(step / (userType === 'fan' ? 3 : 2)) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {step === 0 && <StepChooseType onSelect={handleSelectType} />}

        {step === 1 && userType === 'fan' && (
          <StepPickPromotions
            selected={selectedPromotions}
            setSelected={setSelectedPromotions}
            onNext={() => { setStep(2); saveProgress(2) }}
            onBack={handleBack}
          />
        )}
        {step === 2 && userType === 'fan' && (
          <StepPickWrestlers
            selected={selectedWrestlers}
            setSelected={setSelectedWrestlers}
            onComplete={completeOnboarding}
            onBack={handleBack}
            saving={saving}
          />
        )}

        {step === 1 && userType === 'wrestler' && (
          <StepClaimSearch type="wrestler" onComplete={completeOnboarding} onBack={handleBack} saving={saving} />
        )}
        {step === 1 && userType === 'promoter' && (
          <StepClaimSearch type="promoter" onComplete={completeOnboarding} onBack={handleBack} saving={saving} />
        )}
        {step === 1 && userType === 'crew' && (
          <StepClaimSearch type="crew" onComplete={completeOnboarding} onBack={handleBack} saving={saving} />
        )}
      </div>
    </div>
  )
}

// ============================================
// STEP: CHOOSE TYPE
// ============================================

function StepChooseType({ onSelect }: { onSelect: (type: UserType) => void }) {
  const types: { type: UserType; icon: any; label: string; desc: string }[] = [
    { type: 'fan', icon: Heart, label: 'Fan', desc: 'Follow wrestlers, track events, and never miss a show' },
    { type: 'wrestler', icon: Users, label: 'Wrestler', desc: 'Claim your profile and connect with fans' },
    { type: 'promoter', icon: Building2, label: 'Promoter', desc: 'Manage your promotion and list events' },
    { type: 'crew', icon: Briefcase, label: 'Crew', desc: 'Refs, photographers, ring crew, and more' },
  ]

  return (
    <div className="text-center">
      <Flame className="w-10 h-10 text-accent mx-auto mb-4" />
      <h1 className="text-3xl font-display font-black mb-2">What brings you to Hot Tag?</h1>
      <p className="text-foreground-muted mb-10">This helps us personalize your experience</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {types.map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="group p-6 rounded-2xl border-2 border-border bg-background-secondary hover:border-accent hover:bg-accent/5 transition-all text-left"
          >
            <Icon className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">{label}</h3>
            <p className="text-sm text-foreground-muted">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// STEP: PICK PROMOTIONS (Curated + Search)
// ============================================

function StepPickPromotions({
  selected, setSelected, onNext, onBack
}: {
  selected: string[]
  setSelected: (s: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [recommended, setRecommended] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Load recommended promotions — verified first, then by follower count
      const { data } = await supabase
        .from('promotions')
        .select('id, name, slug, logo_url, region, state, city')
        .order('follower_count', { ascending: false })
        .limit(50)

      setRecommended(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    const { data } = await supabase
      .from('promotions')
      .select('id, name, slug, logo_url, region, state, city')
      .ilike('name', `%${q}%`)
      .limit(15)
    setSearchResults(data || [])
  }

  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  const displayList = search.length >= 2 ? searchResults : recommended

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-display font-black mb-2">Follow some promotions</h1>
      <p className="text-foreground-muted mb-6">Pick at least 1 to get started. You can always change these later.</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search promotions..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border border-border focus:border-accent outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayList.map(p => (
            <PromotionCard key={p.id} item={p} selected={selected.includes(p.id)} onToggle={() => toggle(p.id)} />
          ))}
        </div>
      ) : search.length >= 2 ? (
        <p className="text-center text-foreground-muted py-8">No promotions found for &ldquo;{search}&rdquo;</p>
      ) : (
        <p className="text-center text-foreground-muted py-8">No promotions available yet.</p>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm text-foreground-muted">{selected.length} selected</span>
          <button onClick={onNext} disabled={selected.length < 1}
            className="btn btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-40">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-20" />
    </div>
  )
}

// ============================================
// PROMOTION CARD (4:5 with logo)
// ============================================

function PromotionCard({ item, selected, onToggle }: { item: any; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
          : 'border-border bg-background-secondary hover:border-foreground-muted/30'
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* 4:5 image area */}
      <div className="relative aspect-[4/5] bg-background-tertiary">
        {item.logo_url ? (
          <Image src={item.logo_url} alt={item.name} fill className="object-cover" sizes="200px" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-foreground-muted/30" />
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-sm font-bold text-white line-clamp-2 drop-shadow-lg">{item.name}</span>
          {item.city && item.state && (
            <span className="text-[10px] text-white/70 drop-shadow">{item.city}, {item.state}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================
// STEP: PICK WRESTLERS (Hero cards)
// ============================================

function StepPickWrestlers({
  selected, setSelected, onComplete, onBack, saving
}: {
  selected: string[]
  setSelected: (s: string[]) => void
  onComplete: () => void
  onBack: () => void
  saving: boolean
}) {
  const [wrestlers, setWrestlers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('wrestlers')
        .select('id, name, slug, photo_url, render_url, hometown, moniker, hero_style')
        .eq('verification_status', 'verified')
        .order('follower_count', { ascending: false })
        .limit(40)

      setWrestlers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    const { data } = await supabase
      .from('wrestlers')
      .select('id, name, slug, photo_url, render_url, hometown, moniker, hero_style')
      .eq('verification_status', 'verified')
      .ilike('name', `%${q}%`)
      .limit(15)
    setSearchResults(data || [])
  }

  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  const displayList = search.length >= 2 ? searchResults : wrestlers

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-display font-black mb-2">Follow some wrestlers</h1>
      <p className="text-foreground-muted mb-6">Pick at least 1. This helps us recommend events for you.</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search wrestlers..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border border-border focus:border-accent outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {displayList.map(w => (
            <WrestlerHeroCard key={w.id} wrestler={w} selected={selected.includes(w.id)} onToggle={() => toggle(w.id)} />
          ))}
        </div>
      ) : search.length >= 2 ? (
        <p className="text-center text-foreground-muted py-8">No wrestlers found for &ldquo;{search}&rdquo;</p>
      ) : (
        <p className="text-center text-foreground-muted py-8">No verified wrestlers available yet.</p>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm text-foreground-muted">{selected.length} selected</span>
          <button onClick={onComplete} disabled={selected.length < 1 || saving}
            className="btn btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-40">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Finishing...</> : <>Let&apos;s Go <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
      <div className="h-20" />
    </div>
  )
}

// ============================================
// WRESTLER HERO CARD (matches roster cards)
// ============================================

function WrestlerHeroCard({ wrestler, selected, onToggle }: { wrestler: any; selected: boolean; onToggle: () => void }) {
  const imageUrl = wrestler.render_url || wrestler.photo_url
  const heroCSS = getHeroCSS(wrestler.hero_style || null)
  const hasTheme = !!wrestler.hero_style

  return (
    <button onClick={onToggle} className="relative block text-left">
      <div className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? 'border-accent ring-2 ring-accent/30'
          : 'border-border hover:border-foreground-muted/30'
      }`}>
        {/* Check mark */}
        {selected && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Hero background */}
        {hasTheme && (
          <div className="absolute inset-0 z-[0]">
            {wrestler.hero_style?.type === 'flag' ? (
              <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${wrestler.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : (
              <>
                <div className="absolute inset-0" style={{ background: heroCSS.background, opacity: 0.5 }} />
                {heroCSS.texture && (
                  <div className="absolute inset-0" style={{ background: heroCSS.texture, opacity: 0.3 }} />
                )}
              </>
            )}
          </div>
        )}

        {/* Wrestler image */}
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={wrestler.name}
              fill
              className={`${wrestler.render_url ? 'object-contain object-bottom' : 'object-cover'} relative z-[1]`}
              sizes="180px"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-background-tertiary">
            <User className="w-12 h-12 text-foreground-muted/30" />
          </div>
        )}

        {/* Name + moniker */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 z-[3]">
          {wrestler.moniker && (
            <span className="text-[9px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
              &ldquo;{wrestler.moniker}&rdquo;
            </span>
          )}
          <span className="text-xs font-bold text-white line-clamp-2 drop-shadow-lg">
            {wrestler.name}
          </span>
        </div>
      </div>
    </button>
  )
}

// ============================================
// STEP: CLAIM/SEARCH (Wrestler, Promoter, Crew)
// ============================================

function StepClaimSearch({
  type, onComplete, onBack, saving
}: {
  type: 'wrestler' | 'promoter' | 'crew'
  onComplete: () => void
  onBack: () => void
  saving: boolean
}) {
  const { user } = useAuth()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestName, setRequestName] = useState('')

  const table = type === 'wrestler' ? 'wrestlers' : type === 'promoter' ? 'promotions' : 'professionals'
  const labels = {
    wrestler: { title: 'Find your wrestler profile', desc: 'Search to see if you already have a page on Hot Tag', placeholder: 'Search by ring name...', request: 'Request a Wrestler Page', notFound: 'wrestler profile' },
    promoter: { title: 'Find your promotion', desc: 'Search to see if your promotion is already listed', placeholder: 'Search promotion name...', request: 'Request a Promotion Page', notFound: 'promotion' },
    crew: { title: 'Find your crew profile', desc: 'Search to see if you already have a page on Hot Tag', placeholder: 'Search by name...', request: 'Request a Crew Page', notFound: 'crew profile' },
  }

  async function handleSearch() {
    if (!search.trim()) return
    setSearching(true)
    setHasSearched(true)
    const { data } = await supabase
      .from(table)
      .select('id, name, slug' + (type === 'crew' ? ', role' : '') + (type !== 'crew' ? ', logo_url' : ', photo_url'))
      .ilike('name', `%${search}%`)
      .limit(10)
    setResults(data || [])
    setSearching(false)
  }

  async function handleRequest() {
    if (!requestName.trim() || !user) return
    await supabase.from('page_requests').insert({
      type: type === 'promoter' ? 'promotion' : type,
      name: requestName.trim(),
      requested_by: user.id,
      requested_by_email: user.email,
    })
    setRequestSent(true)
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-display font-black mb-2">{labels[type].title}</h1>
      <p className="text-foreground-muted mb-8">{labels[type].desc}</p>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={labels[type].placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border border-border focus:border-accent outline-none"
          />
        </div>
        <button onClick={handleSearch} disabled={searching || !search.trim()} className="btn btn-primary px-6">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 mb-8">
          {results.map(item => (
            <a key={item.id}
              href={`/${type === 'wrestler' ? 'wrestlers' : type === 'promoter' ? 'promotions' : 'crew'}/${item.slug}`}
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-xl bg-background-secondary border border-border hover:border-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-background-tertiary flex-shrink-0">
                {(item.logo_url || item.photo_url) ? (
                  <Image src={item.logo_url || item.photo_url} alt={item.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-foreground-muted" /></div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                {item.role && <p className="text-xs text-foreground-muted">{formatRoles(item.role)}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted" />
            </a>
          ))}
          <p className="text-sm text-foreground-muted mt-2">
            Found your page? Visit it and use the claim button to verify ownership.
          </p>
        </div>
      )}

      {hasSearched && results.length === 0 && !searching && (
        <div className="text-center py-6 mb-6">
          <p className="text-foreground-muted mb-2">No {labels[type].notFound} found for &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {hasSearched && !requestSent && (
        <div className="card p-6 mb-8">
          <h3 className="font-bold mb-3">Don&apos;t see yourself? Request a page.</h3>
          <div className="flex gap-2">
            <input type="text" value={requestName} onChange={e => setRequestName(e.target.value)}
              placeholder={type === 'crew' ? 'e.g., Tim the Ref' : type === 'wrestler' ? 'e.g., John Smith' : 'e.g., Texas Championship Wrestling'}
              className="flex-1 px-3 py-2.5 rounded-lg bg-background-tertiary border border-border focus:border-accent outline-none" />
            <button onClick={handleRequest} disabled={!requestName.trim()} className="btn btn-secondary px-4">
              <Plus className="w-4 h-4 mr-1" /> Request
            </button>
          </div>
        </div>
      )}

      {requestSent && (
        <div className="card p-6 mb-8 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <p className="font-semibold">Request submitted!</p>
          </div>
          <p className="text-sm text-foreground-muted mt-1">We&apos;ll review it and get back to you.</p>
        </div>
      )}

      <div className="text-center">
        <button onClick={onComplete} disabled={saving} className="btn btn-primary px-8 py-3">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Setting up...</> : 'Continue to Hot Tag'}
        </button>
        <p className="text-xs text-foreground-muted mt-3">You can always claim or request a page later</p>
      </div>
    </div>
  )
}
