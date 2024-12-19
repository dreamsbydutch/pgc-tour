import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loader2 />}>
      <div className="mx-auto w-10/12 max-w-4xl">{children}</div>
    </Suspense>
  );
}
