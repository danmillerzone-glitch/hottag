// Client-safe email helper — no server dependencies
// Used by client components to trigger emails via API route

interface ClaimAccessEmailData {
  recipientEmail: string
  recipientName: string
  pageName: string
  pageType: 'wrestler' | 'promoter' | 'crew'
  pageSlug: string
}

export async function sendClaimAccessEmailFromClient(data: ClaimAccessEmailData) {
  try {
    await fetch('/api/send-claim-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Fire-and-forget — don't block the UI on email failure
    console.error('Email notification failed:', err)
  }
}
