import { formatDate } from '@/shared/lib/date';
export const metadata = { title: 'Gardener Agreement' };

export default function GardenerAgreementPage() {
  return (
    <article className="prose prose-emerald dark:prose-invert max-w-none">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Gardener Agreement</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {formatDate(new Date())}</p>

      <p className="text-gray-700 dark:text-muted-foreground leading-relaxed mb-8">
        This Gardener Agreement applies to anyone who registers as a Gardener (gardening service provider) on the platform, in addition to our general <a href="/legal/terms">Terms & Conditions</a>.
      </p>

      <div className="space-y-8 text-gray-700 dark:text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">1. Independent Contractor Status</h2>
          <p>Gardeners are independent service providers, not employees, agents, or partners of the platform. You are responsible for your own tools, transport, taxes, and any licenses or permits required to legally offer your services.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">2. Verification</h2>
          <p>New Gardener accounts start in <strong>pending</strong> status and must be reviewed and approved by our team before you can list services or receive requests. We may request identity or experience verification documents as part of this process, and may reject or later suspend accounts that fail to meet our standards or provide false information.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">3. Listing Services</h2>
          <p>You are responsible for the accuracy of your service listings — pricing, description, and service areas. Listings must not be misleading and must comply with our general Terms & Conditions.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">4. Accepting & Completing Requests</h2>
          <p>When a request is assigned to you, you&apos;re expected to respond (accept or decline) within the platform&apos;s configured response window. Repeatedly ignoring assigned requests may affect your standing on the platform and can result in automatic reassignment. Once accepted, you&apos;re expected to complete the work to a professional standard and update the request status as work progresses.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">5. Commission & Subscription</h2>
          <p>The platform charges a commission on completed service jobs, calculated as a percentage set in our platform settings. Gardeners who subscribe to a paid package may receive a reduced commission rate and other perks, as described on the subscription packages page. Commission is calculated and recorded at the time a job is marked complete, based on the rate in effect for your account at that moment.</p>
          <p>In the current version of the platform, commission is settled offline — we&apos;ll contact you separately regarding payment of amounts owed, and your account&apos;s commission ledger reflects what&apos;s pending versus settled.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">6. Platform Purchases</h2>
          <p>Verified Gardeners may receive a discount when purchasing products (e.g. fertilizer, tools) from our catalog under their own account, at a rate set in our platform settings and applied automatically at checkout.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">7. Conduct & Liability</h2>
          <p>You must conduct yourself professionally with customers, respect their property, and follow reasonable safety practices while performing on-site work. You are responsible for any damage you cause while performing a service. We may suspend or remove Gardeners for unprofessional conduct, safety violations, or customer complaints substantiated after review.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">8. Reviews</h2>
          <p>Customers may leave a public rating and review after a completed service. Reviews contribute to your public profile rating shown to prospective customers.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">9. Termination</h2>
          <p>You may stop offering services at any time by deactivating your listings. We may suspend or terminate your Gardener account for violations of this Agreement, unresolved commission balances, or conduct that harms the platform&apos;s trust and safety.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">10. Contact</h2>
          <p>Questions about this Agreement, verification, or commission can be sent to our support team via the contact details in the site footer.</p>
        </section>
      </div>
    </article>
  );
}
