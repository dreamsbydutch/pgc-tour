import { Suspense } from "react";
import LoadingSpinner from "../../lib/components/smartComponents/functionalComponents/loading/LoadingSpinner";

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
