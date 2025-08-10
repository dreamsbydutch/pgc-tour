# Team Score Calculations – Regular Season and Playoffs

This document is the single source of truth for how team scores are computed across the Regular Season and the three-event Playoffs series. It defines inputs/outputs, selection rules, live vs post behavior, CUT logic, series carryover, starting strokes, payouts, tee times, and testing.

## Table of Contents

1. Scope and Goals
2. Terminology and Shared Concepts
3. Regular Season Rules
4. Playoffs Series Rules (3 Events)
5. Tee Times Policy
6. Edge Cases and Defaults
7. Determinism and Tie‑Breaking
8. File Structure (proposed)
9. Public APIs (proposed)
10. Testing Plan
11. Data Persistence and Idempotency

---

## 1) Scope and Goals

- Make calculations deterministic, testable, and easy to maintain.
- De-duplicate math via small utilities (selection, aggregates, guards, formatting, tee times).
- Preserve existing behavior where already implemented.

## 2) Terminology and Shared Concepts

- Team: 10 drafted golfers (by `apiId`).
- Active golfer: golfer whose position/status is not CUT, DQ, or WD (checked via `isCutStatus`).
- Over‑par for round N: `(roundN ?? 0) - course.par`.
- Averages: arithmetic mean across the required group (10, 5, or 3), rounded via `roundDecimal` before returning.
- Live vs Post:
  - Live: `today` and `thru` come from current live fields; `score` combines completed‑round over‑par averages plus the live `today` for the in‑progress round.
  - Post: `today` is the last completed round’s over‑par average; `thru = 18`; `score` is the sum of per‑round over‑par averages for completed rounds.
- CUT: if the round requires top‑N and fewer than N active golfers are available, the team is CUT for that state (avoid divide‑by‑zero and mis-scoring).
- Rounding: Only at the public output boundary using `roundDecimal`.

## 3) Regular Season Rules

Selection by round

- Round 1: all 10 golfers
- Round 2: all 10 golfers
- Round 3: top 5 active golfers for that round
- Round 4: top 5 active golfers for that round
- Round 3 and Round 4 selections are independent and can differ.

Per‑round behavior

- Round 1
  - Live: `today`, `thru`, `score` averaged across all 10 based on live data; round fields remain null.
- Round 2
  - Always set `roundOne` = average of all 10 `roundOne`.
  - Pre: `today = avgOverPar(roundOne, all 10)`, `thru = 18`, `score = avgOverPar(roundOne, all 10)`.
  - Live: `today`, `thru` averaged across all 10 (live); `score = avgOverPar(roundOne, all 10) + avg(live today, all 10)`.
- Round 3
  - Always set `roundOne`, `roundTwo` as averages across all 10.
  - CUT if active < 5.
  - Pre: `today = avgOverPar(roundTwo, all 10)`, `thru = 18`, `score = avgOverPar(roundOne, all 10) + avgOverPar(roundTwo, all 10)`.
  - Live: select top‑5 active for round 3; `today`, `thru` averaged across those 5; `score = avgOverPar(R1,10) + avgOverPar(R2,10) + avg(live today, top‑5)`.
- Round 4
  - CUT if active < 5.
  - Set `roundOne`, `roundTwo` = averages across all 10; `roundThree` = average across the round‑3 top‑5 (not the round‑4 top‑5).
  - Pre: `today = avgOverPar(roundThree, round‑3 top‑5)`, `thru = 18`, `score = avgOverPar(R1,10) + avgOverPar(R2,10) + avgOverPar(R3, top‑5)`.
  - Live: select top‑5 for round 4; `today`, `thru` averaged across those 5; `score = avgOverPar(R1,10) + avgOverPar(R2,10) + avgOverPar(R3, top‑5) + avg(live today, round‑4 top‑5)`.
- Round 5 (post‑tournament)
  - CUT if active < 5.
  - Set `roundOne`, `roundTwo` across all 10; `roundThree`, `roundFour` across their respective top‑5 selections.
  - `today = avgOverPar(roundFour, round‑4 top‑5)`, `thru = 18`.
  - `score = sum of over‑par averages: R1(10) + R2(10) + R3(5) + R4(5)`.

Fields

