import { notFound } from 'next/navigation';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { Leaf, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { ProductActions } from './product-actions';
import { ReviewsSection } from '@/components/reviews/reviews-section';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  await connectDB();
  const product = await ProductModel.findOne({ slug, isActive: true }).lean();
  if (!product) return null;
  const [resolved] = await resolveProductImages([JSON.parse(JSON.stringify(product))]);
  return resolved;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const currency = await getSiteCurrency();

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-gray-50 dark:bg-muted rounded-2xl overflow-hidden border border-gray-100 dark:border-border flex items-center justify-center relative">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 space-y-4">
                  <Leaf className="w-24 h-24 opacity-20" />
                  <span className="text-sm uppercase tracking-widest font-medium">No Image</span>
                </div>
              )}
            </div>
            {/* Thumbnail Gallery placeholder */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img: string, i: number) => (
                  <div key={i} className="w-24 h-24 rounded-xl border border-gray-200 dark:border-border overflow-hidden shrink-0 cursor-pointer hover:border-emerald-600 transition-colors">
                    <img src={img} alt="" className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={
                  product.stockQty > 0
                    ? 'px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider'
                    : 'px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 text-xs font-semibold uppercase tracking-wider'
                }
              >
                {product.stockQty > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
              <span className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-foreground mb-4">
              {product.name}
            </h1>

            <div className="text-3xl font-bold text-emerald-600 mb-6">
              {formatPrice(product.price, currency)}
            </div>

            <div className="prose prose-emerald dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-muted-foreground">
              <p>{product.description || 'No description available for this product.'}</p>
            </div>

            <div className="h-px bg-gray-100 dark:bg-border w-full mb-8" />

            <ProductActions productId={String(product._id)} stockQty={product.stockQty} />

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-muted/40 rounded-2xl p-6 border border-gray-100 dark:border-border">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Free Shipping</h4>
                  <p className="text-xs text-muted-foreground">On orders over {formatPrice(5000, currency)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Quality Guarantee</h4>
                  <p className="text-xs text-muted-foreground">30-day freshness promise</p>
                </div>
              </div>
            </div>
            
            {/* Attributes */}
            {product.attributes && Object.entries(product.attributes || {}).length > 0 && (
              <div className="mt-10">
                <h3 className="font-semibold text-lg mb-4">Plant Care & Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {Object.entries(product.attributes || {}).map(([key, value]) => (
                    <div key={key} className="flex flex-col border-b border-gray-100 dark:border-border pb-2">
                      <span className="text-sm text-muted-foreground">{key}</span>
                      <span className="font-medium text-sm">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReviewsSection targetType="PRODUCT" targetId={String(product._id)} subjectLabel="product" />
      </div>
    </div>
  );
}
