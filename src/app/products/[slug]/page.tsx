import { notFound } from 'next/navigation';
import { connectDB } from '@/shared/lib/db';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { Leaf, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { ProductActions } from './product-actions';
import { AnimatedSlider } from '@/components/ui/animated-slider';
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
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-800/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 py-12 relative z-10">
        <Link href="/products" className="inline-flex items-center text-sm text-gray-400 hover:text-emerald-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="w-full lg:col-span-6">
            <div className="sticky top-24">
              <AnimatedSlider images={product.images || []} />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col lg:col-span-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={
                  product.stockQty > 0
                    ? 'px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                }
              >
                {product.stockQty > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
              <span className="text-xs text-gray-500 font-mono tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                SKU: {product.sku || 'N/A'}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.1] drop-shadow-2xl">
              {product.name}
            </h1>

            <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 mb-8 drop-shadow-sm">
              {formatPrice(product.price, currency)}
            </div>

            <p className="text-gray-400 leading-relaxed font-light mb-8 line-clamp-3">
              {product.description || 'No description available for this product.'}
            </p>

            {/* Glassmorphic Add to Cart Section */}
            <div className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <ProductActions productId={String(product._id)} stockQty={product.stockQty} />
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Truck className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-200 tracking-wide">Free Shipping</h4>
                  <p className="text-xs text-gray-500 mt-1">On orders over {formatPrice(5000, currency)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-200 tracking-wide">Quality Guarantee</h4>
                  <p className="text-xs text-gray-500 mt-1">30-day freshness promise</p>
                </div>
              </div>
            </div>
            
            {/* Attributes */}
            {product.attributes && Object.entries(product.attributes || {}).length > 0 && (
              <div className="mt-4 p-6 rounded-3xl bg-black/40 border border-white/5">
                <h3 className="font-bold text-lg mb-6 text-gray-300">Plant Care & Details</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  {Object.entries(product.attributes || {}).map(([key, value]) => (
                    <div key={key} className="flex flex-col relative pl-4">
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-emerald-500/30 rounded-full" />
                      <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">{key}</span>
                      <span className="font-medium text-sm text-gray-200">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-white/10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Description</h2>
          <div className="prose prose-lg prose-invert max-w-none text-gray-400 leading-relaxed font-light">
            <p>{product.description || 'No description available for this product.'}</p>
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-white/10">
          <ReviewsSection targetType="PRODUCT" targetId={String(product._id)} subjectLabel="product" />
        </div>
      </div>
    </div>
  );
}
