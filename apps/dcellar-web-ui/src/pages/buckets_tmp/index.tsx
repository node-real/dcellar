import React from 'react';
import Head from 'next/head';

import { BucketList } from '@/modules/buckets/List';

const Buckets = () => (
  <>
    <Head>
      <title>Buckets - DCellar</title>
    </Head>
    <BucketList />
  </>
);

export default Buckets;
