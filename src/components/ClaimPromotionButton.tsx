'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { submitPromotionClaim, getExistingClaim } from '@/lib/promoter'
import { Shield, ShieldCheck, Clock, X, Loader2 } from 'lucide-react'

interface ClaimPromotionButtonProps {
  promotionId: string
  promotionName: string
  verificationStatus: string
}

export default function ClaimPromotionButton({ 
  promotionId, 
  promotionName,
  verificationStatus 
}: ClaimPromotionButtonProps) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [existingClaim, setExistingClaim] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [contactName, setContactName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [proofDescription, setProofDescription] = useState('')
  const [websiteOrSocial, setWebsiteOrSocial] = useState('')

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    checkExistingClaim()
  }, [user, promotionId])

  const checkExistingClaim = async () => {
    setChecking(true)
    const claim = await getExistingClaim(promotionId)
    setExistingClaim(claim)
    setChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await submitPromotionClaim({
        promotion_id: promotionId,
        contact_name: contactName,
        role_title: roleTitle || undefined,
        proof_description: proofDescription || undefined,
        website_or_social: websiteOrSocial || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      if (err?.code === '23505') {
        setError('You already have a pending claim for this promotion.')
      } else {
        setError(err?.message || 'Failed to submit claim. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Already verified
  if (verificationStatus === 'verified') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-attending/10 text-attending text-sm font-medium">
        <ShieldCheck className="w-4 h-4" />
        Verified Promotion
      </div>
    )
  }

  // User has pending claim (only show after check completes)
  if (!checking && existingClaim?.status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-interested/10 text-interested text-sm font-medium">
        <Clock className="w-4 h-4" />
        Claim Pending Review
      </div>
    )
  }

  // User already owns this
  if (!checking && existingClaim?.status === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-attending/10 text-attending text-sm font-medium">
        <ShieldCheck className="w-4 h-4" />
        Your Promotion
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => {
          if (!user) {
            window.location.href = '/signin'
            return
          }
          setShowModal(true)
        }}
        className="btn btn-ghost text-sm gap-1.5"
      >
        <Shield className="w-4 h-4" />
        Claim This Promotion
      </button>

      {/* Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg bg-background-secondary rounded-2xl border border-border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-display font-bold">Claim {promotionName}</h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Verify you represent this promotion
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {success ? (
              /* Success state */
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-attending/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-attending" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Claim Submitted!</h3>
                <p className="text-foreground-muted mb-6">
                  We'll review your claim and get back to you. This usually takes 1-2 business days.
                </p>
                <button
                  onClick={() => { setShowModal(false); setSuccess(false) }}
                  className="btn btn-primary"
                >
                  Got it
                </button>
              </div>
            ) : (
              /* Claim form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Owner, Booker, Social Media Manager..."
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Official Website or Social Link
                  </label>
                  <input
                    type="url"
                    value={websiteOrSocial}
                    onChange={(e) => setWebsiteOrSocial(e.target.value)}
                    placeholder="https://twitter.com/YourPromotion"
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    How Can You Prove Ownership?
                  </label>
                  <textarea
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="E.g., &quot;I can post a verification tweet from @OurPromotion&quot; or &quot;I can verify via our official email domain&quot;"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none"
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    We may reach out to verify your identity.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Submit Claim
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
