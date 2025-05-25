import { AlertCircle } from "lucide-react";

/**
 * ErrorDisplay component for showing error messages
 * @param message - The error message to display
 * @param title - Optional title for the error
 */
export default function ErrorDisplay({
  message,
  title = "Error",
}: {
  message: string;
  title?: string;
}) {
  return (
    <div className="flex min-h-[30vh] w-full items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-red-700">{title}</h2>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
}
