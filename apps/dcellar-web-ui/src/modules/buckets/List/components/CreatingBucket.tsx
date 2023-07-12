import React from 'react';
import { Flex, Image, ModalBody, ModalCloseButton, Text, useDisclosure } from '@totejs/uikit';

import { POPPINS_FONT } from '@/modules/wallet/constants';
import { PENDING_ICON_URL } from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';

export const CreatingBucket = ({ onClose }: { onClose: () => void }) => {
  const { isOpen } = useDisclosure({ isOpen: true });
  return (
    <DCModal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalBody textAlign={'center'}>
        <Flex justifyContent={'center'}>
          <Image src={PENDING_ICON_URL} w={'120px'} h={'120px'} alt={'pending'} />
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
    </DCModal>
  );
};
