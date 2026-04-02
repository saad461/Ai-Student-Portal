import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();

  const portalPaths = [
    '/dashboard',
    '/lecture',
    '/curriculum',
    '/attendance',
    '/challenges',
    '/grades',
    '/library',
    '/roadmap',
    '/timer',
    '/wellness',
    '/career',
    '/interview-prep',
    '/github-mastery',
    '/leaderboard',
    '/shop',
    '/courses'
  ];

  const isPortalPath = portalPaths.some(path => url.pathname.startsWith(path));

  if (isPortalPath && !session) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (url.pathname === '/login' && session) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const adminAuth = req.cookies.get('admin_access');
    if (!adminAuth) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
