import React from 'react';
import { Text, Box } from '@totejs/uikit';

import { POPPINS_FONT } from '@/modules/wallet/constants';
import { VirtualListDemo } from './components/VirtualList';

export const ListDemo = () => {
  return (
    <Box width={'100%'} padding={'16px 24px 0'}>
      <Text
        as={'h1'}
        fontSize={'24px'}
        lineHeight={'48px'}
        fontFamily={POPPINS_FONT}
        fontWeight={700}
      >
        Buckets
      </Text>
      <Box>
        <VirtualListDemo />
      </Box>
    </Box>
  );
};
