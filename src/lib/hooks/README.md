# Golf Tournament Hooks

Simple, consolidated React hooks for golf tournament data.

## 🎯 What's Here

**4 Core Hooks** → Clean, store-first architecture

```
📂 Tournament Data    → useTournament()
📂 Leaderboard Data   → useLeaderboard()
📂 Champions Data     → useRecentChampions()
📂 Tour Card Data     → useTourCards() / useMemberCards()
```

**3 Utility Hooks** → Keep as-is

```
🔔 useToast()        → Toast notifications
👤 useUser()         → User authentication
📱 usePWAInstall()   → PWA installation
```

---

## 🔄 Quick Reference

### Tournament Navigation

```typescript
const { current, next, upcoming, completed } = useTournament();
```

**Returns:** Current tournament, next tournament, lists of upcoming/completed

### Leaderboard Data

```typescript
const { teams, teamsByTour, isLoading } = useLeaderboard(tournamentId?);
```

**Returns:** Tournament teams, grouped by tour, loading state

### Recent Champions

```typescript
const { champions, tournament, timing } = useRecentChampions(daysLimit?);
```

**Returns:** Recent winners, tournament info, timing validation

### Tour Cards

```typescript
const cards = useTourCards(filters?);
const memberCards = useMemberCards(memberId);
```

**Returns:** Filtered tour cards or member-specific cards

---

## 📊 Architecture

```
Components → Hooks → Store → API
     ↑         ↑       ↑      ↑
   Clean    Enhanced  Cache  Data
    API      Types   First
```

**Store-First:** Hooks use seasonal store data when available  
**API Fallback:** Direct API calls only when needed  
**Enhanced Types:** Rich metadata + utility functions included
