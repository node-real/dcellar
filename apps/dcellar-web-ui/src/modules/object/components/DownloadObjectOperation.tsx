import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketQuota, setupBucketQuota } from '@/store/slices/bucket';
import { getSpOffChainData, setAccountConfig } from '@/store/slices/persist';
import { SpEntity } from '@/store/slices/sp';
import { formatBytes } from '@/utils/formatter';
import { Checkbox, Flex, ModalBody, ModalFooter, ModalHeader, Text } from '@node-real/uikit';
import { memo, useEffect, useState } from 'react';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { setSignatureAction } from '@/store/slices/global';

const renderProp = (key: string, value: string) => {
  return (
    <Flex fontSize={14} alignItems={'center'} justifyContent={'space-between'}>
      <Text>{key}</Text>
      <Text>{value}</Text>
    </Flex>
  );
};

interface DownloadObjectOperationProps {
  primarySp: SpEntity;
  onClose?: () => void;
  actionParams?: Record<string, any>;
  objectName: string;
  payloadSize: number;
}

const defaultActionParams = {} as Record<string, any>;

export const DownloadObjectOperation = memo<DownloadObjectOperationProps>(function DownloadObject({
  onClose = () => {},
  primarySp,
  actionParams = defaultActionParams,
  objectName,
  payloadSize,
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountRecords = useAppSelector((root) => root.persist.accountRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);

  const [currentAllowDirectDownload, setCurrentAllowDirectDownload] = useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const { setOpenAuthModal } = useOffChainAuth();

  const bucketName = actionParams?.bucketName || currentBucketName;
  const directDownload = accountRecords[loginAccount].directDownload;
  const quotaData = bucketQuotaRecords[bucketName];

  const errorHandler = (type: string) => {
    setLoading(false);
    onClose();
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setSignatureAction(errorData));
  };

  const remainingQuota = +quotaData?.readQuota + +quotaData?.freeQuota - +quotaData?.consumedQuota;
  const transformedRemainingQuota = remainingQuota ? formatBytes(remainingQuota, true) : '--';

  const onAction = async () => {
    setLoading(true);
    const endpoint = primarySp.endpoint;
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );

    const [_, accessError, objectInfo, quota] = await getCanObjectAccess(
      bucketName,
      objectName,
      endpoint,
      loginAccount,
      seedString,
    );
    if (quota) {
      dispatch(setBucketQuota({ bucketName, quota }));
    }
    if (accessError) return errorHandler(accessError);
    const params = {
      primarySp,
      objectInfo: objectInfo!,
      address: loginAccount,
    };

    const [success, opsError] = await (actionParams.action === 'download'
      ? downloadObject(params, seedString)
      : previewObject(params, seedString));
    if (opsError) return errorHandler(opsError);
    setLoading(false);
    onClose();
    return success;
  };

  useEffect(() => {
    dispatch(setupBucketQuota(bucketName));
  }, [bucketName, dispatch]);

  return (
    <>
      <ModalHeader>Confirm Action</ModalHeader>
      <ModalBody>
        <Text className="ui-modal-desc">
          You are going to cost quota. The process cannot be interrupted.
        </Text>
        <Flex
          bg={'bg.bottom'}
          padding={'8px 12px'}
          flexDirection={'column'}
          borderRadius="4px"
          gap={8}
          color={'readable.tertiary'}
        >
          {renderProp('Required quota', formatBytes(payloadSize))}
          <Text fontSize={'12px'} textAlign={'right'} color={'readable.disabled'}>
            {`Remaining quota: ${transformedRemainingQuota}`}
          </Text>
        </Flex>
      </ModalBody>
      <ModalFooter flexDirection={'column'} gap={0}>
        <DCButton
          size="lg"
          gaClickName="dc.file.download_confirm.confirm.click"
          w="100%"
          isLoading={loading}
          onClick={() => {
            onAction();
            currentAllowDirectDownload !== null &&
              dispatch(
                setAccountConfig({
                  address: loginAccount,
                  config: { directDownload: currentAllowDirectDownload },
                }),
              );
          }}
        >
          Confirm
        </DCButton>
        <Flex w={'100%'} alignItems={'center'} justifyContent={'center'} marginTop={16}>
          <GAClick
            name={
              currentAllowDirectDownload
                ? 'dc.file.download_confirm.check_n.click'
                : 'dc.file.download_confirm.check_y.click'
            }
          >
            <Checkbox
              isChecked={
                currentAllowDirectDownload === null ? directDownload : currentAllowDirectDownload
              }
              color="readable.tertiary"
              fontWeight={400}
              fontSize={16}
              lineHeight="19px"
              onChange={(e) => {
                e.stopPropagation();
                const checked =
                  currentAllowDirectDownload === null
                    ? !directDownload
                    : !currentAllowDirectDownload;
                setCurrentAllowDirectDownload(checked);
              }}
            >
              Don&apos;t show again.
            </Checkbox>
          </GAClick>
        </Flex>
      </ModalFooter>
    </>
  );
});
