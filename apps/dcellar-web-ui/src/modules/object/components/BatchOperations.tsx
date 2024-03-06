import { DCButton } from '@/components/common/DCButton';
import { DCTooltip } from '@/components/common/DCTooltip';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { quotaRemains } from '@/facade/bucket';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { downloadObject } from '@/facade/object';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketEditQuota, setupBucketQuota } from '@/store/slices/bucket';
import { setObjectOperation, setObjectSelectedKeys } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { Box, Text } from '@node-real/uikit';
import { useMount, useUnmount } from 'ahooks';
import { memo, useMemo, useState } from 'react';
import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import { setSignatureAction } from '@/store/slices/global';

const DEFAULT_QUOTA = {} as IQuotaProps;

interface BatchOperationsProps {
  shareMode?: boolean;
}

export const BatchOperations = memo<BatchOperationsProps>(function BatchOperations({
  shareMode = false,
}) {
  const dispatch = useAppDispatch();
  const objectSelectedKeys = useAppSelector((root) => root.object.objectSelectedKeys);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);

  const { setOpenAuthModal } = useOffChainAuth();
  const [quotaTooltip, setQuotaTooltip] = useState(false);

  const quotaData = bucketQuotaRecords[currentBucketName] || DEFAULT_QUOTA;
  const primarySp = primarySpRecords[currentBucketName];

  const onError = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setSignatureAction(errorData));
  };

  const items = useMemo(
    () =>
      objectListRecords[completeCommonPrefix]?.filter((i) =>
        objectSelectedKeys.includes(i.objectName),
      ) || [],
    [objectListRecords, completeCommonPrefix, objectSelectedKeys],
  );

  const remainQuota = useMemo(
    () =>
      quotaRemains(
        quotaData,
        items.reduce((x, y) => x + y.payloadSize, 0),
      ),
    [quotaData, items],
  );

  const showDownload = items.every((i) => i.objectStatus === 1) || !items.length;
  const downloadable = remainQuota && showDownload && !!items.length;

  const onBatchDownload = async () => {
    if (!remainQuota) return onError(E_NO_QUOTA);
    const operator = primarySp.operatorAddress;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));

    for (const item of items) {
      const payload = { primarySp, objectInfo: item, address: loginAccount };
      await downloadObject(payload, seedString, items.length > 1);
    }
    dispatch(setObjectSelectedKeys([]));
    dispatch(setupBucketQuota(currentBucketName));
  };

  const onBatchDelete = async () => {
    dispatch(setObjectOperation({ operation: ['', 'batch_delete'] }));
  };

  const onOpenQuotaManage = () => {
    setQuotaTooltip(false);
    dispatch(setBucketEditQuota([currentBucketName, 'menu']));
  };

  const onOpenChange = (v: boolean) => {
    if (downloadable && v) return;
    if (remainQuota && v) return;
    setQuotaTooltip(v);
  };

  useMount(() => {
    dispatch(setupBucketQuota(currentBucketName));
  });

  useUnmount(() => {
    dispatch(setObjectSelectedKeys([]));
  });

  return (
    <>
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
                  onClick={onOpenQuotaManage}
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
        {!shareMode && (
          <DCButton disabled={!items.length} variant="ghost" onClick={onBatchDelete}>
            Delete
          </DCButton>
        )}
      </Text>
    </>
  );
});
