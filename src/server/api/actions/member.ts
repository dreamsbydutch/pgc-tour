"use server";

import { api } from "@/src/trpc/server";
import { updateTourCardNames } from "./tour_card";
import type { User } from "@supabase/supabase-js";
import type { Member } from "@prisma/client";

export async function memberUpdateFormOnSubmit({
  value,
  user,
}: {
  value: Member;
  user: User | null;
}) {
  const season = await api.season.getByYear({ year: 2025 });
  const member = await api.member.getById({ memberId: user?.id });
  let tourCard = await api.tourCard.getByUserSeason({
    userId: user?.id,
    seasonId: season?.id,
  });
  const tour = await api.tour.getById({ tourID: tourCard?.tourId });
  const displayName =
    (value.firstname && value.firstname[0]) + ". " + value.lastname;
  value.fullname = value.firstname + " " + value.lastname;
  await api.member.update(value);
  tourCard =
    tourCard && (await api.tourCard.update({ id: tourCard.id, displayName }));
  tour && tourCard && updateTourCardNames({ tour: tour, tourCard: tourCard });
  return;
}
