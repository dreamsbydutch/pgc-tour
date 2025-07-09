import Image from "next/image";
import { cn, isDate } from "@/lib/utils/main";

/**
 * LittleFucker Component
 *
 * Displays a row of trophy icons for champion teams, each with an tournament logo and optional season/year text.
 *
 * @param champions - Array of champion objects, each with an id and tournament details
 * @param showSeasonText - Whether to display the tournament year below the trophy icon
 */
export default function LittleFucker({
  champions,
  showSeasonText,
}: {
  champions:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
  showSeasonText: boolean;
}) {
  if (!champions || champions.length === 0) return null;
  return (
    <div className="flex flex-row">
      {champions.map((team) => (
        <TrophyIcon
          key={team.id}
          {...{ team, showSeasonText, tournament: team.tournament }}
        />
      ))}
    </div>
  );
}

/**
 * TrophyIcon Component
 *
 * Renders a single trophy icon (tournament logo) and optionally the year for a champion team.
 * Handles special cases for TOUR Championship and Canadian Open logos.
 *
 * @param tournament - Tournament details (name, logoUrl, startDate)
 * @param team - Team object (id)
 * @param showSeasonText - Whether to display the year below the icon
 */
function TrophyIcon({
  tournament,
  team,
  showSeasonText,
}: {
  tournament: {
    name: string;
    logoUrl: string | null;
    startDate: Date;
  };
  team: { id: number };
  showSeasonText: boolean;
}) {
  // Special logo for TOUR Championship
  const isTourChamp = tournament.name === "TOUR Championship";
  // Special logo for Canadian Open
  const isCanadianOpen =
    tournament.name === "RBC Canadian Open" ||
    tournament.name === "Canadian Open";
  // Select logo URL based on tournament
  const logoUrl = isCanadianOpen
    ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
    : isTourChamp
      ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
      : (tournament.logoUrl ?? "");

  // Set image class based on tournament
  const imgClass = cn(
    "inline-block",
    isCanadianOpen
      ? "h-6 w-6 p-0.5 mx-0"
      : isTourChamp
        ? "h-8 w-8 mx-0.5"
        : "h-6 w-6 mx-0.5",
  );

  // Set text class based on tournament
  const textClass = cn(
    "font-semibold text-slate-800",
    isTourChamp ? "text-xs" : "text-2xs",
  );

  // Get year from startDate (handles both Date and string)
  const year = isDate(tournament.startDate)
    ? tournament.startDate.getFullYear()
    : new Date(tournament.startDate).getFullYear();

  return (
    <div className="flex flex-col items-center justify-center" key={team.id}>
      <Image
        src={logoUrl}
        alt={`${tournament.name} Championship Logo`}
        width={128}
        height={128}
        className={imgClass}
      />
      {showSeasonText && <span className={textClass}>{year}</span>}
    </div>
  );
}
