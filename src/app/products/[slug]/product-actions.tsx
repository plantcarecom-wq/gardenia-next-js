'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Minus, Plus, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/shared/store';
import { cn } from '@/lib/utils';

export function ProductActions({ productId, stockQty }: { productId: string; stockQty: number }) {
  const router = useRouter();
  const { status } = useSession();
  const { items, updateQty, fetchCart, pushToast, isWishlisted, toggleWishlist, fetchWishlist } = useStore();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const inStock = stockQty > 0;
  const cartItem = items.find((i) => i.productId._id === productId);
  const wishlisted = isWishlisted(productId);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCart();
      fetchWishlist();
    }
  }, [status, fetchCart, fetchWishlist]);

  const handleAddToCart = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setAdding(true);
    try {
      const nextQty = (cartItem?.qty || 0) + qty;
      const result = await updateQty(productId, nextQty);
      if (result.success) {
        pushToast({ title: 'Added to cart', body: `${qty} item${qty > 1 ? 's' : ''} added.` });
      } else {
        pushToast({ title: 'Could not add to cart', body: result.error });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setWishlistBusy(true);
    try {
      const nowWishlisted = await toggleWishlist(productId);
      pushToast({ title: nowWishlisted ? 'Added to wishlist' : 'Removed from wishlist' });
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center border border-gray-200 rounded-xl h-14 dark:border-input">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 disabled:opacity-30"
            disabled={!inStock}
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stockQty || 1, q + 1))}
            className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 disabled:opacity-30"
            disabled={!inStock || qty >= stockQty}
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">{stockQty} available</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-14 text-base rounded-xl shadow-lg shadow-emerald-200 disabled:shadow-none"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {!inStock ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Cart'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleToggleWishlist}
          disabled={wishlistBusy}
          className={cn(
            'h-14 w-full sm:w-14 shrink-0 rounded-xl border-gray-200 dark:border-input text-gray-600 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30',
            wishlisted && 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
          )}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={cn('h-5 w-5', wishlisted && 'fill-current')} />
        </Button>
      </div>
    </div>
  );
}
