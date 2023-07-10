import { Box, Flex, QDrawer, Text } from '@totejs/uikit';
import React, { useState } from 'react';
import { UploadingObjects } from './UploadingObjects';
import { LoadingIcon } from '@/components/common/SvgIcon/LoadingIcon';
import { useAppSelector } from '@/store';
import { selectUploadQueue } from '@/store/slices/global';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';

export const TaskManagement = () => {
  const [open, setOpen] = useState(false);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = useAppSelector(selectUploadQueue(loginAccount));

  const isUploading = queue.some((i) => i.status === 'UPLOAD');

  const renderButton = () => {
    if (isUploading) {
      return (
        <DCButton variant='ghost' onClick={() => setOpen(true)} alignItems={'center'} justifyContent={'center'}>
          <Loading/>
          <Text fontWeight={500} fontSize={'14px'} marginLeft={'8px'}>
            Uploading...
          </Text>
        </DCButton>
      );
    }
    return (
      <Box
        cursor={'pointer'}
        alignSelf={'center'}
        marginRight={'12px'}
        onClick={() => {
          setOpen(true);
          console.log('task management trigger');
        }}
      >
        <DCButton variant='ghost' fontWeight={'500'}>Task Management</DCButton>
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      <QDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        width={'568px'}
        closeOnOverlayClick={false}
      >
        <UploadingObjects />
      </QDrawer>
    </>
  );
};
