import { Suspense } from "react";
import LoadingSpinner from "../../../lib/components/functionalComponents/loading/LoadingSpinner";

export const metadata = {
  title: "Rulebook",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="mx-auto my-4 max-w-6xl px-4">{children}</div>
    </Suspense>
  );
}
