import { Text, useDisclosure } from '@totejs/uikit';
import React from 'react';

import AddIcon from '@/public/images/icons/add.svg';
import { CreateBucket } from './CreateBucket';
import { DCButton } from '@/components/common/DCButton';

export const NewBucket = ({ refetch, gaShowName, gaClickName, ...style }: any) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <>
      <DCButton
        gaClickName={gaClickName}
        gaShowName={gaShowName}
        variant="dcPrimary"
        width={'153px'}
        size={'md'}
        h="40px"
        marginBottom={'12px'}
        onClick={() => onOpen()}
        {...style}
      >
        <AddIcon size={'16px'} width={'16px'} height={'16px'} color="#fff" />
        <Text marginLeft={'8px'} fontSize={'14px'} fontWeight={500} lineHeight={'20px'}>
          New Bucket
        </Text>
      </DCButton>
      {/* This isOpen condition is to reset modal state */}
      {isOpen && <CreateBucket refetch={refetch} isOpen={isOpen} onClose={onClose} />}
    </>
  );
};
