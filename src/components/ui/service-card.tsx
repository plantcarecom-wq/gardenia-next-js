import React from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/shared/lib/format-price';

interface ServiceCardProps {
  offering: any;
  currency: string;
}

function priceSuffix(priceType: string) {
  if (priceType === 'hourly') return '/hr';
  if (priceType === 'variable') return '+';
  return '';
}

export function ServiceCard({ offering, currency }: ServiceCardProps) {
  return (
    <div className="h-full group/card flex flex-col bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
      <Link href={`/services/${offering._id}`} className="block relative aspect-square overflow-hidden bg-muted/30">
        {offering.images && offering.images.length > 0 ? (
          <img
            src={offering.images[0]}
            alt={offering.title}
            className="object-cover w-full h-full group-hover/card:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Leaf className="h-12 w-12 opacity-20" />
            <span className="text-xs uppercase tracking-widest font-medium opacity-50">No Image</span>
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          {offering.categoryId?.name && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 shadow-lg border border-white/20">
              {offering.categoryId.name}
            </span>
          )}
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 font-semibold tracking-wide">
            View Details <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-grow text-center items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl line-clamp-1 mb-1 group-hover/card:text-emerald-500 transition-colors">
            {offering.title}
          </h3>
          {offering.gardenerId?.name && (
            <p className="text-sm text-muted-foreground font-medium mb-3">by {offering.gardenerId.name}</p>
          )}
          <div className="text-2xl font-black text-foreground drop-shadow-sm flex items-baseline justify-center">
            {formatPrice(offering.price, currency)}
            <span className="text-sm font-bold text-muted-foreground ml-1">{priceSuffix(offering.priceType)}</span>
          </div>
        </div>
        
        <Link href={`/services/${offering._id}`} className="w-full">
          <Button 
            variant="outline" 
            className="w-full rounded-full border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-semibold uppercase tracking-wider text-xs h-12"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Book Service
          </Button>
        </Link>
      </div>
    </div>
  );
}
