import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-32" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Skeleton className="h-7 w-40" />
          <Card className="overflow-hidden">
            <Skeleton className="h-2 w-full" />
            <CardHeader>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardFooter className="border-t bg-muted/20 p-6">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-6">
           <Card>
             <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
             <CardContent className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

export function CurriculumSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0" />
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between mb-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-6 w-full mb-1" />
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-6 px-6">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
