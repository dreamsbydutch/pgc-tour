# Push Notification System

Centralized push notification management for PGC Tour with client-side subscription handling, React hooks, server utilities, and type definitions.

## Structure

```
src/lib/push/
├── index.ts          # Main exports - import from here
├── client.ts         # Client-side functions (browser)
├── hook.ts           # React hook for components
├── server.ts         # Server utilities (future use)
└── types.ts          # TypeScript definitions
```

## Usage

### React Components

```typescript
import { usePushNotifications } from "@/src/lib/push";

function NotificationButton({ memberId }) {
  const { isPushSubscribed, pushSupported, handleToggle } = usePushNotifications(memberId);

  if (!pushSupported) return null;

  return (
    <button onClick={handleToggle}>
      {isPushSubscribed ? "🔕 Disable" : "🔔 Enable"} Notifications
    </button>
  );
}
```

### Direct Function Usage

```typescript
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  getCurrentSubscription,
} from "@/src/lib/push";

// Check permission and subscribe
const hasPermission = await requestNotificationPermission();
if (hasPermission) {
  const subscription = await subscribeToPushNotifications(memberId);
}

// Check current subscription status
const currentSub = await getCurrentSubscription();
const isSubscribed = currentSub !== null;
```

### Server-Side (Future Use)

```typescript
import {
  TournamentNotifications,
  PushNotificationSender,
} from "@/src/lib/push";

// Create notification
const notification =
  TournamentNotifications.tournamentStart("PGC Championship");

// Send to subscriptions (requires web-push setup)
const sender = new PushNotificationSender();
await sender.sendToSubscriptions(subscriptions, notification);
```

## Setup Requirements

1. **VAPID Keys**: Generate using `npx web-push generate-vapid-keys`
2. **Environment Variables**:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```
3. **Service Worker**: Must be registered for push notifications to work
4. **Database**: `PushSubscription` model in Prisma schema

## API Routes

- `POST /api/push/subscribe` - Subscribe to notifications
- `POST /api/push/unsubscribe` - Unsubscribe from notifications
