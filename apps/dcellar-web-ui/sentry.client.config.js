import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://afd0435fb44646458e48178ce3e0283d@o1163674.ingest.sentry.io/4505232676093952',
  tracesSampleRate: 0.01,
  enabled: process.env.NODE_ENV === 'production',
});

export default Sentry;
