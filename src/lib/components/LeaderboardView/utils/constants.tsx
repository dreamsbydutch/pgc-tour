/**
 * Constants and configuration for LeaderboardView
 */

import { type ReactElement } from "react";
import * as CountryFlags from "country-flag-icons/react/3x2";

interface CountryFlagItem {
  readonly key: string;
  readonly image: () => ReactElement;
}

export const COUNTRY_FLAG_DATA: readonly CountryFlagItem[] = [
  { key: "USA", image: () => <CountryFlags.US /> },
  { key: "RSA", image: () => <CountryFlags.ZA /> },
  { key: "SWE", image: () => <CountryFlags.SE /> },
  { key: "KOR", image: () => <CountryFlags.KR /> },
  { key: "AUS", image: () => <CountryFlags.AU /> },
  { key: "FRA", image: () => <CountryFlags.FR /> },
  { key: "FIN", image: () => <CountryFlags.FI /> },
  { key: "JPN", image: () => <CountryFlags.JP /> },
  { key: "CHI", image: () => <CountryFlags.CN /> },
  { key: "ENG", image: () => <CountryFlags.GB /> },
  { key: "NOR", image: () => <CountryFlags.NO /> },
  { key: "ARG", image: () => <CountryFlags.AR /> },
  { key: "VEN", image: () => <CountryFlags.VE /> },
  { key: "DEN", image: () => <CountryFlags.DK /> },
  { key: "TPE", image: () => <CountryFlags.TW /> },
  { key: "CAN", image: () => <CountryFlags.CA /> },
  { key: "ITA", image: () => <CountryFlags.IT /> },
  { key: "GER", image: () => <CountryFlags.DE /> },
  { key: "IRL", image: () => <CountryFlags.IE /> },
  { key: "BEL", image: () => <CountryFlags.BE /> },
  { key: "COL", image: () => <CountryFlags.CO /> },
  { key: "PUR", image: () => <CountryFlags.PR /> },
  { key: "PHI", image: () => <CountryFlags.PH /> },
  { key: "NIR", image: () => <CountryFlags.GB /> },
  { key: "AUT", image: () => <CountryFlags.AT /> },
  { key: "SCO", image: () => <CountryFlags.GB /> },
] as const;

export const PLAYOFF_CONFIGS = {
  gold: {
    id: "gold",
    shortForm: "Gold",
    name: "Gold Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  silver: {
    id: "silver",
    shortForm: "Silver",
    name: "Silver Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNDs7T9FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  solo: {
    id: "playoffs",
    shortForm: "Playoffs",
    name: "PGC Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  pga: {
    id: "pga",
    shortForm: "PGA",
    name: "PGA Tour",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
  },
} as const;

export const SCORE_PENALTIES = {
  DQ: 999,
  WD: 888,
  CUT: 444,
} as const;
