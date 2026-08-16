'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/shared/store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, ShieldCheck, Tag, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useCheckoutSettings } from '@/shared/hooks/use-checkout-settings';

type Address = {
  _id: string;
  label: string;
  line1: string;
  city: string;
  isDefault: boolean;
};

export default function CheckoutPage() {
  const formatPrice = useFormatPrice();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, fetchCart, clearCart, pushToast } = useStore();
  const { deliveryFee, minOrderAmount } = useCheckoutSettings();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: string } | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponChecking, setCouponChecking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchCart();
      fetchAddresses();
    }
  }, [status, fetchCart, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/v1/addresses');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAddresses(data.data);
        const def = data.data.find((a: Address) => a.isDefault);
        setSelectedAddressId(def ? def._id : data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    setCouponError('');
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setCouponError(typeof data.error === 'string' ? data.error : 'Invalid coupon');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.data.code, discountAmount: data.data.discountAmount });
    } catch {
      setCouponError('Could not validate coupon');
    } finally {
      setCouponChecking(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      pushToast({ title: 'Please select a delivery address', variant: 'error' });
      return;
    }
    if (belowMinOrder) {
      pushToast({ title: `Minimum order amount is ${formatPrice(minOrderAmount)}`, variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        setOrderComplete(data.data);
      } else {
        pushToast({ title: 'Checkout failed', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: 'An unexpected error occurred', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-foreground mb-4">Order Confirmed!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your order <strong className="text-gray-900 dark:text-foreground">{orderComplete.orderNumber}</strong> has been successfully placed. We'll send you an email confirmation shortly.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="lg" className="rounded-full px-8">View Order</Button>
          </Link>
          <Link href="/products">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/products">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const subTotal = items.reduce((acc, item) => acc + (item.priceSnapshot * item.qty), 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = subTotal + deliveryFee - discountAmount;
  const belowMinOrder = minOrderAmount > 0 && subTotal < minOrderAmount;

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Cart
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-gray-100 dark:border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Delivery Address
                </h2>
                
                {addresses.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 p-4 rounded-lg text-sm border border-yellow-200 dark:border-yellow-900">
                    You have no saved addresses. Please add one to continue.
                    <Link href="/dashboard/addresses" className="font-bold underline ml-2">Add Address</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedAddressId} onValueChange={(val: string | null) => setSelectedAddressId(val || '')}>
                      <SelectTrigger className="w-full h-14 bg-white dark:bg-input/30 border-gray-200 dark:border-input focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Select an address" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map(a => (
                          <SelectItem key={a._id} value={a._id} className="py-3">
                            <span className="font-medium">{a.label}</span> - {a.line1}, {a.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-100 dark:border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Coupon Code
                </h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <span className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> {appliedCoupon.code} applied — {formatPrice(appliedCoupon.discountAmount)} off
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                      className="text-emerald-700 hover:text-emerald-900"
                      aria-label="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="bg-white dark:bg-input/30"
                      />
                      <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponChecking || !couponInput.trim()}>
                        {couponChecking ? 'Checking…' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && <p className="text-sm text-destructive mt-2">{couponError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-100 dark:border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Payment Method
                </h2>
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 flex items-start gap-4">
                  <input type="radio" checked readOnly className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-input" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-foreground">Cash on Delivery (COD)</h3>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">Pay with cash when your order is delivered to your doorstep. Safe and convenient.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-5">
            <Card className="border-gray-100 dark:border-border shadow-sm sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.productId._id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-muted rounded-lg overflow-hidden shrink-0">
                        {item.productId.images?.[0] && (
                          <img src={item.productId.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-gray-900 dark:text-foreground line-clamp-1">{item.productId.name}</p>
                        <p className="text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-foreground">
                        {formatPrice(item.priceSnapshot * item.qty)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-muted w-full mb-6" />

                <div className="space-y-3 text-sm text-gray-600 dark:text-muted-foreground mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-gray-900 dark:text-foreground">{formatPrice(deliveryFee)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Coupon Discount</span>
                      <span className="font-medium">−{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100 dark:bg-muted w-full my-3" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-900 dark:text-foreground">Total</span>
                    <span className="font-bold text-emerald-600 text-2xl">{formatPrice(total)}</span>
                  </div>
                </div>

                {belowMinOrder && (
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Add {formatPrice(minOrderAmount - subTotal)} more to reach the minimum order of {formatPrice(minOrderAmount)}.</span>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={submitting || !selectedAddressId || belowMinOrder}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 text-lg font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                >
                  {submitting ? 'Processing...' : belowMinOrder ? 'Minimum order not met' : 'Confirm Order'}
                </Button>

                <div className="mt-6 flex items-center justify-center text-xs text-gray-500 dark:text-muted-foreground gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure encrypted checkout
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
