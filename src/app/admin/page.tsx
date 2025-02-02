"use server";

import { api } from "@/src/trpc/server";
import PaymentForm from "./_components/TransactionForm";
import {
  DatagolfFieldInput,
  DataGolfLiveTournament,
} from "@/src/types/datagolf_types";
import { fetchDataGolf } from "@/src/lib/utils";
import CreateGroupsButton from "./_components/CreateGroupsButton";

export default async function AdminDashboard() {
  const season = await api.season.getByYear({ year: 2025 });
  const tours = await api.tour.getBySeason({ seasonID: season?.id });
  const currentTourney = await api.tournament.getCurrent();

  const liveData = (await fetchDataGolf(
    "preds/in-play",
    null,
  )) as DataGolfLiveTournament;
  const fieldData = (await fetchDataGolf(
    "field-updates",
    null,
  )) as DatagolfFieldInput;

  return (
    <>
      <div className="mb-8 font-varela">
        <div className="mb-6 flex w-full flex-col flex-wrap gap-2">
          <div className="flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Current Event</div>
              <div className="text-sm">{currentTourney?.name}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Current Round</div>
              <div className="text-sm">{currentTourney?.currentRound}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Current Live</div>
              <div className="text-sm">
                {currentTourney?.livePlay ? "True" : "False"}
              </div>
            </div>
          </div>
          <div className="flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Field Event</div>
              <div className="text-sm">{fieldData.event_name}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Field Round</div>
              <div className="text-sm">{fieldData.current_round}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Field Golfers</div>
              <div className="text-sm">
                {
                  fieldData.field.filter(
                    (obj) =>
                      obj[
                        `r${fieldData.current_round}_teetime` as keyof typeof obj
                      ],
                  ).length
                }
              </div>
            </div>
          </div>
          <div className="flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Live Event</div>
              <div className="text-sm">{liveData.info.event_name}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Live Round</div>
              <div className="text-sm">{liveData.info.current_round}</div>
            </div>
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Live Golfers</div>
              <div className="text-sm">
                {
                  liveData.data.filter((obj) => obj.thru > 0 && obj.thru < 18)
                    .length
                }
              </div>
            </div>
          </div>
          <div className="flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Live Update</div>
              <div className="text-sm">{liveData.info.last_update}</div>
            </div>
            <CreateGroupsButton />
          </div>
        </div>
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
