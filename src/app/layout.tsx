import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/shared/components/Providers';
import { Navbar } from '@/shared/components/Navbar';
import { AnnouncementBar } from '@/shared/components/AnnouncementBar';
import { Footer } from '@/shared/components/Footer';
import { ToastContainer } from '@/shared/components/ToastContainer';
import { ChromeGate } from '@/shared/components/ChromeGate';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';
import { getFeaturedCoupons } from '@/shared/lib/get-featured-coupons';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gardenia - Premium Plant Care & Marketplace',
  description: 'Your ultimate destination for premium plants, pots, fertilizers, and expert gardening services.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currency, offers] = await Promise.all([getSiteCurrency(), getFeaturedCoupons()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased flex flex-col`}>
        <Providers currency={currency}>
          <ChromeGate>
            <AnnouncementBar offers={offers} />
            <Navbar />
          </ChromeGate>
          <ToastContainer />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
          <ChromeGate>
            <Footer />
          </ChromeGate>
        </Providers>
      </body>
    </html>
  );
}
