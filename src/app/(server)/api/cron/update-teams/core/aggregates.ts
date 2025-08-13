import type { Golfer } from "@prisma/client";

/**
 * Compute the arithmetic mean of a list of numbers.
 *
 * Behavior
 * - Filters out non-finite values before averaging
 * - Returns null when the input has no finite values
 *
 * @param nums Input numbers
 * @returns Average or null when empty after filtering
 */
export function avg(nums: number[]): number | null {
  const list = nums.filter((n) => Number.isFinite(n));
  if (!list.length) return null;
  const total = list.reduce((a, b) => a + b, 0);
  return total / list.length;
}

/**
 * Average a numeric field across a set of golfers.
 *
 * Notes
 * - Non-numeric values are treated as 0 for averaging
 * - Use specialized helpers when possible (e.g., avgToday, avgThru)
 *
 * @param golfers List of golfers
 * @param key     A Golfer key whose value is numeric per our domain model
 * @returns Average value or null when no finite values
 */
export function avgField(golfers: Golfer[], key: keyof Golfer): number | null {
  const vals = golfers.map((g) =>
    typeof g[key] === "number" ? (g[key] as unknown as number) : 0,
  );
  return avg(vals);
}

/**
 * Average the "today" (round-relative over/under) values across golfers.
 */
export function avgToday(golfers: Golfer[]): number | null {
  return avg(golfers.map((g) => g.today ?? 0));
}

/**
 * Average the "thru" (holes completed) values across golfers.
 */
export function avgThru(golfers: Golfer[]): number | null {
  return avg(golfers.map((g) => g.thru ?? 0));
}

/**
 * Average over/under par for a given completed round key across golfers.
 *
 * Implementation
 * - Converts raw round strokes to over/under by subtracting course par
 * - Non-numeric/null round values are treated as 0 (par) before subtraction
 *
 * @param golfers List of golfers
 * @param roundKey One of roundOne|roundTwo|roundThree|roundFour
 * @param par Course par used to translate raw to over/under
 * @returns Average over/under par or null when no finite values
 */
export function avgOverPar(
  golfers: Golfer[],
  roundKey: keyof Pick<
    Golfer,
    "roundOne" | "roundTwo" | "roundThree" | "roundFour"
  >,
  par: number,
): number | null {
  const vals = golfers.map(
    (g) => ((g[roundKey] as unknown as number | null) ?? 0) - par,
  );
  return avg(vals);
}
