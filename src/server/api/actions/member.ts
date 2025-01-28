"use server";

import { api } from "@/src/trpc/server";
import { updateTourCardNames } from "./tour_card";
import type { Member } from "@prisma/client";

export async function memberUpdateFormOnSubmit({ value }: { value: Member }) {
  const season = await api.season.getByYear({ year: 2025 });
  let tourCard = await api.tourCard.getByUserSeason({
    userId: value.id,
    seasonId: season?.id,
  });
  const tour = await api.tour.getById({ tourID: tourCard?.tourId });
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
  tourCard =
    tourCard && (await api.tourCard.update({ id: tourCard.id, displayName }));
  if (tour && tourCard)
    await updateTourCardNames({ tour: tour, tourCard: tourCard });
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
