import Link from 'next/link'
import {
  User, BarChart3, ShoppingBag, Video,
  QrCode, Trophy, Heart, Share2,
  ArrowRight, CheckCircle,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Wrestlers | Hot Tag',
  description: 'Claim your wrestler page on Hot Tag. Showcase your profile, merch, and videos — connect with fans who want to see you live.',
  openGraph: {
    title: 'For Wrestlers | Hot Tag',
    description: 'Your wrestler page is already live. Claim it to manage your profile, showcase merch, and connect with fans.',
    url: 'https://www.hottag.app/for-wrestlers',
    siteName: 'Hot Tag',
    type: 'website',
  },
}

const FEATURES = [
  {
    icon: User,
    title: 'Your Profile, Your Way',
    description: 'Customize your bio, stats, signature moves, and wrestling style. Add a hero image that makes your page stand out.',
  },
  {
    icon: Heart,
    title: 'Fan Following',
    description: 'Fans follow you directly. They get notified when you\'re announced for events near them.',
  },
  {
    icon: ShoppingBag,
    title: 'Merch Gallery',
    description: 'Showcase your merch with links to your store. All on one page fans actually visit.',
  },
  {
    icon: Video,
    title: 'Video Embeds',
    description: 'Feature your YouTube matches and promos right on your page. Better than a Linktree.',
  },
  {
    icon: QrCode,
    title: 'QR Codes',
    description: 'Get a printable QR code for your gimmick table, flyers, and social media bios.',
  },
  {
    icon: Share2,
    title: 'One Link for Everything',
    description: 'Your Hot Tag page links to all your socials, merch, and upcoming events. Share one URL everywhere.',
  },
  {
    icon: Trophy,
    title: 'Championships',
    description: 'Your title history is tracked automatically. Championship reigns displayed on your profile.',
  },
  {
    icon: BarChart3,
    title: 'Event History',
    description: 'Your upcoming and past events are listed automatically. Fans can see where to catch you next.',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Find Your Page',
    description: 'Search for your name on Hot Tag. Your page is likely already there with your events and stats listed.',
  },
  {
    number: '2',
    title: 'Click Claim',
    description: 'Hit the "Claim This Page" button on your profile. Enter your details or a claim code if you have one.',
  },
  {
    number: '3',
    title: 'Make It Yours',
    description: 'Once verified, you get full access to your wrestler dashboard to manage your profile, merch, videos, and more.',
  },
]

export default function ForWrestlersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight mb-6">
            Your fans want to{' '}
            <span className="text-accent">find you</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground-muted mb-10 max-w-2xl mx-auto">
            Hot Tag connects indie wrestling fans with the wrestlers they love.
            Your page is already live — claim it to take control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/wrestlers"
              className="btn btn-primary px-8 py-4 text-lg font-bold flex items-center gap-2 rounded-xl"
            >
              Find Your Page <ArrowRight className="w-5 h-5" />
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
              Your Hot Tag page replaces your Linktree. Profile, merch, videos,
              upcoming events, and social links — all in one place.
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
              Hot Tag is free for wrestlers. We built this because we love indie wrestling
              and want to help fans connect with the talent they follow.
            </p>
            <Link
              href="/wrestlers"
              className="btn btn-primary px-8 py-4 text-lg font-bold inline-flex items-center gap-2 rounded-xl"
            >
              Find Your Page <ArrowRight className="w-5 h-5" />
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
