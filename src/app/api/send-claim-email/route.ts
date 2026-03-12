import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendClaimAccessEmail } from '@/lib/email'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { recipientEmail, recipientName, pageName, pageType, pageSlug } = body

    if (!recipientEmail || !pageName || !pageType || !pageSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['wrestler', 'promoter', 'crew'].includes(pageType)) {
      return NextResponse.json({ error: 'Invalid pageType' }, { status: 400 })
    }

    await sendClaimAccessEmail({
      recipientEmail,
      recipientName: recipientName || '',
      pageName,
      pageType,
      pageSlug,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Send claim email error:', err)
    return NextResponse.json({
      error: 'Failed to send email',
      detail: err?.message || String(err),
    }, { status: 500 })
  }
}
