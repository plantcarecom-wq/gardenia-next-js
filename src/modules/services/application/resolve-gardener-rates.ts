import { GardenerSubscriptionModel, SubscriptionPackageModel } from '@/modules/services/infrastructure/subscription.model';
import { getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';

const DEFAULT_COMMISSION_PERCENT = 10;
const DEFAULT_ITEM_DISCOUNT_PERCENT = 0;

async function findActivePackage(gardenerId: string) {
  const subscription = await GardenerSubscriptionModel.findOne({ gardenerId, status: 'active' }).lean();
  if (!subscription) return null;
  return SubscriptionPackageModel.findById(subscription.packageId).lean();
}

/**
 * Resolves the commission rate a gardener owes on a completed service job:
 * their active subscription package's rate if one exists, else the site-wide
 * default. Called once at completion time and snapshotted onto the request
 * (never re-resolved later), per requirements.md §5.11.
 */
export async function resolveGardenerCommissionRate(gardenerId: string): Promise<number> {
  const pkg = await findActivePackage(gardenerId);
  if (pkg) return pkg.commissionPercent;
  return getSiteSetting('defaultServiceCommissionPercent', DEFAULT_COMMISSION_PERCENT);
}

/**
 * Resolves the discount a gardener gets on their own product purchases:
 * their active subscription package's rate (replaces, not stacks with, the
 * baseline) if one exists, else the site-wide default baseline.
 */
export async function resolveGardenerItemDiscount(gardenerId: string): Promise<number> {
  const pkg = await findActivePackage(gardenerId);
  if (pkg) return pkg.platformItemDiscountPercent;
  return getSiteSetting('defaultGardenerItemDiscountPercent', DEFAULT_ITEM_DISCOUNT_PERCENT);
}
