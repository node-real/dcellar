import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import React, { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Image, Text, useDisclosure } from '@totejs/uikit';
import { formatBytes } from '@/modules/file/utils';
import { DCButton } from '@/components/common/DCButton';
import { assetPrefix } from '@/base/env';
import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/storage';
import { FileStatusModal } from '@/modules/file/components/FileStatusModal';
import { SHARE_ERROR_TYPES, ShareErrorType } from '@/modules/share/ShareError';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { quotaRemains } from '@/facade/bucket';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_SP_NOT_FOUND, E_UNKNOWN } from '@/facade/error';
import { reportEvent } from '@/utils/reportEvent';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { setupBucketQuota } from '@/store/slices/bucket';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { getSpUrlByBucketName } from '@/facade/virtual-group';
import { SpItem } from '@/store/slices/sp';
import { VisibilityType } from '../file/type';

interface SharedFileProps {
  fileName: string;
  objectInfo: ObjectInfo;
  quotaData: IQuotaProps;
  loginAccount: string;
}

type ActionType = 'view' | 'download' | '';

export const SharedFile = memo<SharedFileProps>(function SharedFile({
  fileName,
  objectInfo,
  quotaData,
  loginAccount,
}) {
  const dispatch = useAppDispatch();
  const { allSps } = useAppSelector((root) => root.sp);
  const [action, setAction] = useState<ActionType>('');
  const [statusModalIcon, setStatusModalIcon] = useState<string>('');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalDescription, setStatusModalDescription] = useState<string | JSX.Element>('');
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose,
  } = useDisclosure();
  const { setOpenAuthModal } = useOffChainAuth();
  const { bucketName, payloadSize, objectName } = objectInfo;
  const size = payloadSize.toString();

  const onError = (type: string) => {
    setAction('');
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = SHARE_ERROR_TYPES[type as ShareErrorType]
      ? SHARE_ERROR_TYPES[type as ShareErrorType]
      : SHARE_ERROR_TYPES[E_UNKNOWN];
    setStatusModalIcon(errorData.icon);
    setStatusModalTitle(errorData.title);
    setStatusModalDescription(errorData.desc);
    onStatusModalOpen();
  };

  const onAction = async (e: ActionType) => {
    if (action === e) return;
    reportEvent({
      name:
        e === 'download'
          ? 'dc.shared_ui.preview.download.click'
          : 'dc.shared_ui.preview.view.click',
    });
    let remainQuota = quotaRemains(quotaData, size);
    if (!remainQuota) return onError(E_NO_QUOTA);

    setAction(e);
    const [primarySpEndpoint, error] = await getSpUrlByBucketName(bucketName);
    if (!primarySpEndpoint) {
      return error;
    }
    const primarySp = allSps.find((item: SpItem) => item.endpoint === primarySpEndpoint);
    if (!primarySp) return onError(E_SP_NOT_FOUND);
    const operator = primarySp.operatorAddress;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
    const isPrivate = objectInfo.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
    if (isPrivate && loginAccount === objectInfo.owner) {
      const [_, accessError] = await getCanObjectAccess(
        bucketName,
        objectName,
        primarySpEndpoint,
        loginAccount,
        seedString,
      );
      const errType = accessError as ShareErrorType;
      if (errType) return onError(errType);
    }
    const params = {
      primarySp,
      objectInfo,
      address: loginAccount,
    };
    const [success, opsError] = await (e === 'download'
      ? downloadObject(params, seedString)
      : previewObject(params, seedString));
    if (opsError) return onError(opsError as ShareErrorType);
    dispatch(setupBucketQuota(bucketName));
    setAction('');
    return success;
  };

  return (
    <Content>
      <FileStatusModal
        isOpen={isStatusModalOpen}
        onClose={onStatusModalClose}
        buttonOnClick={onStatusModalClose}
        title={statusModalTitle}
        description={statusModalDescription}
        buttonText="Got It"
        icon={statusModalIcon}
      />
      <>
        <Flex gap={24}>
          <Image
            w={120}
            h={120}
            src={`${assetPrefix}/images/files/upload_file.svg`}
            alt={fileName}
          />
          <Flex flexDirection="column" gap={8}>
            <Text w={248} fontWeight={600} fontSize={16} lineHeight="19px" wordBreak="break-all">
              {fileName}
            </Text>
            <Text fontSize={12} lineHeight="15px">
              {formatBytes(size)}
            </Text>
          </Flex>
        </Flex>
        <Flex gap={16}>
          <DCButton
            iconSpacing={6}
            leftIcon={action === 'view' ? <Loading iconSize={24} strokeWidth={2} /> : <></>}
            w={188}
            h={48}
            variant="dcGhost"
            onClick={() => onAction('view')}
          >
            View
          </DCButton>
          <DCButton
            iconSpacing={6}
            leftIcon={
              action === 'download' ? (
                <Loading iconSize={24} strokeWidth={2} stroke="#fff" />
              ) : (
                <></>
              )
            }
            w={188}
            h={48}
            variant="dcPrimary"
            onClick={() => onAction('download')}
          >
            Download
          </DCButton>
        </Flex>
      </>
    </Content>
  );
});

const Content = styled.div`
  margin: auto;
  background: #ffffff;
  border: 1px solid #e6e8ea;
  border-radius: 12px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 32px;
`;
