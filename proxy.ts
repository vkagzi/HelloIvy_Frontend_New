import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Auth routes that should redirect to dashboard if logged in
const AUTH_ROUTES = ['/login', '/signup'];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isAuthRoute = AUTH_ROUTES.includes(req.nextUrl.pathname);

  // Redirect logged-in users away from login/signup to dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return undefined; // Return undefined to continue to the requested page
});

/**
 * Configure which paths the middleware should run on.
 * See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
