import { db } from "../../db";

export const seedTournaments = async () => {
  const res = await fetch(
    "https://opensheet.elk.sh/1SSk7lg3Ym17lw8Hn-yZvT_erE9umRHPlrZJ8U4faBMY/Tournaments",
  );
  const output = await res.json();
  output.map(async (tourney: any) => {
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

    // await db.tournament.create({
    //   data: {
    //     name: tourney.Tourney,
    //     endDate: new Date(tourney.EndDate),
    //     startDate: new Date(tourney.StartDate),
    //     logoUrl: tourney.Logo,
    //     seasonId: season?.id || "",
    //     courseId: course?.id || "",
    //     tierId: tier?.id || "",
    //     livePlay: false,
    //     tours: {
    //       connect: tour.map((a) => {
    //         return { id: a.id };
    //       }),
    //     },
    //   },
    // });
  });
};
