export default function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-muted/50" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded-lg bg-gray-100 dark:bg-muted/50" />
            <div className="h-6 w-1/3 rounded-lg bg-gray-100 dark:bg-muted/50" />
            <div className="h-24 rounded-lg bg-gray-100 dark:bg-muted/50" />
            <div className="h-12 w-40 rounded-full bg-gray-100 dark:bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
