"use client";

import { api } from "@/src/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../_components/ui/table";
import { cn } from "@/src/lib/utils";
import Image from "next/image";
import { Member, Season, Tournament } from "@prisma/client";
import { TournamentData } from "@/src/types/prisma_include";

export default function historyPage() {
  const seasons = api.season.getAll.useQuery().data;
  const tournaments = api.tournament.getAll.useQuery().data;
  const members = api.member.getAll.useQuery().data;
  // const data = members?.map((member) => {
  //   const teams = []
  //   member.tourCards.forEach((card) => {
  //     const team = api.team.getByTourCard.useQuery({
  //       tourCardId: card.id,
  //     }).data
  //     if (team) {
  //       teams.push(team)
  //     }
  //   })
  //   return teams.flat()
  // })
  return (
    <>
      {seasons
        ?.sort((a, b) => a.year - b.year)
        .map((season) => (
          <>
            <div className="mt-4 text-center font-varela font-bold">
              {season.year} Schedule
            </div>
            <Table className="text-center font-varela">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center text-xs font-bold">
                    Tournament
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Teams
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Made Cut
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Earnings
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Points
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Earn Percent
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Point Percent
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments
                  ?.filter((obj) => obj.seasonId === season.id)
                  .map((tourney) => (
                    <TournamentTableRow {...{ tourney, tournaments, season }} />
                  ))}
              </TableBody>
            </Table>
          </>
        ))}
    </>
  );
}

function TournamentTableRow({
  tourney,
  tournaments,
  season,
}: {
  tourney: TournamentData;
  tournaments: TournamentData[];
  season: Season;
}) {
  const teams = api.team.getByTournament.useQuery({
    tournamentId: tourney.id,
  });
  const tours = api.tour.getBySeason.useQuery({
    seasonID: season.id,
  });
  return (
    <TableRow
      key={tourney.id}
      className={cn(
        "border-y-0 !border-l-2 !border-r-2 border-slate-500",
        tournaments.filter(
          (obj) =>
            obj.startDate < tourney.endDate && obj.seasonId === season.id,
        ).length === 1
          ? "border-t-2"
          : "",
        tournaments.filter(
          (obj) =>
            obj.startDate < tourney.endDate &&
            obj.seasonId === season.id &&
            obj.tier.name === "Playoff",
        ).length === 1 && tourney.tier.name === "Playoff"
          ? "border-t"
          : "",
        tournaments.filter(
          (obj) =>
            obj.startDate < tourney.endDate && obj.seasonId === season.id,
        ).length ===
          tournaments.filter((obj) => obj.seasonId === season.id).length
          ? "!border-b-2"
          : "",

        tourney.tier.name === "Playoff" ? "bg-yellow-50" : "",
        tourney.tier.name === "Major" ? "bg-blue-50" : "",
      )}
    >
      <TableCell className="flex items-center justify-center whitespace-nowrap text-center text-xs">
        <Image
          src={tourney.logoUrl ?? ""}
          className="pr-1"
          alt={tourney.name}
          width={20}
          height={20}
        />
        {tourney.name}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {(teams?.data?.length ?? 0) / (tours?.data?.length ?? 1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {(teams?.data?.filter((a) => a.position !== "CUT").length ?? 0) /
          (tours?.data?.length ?? 1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {(teams?.data?.filter((a) => (a.earnings ?? 0) > 0).length ?? 0) /
          (tours?.data?.length ?? 1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {(teams?.data?.filter((a) => (a.points ?? 0) > 0).length ?? 0) /
          (tours?.data?.length ?? 1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {Math.round(
          ((teams?.data?.filter((a) => (a.earnings ?? 0) > 0).length ?? 0) /
            (teams?.data?.length ?? 1)) *
            10000,
        ) / 100}
        %
      </TableCell>
      <TableCell className="whitespace-nowrap text-center text-xs">
        {Math.round(
          ((teams?.data?.filter((a) => (a.points ?? 0) > 0).length ?? 0) /
            (teams?.data?.length ?? 1)) *
            10000,
        ) / 100}
        %
      </TableCell>
    </TableRow>
  );
}

function MemberListing({ member }: { member: Member }) {
  const tourCards = api.tourCard.getByUserId.useQuery({
    userId: member.id,
  }).data;
  const teams = api.team.getByTourCard.useQuery({
    tourCardId: tourCards?.[0]?.id,
  }).data;
  return (
    <div key={member.id} className="flex justify-between">
      <div>{member.fullname}</div>
      <div>{teams?.reduce((p, c) => (p += c.earnings ?? 0), 0) ?? 0}</div>
    </div>
  );
}
