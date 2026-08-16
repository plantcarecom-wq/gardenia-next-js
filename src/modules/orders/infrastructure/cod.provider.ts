import { PaymentProvider, PaymentContext, PaymentResult } from '../domain/payment-provider.interface';

/**
 * Cash-on-Delivery payment provider.
 * Validation always passes (COD has no pre-payment requirements).
 * Processing is a no-op that marks the payment as pending until delivery.
 */
export class CodProvider implements PaymentProvider {
  readonly key = 'cod';
  readonly label = 'Cash on Delivery';

  async validate(_context: PaymentContext): Promise<boolean> {
    // COD is always valid — no upfront payment required
    return true;
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    // COD processing is a no-op; payment happens at delivery
    return {
      success: true,
      transactionId: `COD-${context.orderId}`,
      status: 'pending',
      message: 'Cash on Delivery — payment will be collected at delivery.',
    };
  }
}
