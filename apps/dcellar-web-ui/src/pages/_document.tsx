import { Html, Head, Main, NextScript } from 'next/document';

import { Ga4 } from '@/components/common/Ga4';
import { GA_ID, assetPrefix } from '@/base/env';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="google-site-verification"
          content="9P1xIkjIzkjS3UiiTBjcjN5tfyh4Yk6FDKELgtTdMGE"
        />
        <link rel="icon" href={`${assetPrefix}/favicon.svg`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Ga4 id={GA_ID} />
      </Head>
      <body style={{ background: 'transparent' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
