import React from 'react';
import { Flex, ModalBody, Text } from '@totejs/uikit';

import CreatingBucketIcon from '@/public/images/buckets/creating-bucket.svg';
import { POPPINS_FONT } from '@/modules/wallet/constants';

export const CreatingBucket = () => {
  return (
    <ModalBody textAlign={'center'}>
      <Flex justifyContent={'center'}>
        <CreatingBucketIcon />
      </Flex>
      <Text
        fontSize={'24px'}
        fontWeight={600}
        fontFamily={POPPINS_FONT}
        lineHeight="150%"
        marginY={'16px'}
      >
        Creating Bucket
      </Text>
      <Text color="readable.tertiary" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
        Confirm this transaction in your wallet.
      </Text>
    </ModalBody>
  );
};
