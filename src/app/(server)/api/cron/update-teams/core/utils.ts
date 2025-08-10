export const roundDecimal = (n: number | null | undefined, places = 2) =>
  n == null ? null : Math.round(n * 10 ** places) / 10 ** places;

export const isCutStatus = (pos?: string | null) =>
  pos ? /CUT|WD|DQ/i.test(pos) : false;
