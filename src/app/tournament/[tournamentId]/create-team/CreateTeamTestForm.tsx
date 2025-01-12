"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { api } from "@/src/trpc/react";
import { Golfer, Tournament } from "@prisma/client";

// Define Zod schema
const golferSchema = z.object({
  groups: z.array(
    z.object({
      golfers: z
        .array(z.string())
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
  golfers: string[];
}[];

export default function CreateTeamForm({
  tournament,
}: {
  tournament: Tournament;
}) {
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  });
  const groups:
    | {
        key: string;
        golfers: Golfer[];
      }[]
    | undefined = golfers.data && [
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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    groups: { golfers: string[] }[];
  }>({
    defaultValues: {
      groups:
        groups?.map(() => ({ golfers: [] })) ??
        emptyGroups.map(() => ({ golfers: [] })),
    },
    resolver: zodResolver(golferSchema),
    mode: "onSubmit",
  });

  const onSubmit = (data: any) => {
    console.log(data);
    alert("Team submitted successfully!");
  };
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
                  ) as string[];

                  const isChecked = selectedGolfers.includes(golfer.apiId);
                  const isDisabled = !isChecked && selectedGolfers.length >= 2;

                  return (
                    <label
                      key={golfer.apiId}
                      className={clsx(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-2",
                        {
                          "border-green-300 bg-green-100": isChecked,
                          "border-gray-300 bg-white": !isChecked,
                          "cursor-not-allowed opacity-40":
                            isDisabled && !isChecked,
                        },
                      )}
                    >
                      <Controller
                        name={fieldPath as `groups.${number}.golfers`}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => {
                              const updatedGolfers = isChecked
                                ? selectedGolfers.filter(
                                    (name) => name !== golfer?.apiId,
                                  )
                                : [...selectedGolfers, golfer?.apiId];
                              setValue(
                                fieldPath as `groups.${number}.golfers`,
                                updatedGolfers.filter(
                                  (name): name is string => !!name,
                                ),
                              );
                            }}
                          />
                        )}
                      />
                      <span className="text-lg">{`#${golfer.worldRank ?? "N/A"} ${golfer.playerName} (${golfer.rating})`}</span>
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

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
        >
          Submit Team
        </button>
      </form>
    </div>
  );
}