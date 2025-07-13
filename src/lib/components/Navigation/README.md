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

- Supabase auth is called only once initially, not continuously
- Proper caching with `staleTime` and `gcTime`
- Disabled unnecessary refetch triggers

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
  champions?: NavigationChampion[] | null;
  isLoading: boolean;
}
```

### Types

See `types.ts` for comprehensive type definitions.

## Performance Optimizations

1. **Auth Caching**: User data cached for 5-10 minutes
2. **Disabled Refetch**: Prevents unnecessary API calls
3. **Conditional Queries**: Only fetch when user is authenticated
4. **Memoized Constants**: Nav items defined outside components
5. **Optimized Re-renders**: Proper React patterns
