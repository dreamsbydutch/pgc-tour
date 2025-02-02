import type { Golfer, Team } from "@prisma/client";
import { type ClassValue, clsx } from "clsx";
import { formatDate, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date();
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(from, { addSuffix: true });
  } else {
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "MMM d");
    } else {
      return formatDate(from, "MMM d, yyyy");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(n);
}
export function formatCompactNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatMoney(number: number) {
  number = Number(number);
  if (Math.abs(number) >= 1e6) {
    return "$" + (number / 1e6).toFixed(1) + "M";
  } else if (Math.abs(number) >= 1e4) {
    return "$" + (number / 1e3).toFixed(0) + "k";
  } else if (Math.abs(number) === 0 || isNaN(number)) {
    return "-";
  } else {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(number);
  }
}

export function formatScore(score: number | null | "E") {
  switch (true) {
    case typeof score === "number" && score > 99:
      score = null;
      break;
    case typeof score === "number" && score > 0:
      score = "+" + score;
      break;
    case typeof score === "number" && score === 0:
      score = "E";
      break;
    default:
      break;
  }
  return score;
}
export function formatThru(thru: number, teetime: string) {
  if (+thru === 18) {
    return "F";
  } else if (+thru > 0) {
    return +thru;
  } else {
    return teetime;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function formatRank(number: number) {
  if (number < 20 && number > 5) {
    return number + "th";
  } else {
    if (number.toString().endsWith("1")) {
      return number + "st";
    } else if (number.toString().endsWith("2")) {
      return number + "nd";
    } else if (number.toString().endsWith("3")) {
      return number + "rd";
    } else {
      return number + "th";
    }
  }
}

export function formatName(name: string, type: "display" | "full") {
  const splitName = name.split(" ");
  const firstName =
    String(splitName[0]).charAt(0).toUpperCase() +
    String(splitName[0]).slice(1);
  const lastName =
    String(splitName.slice(1).toString()).charAt(0).toUpperCase() +
    String(splitName.slice(1).toString()).slice(1);
  return type === "full"
    ? firstName + " " + lastName
    : firstName.charAt(0).toUpperCase() + ". " + lastName;
}

export function getGolferTeeTime(golfer: Golfer) {
  const roundNames = ["One", "Two", "Three", "Four"];
  if (golfer.round === null) {
    throw new Error("Golfer round is null");
  }
  const teeTimeKey =
    `round${roundNames[golfer.round - 1]}TeeTime` as keyof Golfer;
  return formatTime(new Date(golfer[teeTimeKey] ?? ""));
}
export function getTeamTeeTime(team: Team) {
  const roundNames = ["One", "Two", "Three", "Four"];
  if (team.round === null) {
    throw new Error("Team round is null");
  }
  const teeTimeKey = `round${roundNames[team.round - 1]}TeeTime` as keyof Team;
  return formatTime(new Date((team[teeTimeKey] as string) ?? ""));
}
export function formatTime(time: Date) {
  return new Date(time ?? "").toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

export async function fetchDataGolf(
  queryType: DataGolfExports,
  queryParameters: Record<string, string> | null,
) {
  let fetchUrl = "";
  if (!queryParameters) {
    fetchUrl =
      process.env.EXTERNAL_DATA_API_URL +
      queryType +
      "?key=" +
      process.env.EXTERNAL_DATA_API_KEY;
  } else {
    const queryParametersString = Object.keys(queryParameters)
      .map((key) => key + "=" + queryParameters[key] + "&")
      .toString();
    fetchUrl =
      process.env.EXTERNAL_DATA_API_URL +
      queryType +
      "?" +
      queryParametersString +
      "key=" +
      process.env.EXTERNAL_DATA_API_KEY;
  }
  const request = await fetch(fetchUrl);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data;
}

type DataGolfExports =
  | "field-updates"
  | "preds/get-dg-rankings"
  | "preds/in-play"
  | "preds/live-hole-stats"
  | "preds/live-tournament-stats";
