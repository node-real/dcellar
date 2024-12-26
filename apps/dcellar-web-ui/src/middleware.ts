import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' https: https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com;
    script-src-elem 'self' 'unsafe-inline' https: https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: https://www.google-analytics.com https://www.googletagmanager.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src *;
    object-src 'self' data:;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://*.walletconnect.com https://verify.walletconnect.com https://verify.walletconnect.org;
    media-src 'self';
    manifest-src 'self';
    worker-src 'self' blob:;
    upgrade-insecure-requests;
`;

  const cleanCspHeader = cspHeader.replace(/\s+/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cleanCspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cleanCspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
