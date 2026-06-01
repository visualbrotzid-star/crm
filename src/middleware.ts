import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/auth')
  if (isPublic) return NextResponse.next()

  const token =
    request.cookies.get('sb-jxinusdaweobophguxwb-auth-token') ||
    request.cookies.get('sb-access-token') ||
    request.cookies.getAll().find(c => c.name.includes('auth-token') || c.name.includes('supabase'))

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
