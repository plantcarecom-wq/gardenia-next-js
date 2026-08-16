'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, ShoppingBag, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isServicesModuleEnabledClient } from '@/config/feature-flags';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [isGardener, setIsGardener] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredAsGardener, setRegisteredAsGardener] = useState(false);
  const showGardenerOption = isServicesModuleEnabledClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isGardener: showGardenerOption && isGardener }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else if (showGardenerOption && isGardener) {
        setRegisteredAsGardener(true);
      } else {
        router.push('/login');
      }
    } catch (_err) {
      setError('An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  if (registeredAsGardener) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-xl border-border/50 text-center">
          <CardHeader className="space-y-2 pb-2">
            <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Application submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your Gardener account has been created and is pending admin review. You can log in now to
              complete your seller profile, but you won&apos;t be able to list services until an admin approves your application.
            </p>
            <Link href="/login">
              <Button className="w-full h-11">Continue to log in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-border/50 my-8">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-base">
            Join Gardenia to start shopping premium plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium text-center">
                {error}
              </div>
            )}
            {showGardenerOption && (
              <div className="space-y-2">
                <Label>I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGardener(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors',
                      !isGardener ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Shop plants
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGardener(true)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors',
                      isGardener ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    <Sprout className="h-5 w-5" />
                    Sell as a Gardener
                  </button>
                </div>
                {isGardener && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Gardener accounts require admin approval before you can list services.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required minLength={8} className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 text-base mt-2 shadow-md shadow-primary/20" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{' '}
              <Link href="/legal/terms" className="underline hover:text-foreground">Terms & Conditions</Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
