'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { submitWrestlerClaim, getExistingWrestlerClaim } from '@/lib/wrestler'
import { Shield, ShieldCheck, Clock, X, Loader2, User } from 'lucide-react'

interface ClaimWrestlerButtonProps {
  wrestlerId: string
  wrestlerName: string
  verificationStatus: string
}

export default function ClaimWrestlerButton({ 
  wrestlerId, 
  wrestlerName,
  verificationStatus 
}: ClaimWrestlerButtonProps) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [existingClaim, setExistingClaim] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [contactName, setContactName] = useState('')
  const [ringName, setRingName] = useState('')
  const [proofDescription, setProofDescription] = useState('')
  const [websiteOrSocial, setWebsiteOrSocial] = useState('')

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    checkExistingClaim()
  }, [user, wrestlerId])

  const checkExistingClaim = async () => {
    setChecking(true)
    const claim = await getExistingWrestlerClaim(wrestlerId)
    setExistingClaim(claim)
    setChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await submitWrestlerClaim({
        wrestler_id: wrestlerId,
        contact_name: contactName,
        ring_name: ringName || undefined,
        proof_description: proofDescription || undefined,
        website_or_social: websiteOrSocial || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      if (err?.code === '23505') {
        setError('You already have a pending claim for this wrestler.')
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
        Verified
      </div>
    )
  }

  // User has pending claim
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
        Your Profile
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
        Claim This Profile
      </button>

      {/* Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setShowModal(false)}
          />
          
          <div className="relative w-full max-w-lg bg-background-secondary rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-display font-bold">Claim {wrestlerName}</h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Verify that you are this wrestler
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
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Your Real Name <span className="text-red-400">*</span>
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
                    Ring Name
                  </label>
                  <input
                    type="text"
                    value={ringName}
                    onChange={(e) => setRingName(e.target.value)}
                    placeholder={wrestlerName}
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Your Official Social Media Link
                  </label>
                  <input
                    type="url"
                    value={websiteOrSocial}
                    onChange={(e) => setWebsiteOrSocial(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    How Can You Verify Your Identity?
                  </label>
                  <textarea
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder='E.g., "I can post a verification story on my Instagram @handle" or "I can send a DM from my official Twitter"'
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
