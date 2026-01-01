# Auth.js Migration Guide

This project has been migrated from a custom `UserAuthProvider` to **Auth.js (NextAuth.js v5)** for authentication.

## What Changed

### 1. **Authentication Provider**
- **Before**: Custom `UserAuthProvider` using localStorage tokens
- **After**: Auth.js with JWT session strategy

### 2. **Files Created**
- [auth.config.ts](auth.config.ts) - Auth.js configuration for authorization callbacks
- [auth.ts](auth.ts) - Main Auth.js setup with Credentials provider
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/%5B...nextauth%5D/route.ts) - Auth.js API route handlers
- [app/_hooks/useUserAuth.tsx](app/_hooks/useUserAuth.tsx) - Custom hook wrapping Auth.js session
- [types/next-auth.d.ts](types/next-auth.d.ts) - TypeScript type definitions
- [lib/api-client.ts](lib/api-client.ts) - Client-side API helper with Auth.js integration

### 3. **Files Modified**
- [proxy.ts](proxy.ts) - Uses Auth.js for authentication middleware
- [app/(saas)/layout.tsx](app/%28saas%29/layout.tsx) - Uses `SessionProvider` instead of `UserAuthProvider`
- [app/(landingpage)/login/page.tsx](app/%28landingpage%29/login/page.tsx) - Uses `signIn` from Auth.js
- [app/_components/AppHead.tsx](app/_components/AppHead.tsx) - Imports `useUserAuth` from hooks

### 4. **Environment Variables**
Add these to your `.env.local` file:

```bash
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here

# Your app URL
AUTH_URL=http://localhost:3000
```

## How It Works

### Authentication Flow

1. **Login**: User submits credentials → Auth.js validates → Creates JWT session
2. **Session Management**: JWT stored in httpOnly cookie (more secure than localStorage)
3. **Protected Routes**: Proxy checks session → Redirects to `/login` if unauthenticated
4. **API Calls**: Session token automatically included in API requests

### Using the Hook

The `useUserAuth` hook provides the same interface as before:

```tsx
import { useUserAuth } from '@/app/_hooks/useUserAuth';

function MyComponent() {
  const { isAuthenticated, userDetails, logout } = useUserAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {userDetails.name}!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Calls

For client components, use the new `api-client.ts`:

```tsx
'use client';
import api from '@/lib/api-client';

// Token is automatically included from Auth.js session
const data = await api('/api/accounts/me');
```

For server components, use the session:

```tsx
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  
  // Use token for server-side API calls
}
```

## Migration Benefits

1. **Security**: JWT in httpOnly cookies (can't be accessed by JavaScript)
2. **Standards-based**: Uses industry-standard OAuth/OIDC patterns
3. **Extensible**: Easy to add OAuth providers (Google, GitHub, etc.)
4. **Built-in CSRF protection**: Auth.js handles security automatically
5. **Better typing**: Full TypeScript support

## Public Routes

These routes don't require authentication:
- `/`
- `/login`
- `/signup`
- `/essay-evaluator`

Configure in [auth.config.ts](auth.config.ts).

## Troubleshooting

### "AUTH_SECRET not set"
Generate a secret:
```bash
openssl rand -base64 32
```
Add to `.env.local`:
```
AUTH_SECRET=<generated-secret>
```

### Session not persisting
Ensure `AUTH_URL` matches your app URL exactly.

### API calls failing
Check that your backend accepts the Auth.js JWT token format.

## Next Steps

1. Add OAuth providers (Google, GitHub) in [auth.ts](auth.ts)
2. Implement refresh token logic for long-lived sessions
3. Add role-based access control (RBAC)
4. Customize session expiry times
