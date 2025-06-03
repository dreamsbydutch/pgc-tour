# Standings Module

This module handles all standings-related functionality for the PGC Tour application.

## Architecture

The standings module is organized following a clean architecture pattern with clear separation of concerns:

### Directory Structure

```
standings/
├── page.tsx                  # Next.js page entry point
├── layout.tsx               # Layout wrapper
├── index.ts                 # Main barrel export
├── components/              # UI Components
│   ├── ui/                 # Basic UI components
│   │   ├── ToursToggleButton.tsx
│   │   ├── StandingsHeaders.tsx
│   │   └── PointsAndPayoutsPopover.tsx
│   ├── listings/           # List item components
│   │   └── StandingsListings.tsx
│   ├── dropdowns/          # Dropdown/popup components
│   │   └── StandingsDropdown.tsx
│   └── index.ts            # Component barrel export
├── views/                  # Page-level view components
│   ├── shared/            # Shared view components
│   │   └── HomePageStandings.tsx
│   ├── main/              # Main page views
│   │   └── StandingsMainView.tsx
│   └── index.ts           # Views barrel export
├── types/                 # TypeScript type definitions
│   └── index.ts
└── utils/                 # Utility functions
    └── index.ts
```

## Components

### UI Components (`components/ui/`)

- **ToursToggleButton**: Button for switching between tours
- **StandingsHeaders**: Header components for different standings views
- **PointsAndPayoutsPopover**: Popover showing points and payouts

### Listing Components (`components/listings/`)

- **StandingsListing**: Individual player standings row
- **PlayoffStandingsListing**: Playoff-specific standings row

### Dropdown Components (`components/dropdowns/`)

- **StandingsTourCardInfo**: Detailed player information dropdown

## Views

### Shared Views (`views/shared/`)

- **HomePageStandings**: Standings widget for homepage

### Main Views (`views/main/`)

- **StandingsMainView**: Main standings page component

## Utilities

The `utils/` directory contains helper functions for:

- Filtering and sorting tour cards
- Calculating playoff positions
- Creating mock data objects
- Managing state initialization

## Types

All TypeScript interfaces and types are centralized in `types/index.ts`, providing:

- Component prop interfaces
- Data structure types
- Utility function parameter types

## Usage

```typescript
// Import from the main barrel export
import { StandingsMainView, ToursToggleButton } from "@/app/(main)/standings";

// Or import specific components
import { StandingsListing } from "@/app/(main)/standings/components/listings/StandingsListings";
```

## Design Principles

1. **Single Responsibility**: Each component has a focused, single purpose
2. **Type Safety**: Full TypeScript coverage with proper interfaces
3. **Reusability**: Components are designed to be reusable across the application
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
5. **Maintainability**: Well-documented, organized code structure

## Performance Considerations

- Components use React.memo where appropriate
- Expensive calculations are memoized
- Large lists are optimized for rendering performance
- Images are optimized using the custom OptimizedImage component
