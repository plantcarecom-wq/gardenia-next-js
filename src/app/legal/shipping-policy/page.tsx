import { formatDate } from '@/shared/lib/date';
export const metadata = { title: 'Shipping & Delivery Policy' };

export default function ShippingPolicyPage() {
  return (
    <article className="prose prose-emerald dark:prose-invert max-w-none">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Shipping & Delivery Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {formatDate(new Date())}</p>

      <div className="space-y-8 text-gray-700 dark:text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">1. Delivery Areas</h2>
          <p>We currently deliver across major cities in Pakistan. Serviceable areas may expand over time — if your city isn&apos;t listed as an option at checkout, it isn&apos;t yet covered.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">2. Delivery Fee</h2>
          <p>A delivery fee is calculated at checkout and shown in your order summary before you confirm. This fee is set by us and may vary based on business needs (for example, a flat rate or a minimum order threshold for free delivery).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">3. Estimated Delivery Time</h2>
          <p>Most orders are delivered within 2–5 business days of confirmation, depending on your location and product availability. Delivery times may be longer during peak seasons (such as major sales) or due to weather conditions that could harm live plants in transit.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">4. Order Tracking</h2>
          <p>You can track your order&apos;s status in real time from your dashboard under <em>My Orders</em>, which shows a live status timeline from confirmation through to delivery.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">5. Packaging</h2>
          <p>Live plants are packaged with extra care — secured soil, breathable wrapping, and protective outer packaging — to minimize stress and damage during transit. Pots, tools, and other non-perishable items are packed to prevent breakage.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">6. Failed Delivery Attempts</h2>
          <p>Since orders are paid via Cash on Delivery, please ensure someone is available at the delivery address to receive and pay for the order. If a delivery attempt fails, our courier partner will typically attempt redelivery or contact you to reschedule. Orders that repeatedly fail delivery may be cancelled and returned to inventory.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">7. Contact</h2>
          <p>For delivery questions on an active order, please reach out via the contact details in the site footer with your order number.</p>
        </section>
      </div>
    </article>
  );
}
