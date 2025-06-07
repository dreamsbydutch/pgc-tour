# Tournament Transitions & Leaderboard Initialization System

## Overview

This document describes the automatic tournament state transition and leaderboard initialization system implemented for the PGC Tour application.

## Core Features

### 1. Automatic Tournament State Transitions

The system automatically moves tournaments between different states based on timing:

- **Next → Current**: When a tournament's start date/time is reached
- **Current → Past**: When a tournament ends (end date passed OR round 5 completed)
- **Auto-discovery**: Automatically finds new "next" tournaments from the season list

### 2. Automatic Leaderboard Initialization

The leaderboard store is automatically initialized whenever:
- A tournament transitions to "current" status
- The main store is refreshed and a current tournament is detected
- Cache invalidation occurs and a current tournament exists

## File Structure

### Core Files

- `/src/lib/store/tournamentTransitions.ts` - Main transition logic
- `/src/lib/hooks/useInitStore.ts` - Integration with app initialization
- `/src/lib/store/mainInit.ts` - Main store initialization with leaderboard auto-init
- `/src/lib/store/cacheInvalidation.ts` - Cache refresh with leaderboard auto-init
- `/src/lib/store/leaderboardInit.ts` - Leaderboard initialization functions

## Tournament Transition Logic

### Timing Rules

A tournament is considered:

**Current** when:
- `startDate <= now`
- `endDate >= now` 
- `currentRound < 5` (not completed)

**Past** when:
- `endDate < now` OR
- `currentRound >= 5` (completed regardless of end date)

**Next** when:
- `startDate > now` (upcoming)
- Is the earliest upcoming tournament

### Transition Process

1. **Check for Next → Current transition**
   - If `nextTournament.startDate <= now`
   - Move next tournament to current
   - Find new next tournament from season tournaments
   - Initialize leaderboard store for new current tournament

2. **Check for Current → Past transition**
   - If current tournament is completed or expired
   - Clear current tournament
   - (Next tournament remains unchanged)

3. **Check for missing Next tournament**
   - If no next tournament exists
   - Find earliest future tournament from season list
   - Set as next tournament

## Polling System

### Configuration

- **Interval**: 5 minutes (300,000ms) by default
- **Auto-start**: Begins after successful store initialization
- **Auto-cleanup**: Stops when app/component unmounts

### Integration Points

- Starts in `useInitStore` hook after successful initialization
- Cleanup function stored in ref for proper unmount handling
- Error handling with console logging

## Leaderboard Auto-Initialization

### Trigger Points

1. **Tournament transitions**: When a tournament becomes current
2. **Main store initialization**: After loading initial data
3. **Cache refresh**: After tournament data is refreshed
4. **Manual refresh**: When force-refreshing tournament data

### Implementation

```typescript
// Auto-initialization after tournament transitions
if (currentTournament) {
  const leaderboardInitialized = await initializeLeaderboardStore();
  if (leaderboardInitialized) {
    console.log("✅ Leaderboard store initialized");
  }
}
```

## Debugging & Testing

### Manual Test Functions

Available in browser console after app initialization:

```javascript
// Test tournament transitions manually
window.testTournamentTransitions()

// View current tournament status
window.getTournamentStatus()
```

### Debug Logging

The system provides comprehensive console logging:

- `🔍` Tournament transition checks
- `🏆` Tournament status changes
- `📅` Next tournament updates
- `✅` Successful operations
- `❌` Error conditions
- `⏹️` Cleanup operations

### Key Log Messages

- "🔍 Checking tournament transitions..."
- "🏆 Transitioning [name] from next to current tournament"
- "📅 Moving [name] from current to past tournament"
- "🔄 Starting tournament transition polling..."
- "✅ Tournament state transitions completed"

## Error Handling

### Graceful Degradation

- Transition errors don't break the polling system
- Leaderboard initialization failures are logged but don't stop transitions
- Network errors in cache checks are handled gracefully

### Recovery Mechanisms

- Polling continues even if individual checks fail
- Manual test functions allow for debugging
- Force refresh options available through cache system

## Cache Integration

### Coordination with Cache System

- Tournament transitions work with database-driven cache invalidation
- Cache refreshes trigger leaderboard initialization when appropriate
- Auth state changes coordinate with tournament data updates

### Cache Refresh Points

1. Database invalidation flags trigger tournament data refresh
2. Tournament data refresh triggers leaderboard initialization
3. Manual cache refresh includes tournament transition checks

## Performance Considerations

### Efficient Polling

- 5-minute intervals balance responsiveness with performance
- Only checks database when state changes are possible
- Minimal store updates reduce re-renders

### Smart State Updates

- Only updates store when actual transitions occur
- Batches related state changes together
- Uses timestamp-based change detection

## Future Enhancements

### Potential Improvements

1. **WebSocket Integration**: Real-time tournament updates
2. **Smarter Polling**: Dynamic intervals based on tournament proximity
3. **Background Sync**: Service worker integration for offline scenarios
4. **Admin Controls**: Manual tournament state override capabilities

### Monitoring Opportunities

1. **Transition Logging**: Database logging of all state transitions
2. **Performance Metrics**: Track transition timing and success rates
3. **Error Tracking**: Centralized error reporting for failed transitions

## Troubleshooting

### Common Issues

1. **Transitions not occurring**: Check console for timing debug info
2. **Leaderboard not initializing**: Verify current tournament exists
3. **Polling not starting**: Check initialization hook integration
4. **Memory leaks**: Ensure cleanup functions are properly called

### Debug Steps

1. Use `window.getTournamentStatus()` to check current state
2. Check console logs for transition attempts
3. Verify store initialization completed successfully
4. Check for JavaScript errors preventing polling
