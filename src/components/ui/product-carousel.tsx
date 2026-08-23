'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/shared/lib/format-price';
import { Button } from '@/components/ui/button';

import { useStore } from '@/shared/store';

interface ProductCarouselProps {
  products: any[];
  currency: string;
}

export function ProductCarousel({ products, currency }: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { updateQty, items, pushToast } = useStore();
  const [addingId, setAddingId] = useState<string | null>(null);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingId(product._id);
    const existingItem = items.find((i) => i.productId._id === product._id);
    const nextQty = existingItem ? existingItem.qty + 1 : 1;
    
    const result = await updateQty(product._id, nextQty);
    setAddingId(null);
    
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

  if (!products || products.length === 0) return null;

  return (
    <div className="relative w-full py-2 group">
      {/* Navigation Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-3 rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-2xl text-foreground hover:scale-110 transition-all hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-3 rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-2xl text-foreground hover:scale-110 transition-all hidden md:flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Carousel Track */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, i) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
            className="min-w-[260px] w-[260px] shrink-0 snap-center"
          >
            <Link
              href={`/products/${product.slug}`}
              className="group/card flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-emerald-500/30 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500"
            >
              <div className="relative w-full aspect-square shrink-0 overflow-hidden bg-muted/30">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover/card:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 text-xs font-semibold tracking-wide">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 p-5">
                <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover/card:text-emerald-500 transition-colors">
                  {product.name}
                </h3>
                <div className="text-lg font-bold text-foreground">
                  {formatPrice(product.price, currency)}
                </div>
                <Button
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={addingId === product._id}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-semibold uppercase tracking-wider text-[10px] h-8 mt-auto"
                >
                  <ShoppingBag className="w-3 h-3 mr-1.5" />
                  {addingId === product._id ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
