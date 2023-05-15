import React from 'react';
import { Flex, ModalBody, Text } from '@totejs/uikit';
import { Image } from '@totejs/uikit';
import { POPPINS_FONT } from '@/modules/wallet/constants';
import { DELETE_ICON_URL } from '@/modules/file/constant';

export const DeletingBucket = () => {
  return (
    <ModalBody textAlign={'center'}>
      <Flex justifyContent={'center'}>
        <Image src={DELETE_ICON_URL} w={'120px'} h={'120px'} alt={'deleting'} />
      </Flex>
      <Text
        fontSize={'24px'}
        fontWeight={600}
        fontFamily={POPPINS_FONT}
        lineHeight="150%"
        marginY={'16px'}
      >
        Deleting Bucket
      </Text>
      <Text color="readable.tertiary" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
        Confirm this transaction in your wallet.
      </Text>
    </ModalBody>
  );
};
