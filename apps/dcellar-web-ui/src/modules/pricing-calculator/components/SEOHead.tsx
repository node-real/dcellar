import Head from 'next/head';

import { assetPrefix } from '@/base/env';

export const SEOHead = () => {
  return (
    <Head>
      <title>BNB Greenfield Pricing Calculator - DCellar</title>
      <meta
        name="description"
        content="This pricing calculator estimates the cost of storing and downloading data on the BNB Greenfield decentralized storage blockchain."
      />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:site" content="@Nodereal_io" />
      <meta name="twitter:title" content="BNB Greenfield Pricing Calculator - DCellar" />
      <meta
        name="twitter:description"
        content="This pricing calculator estimates the cost of storing and downloading data on the BNB Greenfield decentralized storage blockchain."
      />
      <meta
        property="twitter:image"
        content={`${assetPrefix}/images/pricing-calculator_thumbnail.png`}
      />
      <meta
        property="twitter:image:src"
        content={`${assetPrefix}/images/pricing-calculator_thumbnail.png`}
      />
    </Head>
  );
};
