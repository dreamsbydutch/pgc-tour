import { LoadingSpinner } from "src/lib/components/functional/ui";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="mx-auto w-10/12 max-w-4xl">{children}</div>
    </Suspense>
  );
}