- roundOne..roundFour: per‑round averages as defined above.
- today, thru: live/post semantics as above.
- score: cumulative tournament total (over‑par averages plus live contribution when applicable).
- position/pastPosition/points/earnings: defaulted at end; see Playoffs policy overrides below.

## 4) Playoffs Series Rules (3 Events)

Overview

- Three tournaments scored as a connected series and linked by `tourCardID`.
- Event 1 adds “starting strokes” from playoff standings; Events 2/3 carry in prior event totals.
- Per‑event selection counts by round:
  - Event 1: [10, 10, 5, 5]
  - Event 2: [5, 5, 5, 5]
  - Event 3: [3, 3, 3, 3]
- For each event, per‑round selection is independent (can change each round).

Starting Strokes (Event 1 only)

- Source: `playoffTier.points` (use first 75 entries: indices 0..74).
- Basis: playoff standings rank, NOT `tourCards.position` (regular season standings).
- Range: typically −10..0; negative reduces the total (advantage).
- Applied once at Event 1 start to `score` only (never to `today`/`thru`). Ranks > 75 map to 0.

Carry‑In

- Event 2 starts with carry‑in = Event 1 final total (which already includes starting strokes).
- Event 3 starts with carry‑in = Event 2 final total.
- Carry‑in contributes to `score` only (never to `today`/`thru`).

Earnings and Points Policy

- Event 1: points = 0, earnings = 0 (even post).
- Event 2: points = 0, earnings = 0 (even post).
- Event 3: points = 0; earnings paid per bracket and final position.

Payouts (Event 3 only)

- Source: `playoffTier.payouts` (length ≥ 150 expected).
- Gold bracket: indices 0..74 (positions 1..75).
- Silver bracket: indices 75..149 (positions 76..150).
- Use team’s final position within its bracket to index the correct slice.

Eligibility in Playoffs (No CUTs)

- Unlike the regular season, playoff teams are never CUT.
- If a playoff team has no golfers (`golferIds` is `[]`) or has fewer active golfers than the required per‑round selection count (10/5/3 depending on event/round), the team remains eligible and receives a fallback score for that round/day.

Worst‑of‑Day Fallback (Playoffs)

- Purpose: ensure playoff teams without sufficient eligible golfers still accrue a fair daily contribution without elimination.
- Bracket scope: compute fallback strictly within the team’s playoff bracket (Gold or Silver) and never outside it.
- Definition of "worst of the day":
  - Live: among eligible teams in the same bracket for the current round, compute each team’s live daily contribution used in `score` for that round (based on that event’s per‑round selection count). Use the maximum (worst) value. Set the ineligible team’s `today` equal to that maximum; set `thru` to the worst team’s `thru` (or 18 if unavailable). Add this daily contribution to `score` as usual (plus any carry‑in/starting strokes rules).
  - Post: among eligible teams in the same bracket, compute the per‑round over‑par average used for that round (per selection count). Use the maximum (worst) value as the team’s per‑round contribution. Reflect this in `roundN` and in `score`. Set `thru = 18` and `today` to that per‑round over‑par for the last completed round if needed.
- No valid peer teams edge case: if no valid teams exist to derive a fallback, use 0 as the daily contribution.

## 5) Tee Times Policy

- Source fields (per golfer): `roundOneTeeTime`, `roundTwoTeeTime`, `roundThreeTeeTime`, `roundFourTeeTime`.
- Team fields to populate: `roundOneTeeTime`, `roundTwoTeeTime`, `roundThreeTeeTime`, `roundFourTeeTime` on the Team.
- When populated:
  - Round 1: set team `roundOneTeeTime` from available golfer tee times for round 1. Round 2 tee times are often available from the start; set team `roundTwoTeeTime` as soon as those golfer tee times are present.
  - Round 2: ensure team `roundTwoTeeTime` is set if golfer tee times exist.
  - Round 3: tee times usually publish after round 2 completes. When golfer `roundThreeTeeTime` values appear, set team `roundThreeTeeTime`.
  - Round 4: tee times usually publish after round 3 completes. When golfer `roundFourTeeTime` values appear, set team `roundFourTeeTime`.
