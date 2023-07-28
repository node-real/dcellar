import React, { memo } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import {
  ObjectItem,
  setCurrentObjectPage,
  setEditDownload,
  setStatusDetail,
} from '@/store/slices/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { contentIconTypeToExtension } from '@/modules/file/utils';
import { Image, Tooltip } from '@totejs/uikit';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { encodeObjectName } from '@/utils/string';
import { trimEnd } from 'lodash-es';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { getSpOffChainData } from '@/store/slices/persist';
import { previewObject } from '@/facade/object';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import {
  E_GET_QUOTA_FAILED,
  E_NO_QUOTA,
  E_OBJECT_NAME_EXISTS,
  E_OFF_CHAIN_AUTH,
  E_UNKNOWN,
} from '@/facade/error';
import { quotaRemains } from '@/facade/bucket';
import { setupBucketQuota } from '@/store/slices/bucket';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

interface NameItemProps {
  item: ObjectItem;
}

export const NameItem = memo<NameItemProps>(function NameItem({ item }) {
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { folder, objectName, name, visibility } = item;
  const {primarySpInfo} = useAppSelector((root) => root.sp);
  const { bucketName } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const fileType = contentIconTypeToExtension(objectName);
  const { loginAccount, accounts } = useAppSelector((root) => root.persist);
  const icon = (
    <Image
      src={`/images/files/icons/${fileType.toLocaleLowerCase()}.svg`}
      alt={fileType}
      width={24}
      height={24}
    />
  );
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
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, primarySp.operatorAddress));
      const gParams = {
        bucketName,
        objectName: object.objectName,
        endpoint: primarySp.endpoint,
        seedString,
        address: loginAccount,
      }
      const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(gParams);
      if (objectInfo === null) {
        return onError(E_UNKNOWN);
      }
      if (quotaData === null) {
        return onError(E_GET_QUOTA_FAILED);
      }
      if (objectInfo === null) {
        return onError(E_OBJECT_NAME_EXISTS);
      }
      let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
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

    return dispatch(setEditDownload({ ...object, action: 'view' }));
  };

  const content = (
    <>
      {icon} <span title={name}>{name}</span>
      {visibility === 1 && !folder && (
        <Tooltip content={'Public'} placement={'bottom-start'}>
          <span className="access-icon">
            <PublicFileIcon fillColor="currentColor" />
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
  .access-icon {
    flex-shrink: 0;
  }
  svg {
    pointer-events: none;
    width: 24px;
  }
  img {
    flex-shrink: 0;
    min-width: 24px;
  }
  a {
    display: flex;
    align-items: center;
    min-width: 0;
    svg {
      flex-shrink: 0;
    }
    span:first-of-type {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
