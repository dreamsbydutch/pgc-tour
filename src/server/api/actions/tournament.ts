"use server";

import { db } from "../../db";

export const seedTournaments = async () => {
  const output = await fetch(
    "https://opensheet.elk.sh/1SSk7lg3Ym17lw8Hn-yZvT_erE9umRHPlrZJ8U4faBMY/Tournaments",
  ).then((res) => res.json() as unknown as Tournament[]);
  await Promise.all(
    output
      .filter((obj) => obj.year === "2025")
      .map(async (tourney) => {
        const season = await db.season.findUnique({
          where: { year: +tourney.year },
        });
        const course = await db.course.findUnique({
          where: { name: tourney.Course },
        });
        const tier = await db.tier.findFirst({
          where: { seasonId: season?.id, name: tourney.Class },
        });
        const tour = await db.tour.findMany({
          where: { seasonId: season?.id },
        });

        await db.tournament.create({
          data: {
            name: tourney.Tourney,
            apiId: tourney.dg_id,
            endDate: new Date(tourney.EndDate),
            startDate: new Date(tourney.StartDate),
            logoUrl: tourney.Logo,
            seasonId: season?.id ?? "",
            courseId: course?.id ?? "",
            tierId: tier?.id ?? "",
            livePlay: false,
            tours: {
              connect: tour.map((a) => {
                return { id: a.id };
              }),
            },
          },
        });
      }),
  );
};

type Tournament = {
  year: string;
  tourneyID: string;
  dg_id: string;
  Tourney: string;
  StartDate: string;
  EndDate: string;
  Dates: string;
  Class: string;
  PointsPurse: string;
  MoneyPurse: string;
  Par: string;
  ShowPar: string;
  Course: string;
  Location: string;
  Logo: string;
  FormID: string;
  FormLink: string;
};
