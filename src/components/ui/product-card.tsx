'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/shared/store';
import { formatPrice } from '@/shared/lib/format-price';

interface ProductCardProps {
  product: any;
  currency: string;
}

export function ProductCard({ product, currency }: ProductCardProps) {
  const { updateQty, items, pushToast } = useStore();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAdding(true);
    const existingItem = items.find((i) => i.productId._id === product._id);
    const nextQty = existingItem ? existingItem.qty + 1 : 1;
    
    const result = await updateQty(product._id, nextQty);
    setAdding(false);
    
    if (result.success) {
      pushToast({
        title: 'Added to cart',
        body: `${product.name} has been added to your cart.`,
        variant: 'success',
      });
    } else {
      pushToast({
        title: 'Error',
        body: result.error || 'Could not add to cart.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="h-full group/card flex flex-col bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted/30">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="object-cover w-full h-full group-hover/card:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Leaf className="h-12 w-12 opacity-20" />
          </div>
        )}
        {/* Overlay Action */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 font-semibold tracking-wide">
            View Details <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-grow text-center items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl line-clamp-1 mb-2 group-hover/card:text-emerald-500 transition-colors">
            {product.name}
          </h3>
          <div className="text-2xl font-black text-foreground drop-shadow-sm">
            {formatPrice(product.price, currency)}
          </div>
        </div>
        
        <Button 
          onClick={handleAddToCart}
          disabled={adding}
          variant="outline" 
          className="w-full rounded-full border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-semibold uppercase tracking-wider text-xs h-12"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {adding ? 'Adding...' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}
