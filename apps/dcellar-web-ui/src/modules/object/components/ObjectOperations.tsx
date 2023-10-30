import { memo, useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useModalValues } from '@/hooks/useModalValues';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import {
  ObjectOperationsType,
  setObjectOperation,
  setupDummyFolder,
  setupListObjects,
  TEditUploadContent,
} from '@/store/slices/object';
import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { selectAccount } from '@/store/slices/accounts';
import { getSpOffChainData } from '@/store/slices/persist';
import { get, isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';
import { DetailObjectOperation } from '@/modules/object/components/DetailObjectOperation';
import { DeleteObjectOperation } from '@/modules/object/components/DeleteObjectOperation';
import { ModalCloseButton } from '@totejs/uikit';
import { CancelObjectOperation } from '@/modules/object/components/CancelObjectOperation';
import { CreateFolderOperation } from '@/modules/object/components/CreateFolderOperation';
import { DownloadObjectOperation } from '@/modules/object/components/DownloadObjectOperation';
import { ShareOperation } from '@/modules/object/components/ShareOperation';
import { BatchDeleteObjectOperation } from '@/modules/object/components/BatchDeleteObjectOperation';
import { UploadObjectsOperation } from '@/modules/upload/UploadObjectsOperation';
import { useUnmount } from 'ahooks';

interface ObjectOperationsProps {
  level?: 0 | 1;
}

export const ObjectOperations = memo<ObjectOperationsProps>(function ObjectOperations({
  level = 0,
}) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const {
    objectOperation,
    objectsInfo,
    bucketName: _bucketName,
  } = useAppSelector((root) => root.object);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const [id, operation, params] = objectOperation[level];
  const bucketName = params?.bucketName || _bucketName;
  const isDrawer = ['detail', 'create_folder', 'share', 'upload'].includes(operation);
  const isModal = ['delete', 'cancel', 'download', 'batch_delete'].includes(operation);
  const _operation = useModalValues<ObjectOperationsType>(operation);
  const selectObjectInfo = objectsInfo[id] || {};
  const _selectObjectInfo = useModalValues<ObjectMeta>(selectObjectInfo);
  const { BucketName } = _selectObjectInfo.ObjectInfo || {};

  const selectBucket = useModalValues(bucketInfo[BucketName || bucketName] || {});
  const bucketAccountDetail = useAppSelector(selectAccount(selectBucket.PaymentAddress));
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const primarySp = useModalValues(primarySpInfo[BucketName || bucketName]);

  const onClose = useCallback(() => {
    dispatch(setObjectOperation({ level, operation: ['', ''] }));
  }, [level]);

  useEffect(() => {
    const className = 'overflow-hidden';
    const operation0 = objectOperation[0][1];
    const operation1 = objectOperation[1][1];
    if (!!operation0 || !!operation1) {
      document.documentElement.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
    }
  }, [objectOperation]);

  useUnmount(onClose);

  const refetch = useCallback(
    async (name?: string) => {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const query = new URLSearchParams();
      const params = {
        seedString,
        query,
        endpoint: primarySp.endpoint,
      };
      if (name) {
        await dispatch(setupListObjects(params));
        // if folder not exist in list, then add dummy folder
        dispatch(setupDummyFolder(name));
      } else {
        dispatch(setupListObjects(params));
      }
    },
    [primarySp, loginAccount, params],
  );

  const modalContent = useMemo(() => {
    if (isEmpty(selectBucket) || isEmpty(bucketAccountDetail) || isEmpty(primarySp))
      return <Loading />;

    const objectName = id.split('/').slice(1).join('/');

    switch (_operation) {
      case 'detail':
        if (isEmpty(_selectObjectInfo)) return <Loading />;
        return (
          <DetailObjectOperation
            selectObjectInfo={_selectObjectInfo}
            selectBucket={selectBucket}
            bucketAccountDetail={bucketAccountDetail}
            primarySp={primarySp}
          />
        );
      case 'cancel':
        if (isEmpty(_selectObjectInfo)) return <Loading />;
        return (
          <CancelObjectOperation
            selectObjectInfo={_selectObjectInfo}
            selectBucket={selectBucket}
            bucketAccountDetail={bucketAccountDetail}
            primarySp={primarySp}
            refetch={refetch}
            onClose={onClose}
          />
        );
      case 'create_folder':
        return (
          <CreateFolderOperation
            selectBucket={selectBucket}
            bucketAccountDetail={bucketAccountDetail}
            primarySp={primarySp}
            refetch={refetch}
            onClose={onClose}
          />
        );
      case 'download':
        if (isEmpty(_selectObjectInfo) && isEmpty(params)) return <Loading />;
        const ObjectInfo = get(_selectObjectInfo, 'ObjectInfo');

        return (
          <DownloadObjectOperation
            objectName={params?.objectName || ObjectInfo?.ObjectName || ''}
            payloadSize={params?.payloadSize || ObjectInfo?.PayloadSize || 0}
            primarySp={primarySp}
            onClose={onClose}
            actionParams={params}
          />
        );
      case 'share':
        if (isEmpty(_selectObjectInfo)) return <Loading />;
        return <ShareOperation selectObjectInfo={_selectObjectInfo} />;
      case 'delete':
        return (
          <DeleteObjectOperation
            selectObjectInfo={_selectObjectInfo}
            selectBucket={selectBucket}
            bucketAccountDetail={bucketAccountDetail}
            primarySp={primarySp}
            refetch={refetch}
            onClose={onClose}
            objectName={objectName}
          />
        );
      case 'batch_delete':
        return (
          <BatchDeleteObjectOperation
            selectBucket={selectBucket}
            bucketAccountDetail={bucketAccountDetail}
            refetch={refetch}
            onClose={onClose}
          />
        );
      case 'upload':
        return (
          <UploadObjectsOperation
            primarySp={primarySp}
            actionParams={params as TEditUploadContent}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
  }, [_operation, id, _selectObjectInfo, selectBucket, bucketAccountDetail, primarySp, params]);

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
