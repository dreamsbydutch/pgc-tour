"use client";

import type { Golfer } from "@prisma/client";
import { useState } from "react";
import { TeamData, TournamentData } from "@/src/types/prisma_include";
import { api } from "@/src/trpc/react";
import { MobileListing } from "./MobileListing";

export function PGAListing({
  tournament,
  golfer,
  userTeam,
}: {
  tournament: TournamentData;
  golfer: Golfer;
  userTeam: TeamData | undefined;
}) {
  const course = api.course.getById.useQuery({
    courseID: userTeam?.tournament.courseId ?? "",
  }).data;
  const [isOpen, setIsOpen] = useState(false);
  const total =
    (golfer.roundOne ?? 0) +
    (golfer.roundTwo ?? 0) +
    (golfer.roundThree ?? 0) +
    (golfer.roundFour ?? 0);
  return <MobileListing {...{ type: "PGA", tournament, golfer, userTeam }} />;
}
