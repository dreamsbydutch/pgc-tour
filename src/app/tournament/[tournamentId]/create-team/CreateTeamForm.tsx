"use client";

import { api } from "@/src/trpc/react";
import { FieldApi, useForm } from "@tanstack/react-form";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Golfer, Tournament } from "@prisma/client";
import { FieldInfo } from "@/src/app/_components/FieldInfo";
import { Button } from "@/src/app/_components/ui/button";

type InputGroups = {
  group1: Golfer[];
  group2: Golfer[];
  group3: Golfer[];
  group4: Golfer[];
  group5: Golfer[];
};

const emptyGroups: InputGroups = {
  group1: [],
  group2: [],
  group3: [],
  group4: [],
  group5: [],
};

export default function CreateTeamForm({
  tournament,
}: {
  tournament: Tournament;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  });
  const groups = golfers.data && {
    group1: golfers.data
      .filter((obj) => obj.group === 1)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    group2: golfers.data
      .filter((obj) => obj.group === 2)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    group3: golfers.data
      .filter((obj) => obj.group === 3)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    group4: golfers.data
      .filter((obj) => obj.group === 4)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    group5: golfers.data
      .filter((obj) => obj.group === 5)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
  };

  const form = useForm({
    defaultValues: groups ?? emptyGroups,
    onSubmit: async ({ value }) => {
      console.log(value);
      //   await teamCreateOnFormSubmit({ value });
      await utils.team.invalidate();
      router.refresh();
      return;
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await form.handleSubmit();
    return;
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)}>
      <div className="flex flex-col gap-2">
        {groups &&
          Object.keys(groups).map((groupName) => (
            <form.Field key={groupName} name={groupName as keyof InputGroups}>
              {(field) => (
                <>
                  <GroupField
                    groupName={groupName}
                    options={groups[groupName as keyof InputGroups] ?? []}
                    field={field}
                  />
                  <FieldInfo field={field} />
                </>
              )}
            </form.Field>
          ))}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <div className="flex justify-between">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-[1.5rem] w-2/5 items-center self-end"
              >
                {isSubmitting ? "..." : "Update"}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

function GroupField({
  groupName,
  options,
  field,
}: {
  groupName: string;
  options: Golfer[];
  field: any;
}) {
  const selectedOptions: number[] = field.getValue();

  const handleChange = (selectedValue: number, checked: boolean) => {
    console.log(checked);
    const newValue = checked
      ? [...selectedOptions, selectedValue]
      : selectedOptions.filter((v: number) => v !== selectedValue);
    if (newValue.length <= 2) {
      field.setValue(newValue);
    }
    console.log(newValue);
  };
  return (
    <div className="mx-auto flex flex-col">
      <div className="flex w-max flex-col rounded-lg border-2 px-8 py-4">
        <h2 className="mb-2 text-center text-xl font-bold">
          {`Group ${groupName.slice(-1)}`}
        </h2>
        {options.map((golfer) => (
          <div key={golfer.apiId} className="flex flex-row">
            <input
              type="checkbox"
              className="ml-2 h-[1.5rem] border-2 px-0.5"
              value={golfer.apiId}
              checked={selectedOptions.includes(golfer.apiId)}
              onChange={(e) => handleChange(golfer.apiId, e.target.checked)}
            />
            <label htmlFor={field.name} className="my-auto ml-2">
              {`${
                golfer.worldRank ? "#" + golfer.worldRank + " " : "N/A "
              } ${golfer.playerName} (${golfer.rating})`}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
