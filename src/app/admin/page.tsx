import type {
  DatagolfFieldInput,
  DataGolfLiveTournament,
} from "@/lib/types/datagolf_types";
import {
  CreateGroupsButton,
  EmailListLinkButton,
  HistoryButton,
  UpdateGolfersButton,
  UpdateTeamsButton,
} from "../../lib/components/smartComponents/functionalComponents/client/CreateGroupsButton";
import Link from "next/link";
import { api } from "@/trpc/server";
import { fetchDataGolf } from "@/lib/utils/main";

export default async function AdminDashboard() {
  const currentTourney = await api.tournament.getActive();

  const liveData = (await fetchDataGolf(
    "preds/in-play",
    {},
  )) as DataGolfLiveTournament;
  const fieldData = (await fetchDataGolf(
    "field-updates",
    {},
  )) as DatagolfFieldInput;

  return (
    <>
      <div className="mb-2 text-center font-varela">
        <Link href="/push">Push</Link>
        <div className="mb-4 flex w-full flex-col flex-wrap gap-2">
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
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
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
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
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
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
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <div className="flex max-w-40 flex-col text-center">
              <div className="text-sm font-bold">Live Update</div>
              <div className="text-sm">{liveData.info.last_update}</div>
            </div>
            <CreateGroupsButton />
          </div>
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <UpdateGolfersButton />
            <UpdateTeamsButton />
          </div>
          <div className="scrollbar-hidden flex w-full flex-row flex-nowrap justify-around overflow-scroll">
            <EmailListLinkButton />
            <HistoryButton />
          </div>
        </div>
      </div>
      {/* <PaymentForm /> */}
    </>
  );
}
