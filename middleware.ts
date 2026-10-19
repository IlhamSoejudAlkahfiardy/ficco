import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_OBSCURE_PATH,
  verifyAdminSessionToken,
} from '@/features/admin/_services/admin-auth-service';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes under obscure path /sk-11312301239
  if (pathname.startsWith(ADMIN_OBSCURE_PATH)) {
    const isLoginPage = pathname === `${ADMIN_OBSCURE_PATH}/login`;
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);
    const isAuthenticated = session !== null;

    // 1. Unauthenticated user trying to access protected admin page -> redirect to login
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL(`${ADMIN_OBSCURE_PATH}/login`, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Already authenticated user visiting login page -> redirect to admin dashboard
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL(ADMIN_OBSCURE_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sk-11312301239/:path*'],
};
