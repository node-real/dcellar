import { Box, Flex, QDrawer, Text } from '@totejs/uikit';
import React, { useState } from 'react';
import { UploadingObjects } from './UploadingObjects';
import { LoadingIcon } from '@/components/common/SvgIcon/LoadingIcon';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectUploadQueue, setTaskManagement } from '@/store/slices/global';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import { DCDrawer } from '@/components/common/DCDrawer';

export const TaskManagement = () => {
  const dispatch = useAppDispatch();
  const { taskManagement } = useAppSelector((root) => root.global);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = useAppSelector(selectUploadQueue(loginAccount));
  const isOpen = taskManagement;
  const setOpen = (boo: boolean) => {
    dispatch(setTaskManagement(boo));
  };
  const isUploading = queue.some((i) => i.status === 'UPLOAD');

  const renderButton = () => {
    if (isUploading) {
      return (
        <DCButton
          marginRight={'12px'}
          variant="ghost"
          onClick={() => setOpen(true)}
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
        marginRight={'12px'}
        onClick={() => {
          setOpen(true);
        }}
      >
        <DCButton variant="ghost" fontWeight={'500'}>
          Task Management
        </DCButton>
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      <DCDrawer isOpen={isOpen} onClose={() => setOpen(false)}>
        <UploadingObjects />
      </DCDrawer>
    </>
  );
};
