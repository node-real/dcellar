import { Box, Flex, Image, Text } from '@totejs/uikit';
import React, { memo } from 'react';
import { NewPA } from './NewPA';
import { assetPrefix } from '@/base/env';

type TProps =  {
  empty: boolean;
}

export const PAListEmpty = memo<TProps>(function ListEmpty({ empty }) {
  return (
    <Box>
      {empty && (
        <Flex flex={1} flexDirection={'column'} alignItems={'center'} justifyContent="center" mb={40}>
          <Image
            src={`${assetPrefix}/images/accounts/empty-account.svg`}
            w="120px"
            h="120px"
            alt="create payment account image"
          />
          <Text fontSize={18} fontWeight={700} mb={4} color={'readable.normal'}>
            No Payment Accounts
          </Text>
          <Text fontSize={'14px'} fontWeight={500} lineHeight={'24px'} mb={16}  color={'readable.tertiary'}>
            Create payment accounts to pay for storage and bandwidth.
          </Text>
          <NewPA />
        </Flex>
      )}
    </Box>
  );
});
