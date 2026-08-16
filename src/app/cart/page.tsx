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
    if (status === 'authenticated') {
      fetchCart();
    }
  }, [status, fetchCart]);

  if (!mounted) return null;

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Please log in to view your cart</h2>
        <Link href="/login">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
            Log In or Register
          </Button>
        </Link>
      </div>
    );
  }

  const subTotal = items.reduce((acc, item) => acc + (item.priceSnapshot * item.qty), 0);
  const total = subTotal + (items.length > 0 ? deliveryFee : 0);
  const belowMinOrder = minOrderAmount > 0 && subTotal < minOrderAmount;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-foreground mb-8 flex items-center">
        Your Cart <span className="ml-3 text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-3 py-1 rounded-full">{items.length} items</span>
      </h1>

      {cartLoading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added any plants yet.</p>
          <Link href="/products">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <Card key={item.productId._id} className="border border-gray-100 dark:border-border shadow-sm overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="w-full sm:w-40 h-40 bg-gray-50 dark:bg-muted flex shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-border">
                    {item.productId.images && item.productId.images[0] ? (
                      <img src={item.productId.images[0]} alt={item.productId.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">No Image</div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-foreground leading-tight mb-1">
                          <Link href={`/products/${item.productId.slug}`} className="hover:text-emerald-600 transition-colors">
                            {item.productId.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-emerald-600 font-bold">{formatPrice(item.priceSnapshot)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId._id)}
                        className="text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors p-2 -mr-2 -mt-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-gray-200 dark:border-input rounded-full bg-white dark:bg-input/30">
                        <button
                          onClick={() => updateQty(item.productId._id, Math.max(1, item.qty - 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-muted rounded-l-full transition-colors"
                          disabled={item.qty <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={async () => {
                            const result = await updateQty(item.productId._id, item.qty + 1);
                            if (!result.success) {
                              pushToast({ title: 'Could not update quantity', body: result.error });
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-muted rounded-r-full transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-bold text-gray-900 dark:text-foreground">
                        {formatPrice(item.priceSnapshot * item.qty)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-4">
            <Card className="border border-gray-100 dark:border-border shadow-sm sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Order Summary</h3>
                <div className="space-y-4 text-sm text-gray-600 dark:text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-border w-full my-4" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-900 dark:text-foreground">Total</span>
                    <span className="font-bold text-emerald-600 text-xl">{formatPrice(total)}</span>
                  </div>
                </div>

                {belowMinOrder && (
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mb-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Add {formatPrice(minOrderAmount - subTotal)} more to reach the minimum order of {formatPrice(minOrderAmount)}.</span>
                  </div>
                )}

                {belowMinOrder ? (
                  <Button size="lg" disabled className="w-full rounded-xl h-14 text-base mt-2">
                    Minimum order not met
                  </Button>
                ) : (
                  <Link href="/checkout" className="block mt-8">
                    <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 text-base shadow-lg shadow-emerald-200">
                      Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <div className="mt-4 text-center">
                  <Link href="/products" className="text-sm text-muted-foreground hover:text-emerald-600 font-medium inline-flex items-center">
                    Continue Shopping
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
