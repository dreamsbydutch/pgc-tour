# Team Scoring Update System

This system handles the calculation and updating of team scores for tournaments based on golfer performance.

## Structure

### `/route.ts`

Main API endpoint that orchestrates the team update process.

### `/lib/` Directory

#### Core Files

- **`types.ts`** - Type definitions and constants
- **`team-update-service.ts`** - Main orchestration service
- **`team-scoring.ts`** - Team scoring calculation logic
- **`index.ts`** - Exports all lib functions

#### Specialized Modules

- **`scoring.ts`** - Round scoring and golfer evaluation logic
- **`positions.ts`** - Position calculation and leaderboard management
- **`tee-times.ts`** - Tee time calculation for teams
- **`database.ts`** - Database operations
- **`utils.ts`** - Utility functions

## Business Rules

### Scoring Rules

- **Rounds 1-2**: Use ALL golfers on the team for scoring
- **Rounds 3-4**: Use TOP 5 golfers based on individual round scores (if team has ≥5 golfers)
- **Cut Logic**: Teams with <5 golfers in rounds 3-4 are marked as "CUT"

### Penalties

- **WD/DQ**: +8 strokes penalty applied to par
- **Missing Data**: Treated as null (no penalty for CUT golfers)

### Tee Times

- **Rounds 1-2**: Use earliest tee time from all golfers
- **Rounds 3-4**: Use 5th latest tee time from all golfers

## Data Flow

1. **Fetch Data** - Get tournament, golfers, and teams from database
2. **Create Teams with Golfers** - Map golfers to their respective teams
3. **Calculate Scoring** - Process each team's scores based on business rules
4. **Update Positions** - Calculate leaderboard positions within each tour
5. **Calculate Prizes** - Determine points and earnings for completed tournaments
6. **Update Database** - Persist all changes to the database

## Usage

The system is triggered via a GET request to the cron endpoint:

- Production: `https://www.pgctour.ca/api/cron/update-teams`
- Development: `http://localhost:3000/api/cron/update-teams`

## Key Functions

### `updateAllTeams()`

Main orchestrator that processes all teams for a tournament.

### `calculateTeamScoring()`

Calculates all scoring data for a single team including:

- Round scores
- Total score
- Today's score
- Holes completed (thru)
- Cut status

### `calculatePositions()`

Determines current and past positions for teams within their tour.

### `calculatePointsAndEarnings()`

Calculates points and earnings for completed tournaments, handling tied positions.

## Error Handling

The system includes comprehensive error handling:

- Missing tournament data
- Invalid golfer data
- Database connection issues
- Calculation errors

All errors are logged and appropriate HTTP responses are returned.
