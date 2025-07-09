import { getErrorMessage } from "@/lib/utils/main";

export function TierTableError({ error }: { error?: unknown }) {
  const message = getErrorMessage(error);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="mb-2 flex items-center gap-2">
        <svg
          className="h-6 w-6 text-red-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01"
          />
        </svg>
        <span className="text-base font-semibold text-red-700">{message}</span>
      </div>
      <div className="text-xs text-gray-500">
        Please try refreshing the page or check your network connection.
      </div>
    </div>
  );
}
