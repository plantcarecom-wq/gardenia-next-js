export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 animate-pulse">
      <div className="bg-background border-b border-border py-16 md:py-24" />
      <div className="container mx-auto px-4 max-w-5xl py-12 space-y-4">
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-muted/50" />
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-muted/50" />
      </div>
    </div>
  );
}
