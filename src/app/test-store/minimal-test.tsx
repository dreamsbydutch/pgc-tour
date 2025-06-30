"use client";

import React from "react";
import { create } from "zustand";
import type { PGCTourStoreState } from "./types";

// Create a minimal store without persistence to test
const useTestStore = create<{
  testValue: string;
  setTestValue: (value: string) => void;
}>((set) => ({
  testValue: "initial",
  setTestValue: (value) => set({ testValue: value }),
}));

export default function MinimalStoreTest() {
  console.log("MinimalStoreTest rendering...");

  try {
    const { testValue, setTestValue } = useTestStore();

    console.log("Minimal store accessed successfully:", testValue);

    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Minimal Store Test</h1>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">Test Value</h2>
          <p>
            <strong>Current Value:</strong> {testValue}
          </p>
          <button
            onClick={() => setTestValue("updated-" + Date.now())}
            className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
          >
            Update Value
          </button>
        </div>

        <div className="mt-4">
          <p className="text-green-600">✅ Minimal Zustand store is working!</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Minimal store error:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold text-red-600">
          Minimal Store Error
        </h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-red-800">
            <strong>Error:</strong>{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    );
  }
}
