import type { Golfer } from "@prisma/client";

export function avg(nums: number[]): number | null {
  const list = nums.filter((n) => Number.isFinite(n));
  if (!list.length) return null;
  const total = list.reduce((a, b) => a + b, 0);
  return total / list.length;
}

export function avgField(golfers: Golfer[], key: keyof Golfer): number | null {
  const vals = golfers.map((g) =>
    typeof g[key] === "number" ? (g[key] as unknown as number) : 0,
  );
  return avg(vals);
}

export function avgToday(golfers: Golfer[]): number | null {
  return avg(golfers.map((g) => g.today ?? 0));
}

export function avgThru(golfers: Golfer[]): number | null {
  return avg(golfers.map((g) => g.thru ?? 0));
}

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
