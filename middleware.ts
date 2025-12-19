import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If user visits root path, redirect to tables
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/tables', request.url))
  }

  // Allow all other routes to proceed normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

