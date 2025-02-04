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

export default function historyPage() {
  const seasons = api.season.getAll.useQuery().data;
  const tournaments = api.tournament.getAll.useQuery().data;
  if (!tournaments) return <></>;
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
                    Dates
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Tier
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Course
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold">
                    Location
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments
                  .filter((obj) => obj.seasonId === season.id)
                  .map((tourney) => (
                    <TableRow
                      key={tourney.id}
                      className={cn(
                        "border-y-0 !border-l-2 !border-r-2 border-slate-500",
                        tournaments.filter(
                          (obj) =>
                            obj.startDate < tourney.endDate &&
                            obj.seasonId === season.id,
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
                            obj.startDate < tourney.endDate &&
                            obj.seasonId === season.id,
                        ).length ===
                          tournaments.filter(
                            (obj) => obj.seasonId === season.id,
                          ).length
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
                        {`${tourney.startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })} - ${
                          tourney.startDate.getMonth() ===
                          tourney.endDate.getMonth()
                            ? tourney.endDate.toLocaleDateString("en-US", {
                                day: "numeric",
                              })
                            : tourney.endDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                        }`}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs">
                        {tourney.tier.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs">
                        {tourney.course.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs">
                        {tourney.course.location}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </>
        ))}
    </>
  );
}
