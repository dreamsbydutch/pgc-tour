"use client";

import { cn, formatMoney, formatNumber, formatRank } from "@/src/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../_components/ui/table";
import { TournamentLogo } from "../../_components/OptimizedImage";
import { useMainStore } from "@/src/lib/store/store";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

/**
 * RulebookPage Component
 *
 * Displays the rulebook for the PGC Tour.
 * - Includes sections for schedule, rosters, scoring, playoffs, and payouts.
 * - Uses the refactored component structure for better organization.
 */
export default function RulebookPage() {
  return <RulebookMainView />;
}
