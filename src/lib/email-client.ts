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
    console.log('[Email] Sending claim email:', data)
    const res = await fetch('/api/send-claim-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      console.error('[Email] API error:', res.status, json)
    } else {
      console.log('[Email] Sent successfully:', json)
    }
  } catch (err) {
    console.error('[Email] Fetch failed:', err)
  }
}
