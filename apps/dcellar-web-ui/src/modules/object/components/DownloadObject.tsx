import { ModalCloseButton, ModalHeader, ModalFooter, Text, Flex, Checkbox } from '@totejs/uikit';
import React, { useState } from 'react';
import { directlyDownload, formatBytes } from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { VisibilityType } from '@/modules/file/type';
import { useAppDispatch, useAppSelector } from '@/store';
import { useDispatch } from 'react-redux';
import { getSpOffChainData, setAccountConfig } from '@/store/slices/persist';
import { ObjectItem, TStatusDetail, setEditDownload, setStatusDetail } from '@/store/slices/object';
import { quotaRemains } from '@/facade/bucket';
import { downloadObject, getDirectDownloadLink } from '@/facade/object';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

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
  const [currentAllowDirectDownload, setCurrentAllowDirectDownload] = useState(true);
  const { primarySp, editDownload, bucketName } = useAppSelector((root) => root.object);
  const { spInfo } = useAppSelector((root) => root.sp);
  const quotas = useAppSelector((root) => root.bucket.quotas);
  const [loading, setLoading] = useState(false);
  const directDownload = accounts[loginAccount].directDownload;
  const isOpen = !!editDownload.objectName;
  const { setOpenAuthModal } = useOffChainAuth();
  const onClose = () => {
    dispatch(setEditDownload({} as ObjectItem));
  };

  const directDownloadLink = getDirectDownloadLink({
    bucketName,
    primarySpEndpoint: primarySp.endpoint,
    objectName: editDownload.objectName,
  });

  const quotaData = quotas[bucketName];

  const [buttonDisabled, setButtonDisabled] = useState(false);
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

  const remainingQuota = +quotaData?.readQuota + +quotaData?.freeQuota - +quotaData?.consumedQuota;
  const transformedRemainingQuota = remainingQuota ? formatBytes(remainingQuota, true) : '--';

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.download_confirm.0.show"
      gaClickCloseName="dc.file.download_confirm.close.click"
    >
      <ModalHeader>Confirm Download</ModalHeader>
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
        You are going to cost download quota. Download process cannot be interrupted.
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
          onClick={async () => {
            const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(
              bucketName,
              editDownload.objectName,
              spInfo[primarySp.operatorAddress].endpoint,
            );
            const remainQuota = quotaRemains(quotaData!, editDownload.payloadSize + '');
            if (!remainQuota) {
              onClose();
              return dispatch(
                setStatusDetail({
                  icon: NOT_ENOUGH_QUOTA_URL,
                  title: NOT_ENOUGH_QUOTA,
                  errorText: '',
                  desc: NOT_ENOUGH_QUOTA_ERROR,
                  buttonText: BUTTON_GOT_IT,
                  buttonOnClick: () => {
                    dispatch(setStatusDetail({} as TStatusDetail));
                  },
                }),
              );
            }
            if (
              directDownloadLink &&
              editDownload.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
            ) {
              onClose();
              return directlyDownload(directDownloadLink);
            }
            const params = {
              primarySp,
              objectInfo: objectInfo!,
              address: loginAccount,
            };
            const operator = primarySp.operatorAddress;
            const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
            const [success, opsError] = await downloadObject(params, seedString);
            if (opsError) return onError(opsError);
            directDownload !== currentAllowDirectDownload &&
              dispatch(
                setAccountConfig({
                  address: loginAccount,
                  config: { directDownload: currentAllowDirectDownload },
                }),
              );
            onClose();

            return success;
          }}
          isLoading={loading}
          isDisabled={buttonDisabled}
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
              isChecked={currentAllowDirectDownload}
              color="readable.tertiary"
              fontWeight={400}
              fontSize={16}
              lineHeight="19px"
              onChange={(e) => {
                e.stopPropagation();
                dispatch(
                  setAccountConfig({
                    address: loginAccount,
                    config: { directDownload: !currentAllowDirectDownload },
                  }),
                );
                setCurrentAllowDirectDownload(!currentAllowDirectDownload);
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
