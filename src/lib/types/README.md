# Types Module

This module contains TypeScript type definitions for external APIs and custom interfaces used throughout the PGC Tour application.

## 📁 Files Overview

### `datagolf_types.ts`
**DataGolf API type definitions**

**Purpose:** Provides TypeScript interfaces for the DataGolf API integration, which supplies golf tournament and player data.

## 🏌️ DataGolf API Types

### Core Types

#### Tournament Data
```typescript
export interface DataGolfTournament {
  event_id: string;
  event_name: string;
  tour: string;
  year: number;
  start_date: string;
  end_date: string;
  timezone: string;
  course: DataGolfCourse[];
  field: DataGolfPlayer[];
}

export interface DataGolfCourse {
  course_name: string;
  course_num: number;
  par: number;
  yardage: number;
}
```

#### Player Data
```typescript
export interface DataGolfPlayer {
  player_name: string;
  dg_id: number;
  country: string;
  amateur: boolean;
  rounds: DataGolfRound[];
}

export interface DataGolfRound {
  round_num: number;
  course_num: number;
  total_strokes: number;
  thru: number;
  round_status: 'complete' | 'active' | 'cut' | 'wd' | 'dq';
  tee_time?: string;
}
```

#### Leaderboard Data
```typescript
export interface DataGolfLeaderboard {
  event_id: string;
  last_updated: string;
  leaderboard: DataGolfLeaderboardEntry[];
}

export interface DataGolfLeaderboardEntry {
  player_name: string;
  dg_id: number;
  country: string;
  position: number;
  total_strokes: number;
  total_to_par: number;
  rounds: number[];
  prize_money?: number;
  points?: number;
  status: 'active' | 'cut' | 'wd' | 'dq' | 'complete';
}
```

#### Odds and Predictions
```typescript
export interface DataGolfOdds {
  event_id: string;
  last_updated: string;
  odds: DataGolfPlayerOdds[];
}

export interface DataGolfPlayerOdds {
  player_name: string;
  dg_id: number;
  win_odds: number;
  top_5_odds: number;
  top_10_odds: number;
  top_20_odds: number;
  make_cut_odds: number;
}

export interface DataGolfPredictions {
  event_id: string;
  predictions: DataGolfPlayerPrediction[];
}

export interface DataGolfPlayerPrediction {
  player_name: string;
  dg_id: number;
  skill_score: number;
  baseline_history_fit: number;
  recent_history_fit: number;
  course_history_fit: number;
  projected_score: number;
}
```

### API Response Types

#### Standard API Response
```typescript
export interface DataGolfApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}
```

#### Specific Response Types
```typescript
export type TournamentResponse = DataGolfApiResponse<DataGolfTournament[]>;
export type LeaderboardResponse = DataGolfApiResponse<DataGolfLeaderboard>;
export type OddsResponse = DataGolfApiResponse<DataGolfOdds>;
export type PredictionsResponse = DataGolfApiResponse<DataGolfPredictions>;
```

## 🔄 Type Transformations

### Converting DataGolf to Internal Types
```typescript
import type { Tournament, Golfer } from '@prisma/client';
import type { DataGolfTournament, DataGolfPlayer } from './datagolf_types';

export function transformTournament(
  dgTournament: DataGolfTournament
): Omit<Tournament, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: dgTournament.event_name,
    start_date: new Date(dgTournament.start_date),
    end_date: new Date(dgTournament.end_date),
    external_id: dgTournament.event_id,
    tour: dgTournament.tour,
    timezone: dgTournament.timezone,
    course_count: dgTournament.course.length,
  };
}

export function transformPlayer(
  dgPlayer: DataGolfPlayer
): Omit<Golfer, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: dgPlayer.player_name,
    dg_id: dgPlayer.dg_id,
    country: dgPlayer.country,
    is_amateur: dgPlayer.amateur,
  };
}
```

### Leaderboard Transformations
```typescript
import type { DataGolfLeaderboardEntry } from './datagolf_types';

export interface PGCLeaderboardEntry {
  playerId: number;
  playerName: string;
  position: number;
  totalScore: number;
  toPar: number;
  rounds: number[];
  status: 'active' | 'cut' | 'complete' | 'withdrawn' | 'disqualified';
  country: string;
  prizeMoney?: number;
}

export function transformLeaderboardEntry(
  dgEntry: DataGolfLeaderboardEntry
): PGCLeaderboardEntry {
  return {
    playerId: dgEntry.dg_id,
    playerName: dgEntry.player_name,
    position: dgEntry.position,
    totalScore: dgEntry.total_strokes,
    toPar: dgEntry.total_to_par,
    rounds: dgEntry.rounds,
    status: mapStatus(dgEntry.status),
    country: dgEntry.country,
    prizeMoney: dgEntry.prize_money,
  };
}

function mapStatus(dgStatus: string): PGCLeaderboardEntry['status'] {
  switch (dgStatus) {
    case 'wd': return 'withdrawn';
    case 'dq': return 'disqualified';
    default: return dgStatus as PGCLeaderboardEntry['status'];
  }
}
```

## 🎯 Usage Examples

