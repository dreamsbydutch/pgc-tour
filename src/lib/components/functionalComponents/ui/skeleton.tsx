import { cn } from "@/lib/utils/core";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-400", className)}
      {...props}
    />
  );
}

const SVGSkeleton = ({ className }: React.HTMLAttributes<HTMLDivElement>) => (
  <svg className={cn("animate-pulse rounded-full bg-slate-400", className)} />
);

export { Skeleton, SVGSkeleton };
