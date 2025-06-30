"use client";

import { useAuth, useStoreDebug } from "@/src/lib/store";

export default function AuthDebug() {
  const {
    authUser,
    authSession,
    member,
    isAuthenticated,
    authLoading,
    authError,
  } = useAuth();

  const storeDebug = useStoreDebug();

  return (
    <div className="m-4 rounded bg-blue-100 p-4">
      <h2 className="mb-4 text-xl font-bold">Auth Debug</h2>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Auth Loading:</strong> {authLoading ? "true" : "false"}
        </p>
        <p>
          <strong>Is Authenticated:</strong>{" "}
          {isAuthenticated ? "true" : "false"}
        </p>
        <p>
          <strong>Auth Error:</strong> {authError ?? "none"}
        </p>
        <p>
          <strong>Auth User:</strong>{" "}
          {authUser
            ? JSON.stringify(
                { id: authUser.id, email: authUser.email },
                null,
                2,
              )
            : "null"}
        </p>
        <p>
          <strong>Auth Session:</strong> {authSession ? "exists" : "null"}
        </p>
        <p>
          <strong>Member:</strong>{" "}
          {member
            ? JSON.stringify(
                { id: member.id, fullname: member.fullname },
                null,
                2,
              )
            : "null"}
        </p>

        <div className="mt-4">
          <h3 className="font-bold">Store Debug Info:</h3>
          <p>
            <strong>Store Ready:</strong>{" "}
            {storeDebug.isStoreReady ? "true" : "false"}
          </p>
          <p>
            <strong>Store Connected:</strong>{" "}
            {storeDebug.isConnected ? "true" : "false"}
          </p>
          <p>
            <strong>Store Loading:</strong>{" "}
            {storeDebug.loading ? "true" : "false"}
          </p>
          <p>
            <strong>Store Error:</strong> {storeDebug.error ?? "none"}
          </p>
        </div>
      </div>
    </div>
  );
}
