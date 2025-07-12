/**
 * Utility functions
 */

/**
 * Rounds a number to one decimal place
 */
export function roundToOneDecimal(
  value: number | null | undefined,
): number | null {
  return value === null || value === undefined
    ? null
    : Math.round(value * 10) / 10;
}
