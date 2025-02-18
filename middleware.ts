import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';

// Public paths that do not require authentication
const publicPaths = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/'];  

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Check for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const user = verifyJWT(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Check for protected pages
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = verifyJWT(token);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Ignore static files and favicon
export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico).*)',
  ],
};
