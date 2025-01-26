"use server";

import { api } from "@/src/trpc/server";
import PaymentForm from "./_components/TransactionForm";
import createBackupOfTable from "../api/backupTable";

export default async function AdminDashboard() {
  await createBackupOfTable();
  const season = await api.season.getByYear({ year: 2025 });
  const tours = await api.tour.getBySeason({ seasonID: season?.id });
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
