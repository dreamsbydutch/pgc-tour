import { getCurrentTournament, getNextTournament } from "@/server/api/actions";
import { redirect } from "next/navigation";

export default async function TournamentIndexPage() {
  // Try to fetch the current tournament first
  const tournament = await getCurrentTournament();

  // If no current tournament, try the most recent
  if (!tournament) {
    const next = await getNextTournament();
    if (!next) {
      // Show a refresh button if no tournament is found
      return (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div>No tournament found.</div>
          <button
            style={{ marginTop: 16, padding: "8px 16px", fontSize: 16 }}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      );
    }
    redirect(`/tournament/${next.id}`);
  }

  // Redirect to the current tournament page
  redirect(`/tournament/${tournament.id}`);
}
