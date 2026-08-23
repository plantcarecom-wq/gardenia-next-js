import Link from 'next/link';
import { Star, MapPin, Sprout, ArrowRight } from 'lucide-react';

interface GardenerCardProps {
  gardener: {
    _id: string;
    userId?: { _id: string; name: string } | string;
    bio?: string;
    serviceAreaCities?: string[];
    experienceYears?: number;
    ratingAverage?: number;
    ratingCount?: number;
  };
}

export function GardenerCard({ gardener }: GardenerCardProps) {
  const name = typeof gardener.userId === 'object' ? gardener.userId.name : 'Gardener';
  const gardenerUserId = typeof gardener.userId === 'object' ? gardener.userId._id : gardener.userId;

  return (
    <Link
      href={`/services?gardenerId=${gardenerUserId}`}
      className="group/card flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-emerald-500/30 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500"
    >
      <div className="relative w-full aspect-square shrink-0 overflow-hidden bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover/card:scale-105 transition-transform duration-700 ease-out">
          <Sprout className="w-7 h-7 text-emerald-500" />
        </div>
        {/* Overlay Action */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 text-xs font-semibold tracking-wide">
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-5">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1 group-hover/card:text-emerald-500 transition-colors">
            {name}
          </h3>
          {gardener.ratingCount ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {gardener.ratingAverage?.toFixed(1)} ({gardener.ratingCount})
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">New Gardener</span>
          )}
        </div>

        {gardener.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2">{gardener.bio}</p>
        )}

        {gardener.serviceAreaCities && gardener.serviceAreaCities.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{gardener.serviceAreaCities.join(', ')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
