import { cn } from "@/lib/utils/core";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-black", className)}
      {...props}
    />
  );
}

const SVGSkeleton = ({ className }: React.HTMLAttributes<HTMLDivElement>) => (
  <svg className={cn("animate-pulse rounded bg-gray-200", className)} />
);

export { Skeleton, SVGSkeleton };
