"use server";

import { api } from "@/src/trpc/server";
import { updateTourCardNames } from "./tour_card";
import type { Member } from "@prisma/client";

export async function memberUpdateFormOnSubmit({
  value,
  userId,
}: {
  value: Member;
  userId: string | undefined;
}) {
  const season = await api.season.getByYear({ year: 2025 });
  let tourCard = await api.tourCard.getByUserSeason({
    userId,
    seasonId: season?.id,
  });
  const tour = await api.tour.getById({ tourID: tourCard?.tourId });
  const displayName =
    (value.firstname && value.firstname[0]) + ". " + value.lastname;
  value.fullname = value.firstname + " " + value.lastname;
  await api.member.update(value);
  tourCard =
    tourCard && (await api.tourCard.update({ id: tourCard.id, displayName }));
  if (tour && tourCard)
    await updateTourCardNames({ tour: tour, tourCard: tourCard });
  return;
}
