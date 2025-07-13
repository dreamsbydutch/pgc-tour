# Navigation Component

A refactored, optimized navigation system following the LeaderboardView component pattern.

## Structure

```
Navigation/
├── components/          # UI components
│   ├── NavigationContainer.tsx    # Main nav bar
│   ├── NavigationProvider.tsx     # Provider wrapper
│   ├── NavItem.tsx               # Individual nav item
│   ├── UserAccountNav.tsx        # User account section
│   ├── UserAccountNavMenu.tsx    # User dropdown menu
│   ├── SignInButton.tsx         # Sign-in button
│   └── index.ts                 # Component exports
├── hooks/              # Custom hooks
│   ├── useNavigationData.ts     # Optimized data fetching
│   └── index.ts               # Hook exports
├── utils/              # Utilities
│   └── index.ts               # Nav config and helpers
├── types.ts            # TypeScript types
├── index.ts            # Main exports
└── README.md          # This file
```

## Key Improvements

### 🚀 **Optimized Data Fetching**

- Uses existing `AuthProvider` context instead of creating new API calls
- Leverages seasonal store data for tour cards (already cached)
- No additional Supabase calls on navigation renders
- Minimal API calls with aggressive caching strategies

### 🏗️ **Separation of Concerns**

- Logic separated from rendering
- Reusable hooks for data management
- Utility functions for common operations

### 📝 **Type Safety**

- Comprehensive TypeScript types
- Proper interface definitions
- Type-safe component props

### 🎯 **Single Responsibility**

- Each component has one clear purpose
- Hooks handle data logic
- Components handle UI rendering

## Usage

### Basic Usage

```tsx
import { NavigationProvider } from "@pgc-components/Navigation";

export default function App({ children }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}
```

### Advanced Usage

```tsx
import {
  NavigationContainer,
  useNavigationData,
} from "@pgc-components/Navigation";

export default function CustomNav() {
  const navigationData = useNavigationData();

  return <NavigationContainer className="custom-nav" />;
}
```

### Data Hook

```tsx
import { useNavigationData } from "@pgc-components/Navigation";

function MyComponent() {
  const { user, member, tourCards, isLoading } = useNavigationData();

  if (isLoading) return <Spinner />;

  return <div>{user ? `Hello ${member?.firstname}` : "Please sign in"}</div>;
}
```

## Migration Guide

### From Old Nav Structure

```tsx
// Before
import { NavBar } from "@pgc-components";
import { useAuthData } from "src/lib/hooks/hooks";

// After
import {
  NavigationContainer,
  useNavigationData,
} from "@pgc-components/Navigation";
```

### Backward Compatibility

The old `NavBar` export is still available for gradual migration:

```tsx
import { NavBar } from "@pgc-components/Navigation"; // Works the same
```

## Features

- **Responsive Design**: Mobile and desktop layouts
- **Authentication**: Google OAuth integration
- **User Account**: Profile management and stats
- **Admin Features**: Admin panel access
- **PWA Support**: Install app functionality
- **Performance**: Optimized re-renders and data fetching

## API Reference

### Components

#### `NavigationContainer`

Main navigation bar component.

**Props:**

- `className?: string` - Additional CSS classes

#### `NavigationProvider`

Wrapper component for app-level navigation.

**Props:**

- `children: React.ReactNode` - App content

### Hooks

#### `useNavigationData()`

Optimized hook for fetching navigation-related data.

**Returns:**

```typescript
{
  user: NavigationUser | null;
  member: NavigationMember | null;
  tourCards: NavigationTourCard[];
  champions: NavigationChampion[];
  isLoading: boolean;
  tourCardLoading: boolean;
}
```

### Types

See `types.ts` for comprehensive type definitions.

## Performance Optimizations

1. **Conditional Fetching**: API calls only made when user is authenticated and loaded
2. **Aggressive Caching**: 5-10 minute stale times prevent unnecessary refetches
3. **Disabled Refetch Triggers**: Prevents refetching on window focus and mount
4. **Memoized Champions**: Champions calculation memoized to prevent recalculation
5. **Optimized Loading States**: Smart loading logic prevents unnecessary loading indicators
6. **Type-Safe Constants**: Tournament lists and priorities defined as constants
