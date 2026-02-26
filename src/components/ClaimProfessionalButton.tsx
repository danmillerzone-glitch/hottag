'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { submitProfessionalClaim, getExistingProfessionalClaim, redeemProfessionalClaimCode } from '@/lib/professional'
import { Shield, ShieldCheck, Clock, X, Loader2, Key } from 'lucide-react'

function AutoRedirect({ to, delay }: { to: string; delay: number }) {
  useEffect(() => {
    const timer = setTimeout(() => { window.location.href = to }, delay)
    return () => clearTimeout(timer)
  }, [to, delay])
  return null
}

interface ClaimProfessionalButtonProps {
  professionalId: string
  professionalName: string
  verificationStatus: string
}

export default function ClaimProfessionalButton({ 
  professionalId, 
  professionalName,
  verificationStatus 
}: ClaimProfessionalButtonProps) {
  const { user, refreshOnboarding } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [existingClaim, setExistingClaim] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'code' | 'request'>('code')

  // Form state
  const [contactName, setContactName] = useState('')
  const [roleTitle, setRingName] = useState('')
  const [proofDescription, setProofDescription] = useState('')
  const [websiteOrSocial, setWebsiteOrSocial] = useState('')
  const [claimCode, setClaimCode] = useState('')
  const [codeSuccess, setCodeSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    checkExistingClaim()
  }, [user, professionalId])

  const checkExistingClaim = async () => {
    setChecking(true)
    const claim = await getExistingProfessionalClaim(professionalId)
    setExistingClaim(claim)
    setChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await submitProfessionalClaim({
        professional_id: professionalId,
        contact_name: contactName,
        role_title: roleTitle || undefined,
        proof_description: proofDescription || undefined,
        website_or_social: websiteOrSocial || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      if (err?.code === '23505') {
        setError('You already have a pending claim for this professional.')
      } else {
        setError(err?.message || 'Failed to submit claim. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCodeRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimCode.trim()) return
    setLoading(true)
    setError('')

    try {
      const result = await redeemProfessionalClaimCode(claimCode.trim())
      if (result.success) {
        setCodeSuccess(true)
        await refreshOnboarding()
      } else {
        setError(result.error || 'Invalid claim code.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to redeem code.')
    } finally {
      setLoading(false)
    }
  }

  if (verificationStatus === 'verified') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-attending/10 text-attending text-sm font-medium">
        <ShieldCheck className="w-4 h-4" /> Verified
      </div>
    )
  }

  if (!checking && existingClaim?.status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-interested/10 text-interested text-sm font-medium">
        <Clock className="w-4 h-4" /> Claim Pending Review
      </div>
    )
  }

  if (!checking && existingClaim?.status === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-attending/10 text-attending text-sm font-medium">
        <ShieldCheck className="w-4 h-4" /> Your Profile
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => {
          if (!user) { window.location.href = '/signin'; return }
          setShowModal(true)
        }}
        className="btn btn-ghost text-sm gap-1.5"
      >
        <Shield className="w-4 h-4" /> Claim This Profile
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)} />
          
          <div className="relative w-full max-w-lg bg-background-secondary rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-display font-bold">Claim {professionalName}</h2>
                <p className="text-sm text-foreground-muted mt-1">Verify that you are this professional</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-background-tertiary transition-colors" disabled={loading}>
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {codeSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-attending/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-attending" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Page Claimed Successfully!</h3>
                <p className="text-foreground-muted mb-4">Redirecting to your crew dashboard...</p>
                <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto" />
                <AutoRedirect to="/dashboard/professional" delay={2000} />
              </div>
            ) : success ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-attending/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-attending" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Claim Submitted!</h3>
                <p className="text-foreground-muted mb-6">We'll review your claim and get back to you. This usually takes 1-2 business days.</p>
                <button onClick={() => { setShowModal(false); setSuccess(false) }} className="btn btn-primary">Got it</button>
              </div>
            ) : (
              <>
                <div className="flex border-b border-border">
                  <button onClick={() => { setTab('code'); setError('') }}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'code' ? 'text-accent border-b-2 border-accent' : 'text-foreground-muted hover:text-foreground'}`}>
                    <Key className="w-4 h-4" /> I Have a Code
                  </button>
                  <button onClick={() => { setTab('request'); setError('') }}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'request' ? 'text-accent border-b-2 border-accent' : 'text-foreground-muted hover:text-foreground'}`}>
                    <Shield className="w-4 h-4" /> Request Claim
                  </button>
                </div>

                {tab === 'code' ? (
                  <form onSubmit={handleCodeRedeem} className="p-6 space-y-4">
                    {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Claim Code <span className="text-red-400">*</span></label>
                      <input type="text" required value={claimCode} onChange={(e) => setClaimCode(e.target.value.toUpperCase())} placeholder="e.g. ABCD-1234-EFGH"
                        className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors font-mono text-center text-lg tracking-wider" />
                      <p className="text-xs text-foreground-muted mt-2">Enter the code provided by Hot Tag to instantly claim this profile.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1" disabled={loading}>Cancel</button>
                      <button type="submit" className="btn btn-primary flex-1" disabled={loading || !claimCode.trim()}>
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : <><Key className="w-4 h-4 mr-2" /> Redeem Code</>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Your Real Name <span className="text-red-400">*</span></label>
                      <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Smith"
                        className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Role/Title</label>
                      <input type="text" value={roleTitle} onChange={(e) => setRingName(e.target.value)} placeholder={professionalName}
                        className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Your Official Social Media Link</label>
                      <input type="url" value={websiteOrSocial} onChange={(e) => setWebsiteOrSocial(e.target.value)} placeholder="https://instagram.com/yourhandle"
                        className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">How Can You Verify Your Identity?</label>
                      <textarea value={proofDescription} onChange={(e) => setProofDescription(e.target.value)}
                        placeholder='E.g., "I can post a verification story on my Instagram @handle"'
                        rows={3} className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none" />
                      <p className="text-xs text-foreground-muted mt-1">We may reach out to verify your identity.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1" disabled={loading}>Cancel</button>
                      <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Shield className="w-4 h-4 mr-2" /> Submit Claim</>}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
