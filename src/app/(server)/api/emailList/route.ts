// File: pages/api/sendEmail.js
import { api } from "@/src/trpc/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await api.member.getAll();
    const tourCards = await api.tourCard.getAll();

    const activeEmails = members
      .filter(
        (member) =>
          tourCards.find((tourCard) => tourCard.memberId === member.id) !==
          undefined,
      )
      .map((member) => {
        const tourCard = tourCards.find(
          (tourCard) => tourCard.memberId === member.id,
        );
        return {
          email: member.email,
          name: member.fullname,
          account: member.account,
          tour: tourCard?.tourId,
          earnings: tourCard?.earnings,
          points: tourCard?.points,
        };
      });
    const inactiveEmails = members
      .filter(
        (member) =>
          tourCards.find((tourCard) => tourCard.memberId === member.id) ===
          undefined,
      )
      .map((member) => {
        return { email: member.email, name: member.fullname };
      });

    return NextResponse.json(
      { active: activeEmails, inactive: inactiveEmails },
      { status: 400 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error fetching emails: " + errorMessage },
      { status: 500 },
    );
  }
}
