import React from 'react';
import { Text, Flex } from '@totejs/uikit';

import { POPPINS_FONT } from '@/modules/wallet/constants';
import { TableList } from './components/TableList';
import { SPProvider } from '@/context/GlobalContext/SPProvider';
import { WalletBalanceProvider } from '@/context/GlobalContext/WalletBalanceContext';

type TSP = {
  address: string;
  endpoint: string;
};

export const DefaultSP = React.createContext<TSP | null>(null);

export const BucketList = () => {
  return (
    <WalletBalanceProvider>
      <SPProvider>
        <Flex
          flexDirection={'column'}
          width={'100%'}
          boxSizing="border-box"
          h="100%"
          padding={'16px 24px 0'}
        >
          <Text
            as={'h1'}
            fontSize={'24px'}
            lineHeight={'48px'}
            fontFamily={POPPINS_FONT}
            fontWeight={700}
          >
            Buckets
          </Text>
          <Flex flex={1}>
            <TableList />
          </Flex>
        </Flex>
      </SPProvider>
    </WalletBalanceProvider>
  );
};
