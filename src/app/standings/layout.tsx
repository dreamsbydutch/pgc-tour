import { Suspense } from "react";
import LoadingSpinner from "../_components/LoadingSpinner";

export const metadata = {
  title: "Standings",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="mx-auto max-w-4xl">{children}</div>
    </Suspense>
  );
}
