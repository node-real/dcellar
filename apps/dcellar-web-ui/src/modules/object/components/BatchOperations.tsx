import React, { memo, useMemo } from 'react';
import { Box, Text, Tooltip } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { setSelectedRowKeys, setStatusDetail } from '@/store/slices/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { useMount } from 'ahooks';
import { setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';
import { getSpOffChainData } from '@/store/slices/persist';
import { downloadObject } from '@/facade/object';
import { formatBytes } from '@/modules/file/utils';
import { GhostButton } from '@/modules/object/objects.style';

interface BatchOperationsProps {}

export const BatchOperations = memo<BatchOperationsProps>(function BatchOperations() {
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bucketName, objects, path } = useAppSelector((root) => root.object);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const quotas = useAppSelector((root) => root.bucket.quotas);
  const quotaData = quotas[bucketName] || {};
  const primarySp = primarySpInfo[bucketName];

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

  const items = useMemo(
    () => objects[path].filter((i) => selectedRowKeys.includes(i.objectName)),
    [objects, path, selectedRowKeys],
  );

  const remainQuota = useMemo(
    () =>
      quotaRemains(
        quotaData,
        items.reduce((x, y) => x + y.payloadSize, 0),
      ),
    [quotaData, items],
  );

  const onBatchDownload = async () => {
    if (!remainQuota) return onError(E_NO_QUOTA);
    const operator = primarySp.operatorAddress;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));

    for (const item of items) {
      const payload = { primarySp, objectInfo: item, address: loginAccount };
      await downloadObject(payload, seedString, items.length > 1);
    }
    dispatch(setSelectedRowKeys([]));
    dispatch(setupBucketQuota(bucketName));
  };

  const showDownload = items.every((i) => i.objectStatus === 1) || !items.length;
  const downloadable = remainQuota && showDownload && !!items.length;
  const remainQuotaBytes = formatBytes(
    quotaData.freeQuota + quotaData.readQuota - quotaData.consumedQuota,
  );

  return (
    <>
      <Text as="div" fontWeight={500} alignItems="center" display="flex" gap={12}>
        {showDownload && (
          <Tooltip
            trigger="hover"
            placement="bottom-start"
            visibility={remainQuota ? 'hidden' : 'visible'}
            content={
              <Box>
                No enough quota to download your selected objects. Please reduce the number of
                objects or increase quota.
                <Text fontSize={14} fontWeight={600} mt={12}>
                  Remaining Quota: {remainQuotaBytes}
                </Text>
              </Box>
            }
          >
            <div>
              <GhostButton
                as={!downloadable ? 'span' : 'button'}
                disabled={!downloadable}
                variant="ghost"
                onClick={onBatchDownload}
              >
                Download
              </GhostButton>
            </div>
          </Tooltip>
        )}
        <GhostButton variant="ghost">Delete</GhostButton>
      </Text>
    </>
  );
});
