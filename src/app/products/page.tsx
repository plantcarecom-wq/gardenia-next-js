import Link from 'next/link';
import { Leaf, Filter, ChevronRight } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { ProductFilters } from './product-filters';

export const dynamic = 'force-dynamic';

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAverage: -1 },
  newest: { createdAt: -1 },
};

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

  const products = await ProductModel.find(filter).sort(SORT_MAP[sort] || SORT_MAP.newest).lean();
  return await resolveProductImages(JSON.parse(JSON.stringify(products)));
}

async function getCategories() {
  await connectDB();
  const categories = await CategoryModel.find({ isActive: true }).lean();
  return JSON.parse(JSON.stringify(categories));
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const products = await getProducts(params);
  const categories = await getCategories();
  const currency = await getSiteCurrency();
  
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <div className="bg-emerald-900 text-white py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Our Catalog</h1>
          <p className="text-emerald-100 max-w-2xl text-lg">Browse our extensive collection of premium plants, pots, and accessories to bring your space to life.</p>
        </div>
      </div>
      
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-card p-5 rounded-xl border border-gray-100 dark:border-border shadow-sm">
                <h3 className="font-semibold text-lg flex items-center mb-4">
                  <Filter className="w-4 h-4 mr-2" /> Categories
                </h3>
                <div className="space-y-2">
                  <Link href="/products" className="block text-sm hover:text-emerald-600 transition-colors">
                    All Products
                  </Link>
                  {categories.map((c: any) => (
                    <Link key={c._id} href={`/products?categoryId=${c._id}`} className="block text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
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
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{products.length}</span> products
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
                  <Link key={product._id} href={`/products/${product.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-gray-100 dark:border-border bg-white dark:bg-card">
                      <div className="aspect-[4/5] bg-gray-100 dark:bg-muted relative overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <Leaf className="h-12 w-12 opacity-20" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description || 'Premium plant selection.'}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-bold text-lg">{formatPrice(product.price, currency)}</span>
                          <div className="text-sm font-medium text-emerald-600 flex items-center">
                            View details <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
