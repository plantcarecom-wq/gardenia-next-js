import Link from 'next/link';
import { Leaf, Filter, ChevronRight, MapPin } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { ProductFilters } from './product-filters';
import { ProductCard } from '@/components/ui/product-card';
import { Container } from '@/shared/components/Container';
import { LocationAutoDetect } from '@/components/location/location-auto-detect';

export const dynamic = 'force-dynamic';

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAverage: -1 },
  newest: { createdAt: -1 },
};

import { cookies } from 'next/headers';

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  await connectDB();
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const categoryId = typeof searchParams.categoryId === 'string' ? searchParams.categoryId : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' && searchParams.minPrice !== '' ? Number(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' && searchParams.maxPrice !== '' ? Number(searchParams.maxPrice) : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';

  const filter: any = { isActive: true };
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (categoryId) filter.categoryId = categoryId;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && !Number.isNaN(minPrice)) filter.price.$gte = minPrice;
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  const cookieStore = await cookies();
  const userLocationCookie = cookieStore.get('user-location')?.value;
  const userRegionCookie = cookieStore.get('user-region')?.value;

  if (userLocationCookie) {
    try {
      const loc = JSON.parse(userLocationCookie);
      if (loc.lat && loc.lng) {
        filter.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [loc.lng, loc.lat]
            },
            $maxDistance: 50000 // 50km radius
          }
        };
      }
    } catch (e) {}
  } else if (userRegionCookie) {
    filter.region = userRegionCookie;
  }

  // $near sorts by distance automatically, so skip the manual sort while it's
  // active. $near is also a hard filter — it excludes any product with no
  // `location` set at all, which most of the catalog currently has. Rather
  // than showing "No products found" whenever nothing happens to be within
  // range, fall back to the unfiltered (or region-filtered) result set so
  // "near me" is a preference, not a wall.
  let locationApplied = false;

  if (filter.location) {
    const nearby = await ProductModel.find(filter).lean();
    if (nearby.length > 0) {
      locationApplied = true;
      return {
        products: await resolveProductImages(JSON.parse(JSON.stringify(nearby))),
        locationApplied,
      };
    }
    delete filter.location;
  }

  let productsQuery = ProductModel.find(filter).sort(SORT_MAP[sort] || SORT_MAP.newest);
  const products = await productsQuery.lean();

  // A region filter can just as easily match nothing (typo'd/unset region on
  // the catalog) — same fallback logic applies.
  if (filter.region && products.length === 0) {
    delete filter.region;
    const fallback = await ProductModel.find(filter).sort(SORT_MAP[sort] || SORT_MAP.newest).lean();
    return {
      products: await resolveProductImages(JSON.parse(JSON.stringify(fallback))),
      locationApplied: false,
    };
  }

  return {
    products: await resolveProductImages(JSON.parse(JSON.stringify(products))),
    locationApplied: locationApplied || Boolean(filter.region),
  };
}

async function getCategories() {
  await connectDB();
  const categories = await CategoryModel.find({ isActive: true }).lean();
  return JSON.parse(JSON.stringify(categories));
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { products, locationApplied } = await getProducts(params);
  const categories = await getCategories();
  const currency = await getSiteCurrency();
  const activeCategoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <LocationAutoDetect />
      <div className="bg-background border-b border-border py-16 md:py-24 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black dark:bg-[#0a0a0a] z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        </div>
        <Container size="wide" className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-white bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">Our Catalog</h1>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl">Browse our extensive collection of premium plants, pots, and accessories to bring your space to life.</p>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-card p-5 rounded-xl border border-gray-100 dark:border-border shadow-sm">
                <h3 className="font-semibold text-lg flex items-center mb-4">
                  <Filter className="w-4 h-4 mr-2" /> Categories
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/products"
                    className={`block text-sm transition-colors ${
                      !activeCategoryId
                        ? 'font-semibold text-emerald-600'
                        : 'text-muted-foreground hover:text-emerald-600'
                    }`}
                  >
                    All Products
                  </Link>
                  {categories.map((c: any) => (
                    <Link
                      key={c._id}
                      href={`/products?categoryId=${c._id}`}
                      className={`block text-sm transition-colors ${
                        activeCategoryId === c._id
                          ? 'font-semibold text-emerald-600'
                          : 'text-muted-foreground hover:text-emerald-600'
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>
                  Showing <span className="font-semibold text-foreground">{products.length}</span> products
                </span>
                {locationApplied && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> Near you
                  </span>
                )}
              </div>
              <ProductFilters
                q={typeof params.q === 'string' ? params.q : undefined}
                categoryId={typeof params.categoryId === 'string' ? params.categoryId : undefined}
                minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                sort={typeof params.sort === 'string' ? params.sort : undefined}
              />
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm">
                <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
                <Link href="/products">
                  <Button variant="outline">Clear all filters</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} currency={currency} />
                ))}
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
