export default function CartLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 animate-pulse">
      <div className="bg-background border-b border-border py-16 md:py-24" />
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-muted/50" />
            ))}
          </div>
          <div className="lg:col-span-4">
            <div className="h-72 rounded-2xl bg-gray-100 dark:bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
