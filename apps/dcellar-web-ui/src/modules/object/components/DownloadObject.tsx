import { Checkbox, Flex, ModalCloseButton, ModalFooter, ModalHeader, Text } from '@totejs/uikit';
import React, { useEffect, useState } from 'react';
import { formatBytes } from '@/modules/file/utils';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData, setAccountConfig } from '@/store/slices/persist';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { ObjectItem, setEditDownload, setStatusDetail } from '@/store/slices/object';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { setupBucketQuota } from '@/store/slices/bucket';

interface modalProps {}

const renderProp = (key: string, value: string) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {key}
      </Text>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {value}
      </Text>
    </Flex>
  );
};

export const DownloadObject = (props: modalProps) => {
  const dispatch = useAppDispatch();
  const { loginAccount, accounts } = useAppSelector((root) => root.persist);
  const [currentAllowDirectDownload, setCurrentAllowDirectDownload] = useState<boolean | null>(
    null,
  );
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { editDownload, bucketName } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const quotas = useAppSelector((root) => root.bucket.quotas);
  const directDownload = accounts[loginAccount].directDownload;
  const isOpen = !!editDownload.objectName;
  const { setOpenAuthModal } = useOffChainAuth();
  const onClose = () => {
    dispatch(setEditDownload({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };

  const quotaData = quotas[bucketName];

  const onError = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      onClose();
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const remainingQuota =
    +quotaData?.readQuota +
    +quotaData?.freeQuota -
    +quotaData?.consumedQuota -
    +quotaData?.freeConsumedSize;
  const transformedRemainingQuota = remainingQuota ? formatBytes(remainingQuota, true) : '--';

  const onAction = async () => {
    const objectName = editDownload.objectName;
    const endpoint = primarySp.endpoint;
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const [_, accessError, objectInfo] = await getCanObjectAccess(
      bucketName,
      objectName,
      endpoint,
      loginAccount,
      seedString,
    );
    if (accessError) return onError(accessError);
    const params = {
      primarySp,
      objectInfo: objectInfo!,
      address: loginAccount,
    };

    const operator = primarySp.operatorAddress;
    // const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
    // onClose();
    const [success, opsError] = await (editDownload.action === 'download'
      ? downloadObject(params, seedString)
      : previewObject(params, seedString));
    if (opsError) return onError(opsError);
    onClose();
    return success;
  };

  useEffect(() => {
    if (!isOpen || !bucketName) return;
    dispatch(setupBucketQuota(bucketName));
  }, [isOpen, bucketName, dispatch]);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.download_confirm.0.show"
      gaClickCloseName="dc.file.download_confirm.close.click"
    >
      <ModalHeader>Confirm</ModalHeader>
      <ModalCloseButton />
      <Text
        fontSize="18px"
        lineHeight={'22px'}
        fontWeight={400}
        textAlign={'center'}
        marginTop="8px"
        color={'readable.secondary'}
        mb={'32px'}
      >
        You are going to cost quota. The process cannot be interrupted.
      </Text>
      <Flex
        bg={'bg.secondary'}
        padding={'8px 16px'}
        width={'100%'}
        flexDirection={'column'}
        mb={'32px'}
        borderRadius="12px"
      >
        {renderProp('Required quota', formatBytes(editDownload.payloadSize))}
        <Text
          fontSize={'12px'}
          lineHeight={'15px'}
          mt={'4px'}
          fontWeight={400}
          textAlign={'right'}
          width={'100%'}
          color={'readable.disabled'}
        >
          {`Remaining quota: ${transformedRemainingQuota}`}
        </Text>
      </Flex>
      <ModalFooter margin={0} flexDirection={'column'} gap={0}>
        <DCButton
          gaClickName="dc.file.download_confirm.confirm.click"
          w="100%"
          variant={'dcPrimary'}
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
        <Flex w={'100%'} alignItems={'center'} justifyContent={'center'} marginTop={'24px'}>
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
              Don't show again.
            </Checkbox>
          </GAClick>
        </Flex>
      </ModalFooter>
    </DCModal>
  );
};
