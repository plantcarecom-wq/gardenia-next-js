import { formatDate } from '@/shared/lib/date';
export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <article className="prose prose-emerald dark:prose-invert max-w-none">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {formatDate(new Date())}</p>

      <div className="space-y-8 text-gray-700 dark:text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">1. Information We Collect</h2>
          <p>When you register, place an order, request a gardening service, or contact support, we collect information such as your name, email address, phone number, delivery address, and order history. If you register as a Gardener, we also collect your bio, service areas, experience, and verification documents.</p>
          <p>We automatically collect limited technical information (such as browser type and general usage patterns) to keep the platform secure and improve performance.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and deliver your orders or service requests</li>
            <li>To communicate order status, account, and security updates (in-app notifications and, where configured, email)</li>
            <li>To verify Gardener applications and maintain trust and safety on the platform</li>
            <li>To respond to support requests</li>
            <li>To improve our catalog, services, and platform based on aggregate usage patterns</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">3. How We Store Your Information</h2>
          <p>Your account and order data is stored in a secured MongoDB Atlas database. Passwords are never stored in plain text — they are hashed before storage. Uploaded images (product photos, Gardener verification documents, etc.) are stored with our media provider (Cloudinary) rather than in our database directly.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">4. Third Parties</h2>
          <p>We share data only with service providers necessary to operate the platform — for example, our media storage provider for uploaded images, and (when configured) our email provider for transactional emails such as order confirmations and password resets. These providers are only permitted to use your data to provide the relevant service to us.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">5. Cookies</h2>
          <p>We use essential cookies to keep you logged in and to remember your session. We do not use third-party advertising trackers.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">6. Data Retention</h2>
          <p>We retain your account and order data for as long as your account is active or as needed to comply with legal obligations. In-app notifications are automatically purged after a configurable retention period once read.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">7. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal information by contacting support. Note that we may need to retain certain order records for legal, accounting, or fraud-prevention purposes even after a deletion request.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">8. Children&apos;s Privacy</h2>
          <p>This platform is not directed at children under 18. We do not knowingly collect personal information from minors.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. Material changes will be reflected by updating the &quot;Last updated&quot; date above.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">10. Contact</h2>
          <p>For privacy-related questions or requests, please reach out via the contact details in the site footer.</p>
        </section>
      </div>
    </article>
  );
}
