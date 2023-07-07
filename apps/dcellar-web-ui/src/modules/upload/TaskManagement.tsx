import { DotLoading } from '@/components/common/DotLoading';
import { LoadingIcon } from '@/components/common/SvgIcon/LoadingIcon';
import { Box, Flex, QDrawer, Text, useDisclosure } from '@totejs/uikit';
import React from 'react';
import { UploadingObjects } from './UploadingObjects';
import { useAppSelector } from '@/store';
import { useDispatch } from 'react-redux';
import { setUploading } from '@/store/slices/object';


// 上传进度也是一个全局状态，最好也在redux中管理
export const TaskManagement = () => {
  // 能够拿到task management的trigger
  const dispatch = useDispatch();
  const { isOpen } = useAppSelector((root) => root.object.uploading);
  const onToggle = () => {
    dispatch(setUploading({ isOpen: !isOpen }))
  }
  const onClose = () => {
    dispatch(setUploading({isOpen: false}))
  }
  const isUploading = false;
  // 当列表点击上传确认时，触发task management的trigger
  const renderButton = () => {
    if (isUploading) {
      return (
        <Flex onClick={onToggle} alignItems={'center'} justifyContent={'center'}>
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
          onToggle()
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
      <QDrawer isOpen={isOpen} onClose={onClose} width={'568px'} closeOnOverlayClick={false}>
        <UploadingObjects />
      </QDrawer>
    </>
  );
};
