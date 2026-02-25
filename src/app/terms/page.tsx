import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Hot Tag',
  description: 'Terms of Service for the Hot Tag indie wrestling event platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-foreground-muted mb-8">Effective Date: February 7, 2025 &middot; Last Updated: February 25, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground-muted">
          <p>
            Welcome to Hot Tag LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). Hot Tag LLC is a web-based platform for discovering independent professional wrestling events, following wrestlers, and connecting with the indie wrestling community. By accessing or using our website at <a href="https://www.hottag.app" className="text-accent hover:underline">hottag.app</a> (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">1. Eligibility</h2>
          <p>
            You must be at least 13 years of age to use the Service. By using the Service, you represent and warrant that you meet this age requirement. If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">2. Accounts</h2>
          <p>
            To access certain features of the Service, you must create an account using Google OAuth or email and password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            You may not create an account using false information, impersonate another person or organization, or create multiple accounts for deceptive purposes. We reserve the right to suspend or terminate any account at our sole discretion, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">3. Profile Claims</h2>
          <p>
            Hot Tag allows wrestlers and wrestling promotions to claim and manage their profile pages on the platform. By claiming a profile, you represent and warrant that you are the person or an authorized representative of the organization associated with that profile. Claiming a profile under false pretenses is a violation of these Terms and may result in immediate account termination.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">4. User Content</h2>
          <p>
            The Service allows you to submit, post, and display content including but not limited to photos, biographical information, event details, and other materials (&ldquo;User Content&rdquo;). You retain ownership of your User Content. However, by posting User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, display, and distribute your User Content in connection with operating and promoting the Service.
          </p>
          <p>
            You represent and warrant that you own or have the necessary rights to all User Content you submit, and that your User Content does not infringe on the intellectual property rights, privacy rights, or any other rights of any third party.
          </p>
          <p>
            We reserve the right to remove any User Content at our sole discretion, for any reason, including content that we determine to be unlawful, offensive, harmful, or in violation of these Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">5. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding User Content), features, and functionality are owned by Hot Tag LLC and are protected by copyright, trademark, and other intellectual property laws. The Hot Tag name, logo, and all related names, logos, product and service names, designs, and slogans are our trademarks. You may not use these marks without our prior written permission.
          </p>
          <p>
            You may not copy, modify, distribute, sell, or lease any part of the Service, nor may you reverse engineer or attempt to extract the source code of the Service.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">6. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate any applicable local, state, national, or international law or regulation</li>
            <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
            <li>Upload or transmit viruses, malware, or any other malicious code</li>
            <li>Harass, abuse, threaten, or intimidate other users</li>
            <li>Collect or store personal data about other users without their consent</li>
            <li>Use the Service for any commercial solicitation purposes not approved by us</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
            <li>Scrape, crawl, or use automated means to access or collect data from the Service without our prior written consent</li>
            <li>Post false, misleading, or fraudulent event information</li>
            <li>Attempt to gain unauthorized access to any portion of the Service or any related systems</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground !mt-10">7. Event Information</h2>
          <p>
            Hot Tag aggregates and displays event information from wrestling promotions and other sources. While we strive to keep event information accurate and up to date, we do not guarantee the accuracy, completeness, or reliability of any event listing. Event details including dates, times, locations, ticket prices, and card announcements are subject to change by the event organizer at any time.
          </p>
          <p>
            We are not responsible for events that are cancelled, rescheduled, or altered in any way. We are not a ticket seller and are not responsible for any ticket purchases made through third-party links on our platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">8. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites or services that are not owned or controlled by Hot Tag, including ticket sellers, social media profiles, and streaming platforms. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by or in connection with use of any such third-party content, goods, or services.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">9. Service Availability</h2>
          <p>
            We strive to keep the Service available at all times, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, server issues, or circumstances beyond our control. We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL HOT TAG LLC, ITS MEMBERS, MANAGERS, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Hot Tag LLC, its members, managers, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">13. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Harris County, Texas.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">15. Changes to These Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time at our sole discretion. If we make material changes, we will provide notice by updating the &ldquo;Last Updated&rdquo; date at the top of these Terms and, where appropriate, through additional notice on the Service. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">16. DMCA / Copyright Infringement</h2>
          <p>
            If you believe that any content on the Service infringes upon your copyright, please send a written notice to the contact information below. Your notice must include: a description of the copyrighted work, the location of the allegedly infringing material on the Service, your contact information, a statement of good faith belief, and a statement under penalty of perjury that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.
          </p>

          <h2 className="text-xl font-semibold text-foreground !mt-10">17. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong className="text-foreground">Hot Tag LLC</strong><br />
            Email: <a href="mailto:legal@hottag.app" className="text-accent hover:underline">legal@hottag.app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
