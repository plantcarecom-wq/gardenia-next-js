'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isServicesModuleEnabledClient } from '@/config/feature-flags';
import { roleHomePath } from '@/shared/lib/role-home';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      router.push(roleHomePath(role, isServicesModuleEnabledClient()));
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-emerald-800/10 rounded-full blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50 pointer-events-none" />
        
        <CardHeader className="space-y-3 text-center pt-10 pb-6 relative z-10">
          <div className="mx-auto bg-emerald-500/10 p-4 rounded-full w-fit mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Leaf className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
            Welcome back
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/50 rounded-xl transition-all"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all font-bold tracking-wide" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-white/10 py-6 relative z-10 bg-white/5">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

