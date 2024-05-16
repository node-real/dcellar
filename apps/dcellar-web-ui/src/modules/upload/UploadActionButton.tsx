import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  cancelUploadingRequests,
  clearUploadRecords,
  retryUploadTasks,
  updateUploadStatus,
} from '@/store/slices/global';
import React, { useCallback } from 'react';

export type ActionButtonProps = {
  type: 'clear' | 'retry' | 'clear-all' | 'retry-all' | 'cancel' | 'cancel-all';
  ids: number[];
  text?: string;
};

const actionItems = [
  {
    type: 'cancel',
    text: 'Cancel',
    icon: 'stop',
  },
  {
    type: 'cancel-all',
    text: 'Stop Uploading',
    icon: 'stop',
  },
  {
    type: 'retry',
    text: 'Retry',
    icon: 'retry',
  },
  {
    type: 'retry-all',
    text: 'Retry All',
    icon: 'retry',
  },
  {
    type: 'clear',
    text: 'Clear',
    icon: 'delete',
  },
  {
    type: 'clear-all',
    text: 'Clear All Records',
    icon: 'delete',
  },
];

export const UploadActionButton = React.memo(function UploadActionButton({
  type,
  text,
  ids,
}: ActionButtonProps) {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const dispatch = useAppDispatch();
  const actionItem = actionItems.find((item) => item.type === type);

  const onCancel = useCallback(
    (ids: number[]) => {
      dispatch(
        updateUploadStatus({
          account: loginAccount,
          ids,
          status: 'CANCEL',
        }),
      );
      dispatch(cancelUploadingRequests({ ids }));
    },
    [dispatch, loginAccount],
  );
  const onClear = (ids: number[]) => {
    dispatch(clearUploadRecords({ ids, loginAccount }));
  };
  const onRetry = (ids: number[]) => {
    dispatch(retryUploadTasks({ ids }));
  };
  const onClick = () => {
    switch (type) {
      case 'cancel':
      case 'cancel-all':
        onCancel(ids);
        break;
      case 'retry':
      case 'retry-all':
        onRetry(ids);
        break;
      case 'clear':
      case 'clear-all':
        onClear(ids);
        break;
      default:
        break;
    }
  };

  return (
    <DCButton
      variant="ghost"
      padding="2px 4px"
      gap={2}
      fontSize={12}
      height={'auto'}
      _hover={{
        bg: 'bg.bottom',
      }}
      onClick={onClick}
    >
      {actionItem && (
        <>
          <IconFont type={actionItem.icon} />
          {text ? text : actionItem.text}
        </>
      )}
    </DCButton>
  );
});
