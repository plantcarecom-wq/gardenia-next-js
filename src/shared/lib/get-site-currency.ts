import { connectDB } from './db';
import { getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';
import { DEFAULT_CURRENCY } from './format-price';

/** Reads the admin-configurable base currency (settings key `baseCurrency`), server-side only. */
export async function getSiteCurrency(): Promise<string> {
  await connectDB();
  return getSiteSetting('baseCurrency', DEFAULT_CURRENCY);
}
