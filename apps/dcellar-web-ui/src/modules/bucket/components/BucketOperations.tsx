import React, { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TBucket, setBucketOperation } from '@/store/slices/bucket';
import { useModalValues } from '@/hooks/useModalValues';
import { DCModal } from '@/components/common/DCModal';
import { DetailBucketOperation } from '@/modules/bucket/components/DetailBucketOperation';
import { CreateBucketOperation } from '@/modules/bucket/components/CreateBucketOperation';
import { useUnmount } from 'ahooks';
import { DeleteBucketOperation } from '@/modules/bucket/components/DeleteBucketOperation';
import { ModalCloseButton } from '@totejs/uikit';

interface BucketOperationsProps {}

export const BucketOperations = memo<BucketOperationsProps>(function BucketOperations() {
  const dispatch = useAppDispatch();
  const { bucketOperation, bucketInfo } = useAppSelector((root) => root.bucket);
  const [id, operation] = bucketOperation;
  const isDrawer = ['detail', 'create'].includes(operation);
  const isModal = ['delete'].includes(operation);
  const _operation = useModalValues<BucketOperationsProps>(operation);
  const selectBucketInfo = bucketInfo[id] || {};
  const _selectBucketInfo = useModalValues<TBucket>(selectBucketInfo);

  const onClose = () => {
    dispatch(setBucketOperation(['', '']));
  };

  useUnmount(onClose);

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'detail':
        return <DetailBucketOperation selectedBucketInfo={_selectBucketInfo} />;
      case 'create':
        return <CreateBucketOperation onClose={onClose} />;
      case 'delete':
        return <DeleteBucketOperation onClose={onClose} selectedBucketInfo={_selectBucketInfo} />;
      default:
        return null;
    }
  }, [_operation, _selectBucketInfo]);

  return (
    <>
      <DCDrawer isOpen={!!operation && isDrawer} onClose={onClose}>
        {modalContent}
      </DCDrawer>
      <DCModal isOpen={!!operation && isModal} onClose={onClose}>
        <ModalCloseButton />
        {modalContent}
      </DCModal>
    </>
  );
});
