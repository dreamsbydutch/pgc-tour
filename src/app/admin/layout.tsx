import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loader2 />}>
      <div className="mx-auto flex flex-col">{children}</div>
    </Suspense>
  );
}
