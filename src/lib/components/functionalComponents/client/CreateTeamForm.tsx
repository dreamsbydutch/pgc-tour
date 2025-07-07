"use client";

import { teamCreateOnFormSubmit } from "@/server/api/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Golfer, TourCard, Tournament } from "@prisma/client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import LoadingSpinner from "../loading/LoadingSpinner";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { z } from "zod";
import { cn } from "../../../utils/core";

const golferSchema = z.object({
  groups: z
    .array(
      z.object({
        golfers: z
          .array(z.number())
          .length(2, "You must select exactly 2 golfers."),
      }),
    )
    .length(5, "All five groups must be filled"),
});
type FormData = {
  groups: { golfers: number[] }[];
};
// Explicitly type the required fields for the form using Pick/Omit
type GolferFormFields = Pick<
  Golfer,
  "apiId" | "playerName" | "worldRank" | "rating" | "group"
>;
type TournamentFormFields = Pick<Tournament, "id">;
type TourCardFormFields = Pick<TourCard, "id">;

export function CreateTeamForm({
  tournament,
  tourCard,
  setPickingTeam,
  groups,
  initialGroups,
  isLoadingGolfers,
  golfersError,
  teamError,
}: {
  tournament: TournamentFormFields;
  tourCard: TourCardFormFields;
  setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
  groups: { key: string; golfers: GolferFormFields[] }[];
  initialGroups: { golfers: number[] }[];
  isLoadingGolfers: boolean;
  golfersError: any;
  teamError: any;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: { groups: initialGroups },
    resolver: zodResolver(golferSchema),
    mode: "onChange",
  });
  const currentValues = watch();
  const isFormFilled =
    currentValues.groups?.every((group) => group.golfers?.length === 2) &&
    currentValues.groups.length === 5;
  if (golfersError || teamError) {
    return (
      <ErrorMessage
        message={`Error loading data: ${golfersError ?? teamError}`}
      />
    );
  }
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await teamCreateOnFormSubmit({
        tourCardId: tourCard.id,
        tournamentId: tournament.id,
        value: data,
      });
      setPickingTeam(false);
      await utils.team.invalidate();
      router.push(`/tournament?id=${tournament.id}`);
    } catch (error) {
      console.error("Error submitting team:", error);
      setFormError("There was an error creating your team. Please try again.");
      setIsSubmitting(false);
    }
  };
  const onError = () => {
    setFormError("You must pick exactly 2 golfers from each group.");
  };
  if (isLoadingGolfers) {
    return <LoadingState message="Loading golfers..." />;
  }
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white px-2 shadow-md">
      <h2 className="mb-2 text-center text-2xl font-bold">
        {initialGroups.flat().length > 0
          ? "Edit Your Team"
          : "Create Your Team"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {groups.map((group, groupIndex) => (
          <GolferGroup
            key={group.key}
            group={group}
            groupIndex={groupIndex}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        ))}
        {formError && <ErrorMessage message={formError} />}
        <div className="mt-8 flex">
          <Button
            type="submit"
            variant="action"
            className="mx-auto w-full max-w-lg text-xl"
            size="xl"
            disabled={isSubmitting || (!isValid && !isFormFilled)}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                {initialGroups.flat().length > 0
                  ? "Updating Team..."
                  : "Creating Team..."}
              </>
            ) : initialGroups.flat().length > 0 ? (
              "Update Team"
            ) : (
              "Submit Team"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function GolferGroup({
  group,
  groupIndex,
  control,
  watch,
  setValue,
  errors,
}: {
  group: { key: string; golfers: GolferFormFields[] };
  groupIndex: number;
  control: ReturnType<typeof useForm<FormData>>["control"];
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  errors: ReturnType<typeof useForm<FormData>>["formState"]["errors"];
}) {
  const fieldPath = `groups.${groupIndex}.golfers`;
  const selectedGolfers = watch(fieldPath as `groups.${number}.golfers`);
  const groupNumber = group.key.slice(-1);
  return (
    <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Group {groupNumber}</h3>
        <span className="text-sm text-gray-500">
          Selected: {selectedGolfers.length}/2
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {group.golfers.map((golfer) => (
          <GolferSelection
            key={golfer.apiId}
            golfer={golfer}
            fieldPath={fieldPath as `groups.${number}.golfers`}
            control={control}
            selectedGolfers={selectedGolfers}
            setValue={setValue}
          />
        ))}
      </div>
      {errors.groups?.[groupIndex]?.golfers && (
        <p className="mt-2 text-sm text-red-500">
          {errors.groups[groupIndex].golfers.message}
        </p>
      )}
    </div>
  );
}
function GolferSelection({
  golfer,
  fieldPath,
  control,
  selectedGolfers,
  setValue,
}: {
  golfer: GolferFormFields;
  fieldPath: `groups.${number}.golfers`;
  control: ReturnType<typeof useForm<FormData>>["control"];
  selectedGolfers: number[];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
}) {
  const isChecked = selectedGolfers.includes(golfer.apiId);
  const isDisabled = !isChecked && selectedGolfers.length >= 2;
  const handleToggle = () => {
    const updatedGolfers = isChecked
      ? selectedGolfers.filter((id) => id !== golfer?.apiId)
      : [...selectedGolfers, golfer?.apiId];
    setValue(
      fieldPath,
      updatedGolfers.filter((id): id is number => !!id),
    );
  };
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-all",
        {
          "border-green-300 bg-green-100 shadow-sm": isChecked,
          "border-gray-300 bg-white hover:bg-gray-50":
            !isChecked && !isDisabled,
          "h-1 cursor-not-allowed border-none opacity-40":
            isDisabled && !isChecked,
        },
      )}
    >
      <Controller
        name={fieldPath}
        control={control}
        render={() => (
          <input
            type="checkbox"
            className="hidden"
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleToggle}
          />
        )}
      />
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">#{golfer.worldRank ?? "N/A"}</span>
          <span className="pr-2 font-medium">{golfer.playerName}</span>
        </div>
        <span className="text-sm">{golfer.rating}</span>
      </div>
    </label>
  );
}

// --- UI Helpers ---
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-center text-red-800">
      {message}
    </div>
  );
}
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
