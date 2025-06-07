# PGC Tour Library Documentation

This directory contains all shared library code for the PGC Tour application. The library is organized into logical modules that handle different aspects of the application.

## 📁 Directory Structure

```
lib/
├── auth/                 # Authentication & authorization
├── emails/               # Email templates
├── hooks/                # Custom React hooks
├── logging/              # Centralized logging system with Axiom integration
├── store/                # State management (Zustand)
├── supabase/             # Supabase client configurations
├── types/                # TypeScript type definitions
├── utils/                # Shared utility functions
├── utils.ts              # Core utility functions
└── validators.ts         # Zod validation schemas
```

## 🔐 Authentication (`auth/`)

**Purpose:** Handles user authentication, session management, and member data integration.

- **`Auth.tsx`** - Main authentication provider and context (✅ **ACTIVE**)
- **`AuthContext.tsx`** - Legacy auth context (⚠️ **DEPRECATED** - Use `Auth.tsx`)
- **`AuthStoreService.ts`** - Service layer for auth-store integration

**Key Features:**
- Supabase authentication integration
- Member profile management
- Session persistence
- Auth state synchronization with main store

## 🪝 Hooks (`hooks/`)

**Purpose:** Custom React hooks for common functionality.

- **`useStore.ts`** - Main store integration hooks
- **`useInitStore.ts`** - Store initialization and loading states
- **`use-user.ts`** - User data access hook
- **`use-auth-listener.ts`** - ⚠️ **DEPRECATED** (use `useAuth` from `Auth.tsx`)
- **`use-toast.ts`** - Toast notification management

## 🗄️ State Management (`store/`)

**Purpose:** Centralized state management using Zustand.

### Core Files
- **`store.ts`** - Main Zustand store definition
- **`InitStoreWrapper.tsx`** - Store initialization component
- **`init.ts`** - Store initialization logic
- **`mainInit.ts`** - Main data initialization functions

### Data Management
- **`cache.ts`** - Data caching and refresh logic
- **`cacheInvalidation.ts`** - Cache invalidation strategies
- **`leaderboard.ts`** - Leaderboard-specific state management
- **`transitions.ts`** - Tournament state transitions

### Utilities
- **`storeUtils.ts`** - Store utility functions

**Architecture:** 
- Single main store with typed state
- Persistent storage via localStorage
- Direct integration with authentication
- Optimized data fetching and caching

## 🔗 Supabase Integration (`supabase/`)

**Purpose:** Database and authentication client configurations.

- **`client.ts`** - Client-side Supabase client
- **`server.ts`** - Server-side Supabase client
- **`middleware.ts`** - Authentication middleware

## 📧 Email Templates (`emails/`)

**Purpose:** Professional HTML email templates for PGC Tour communications.

- **`reminder.html`** - Tournament reminder email template (✅ **ACTIVE**)
- **`seasonOpener.html`** - Season opening announcement template (✅ **ACTIVE**)

**Features:**
- Responsive design (600px max-width)
- PGC Tour branding and styling
- Dynamic content placeholders
- Mobile-friendly inline CSS
- Call-to-action buttons with tournament logos

## 🎯 Types (`types/`)

**Purpose:** TypeScript type definitions for external APIs and custom interfaces.

- **`datagolf_types.ts`** - DataGolf API integration types (✅ **ACTIVE**)

**Features:**
- Complete DataGolf API interface definitions
- Tournament, player, and leaderboard types
- Type transformations and validation helpers
- Runtime type guards and Zod schemas

## 🛠️ Utilities (`utils/`)

**Purpose:** Shared utility functions, image optimization, and validation.

### Files
- **`image-optimization.ts`** - Image optimization and performance utilities (✅ **ACTIVE**)

### Root Level Files
- **`utils.ts`** - Core utility functions (date/currency formatting, golf calculations) (✅ **ACTIVE**)
- **`validators.ts`** - Zod validation schemas for forms and API inputs (✅ **ACTIVE**)

**Features:**
- **Image Optimization:** CDN-aware URL optimization, responsive sizing, performance loading
- **Data Formatting:** Currency, dates, golf scores, rankings with locale support
- **Golf Utilities:** Tee time formatting, position sorting, DataGolf API integration
- **Validation:** Member profiles, payment transactions, form data validation

## 📊 Logging (`logging/`)

**Purpose:** Centralized logging system with structured logging and Axiom integration.

- **`logger.ts`** - Core Axiom logger implementation (✅ **ACTIVE**)
- **`utils.ts`** - Simple logging utilities with context (✅ **ACTIVE**)
- **`index.ts`** - Main export file

**Key Features:**
- Structured logging with consistent JSON format
- Axiom integration for production monitoring
- Context-based organization (auth, tournament, API, etc.)
- Performance measurement utilities
- Privacy-conscious PII handling
- Development vs production-specific behavior

**Usage:**
```tsx
import { log, perf, dev } from '@/src/lib/logging';

// Contextual logging
log.auth.info('User authenticated');
log.tournament.transition('Round completed', { tournamentId, round });
log.store.error('State update failed', error);

// Performance tracking
await perf.measure('API call', async () => {
  return await fetchData();
});

// Development-only logs
dev.log('Debug info', { state });
```

## 🔧 Key Integrations

### Authentication Flow
```
User Login → Supabase Auth → Auth.tsx → Main Store → Components
```

### Data Flow
```
API/Database → Store Cache → Components → UI
```

### State Management
```
Zustand Store ← → React Components ← → User Interactions
```

## 📋 Usage Guidelines

### ✅ Best Practices

1. **Authentication**: Always use `useAuth` from `auth/Auth.tsx`
2. **State Management**: Access data through `useMainStore` from `store/store.ts`
3. **Type Safety**: Import types from `@prisma/client` for database entities
4. **Validation**: Use schemas from `validators.ts` for form validation
5. **Utilities**: Use functions from `utils.ts` for common operations

### ⚠️ Deprecated Components

- `auth/AuthContext.tsx` - Use `auth/Auth.tsx` instead
- `hooks/use-auth-listener.ts` - Use `useAuth` directly

### 🔄 Recent Refactoring (Completed)

✅ **All ESLint warnings resolved**  
✅ **Type safety improved** - All `any` types replaced  
✅ **Unused imports/variables cleaned up**  
✅ **React Hook dependencies fixed**  
✅ **Auth context unified**  
✅ **Build process optimized**  

### 📚 Documentation Status (Completed)

✅ **Main Library Overview** - `/src/lib/README.md`  
✅ **Authentication Module** - `/src/lib/auth/README.md`  
✅ **Store Module** - `/src/lib/store/README.md`  
✅ **Hooks Module** - `/src/lib/hooks/README.md`  
✅ **Supabase Module** - `/src/lib/supabase/README.md`  
✅ **Types Module** - `/src/lib/types/README.md`  
✅ **Utils Module** - `/src/lib/utils/README.md`  
✅ **Emails Module** - `/src/lib/emails/README.md`  

**Coverage:** All 8 modules documented with architecture diagrams, usage examples, best practices, and migration guides.  

## 🚀 Getting Started

### Basic Usage Example

```tsx
import { useAuth } from "@/src/lib/auth/Auth";
import { useMainStore } from "@/src/lib/store/store";
import { cn } from "@/src/lib/utils";

function MyComponent() {
  const { user, member, isAuthenticated } = useAuth();
  const { currentTournament, isLoading } = useMainStore();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div className={cn("container", isLoading && "opacity-50")}>
      Welcome, {member?.firstname}!
    </div>
  );
}
```

---

For specific module documentation, see the README files in each subdirectory.
