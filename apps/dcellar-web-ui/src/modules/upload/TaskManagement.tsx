import { Box, Text } from '@totejs/uikit';
import React from 'react';
import { UploadingObjects } from './UploadingObjects';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectUploadQueue, setTaskManagement } from '@/store/slices/global';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import { DCDrawer } from '@/components/common/DCDrawer';

export const TaskManagement = () => {
  const dispatch = useAppDispatch();
  const { taskManagement } = useAppSelector((root) => root.global);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const uploadQueue = useAppSelector(selectUploadQueue(loginAccount));
  const isOpen = taskManagement;
  const onToggle = () => {
    dispatch(setTaskManagement(!isOpen));
  };
  const setClose = () => {
    dispatch(setTaskManagement(false));
  }
  const isUploading = uploadQueue.some((i) => ['WAIT', 'HASH', 'READY', 'UPLOAD', 'SEAL'].includes(i.status));

  const renderButton = () => {
    if (isUploading) {
      return (
        <DCButton
          marginRight={'12px'}
          variant="ghost"
          onClick={() => onToggle()}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Loading />
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
        marginRight={24}
        onClick={() => onToggle()}
      >
        <DCButton
          variant="ghost"
          fontWeight={500}
          border='none'
          fontSize={14}
          paddingX={8}
          borderRadius={4}
          h={44}
          color='readable.secondary'
          _hover={{
            bg: 'bg.bottom',
          }}
        >
          Task Management
        </DCButton>
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      <DCDrawer isOpen={isOpen} onClose={() => setClose()}>
        <UploadingObjects />
      </DCDrawer>
    </>
  );
};
