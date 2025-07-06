# 🏌️ Server Actions API

**Server-side data fetching and business logic for the PGC Tour application**

This folder contains server actions that provide server-side equivalents to client hooks, enabling SSR and server component usage with the same data outputs.

## 📁 Architecture Overview

```
src/server/api/actions/
├── 🏆 tournaments.ts      # Tournament navigation & data
├── 📊 leaderboards.ts     # Leaderboard data fetching  
├── 🏅 champions.ts        # Recent champions data
├── ⛳ golfer.ts           # Golfer statistics & usage
├── 👥 member.ts           # Member management & tiers
├── 🏟️  team.ts            # Team creation & management
├── 💰 transaction.ts      # Financial operations
├── 🎫 tour_card.ts        # Tour card lifecycle
└── 📦 index.ts            # Consolidated exports
```

## 🎯 Core Actions

### 🏆 Tournament Navigation
```typescript
// Get current tournament with enhanced data
const tournament = await getTournamentData(tournamentId);

// Navigate tournament history  
const history = await getTournamentHistory();

// Get current/next tournament info
const current = await getCurrentTournament();
const next = await getNextTournament();
```

### 📊 Leaderboard Data  
```typescript
// Get current leaderboard with real-time data
const leaderboard = await getCurrentLeaderboard();

// Get enhanced leaderboard with additional context
const enhanced = await getLeaderboardData(tournamentId);

// Get historical leaderboard data
const historical = await getHistoricalLeaderboard(tournamentId);
```

### 🏅 Champions Data
```typescript
// Get recent champions across tournaments
const champions = await getRecentChampions(limit);

// Get champions for specific tournament
const tournamentChamps = await getChampionsByTournament(tournamentId);
```

## 🚀 Business Logic Actions

### ⛳ Golfer Management
```typescript
// Update golfer usage statistics for tournament
await updateUsageForTournament({ tournamentId });

// Get golfers with enhanced usage data
const golfers = await getGolfersWithUsage(tournamentId);

// Get top performing golfers
const topGolfers = await getTopGolfers(10, 'earnings');
```

### 👥 Member Operations
```typescript
// Update member tiers based on performance
await updateMemberTiers(seasonId);

// Get member with tour card history
const memberData = await getMemberWithTourCards(memberId);

// Get members by tier/role
const tierMembers = await getMembersByTier('Gold');

// Get comprehensive member statistics
const stats = await getMemberStats(memberId);
```

### 🏟️ Team Management
```typescript
// Create team from form submission
const result = await teamCreateOnFormSubmit({
  value: { groups: [{ golfers: [1, 2, 3, 4] }] },
  tournamentId,
  tourCardId
});

// Update team golfer composition
await updateTeamGolfers({ teamId, golferIds });

// Get teams for tournament with enhanced data
const teams = await getTeamsForTournament(tournamentId);

// Get detailed team performance statistics
const teamStats = await getTeamStats(teamId);

// Delete team (pre-tournament only)
await deleteTeam(teamId);
```

### 💰 Financial Operations
```typescript
// Process payment transaction
const paymentResult = await processPayment(transaction);

// Add funds to member account
await addFunds({ 
  memberId, 
  amount, 
  description, 
  seasonId 
});

// Get transaction history with pagination
const history = await getTransactionHistory({
  memberId,
  seasonId,
  limit: 50,
  offset: 0
});

// Get current account balance with context
const balance = await getAccountBalance(memberId);
```

### 🎫 Tour Card Lifecycle
```typescript
// Create new tour card with payment processing
await createTourCard({ tour, seasonId });

// Delete tour card with refund processing  
await deleteTourCard({ tourCard });

// Update display names with collision resolution
await updateTourCardNames({ tour, tourCard });
```

## 🔄 Simplified Data Access

For basic tour card data without complex business logic:

```typescript
// Get tour cards with member/tour data
const tourCards = await getTourCardsSimple(memberIds);

// Get tour cards for specific member
const memberCards = await getMemberCardsSimple(memberId);
```

## ⚡ Usage Patterns

### Server Components
```typescript
// app/tournament/[id]/page.tsx
import { getTournamentData } from '@/src/server/api/actions';

export default async function TournamentPage({ params }) {
  const tournament = await getTournamentData(params.id);
  return <TournamentView tournament={tournament} />;
}
```

### API Routes
```typescript
// app/api/teams/route.ts  
import { getTeamsForTournament } from '@/src/server/api/actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');
  
  const result = await getTeamsForTournament(tournamentId);
  return Response.json(result);
}
```

### Form Actions
```typescript
// app/teams/create/actions.ts
import { teamCreateOnFormSubmit } from '@/src/server/api/actions';

export async function createTeam(formData: FormData) {
  const result = await teamCreateOnFormSubmit({
    value: JSON.parse(formData.get('teams')),
    tournamentId: formData.get('tournamentId'),
    tourCardId: formData.get('tourCardId')
  });
  
  if (!result.success) {
    throw new Error(result.error);
  }
}
```

## 🛡️ Error Handling

All actions follow a consistent error handling pattern:

```typescript
// Success Response
{
  success: true,
  data: T,
  // ... additional context
}

// Error Response  
{
  success: false,
  error: string,
  // ... fallback data where applicable
}
```

## 🏗️ Integration Notes

- **Type Safety**: All actions are fully typed with proper TypeScript interfaces
- **Database Access**: Uses both direct Prisma client and tRPC API for different use cases
- **Authentication**: Actions requiring auth use Supabase client for user context
- **Performance**: Optimized queries with strategic `include` statements and pagination
- **Consistency**: Server actions return the same data structures as client hooks

## 📈 Best Practices

1. **Use server actions for SSR/server components**
2. **Use client hooks for interactive components**  
3. **Batch related data fetches in single actions**
4. **Handle errors gracefully with fallback data**
5. **Leverage TypeScript for compile-time safety**
6. **Use appropriate caching strategies for performance**

---

*This API provides comprehensive server-side data access while maintaining consistency with client-side patterns and ensuring type safety throughout the application.*
