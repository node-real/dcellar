import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { Loading } from '@/components/common/Loading';
import { useModalValues } from '@/hooks/useModalValues';
import { BatchDeleteObjectOperation } from '@/modules/object/components/BatchDeleteObjectOperation';
import { CancelObjectOperation } from '@/modules/object/components/CancelObjectOperation';
import { CreateFolderOperation } from '@/modules/object/components/CreateFolderOperation';
import { DeleteObjectOperation } from '@/modules/object/components/DeleteObjectOperation';
import { DetailFolderOperation } from '@/modules/object/components/DetailFolderOperation';
import { DetailObjectOperation } from '@/modules/object/components/DetailObjectOperation';
import { DownloadObjectOperation } from '@/modules/object/components/DownloadObjectOperation';
import { ShareOperation } from '@/modules/object/components/ShareOperation';
import { UploadObjectsOperation } from '@/modules/upload/UploadObjectsOperation';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import {
  ObjectOperationsType,
  TEditUploadContent,
  setObjectOperation,
  setupDummyFolder,
  setupListObjects,
} from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { ModalCloseButton } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { get, isEmpty } from 'lodash-es';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { EditObjectTagsOperation } from './EditObjectTagsOperation';
import { UpdateObjectTagsOperation } from './UpdateObjectTagsOperation';

interface ObjectOperationsProps {
  level?: 0 | 1;
}

export const ObjectOperations = memo<ObjectOperationsProps>(function ObjectOperations({
  level = 0,
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectOperation = useAppSelector((root) => root.object.objectOperation);
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);

  const [id, operation, params] = objectOperation[level];
  const bucketName = params?.bucketName || currentBucketName;
  const _operation = useModalValues<ObjectOperationsType>(operation);
  const selectObjectInfo = objectRecords[id] || {};
  const _selectObjectInfo = useModalValues<ObjectMeta>(selectObjectInfo);
  const { BucketName } = _selectObjectInfo.ObjectInfo || {};
  const selectBucket = useModalValues(bucketRecords[BucketName || bucketName] || {});
  const bucketAccountDetail = useAppSelector(selectAccount(selectBucket.PaymentAddress));
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const primarySp = useModalValues(primarySpRecords[BucketName || bucketName]);
  const isDrawer = [
    'folder_detail',
    'detail',
    'create_folder',
    'share',
    'upload',
    'edit_tags',
    'update_tags',
  ].includes(operation);
  const isModal = ['delete', 'cancel', 'download', 'batch_delete'].includes(operation);

  const onClose = useCallback(() => {
    dispatch(setObjectOperation({ level, operation: ['', ''] }));
  }, [level, dispatch]);

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
      case 'folder_detail':
        return (
          <DetailFolderOperation
            objectName={objectName}
            selectBucket={selectBucket}
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
      case 'download': {
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
      }
      case 'share':
        if (isEmpty(_selectObjectInfo) && !objectName.endsWith('/')) return <Loading />;
        return (
          <ShareOperation
            selectObjectInfo={_selectObjectInfo}
            primarySp={primarySp}
            objectName={objectName}
          />
        );
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
      case 'update_tags':
        return <UpdateObjectTagsOperation id={id} object={_selectObjectInfo} onClose={onClose} />;
      case 'edit_tags':
        return <EditObjectTagsOperation onClose={onClose} />;
      default:
        return null;
    }
  }, [
    selectBucket,
    bucketAccountDetail,
    primarySp,
    id,
    _operation,
    _selectObjectInfo,
    refetch,
    onClose,
    params,
  ]);

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

  return (
    <>
      <DCDrawer isOpen={!!operation && isDrawer} onClose={onClose}>
        {modalContent}
      </DCDrawer>
      <DCModal isOpen={!!operation && isModal} onClose={onClose}>
        {modalContent}
        <ModalCloseButton />
      </DCModal>
    </>
  );
});
