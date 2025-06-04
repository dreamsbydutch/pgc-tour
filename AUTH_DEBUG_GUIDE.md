# Auth Signin Issue - Debugging Guide

## Problem
User clicks signin button but gets redirected back to signin page in a loop.

## Changes Made

### 1. Enhanced Middleware Debugging (`src/lib/supabase/middleware.ts`)
- Added comprehensive logging to understand auth flow
- Temporarily disabled aggressive redirects to prevent race conditions
- Added headers for client-side coordination
- Improved auth callback handling

### 2. Enhanced Signin Page (`src/app/(auth)/signin/page.tsx`)
- Added better loading states
- Added client-side redirect logic for authenticated users
- Improved debugging logs

### 3. Enhanced Signin Action (`src/app/(auth)/signin/actions.ts`)
- Added detailed OAuth flow logging
- Better error handling and debugging

### 4. Created Debug Page (`src/app/(debug)/auth-debug/page.tsx`)
- Real-time auth state monitoring
- Direct Supabase client checks
- URL and header inspection

## How to Debug

### Step 1: Check Current Auth State
1. Navigate to `/auth-debug` to see current auth state
2. Check if AuthContext and Supabase client are in sync

### Step 2: Monitor Network Requests
1. Open browser dev tools (F12)
2. Go to Network tab
3. Navigate to `/signin`
4. Click "Sign in with Google"
5. Watch for:
   - Initial OAuth request to Google
   - Redirect to `/auth/callback`
   - Any middleware headers (x-auth-*)
   - Final redirect behavior

### Step 3: Check Console Logs
Look for these log patterns:
- `🔒 Enhanced middleware running for:` - Middleware execution
- `👤 User status in middleware:` - Auth state in middleware
- `🔐 SignIn page render:` - Signin page state
- `🔐 Starting Google OAuth signin...` - OAuth initiation
- `🔄 Authenticated user detected, redirecting to home` - Client redirect

### Step 4: Verify Environment Variables
Ensure these are set correctly:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

## Common Issues to Check

### 1. OAuth Configuration in Supabase
- Verify Google OAuth provider is enabled
- Check redirect URLs include `your-domain.com/auth/callback`
- Verify Google OAuth credentials match environment variables

### 2. Middleware vs Client Auth Timing
- Middleware might detect auth before client-side context initializes
- This causes redirect loops between `/signin` and `/`

### 3. Session Cookie Issues
- Check if Supabase session cookies are being set correctly
- Verify domain settings for cookies

### 4. Google OAuth Consent Screen
- Check if Google OAuth consent screen is properly configured
- Verify authorized domains are set

## Expected Flow

### Normal Signin Flow:
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User authorizes app
4. Google redirects to `/auth/callback?code=...`
5. Callback exchanges code for session
6. Redirects to `/?auth_success=true`
7. Middleware cleans URL parameters
8. Client detects auth and loads user data

### Current Issue:
- Flow might be breaking at step 6-8
- User gets redirected back to `/signin` instead of staying authenticated

## Next Steps
1. Test the debug page to see current state
2. Monitor network traffic during signin
3. Check browser console for specific error messages
4. Verify Supabase dashboard for session creation

## Files Modified
- `src/lib/supabase/middleware.ts` - Enhanced debugging and coordination
- `src/app/(auth)/signin/page.tsx` - Better state handling
- `src/app/(auth)/signin/actions.ts` - Enhanced OAuth flow
- `src/app/(debug)/auth-debug/page.tsx` - New debug page

## Quick Test Commands

Navigate to these URLs to test:
- `/auth-debug` - Check current auth state
- `/signin` - Test signin flow
- Open browser console to see debug logs
