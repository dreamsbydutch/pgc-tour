# History Module

This module provides comprehensive historical tournament data and member statistics for the PGC Tour application.

## Structure

```
history/
├── page.tsx                    # Main page component
├── index.ts                    # Main barrel export
├── README.md                   # This file
├── components/                 # Reusable components
│   ├── ui/                    # UI components
│   │   ├── ToggleSwitch.tsx   # Reusable toggle switch
│   │   ├── PageHeader.tsx     # Page header component
│   │   ├── achievement-icons.tsx # Achievement display
│   │   └── index.ts           # UI components export
│   ├── tables/                # Table components
│   │   ├── golfer-stats-table.tsx # Golfer statistics table
│   │   ├── history-table.tsx  # Member history table
│   │   ├── golfer-row.tsx     # Individual golfer row
│   │   ├── table-header.tsx   # Table header component
│   │   ├── table-pagination.tsx # Pagination controls
│   │   └── index.ts           # Table components export
│   ├── hooks/                 # Custom hooks
│   │   ├── data-hooks.ts      # Data processing hooks
│   │   ├── use-golfer-data.tsx # Golfer data processing
│   │   ├── use-sorted-data.tsx # Data sorting utilities
│   │   └── index.ts           # Hooks export
│   └── index.ts               # Components barrel export
├── views/                     # View components
│   ├── HistoryMainView.tsx    # Main history view
│   ├── MemberStatsView.tsx    # Member statistics view
│   └── index.ts               # Views export
├── types/                     # Type definitions
│   ├── types.ts               # Core type definitions
│   └── index.ts               # Types export
└── utils/                     # Utility functions
    ├── member-stats.ts        # Member statistics calculations
    ├── team-calculations.ts   # Team-related calculations
    └── index.ts               # Utils export
```

## Features

### Golfer Statistics Table

- Comprehensive golfer performance metrics
- Sortable columns (appearances, wins, top finishes)
- Pagination controls
- Usage statistics and group distribution

### Member Statistics Table

- All-time member performance data
- Adjustable view (regular vs adjusted earnings/points)
- Friends-only filtering
- Achievement icons for major wins
- Detailed performance metrics (wins, top 5s, top 10s, cuts made)

### UI Components

- **ToggleSwitch**: Reusable toggle for filtering options
- **PageHeader**: Consistent page header with title and description
- **AchievementIcons**: Visual display of tournament victories

### Data Processing

- **Data Hooks**: Complex data processing and transformation
- **Sorting Utilities**: Flexible data sorting capabilities
- **Member Statistics**: Comprehensive stat calculations
- **Team Calculations**: Tournament team data processing

## Key Types

### ExtendedMember

Extended member data with tour cards, teams, and adjusted statistics.

### ExtendedTournament

Tournament data with associated teams, courses, and golfers.

### ExtendedTourCard

Tour card data with performance tracking and adjusted values.

## Usage

```tsx
import { HistoryMainView } from "@/src/app/(main)/history";

// Use in page component
export default function HistoryPage() {
  return <HistoryMainView />;
}
```

## Utilities

### Member Statistics Calculation

- Comprehensive performance metrics
- Adjusted vs regular earnings/points
- Win/finish position analysis
- Cut percentage calculations

### Data Filtering & Sorting

- Friends-only filtering
- Multiple sort criteria
- Performance-based rankings

## Integration

This module integrates with:

- **Main Store**: Current member and tier data
- **tRPC API**: Tournament, member, and golfer data
- **Shared Components**: UI table components
- **Utils**: Money formatting and general utilities

## Refactoring Benefits

1. **Modular Organization**: Clear separation of concerns
2. **Reusable Components**: Shared UI elements across tables
3. **Type Safety**: Comprehensive TypeScript interfaces
4. **Maintainability**: Organized structure for easy updates
5. **Performance**: Optimized data processing and memoization
