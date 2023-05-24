import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.01,
  release: process.env.COMMIT_SHA,
  enabled: process.env.NODE_ENV === 'production',
});

export default Sentry;
