import { PaymentProvider } from '../domain/payment-provider.interface';
import { CodProvider } from './cod.provider';

const providers: Record<string, PaymentProvider> = {
  cod: new CodProvider(),
};

/**
 * Returns the PaymentProvider for the given key, or undefined if the key
 * isn't recognized — callers are expected to turn that into a clean 4xx
 * rather than have an unknown method surface as an uncaught exception.
 */
export function getPaymentProvider(key: string): PaymentProvider | undefined {
  return providers[key];
}
