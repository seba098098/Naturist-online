import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/',
  '/api/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Debug logs (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware:', {
      url: request.url,
      pathname,
      isApiAuthRoute,
      isPublicRoute,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  try {
    // Allow API auth routes
    if (isApiAuthRoute) {
      return NextResponse.next();
    }

    // Check if user is authenticated
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    const isAuthenticated = !!token;

    // Redirect to login if not authenticated and not on a public route
    if (!isAuthenticated && !isPublicRoute) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated and tries to access auth pages, redirect to home
    if (isAuthenticated && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of error, allow the request to continue but log it
    // This prevents blocking the application if there's an auth issue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\..*).*)',
  ],
};
