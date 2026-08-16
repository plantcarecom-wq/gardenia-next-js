export const KYC_REGIONS = ['pakistan', 'europe'] as const;
export type KycRegion = (typeof KYC_REGIONS)[number];
export const DEFAULT_KYC_REGION: KycRegion = 'pakistan';

export const KYC_REGION_LABELS: Record<KycRegion, string> = {
  pakistan: 'Pakistan (CNIC)',
  europe: 'Europe (National ID / Passport)',
};
