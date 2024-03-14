import { assetPrefix } from '@/base/env';
import Head from 'next/head';

export const SEOHead = () => {
  return (
    <Head>
      <title>DCellar - Storage console for developers on BNB Greenfield</title>
      <meta
        name="description"
        content="DCellar is a storage tool that empowers developers to get started with BNB Greenfield decentralized storage blockchain and BNB Smart Chain (BSC)."
      />
      <meta name="keywords" content="Decentralized data network, DCellar, BNB Greenfield" />
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      <meta
        property="og:title"
        content="DCellar - Storage console for developers on BNB Greenfield"
      />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:site" content="@Nodereal_io" />
      <meta
        name="twitter:title"
        content="DCellar - Storage console for developers on BNB Greenfield"
      />
      <meta
        name="description"
        content="DCellar is a storage tool that empowers developers to get started with BNB Greenfield decentralized storage blockchain and BNB Smart Chain (BSC)."
      />
      <meta
        property="og:description"
        content="DCellar is a storage tool that empowers developers to get started with BNB Greenfield decentralized storage blockchain and BNB Smart Chain (BSC)."
      />
      <meta
        name="twitter:description"
        content="DCellar is a storage tool that empowers developers to get started with BNB Greenfield decentralized storage blockchain and BNB Smart Chain (BSC)."
      />
      <meta property="twitter:image" content={`${assetPrefix}/images/homepage_thumbnail.png`} />
      <meta property="twitter:image:src" content={`${assetPrefix}/images/homepage_thumbnail.png`} />
    </Head>
  );
};
