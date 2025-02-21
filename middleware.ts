import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';

const publicPaths = [
  '/auth/*',
  '/auth/register',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/admin/login',
  '/login',
  '/pages/coffee-shop',
  '/auth'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for token in cookies first
  const token = request.cookies.get('token')?.value;

  // If no token in cookies, check Authorization header as fallback
  const authHeader = request.headers.get('Authorization');
  const headerToken = authHeader?.replace('Bearer ', '');

  const finalToken = token || headerToken;

  if (!finalToken) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  try {
    const user = await verifyJWT(finalToken);
    if (!user) {
      console.log('JWT verification failed');
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Clone the request headers and add the user information
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('user', JSON.stringify(user));

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.log('JWT verification error:', error);
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};