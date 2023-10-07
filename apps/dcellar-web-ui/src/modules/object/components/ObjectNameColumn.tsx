import React, { memo } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import {
  ObjectItem,
  setCurrentObjectPage,
  setObjectOperation,
  setStatusDetail,
} from '@/store/slices/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { toast, Tooltip } from '@totejs/uikit';
import { encodeObjectName } from '@/utils/string';
import { trimEnd } from 'lodash-es';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { getSpOffChainData } from '@/store/slices/persist';
import { previewObject } from '@/facade/object';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_GET_QUOTA_FAILED, E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { quotaRemains } from '@/facade/bucket';
import { setReadQuota, setupBucketQuota } from '@/store/slices/bucket';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { IconFont } from '@/components/IconFont';
import { contentIconTypeToExtension } from '@/modules/object/utils';

interface ObjectNameColumnProps {
  item: ObjectItem;
  disabled: Boolean;
}

export const ObjectNameColumn = memo<ObjectNameColumnProps>(function NameItem({ item, disabled }) {
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { folder, objectName, name, visibility } = item;
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { bucketName } = useAppSelector((root) => root.object);
  const { owner } = useAppSelector((root) => root.bucket);
  const primarySp = primarySpInfo[bucketName];
  const fileType = contentIconTypeToExtension(objectName);
  const { loginAccount, accounts } = useAppSelector((root) => root.persist);
  const onError = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };
  const download = async (object: ObjectItem) => {
    const config = accounts[loginAccount] || {};
    if (config.directDownload) {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const gParams = {
        bucketName,
        objectName: object.objectName,
        endpoint: primarySp.endpoint,
        seedString,
        address: loginAccount,
      };
      const [objectInfo, quotaData, error] = await getObjectInfoAndBucketQuota(gParams);
      if (error === 'invalid signature') {
        return onError(E_OFF_CHAIN_AUTH);
      }
      if (objectInfo === null) {
        return onError(E_UNKNOWN);
      }
      if (quotaData === null) {
        return onError(E_GET_QUOTA_FAILED);
      }
      let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
      // update quota data.
      dispatch(setReadQuota({ bucketName, quota: quotaData }));
      if (!remainQuota) return onError(E_NO_QUOTA);
      const params = {
        primarySp,
        objectInfo,
        address: loginAccount,
      };
      const [success, opsError] = await previewObject(params, seedString);
      if (opsError) return onError(opsError);
      dispatch(setupBucketQuota(bucketName));
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
        href={`/buckets/${bucketName}/${encodeObjectName(objectName)}`}
        onClick={(e) => {
          if (!owner) {
            toast.warning({ description: 'You are browsing a bucket created by someone else. ' });
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          if (disabled) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          if (folder) {
            const path = trimEnd([bucketName, objectName].join('/'), '/');
            dispatch(setCurrentObjectPage({ path, current: 0 }));
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
