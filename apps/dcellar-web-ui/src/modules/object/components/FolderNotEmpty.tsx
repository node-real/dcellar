import React from 'react';
import { Flex, ModalBody, ModalFooter, Text } from '@totejs/uikit';

import BucketNotEmptyIcon from '@/public/images/buckets/bucket-not-empty.svg';
import { POPPINS_FONT } from '@/modules/wallet/constants';
import { DCButton } from '@/components/common/DCButton';
import { DCModal } from '@/components/common/DCModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { ObjectItem, setEditDelete } from '@/store/slices/object';

export const FolderNotEmpty = () => {
  const { editDelete } = useAppSelector((root) => root.object);
  const dispatch = useAppDispatch();

  const isOpen = !!editDelete.objectName;
  const onClose = () => {
    dispatch(setEditDelete({} as ObjectItem));
  };
  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.file.delete_confirm.modal.show"
      gaClickCloseName="dc.file.delete_confirm.close.click"
    >
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
          Folder Not Empty
        </Text>
        <Text color="#474D57" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
          Only empty folder can be deleted. Please delete all objects in this folder first.
        </Text>
      </ModalBody>
      <ModalFooter>
        <DCButton
          width={'100%'}
          gaClickName="dc.folder.not_empty_modal.close.click"
          onClick={onClose}
        >
          Got It
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
