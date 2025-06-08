# PGC Tour Store Architecture

A clean, streamlined Zustand-based store system for the PGC Tour application.

## 📁 Files Overview

### Core Files (4 total)

#### `store.ts` - Store Definitions
- **MainStoreState**: Core application data (tournaments, tours, members, etc.)
- **LeaderboardStoreState**: Live tournament leaderboard data with polling
- Clean, type-safe Zustand stores with localStorage persistence

#### `init.ts` - Data Initialization
- Single source of truth for loading all application data
- Handles API calls with proper error handling and timeout management
- Automatically determines current/next tournament state

#### `InitStoreWrapper.tsx` - React Integration
- Wraps the app to handle store initialization and loading states
- Error handling with retry functionality
- Clean loading experience with emergency reset capability

#### `utils.ts` - Development Tools
- Debug utilities for inspecting store state
- Data validation and integrity checks
- Development-only utilities exposed to window object

## 🚀 Quick Start

### Basic Usage
```typescript
import { useMainStore, useLeaderboardStore } from './store';
import { initializeStore } from './init';

// Initialize the store (typically done once at app start)
await initializeStore();

// Use in components
function MyComponent() {
  const currentTournament = useMainStore(state => state.currentTournament);
  const teams = useLeaderboardStore(state => state.teams);
  
  return (
    <div>
      <h1>{currentTournament?.name}</h1>
      <p>{teams?.length} teams</p>
    </div>
  );
}
```

### Authentication
```typescript
import { authUtils } from './store';

// Sync Supabase user with store
const member = await authUtils.syncAuthState(supabaseUser);

// Get current auth state
const { isAuthenticated, member, tour } = authUtils.getAuthState();

// Sign out
authUtils.signOut();
```

### React App Setup
```tsx
import { InitStoreWrapper } from './store/InitStoreWrapper';

function App() {
  return (
    <InitStoreWrapper>
      <YourAppContent />
    </InitStoreWrapper>
  );
}
```

## 🏗️ Data Flow

1. **App Start**: `InitStoreWrapper` calls `initializeStore()`
2. **Load Core Data**: Tours, tour cards, seasons, tiers loaded in parallel
3. **Load Tournaments**: Current season and past tournaments
4. **Determine State**: Calculate current/next tournaments from dates
5. **Initialize Leaderboard**: If tournament is active
6. **Ready**: App is ready with all data loaded

## 📊 Store Structure

### MainStore
```typescript
interface MainStoreState {
  // Core data
  seasonTournaments: TournamentData[] | null;
  tourCards: TourCard[] | null;
  tours: Tour[] | null;
  pastTournaments: ProcessedTournament[] | null;
  
  // Dynamic state
  currentTournament: TournamentData | null;
  nextTournament: TournamentData | null;
  
  // User state
  currentMember: Member | null;
  currentTour: Tour | null;
  currentTourCard: TourCard | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuthState: (member: Member | null, isAuthenticated: boolean) => void;
  updateTournamentState: () => void;
  initializeData: (data: Partial<MainStoreState>) => void;
  reset: () => void;
}
```

### LeaderboardStore
```typescript
interface LeaderboardStoreState {
  teams: (Team & { tourCard: TourCard | null })[] | null;
  golfers: Golfer[] | null;
  isPolling: boolean;
  
  update: (teams, golfers) => void;
  setPolling: (isPolling: boolean) => void;
  reset: () => void;
}
```

## 🔄 Tournament State Management

The store automatically manages tournament states:

- **Current Tournament**: Started but not ended, and not completed (currentRound < 5)
- **Next Tournament**: Not yet started
- **Tournament State Updates**: Automatically checked hourly and when tab becomes visible

## 🎯 Benefits

- **Simplified Architecture**: Clean separation of concerns
- **Type Safety**: Full TypeScript support
- **Persistence**: Automatic localStorage persistence
- **Error Recovery**: Graceful handling of network issues
- **Performance**: Efficient updates and minimal re-renders
- **Developer Experience**: Easy debugging and monitoring

## 🛠️ API Functions

### Initialization
- `initializeStore()` - Load all application data
- `initializeLeaderboard()` - Load leaderboard data

### Utilities
- `refreshLeaderboard()` - Refresh leaderboard data
- `shouldPollLeaderboard(tournament)` - Check if should poll for updates
- `startTournamentStateChecker()` - Start automatic tournament state checking

### Auth Integration
- `authUtils.syncAuthState(user)` - Sync Supabase auth with store
- `authUtils.signOut()` - Clear auth state
- `authUtils.getAuthState()` - Get current auth state

### Development Tools
```typescript
// Available in browser console during development
window.storeUtils.debug.log(); // Print formatted state
window.storeUtils.debug.validate(); // Check data integrity
window.storeUtils.debug.forceRefresh(); // Complete refresh
```

## 🔧 Development

The store system includes built-in development utilities and error handling:

- Automatic error recovery and retries
- Clean error messages and debugging
- localStorage persistence with automatic cleanup
- Tournament state validation and updates

## 📈 Performance Considerations

- **Parallel Loading**: Core data and tournaments load simultaneously
- **Smart Updates**: Only update state when data actually changes
- **Efficient Persistence**: Only persist essential data to localStorage
- **Error Handling**: Graceful degradation when API calls fail
- **Memory Management**: Proper cleanup of intervals and subscriptions

## Files to Remove

If you have any of these legacy files in your store folder, they can be safely removed:

- `polling.ts` (functionality moved to init.ts)
- `mainInit.ts` (consolidated into init.ts)
- `storeUtils.ts` (consolidated into utils.ts)
- Any other coordination or legacy files from the old architecture
