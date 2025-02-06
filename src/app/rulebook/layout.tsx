import { Suspense } from "react";
import LoadingSpinner from "../_components/LoadingSpinner";

export const metadata = {
  title: "Rulebook",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="mx-auto my-4 w-10/12 max-w-6xl">{children}</div>
    </Suspense>
  );
}
