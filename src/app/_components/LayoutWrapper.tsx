"use client";

import { cn } from "@/src/lib/utils";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window === "undefined")
    return <div className="mb-16 mt-16">{children}</div>;
  const width = window.innerWidth;
  return (
    <div className={cn(width < 1000 ? "mb-24 mt-4" : "mb-4 mt-20")}>
      {children}
    </div>
  );
}
