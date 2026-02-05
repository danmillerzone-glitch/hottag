'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPromoterPromotion, updatePromotion } from '@/lib/promoter'
import { createClient } from '@/lib/supabase-browser'
import {
  Loader2,
  ArrowLeft,
  Save,
  Building2,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Upload,
  Check,
  ExternalLink,
  ImageIcon,
  MapPin,
  Mail,
  ShoppingBag,
} from 'lucide-react'

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function EditPromotionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [promotion, setPromotion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Form state
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [bookingEmail, setBookingEmail] = useState('')
  const [merchUrl, setMerchUrl] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/signin')
      return
    }
    loadPromotion()
  }, [user, authLoading])

  const loadPromotion = async () => {
    setLoading(true)
    const data = await getPromoterPromotion()
    if (!data) {
      router.push('/dashboard')
      return
    }
    setPromotion(data)
    setDescription(data.description || '')
    setWebsite(data.website || '')
    setTwitterHandle(data.twitter_handle || '')
    setInstagramHandle(data.instagram_handle || '')
    setFacebookUrl(data.facebook_url || '')
    setYoutubeUrl(data.youtube_url || '')
    setCity(data.city || '')
    setState(data.state || '')
    setCountry(data.country || 'USA')
    setBookingEmail(data.booking_email || '')
    setMerchUrl(data.merch_url || '')
    setLoading(false)
  }

  const handleSave = async () => {
    if (!promotion) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updatePromotion(promotion.id, {
        description: description || null,
        website: website || null,
        twitter_handle: twitterHandle || null,
        instagram_handle: instagramHandle || null,
        facebook_url: facebookUrl || null,
        youtube_url: youtubeUrl || null,
        city: city || null,
        state: state || null,
        country: country || null,
        booking_email: bookingEmail || null,
        merch_url: merchUrl || null,
      })
      setPromotion(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving promotion:', err)
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !promotion) return

    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    setUploadingLogo(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `promotion-logos/${promotion.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const updated = await updatePromotion(promotion.id, { logo_url: publicUrl })
      setPromotion(updated)
    } catch (err) {
      console.error('Error uploading logo:', err)
    }
    setUploadingLogo(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!promotion) return null

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
          <h1 className="text-2xl font-display font-bold">Edit Promotion Profile</h1>
          <p className="text-sm text-foreground-muted mt-1">{promotion.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Logo */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Logo</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-background-tertiary border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {promotion.logo_url ? (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={96}
                  height={96}
                  className="object-contain p-2"
                />
              ) : (
                <Building2 className="w-10 h-10 text-foreground-muted" />
              )}
            </div>
            <div>
              <label className="btn btn-secondary text-sm cursor-pointer">
                {uploadingLogo ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-1.5" /> Upload Logo</>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
              <p className="text-xs text-foreground-muted mt-2">Square image recommended · Max 2MB</p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">About</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans about your promotion..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none"
            />
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
                placeholder="https://yourpromotion.com"
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
                  placeholder="YourPromotion"
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
                  placeholder="YourPromotion"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-foreground-muted" />
                Facebook URL
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/YourPromotion"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
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
                placeholder="https://youtube.com/@YourPromotion"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Location</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Houston"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="TX"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="USA"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Contact & Merch */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-bold">Contact & Merchandise</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-foreground-muted" />
                Booking / Contact Email
              </label>
              <input
                type="email"
                value={bookingEmail}
                onChange={(e) => setBookingEmail(e.target.value)}
                placeholder="booking@yourpromotion.com"
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
                placeholder="https://shop.yourpromotion.com"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/promotions/${promotion.slug}`}
            className="btn btn-ghost text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View Public Page
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
