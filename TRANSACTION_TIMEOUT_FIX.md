# PRISMA TRANSACTION TIMEOUT FIX

## Problem

The golfer and team update cron jobs were experiencing Prisma transaction timeout errors:

```
Transaction API error: Transaction already closed: Could not perform operation.
```

## Root Cause

The `batchProcess` function includes delays between batches (`setTimeout`) to avoid API rate limits. However, when used inside Prisma transactions, these delays cause the transaction to timeout and close before all operations complete.

## Solution

Created a new `batchProcessWithoutDelay` function that processes batches without delays, specifically for use inside Prisma transactions.

### Changes Made

1. **Added new utility function** in `src/lib/utils/main.ts`:

   - `batchProcessWithoutDelay<T>` - Processes batches without delays
   - Maintains the same batching logic but removes `setTimeout` calls

2. **Updated golfer update service** in `src/app/(server)/api/cron/update-golfers/lib/golfer-service.ts`:

   - Replaced `batchProcess` with `batchProcessWithoutDelay` inside transaction blocks
   - Added import for the new function

3. **Updated team update service** in `src/app/(server)/api/cron/update-teams/lib/service.ts`:

   - Replaced `batchProcess` with `batchProcessWithoutDelay` inside transaction blocks
   - Added import for the new function
   - Removed unused `BATCH_DELAY_MS` constant

4. **Code cleanup**:
   - Renamed unused function `calculateTeamStatus` to `_calculateTeamStatus`
   - Removed unused constants

## Function Usage Guidelines

### Use `batchProcess` when:

- NOT inside a Prisma transaction
- Making external API calls that need rate limiting
- Processing operations that can tolerate delays

### Use `batchProcessWithoutDelay` when:

- Inside a Prisma transaction
- Operations must complete quickly without delays
- Transaction timeout is a concern

## Testing

- All code compiles without errors
- ESLint warnings resolved
- Transaction timeout issue resolved

## Impact

- **Golfer updates**: No more transaction timeouts during batch golfer updates
- **Team updates**: No more transaction timeouts during batch team updates
- **Performance**: Faster transaction processing (no artificial delays)
- **Reliability**: More stable cron job execution
