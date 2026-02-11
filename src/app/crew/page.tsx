'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { ROLE_LABELS, formatRoles } from '@/lib/supabase'
import { User, Search, ChevronDown, Briefcase, Shield } from 'lucide-react'
import RequestPageButton from '@/components/RequestPageButton'

export default function CrewPage() {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchProfessionals() }, [roleFilter])

  async function fetchProfessionals() {
    setLoading(true)
    let query = supabase
      .from('professionals')
      .select('id, name, slug, role, moniker, photo_url, residence, verification_status')
      .order('name', { ascending: true })
      .limit(200)

    if (roleFilter) {
      query = query.contains('role', [roleFilter])
    }

    const { data } = await query
    setProfessionals(data || [])
    setLoading(false)
  }

  const filtered = search
    ? professionals.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : professionals

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-black">Crew</h1>
            <p className="text-foreground-muted mt-1">The people behind the scenes making wrestling happen</p>
          </div>
          <RequestPageButton />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search crew..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none"
            />
          </div>

          <div className="relative">
            <button onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors">
              <Briefcase className="w-4 h-4 text-foreground-muted" />
              <span className="text-sm">{roleFilter ? ROLE_LABELS[roleFilter] : 'All Roles'}</span>
              <ChevronDown className="w-4 h-4 text-foreground-muted" />
            </button>
            {showRoleDropdown && (
              <div className="absolute top-full mt-1 left-0 z-20 bg-background-secondary border border-border rounded-lg shadow-xl py-1 min-w-[200px]">
                <button onClick={() => { setRoleFilter(null); setShowRoleDropdown(false) }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 ${!roleFilter ? 'text-accent font-semibold' : ''}`}>
                  All Roles
                </button>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => { setRoleFilter(key); setShowRoleDropdown(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 ${roleFilter === key ? 'text-accent font-semibold' : ''}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-foreground-muted mb-4">{filtered.length} crew members found</p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-background-tertiary mb-2" />
                <div className="h-4 bg-background-tertiary rounded w-3/4 mb-1" />
                <div className="h-3 bg-background-tertiary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-lg font-semibold">No crew members found</p>
            <p className="text-foreground-muted text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((pro) => (
              <Link key={pro.id} href={`/crew/${pro.slug}`} className="group block">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-background-tertiary mb-2">
                  {pro.photo_url ? (
                    <Image src={pro.photo_url} alt={pro.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="200px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-foreground-muted" /></div>
                  )}
                  {pro.verification_status === 'verified' && (
                    <div className="absolute top-2 right-2">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-xs text-accent font-semibold">{formatRoles(pro.role)}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">{pro.name}</h3>
                {pro.residence && <p className="text-xs text-foreground-muted truncate">{pro.residence}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
