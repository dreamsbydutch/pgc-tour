"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import type { Course, Golfer, TourCard, Tournament } from "@prisma/client";
import { Button } from "@/src/app/_components/ui/button";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { api } from "@/src/trpc/react";
import { teamCreateOnFormSubmit } from "@/src/server/api/actions/team";
import { useMainStore } from "@/src/lib/store/store";
import { GolferGroup } from "../_components/GolferGroup";

// Define Zod schema for form validation
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

// Types
type InputGroups = {
  key: string;
  golfers: Golfer[];
}[];

/**
 * Form data type for golfer selection
 */
type FormData = {
  groups: { golfers: number[] }[];
};

/**
 * Empty groups template for initialization
 */
const emptyGroups: InputGroups = [
  { key: "group1", golfers: [] },
  { key: "group2", golfers: [] },
  { key: "group3", golfers: [] },
  { key: "group4", golfers: [] },
  { key: "group5", golfers: [] },
];

/**
 * Main page component for creating a team
 */
export default function CreateTeamPage({
  tournamentId,
  setPickingTeam,
}: {
  tournamentId: string;
  setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const tourCard = useMainStore((state) => state.currentTourCard);
  const tournament = useMainStore((state) =>
    state.seasonTournaments?.find(
      (tournament) => tournament.id === tournamentId,
    ),
  );
  const current = useMainStore((state) => state.currentTournament);
  const [pageError, setPageError] = useState<string | null>(null);

  // Handle errors at the page level
  useEffect(() => {
    if (!tournament && !pageError) {
      setPageError("Tournament not found");
    }
  }, [tournament, pageError]);

  if (!tournament) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading tournament details...</p>
      </div>
    );
  }

  // Determine if team creation is allowed
  const canCreateTeam = tourCard && !current;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 font-varela">
      <Button
        className="mb-6 flex w-fit flex-row items-center justify-center rounded-md border border-gray-400 px-2 py-0.5 transition-colors hover:bg-gray-100"
        onClick={() => setPickingTeam(false)}
        variant="secondary"
        size="sm"
      >
        <ArrowLeftIcon size={15} className="mr-1" /> Back To Tournament
      </Button>

      {pageError ? (
        <div className="rounded-md bg-red-50 p-4 text-center text-red-800">
          {pageError}
        </div>
      ) : !tourCard ? (
        <div className="rounded-md bg-amber-50 p-6 text-center text-amber-800">
          <h3 className="mb-2 text-xl font-bold">Tour Card Required</h3>
          <p>You need a Tour Card to pick a team for this tournament.</p>
        </div>
      ) : current ? (
        <div className="rounded-md bg-blue-50 p-6 text-center text-blue-800">
          <h3 className="mb-2 text-xl font-bold">Tournament In Progress</h3>
          <p>This tournament has already begun. Team selection is closed.</p>
        </div>
      ) : (
        <CreateTeamForm
          tournament={tournament}
          tourCard={tourCard}
          setPickingTeam={setPickingTeam}
        />
      )}
    </div>
  );
}

/**
 * CreateTeamForm component for team creation/editing
 */
function CreateTeamForm({
  tournament,
  tourCard,
  setPickingTeam,
}: {
  tournament: Tournament & {
    course: Course | null;
  };
  tourCard: TourCard;
  setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch golfers data for this tournament
  const { data: golfersData, isLoading: isLoadingGolfers } =
    api.golfer.getByTournament.useQuery({
      tournamentId: tournament.id,
    });

  // Get user's existing team if they already created one
  const { data: existingTeam } = api.team.getByUserTournament.useQuery({
    tourCardId: tourCard?.id ?? "",
    tournamentId: tournament.id,
  });

  // Organize golfers into their respective groups
  const groups = useMemo(() => {
    if (!golfersData) return [];

    return [1, 2, 3, 4, 5].map((groupNum) => ({
      key: `group${groupNum}`,
      golfers: golfersData
        .filter((golfer) => golfer.group === groupNum)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    }));
  }, [golfersData]);
  // Prepare initial group selections from existing team
  const initialGroups = useMemo(() => {
    if (!existingTeam) {
      // Create exactly 5 empty groups with empty golfer arrays
      return Array(5).fill({ golfers: [] });
    }

    // For existing teams, organize golfers into 5 groups
    const result = Array(5)
      .fill(null)
      .map(() => ({ golfers: [] as number[] }));

    existingTeam.golferIds.forEach((golferId, index) => {
      const groupIndex = Math.floor(index / 2);
      if (groupIndex < 5) {
        result[groupIndex]?.golfers.push(golferId);
      }
    });

    return result;
  }, [existingTeam]);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      groups: initialGroups,
    },
    resolver: zodResolver(golferSchema),
    mode: "onChange", // Validate on change for better user feedback
  });

  // Debug form state
  const currentValues = watch();
  const isFormFilled =
    currentValues.groups?.every((group) => group.golfers?.length === 2) &&
    currentValues.groups.length === 5;

  /**
   * Handle form submission
   */
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

  /**
   * Handle validation errors
   */
  const onError = () => {
    setFormError("You must pick exactly 2 golfers from each group.");
  };

  // Show loading state while fetching golfers data
  if (isLoadingGolfers) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading golfers...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white px-2 shadow-md">
      <h2 className="mb-2 text-center text-2xl font-bold">
        {existingTeam ? "Edit Your Team" : "Create Your Team"}
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
        {formError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-center text-red-800">
            {formError}
          </div>
        )}
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
                {existingTeam ? "Updating Team..." : "Creating Team..."}
              </>
            ) : existingTeam ? (
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
