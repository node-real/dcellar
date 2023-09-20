import { assetPrefix } from '@/base/env'
import Head from 'next/head'
import React from 'react'

export const SEOHead = () =>  {
  return (
    <Head>
    <title>BNB Greenfield Pricing Calculator - DCellar</title>
    <meta
      name="description"
      content="This pricing calculator estimates the cost of storing and downloading data on the BNB Greenfield decentralized storage blockchain."
    />
    <meta property="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="BNB Greenfield Pricing Calculator - DCellar" />
    <meta
      name="twitter:description"
      content="This pricing calculator estimates the cost of storing and downloading data on the BNB Greenfield decentralized storage blockchain."
    />
    <meta
      property="twitter:image"
      content={`${assetPrefix}/images/pricing-calculator_thumbnail.png`}
    />
  </Head>
  )
}
