import React from 'react';
import { Flex, Modal, ModalBody, ModalFooter, Text } from '@totejs/uikit';

import { POPPINS_FONT } from '@/modules/wallet/constants';
import CreateFailedIcon from '@/public/images/buckets/create-failed.svg';
import { DCButton } from '@/components/common/DCButton';

export const CreateBucketFailed = ({
  errorMsg,
  onClose,
}: {
  errorMsg: string;
  onClose: () => void;
}) => {
  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalBody textAlign={'center'}>
        <Flex justifyContent={'center'}>
          <CreateFailedIcon />
        </Flex>
        <Text
          fontSize={'24px'}
          fontWeight={600}
          fontFamily={POPPINS_FONT}
          lineHeight="150%"
          marginY={'16px'}
        >
          Created Failed
        </Text>
        {/* TODO get detail error */}
        {/* <Text
          color="#474D57"
          fontSize={'18px'}
          fontWeight="400"
          lineHeight={'22px'}
          marginBottom="8px"
        >
          This bucket already created by others.
        </Text> */}
        <Text fontSize={'14px'} fontWeight="400" lineHeight={'17px'} color="#76808F">
          {errorMsg}
        </Text>
      </ModalBody>
      <ModalFooter>
        <DCButton width={'100%'} onClick={onClose}>
          Got It
        </DCButton>
      </ModalFooter>
    </Modal>
  );
};
