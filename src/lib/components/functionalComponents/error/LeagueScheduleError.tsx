import { getErrorMessage } from "@/lib/utils/core/types";

/**
 * LeagueScheduleError Component
 *
 * Mimics the LeagueSchedule style and displays an error message.
 * Accepts the full error object and extracts a user-friendly message.
 */
export function LeagueScheduleError({ error }: { error: unknown }) {
  const message = getErrorMessage(error);

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-2xl rounded-lg border border-red-300 bg-red-50 p-6 shadow">
        <h2 className="mb-2 text-xl font-semibold text-red-700">
          Schedule Error
        </h2>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
}
