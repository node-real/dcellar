import React, { memo } from 'react';
import { ActionButton } from '@/modules/file/components/FileTable';
import { DeleteIcon, DownloadIcon } from '@totejs/icons';
import { Text } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { setStatusDetail } from '@/store/slices/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { useMount } from 'ahooks';
import { setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';

interface BatchOperationsProps {}

export const BatchOperations = memo<BatchOperationsProps>(function BatchOperations() {
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const selected = selectedRowKeys.length;
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bucketName, objects, path } = useAppSelector((root) => root.object);
  const quotas = useAppSelector((root) => root.bucket.quotas);
  const quotaData = quotas[bucketName];

  useMount(() => {
    dispatch(setupBucketQuota(bucketName));
  });

  const onError = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const onBatchDownload = async () => {
    const items = objects[path].filter((i) => selectedRowKeys.includes(i.objectName));
    let remainQuota = quotaRemains(
      quotaData,
      items.reduce((x, y) => x + y.payloadSize, 0),
    );
    if (!remainQuota) return onError(E_NO_QUOTA);
    // const operator = primarySp.operatorAddress;
    // const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
    // const domain = getDomain();
    // todo
  };

  return (
    <>
      <Text as="div" fontWeight={500} alignItems="center" display="flex">
        {selected} File{selected > 1 && 's'} Selected{' '}
        <ActionButton
          gaClickName="dc.file.batch_download_btn.click"
          ml={16}
          onClick={onBatchDownload}
        >
          <DownloadIcon boxSize={16} size="md" color="readable.brand6" />
        </ActionButton>
        <ActionButton gaClickName="dc.file.batch_delete_btn.click" ml={16}>
          <DeleteIcon boxSize={16} size="md" color="readable.brand6" />
        </ActionButton>
      </Text>
    </>
  );
});
