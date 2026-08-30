export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 ${className}`}
    />
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="card-base p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="mt-5 h-10 w-full rounded-full" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="card-base flex flex-col items-center px-8 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
          <Icon size={30} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
