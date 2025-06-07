# React Hooks Module

This module provides custom React hooks for common functionality across the PGC Tour application.

## 📁 Files Overview

### Active Hooks ✅

#### `useStore.ts`
**Main store integration hooks**

**Purpose:** Provides optimized hooks for accessing and updating the main Zustand store.

**Key Hooks:**
```typescript
// Leaderboard data management
export const useLeaderboard = () => {
  const { leaderboardData, isLoading, refreshLeaderboard } = useMainStore();
  // ... optimized logic
};

// Tournament data management
export const useTournament = () => {
  const { currentTournament, setCurrentTournament } = useMainStore();
  // ... optimized logic
};

// Member data management
export const useMembers = () => {
  const { members, currentMember, updateMember } = useMainStore();
  // ... optimized logic
};
```

**Features:**
- Optimized selectors to prevent unnecessary re-renders
- Built-in loading and error state management
- Automatic dependency tracking
- Performance monitoring hooks

**Usage Example:**
```typescript
import { useLeaderboard } from "@/src/lib/hooks/useStore";

function LeaderboardComponent() {
  const { 
    leaderboard, 
    isLoading, 
    error, 
    refresh 
  } = useLeaderboard();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {leaderboard.map(entry => (
        <LeaderboardRow key={entry.id} entry={entry} />
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

#### `useInitStore.ts`
**Store initialization and loading states**

**Purpose:** Manages the initialization process of the main store and provides loading states.

**Key Features:**
```typescript
export const useInitStore = () => {
  const { 
    isLoading,     // Overall loading state
    error,         // Initialization errors
    retryCount,    // Number of retry attempts
    forceRefresh,  // Force complete refresh
    retry          // Retry initialization
  } = useInitStoreLogic();
  
  return { isLoading, error, retryCount, forceRefresh, retry };
};
```

**States:**
- **Loading:** Store is initializing
- **Ready:** Store is loaded and ready
- **Error:** Initialization failed
- **Retrying:** Attempting retry after failure

**Usage:** Automatically used by `InitStoreWrapper.tsx`

#### `use-user.ts`
**User data access hook**

**Purpose:** Provides convenient access to current user and member information.

**Features:**
```typescript
export const useUser = () => {
  const { user, member, isLoading, error } = useAuth();
  
  return {
    user,           // Supabase User object
    member,         // PGC Tour Member profile
    isSignedIn: !!user,
    isMember: !!member,
    isLoading,
    error,
    displayName: member?.firstname || user?.email || 'Anonymous'
  };
};
```

**Computed Properties:**
- `isSignedIn` - Boolean indicating if user is authenticated
- `isMember` - Boolean indicating if user has member profile
- `displayName` - Formatted display name with fallbacks

**Usage Example:**
```typescript
import { useUser } from "@/src/lib/hooks/use-user";

function UserProfile() {
  const { member, displayName, isMember } = useUser();
  
  if (!isMember) {
    return <CreateMemberProfile />;
  }
  
  return (
    <div>
      <h1>Welcome, {displayName}!</h1>
      <p>Member since: {member.createdAt}</p>
    </div>
  );
}
```

#### `use-toast.ts`
**Toast notification management**

**Purpose:** Provides a simple interface for showing toast notifications.

**Features:**
```typescript
export const useToast = () => {
  const { toast } = useToastContext();
  
  return {
    toast: (message: string, type?: 'success' | 'error' | 'info') => void,
    success: (message: string) => void,
    error: (message: string) => void,
    info: (message: string) => void
  };
};
```

**Usage Example:**
```typescript
import { useToast } from "@/src/lib/hooks/use-toast";

function ActionButton() {
  const { success, error } = useToast();
  
  const handleAction = async () => {
    try {
      await performAction();
      success("Action completed successfully!");
    } catch (err) {
      error("Action failed. Please try again.");
    }
  };
  
  return <button onClick={handleAction}>Perform Action</button>;
}
```

### Deprecated Hooks ⚠️

#### `use-auth-listener.ts` 
**⚠️ DEPRECATED - Use `useAuth` from `auth/Auth.tsx` directly**

**Migration:**
```typescript
// ❌ Old way (deprecated)
import { useAuthListener } from "@/src/lib/hooks/use-auth-listener";
const { member, isAuthenticated } = useAuthListener();

