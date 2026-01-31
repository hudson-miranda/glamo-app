import { Skeleton, SkeletonCard } from '@/components/ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
