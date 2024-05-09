import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearUploadRecords, retryUploadTasks } from '@/store/slices/global';
import React from 'react';

export type ActionButtonProps = {
  type: 'clear' | 'retry' | 'clear-all' | 'retry-all';
  ids: number[];
  text?: string;
};

const actionItems = [
  {
    type: 'clear',
    text: 'Clear',
    icon: 'delete',
  },
  {
    type: 'retry',
    text: 'Retry',
    icon: 'retry',
  },
  {
    type: 'clear-all',
    text: 'Clear All Records',
    icon: 'delete',
  },
  {
    type: 'retry-all',
    text: 'Retry All',
    icon: 'retry',
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

  const onClear = (ids: number[]) => {
    dispatch(clearUploadRecords({ ids, loginAccount }));
  };
  const onRetry = (ids: number[]) => {
    dispatch(retryUploadTasks({ ids }));
  };
  const onClick = () => {
    switch (type) {
      case 'clear':
      case 'clear-all':
        onClear(ids);
        break;
      case 'retry':
      case 'retry-all':
        onRetry(ids);
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
