/**
 * Next.js 16 Proxy (replaces middleware.ts)
 * Handles auth route protection and language detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/microsoft-auth';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow public paths and static files through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check auth session
  const session = await auth();
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
