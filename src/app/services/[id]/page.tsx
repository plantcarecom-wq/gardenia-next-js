import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Leaf, ShieldCheck, MapPin, Star, ArrowLeft } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { ServiceOfferingModel } from '@/modules/services/infrastructure/service-offering.model';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';
import { isValidId } from '@/shared/schemas/id.schema';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { ReviewsSection } from '@/components/reviews/reviews-section';
import { RequestServiceButton } from './request-service-button';

type PopulatedRef = { _id: string; name?: string };

export const dynamic = 'force-dynamic';

function priceSuffix(priceType: string) {
  if (priceType === 'hourly') return '/hr';
  if (priceType === 'variable') return '+';
  return '';
}

type PopulatedOffering = {
  _id: string;
  title: string;
  description: string;
  priceType: 'fixed' | 'hourly' | 'variable';
  price: number;
  imageMediaIds?: string[];
  serviceAreaCities?: string[];
  categoryId: PopulatedRef;
  gardenerId: PopulatedRef;
};

async function getOffering(id: string) {
  if (!isValidId(id)) return null;
  await connectDB();
  const doc = await ServiceOfferingModel.findOne({ _id: id, isActive: true })
    .populate([
      { path: 'categoryId', select: 'name' },
      { path: 'gardenerId', select: 'name' },
    ])
    .lean();
  if (!doc) return null;
  const offering = doc as unknown as PopulatedOffering;

  const gardenerProfile = await GardenerProfileModel.findOne({ userId: offering.gardenerId._id }).lean();
  const [resolved] = await resolveProductImages([JSON.parse(JSON.stringify(offering))]);

  return { offering: resolved, gardenerProfile: gardenerProfile ? JSON.parse(JSON.stringify(gardenerProfile)) : null };
}

export default async function ServiceOfferingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isServicesModuleEnabled()) {
    notFound();
  }

  const { id } = await params;
  const result = await getOffering(id);
  const currency = await getSiteCurrency();

  if (!result) {
    notFound();
  }

  const { offering, gardenerProfile } = result;
  const gardener = offering.gardenerId as unknown as PopulatedRef;
  const category = offering.categoryId as unknown as PopulatedRef;

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Link href="/services" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-gray-50 dark:bg-muted rounded-2xl overflow-hidden border border-gray-100 dark:border-border flex items-center justify-center relative">
              {offering.images && offering.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offering.images[0]} alt={offering.title} className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 space-y-4">
                  <Leaf className="w-24 h-24 opacity-20" />
                  <span className="text-sm uppercase tracking-widest font-medium">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              {category?.name && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1">
                  {category.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-foreground mb-2">
              {offering.title}
            </h1>

            {gardener?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>by {gardener.name}</span>
                {gardenerProfile && gardenerProfile.ratingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {gardenerProfile.ratingAverage.toFixed(1)} ({gardenerProfile.ratingCount})
                  </span>
                )}
              </div>
            )}

            <div className="text-3xl font-bold text-emerald-600 mb-6">
              {formatPrice(offering.price, currency)}
              <span className="text-base font-normal text-muted-foreground">{priceSuffix(offering.priceType)}</span>
            </div>

            <div className="prose prose-emerald dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-muted-foreground">
              <p>{offering.description}</p>
            </div>

            {gardenerProfile?.bio && (
              <div className="mb-8 bg-gray-50 dark:bg-muted/40 rounded-2xl p-6 border border-gray-100 dark:border-border">
                <h4 className="font-semibold text-sm mb-2">About the Gardener</h4>
                <p className="text-sm text-muted-foreground">{gardenerProfile.bio}</p>
                {gardenerProfile.experienceYears > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">{gardenerProfile.experienceYears} years of experience</p>
                )}
              </div>
            )}

            <div className="h-px bg-gray-100 dark:bg-border w-full mb-8" />

            <RequestServiceButton
              categoryId={category._id}
              gardenerId={gardener._id}
            />

            {offering.serviceAreaCities && offering.serviceAreaCities.length > 0 && (
              <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-muted/40 rounded-2xl p-6 border border-gray-100 dark:border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Service Areas</h4>
                    <p className="text-xs text-muted-foreground">{offering.serviceAreaCities.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Verified Gardener</h4>
                    <p className="text-xs text-muted-foreground">Identity and documents reviewed by our team.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ReviewsSection targetType="GARDENER" targetId={gardener._id} subjectLabel="Gardener" />
      </div>
    </div>
  );
}
