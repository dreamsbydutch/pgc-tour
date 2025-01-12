"use client";

import { api } from "@/src/trpc/react";
import PaymentForm from "./_components/TransactionForm";
import OneSignal from "react-onesignal";
import { useEffect } from "react";

export default function AdminDashboard() {
  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== "undefined") {
      OneSignal.init({
        appId: "e13d2829-191f-493b-8688-486b4520740c",
        // You can add other initialization options here
        notifyButton: {
          enable: true,
        },
        // Uncomment the below line to run on localhost. See: https://documentation.onesignal.com/docs/local-testing
        allowLocalhostAsSecureOrigin: true,
      });
    }
  }, []);
  const season = api.season.getByYear.useQuery({ year: 2025 }).data;
  const tours = api.tour.getBySeason.useQuery({ seasonID: season?.id }).data;
  return (
    <>
      <div className="mb-8">
        {tours?.map((tour) => (
          <div
            key={tour.id}
          >{`${tour.name} - ${tour.tourCards.length} sign ups (${+(process.env.TOUR_MAX_SIZE ?? 75) - tour.tourCards.length} left)`}</div>
        ))}
      </div>
      <PaymentForm />
    </>
  );
}
