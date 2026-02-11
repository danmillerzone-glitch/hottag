import { notFound } from 'next/navigation'
import { createClient as createServerClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { User, MapPin, Globe, Mail, Instagram, Youtube, ExternalLink, Shield, Briefcase, Home } from 'lucide-react'
import VideoCarousel from '@/components/VideoCarousel'
import PortfolioGallery from '@/components/PortfolioGallery'
import MerchGallery from '@/components/MerchGallery'
import ShareButton from '@/components/ShareButton'
import QRCodeButton from '@/components/QRCodeButton'
import FollowProfessionalButton from '@/components/FollowProfessionalButton'
import ClaimProfessionalButton from '@/components/ClaimProfessionalButton'
import { ROLE_LABELS } from '@/lib/supabase'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Bluesky icon
function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 530" className={className} fill="currentColor">
      <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
    </svg>
  )
}

interface CrewPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CrewPageProps) {
  const { data: pro } = await supabase
    .from('professionals')
    .select('name, role, residence')
    .eq('slug', params.slug)
    .single()

  if (!pro) return { title: 'Not Found | Hot Tag' }

  return {
    title: `${pro.name} - ${ROLE_LABELS[pro.role] || pro.role} | Hot Tag`,
    description: `${pro.name} is a ${ROLE_LABELS[pro.role] || pro.role}${pro.residence ? ` based in ${pro.residence}` : ''}`,
  }
}

export default async function CrewProfilePage({ params }: CrewPageProps) {
  const { data: pro } = await supabase
    .from('professionals')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!pro) notFound()

  // Fetch follower count
  const { count: followerCount } = await supabase
    .from('user_follows_professional')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', pro.id)

  // Fetch portfolio
  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('id, title, description, image_url, link_url')
    .eq('professional_id', pro.id)
    .order('sort_order', { ascending: true })

  // Fetch merch
  const { data: merchItems } = await supabase
    .from('professional_merch_items')
    .select('id, title, image_url, link_url, price')
    .eq('professional_id', pro.id)
    .order('sort_order', { ascending: true })

  // Fetch videos
  const { data: profileVideos } = await supabase
    .from('profile_videos')
    .select('id, title, url')
    .eq('professional_id', pro.id)
    .order('sort_order', { ascending: true })

  // Fetch "works with" promotions
  const { data: worksWithRaw } = await supabase
    .from('professional_promotions')
    .select('promotions (id, name, slug, logo_url)')
    .eq('professional_id', pro.id)
    .eq('status', 'accepted')

  const worksWith = worksWithRaw?.map((w: any) => w.promotions).filter(Boolean) || []

  // Build social links
  const socialIcons: { href: string; icon: any }[] = []
  if (pro.twitter_handle) socialIcons.push({ href: `https://x.com/${pro.twitter_handle}`, icon: XIcon })
  if (pro.instagram_handle) socialIcons.push({ href: `https://instagram.com/${pro.instagram_handle}`, icon: Instagram })
  if (pro.youtube_url) socialIcons.push({ href: pro.youtube_url, icon: Youtube })
  if (pro.website) socialIcons.push({ href: pro.website, icon: Globe })
  if (pro.booking_email) socialIcons.push({ href: `mailto:${pro.booking_email}`, icon: Mail })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-background-secondary py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Photo */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-background-tertiary flex-shrink-0 border-2 border-border">
              {pro.photo_url ? (
                <Image src={pro.photo_url} alt={pro.name} width={192} height={192} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-foreground-muted" /></div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-semibold mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                {ROLE_LABELS[pro.role] || pro.role}
              </span>

              {pro.moniker && (
                <p className="text-accent font-bold italic mb-1">&ldquo;{pro.moniker}&rdquo;</p>
              )}

              <h1 className="text-4xl sm:text-5xl font-display font-black uppercase tracking-tight mb-3">
                {pro.name}
              </h1>

              {/* Location */}
              {(pro.hometown || pro.residence) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-foreground-muted mb-4">
                  {pro.hometown && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> From: {pro.hometown}</span>
                  )}
                  {pro.residence && (
                    <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Based in: {pro.residence}</span>
                  )}
                </div>
              )}

              {/* Verified */}
              {pro.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-bold mb-4">
                  <Shield className="w-4 h-4" /> Verified
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <FollowProfessionalButton professionalId={pro.id} professionalName={pro.name} initialFollowerCount={followerCount || 0} />
                <ShareButton title={`${pro.name} | Hot Tag`} text={`Check out ${pro.name} on Hot Tag`} url={`https://www.hottag.app/crew/${pro.slug}`} />
                <div className="flex items-center gap-1">
                  <QRCodeButton url={`https://www.hottag.app/crew/${pro.slug}`} name={pro.name} />
                  {socialIcons.map((link, i) => (
                    <a key={i} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
                      className="p-2 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors">
                      <link.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Bio */}
        {pro.bio && (
          <div>
            <h2 className="text-lg font-display font-bold mb-3">About</h2>
            <p className="text-foreground-muted whitespace-pre-line">{pro.bio}</p>
          </div>
        )}

        {/* Works With */}
        {worksWith.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold mb-4">Works With</h2>
            <div className="flex flex-wrap gap-3">
              {worksWith.map((promo: any) => (
                <Link key={promo.id} href={`/promotions/${promo.slug}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background-tertiary border border-border hover:border-accent/50 transition-colors group">
                  {promo.logo_url ? (
                    <Image src={promo.logo_url} alt={promo.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" unoptimized />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center"><Briefcase className="w-4 h-4 text-foreground-muted" /></div>
                  )}
                  <span className="font-semibold text-sm group-hover:text-accent transition-colors">{promo.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {profileVideos && profileVideos.length > 0 && (
          <VideoCarousel videos={profileVideos} sectionTitle={pro.video_section_title} />
        )}

        {/* Portfolio */}
        {portfolio && portfolio.length > 0 && (
          <PortfolioGallery items={portfolio} />
        )}

        {/* Merch */}
        {merchItems && merchItems.length > 0 && (
          <MerchGallery items={merchItems} />
        )}

        {/* Claim button */}
        {pro.verification_status !== 'verified' && (
          <ClaimProfessionalButton professionalId={pro.id} professionalName={pro.name} verificationStatus={pro.verification_status || 'unverified'} />
        )}
      </div>
    </div>
  )
}
