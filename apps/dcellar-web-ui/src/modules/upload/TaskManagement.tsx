import { Box, Text } from '@totejs/uikit';
import React from 'react';
import { UploadingObjects } from './UploadingObjects';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectHasUploadingTask, setTaskManagement } from '@/store/slices/global';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useThrottleFn, useUnmount } from 'ahooks';

export const TaskManagement = () => {
  const dispatch = useAppDispatch();
  const { taskManagement } = useAppSelector((root) => root.global);
  const isOpen = taskManagement;
  const { run: onToggle } = useThrottleFn(() => dispatch(setTaskManagement(!isOpen)), {
    wait: 200,
  });
  const setClose = () => {
    dispatch(setTaskManagement(false));
  };

  const isUploading = useAppSelector(selectHasUploadingTask);

  const renderButton = () => {
    return (
      <Box cursor={'pointer'} alignSelf={'center'} onClick={() => onToggle()}>
        <DCButton
          variant="ghost"
          border="none"
          h={44}
          color="readable.secondary"
          _hover={{
            bg: 'bg.bottom',
          }}
          fontSize={'14px'}
          px={8}
        >
          {isUploading ? (
            <>
              <Loading strokeWidth={2} iconSize={16} />
              <Text>Uploading...</Text>
            </>
          ) : (
            <>Task Management</>
          )}
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
