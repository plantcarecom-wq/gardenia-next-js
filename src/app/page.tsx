import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, Truck, Plus, Sparkles, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';
import '@/modules/users/infrastructure/user.model';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { auth } from '@/shared/lib/auth';
import { ProductCarousel } from '@/components/ui/product-carousel';
import { GardenerCard } from '@/components/ui/gardener-card';

const HOME_CATEGORY_LIMIT = 6;

async function getHomePageData() {
  try {
    await connectDB();
    const categories = await CategoryModel.find({ isActive: true }).limit(HOME_CATEGORY_LIMIT).lean();

    const categoriesWithProducts = await Promise.all(
      categories.map(async (cat: any) => {
        const products = await ProductModel.find({ categoryId: cat._id, isActive: true })
          .sort({ createdAt: -1 })
          .limit(6) // 6 products per slider to allow scrolling
          .lean();

        const resolvedProducts = await resolveProductImages(JSON.parse(JSON.stringify(products)));
        return {
          category: JSON.parse(JSON.stringify(cat)),
          products: resolvedProducts,
        };
      })
    );

    return categoriesWithProducts.filter(c => c.products.length > 0);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * "Recommended for You": for a logged-in customer with order history, pulls
 * more products from the categories they've already bought from (excluding
 * items already purchased). Falls back to featured/top-rated products for
 * guests or customers with no order history yet — the section always
 * renders something, it just isn't personalized in that case.
 */
async function getRecommendations(customerId?: string) {
  try {
    await connectDB();
    let excludeIds: string[] = [];

    if (customerId) {
      const orders = await OrderModel.find({ customerId }).sort({ createdAt: -1 }).limit(20).lean();
      const purchased = new Set<string>();
      orders.forEach((o: any) => o.items?.forEach((it: any) => purchased.add(String(it.productId))));
      excludeIds = Array.from(purchased);

      if (excludeIds.length > 0) {
        const purchasedProducts = await ProductModel.find({ _id: { $in: excludeIds } }, 'categoryId').lean();
        const categoryIds = [...new Set(purchasedProducts.map((p: any) => String(p.categoryId)))];

        if (categoryIds.length > 0) {
          const recs = await ProductModel.find({
            categoryId: { $in: categoryIds },
            isActive: true,
            _id: { $nin: excludeIds },
          })
            .sort({ ratingAverage: -1, createdAt: -1 })
            .limit(8)
            .lean();

          if (recs.length > 0) {
            return { products: await resolveProductImages(JSON.parse(JSON.stringify(recs))), personalized: true };
          }
        }
      }
    }

    const fallback = await ProductModel.find({ isActive: true, _id: { $nin: excludeIds } })
      .sort({ isFeatured: -1, ratingAverage: -1, createdAt: -1 })
      .limit(8)
      .lean();
    return { products: await resolveProductImages(JSON.parse(JSON.stringify(fallback))), personalized: false };
  } catch (error) {
    console.error(error);
    return { products: [], personalized: false };
  }
}

async function getRecommendedGardeners() {
  if (!isServicesModuleEnabled()) return [];
  try {
    await connectDB();
    const gardeners = await GardenerProfileModel.find({ verificationStatus: 'approved' })
      .populate('userId', 'name')
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(4)
      .lean();
    return JSON.parse(JSON.stringify(gardeners));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function HomePage() {
  const session = await auth();
  const customerId = session?.user?.id as string | undefined;

  const [categoriesData, recommendations, recommendedGardeners] = await Promise.all([
    getHomePageData(),
    getRecommendations(customerId),
    getRecommendedGardeners(),
  ]);
  const showServices = isServicesModuleEnabled();
  const currency = await getSiteCurrency();

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-emerald-500/30">
      {/* Hero Section - Centralized & Premium */}
      <section className="relative w-full py-20 md:py-28 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0 bg-black dark:bg-[#0a0a0a]">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] animate-float" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-800/20 blur-[120px] animate-float-delayed" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        </div>

        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center">
          <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 mr-2" /> Premium Plant Care & Marketplace
          </div>

          <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 max-w-4xl leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
            Elevate Your Space With <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Nature</span>
          </h1>

          <p className="max-w-[700px] text-base md:text-lg text-gray-400 font-medium mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
            Discover our expertly curated collection of premium plants, bespoke ceramics, and professional landscaping services. Delivered with precision and care.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
            <Link href="/products" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide text-base shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] hover:scale-105 transition-all">
                Explore Catalog
              </Button>
            </Link>
            {showServices && (
              <Link href="/services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 h-12 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-md font-bold tracking-wide text-base hover:scale-105 transition-all bg-transparent">
                  Book Experts
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Value Proposition - Formal & Minimalist */}
      <section className="w-full py-20 md:py-32 bg-background border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
            <div className="flex flex-col items-center space-y-6">
              <div className="p-5 bg-card border border-border rounded-2xl shadow-sm group hover:scale-110 transition-transform duration-500">
                <Leaf className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-3 text-foreground">Exquisite Selection</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Hand-picked, rare, and healthy plants sourced directly from elite growers.</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-6">
              <div className="p-5 bg-card border border-border rounded-2xl shadow-sm group hover:scale-110 transition-transform duration-500">
                <Truck className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-3 text-foreground">Secure Logistics</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Climate-controlled, specialized packaging ensures pristine arrivals.</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-6">
              <div className="p-5 bg-card border border-border rounded-2xl shadow-sm group hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-3 text-foreground">Botanical Expertise</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Lifetime advisory support from our team of certified botanists.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You — order-history based when logged in, else top-rated/featured */}
      {recommendations.products.length > 0 && (
        <section className="w-full py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-border/50 pb-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                  {recommendations.personalized ? 'Recommended for You' : 'Popular Picks'}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {recommendations.personalized
                    ? 'Based on what you’ve ordered before.'
                    : 'Top-rated and featured across the catalog.'}
                </p>
              </div>
            </div>
            <ProductCarousel products={recommendations.products} currency={currency} />
          </div>
        </section>
      )}

      {/* Recommended Gardeners */}
      {showServices && recommendedGardeners.length > 0 && (
        <section className="w-full py-16 md:py-20 bg-muted/20 border-t border-border/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-border/50 pb-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 justify-center md:justify-start">
                  <Sprout className="w-6 h-6 text-emerald-500" /> Recommended Gardeners
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Top-rated, verified Gardeners ready to help.</p>
              </div>
              <Link href="/services">
                <Button variant="ghost" className="rounded-full group hover:bg-emerald-500 hover:text-white transition-all font-semibold">
                  Browse All Services <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedGardeners.map((gardener: any) => (
                <GardenerCard key={gardener._id} gardener={gardener} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories & Product Sliders */}
      <section className="w-full py-16 md:py-20 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="text-center mb-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Curated Collections</h2>
            <p className="text-lg text-muted-foreground">Explore our finest offerings, categorized for your convenience.</p>
          </div>

          {categoriesData.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border w-full max-w-4xl shadow-sm">
              <p className="text-muted-foreground text-lg">Our catalog is currently being updated.</p>
            </div>
          ) : (
            <div className="w-full space-y-10">
              {categoriesData.map((data: any) => (
                <div key={data.category._id} className="flex flex-col w-full">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4 w-full gap-4 border-b border-border/50 pb-4">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-center md:text-left">
                      {data.category.name}
                    </h3>
                    <Link href={`/products?categoryId=${data.category._id}`}>
                      <Button variant="ghost" className="rounded-full group hover:bg-emerald-500 hover:text-white transition-all font-semibold">
                        View Complete Collection <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>

                  {/* Category Slider */}
                  <div className="w-full relative">
                    <ProductCarousel products={data.products} currency={currency} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 flex justify-center w-full">
            <Link href="/products">
              <Button size="lg" className="rounded-full px-12 h-14 bg-foreground hover:bg-emerald-600 text-background hover:text-white font-bold tracking-wide text-lg transition-all shadow-xl hover:shadow-emerald-500/25">
                Browse Full Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
