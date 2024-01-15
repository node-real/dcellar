import React, { memo, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TBucket, setBucketOperation, BucketOperationsType } from '@/store/slices/bucket';
import { useModalValues } from '@/hooks/useModalValues';
import { DCModal } from '@/components/common/DCModal';
import {
  defaultNullObject,
  DetailBucketOperation,
} from '@/modules/bucket/components/DetailBucketOperation';
import { CreateBucketOperation } from '@/modules/bucket/components/CreateBucketOperation';
import { useUnmount } from 'ahooks';
import { DeleteBucketOperation } from '@/modules/bucket/components/DeleteBucketOperation';
import { ModalCloseButton } from '@totejs/uikit';
import { ShareOperation } from '@/modules/object/components/ShareOperation';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';

interface BucketOperationsProps {
  level?: 0 | 1;
}

export const BucketOperations = memo<BucketOperationsProps>(function BucketOperations({
  level = 0,
}) {
  const dispatch = useAppDispatch();
  const { bucketOperation, bucketInfo } = useAppSelector((root) => root.bucket);
  const [id, operation] = bucketOperation[level];
  const isDrawer = ['detail', 'create', 'share'].includes(operation);
  const isModal = ['delete'].includes(operation);
  const _operation = useModalValues<BucketOperationsType>(operation);
  const selectBucketInfo = bucketInfo[id] || {};
  const _selectBucketInfo = useModalValues<TBucket>(selectBucketInfo);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const primarySp = useModalValues(primarySpInfo[_selectBucketInfo.BucketName]);

  const onClose = useCallback(() => {
    dispatch(setBucketOperation({ level, operation: ['', ''] }));
  }, [level, dispatch]);

  useUnmount(onClose);

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'detail':
        return <DetailBucketOperation selectedBucketInfo={_selectBucketInfo} />;
      case 'create':
        return <CreateBucketOperation onClose={onClose} />;
      case 'delete':
        return <DeleteBucketOperation onClose={onClose} selectedBucketInfo={_selectBucketInfo} />;
      case 'share':
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
      default:
        return null;
    }
  }, [_operation, _selectBucketInfo, primarySp]);

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
