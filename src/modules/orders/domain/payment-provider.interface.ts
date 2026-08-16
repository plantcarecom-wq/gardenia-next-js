/**
 * PaymentProvider interface — abstracts payment method logic.
 * Phase 4 ships with COD; future providers (Stripe, etc.) implement the same interface.
 */
export interface PaymentProvider {
  /** Unique provider key, e.g. 'cod', 'stripe' */
  readonly key: string;

  /** Human-readable label */
  readonly label: string;

  /**
   * Validate that the payment can proceed (e.g. check card token, verify COD eligibility).
   * Returns true if valid, or throws with an error message.
   */
  validate(context: PaymentContext): Promise<boolean>;

  /**
   * Process the payment. For COD this is a no-op that returns a pending status.
   * For gateway providers this would create a charge/intent.
   */
  process(context: PaymentContext): Promise<PaymentResult>;
}

export interface PaymentContext {
  orderId: string;
  totalAmount: number;
  currency: string;
  customerId: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}
