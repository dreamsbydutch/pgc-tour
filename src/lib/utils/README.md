# Utils Module

This module provides utility functions and image optimization tools for the PGC Tour application.

## 📁 Files Overview

### `image-optimization.ts` ✅
**Image optimization and performance utilities**

**Purpose:** Provides comprehensive image optimization functions for better performance, including URL optimization, responsive sizing, and caching strategies.

**Key Features:**
```typescript
import { 
  optimizeImageUrl, 
  getOptimalImageSize, 
  getResponsiveSizes,
  preloadCriticalImages 
} from "@/src/lib/utils/image-optimization";

// Optimize external image URLs
const optimizedUrl = optimizeImageUrl("https://example.com/image.jpg", {
  width: 200,
  height: 200,
  quality: 85,
  format: "webp"
});

// Get context-appropriate sizes
const avatarSizes = getOptimalImageSize("avatar");
// Returns: { small: {width: 24, height: 24}, medium: {width: 36, height: 36}, ... }

// Responsive sizes for Next.js Image
const sizes = getResponsiveSizes("tournament-logo");
// Returns: "(max-width: 768px) 64px, (max-width: 1200px) 96px, 128px"
```

**Image Contexts:**
- `avatar` - User profile images with small/medium/large variants
- `tournament-logo` - Tournament branding with responsive sizing
- `tour-logo` - Tour branding for headers and navigation
- `achievement` - Small icons and badges
- `header-logo` - Main application logo

**CDN Support:**
- Google User Content (avatars)
- UploadThing/UTFS (tournament images)
- Custom optimization parameters per provider

### Root Level Files

#### `/src/lib/utils.ts` ✅
**Core application utilities and formatting functions**

**Purpose:** Central collection of utility functions used throughout the application for data formatting, calculations, and common operations.

**Key Functions:**

##### Styling Utilities
```typescript
import { cn } from "@/src/lib/utils";

// Tailwind CSS class merging
const className = cn(
  "base-classes",
  condition && "conditional-classes",
  { "object-classes": isActive }
);
```

##### Date & Time Formatting
```typescript
import { formatRelativeDate, formatTime } from "@/src/lib/utils";

// Smart relative date formatting
const relativeDate = formatRelativeDate(new Date()); 
// Returns: "2 hours ago" or "Jan 15" or "Jan 15, 2024"

// Format tee times
const teeTime = formatTime(new Date("2024-01-15T08:30:00"));
// Returns: "8:30 AM"
```

##### Number & Currency Formatting
```typescript
import { formatMoney, formatScore, formatRank } from "@/src/lib/utils";

// Currency formatting with smart abbreviations
formatMoney(1500000); // "$1.5M"
formatMoney(25000);   // "$25k"
formatMoney(150);     // "$150.00"

// Golf score formatting
formatScore(0);   // "E"
formatScore(2);   // "+2"
formatScore(-3);  // "-3"

// Ordinal numbers
formatRank(1);    // "1st"
formatRank(22);   // "22nd"
formatRank(103);  // "103rd"
```

##### Golf-Specific Utilities
```typescript
import { getGolferTeeTime, getTeamTeeTime, formatThru } from "@/src/lib/utils";

// Get formatted tee times
const golferTime = getGolferTeeTime(golfer);
const teamTime = getTeamTeeTime(team);

// Format holes completed
formatThru(18, "8:30 AM"); // "F" (finished)
formatThru(12, "8:30 AM"); // "12" (through 12)
formatThru(0, "8:30 AM");  // "8:30 AM" (not started)
```

##### Data Processing
```typescript
import { sortByDate, sortByPosition, fetchDataGolf } from "@/src/lib/utils";

// Sorting utilities
tournaments.sort((a, b) => sortByDate(a.startDate, b.startDate));
players.sort((a, b) => sortByPosition(a.position, b.position));

// DataGolf API integration
const tournamentData = await fetchDataGolf("field-updates", {
  tournament_id: "401580665"
});
```

#### `/src/lib/validators.ts` ✅
**Zod validation schemas**

**Purpose:** Centralized validation schemas for form data and API inputs using Zod.

