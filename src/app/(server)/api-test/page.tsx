"use client";

import { useState, useEffect } from "react";
import { testApi } from "@/src/lib/store/mainInit";

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const apiEndpoints = [
    "/api/members/current",
    "/api/tournaments/info",
    "/api/tournaments/all",
    "/api/tours/all",
    "/api/tours/current",
    "/api/tourcards/current",
    "/api/seasons/current",
    "/api/teams/current",
    "/api/tiers/current",
  ];

  const testEndpoint = async (url: string) => {
    setLoading((prev) => ({ ...prev, [url]: true }));
    try {
      const result = await testApi(url);
      setResults((prev) => ({
        ...prev,
        [url]: { success: !!result, data: result },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [url]: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [url]: false }));
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">API Endpoint Testing</h1>

      <div className="space-y-6">
        {apiEndpoints.map((endpoint) => (
          <div key={endpoint} className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{endpoint}</h2>
              <button
                onClick={() => testEndpoint(endpoint)}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                disabled={loading[endpoint]}
              >
                {loading[endpoint] ? "Testing..." : "Test Endpoint"}
              </button>
            </div>

            {results[endpoint] && (
              <div className="mt-4">
                <div
                  className={`rounded p-2 ${results[endpoint].success ? "bg-green-100" : "bg-red-100"}`}
                >
                  Status: {results[endpoint].success ? "Success" : "Failed"}
                </div>
                {results[endpoint].error && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-red-800">
                    Error: {results[endpoint].error}
                  </div>
                )}
                {results[endpoint].data && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(results[endpoint].data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
