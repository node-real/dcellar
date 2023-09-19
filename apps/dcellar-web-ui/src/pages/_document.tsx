import { Html, Head, Main, NextScript } from 'next/document';
import { Ga4 } from '@/components/common/Ga4';
import { GA_ID, assetPrefix } from '@/base/env';

// todo refactor
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="google-site-verification"
          content="9P1xIkjIzkjS3UiiTBjcjN5tfyh4Yk6FDKELgtTdMGE"
        />
        <link rel="icon preload" href={`${assetPrefix}/favicon.svg`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet preload"
        />
        <link href={`${assetPrefix}/wasm/main.wasm`} rel="prefetch" type="application/wasm" />
        <Ga4 id={GA_ID} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ASSET_PREFIX = ${JSON.stringify(assetPrefix)}`,
          }}
        ></script>
        <script src={`${assetPrefix}/iconfont.min.js`}></script>
        <script defer src={`${assetPrefix}/wasm/tinygo_wasm_exec_v1.js`}></script>
        <script defer src={`${assetPrefix}/wasm/tinygo_init_v1.js`}></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
