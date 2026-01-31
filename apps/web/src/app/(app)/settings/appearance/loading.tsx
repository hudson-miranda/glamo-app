import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      {/* Theme Options */}
      <div className="p-6 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Other Options */}
      <div className="p-6 rounded-2xl border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
