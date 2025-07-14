import type { Tour } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { ToursToggleButton } from "../../functional/ToursToggle";

export interface ToursToggleProps {
  tours: Tour[];
  standingsToggle: string;
  setStandingsToggle: Dispatch<SetStateAction<string>>;
}

export function ToursToggle({
  tours,
  standingsToggle,
  setStandingsToggle,
}: ToursToggleProps) {
  if ((tours?.length ?? 0) <= 1) return null;

  return (
    <div className="mx-auto my-4 flex w-full flex-row items-center justify-center gap-4 text-center">
      {tours
        ?.sort((a, b) => a.shortForm.localeCompare(b.shortForm))
        .map((tour) => (
          <ToursToggleButton
            key={"toggle-" + tour.id}
            tour={tour}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        ))}
      <ToursToggleButton
        key={"toggle-playoffs"}
        tour={{
          id: "playoffs",
          shortForm: "Playoffs",
          logoUrl:
            "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
        }}
        tourToggle={standingsToggle}
        setTourToggle={setStandingsToggle}
      />
    </div>
  );
}
