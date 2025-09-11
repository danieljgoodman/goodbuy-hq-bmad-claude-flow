import { Skeleton } from "@/components/ui/skeleton"

export function HeroSkeleton() {
  return (
    <div className="text-center mb-24 lg:mb-32 space-y-8">
      {/* Hero background animation placeholder */}
      <div className="relative mb-16">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[32rem] h-[32rem] bg-muted/40 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 space-y-6">
          {/* Title skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 mx-auto bg-muted/60" />
            <Skeleton className="h-16 w-2/3 mx-auto bg-muted/50" />
          </div>
          
          {/* Subtitle skeleton */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <Skeleton className="h-6 w-full bg-muted/40" />
            <Skeleton className="h-6 w-4/5 mx-auto bg-muted/40" />
          </div>
          
          {/* Primary CTA skeleton */}
          <div className="pt-8">
            <Skeleton className="h-14 w-80 mx-auto bg-primary/20 rounded-xl" />
          </div>
          
          {/* Secondary action skeleton */}
          <div className="pt-4">
            <Skeleton className="h-12 w-48 mx-auto bg-muted/30 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Trust signals skeleton */}
      <div className="flex flex-wrap items-center justify-center gap-8 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded bg-muted/40" />
            <Skeleton className="h-4 w-24 bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}