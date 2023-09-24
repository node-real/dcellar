import { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { DCDrawer } from '@/components/common/DCDrawer';
import { AllBucketInfo, setBucketOperation } from '@/store/slices/bucket';
import { useModalValues } from '@/hooks/useModalValues';
import { DCModal } from '@/components/common/DCModal';
import { DetailOperation } from '@/modules/bucket/components/DetailOperation';
import { CreateOperation } from '@/modules/bucket/components/CreateOperation';

interface BucketOperationsProps {}

export const BucketOperations = memo<BucketOperationsProps>(function BucketOperations() {
  const dispatch = useAppDispatch();
  const { bucketOperation, bucketInfo } = useAppSelector((root) => root.bucket);
  const [id, operation] = bucketOperation;
  const isDrawer = ['detail', 'create'].includes(operation);
  const isModal = ['delete'].includes(operation);
  const _operation = useModalValues<BucketOperationsProps>(operation);
  const selectBucketInfo = bucketInfo[id] || {};
  const _selectBucketInfo = useModalValues<AllBucketInfo>(selectBucketInfo);

  const onClose = () => {
    dispatch(setBucketOperation(['', '']));
  };

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'detail':
        return <DetailOperation selectedBucketInfo={_selectBucketInfo} />;
      case 'create':
        return <CreateOperation onClose={onClose} />;
      case 'delete':
        return <div>delete</div>;
      default:
        return null;
    }
  }, [_operation, _selectBucketInfo]);

  const modalOpen = !!operation;

  return (
    <>
      <DCDrawer isOpen={modalOpen && isDrawer} onClose={onClose}>
        {modalContent}
      </DCDrawer>
      <DCModal isOpen={modalOpen && isModal} onClose={onClose}>
        {modalContent}
      </DCModal>
    </>
  );
});
