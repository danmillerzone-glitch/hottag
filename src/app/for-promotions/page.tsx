import Link from 'next/link'
import {
  Calendar, BarChart3, Users, Ticket,
  QrCode, Video, ShoppingBag, Crown,
  ArrowRight, CheckCircle,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Promotions | Hot Tag',
  description: 'Claim your promotion page on Hot Tag. Manage events, connect with fans, and grow your audience — free.',
  openGraph: {
    title: 'For Promotions | Hot Tag',
    description: 'Your promotion already has a page. Claim it to manage events, showcase your roster, and help fans find your shows.',
    url: 'https://www.hottag.app/for-promotions',
    siteName: 'Hot Tag',
    type: 'website',
  },
}

const FEATURES = [
  {
    icon: Calendar,
    title: 'Event Management',
    description: 'Create and manage your events. Fans can RSVP, get directions, and buy tickets.',
  },
  {
    icon: BarChart3,
    title: 'Fan Engagement',
    description: 'See who\'s following your promotion, attending your shows, and interested in upcoming events.',
  },
  {
    icon: Users,
    title: 'Roster Showcase',
    description: 'Display your full roster with wrestler profiles. Fans follow your talent directly.',
  },
  {
    icon: Ticket,
    title: 'Ticket Integration',
    description: 'Link tickets directly on your event pages. Add coupon codes to drive sales.',
  },
  {
    icon: QrCode,
    title: 'QR Codes',
    description: 'Get printable QR codes for flyers, merch tables, and venue displays.',
  },
  {
    icon: Video,
    title: 'Video Embeds',
    description: 'Showcase your YouTube content directly on your page. Better than a Linktree.',
  },
  {
    icon: Crown,
    title: 'Championships',
    description: 'Display your title belts and current champions with dedicated championship sections.',
  },
  {
    icon: ShoppingBag,
    title: 'Merch Gallery',
    description: 'Feature your merch with links to your store. All in one shareable page.',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Find Your Page',
    description: 'Search for your promotion on Hot Tag. Your page is likely already there with your events and roster listed.',
  },
  {
    number: '2',
    title: 'Click Claim',
    description: 'Hit the "Claim This Promotion" button on your page. Enter your details or a claim code if you have one.',
  },
  {
    number: '3',
    title: 'Take Control',
    description: 'Once verified, you get full access to your promoter dashboard to manage events, roster, merch, and more.',
  },
]

export default function ForPromotionsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight mb-6">
            Your fans are looking{' '}
            <span className="text-accent">for your shows</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground-muted mb-10 max-w-2xl mx-auto">
            Hot Tag helps indie wrestling fans discover events near them.
            Your promotion already has a page — claim it to take control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/promotions"
              className="btn btn-primary px-8 py-4 text-lg font-bold flex items-center gap-2 rounded-xl"
            >
              Find Your Promotion <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signup"
              className="text-foreground-muted hover:text-foreground text-sm transition-colors"
            >
              I have a claim code
            </Link>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything you need in <span className="text-accent">one link</span>
            </h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              Your Hot Tag page replaces your Linktree, event posts, and roster graphics.
              One URL your fans actually want to visit.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card p-6 hover:border-accent/30 transition-colors">
                  <Icon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-display font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground-muted">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Claim */}
      <section className="py-16 sm:py-24 px-4 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Claim your page in <span className="text-accent">30 seconds</span>
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent text-white text-xl font-display font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-foreground-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* It's Free */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-8 sm:p-12 border-accent/20">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Completely free. No catch.
            </h2>
            <p className="text-foreground-muted mb-8 max-w-lg mx-auto">
              Hot Tag is free for promotions. We built this because we love indie wrestling
              and want to help fans find shows. Your success is our success.
            </p>
            <Link
              href="/promotions"
              className="btn btn-primary px-8 py-4 text-lg font-bold inline-flex items-center gap-2 rounded-xl"
            >
              Find Your Promotion <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-foreground-muted mt-6">
              Questions? DM us{' '}
              <a
                href="https://x.com/HotTagApp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                @HotTagApp
              </a>{' '}
              on X
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
