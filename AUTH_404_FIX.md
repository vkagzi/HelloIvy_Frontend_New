# Auth.js 404 Fix

## Problem
The `/api/auth/providers` endpoint was returning a 404 error from Django instead of being handled by Next.js Auth.js.

## Root Cause
The `next.config.ts` had a catch-all rewrite rule that was proxying ALL `/api/*` requests to Django, including Auth.js routes that should be handled by Next.js.

## Solution
Updated [next.config.ts](next.config.ts) to explicitly list Django API routes while excluding `/api/auth/*` routes so they're handled by Next.js Auth.js.

### Changes Made
```typescript
// Before: This was catching /api/auth/* and sending to Django
{
  source: '/api/:path*',
  destination: `${API_BASE_URL}/:path*/`,
}

// After: Only specific Django routes are rewritten
{
  source: '/api/accounts/:path*',
  destination: `${API_BASE_URL}/accounts/:path*`,
},
{
  source: '/api/profiles/:path*',
  destination: `${API_BASE_URL}/profiles/:path*`,
},
{
  source: '/api/essay-brainstorm/:path*',
  destination: `${API_BASE_URL}/essay-brainstorm/:path*`,
}
// /api/auth/* routes stay in Next.js and are handled by Auth.js
```

## How to Apply

1. **Restart your dev server:**
   ```bash
   # Stop the current dev server (Ctrl+C)
   pnpm dev
   ```

2. **Test the Auth.js endpoint:**
   ```bash
   curl http://localhost:3000/api/auth/providers
   ```
   
   You should see a JSON response like:
   ```json
   {
     "credentials": {
       "id": "credentials",
       "name": "Credentials",
       "type": "credentials"
     }
   }
   ```

## API Routing Summary

| Route Pattern | Handled By | Example |
|--------------|------------|---------|
| `/api/auth/*` | Next.js Auth.js | `/api/auth/providers` |
| `/api/accounts/*` | Django Backend | `/api/accounts/login/` |
| `/api/profiles/*` | Django Backend | `/api/profiles/update/` |
| `/api/essay-brainstorm/*` | Django Backend | `/api/essay-brainstorm/conversations/` |

## Adding New Django Routes

When you add new Django API endpoints, update [next.config.ts](next.config.ts):

```typescript
{
  source: '/api/your-new-route/:path*',
  destination: `${API_BASE_URL}/your-new-route/:path*`,
}
```

## Important Notes

- **Auth.js routes are NEVER proxied** - they always stay in Next.js
- **Django routes must be explicitly listed** in the rewrites array
- **Server restart required** when changing `next.config.ts`
