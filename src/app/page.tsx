import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { formatPrice } from '@/shared/lib/format-price';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';

async function getFeaturedProducts() {
  try {
    await connectDB();
    // Fetch 4 active products as featured
    const products = await ProductModel.find({ isActive: true }).limit(4).lean();
    return await resolveProductImages(JSON.parse(JSON.stringify(products)));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();
  const showServices = isServicesModuleEnabled();
  const currency = await getSiteCurrency();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-green-50 dark:bg-emerald-950/20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/90 to-emerald-50/40 dark:from-emerald-950/40 dark:to-emerald-950/10 z-10" />
          {/* We would have a background image here, but for now we use a gradient */}
        </div>
        <div className="container relative z-10 px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-green-900 dark:text-emerald-50">
              Bring Nature <span className="text-emerald-600 dark:text-emerald-400">Indoors</span>
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl text-green-800/80 dark:text-emerald-200/70 font-medium">
              Discover our curated collection of beautiful, healthy plants. Delivered right to your door with care instructions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Shop Plants
                </Button>
              </Link>
              {showServices && (
                <Link href="/services">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-semibold">
                    Book a Gardener
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-20 bg-white dark:bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="p-4 bg-emerald-100 rounded-full">
                <Leaf className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold">Premium Quality</h3>
              <p className="text-muted-foreground">Hand-picked, healthy plants sourced directly from top growers.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="p-4 bg-emerald-100 rounded-full">
                <Truck className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold">Fast & Safe Delivery</h3>
              <p className="text-muted-foreground">Specialized packaging ensures your plants arrive in perfect condition.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="p-4 bg-emerald-100 rounded-full">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold">Expert Care Support</h3>
              <p className="text-muted-foreground">Get lifetime support and advice from our professional botanists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full py-16 md:py-24 bg-gray-50 dark:bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Additions</h2>
              <p className="text-muted-foreground">Our newest and most popular plants</p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center text-emerald-600 hover:text-emerald-700 font-medium">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
              <p className="text-muted-foreground">No featured products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <p className="text-muted-foreground text-sm mb-3">Indoor Plant</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{formatPrice(product.price, currency)}</span>
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full">
                View all products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
