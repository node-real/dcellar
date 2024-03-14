import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { useModalValues } from '@/hooks/useModalValues';
import { CreateBucketOperation } from '@/modules/bucket/components/CreateBucketOperation';
import { DeleteBucketOperation } from '@/modules/bucket/components/DeleteBucketOperation';
import {
  DetailBucketOperation,
  defaultNullObject,
} from '@/modules/bucket/components/DetailBucketOperation';
import { ShareOperation } from '@/modules/object/components/ShareOperation';
import { useAppDispatch, useAppSelector } from '@/store';
import { BucketOperationsType, TBucket, setBucketOperation } from '@/store/slices/bucket';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { ModalCloseButton } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { memo, useCallback, useMemo } from 'react';
import { EditBucketTagsOperation } from './EditBucketTagsOperation';
import { PaymentAccountOperation } from './PaymentAccountOperation';
import { UpdateBucketTagsOperation } from './UpdateBucketTagsOperation';

interface BucketOperationsProps {
  level?: 0 | 1;
}

export const BucketOperations = memo<BucketOperationsProps>(function BucketOperations({
  level = 0,
}) {
  const dispatch = useAppDispatch();
  const bucketOperation = useAppSelector((root) => root.bucket.bucketOperation);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);

  const [id, operation] = bucketOperation[level];
  const isDrawer = [
    'detail',
    'create',
    'share',
    'payment_account',
    'tags',
    'edit_tags',
    'update_tags',
  ].includes(operation);
  const isModal = ['delete'].includes(operation);
  const _operation = useModalValues<BucketOperationsType>(operation);
  const selectBucketInfo = bucketRecords[id] || {};
  const _selectBucketInfo = useModalValues<TBucket>(selectBucketInfo);
  const primarySp = useModalValues(primarySpRecords[_selectBucketInfo.BucketName]);

  const onClose = useCallback(() => {
    dispatch(setBucketOperation({ level, operation: ['', ''] }));
  }, [level, dispatch]);

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'detail':
        return <DetailBucketOperation selectedBucketInfo={_selectBucketInfo} />;
      case 'create':
        return <CreateBucketOperation onClose={onClose} />;
      case 'delete':
        return <DeleteBucketOperation onClose={onClose} selectedBucketInfo={_selectBucketInfo} />;
      case 'share': {
        const nullObjectMeta: ObjectMeta = {
          ...defaultNullObject,
          ObjectInfo: {
            ...defaultNullObject.ObjectInfo,
            BucketName: _selectBucketInfo.BucketName,
          },
        };
        return (
          <ShareOperation selectObjectInfo={nullObjectMeta} primarySp={primarySp} objectName={''} />
        );
      }
      case 'payment_account':
        return <PaymentAccountOperation bucket={_selectBucketInfo} onClose={onClose} />;
      case 'edit_tags':
        return <EditBucketTagsOperation onClose={onClose} />;
      case 'update_tags':
        return <UpdateBucketTagsOperation bucket={_selectBucketInfo} onClose={onClose} />;
      default:
        return null;
    }
  }, [_operation, _selectBucketInfo, onClose, primarySp]);

  useUnmount(onClose);

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
