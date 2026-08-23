'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/shared/store';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useCheckoutSettings } from '@/shared/hooks/use-checkout-settings';

export default function CartPage() {
  const formatPrice = useFormatPrice();
  const { data: session, status } = useSession();
  const { items, fetchCart, updateQty, removeItem, cartLoading, pushToast } = useStore();
  const { deliveryFee, minOrderAmount } = useCheckoutSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch cart regardless of auth status since it uses cookies for guests
    fetchCart();
  }, [status, fetchCart]);

  if (!mounted) return null;

  const subTotal = items.reduce((acc, item) => acc + (item.priceSnapshot * item.qty), 0);
  const total = subTotal + (items.length > 0 ? deliveryFee : 0);
  const belowMinOrder = minOrderAmount > 0 && subTotal < minOrderAmount;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <div className="bg-background border-b border-border py-16 md:py-24 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black dark:bg-[#0a0a0a] z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        </div>
        <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-white bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
            Your Cart
          </h1>
          <p className="text-emerald-400 font-mono tracking-widest uppercase text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        {cartLoading && items.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-card rounded-3xl border border-gray-100 dark:border-border shadow-2xl max-w-2xl mx-auto">
            <ShoppingBag className="w-20 h-20 mx-auto text-emerald-100 dark:text-emerald-950 mb-6" />
            <h2 className="text-3xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 text-lg">Looks like you haven't added any plants yet.</p>
            <Link href="/products">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-10 h-14 text-base shadow-lg hover:shadow-emerald-500/20 transition-all">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <Card key={item.productId._id} className="border border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-2xl group">
                  <CardContent className="p-0 flex flex-col sm:flex-row bg-white dark:bg-card">
                    <div className="w-full sm:w-48 h-48 bg-gray-50 dark:bg-muted/50 flex shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-border overflow-hidden">
                      {item.productId.images && item.productId.images[0] ? (
                        <img src={item.productId.images[0]} alt={item.productId.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">No Image</div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-foreground leading-tight mb-2">
                            <Link href={`/products/${item.productId.slug}`} className="hover:text-emerald-500 transition-colors">
                              {item.productId.name}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground bg-gray-100 dark:bg-muted inline-block px-3 py-1 rounded-md font-medium">
                            {formatPrice(item.priceSnapshot)} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId._id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors p-2 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-end mt-6">
                        <div className="flex items-center border border-gray-200 dark:border-border rounded-full bg-gray-50 dark:bg-background overflow-hidden">
                          <button
                            onClick={() => updateQty(item.productId._id, Math.max(1, item.qty - 1))}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-muted transition-colors"
                            disabled={item.qty <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-bold">{item.qty}</span>
                          <button
                            onClick={async () => {
                              const result = await updateQty(item.productId._id, item.qty + 1);
                              if (!result.success) {
                                pushToast({ title: 'Could not update quantity', body: result.error });
                              }
                            }}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-muted transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                          {formatPrice(item.priceSnapshot * item.qty)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-4">
              <Card className="border border-gray-100 dark:border-border shadow-xl rounded-3xl sticky top-24 bg-white dark:bg-card">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-8 flex items-center">Order Summary</h3>
                  <div className="space-y-5 text-sm text-gray-600 dark:text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(subTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Delivery Fee</span>
                      <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-border to-transparent w-full my-6 opacity-50" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-foreground text-lg">Total</span>
                      <span className="font-black text-emerald-600 text-3xl drop-shadow-sm">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {belowMinOrder && (
                    <div className="flex items-start gap-3 text-sm text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mt-6">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>Add <span className="font-bold">{formatPrice(minOrderAmount - subTotal)}</span> more to reach the minimum order of {formatPrice(minOrderAmount)}.</span>
                    </div>
                  )}

                  {belowMinOrder ? (
                    <Button size="lg" disabled className="w-full rounded-full h-14 text-base mt-8 font-bold">
                      Minimum order not met
                    </Button>
                  ) : (
                    <Link href="/checkout" className="block mt-8">
                      <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-full h-14 text-base shadow-xl hover:shadow-emerald-500/20 transition-all font-bold tracking-wide">
                        Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                  <div className="mt-6 text-center">
                    <Link href="/products" className="text-sm text-muted-foreground hover:text-emerald-500 font-medium inline-flex items-center transition-colors">
                      Continue Shopping
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
