import { connectDB } from './db';
import { getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';
import { DEFAULT_KYC_REGION, KycRegion } from './kyc';

/** Reads the admin-configurable Gardener KYC region (settings key `kycRegion`), server-side only. */
export async function getSiteKycRegion(): Promise<KycRegion> {
  await connectDB();
  return getSiteSetting<KycRegion>('kycRegion', DEFAULT_KYC_REGION);
}
