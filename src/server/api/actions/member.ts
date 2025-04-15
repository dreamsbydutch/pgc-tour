"use server";

import { api } from "@/src/trpc/server";
import { updateTourCardNames } from "./tour_card";
import type { Member } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { formatName } from "@/src/lib/utils";

export async function memberUpdateFormOnSubmit({ value }: { value: Member }) {
  const season = await api.season.getByYear({ year: 2025 });
  const tourCard = await api.tourCard.getByUserSeason({
    userId: value.id,
    seasonId: season?.id,
  });
  const tour = tourCard?.tourId
    ? await api.tour.getById({ tourID: tourCard.tourId })
    : null;
  const displayName =
    (value.firstname && value.firstname[0]) + ". " + value.lastname;
  value.fullname = value.firstname + " " + value.lastname;
  await api.member.update({
    id: value.id,
    email: value.email,
    fullname: value.fullname,
    firstname: value.firstname,
    lastname: value.lastname,
  });
  const newTourCard =
    tourCard && (await api.tourCard.update({ id: tourCard.id, displayName }));
  if (tour && newTourCard)
    await updateTourCardNames({ tour: tour, tourCard: newTourCard });
  return;
}

export async function addFriendsToMember({
  member,
  friendId,
}: {
  member: Member;
  friendId: string;
}) {
  let friends: string[] = [];
  if (!member.friends) {
    friends = [friendId];
  } else {
    friends = [...member.friends, friendId];
  }
  await api.member.update({ id: member.id, friends: friends });
  return;
}

export async function removeFriendsFromMember({
  member,
  friendId,
}: {
  member: Member;
  friendId: string;
}) {
  const friends = member.friends.filter((id) => id !== friendId);
  await api.member.update({ id: member.id, friends: friends });
  return;
}

export async function createNewMember(user: User) {
  const fullName = formatName(user?.user_metadata.name as string, "full");
  const splitName = fullName.split(" ");
  await api.member.create({
    id: user.id,
    email: user.email ?? (user.user_metadata.email as string),
    fullname: fullName,
    firstname: splitName[0] ?? "",
    lastname: splitName.slice(1).toString(),
  });
}
