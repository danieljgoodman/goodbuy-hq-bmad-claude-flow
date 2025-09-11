import { Skeleton } from "@/components/ui/skeleton"

export function FeaturesSkeleton() {
  return (
    <div className="mb-20">
      {/* Section title skeleton */}
      <div className="text-center mb-16 space-y-4">
        <Skeleton className="h-12 w-64 mx-auto bg-muted/60" />
        <Skeleton className="h-6 w-96 mx-auto bg-muted/40" />
      </div>
      
      {/* Features grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            {/* Icon skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-12 w-12 rounded-full bg-primary/20" />
            </div>
            
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4 mx-auto bg-muted/50" />
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-muted/40" />
              <Skeleton className="h-4 w-5/6 mx-auto bg-muted/40" />
              <Skeleton className="h-4 w-4/5 mx-auto bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}