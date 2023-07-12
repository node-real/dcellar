import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import React, { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Image, Text, useDisclosure } from '@totejs/uikit';
import { formatBytes } from '@/modules/file/utils';
import { DCButton } from '@/components/common/DCButton';
import { assetPrefix } from '@/base/env';
import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import { FileStatusModal } from '@/modules/file/components/FileStatusModal';
import { SHARE_ERROR_TYPES, ShareErrorType } from '@/modules/share/ShareError';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { headBucket, quotaRemains } from '@/facade/bucket';
import { E_NO_QUOTA, E_SP_NOT_FOUND, E_UNKNOWN } from '@/facade/error';
import { reportEvent } from '@/utils/reportEvent';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { setupBucketQuota } from '@/store/slices/bucket';

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
  const { oneSp, spInfo } = useAppSelector((root) => root.sp);
  const [action, setAction] = useState<ActionType>('');
  const [statusModalIcon, setStatusModalIcon] = useState<string>('');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalDescription, setStatusModalDescription] = useState<string | JSX.Element>('');
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose,
  } = useDisclosure();
  const { bucketName, payloadSize, objectName } = objectInfo;
  const endpoint = spInfo[oneSp].endpoint;
  const size = payloadSize.toString();

  const onError = (type: string) => {
    setAction('');
    const errorData = SHARE_ERROR_TYPES[type as ShareErrorType]
      ? SHARE_ERROR_TYPES[type as ShareErrorType]
      : SHARE_ERROR_TYPES[E_UNKNOWN];
    setStatusModalIcon(errorData.icon);
    setStatusModalTitle(errorData.title);
    setStatusModalDescription(errorData.desc);
    onStatusModalOpen();
  };

  const onAction = async (e: ActionType) => {
    if (action) return;
    reportEvent({
      name:
        e === 'download'
          ? 'dc.shared_ui.preview.download.click'
          : 'dc.shared_ui.preview.view.click',
    });

    let remainQuota = quotaRemains(quotaData, size);
    if (!remainQuota) return onError(E_NO_QUOTA);

    setAction(e);
    const [_, accessError] = await getCanObjectAccess(
      bucketName,
      objectName,
      endpoint,
      loginAccount,
    );
    const errType = accessError as ShareErrorType;
    if (errType) return onError(errType);

    const bucketInfo = await headBucket(bucketName);
    if (!bucketInfo) return onError(E_UNKNOWN);

    const primarySp = spInfo[bucketInfo.primarySpAddress];
    if (!primarySp) return onError(E_SP_NOT_FOUND);

    const params = {
      primarySp,
      objectInfo,
      address: loginAccount,
    };

    const operator = primarySp.operatorAddress;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
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
