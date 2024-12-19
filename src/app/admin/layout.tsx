import { Suspense } from "react";
import LoadingSpinner from "../_components/LoadingSpinner";

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
