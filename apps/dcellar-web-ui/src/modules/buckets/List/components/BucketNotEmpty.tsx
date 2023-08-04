import React from 'react';
import { Flex, ModalBody, ModalFooter, Text } from '@totejs/uikit';

import BucketNotEmptyIcon from '@/public/images/buckets/bucket-not-empty.svg';
import { POPPINS_FONT } from '@/modules/wallet/constants';
import { DCButton } from '@/components/common/DCButton';

export const BucketNotEmpty = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <ModalBody textAlign={'center'} mt={0}>
        <Flex justifyContent={'center'}>
          <BucketNotEmptyIcon />
        </Flex>
        <Text
          fontSize={'24px'}
          fontWeight={600}
          fontFamily={POPPINS_FONT}
          lineHeight="150%"
          marginY={'16px'}
        >
          Bucket not Empty
        </Text>
        <Text color="#474D57" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
          Only empty bucket can be deleted. Please delete all objects in this bucket first.
        </Text>
      </ModalBody>
      <ModalFooter>
        <DCButton
          variant="dcPrimary"
          width={'100%'}
          onClick={onClose}
          gaClickName="dc.bucket.not_empty_modal.close.click"
        >
          Got It
        </DCButton>
      </ModalFooter>
    </>
  );
};
