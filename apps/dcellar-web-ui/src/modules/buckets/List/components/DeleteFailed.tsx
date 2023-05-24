import React from 'react';
import { Flex, ModalBody, ModalFooter, Text } from '@totejs/uikit';

import { POPPINS_FONT } from '@/modules/wallet/constants';
import DeleteFailedIcon from '@/public/images/buckets/delete-failed.svg';
import { DCButton } from '@/components/common/DCButton';

export const DeleteBucketFailed = ({
  errorMsg,
  onClose,
}: {
  errorMsg: string;
  onClose: () => void;
}) => {
  return (
    <>
      <ModalBody textAlign={'center'} mt={0}>
        <Flex justifyContent={'center'}>
          <DeleteFailedIcon />
        </Flex>
        <Text
          fontSize={'24px'}
          fontWeight={600}
          fontFamily={POPPINS_FONT}
          lineHeight="150%"
          marginY={'16px'}
        >
          Deleted Failed
        </Text>
        <Text
          color="#474D57"
          fontSize={'18px'}
          fontWeight="400"
          lineHeight={'22px'}
          marginBottom="8px"
        >
          Sorry, there&apos;s something wrong when deleting the bucket.
        </Text>
        <Text fontSize={'14px'} fontWeight="400" lineHeight={'17px'} color="#76808F">
          {errorMsg}
        </Text>
      </ModalBody>
      <ModalFooter mt={24}>
        <DCButton
          variant="dcPrimary"
          width={'100%'}
          onClick={onClose}
          gaClickName="dc.bucket.delete_fail_modal.close.click"
        >
          Got It
        </DCButton>
      </ModalFooter>
    </>
  );
};