**Schemas:**
```typescript
import { memberSchema, paymentSchema } from "@/src/lib/validators";

// Member profile validation
const memberResult = memberSchema.parse({
  firstname: "John",
  lastname: "Doe", 
  email: "john@example.com"
});

// Payment transaction validation
const paymentResult = paymentSchema.parse({
  userId: "user_123",
  seasonId: "season_2024",
  description: "Season dues",
  amount: 150,
  transactionType: "payment"
});
```

**Validation Rules:**
- **Member Schema:** First name, last name (min 3 chars), valid email
- **Payment Schema:** User ID, season ID, description, positive amount, transaction type

## 🎯 Usage Patterns

### Image Optimization Workflow
```typescript
import { 
  optimizeImageUrl, 
  getOptimalImageSize, 
  shouldPrioritizeImage 
} from "@/src/lib/utils/image-optimization";
import Image from "next/image";

function TournamentLogo({ tournament }: { tournament: Tournament }) {
  const sizes = getOptimalImageSize("tournament-logo");
  const optimizedUrl = optimizeImageUrl(tournament.logoUrl, {
    width: sizes.large.width,
    quality: 85,
    format: "webp"
  });
  
  return (
    <Image
      src={optimizedUrl}
      alt={`${tournament.name} logo`}
      width={sizes.large.width}
      height={sizes.large.height}
      priority={shouldPrioritizeImage("above-fold")}
      sizes={getResponsiveSizes("tournament-logo")}
    />
  );
}
```

### Data Formatting Pipeline
```typescript
import { formatMoney, formatScore, formatRelativeDate } from "@/src/lib/utils";

function formatLeaderboardData(golfer: Golfer) {
  return {
    name: formatName(golfer.name, "display"),
    score: formatScore(golfer.totalScore),
    earnings: formatMoney(golfer.earnings),
    lastUpdated: formatRelativeDate(golfer.updatedAt),
    position: formatRank(golfer.position)
  };
}
```

### Form Validation Integration
```typescript
import { memberSchema } from "@/src/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

function MemberProfileForm() {
  const form = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: ""
    }
  });
  
  // Form implementation
}
```

## 🔧 Performance Optimizations

### Image Loading Strategy
```typescript
// Preload critical images during app initialization
import { preloadCriticalImages } from "@/src/lib/utils/image-optimization";

useEffect(() => {
  preloadCriticalImages();
}, []);
```

### Responsive Image Sizing
```typescript
// Automatically serve appropriate image sizes
const responsiveSizes = getResponsiveSizes("tournament-logo");
// Generates: "(max-width: 768px) 64px, (max-width: 1200px) 96px, 128px"
```

### Memoization for Expensive Operations
```typescript
import { useMemo } from "react";
import { formatMoney, sortByPosition } from "@/src/lib/utils";

function LeaderboardList({ golfers }: { golfers: Golfer[] }) {
  const sortedGolfers = useMemo(() => 
    golfers.sort((a, b) => sortByPosition(a.position, b.position)),
    [golfers]
  );
  
  return (
    // Render sorted golfers
  );
}
```

## 📋 Best Practices

### ✅ Do's
- Use `cn()` for conditional CSS classes
- Apply image optimization for all external images
- Validate all user inputs with Zod schemas
- Use appropriate number formatting for currency and scores
- Implement responsive image sizing

### ❌ Don'ts
- Don't format dates without considering timezone
- Don't skip image optimization for external URLs
- Don't bypass validation schemas for form data
- Don't use raw currency values without formatting
- Don't load full-size images on mobile devices

## 🔧 Adding New Utilities

### Utility Function Template
```typescript
/**
 * Brief description of what the function does
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter  
 * @returns Description of return value
 */
export function newUtilityFunction(
  param1: string,
  param2?: number
): string {
  // Implementation
  return result;
}
```

### Image Optimization Extension
```typescript
// Add new CDN support
export function optimizeImageUrl(url: string, options: ImageOptions) {
  // ... existing code ...
  
  if (urlObj.hostname.includes("new-cdn.com")) {
    // Add new CDN optimization logic
    if (options.width) {
      urlObj.searchParams.set("width", options.width.toString());
    }
    return urlObj.toString();
  }
}
```

### Validation Schema Extension
```typescript
// Add new validation schema
export const tournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  startDate: z.date(),
  endDate: z.date(),
  venue: z.string().min(1, "Venue is required")
});
```

This utils module provides essential functionality for data formatting, image optimization, and validation across the PGC Tour application, ensuring consistent presentation and performance.
