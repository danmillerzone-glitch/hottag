'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getWrestlerDashboardData, getClaimedWrestler, getUserWrestlerClaims,
  updateWrestlerProfile, uploadWrestlerPhoto,
  type WrestlerDashboardData,
} from '@/lib/wrestler'
import {
  Loader2, ArrowLeft, Save, User, Globe, Instagram, Youtube,
  Upload, Check, ExternalLink, ImageIcon, Mail, ShoppingBag,
  Shield, ShieldCheck, Clock, Crown, Calendar, Users, MapPin, X,
} from 'lucide-react'
import { COUNTRIES, getFlag, getCountryName } from '@/lib/countries'
import ImageCropUploader from '@/components/ImageCropUploader'

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.65a8.35 8.35 0 0 0 4.76 1.49V6.69h-1z" />
    </svg>
  )
}

export default function WrestlerDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<WrestlerDashboardData | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasWrestler, setHasWrestler] = useState(false)

  // Edit state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Form state
  const [bio, setBio] = useState('')
  const [hometown, setHometown] = useState('')
  const [moniker, setMoniker] = useState('')
  const [birthplace, setBirthplace] = useState('')
  const [residence, setResidence] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [birthday, setBirthday] = useState('')
  const [debutYear, setDebutYear] = useState('')
  const [trainer, setTrainer] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [tiktokHandle, setTiktokHandle] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [bookingEmail, setBookingEmail] = useState('')
  const [merchUrl, setMerchUrl] = useState('')
  const [countriesWrestled, setCountriesWrestled] = useState<string[]>([])
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const dataLoaded = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/signin')
      return
    }
    if (!dataLoaded.current) {
      loadData()
    }
  }, [user, authLoading])

  const loadData = async () => {
    setLoading(true)
    const data = await getWrestlerDashboardData()
    if (data) {
      setDashboardData(data)
      setHasWrestler(true)
      dataLoaded.current = true
      // Populate form
      setBio(data.wrestler.bio || '')
      setHometown(data.wrestler.hometown || '')
      setMoniker(data.wrestler.moniker || '')
      setBirthplace(data.wrestler.birthplace || '')
      setResidence(data.wrestler.residence || data.wrestler.hometown || '')
      setHeight(data.wrestler.height || '')
      setWeight(data.wrestler.weight || '')
      setBirthday(data.wrestler.birthday || '')
      setDebutYear(data.wrestler.debut_year ? String(data.wrestler.debut_year) : '')
      setTrainer(data.wrestler.trainer || '')
      setTwitterHandle(data.wrestler.twitter_handle || '')
      setInstagramHandle(data.wrestler.instagram_handle || '')
      setTiktokHandle(data.wrestler.tiktok_handle || '')
      setYoutubeUrl(data.wrestler.youtube_url || '')
      setWebsite(data.wrestler.website || '')
      setBookingEmail(data.wrestler.booking_email || '')
      setMerchUrl(data.wrestler.merch_url || '')
      setCountriesWrestled(data.wrestler.countries_wrestled || [])
    } else {
      const userClaims = await getUserWrestlerClaims()
      setClaims(userClaims)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!dashboardData) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateWrestlerProfile(dashboardData.wrestler.id, {
        bio: bio || null,
        hometown: residence || hometown || null,
        moniker: moniker || null,
        birthplace: birthplace || null,
        residence: residence || null,
        height: height || null,
        weight: weight || null,
        birthday: birthday || null,
        debut_year: debutYear ? parseInt(debutYear) : null,
        trainer: trainer || null,
        twitter_handle: twitterHandle || null,
        instagram_handle: instagramHandle || null,
        tiktok_handle: tiktokHandle || null,
        youtube_url: youtubeUrl || null,
        website: website || null,
        booking_email: bookingEmail || null,
        merch_url: merchUrl || null,
        countries_wrestled: countriesWrestled,
      })
      setDashboardData({ ...dashboardData, wrestler: updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Error saving wrestler profile:', err)
      alert(`Failed to save: ${err?.message || 'Unknown error'}. Check browser console for details.`)
    }
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !dashboardData) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const updated = await uploadWrestlerPhoto(dashboardData.wrestler.id, file)
      setDashboardData({ ...dashboardData, wrestler: updated })
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Failed to upload photo. Please try again.')
    }
    setUploadingPhoto(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) return null

  // No wrestler claimed yet
  if (!hasWrestler) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Wrestler Dashboard</h1>
            <p className="text-foreground-muted">
              Manage your profile, social links, and more.
            </p>
          </div>

          {claims.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Claims</h2>
              {claims.map((claim) => (
                <div key={claim.id} className="card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden">
                      {claim.wrestlers?.photo_url ? (
                        <Image
                          src={claim.wrestlers.photo_url}
                          alt={claim.wrestlers.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-foreground-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{claim.wrestlers?.name}</div>
                      <div className="text-sm text-foreground-muted">
                        Claimed as {claim.ring_name || claim.contact_name}
                      </div>
                    </div>
                    <div>
                      {claim.status === 'pending' && (
                        <span className="badge bg-interested/20 text-interested">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </span>
                      )}
                      {claim.status === 'approved' && (
                        <span className="badge bg-attending/20 text-attending">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      )}
                      {claim.status === 'rejected' && (
                        <span className="badge bg-red-500/20 text-red-400">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  {claim.status === 'rejected' && claim.admin_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-sm text-red-400">
                      {claim.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Shield className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Wrestler Profile Claimed</h2>
              <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                To access the wrestler dashboard, find your profile and click "Claim This Profile."
              </p>
              <Link href="/wrestlers" className="btn btn-primary">
                <User className="w-4 h-4 mr-2" />
                Browse Wrestlers
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Has wrestler - show dashboard
  const { wrestler, followerCount, upcomingEvents, championships } = dashboardData!

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-accent">
              {wrestler.photo_url ? (
                <Image src={wrestler.photo_url} alt={wrestler.name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <User className="w-8 h-8 text-foreground-muted" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">{wrestler.name}</h1>
              <div className="flex items-center gap-4 text-sm text-foreground-muted mt-1">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {followerCount} followers</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {upcomingEvents.length} upcoming</span>
                {championships.length > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500"><Crown className="w-3.5 h-3.5" /> {championships.length} title{championships.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Championships */}
        {championships.length > 0 && (
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-display font-bold">Current Championships</h2>
            </div>
            <div className="space-y-2">
              {championships.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border border-yellow-600/30">
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-foreground-muted">{c.promotions?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Photo */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Profile Photo</h2>
          </div>

          <ImageCropUploader
            currentUrl={wrestler.photo_url}
            shape="circle"
            size={96}
            onUpload={async (file) => {
              const updated = await uploadWrestlerPhoto(dashboardData!.wrestler.id, file)
              setDashboardData({ ...dashboardData!, wrestler: { ...dashboardData!.wrestler, photo_url: updated.photo_url } })
              return updated.photo_url
            }}
            label="Upload Photo"
          />
          <p className="text-xs text-foreground-muted mt-3">Square image recommended. Max 5MB.</p>
        </section>

        {/* Bio & Details */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">About</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell fans about yourself..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Moniker</label>
              <input
                type="text"
                value={moniker}
                onChange={(e) => setMoniker(e.target.value)}
                placeholder='e.g. "The Phenomenal One"'
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Birthplace</label>
                <input
                  type="text"
                  value={birthplace}
                  onChange={(e) => setBirthplace(e.target.value)}
                  placeholder="e.g. Gainesville, GA"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Currently Residing In</label>
                <input
                  type="text"
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                  placeholder="e.g. Houston, TX"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Height</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 6 ft 1 in"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Weight</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 218 lbs"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Debut Year</label>
                <input
                  type="number"
                  value={debutYear}
                  onChange={(e) => setDebutYear(e.target.value)}
                  placeholder="e.g. 2015"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Trainer</label>
              <input
                type="text"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
                placeholder="e.g. Tom Prichard"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Links & Social Media</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-foreground-muted" />
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <XIcon className="w-3.5 h-3.5 text-foreground-muted" />
                X (Twitter) Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">@</span>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
                  placeholder="YourHandle"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-foreground-muted" />
                Instagram Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">@</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                  placeholder="YourHandle"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <TikTokIcon className="w-3.5 h-3.5 text-foreground-muted" />
                TikTok Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">@</span>
                <input
                  type="text"
                  value={tiktokHandle}
                  onChange={(e) => setTiktokHandle(e.target.value.replace('@', ''))}
                  placeholder="YourHandle"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-foreground-muted" />
                YouTube URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@YourChannel"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Contact & Merch */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Booking & Merchandise</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-foreground-muted" />
                Booking Email
              </label>
              <input
                type="email"
                value={bookingEmail}
                onChange={(e) => setBookingEmail(e.target.value)}
                placeholder="booking@yourname.com"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-foreground-muted" />
                Merchandise Link
              </label>
              <input
                type="url"
                value={merchUrl}
                onChange={(e) => setMerchUrl(e.target.value)}
                placeholder="https://prowrestlingtees.com/yourstore"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Countries Wrestled */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Countries Wrestled</h2>
          </div>

          {/* Current flags */}
          {countriesWrestled.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {countriesWrestled.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-tertiary border border-border text-sm group"
                >
                  <span className="text-lg">{getFlag(code)}</span>
                  {getCountryName(code)}
                  <button
                    onClick={() => setCountriesWrestled(countriesWrestled.filter(c => c !== code))}
                    className="ml-1 p-0.5 rounded hover:bg-red-500/20 text-foreground-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add country */}
          <div className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setTimeout(() => setShowCountryPicker(false), 150)
              }
            }}
          >
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value)
                setShowCountryPicker(true)
              }}
              onFocus={() => setShowCountryPicker(true)}
              placeholder="Search for a country to add..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
            {showCountryPicker && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-background-secondary border border-border rounded-lg shadow-lg">
                {COUNTRIES
                  .filter(c => 
                    !countriesWrestled.includes(c.code) &&
                    (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                     c.code.toLowerCase().includes(countrySearch.toLowerCase()))
                  )
                  .slice(0, 10)
                  .map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setCountriesWrestled([...countriesWrestled, country.code])
                        setCountrySearch('')
                        setShowCountryPicker(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-background-tertiary transition-colors flex items-center gap-2 text-sm"
                    >
                      <span className="text-lg">{country.flag}</span>
                      {country.name}
                    </button>
                  ))}
                {COUNTRIES.filter(c => 
                  !countriesWrestled.includes(c.code) &&
                  (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                   c.code.toLowerCase().includes(countrySearch.toLowerCase()))
                ).length === 0 && (
                  <div className="px-3 py-2 text-sm text-foreground-muted">No countries found</div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            Add countries where you've performed. Click the × to remove.
          </p>
        </section>

        {/* Save */}
        <div className="flex items-center justify-between">
          <Link
            href={`/wrestlers/${wrestler.slug}`}
            className="btn btn-ghost text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View Public Profile
          </Link>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
