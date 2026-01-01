import type { NextAuthConfig } from 'next-auth';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/', '/essay-evaluator'];

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);

      if (isPublicRoute) {
        return true;
      }

      if (isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