// ✅ New way (current)
import { useAuth } from "@/src/lib/auth/Auth";
const { member, isAuthenticated } = useAuth();
```

**Why deprecated:** 
- Redundant with main auth hook
- Added unnecessary complexity
- Maintained for backward compatibility only

## 🎯 Hook Design Principles

### 1. Single Responsibility
Each hook has a clear, focused purpose:
- `useUser` - User/member data only
- `useLeaderboard` - Leaderboard functionality only
- `useToast` - Notification management only

### 2. Optimized Performance
All hooks are designed for performance:
- Selective store subscriptions
- Memoized computed values
- Minimal re-render triggers

### 3. Error Handling
Built-in error handling patterns:
- Consistent error state management
- Graceful degradation
- User-friendly error messages

### 4. TypeScript First
Full TypeScript support with:
- Proper type inference
- Generic type parameters where appropriate
- Strict null checking

## 🔄 Hook Lifecycle Patterns

### Data Fetching Hooks
```typescript
function useDataFetching() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading, error };
}
```

### Store Integration Hooks
```typescript
function useStoreIntegration() {
  // Selective subscription to prevent unnecessary re-renders
  const relevantData = useMainStore(state => state.relevantData);
  const updateAction = useMainStore(state => state.updateAction);
  
  // Memoized computed values
  const computedValue = useMemo(() => {
    return processData(relevantData);
  }, [relevantData]);
  
  return { data: relevantData, computed: computedValue, update: updateAction };
}
```

## 📋 Usage Guidelines

### Best Practices ✅

1. **Use Selective Subscriptions**
   ```typescript
   // ✅ Good - only subscribes to needed data
   const tournament = useMainStore(state => state.currentTournament);
   
   // ❌ Bad - subscribes to entire store
   const { currentTournament } = useMainStore();
   ```

2. **Handle Loading and Error States**
   ```typescript
   function MyComponent() {
     const { data, loading, error } = useCustomHook();
     
     if (loading) return <LoadingSpinner />;
     if (error) return <ErrorDisplay error={error} />;
     return <DataDisplay data={data} />;
   }
   ```

3. **Use Appropriate Hook for Context**
   ```typescript
   // ✅ For user display
   const { displayName } = useUser();
   
   // ✅ For full auth context
   const { user, session, signOut } = useAuth();
   ```

### Anti-Patterns ❌

1. **Don't Call Hooks Conditionally**
   ```typescript
   // ❌ Bad
   if (condition) {
     const data = useCustomHook();
   }
   
   // ✅ Good
   const data = useCustomHook();
   if (condition && data) {
     // use data
   }
   ```

2. **Don't Create Custom Hooks for Single-Use Logic**
   ```typescript
   // ❌ Bad - unnecessary custom hook
   const useSpecificComponentLogic = () => { /* very specific logic */ };
   
   // ✅ Good - keep specific logic in component
   function SpecificComponent() {
     const [localState, setLocalState] = useState();
     // component-specific logic here
   }
   ```

## 🧪 Testing Hooks

### Testing Strategy
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });
  
  it('should handle data updates', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCustomHook());
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

## 🔧 Creating New Hooks

### Template for New Hook
```typescript
import { useState, useEffect, useMemo } from 'react';
import { useMainStore } from '@/src/lib/store/store';

export function useNewFeature() {
  // Local state if needed
  const [localState, setLocalState] = useState(null);
  
  // Store subscriptions (selective)
  const storeData = useMainStore(state => state.relevantData);
  const storeAction = useMainStore(state => state.relevantAction);
  
  // Computed values
  const computedValue = useMemo(() => {
    return processData(storeData, localState);
  }, [storeData, localState]);
  
  // Effects
  useEffect(() => {
    // Side effects here
  }, []);
  
  // Return stable object
  return useMemo(() => ({
    data: computedValue,
    action: storeAction,
    localState,
    setLocalState
  }), [computedValue, storeAction, localState]);
}
```

### Checklist for New Hooks
- [ ] Clear single responsibility
- [ ] Proper TypeScript types
- [ ] Error handling
- [ ] Performance optimizations
- [ ] Documentation and examples
- [ ] Unit tests
