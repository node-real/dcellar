import { Box, Text } from '@node-real/uikit';
import { useThrottleFn } from 'ahooks';

import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectHasUploadingTask, setTaskManagement } from '@/store/slices/global';
import { UploadingObjects } from './UploadingObjects';

export const TaskManagement = () => {
  const dispatch = useAppDispatch();
  const globalTaskManagementOpen = useAppSelector((root) => root.global.globalTaskManagementOpen);

  const isUploading = useAppSelector(selectHasUploadingTask);

  const { run: onToggle } = useThrottleFn(
    () => dispatch(setTaskManagement(!globalTaskManagementOpen)),
    {
      wait: 200,
    },
  );

  const setClose = () => {
    dispatch(setTaskManagement(false));
  };

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
      <DCDrawer isOpen={globalTaskManagementOpen} onClose={() => setClose()}>
        <UploadingObjects />
      </DCDrawer>
    </>
  );
};
