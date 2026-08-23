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

import { AnimatedSlider } from '@/components/ui/animated-slider';

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
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-emerald-800/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 py-12 relative z-10">
        <Link href="/services" className="inline-flex items-center text-sm text-gray-400 hover:text-emerald-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="w-full lg:col-span-6">
            <div className="sticky top-24">
              <AnimatedSlider images={offering.images || []} />
            </div>
          </div>

          {/* Service Info */}
          <div className="flex flex-col lg:col-span-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {category?.name && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  {category.name}
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-4 leading-[1.1] drop-shadow-2xl">
              {offering.title}
            </h1>

            {gardener?.name && (
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                <span className="font-medium">by {gardener.name}</span>
                {gardenerProfile && gardenerProfile.ratingCount > 0 && (
                  <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {gardenerProfile.ratingAverage.toFixed(1)} ({gardenerProfile.ratingCount})
                  </span>
                )}
              </div>
            )}

            <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 mb-8 drop-shadow-sm flex items-baseline">
              {formatPrice(offering.price, currency)}
              <span className="text-lg font-bold text-gray-500 ml-2">{priceSuffix(offering.priceType)}</span>
            </div>

            <p className="text-gray-400 leading-relaxed font-light mb-8 line-clamp-3">
              {offering.description}
            </p>

            {/* Glassmorphic Request Service Section */}
            <div className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <RequestServiceButton categoryId={category._id} gardenerId={gardener._id} />
            </div>

            {/* About & Value Props */}
            {gardenerProfile?.bio && (
              <div className="mb-10 p-6 rounded-3xl bg-black/40 border border-white/5">
                <h4 className="font-bold text-lg mb-3 text-gray-300">About the Gardener</h4>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{gardenerProfile.bio}</p>
                {gardenerProfile.experienceYears > 0 && (
                  <p className="text-xs text-emerald-400 font-medium">{gardenerProfile.experienceYears} years of professional experience</p>
                )}
              </div>
            )}

            {offering.serviceAreaCities && offering.serviceAreaCities.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MapPin className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-200 tracking-wide">Service Areas</h4>
                    <p className="text-xs text-gray-500 mt-1">{offering.serviceAreaCities.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-200 tracking-wide">Verified Professional</h4>
                    <p className="text-xs text-gray-500 mt-1">Identity & documents verified.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-white/10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Description</h2>
          <div className="prose prose-lg prose-invert max-w-none text-gray-400 leading-relaxed font-light">
            <p>{offering.description}</p>
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-white/10">
          <ReviewsSection targetType="GARDENER" targetId={gardener._id} subjectLabel="Gardener" />
        </div>
      </div>
    </div>
  );
}
