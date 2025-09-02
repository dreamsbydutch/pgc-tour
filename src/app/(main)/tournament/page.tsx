/**
 * Alternative faster approach using client-side navigation
 * This can replace the current page.tsx if you want maximum speed
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@pgc-trpcClient";

export default function TournamentIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Use tRPC client-side query for faster response
  const { data: tournamentInfo, isLoading } = api.tournament.getInfo.useQuery(
    undefined,
    {
      staleTime: 30000, // Cache for 30 seconds
      retry: 1,
    },
  );

  useEffect(() => {
    if (isLoading) return;

    if (tournamentInfo?.current?.id) {
      router.replace(`/tournament/${tournamentInfo.current.id}`);
      return;
    }

    if (tournamentInfo?.next?.id) {
      router.replace(`/tournament/${tournamentInfo.next.id}`);
      return;
    }
    if (tournamentInfo?.previous?.id) {
      router.replace(`/tournament/${tournamentInfo.previous.id}`);
      return;
    }

    // If we have data but no tournaments
    if (tournamentInfo && !tournamentInfo.current && !tournamentInfo.next) {
      setError("No tournament found");
    }
  }, [tournamentInfo, isLoading, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-gray-800">
            <h2 className="mb-2 text-xl font-semibold">No Tournament Found</h2>
            <p className="mb-4 text-gray-600">
              Unable to find a current or upcoming tournament.
            </p>
          </div>
          <button
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600">
          {isLoading ? "Finding tournament..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
