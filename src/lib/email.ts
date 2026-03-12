import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hottag.app'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Hot Tag <onboarding@resend.dev>'

type PageType = 'wrestler' | 'promoter' | 'crew'

const DASHBOARD_PATHS: Record<PageType, string> = {
  wrestler: '/dashboard/wrestler',
  promoter: '/dashboard',
  crew: '/dashboard/professional',
}

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  wrestler: 'wrestler',
  promoter: 'promotion',
  crew: 'crew',
}

const PUBLIC_PAGE_PATHS: Record<PageType, string> = {
  wrestler: '/wrestlers',
  promoter: '/promotions',
  crew: '/crew',
}

interface ClaimAccessEmailData {
  recipientEmail: string
  recipientName: string
  pageName: string
  pageType: PageType
  pageSlug: string
}

export async function sendClaimAccessEmail(data: ClaimAccessEmailData) {
  const { recipientEmail, recipientName, pageName, pageType, pageSlug } = data

  const dashboardUrl = `${APP_URL}${DASHBOARD_PATHS[pageType]}`
  const publicPageUrl = `${APP_URL}${PUBLIC_PAGE_PATHS[pageType]}/${pageSlug}`
  const label = PAGE_TYPE_LABELS[pageType]

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `You now have access to ${pageName} on Hot Tag`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#14181c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#14181c;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#1c2228;border-radius:16px;border:1px solid #2d333b;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background-color:#ff6b35;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Hot Tag</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#e6edf3;font-size:16px;margin:0 0 8px;">Hey${recipientName ? ` ${recipientName}` : ''},</p>
          <p style="color:#e6edf3;font-size:16px;margin:0 0 24px;">
            You now have full access to the <strong style="color:#ff6b35;">${pageName}</strong> ${label} page on Hot Tag.
          </p>

          <!-- Dashboard CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${dashboardUrl}" style="display:inline-block;background-color:#ff6b35;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Go to Your Dashboard
              </a>
            </td></tr>
          </table>

          <!-- Instructions -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2a3038;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="color:#8b949e;font-size:13px;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What you can do now</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr><td style="color:#e6edf3;font-size:14px;padding:4px 0;">
                  ${pageType === 'wrestler' ? '&#x2022; Update your bio, stats, and signature moves' : pageType === 'promoter' ? '&#x2022; Create and manage your events' : '&#x2022; Update your bio and portfolio'}
                </td></tr>
                <tr><td style="color:#e6edf3;font-size:14px;padding:4px 0;">
                  ${pageType === 'wrestler' ? '&#x2022; Upload photos and choose your page theme' : pageType === 'promoter' ? '&#x2022; Manage your roster and championships' : '&#x2022; Add your roles and social links'}
                </td></tr>
                <tr><td style="color:#e6edf3;font-size:14px;padding:4px 0;">
                  ${pageType === 'wrestler' ? '&#x2022; Add videos, merch, and social links' : pageType === 'promoter' ? '&#x2022; Upload posters and add streaming links' : '&#x2022; Upload videos and merch items'}
                </td></tr>
              </table>
            </td></tr>
          </table>

          <p style="color:#8b949e;font-size:14px;margin:0 0 4px;">Your public page:</p>
          <a href="${publicPageUrl}" style="color:#ff6b35;font-size:14px;text-decoration:none;">${publicPageUrl}</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #2d333b;">
          <p style="color:#8b949e;font-size:12px;margin:0;text-align:center;">
            &copy; ${new Date().getFullYear()} Hot Tag LLC &middot; <a href="${APP_URL}" style="color:#8b949e;text-decoration:none;">hottag.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) {
    console.error('Failed to send claim access email:', error)
    throw error
  }
}