### Fetching Tournament Data
```typescript
import type { TournamentResponse } from '@/src/lib/types/datagolf_types';

async function fetchTournaments(): Promise<DataGolfTournament[]> {
  const response = await fetch('/api/datagolf/tournaments');
  const data: TournamentResponse = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error?.message || 'Failed to fetch tournaments');
  }
  
  return data.data || [];
}
```

### Type-Safe Leaderboard Processing
```typescript
import type { 
  DataGolfLeaderboard, 
  DataGolfLeaderboardEntry 
} from '@/src/lib/types/datagolf_types';

function processLeaderboard(leaderboard: DataGolfLeaderboard) {
  // Type-safe operations
  const activePlayers = leaderboard.leaderboard.filter(
    (entry: DataGolfLeaderboardEntry) => entry.status === 'active'
  );
  
  const leaderPositions = activePlayers
    .slice(0, 10)
    .map(entry => ({
      name: entry.player_name,
      position: entry.position,
      score: entry.total_to_par
    }));
    
  return leaderPositions;
}
```

### API Integration with Error Handling
```typescript
import type { LeaderboardResponse } from '@/src/lib/types/datagolf_types';

class DataGolfService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getLeaderboard(eventId: string): Promise<DataGolfLeaderboard> {
    const response = await fetch(
      `https://feeds.datagolf.com/leaderboards?event_id=${eventId}&key=${this.apiKey}`
    );
    
    const data: LeaderboardResponse = await response.json();
    
    if (data.status === 'error') {
      throw new DataGolfError(data.error?.message || 'API Error');
    }
    
    if (!data.data) {
      throw new DataGolfError('No leaderboard data available');
    }
    
    return data.data;
  }
}

class DataGolfError extends Error {
  constructor(message: string) {
    super(`DataGolf API Error: ${message}`);
    this.name = 'DataGolfError';
  }
}
```

## 🔧 Type Guards and Validation

### Runtime Type Checking
```typescript
export function isDataGolfTournament(obj: any): obj is DataGolfTournament {
  return (
    typeof obj === 'object' &&
    typeof obj.event_id === 'string' &&
    typeof obj.event_name === 'string' &&
    Array.isArray(obj.course) &&
    Array.isArray(obj.field)
  );
}

export function isDataGolfLeaderboardEntry(obj: any): obj is DataGolfLeaderboardEntry {
  return (
    typeof obj === 'object' &&
    typeof obj.player_name === 'string' &&
    typeof obj.dg_id === 'number' &&
    typeof obj.position === 'number' &&
    ['active', 'cut', 'wd', 'dq', 'complete'].includes(obj.status)
  );
}
```

### Zod Schemas for Validation
```typescript
import { z } from 'zod';

export const DataGolfTournamentSchema = z.object({
  event_id: z.string(),
  event_name: z.string(),
  tour: z.string(),
  year: z.number(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  timezone: z.string(),
  course: z.array(z.object({
    course_name: z.string(),
    course_num: z.number(),
    par: z.number(),
    yardage: z.number()
  })),
  field: z.array(z.object({
    player_name: z.string(),
    dg_id: z.number(),
    country: z.string(),
    amateur: z.boolean()
  }))
});

export const DataGolfLeaderboardSchema = z.object({
  event_id: z.string(),
  last_updated: z.string().datetime(),
  leaderboard: z.array(z.object({
    player_name: z.string(),
    dg_id: z.number(),
    country: z.string(),
    position: z.number(),
    total_strokes: z.number(),
    total_to_par: z.number(),
    rounds: z.array(z.number()),
    status: z.enum(['active', 'cut', 'wd', 'dq', 'complete'])
  }))
});
```

## 📋 Best Practices

### Type Organization
1. **Group Related Types:** Keep related interfaces together
2. **Use Descriptive Names:** Clear naming that reflects the data source
3. **Document Complex Types:** Add JSDoc comments for complex structures
4. **Version Control:** Track API version changes in type definitions

### Error Handling
```typescript
// ✅ Good - Specific error types
export class DataGolfApiError extends Error {
  constructor(
    message: string, 
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DataGolfApiError';
  }
}

// ✅ Good - Type-safe error responses
export interface DataGolfErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Extending Types
```typescript
// ✅ Good - Extend base types for internal use
export interface EnhancedDataGolfPlayer extends DataGolfPlayer {
  // Add internal fields
  internal_id?: string;
  last_synced?: Date;
  pgc_member_id?: string;
}

// ✅ Good - Create union types for flexible handling
export type PlayerStatus = 
  | 'active' 
  | 'cut' 
  | 'withdrawn' 
  | 'disqualified' 
  | 'complete';
```

## 🔄 Migration and Updates

### API Version Management
When DataGolf API updates, follow this pattern:

1. **Create Versioned Types**
```typescript
// v1 types (legacy)
export namespace DataGolfV1 {
  export interface Tournament { /* old structure */ }
}

// v2 types (current)
export namespace DataGolfV2 {
  export interface Tournament { /* new structure */ }
}

// Default export points to current version
export type DataGolfTournament = DataGolfV2.Tournament;
```

2. **Migration Functions**
```typescript
export function migrateV1toV2(v1Data: DataGolfV1.Tournament): DataGolfV2.Tournament {
  return {
    // Transform old structure to new
    event_id: v1Data.id,
    event_name: v1Data.name,
    // ... other transformations
  };
}
```

This type system ensures type safety across all DataGolf integrations while providing flexibility for API evolution.
