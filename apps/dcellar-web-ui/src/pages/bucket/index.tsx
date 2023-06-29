import Head from 'next/head';
import React from 'react';
import { BucketPage } from '@/modules/bucket';

export default function Bucket() {
  return (
    <>
      <Head>
        <title>Buckets - DCellar</title>
      </Head>
      <BucketPage />
    </>
  );
}
