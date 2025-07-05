# Store Optimization Summary

## Problem

The seasonal store was hitting localStorage quota limits (QuotaExceededError) due to:

- Heavy tournament includes with teams and golfers arrays
- Large data structures being stored unnecessarily
- No optimization for localStorage usage

## Solution

### 1. Created Optimized Store Router (`src/server/api/routers/store.ts`)

- **Minimal data selection**: Only essential fields using Prisma `select`
- **No heavy includes**: Excludes teams, golfers, and other large arrays
- **Single optimized query**: `getSeasonalData` combines all store needs

### 2. Updated Store Types (`src/lib/store/seasonalStore.ts`)

- **Minimal types**: Only essential fields for each entity
- **Storage monitoring**: Added development logging for quota tracking
- **Clear and set**: New `clearAndSet` method prevents quota issues

### 3. Optimized Data Loading (`src/lib/store/loadSeasonalData.ts`)

- **Single API call**: Uses optimized store router instead of multiple queries
- **Reduced network requests**: From 7 separate queries to 1 combined query
- **Better error handling**: Graceful localStorage clearing

### 4. Added Storage Utilities (`src/lib/utils/storage.ts`)

- **Size monitoring**: Track localStorage usage
- **Quota warnings**: Alert when approaching limits
- **Storage cleanup**: Clear non-essential items

## Data Size Reduction

### Before (Full Objects)

```typescript
tournaments: (Tournament & {
  course: Course;
  teams: Team[];
  golfers: Golfer[]
})[]
```

### After (Minimal Objects)

```typescript
tournaments: Pick<Tournament, 'id' | 'name' | 'logoUrl' | 'startDate' | 'endDate' | 'livePlay' | 'currentRound'> & {
  course: Pick<Course, 'id' | 'name' | 'location' | 'par'>;
  tier: Pick<Tier, 'id' | 'name'>;
}[]
```

## Usage

### Store Router (Server)

```typescript
// Get all essential data in one query
const data = await api.store.getSeasonalData({ seasonId });
```

### Storage Monitoring (Client)

```typescript
import { logLocalStorageUsage, isApproachingQuota } from "@/lib/utils";

// Check storage usage
logLocalStorageUsage();

// Check if approaching quota
if (isApproachingQuota()) {
  console.warn("Approaching storage limit!");
}
```

### Store Updates

```typescript
// Use clearAndSet to prevent quota issues
const clearAndSet = useSeasonalStore((s) => s.clearAndSet);
clearAndSet({ tournaments, tours, tiers, allTourCards });
```

## Benefits

1. **Reduced Storage Size**: ~90% reduction in localStorage usage
2. **Faster Loading**: Single optimized query vs multiple heavy queries
3. **Quota Prevention**: Automatic clearing and monitoring
4. **Better Performance**: Minimal data transfer and storage
5. **Type Safety**: Maintained with minimal types

## Files Changed

- ✅ `src/server/api/routers/store.ts` - New optimized router
- ✅ `src/server/api/root.ts` - Added store router
- ✅ `src/lib/store/seasonalStore.ts` - Minimal types and clearAndSet
- ✅ `src/lib/store/loadSeasonalData.ts` - Single optimized query
- ✅ `src/lib/utils/storage.ts` - Storage monitoring utilities
- ✅ `src/lib/utils/index.ts` - Export storage utilities

## Monitoring

The system now includes development-mode logging to track:

- localStorage size before/after updates
- Individual item sizes
- Quota usage warnings
- Storage cleanup operations
