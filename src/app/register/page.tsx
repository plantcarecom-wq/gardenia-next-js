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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-emerald-800/10 rounded-full blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-lg shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 rounded-3xl overflow-hidden my-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50 pointer-events-none" />
        
        <CardHeader className="space-y-3 text-center pt-10 pb-6 relative z-10">
          <div className="mx-auto bg-emerald-500/10 p-4 rounded-full w-fit mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Leaf className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">Create an account</CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Join Gardenia to start shopping premium plants
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-medium text-center">
                {error}
              </div>
            )}
            {showGardenerOption && (
              <div className="space-y-3">
                <Label className="text-gray-300 font-medium ml-1">I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGardener(false)}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-2xl border p-5 text-sm font-bold transition-all duration-300',
                      !isGardener 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                    )}
                  >
                    <ShoppingBag className="h-6 w-6" />
                    Shop plants
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGardener(true)}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-2xl border p-5 text-sm font-bold transition-all duration-300',
                      isGardener 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                    )}
                  >
                    <Sprout className="h-6 w-6" />
                    Sell as Gardener
                  </button>
                </div>
                {isGardener && (
                  <p className="text-xs text-emerald-500/80 pt-1 ml-1 font-medium">
                    Gardener accounts require admin approval before you can list services.
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 font-medium ml-1">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium ml-1">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 font-medium ml-1">Phone Number (Optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium ml-1">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required minLength={8} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all" />
            </div>
            
            <Button type="submit" className="w-full h-12 text-base mt-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all font-bold tracking-wide" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/legal/terms" className="text-gray-400 hover:text-white underline decoration-gray-600 transition-colors">Terms & Conditions</Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="text-gray-400 hover:text-white underline decoration-gray-600 transition-colors">Privacy Policy</Link>.
            </p>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/10 py-6 relative z-10 bg-white/5">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
