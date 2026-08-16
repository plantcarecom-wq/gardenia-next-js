import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Leaf, Filter, ChevronRight } from 'lucide-react';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { connectDB } from '@/shared/lib/db';
import { ServiceOfferingModel } from '@/modules/services/infrastructure/service-offering.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
import { CategoryTypeModel } from '@/modules/catalog/infrastructure/category-type.model';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/shared/lib/format-price';
import { getSiteCurrency } from '@/shared/lib/get-site-currency';

export const dynamic = 'force-dynamic';

async function getServiceOfferings(searchParams: { [key: string]: string | string[] | undefined }) {
  await connectDB();
  const categoryId = typeof searchParams.categoryId === 'string' ? searchParams.categoryId : undefined;

  const filter: Record<string, any> = { isActive: true };
  if (categoryId) filter.categoryId = categoryId;

  const offerings = await ServiceOfferingModel.find(filter)
    .populate('categoryId', 'name')
    .populate('gardenerId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(offerings));
}

async function getServiceCategories() {
  await connectDB();
  // Category itself doesn't carry a `domain`; domain lives on CategoryType.
  // Scope to categories whose CategoryType.domain === 'SERVICE'.
  const serviceCategoryTypes = await CategoryTypeModel.find({ domain: 'SERVICE', isActive: true }).lean();
  const categoryTypeIds = serviceCategoryTypes.map((ct: any) => ct._id);
  const categories = await CategoryModel.find({ categoryTypeId: { $in: categoryTypeIds }, isActive: true }).lean();
  return JSON.parse(JSON.stringify(categories));
}

function priceSuffix(priceType: string) {
  if (priceType === 'hourly') return '/hr';
  if (priceType === 'variable') return '+';
  return '';
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isServicesModuleEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const offerings = await getServiceOfferings(params);
  const categories = await getServiceCategories();
  const currency = await getSiteCurrency();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <div className="bg-emerald-900 text-white py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Gardening Services</h1>
          <p className="text-emerald-100 max-w-2xl text-lg">Book a trusted Gardener for garden care, landscaping, and more, right in your area.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-card p-5 rounded-xl border border-gray-100 dark:border-border shadow-sm">
                <h3 className="font-semibold text-lg flex items-center mb-4">
                  <Filter className="w-4 h-4 mr-2" /> Categories
                </h3>
                <div className="space-y-2">
                  <Link href="/services" className="block text-sm hover:text-emerald-600 transition-colors">
                    All Services
                  </Link>
                  {categories.map((c: any) => (
                    <Link key={c._id} href={`/services?categoryId=${c._id}`} className="block text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{offerings.length}</span> services
              </div>
            </div>

            {offerings.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm">
                <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or check back soon.</p>
                <Link href="/services">
                  <span className="inline-flex items-center justify-center rounded-md border border-input bg-white dark:bg-input/30 px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                    Clear all filters
                  </span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offerings.map((offering: any) => (
                  <Link key={offering._id} href={`/services/${offering._id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-gray-100 dark:border-border bg-white dark:bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        {offering.categoryId?.name && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1">
                            {offering.categoryId.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {offering.title}
                      </h3>
                      {offering.gardenerId?.name && (
                        <p className="text-sm text-muted-foreground mb-2">by {offering.gardenerId.name}</p>
                      )}
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{offering.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-lg">
                          {formatPrice(offering.price, currency)}
                          <span className="text-sm font-normal text-muted-foreground">{priceSuffix(offering.priceType)}</span>
                        </span>
                        <div className="text-sm font-medium text-emerald-600 flex items-center">
                          View details <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
