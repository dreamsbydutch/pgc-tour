# Rulebook Module

This module handles all rulebook-related functionality for the PGC Tour application, displaying rules, schedules, points distributions, and payout structures.

## Architecture

The rulebook module follows a clean architecture pattern with clear separation of concerns, matching the organizational structure established in the standings module.

### Directory Structure

```
rulebook/
├── page.tsx                  # Next.js page entry point
├── layout.tsx               # Layout wrapper
├── index.ts                 # Main barrel export
├── components/              # UI Components
│   ├── ui/                 # Basic UI components
│   │   └── CollapsibleSection.tsx
│   ├── tables/             # Table components
│   │   ├── PayoutsTable.tsx
│   │   ├── PointsTable.tsx
│   │   ├── ScheduleTable.tsx
│   │   └── DataTable.tsx
│   └── index.ts            # Component barrel export
├── views/                  # Page-level view components
│   ├── RulebookMainView.tsx # Main rulebook page component
│   └── RuleCategory.tsx    # Individual rule category component
├── types/                  # TypeScript interfaces
│   └── index.ts            # Type definitions
└── utils/                  # Helper functions
    └── index.ts            # Utility functions
```

## Components

### UI Components (`components/ui/`)

- **CollapsibleSection**: Reusable collapsible section with expand/collapse functionality

### Table Components (`components/tables/`)

- **PayoutsTable**: Displays payout distributions across different tournament tiers
- **PointsTable**: Shows points awarded for finishing positions by tier
- **ScheduleTable**: Tournament schedule with dates, courses, and locations
- **DataTable**: Base reusable table component for structured data display

### Views

- **RulebookMainView**: Main rulebook page containing all rule categories
- **RuleCategory**: Individual collapsible rule section with dynamic content

## Features

### Dynamic Content Integration

The module dynamically integrates with live data for:

- **Tournament Schedule**: Real-time tournament data with dates, tiers, and courses
- **Payout Structures**: Current season payout distributions by tier
- **Points Systems**: Points awarded for different finishing positions
- **Tier Information**: Tournament categorization (Major, Elevated, Standard, Playoff)

### Special Handling

- **Playoff Tiers**: Gold playoff tier displays as "Gold" in tables
- **Silver Tier**: Dynamically created from playoff tier data (positions 75+)
- **Tournament Styling**: Visual differentiation for Major tournaments and playoffs
- **Responsive Design**: Mobile-friendly collapsible sections and tables

## Types

All TypeScript interfaces and types are centralized in `types/index.ts`, providing:

- Rule and category interfaces
- Component prop types
- Table-specific interfaces
- Tournament data types

## Utilities

The `utils/` directory contains helper functions for:

- Tier data manipulation and sorting
- Silver tier creation from playoff data
- CSS class generation for tier-specific styling
- Static rulebook data management

## Usage

```typescript
// Import from the main barrel export
import { RulebookMainView } from "@/app/(main)/rulebook";

// Or import specific components
import {
  PayoutsTable,
  PointsTable,
} from "@/app/(main)/rulebook/components/tables";
import { CollapsibleSection } from "@/app/(main)/rulebook/components/ui";
```

## Design Principles

1. **Single Responsibility**: Each component has a focused, single purpose
2. **Type Safety**: Full TypeScript coverage with proper interfaces
3. **Reusability**: Components designed for reuse across the application
4. **Data Integration**: Dynamic content from live tournament and tier data
5. **Maintainability**: Well-documented, organized code structure
6. **Consistency**: Follows the same organizational pattern as other modules

## Performance Considerations

- **Memoization**: Components use React.memo where appropriate
- **Dynamic Imports**: Barrel exports enable tree-shaking
- **Efficient Rendering**: Conditional rendering for large data sets
- **Optimized Queries**: Data fetching through centralized store

## Maintenance

The module structure makes it easy to:

- Add new rule categories
- Modify table layouts and data
- Update styling and responsive behavior
- Extend functionality with new components
- Maintain type safety across changes

## Integration

The rulebook module integrates seamlessly with:

- **Main Store**: Tournament and tier data
- **Shared Components**: UI components and utilities
- **Layout System**: Consistent page structure
- **Navigation**: Route-based access and deep linking
