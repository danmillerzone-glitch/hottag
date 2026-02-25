import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Hot Tag',
  description: 'Privacy Policy for the Hot Tag indie wrestling event platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-foreground-muted mb-8">Effective Date: February 7, 2025 &middot; Last Updated: February 25, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground-muted">
          <p>
            Hot Tag LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website at <a href="https://www.hottag.app" className="text-accent hover:underline">hottag.app</a> (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">1. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-foreground !mt-6">1.1 Information You Provide</h3>
          <p>When you create an account, claim a profile, or interact with the Service, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Account Information:</strong> Email address, name, and profile photo (provided through Google OAuth or email registration)</li>
            <li><strong className="text-foreground">Profile Information:</strong> For wrestlers and promotions who claim profiles, biographical information, photos, social media handles, location, and other details you choose to provide</li>
            <li><strong className="text-foreground">User Activity:</strong> Events you mark as &ldquo;Going&rdquo; or &ldquo;Interested,&rdquo; wrestlers and promotions you follow, and page requests you submit</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground !mt-6">1.2 Information Collected Automatically</h3>
          <p>When you access the Service, we may automatically collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, and device type</li>
            <li><strong className="text-foreground">Usage Data:</strong> Pages visited, time spent on pages, and interactions with the Service</li>
            <li><strong className="text-foreground">Location Data:</strong> Approximate geographic location based on your IP address or, with your permission, more precise location data to show nearby events</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground !mt-10">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Create and manage your account</li>
            <li>Display personalized event recommendations based on your location and interests</li>
            <li>Enable wrestlers and promotions to manage their profiles and event listings</li>
            <li>Send you relevant notifications about events and platform updates (with your consent)</li>
            <li>Respond to your inquiries, comments, or requests</li>
            <li>Monitor and analyze usage trends to improve user experience</li>
            <li>Detect, prevent, and address technical issues and fraudulent or abusive activity</li>
            <li>Enforce our Terms of Service</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground !mt-10">3. How We Share Your Information</h2>
          <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Public Profile Information:</strong> If you claim a wrestler or promotion profile, the information you provide (bio, photos, social links, etc.) will be publicly visible on the Service</li>
            <li><strong className="text-foreground">Service Providers:</strong> We use third-party services to help us operate the Service, including Supabase (database and authentication), Vercel (hosting), and Google (OAuth authentication). These providers may have access to your information only to perform tasks on our behalf and are obligated not to disclose or use it for other purposes</li>
            <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency)</li>
            <li><strong className="text-foreground">Safety:</strong> We may disclose information when we believe it is necessary to investigate, prevent, or take action regarding potential violations of our Terms, suspected fraud, situations involving potential threats to the safety of any person, or as evidence in litigation</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground !mt-10">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Supabase, which provides enterprise-grade security including encryption at rest and in transit, row-level security policies, and regular backups. Authentication is handled through Supabase Auth with support for Google OAuth and email/password login.
          </p>
          <p>
            While we implement commercially reasonable security measures to protect your personal information, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee the absolute security of your data.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">5. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Access and Update:</strong> You can access and update your account information through your profile dashboard at any time</li>
            <li><strong className="text-foreground">Delete Your Account:</strong> You may request deletion of your account by contacting us at the email address below. We will delete your account and associated personal data within 30 days, except where we are required to retain it by law</li>
            <li><strong className="text-foreground">Opt Out:</strong> You may opt out of receiving promotional emails by following the unsubscribe instructions in those emails</li>
            <li><strong className="text-foreground">Location Data:</strong> You can disable location services through your browser or device settings</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground !mt-10">6. California Privacy Rights (CCPA)</h2>
          <p>
            If you are a California resident, you have the right to request disclosure of the categories and specific pieces of personal information we have collected about you, the categories of sources from which the information is collected, the business purpose for collecting the information, and the categories of third parties with whom the information is shared.
          </p>
          <p>
            You also have the right to request deletion of your personal information and to opt out of the sale of your personal information. As stated above, we do not sell your personal information.
          </p>
          <p>
            To exercise your rights under the CCPA, please contact us at the email address below. We will not discriminate against you for exercising any of your CCPA rights.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">7. Children&rsquo;s Privacy</h2>
          <p>
            The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information as quickly as possible. If you believe that we might have any information from a child under 13, please contact us at the email address below.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">8. Cookies and Tracking Technologies</h2>
          <p>
            The Service uses cookies and similar technologies to maintain your session, remember your preferences, and authenticate your identity. These are essential cookies required for the Service to function properly. We do not use advertising or tracking cookies. Our third-party service providers (Supabase, Vercel) may set their own cookies as necessary to provide their services.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">9. Third-Party Links</h2>
          <p>
            The Service contains links to third-party websites, including ticket sellers, social media profiles, streaming platforms, and wrestler merchandise stores. We are not responsible for the privacy practices of these third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">10. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you with the Service. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as maintaining event history records).
          </p>
          <p>
            Publicly posted information associated with claimed wrestler or promotion profiles may be retained as part of the platform&rsquo;s historical record, even after account deletion, unless you specifically request its removal.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by updating the &ldquo;Last Updated&rdquo; date at the top of this policy and, where appropriate, through additional notice on the Service. Your continued use of the Service after changes to the Privacy Policy constitutes your acceptance of those changes.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, or if you wish to exercise any of your privacy rights, please contact us at:
          </p>
          <p>
            <strong className="text-foreground">Hot Tag LLC</strong><br />
            Email: <a href="mailto:privacy@hottag.app" className="text-accent hover:underline">privacy@hottag.app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
