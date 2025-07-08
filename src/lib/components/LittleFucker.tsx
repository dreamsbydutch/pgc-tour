import Image from "next/image";
import { cn, isDate } from "@/lib/utils/main";

export default function LittleFucker({
  champions,
  showSeasonText,
}: {
  champions: {
    id: number;
    tournament: {
      name: string;
      logoUrl: string | null;
      startDate: Date;
    };
  }[];
  showSeasonText: boolean;
}) {
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
  const isTourChamp = tournament.name === "TOUR Championship";
  const isCanadianOpen =
    tournament.name === "RBC Canadian Open" ||
    tournament.name === "Canadian Open";
  const logoUrl = isCanadianOpen
    ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
    : isTourChamp
      ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
      : (tournament.logoUrl ?? "");

  const imgClass = cn(
    "inline-block",
    isCanadianOpen
      ? "h-6 w-6 p-0.5 mx-0"
      : isTourChamp
        ? "h-8 w-8 mx-0.5"
        : "h-6 w-6 mx-0.5",
  );

  const textClass = cn(
    "font-semibold text-slate-800",
    isTourChamp ? "text-xs" : "text-2xs",
  );

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
