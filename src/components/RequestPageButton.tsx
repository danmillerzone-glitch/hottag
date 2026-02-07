'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-client'
import { Plus, X, Loader2, Check, User, Building2 } from 'lucide-react'

export default function RequestPageButton() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [type, setType] = useState<'wrestler' | 'promotion'>('wrestler')
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [socialLinks, setSocialLinks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !user) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('page_requests').insert({
        type,
        name: name.trim(),
        details: details.trim() || null,
        social_links: socialLinks.trim() || null,
        requested_by: user.id,
        requested_by_email: user.email,
      })
      if (error) throw error
      setSubmitted(true)
      setTimeout(() => {
        setShowModal(false)
        setSubmitted(false)
        setName(''); setDetails(''); setSocialLinks(''); setType('wrestler')
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting request:', err)
      alert(err?.message || 'Failed to submit request.')
    }
    setSubmitting(false)
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-secondary text-sm"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Request a Page
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-secondary border border-border rounded-xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-display font-bold">Request a Page</h3>
              <button onClick={() => { setShowModal(false); setSubmitted(false) }} className="p-1.5 rounded-lg hover:bg-background-tertiary">
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <p className="font-semibold">Request Submitted!</p>
                <p className="text-sm text-foreground-muted mt-1">We&apos;ll review your request and create the page soon.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-sm text-foreground-muted">
                  Can&apos;t find a wrestler or promotion? Request their page and we&apos;ll add it.
                </p>

                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">What type of page?</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setType('wrestler')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        type === 'wrestler'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-background-tertiary text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Wrestler
                    </button>
                    <button
                      onClick={() => setType('promotion')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        type === 'promotion'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-background-tertiary text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Promotion
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {type === 'wrestler' ? 'Wrestler Name' : 'Promotion Name'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'wrestler' ? 'e.g., John Smith' : 'e.g., Texas Championship Wrestling'}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Additional Details <span className="text-foreground-muted">(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={type === 'wrestler' ? 'Hometown, promotions they work for, any other info...' : 'Location, website, how often they run shows...'}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm resize-none"
                  />
                </div>

                {/* Social links */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Social Media Links <span className="text-foreground-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={socialLinks}
                    onChange={(e) => setSocialLinks(e.target.value)}
                    placeholder="Instagram, Twitter, website URLs..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim()}
                  className="w-full btn btn-primary"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Submit Request</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
