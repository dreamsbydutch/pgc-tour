"use client";

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { api } from "@/src/trpc/react";
import type { Golfer, TourCard, Tournament } from "@prisma/client";
import { teamCreateOnFormSubmit } from "@/src/server/api/actions/team";
import { useRouter } from "next/navigation";
import { Button } from "@/src/app/_components/ui/button";
import { useState } from "react";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";

// Define Zod schema
const golferSchema = z.object({
  groups: z.array(
    z.object({
      golfers: z
        .array(z.number())
        .min(2, "You must select exactly 2 golfers.")
        .max(2, "You must select exactly 2 golfers."),
    }),
  ),
});

const emptyGroups: InputGroups = [
  { key: "group1", golfers: [] },
  { key: "group2", golfers: [] },
  { key: "group3", golfers: [] },
  { key: "group4", golfers: [] },
  { key: "group5", golfers: [] },
];

type InputGroups = {
  key: string;
  golfers: Golfer[];
}[];

export default function CreateTeamForm({
  tournament,
  tourCard,
}: {
  tournament: Tournament;
  tourCard: TourCard;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  });
  const groups: InputGroups | undefined = golfers.data && [
    {
      key: "group1",
      golfers: golfers.data
        .filter((obj) => obj.group === 1)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    },
    {
      key: "group2",
      golfers: golfers.data
        .filter((obj) => obj.group === 2)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    },
    {
      key: "group3",
      golfers: golfers.data
        .filter((obj) => obj.group === 3)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    },
    {
      key: "group4",
      golfers: golfers.data
        .filter((obj) => obj.group === 4)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    },
    {
      key: "group5",
      golfers: golfers.data
        .filter((obj) => obj.group === 5)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    },
  ];
  const existingTeam = api.team.getByUserTournament.useQuery({
    tourCardId: tourCard?.id ?? "",
    tournamentId: tournament.id,
  }).data;

  const initialGroups = existingTeam
    ? existingTeam.golferIds.reduce(
        (acc, golferId, index) => {
          const groupIndex = Math.floor(index / 2);
          if (!acc[groupIndex]) {
            acc[groupIndex] = { golfers: [] };
          }
          acc[groupIndex].golfers.push(golferId);
          return acc;
        },
        [] as { golfers: number[] }[],
      )
    : emptyGroups.map(() => ({ golfers: [] }));

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    groups: { golfers: number[] }[];
  }>({
    defaultValues: {
      groups: initialGroups,
    },
    resolver: zodResolver(golferSchema),
    mode: "onSubmit",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: { groups: { golfers: number[] }[] }) => {
    setIsSubmitting(true);
    await teamCreateOnFormSubmit({
      tourCardId: tourCard.id,
      tournamentId: tournament.id,
      value: data,
    });
    await utils.team.invalidate();
    router.push(`/tournament/${tournament.id}`);
  };
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (errors: any) => {
    console.log("Validation Errors:", errors);
    alert("You must pick 2 golfers from each group.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="w-full max-w-4xl rounded-lg bg-white pb-10 pt-2"
      >
        {groups?.map((group, groupIndex) => {
          const fieldPath = `groups.${groupIndex}.golfers`;

          return (
            <div
              key={group.key}
              className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4"
            >
              <h3 className="mb-4 text-center text-2xl font-semibold">
                {`Group ${group.key.slice(-1)}`}
              </h3>
              <div className="flex flex-col gap-2">
                {group.golfers.map((golfer) => {
                  const selectedGolfers = watch(
                    fieldPath as `groups.${number}.golfers`,
                  );

                  const isChecked = selectedGolfers.includes(golfer.apiId);
                  const isDisabled = !isChecked && selectedGolfers.length >= 2;

                  return (
                    <label
                      key={golfer.apiId}
                      className={clsx(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-1.5",
                        {
                          "border-green-300 bg-green-100": isChecked,
                          "border-gray-300 bg-white": !isChecked,
                          "h-1 cursor-not-allowed border-none opacity-40":
                            isDisabled && !isChecked,
                        },
                      )}
                    >
                      <Controller
                        name={fieldPath as `groups.${number}.golfers`}
                        control={control}
                        render={() => (
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => {
                              const updatedGolfers = isChecked
                                ? selectedGolfers.filter(
                                    (id) => id !== golfer?.apiId,
                                  )
                                : [...selectedGolfers, golfer?.apiId];
                              setValue(
                                fieldPath as `groups.${number}.golfers`,
                                updatedGolfers.filter(
                                  (id): id is number => !!id,
                                ),
                              );
                            }}
                          />
                        )}
                      />
                      <span className="text-base">{`#${golfer.worldRank ?? "N/A"} ${golfer.playerName} (${golfer.rating})`}</span>
                    </label>
                  );
                })}
              </div>
              {errors.groups?.[groupIndex]?.golfers && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.groups[groupIndex].golfers.message}
                </p>
              )}
            </div>
          );
        })}
        <div className="flex">
          <Button
            type="submit"
            variant="action"
            className="mx-auto w-2/3 text-xl"
            size="xl"
          >
            {isSubmitting ? <LoadingSpinner /> : "Submit Team"}
          </Button>
        </div>
      </form>
    </div>
  );
}
