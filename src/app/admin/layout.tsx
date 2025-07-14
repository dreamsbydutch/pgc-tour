import { LoadingSpinner } from "src/lib/components/functional/ui";
import { Suspense } from "react";

export const metadata = {
  title: "Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="mx-auto flex flex-col">{children}</div>
    </Suspense>
  );
}
