# Golfer Update Cron Job

A clean, well-organized cron job for updating golfer data from the Data Golf API.

## Architecture

### **Simple 3-File Structure**

```
src/lib/cron/golfer-update/
├── types.ts     # Type definitions and interfaces
├── services.ts  # All business logic (data fetching, updates, calculations)
├── handler.ts   # Main orchestration and error handling
└── index.ts     # Public API exports
```

### **Key Principles**

- **Separation of Concerns**: Each file has a clear, single responsibility
- **Centralized Logic**: All business logic is in one place (services.ts)
- **Minimal Logging**: Only essential logging, no verbose debugging
- **Type Safety**: Strong typing throughout
- **Error Handling**: Centralized error handling in the handler

## Usage

### **Basic Usage**

```typescript
import { handleGolferUpdateCron } from "@/lib/cron/golfer-update";

const result = await handleGolferUpdateCron(request);
```

### **Testing Individual Services**

```typescript
import {
  fetchExternalData,
  updateAllGolfers,
  updateTournamentStatus,
} from "@/lib/cron/golfer-update";

// Test individual functions
const apiData = await fetchExternalData();
const result = await updateAllGolfers(
  golfers,
  liveData,
  fieldData,
  tournament,
  teams,
);
```

## API Endpoints

- **Production**: `https://www.pgctour.ca/api/cron/update-golfers`
- **Development**: `http://localhost:3000/api/cron/update-golfers`

## What It Does

1. **Fetches Data**: Live tournament data, field data, and rankings from Data Golf API
2. **Creates Golfers**: Adds missing golfer records for new players in the field
3. **Updates Golfers**:
   - Round-by-round scores (R1, R2, R3, R4) and tee times
   - Current round progress (today's score, holes completed)
   - Tournament position and score
   - Cut/WD/DQ status and penalties
4. **Updates Tournament**: Current round and live play status

## Error Handling

- Graceful error handling with detailed error messages
- Individual golfer update errors don't stop the entire job
- Comprehensive logging for debugging when needed
- Proper HTTP status codes and response structure
