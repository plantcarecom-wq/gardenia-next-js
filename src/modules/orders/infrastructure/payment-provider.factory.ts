import { PaymentProvider } from '../domain/payment-provider.interface';
import { CodProvider } from './cod.provider';

const providers: Record<string, PaymentProvider> = {
  cod: new CodProvider(),
};

/**
 * Returns the PaymentProvider for the given key.
 * Throws if the key is not recognized.
 */
export function getPaymentProvider(key: string): PaymentProvider {
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Unknown payment provider: "${key}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}
