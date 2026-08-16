import { formatDate } from '@/shared/lib/date';
export const metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <article className="prose prose-emerald dark:prose-invert max-w-none">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {formatDate(new Date())}</p>

      <div className="space-y-8 text-gray-700 dark:text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By creating an account, browsing our catalog, placing an order, or using any part of this platform, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">2. Accounts</h2>
          <p>You must provide accurate information when registering and keep your login credentials confidential. You are responsible for all activity that occurs under your account. We may suspend or terminate accounts that violate these terms, provide false information, or are used for fraudulent activity.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">3. Orders & Pricing</h2>
          <p>All prices are listed in Pakistani Rupees (PKR) and are subject to change without prior notice. Placing an order is an offer to purchase, which we may accept or decline (for example, if a product is out of stock or priced incorrectly due to an error). An order is confirmed once we send a confirmation notification and it enters processing.</p>
          <p>Product photos are representative — as living plants vary naturally in size, leaf count, and appearance, the exact plant you receive may differ slightly from the photo while matching the same species and general condition described.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">4. Payment</h2>
          <p>Orders are currently fulfilled via Cash on Delivery (COD) only. Payment is collected in full at the time of delivery. Please have the exact order total ready for our delivery partner.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">5. Gardening Services (where available)</h2>
          <p>Where enabled, the platform also connects customers with independent Gardeners for gardening services. Gardeners are independent service providers, not our employees. We facilitate the connection and, where applicable, mediate disputes, but the service itself is performed by the Gardener under the terms of our <a href="/legal/gardener-agreement">Gardener Agreement</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">6. Reviews & Conduct</h2>
          <p>Reviews must reflect a genuine experience with a delivered product or completed service. We reserve the right to remove reviews that are abusive, fraudulent, or otherwise violate these terms, and to suspend accounts that repeatedly submit such content.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">7. Intellectual Property</h2>
          <p>All content on this platform — including text, images, logos, and design — is owned by us or our licensors and may not be reproduced or used commercially without permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">8. Limitation of Liability</h2>
          <p>We strive to deliver healthy, well-packaged plants and reliable service, but we are not liable for indirect or consequential losses arising from use of the platform, delays outside our reasonable control, or the natural variability of living plants. Our total liability for any claim is limited to the amount paid for the relevant order.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">9. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">10. Governing Law</h2>
          <p>These Terms are governed by the laws of Pakistan. Any disputes will be subject to the exclusive jurisdiction of the courts of Pakistan.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">11. Contact</h2>
          <p>Questions about these Terms can be sent to our support team via the contact details in the site footer.</p>
        </section>
      </div>
    </article>
  );
}
