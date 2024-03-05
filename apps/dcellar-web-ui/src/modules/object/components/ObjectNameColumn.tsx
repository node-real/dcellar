import { IconFont } from '@/components/IconFont';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { quotaRemains } from '@/facade/bucket';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { E_GET_QUOTA_FAILED, E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { previewObject } from '@/facade/object';
import { contentIconTypeToExtension } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketQuota, setupBucketQuota } from '@/store/slices/bucket';
import {
  ObjectEntity,
  setObjectListPage,
  setObjectOperation,
  setObjectShareModePath,
  setStatusDetail,
} from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { encodeObjectName } from '@/utils/string';
import styled from '@emotion/styled';
import { Tooltip, toast } from '@node-real/uikit';
import { trimEnd } from 'lodash-es';
import Link from 'next/link';
import { memo } from 'react';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';

interface ObjectNameColumnProps {
  item: ObjectEntity;
  disabled: boolean;
  shareMode?: boolean;
}

export const ObjectNameColumn = memo<ObjectNameColumnProps>(function NameItem({
  item,
  disabled,
  shareMode = false,
}) {
  const { folder, objectName, name, visibility } = item;
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountRecords = useAppSelector((root) => root.persist.accountRecords);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);

  const { setOpenAuthModal } = useOffChainAuth();

  const primarySp = primarySpRecords[currentBucketName];
  const fileType = contentIconTypeToExtension(objectName);

  const errorHandler = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const download = async (object: ObjectEntity) => {
    const config = accountRecords[loginAccount] || {};
    if (config.directDownload || shareMode) {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const gParams = {
        bucketName: currentBucketName,
        objectName: object.objectName,
        endpoint: primarySp.endpoint,
        seedString,
        address: loginAccount,
      };
      const [objectInfo, quotaData, error] = await getObjectInfoAndBucketQuota(gParams);
      if (
        ['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')
      ) {
        return errorHandler(E_OFF_CHAIN_AUTH);
      }
      if (objectInfo === null) {
        return errorHandler(E_UNKNOWN);
      }
      if (!shareMode) {
        if (quotaData === null) {
          return errorHandler(E_GET_QUOTA_FAILED);
        }
        const remainQuota = quotaRemains(quotaData, object.payloadSize + '');
        // update quota data.
        dispatch(setBucketQuota({ bucketName: currentBucketName, quota: quotaData }));
        if (!remainQuota) return errorHandler(E_NO_QUOTA);
      }
      const params = {
        primarySp,
        objectInfo,
        address: loginAccount,
      };
      const [success, opsError] = await previewObject(params, seedString);
      if (opsError) return errorHandler(opsError);
      dispatch(setupBucketQuota(currentBucketName));
      return success;
    }

    return dispatch(
      setObjectOperation({
        level: 1,
        operation: [`${object.bucketName}/${object.objectName}`, 'download', { action: 'view' }],
      }),
    );
  };

  const content = (
    <>
      <IconFont w={20} type={`${fileType}-file`} /> <span title={name}>{name}</span>
      {visibility === 1 && !folder && (
        <Tooltip content={'Public'} placement={'bottom-start'}>
          <span className="access-icon">
            <IconFont type="public" w={20} />
          </span>
        </Tooltip>
      )}
    </>
  );

  return (
    <Container>
      <Link
        href={`/buckets/${currentBucketName}/${encodeObjectName(objectName)}`}
        onClick={(e) => {
          if (disabled) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          if (folder) {
            const path = trimEnd([currentBucketName, objectName].join('/'), '/');
            dispatch(setObjectListPage({ path, current: 0 }));
            if (shareMode) {
              e.stopPropagation();
              e.preventDefault();
              dispatch(
                setObjectShareModePath(`${currentBucketName}/${encodeObjectName(objectName)}`),
              );
            }
            return;
          }
          if (!isBucketOwner && !shareMode) {
            toast.warning({ description: 'You are browsing a bucket created by someone else. ' });
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          e.preventDefault();
          download(item);
        }}
      >
        {content}
      </Link>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;

  a {
    display: flex;
    align-items: center;
    min-width: 0;

    span:first-of-type {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
