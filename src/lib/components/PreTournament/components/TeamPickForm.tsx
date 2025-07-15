"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { Button, LoadingSpinner } from "@pgc-ui";
import { formatMoney, formatRank } from "@pgc-utils";
import { MemberHeader } from "./MemberHeader";
import { TeamGolfersList } from "./TeamGolfersList";

export interface TeamPickFormProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate">;
  member: Pick<Member, "firstname" | "lastname" | "account">;
  tourCard: Pick<TourCard, "points" | "earnings" | "position">;
  existingTeam: Pick<Team, "id"> | null | undefined;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
}

export function TeamPickForm({
  tournament,
  tourCard,
  member,
  existingTeam,
  teamGolfers,
}: TeamPickFormProps) {
  const [isOpeningForm, setIsOpeningForm] = useState(false);
  const router = useRouter();

  const handleOpenForm = () => {
    setIsOpeningForm(true);
    router.push(`/tournament/${tournament.id}/create-team`);
  };

  const hasOutstandingBalance = (member?.account ?? 0) > 0;
  const isButtonDisabled = isOpeningForm || hasOutstandingBalance;

  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <MemberHeader member={member} />

      {hasOutstandingBalance && (
        <div className="mx-auto mb-8 w-5/6 text-center text-lg italic text-red-600">
          {`Please send ${formatMoney(member?.account ?? 0)} to puregolfcollectivetour@gmail.com to unlock your picks.`}
        </div>
      )}

      <div className="text-lg font-bold">
        {`${formatRank(+(tourCard?.position ?? 0))} - ${tourCard?.points.toLocaleString()} pts${
          tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""
        }`}
      </div>

      {teamGolfers && teamGolfers.length > 0 && (
        <TeamGolfersList golfers={teamGolfers} />
      )}

      <Button
        onClick={handleOpenForm}
        disabled={isButtonDisabled}
        variant="action"
        className="mb-4 mt-8 text-xl"
        size="lg"
      >
        {isOpeningForm ? (
          <LoadingSpinner />
        ) : existingTeam ? (
          "Change Your Team"
        ) : (
          "Create Your Team"
        )}
      </Button>
    </div>
  );
}
