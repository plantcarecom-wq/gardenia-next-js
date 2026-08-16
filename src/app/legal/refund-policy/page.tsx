import { formatDate } from '@/shared/lib/date';
export const metadata = { title: 'Refund & Cancellation Policy' };

export default function RefundPolicyPage() {
  return (
    <article className="prose prose-emerald dark:prose-invert max-w-none">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Refund & Cancellation Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {formatDate(new Date())}</p>

      <div className="space-y-8 text-gray-700 dark:text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">1. Order Cancellation</h2>
          <p>You may cancel an order free of charge while it is still in <strong>Pending</strong> or <strong>Confirmed</strong> status, before it has been packed for delivery. Once an order has moved to <strong>Shipped</strong> or <strong>Out for Delivery</strong>, it can no longer be cancelled — you may instead refuse delivery or follow the return process below.</p>
          <p>To cancel an eligible order, contact support with your order number as soon as possible.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">2. Live Plants — Dead-on-Arrival & Damage</h2>
          <p>Plants are living products and can be sensitive to transit. If a plant arrives dead, severely wilted, or visibly damaged in a way that isn&apos;t due to normal handling, we will offer a free replacement or a full refund of that item.</p>
          <p><strong>You must report this within 24 hours of delivery</strong>, including clear photos of the plant and its packaging, sent to support with your order number. Claims made after this window, or without photo evidence, generally cannot be honored, since it becomes difficult to distinguish transit damage from later care issues.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">3. Wrong or Incorrect Items</h2>
          <p>If you receive a different product than what you ordered, contact support within 48 hours of delivery with photos of the item received. We will arrange a replacement or refund at no extra cost, including pickup of the incorrect item where applicable.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">4. Non-Returnable Items</h2>
          <p>Because of their perishable and living nature, healthy plants that simply didn&apos;t meet personal preference (rather than arriving damaged or incorrect) are not eligible for return. Fertilizers, soil, and other opened consumables are also non-returnable once opened, for hygiene and quality reasons.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">5. Refund Method & Timeline</h2>
          <p>As orders are currently paid via Cash on Delivery, an approved refund for an order that has already been paid for is issued as a direct bank transfer or mobile wallet transfer to you, processed within 5–7 business days of approval. If an order is cancelled before delivery, no payment has been collected, so there is nothing to refund.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">6. Gardening Service Cancellations</h2>
          <p>Where the gardening services marketplace is available, a service request may be cancelled by the customer any time before the assigned Gardener marks it <strong>In Progress</strong>. Once work has begun, cancellation is subject to the Gardener&apos;s discretion regarding any work already completed. Disputes over service-related cancellations can be escalated to our support team for mediation.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">7. Contact</h2>
          <p>For any cancellation, return, or refund request, please reach out via the contact details in the site footer with your order number.</p>
        </section>
      </div>
    </article>
  );
}
