# Centralized Middleware System

This centralized middleware system allows you to manage multiple middleware functions in a single place with comprehensive logging, debugging capabilities, and fine-grained control.

## 🎯 Features

- **Centralized Management**: All middleware functions are registered and executed from a single manager
- **Priority-based Execution**: Control the order of middleware execution with priority numbers
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Runtime Control**: Enable/disable middleware functions at runtime
- **Error Isolation**: Errors in one middleware don't break the entire chain
- **Debug Tools**: Browser console commands for real-time debugging

## 📁 Structure

```
src/lib/middleware/
├── index.ts          # Core middleware management system
├── middlewares.ts    # Individual middleware implementations
├── debug.ts         # Debug utilities and browser console tools
└── README.md        # This file
```

## 🔧 How It Works

### 1. Registration
Middleware functions are registered with priorities in `/src/middleware.ts`:

```typescript
createMiddleware("security", 10, securityMiddleware);      // Runs first
createMiddleware("auth", 20, authMiddleware);              // Runs second
createMiddleware("rateLimit", 30, rateLimitMiddleware);    // Runs third
createMiddleware("analytics", 40, analyticsMiddleware);    // Runs fourth
createMiddleware("responseEnhancement", 50, responseEnhancementMiddleware); // Runs last
```

### 2. Execution Flow
1. **Security Middleware** (Priority 10): Adds security headers
2. **Auth Middleware** (Priority 20): Handles Supabase authentication
3. **Rate Limiting** (Priority 30): Applies rate limiting to API routes
4. **Analytics** (Priority 40): Tracks page views and user interactions
5. **Response Enhancement** (Priority 50): Final response modifications

### 3. Context Sharing
Middleware functions can share data through the `context.data` object:

```typescript
// Auth middleware sets auth data
context.data.auth = {
  isAuthenticated: true,
  userId: "user123"
};

// Analytics middleware can access auth data
const authData = context.data.auth;
```

## 🛠️ Current Middleware Functions

### Security Middleware (Priority 10)
- Adds security headers to all responses
- Sets X-Frame-Options, X-Content-Type-Options, etc.

### Auth Middleware (Priority 20)
- Handles Supabase session management
- Processes authentication state
- Manages redirects for protected routes
- Sets auth headers for client coordination

### Rate Limiting Middleware (Priority 30)
- Applies basic rate limiting to API routes
- Logs request attempts for monitoring
- Can be extended with Redis for production

### Analytics Middleware (Priority 40)
- Tracks page views and user interactions
- Skips static assets and API routes
- Logs user behavior for analytics

### Response Enhancement Middleware (Priority 50)
- Applies final modifications to responses
- Adds security headers if enabled
- Includes debug information in development

## 🐛 Debugging

### Browser Console Commands (Development Only)

Open your browser console and use these commands:

```javascript
// Show current middleware status
middlewareDebug.status()

// Enable/disable specific middleware
middlewareDebug.toggle("auth", false)  // Disable auth middleware
middlewareDebug.toggle("auth", true)   // Enable auth middleware

// Show execution history
middlewareDebug.history(10)  // Last 10 executions

// Clear history
middlewareDebug.clear()

// Quick controls
middlewareDebug.enableAll()   // Enable all middleware
middlewareDebug.disableAll()  // Disable all middleware
middlewareDebug.onlyAuth()    // Enable only auth middleware
```

### Log Output Examples

The system provides detailed logging for each request:

```
🚀 Centralized middleware execution started
  pathname: /dashboard
  totalMiddlewares: 5
  enabledMiddlewares: 5
  middlewares: ["security", "auth", "rateLimit", "analytics", "responseEnhancement"]

▶️ Executing middleware: auth
  priority: 20
  index: 2
  total: 5

✅ Middleware completed: auth
  executionTime: 45ms
  hasResponse: false
  contextData: ["security", "auth"]

🏁 Centralized middleware execution completed
  pathname: /dashboard
  totalExecutionTime: 128ms
  executedMiddlewares: ["security", "auth", "rateLimit", "analytics", "responseEnhancement"]
```

## 🔍 Troubleshooting Issues

### Issue: Middleware not executing
1. Check if it's registered: `middlewareDebug.status()`
2. Verify it's enabled: Look for ✅ in the status output
3. Check priority order: Lower numbers execute first

### Issue: Auth redirects not working
1. Disable other middleware: `middlewareDebug.onlyAuth()`
2. Check auth middleware logs in console
3. Verify Supabase configuration

### Issue: Performance problems
1. Check execution times: `middlewareDebug.history()`
2. Disable non-essential middleware temporarily
3. Monitor individual middleware timing

### Issue: Middleware conflicts
1. Check context data sharing: Look for overwrites in logs
2. Adjust priority order if needed
3. Use `context.skip = true` to stop execution early

## 🎯 Adding New Middleware

To add a new middleware function:

1. **Create the middleware function** in `middlewares.ts`:

```typescript
export const myCustomMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  // Your middleware logic here
  
  // Share data with other middleware
  context.data.myData = { processed: true };
  
  // Return null to continue, or a Response to stop execution
  return null;
};
```

2. **Register it** in `/src/middleware.ts`:

```typescript
createMiddleware("myCustom", 25, myCustomMiddleware);
```

3. **Test it** using the debug commands:

```javascript
middlewareDebug.status()  // Verify it's registered
middlewareDebug.toggle("myCustom", true)  // Enable it
```

## 📊 Production Considerations

### Performance
- Middleware execution is logged in development only
- Production builds exclude debug utilities
- Consider disabling non-essential middleware in production

### Security
- All security headers are applied by default
- Auth middleware handles session security
- Rate limiting can be enhanced with Redis

### Monitoring
- Logs are sent to your logging system (Axiom)
- Execution times are tracked for performance monitoring
- Error isolation prevents cascade failures

## 🔄 Migration from Old System

If you're migrating from individual middleware files:

1. **Keep your existing middleware functions** - just wrap them in the new system
2. **Update your main middleware.ts** to use the centralized manager
3. **Test thoroughly** using the debug commands
4. **Gradually migrate** complex middleware logic to the new pattern

The new system is designed to be backward compatible with your existing Supabase middleware.
