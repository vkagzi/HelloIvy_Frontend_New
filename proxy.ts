import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/essay-evaluator', '/pay-as-student'];

// Auth routes that should redirect to role-appropriate dashboard if logged in
const AUTH_ROUTES = ['/login', '/signup'];

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'superadmin':
    case 'operationadmin':
      return '/admin';
    case 'schooladmin':
    case 'schoolopsadmin':
      return '/school/dashboard';
    default:
      return '/dashboard';
  }
}

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const pathname = req.nextUrl.pathname;
  const role = (req.auth?.user?.role as string) ?? 'student';

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is an auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Redirect logged-in users away from login/signup to their dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(getRoleDashboard(role), req.nextUrl));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection for authenticated users
  if (isLoggedIn) {
    // /admin/* — only superadmin and operationadmin
    if (pathname.startsWith('/admin')) {
      if (role !== 'superadmin' && role !== 'operationadmin') {
        return NextResponse.redirect(new URL('/', req.nextUrl));
      }
    }

    // /school/* — only schooladmin and schoolopsadmin
    if (pathname.startsWith('/school')) {
      if (role !== 'schooladmin' && role !== 'schoolopsadmin') {
        return NextResponse.redirect(new URL('/', req.nextUrl));
      }
    }

    // /subscription — only B2C students (no school_id)
    if (pathname.startsWith('/subscription')) {
      const schoolId = (req.auth?.user as any)?.school_id;
      if (schoolId) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      }
    }
  }

  return NextResponse.next();
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
     * - API routes (they should handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
