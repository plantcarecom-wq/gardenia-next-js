'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export function ProductFilters({
  q,
  categoryId,
  minPrice,
  maxPrice,
  sort,
}: {
  q?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const [open, setOpen] = useState(Boolean(minPrice || maxPrice));
  const [sortValue, setSortValue] = useState(sort || 'newest');
  const hasActiveFilters = Boolean(minPrice || maxPrice || (sort && sort !== 'newest'));

  return (
    <form method="GET" action="/products" className="w-full sm:w-auto">
      {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
      <input type="hidden" name="sort" value={sortValue} />

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Input name="q" placeholder="Search products..." defaultValue={q || ''} className="w-full sm:w-64 bg-white dark:bg-input/30" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 bg-white dark:bg-input/30 relative"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-600" />}
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          Apply
        </Button>
      </div>

      {open && (
        <div className="mt-3 p-4 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Min Price</label>
            <Input name="minPrice" type="number" min={0} defaultValue={minPrice || ''} placeholder="0" className="w-28 bg-white dark:bg-input/30" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Max Price</label>
            <Input name="maxPrice" type="number" min={0} defaultValue={maxPrice || ''} placeholder="Any" className="w-28 bg-white dark:bg-input/30" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Sort By</label>
            <Select value={sortValue} onValueChange={(v) => setSortValue(v || 'newest')}>
              <SelectTrigger className="w-48 bg-white dark:bg-input/30">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <a href={categoryId ? `/products?categoryId=${categoryId}` : '/products'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive h-8">
              <X className="w-3.5 h-3.5" /> Clear filters
            </a>
          )}
        </div>
      )}
    </form>
  );
}
