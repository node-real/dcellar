import { Box, Flex, QDrawer, Text } from '@totejs/uikit';
import React, { useState } from 'react';
import { UploadingObjects } from './UploadingObjects';
import { LoadingIcon } from '@/components/common/SvgIcon/LoadingIcon';
import { useAppSelector } from '@/store';
import { selectUploadQueue } from '@/store/slices/global';

// 上传进度也是一个全局状态，最好也在redux中管理
export const TaskManagement = () => {
  const [open, setOpen] = useState(false);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = useAppSelector(selectUploadQueue(loginAccount));

  const isUploading = queue.some((i) => i.status === 'UPLOAD');

  // 当列表点击上传确认时，触发task management的trigger
  const renderButton = () => {
    if (isUploading) {
      return (
        <Flex onClick={() => setOpen(true)} alignItems={'center'} justifyContent={'center'}>
          <LoadingIcon />
          <Text color="readable.tertiary" fontSize={'14px'}>
            Uploading...
          </Text>
        </Flex>
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
        <Box>Task Management</Box>
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      {/* 上传过程中的存到这里 */}
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
