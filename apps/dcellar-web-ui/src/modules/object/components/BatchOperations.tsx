import React, { memo, useMemo, useState } from 'react';
import { Box, Text } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { setSelectedRowKeys, setStatusDetail, setupListObjects } from '@/store/slices/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { useMount, useUnmount } from 'ahooks';
import { setEditQuota, setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';
import { getSpOffChainData } from '@/store/slices/persist';
import { downloadObject } from '@/facade/object';
import { BatchDeleteObject } from '@/modules/object/components/batch-delete/BatchDeleteObject';
import { DCTooltip } from '@/components/common/DCTooltip';
import { DCButton } from '@/components/common/DCButton';

interface BatchOperationsProps {}

export const BatchOperations = memo<BatchOperationsProps>(function BatchOperations() {
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bucketName, objects, path } = useAppSelector((root) => root.object);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const quotas = useAppSelector((root) => root.bucket.quotas);
  const [isBatchDeleteOpen, setBatchDeleteOpen] = React.useState(false);
  const quotaData = quotas[bucketName] || {};
  const primarySp = primarySpInfo[bucketName];
  const [quotaTooltip, setQuotaTooltip] = useState(false);

  useMount(() => {
    dispatch(setupBucketQuota(bucketName));
  });

  useUnmount(() => {
    dispatch(setSelectedRowKeys([]));
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
    () => objects[path]?.filter((i) => selectedRowKeys.includes(i.objectName)) || [],
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

  const onBatchDelete = async () => {
    setBatchDeleteOpen(true);
  };

  const showDownload = items.every((i) => i.objectStatus === 1) || !items.length;
  const downloadable = remainQuota && showDownload && !!items.length;

  const refetch = async () => {
    if (!primarySp || !loginAccount) return;
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: primarySp.endpoint,
    };
    dispatch(setupListObjects(params));
  };

  const openQuotaManage = () => {
    setQuotaTooltip(false);
    dispatch(setEditQuota([bucketName, 'menu']));
  };

  const onOpenChange = (v: boolean) => {
    if (downloadable && v) return;
    if (remainQuota && v) return;
    setQuotaTooltip(v);
  };

  return (
    <>
      {isBatchDeleteOpen && (
        <BatchDeleteObject
          refetch={refetch}
          isOpen={isBatchDeleteOpen}
          cancelFn={() => setBatchDeleteOpen(false)}
        />
      )}
      <Text as="div" fontWeight={500} alignItems="center" display="flex" gap={12}>
        {showDownload && (
          <DCTooltip
            placement="bottomLeft"
            open={quotaTooltip}
            onOpenChange={onOpenChange}
            title={
              <Box fontSize={14} lineHeight="20px" p={4}>
                <Text
                  cursor="pointer"
                  as="span"
                  color="#00BA34"
                  _hover={{ color: '#2EC659' }}
                  borderBottom="1px solid currentColor"
                  onClick={openQuotaManage}
                >
                  Increase the quota
                </Text>{' '}
                or decrease the number of selected objects to continue.
              </Box>
            }
          >
            <DCButton
              as={!downloadable ? 'span' : 'button'}
              disabled={!downloadable}
              variant="ghost"
              onClick={onBatchDownload}
            >
              Download
            </DCButton>
          </DCTooltip>
        )}
        <DCButton disabled={!items.length} variant="ghost" onClick={onBatchDelete}>
          Delete
        </DCButton>
      </Text>
    </>
  );
});
