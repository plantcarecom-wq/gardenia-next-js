'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, Leaf, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/shared/store';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';

export default function WishlistPage() {
  const formatPrice = useFormatPrice();
  const { wishlistProducts, wishlistLoading, fetchWishlist, toggleWishlist, pushToast } = useStore();

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    pushToast({ title: 'Removed from wishlist' });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">Products you&apos;ve saved for later.</p>
      </div>

      {wishlistLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : wishlistProducts.length === 0 ? (
        <Card className="border-gray-100 dark:border-border">
          <CardContent className="p-12 text-center">
            <Heart className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Link href="/products"><Button variant="outline">Browse Products</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlistProducts.map((p) => (
            <Card key={p._id} className="border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <div className="flex">
                <Link href={`/products/${p.slug}`} className="w-28 h-28 bg-gray-100 dark:bg-muted shrink-0 relative">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                      <Leaf className="w-8 h-8 opacity-30" />
                    </div>
                  )}
                </Link>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/products/${p.slug}`} className="font-semibold text-sm hover:text-emerald-600 line-clamp-1">{p.name}</Link>
                    <p className="text-emerald-600 font-bold mt-1">{formatPrice(p.discountPrice || p.price)}</p>
                    {p.stockQty === 0 && <p className="text-xs text-destructive mt-0.5">Out of stock</p>}
                  </div>
                  <button
                    onClick={() => handleRemove(p._id)}
                    className="text-xs text-muted-foreground hover:text-destructive text-left mt-2"
                  >
                    Remove
                  </button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
