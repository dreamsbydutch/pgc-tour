"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import type { Course, TourCard, Tournament } from "@prisma/client";
import { Button } from "@/lib/components/functionalComponents/ui/button";
import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import { api } from "@/trpc/react";
import { teamCreateOnFormSubmit } from "@/server/api/actions/team";
import { useTourCards, useUser } from "@/lib/hooks";
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

/**
 * Form data type for golfer selection
 */
type FormData = {
  groups: { golfers: number[] }[];
};

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
  const [pageError, setPageError] = useState<string | null>(null);

  // Use existing hooks and direct API calls for this specific component
  const { user } = useUser();
  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = api.tournament.getById.useQuery({ tournamentId });
  const { data: course, isLoading: courseLoading } =
    api.course.getById.useQuery(
      { courseID: tournament?.courseId! },
      { enabled: !!tournament?.courseId },
    );

  // Use new tour card hook for user's tour cards
  const tourCards = useTourCards({ memberIds: user?.id ? [user.id] : [] });
  const tourCard = tourCards?.find(
    (card) => card.seasonId === tournament?.seasonId,
  );

  // Construct tournament with course data for CreateTeamForm
  const tournamentWithCourse =
    tournament && course
      ? {
          ...tournament,
          course: course,
        }
      : null;

  // Handle errors at the page level
  useEffect(() => {
    if (tournamentError) {
      setPageError(`Tournament data error: ${tournamentError.message}`);
    } else if (!tournamentLoading && !tournament && !pageError) {
      setPageError("Tournament not found");
    }
  }, [tournament, pageError, tournamentError, tournamentLoading]);

  // Show loading state while data is being fetched
  if (tournamentLoading || courseLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament || !tournamentWithCourse) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="text-red-500">
          {pageError ?? "Tournament not found"}
        </div>
      </div>
    );
  }

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
      ) : !tournamentWithCourse ? (
        <div className="rounded-md bg-red-50 p-4 text-center text-red-800">
          {pageError ?? "Tournament not found"}
        </div>
      ) : (
        <CreateTeamForm
          tournament={tournamentWithCourse}
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
  // Use store hooks instead of direct tRPC calls
  const {
    golfers: golfersData,
    loading: isLoadingGolfers,
    error: golfersError,
  } = useGolfersByTournament(tournament.id);

  // Get user's existing team if they already created one
  const { team: existingTeam, error: teamError } = useTeamByUserTournament(
    tourCard?.id ?? "",
    tournament.id,
  );

  // Organize golfers into their respective groups - always call this hook
  const groups = useMemo(() => {
    if (!golfersData) return [];

    return [1, 2, 3, 4, 5].map((groupNum) => ({
      key: `group${groupNum}`,
      golfers: golfersData
        .filter((golfer) => golfer.group === groupNum)
        .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
    }));
  }, [golfersData]);

  // Prepare initial group selections from existing team - always call this hook
  const initialGroups = useMemo<{ golfers: number[] }[]>(() => {
    if (!existingTeam) {
      // Create exactly 5 empty groups with empty golfer arrays
      return Array.from({ length: 5 }, () => ({ golfers: [] as number[] }));
    }

    // For existing teams, organize golfers into 5 groups
    const result: { golfers: number[] }[] = Array.from({ length: 5 }, () => ({
      golfers: [] as number[],
    }));

    existingTeam.golferIds.forEach((golferId: number, index: number) => {
      const groupIndex = Math.floor(index / 2);
      if (groupIndex < 5) {
        result[groupIndex]?.golfers.push(golferId);
      }
    });

    return result;
  }, [existingTeam]);

  // Always call useForm hook
  const {
    control,
    handleSubmit,
    watch,
    setValue,
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

  // Handle errors after all hooks are called
  if (golfersError || teamError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="text-red-500">
          Error loading data: {golfersError ?? teamError}
        </div>
      </div>
    );
  }

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
