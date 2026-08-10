export function PageTransitionLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-gentle-pulse rounded-full bg-accent/20 blur-xl" />
          <img src="/logo.png" alt="Instaby" className="relative h-6 w-auto animate-gentle-pulse" />
        </div>
      </div>
    </div>
  );
}
