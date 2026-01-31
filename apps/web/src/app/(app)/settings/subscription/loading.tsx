import { Skeleton, SkeletonCard } from '@/components/ui';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-8 w-20 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-xl mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