- How computed: use the earliest tee time among the team’s golfers for that round (minimum time). If parsing timestamps fails, fall back to the lexicographically smallest non-empty time string.
- Applies to both Regular Season and Playoffs; does not affect scoring selection.

## 6) Edge Cases and Defaults

- No selected golfers: return safe defaults (null rounds/today/thru/score; default position/pastPosition/points/earnings).
- Missing numeric values: treated as 0 in aggregation, but for selection/ranking, missing is considered worst.
- Guard all top‑N divisions with active counts to avoid divide‑by‑zero.

## 7) Determinism and Tie‑Breaking

- When ranking golfers for per‑round selection with equal values, apply a deterministic tiebreaker:
  1. Better cumulative tournament `score` if available, else
  2. Lower `apiId` as stable fallback.

## 8) File Structure (proposed)

```
regular-season/
  calculator.ts            # orchestrator; delegates to per-round calculators
  README.md                # this file
  rounds/
    round1.ts
    round2.ts
    round3.ts
    round4.ts
    post.ts                # round 5
  utils/
    selection.ts           # team/active selection + per-round top-N selection
    aggregates.ts          # averaging & over-par helpers, today/thru helpers
    guards.ts              # CUT checks
    teeTimes.ts            # tee time helpers
    formatting.ts          # rounding/null-safe utils
  index.ts                 # optional barrel

playoffs/
  orchestrator.ts          # applies starting strokes, carry-in, delegates to event calc
  utils/
    startingStrokes.ts     # map playoff standings rank -> starting strokes
    aggregateSeries.ts     # sum per-event totals by tourCardID
  README.md                # optional series-specific guide
```

## 9) Public APIs (proposed)

- Regular Season
  - `calculateRegularSeasonTeamScore(team, allGolfers, tournament): Team & TeamCalculation`
- Playoffs
  - `calculatePlayoffEventScore({ eventIndex, team, allGolfers, tournament, bracket, startingStrokes, carryIn, selectCountsByRound, worstOfDayProvider }): Team & TeamCalculation & { startingStrokesApplied: number, carryInApplied: number }`
    - `worstOfDayProvider({ bracket, eventIndex, roundNumber, live }): { todayContribution: number, thru?: number, overParContribution?: number }` returns the worst daily contribution in the bracket for the specified context.
  - `calculatePlayoffSeriesTotals(byTourCardId: Map<TourCardID, Array<{ eventIndex, teamResult, startingStrokesApplied, carryInApplied }>>): { playoffTotalByTourCardId, perEventTotalsByTourCardId }`

## 10) Testing Plan

- Selection
  - Exactly N active, >N active, <N active per round; R3 vs R4 independence.
- Aggregates
  - Null/missing handling, rounding precision, over‑par math.
- Regular Season rounds
  - R1/R2 live vs pre; tee times; totals.
  - R3/R4 CUT boundary and live/post totals.
  - Post‑tournament (R5) totals.
- Tee Times
  - Team round tee times populate at the expected stages and prefer the earliest golfer tee time.
- Playoffs Event 1
  - Starting strokes mapped from `playoffTier.points[0..74]` by playoff standings rank; applied to `score` only.
  - No points or earnings.
  - No CUTs; verify worst‑of‑day fallback used when team has empty `golferIds` or insufficient active.
- Playoffs Event 2
  - Carry‑in equals Event 1 final; selection top‑5 all rounds; no CUTs; worst‑of‑day fallback when insufficient active.
  - No points or earnings.
- Playoffs Event 3
  - Carry‑in equals Event 2 final; selection top‑3 all rounds; worst‑of‑day fallback when insufficient active.
  - Earnings paid from `playoffTier.payouts` using Gold [0..74] or Silver [75..149]; points = 0.
- Series aggregation
  - Correct cumulative totals across events, including partial live states and fallback days.
- Determinism
  - Ties resolved consistently using defined tie‑breakers.

## 11) Data Persistence and Idempotency

- Persist per `tourCardID` as needed for display; calculations read live golfer tee times and set team tee time fields when the source values become available.
- Ensure calculators are idempotent: do not re‑apply starting strokes or carry‑in more than once per recompute cycle.
- Enforce playoff points/earnings policy in calculators regardless of defaults.
