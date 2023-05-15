import React from 'react';
import Head from 'next/head';

import { Wallet } from '@/modules/wallet';

const Index = () => (
  <>
    <Head>
      <title>Wallet - DCellar</title>
    </Head>
    <Wallet />
  </>
);

export default Index;
