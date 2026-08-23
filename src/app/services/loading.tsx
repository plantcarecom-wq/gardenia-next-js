export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 animate-pulse">
      <div className="bg-background border-b border-border py-16 md:py-24" />
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <div className="h-64 rounded-xl bg-gray-100 dark:bg-muted/50" />
          </aside>
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-gray-100 dark:bg-muted/50" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
