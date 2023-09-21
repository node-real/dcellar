import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import React, { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Image, Text } from '@totejs/uikit';
import { formatBytes } from '@/modules/file/utils';
import { DCButton } from '@/components/common/DCButton';
import { assetPrefix } from '@/base/env';
import { SHARE_ERROR_TYPES, ShareErrorType } from '@/modules/share/ShareError';
import {
  downloadObject,
  getCanObjectAccess,
  hasObjectPermission,
  previewObject,
} from '@/facade/object';
import { quotaRemains } from '@/facade/bucket';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_PERMISSION_DENIED, E_UNKNOWN } from '@/facade/error';
import { reportEvent } from '@/utils/reportEvent';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { setupBucketQuota } from '@/store/slices/bucket';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { SpItem } from '@/store/slices/sp';
import { IQuotaProps, PermissionTypes } from '@bnb-chain/greenfield-js-sdk';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { setStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT } from '@/modules/file/constant';

interface SharedFileProps {
  fileName: string;
  objectInfo: ObjectInfo;
  quotaData: IQuotaProps;
  loginAccount: string;
  primarySp: SpItem;
}

type ActionType = 'view' | 'download' | '';

export const SharedFile = memo<SharedFileProps>(function SharedFile({
  fileName,
  objectInfo,
  quotaData,
  loginAccount,
  primarySp,
}) {
  const dispatch = useAppDispatch();
  const [action, setAction] = useState<ActionType>('');
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
    dispatch(
      setStatusDetail({
        ...errorData,
        buttonText: BUTTON_GOT_IT,
        extraParams: [bucketName],
      }),
    );
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
    const operator = primarySp.operatorAddress;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
    const isPrivate = objectInfo.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
    if (isPrivate) {
      if (loginAccount === objectInfo.owner) {
        const [_, accessError] = await getCanObjectAccess(
          bucketName,
          objectName,
          primarySp.endpoint,
          loginAccount,
          seedString,
        );
        const errType = accessError as ShareErrorType;
        if (errType) return onError(errType);
      } else {
        const res = await hasObjectPermission(
          bucketName,
          objectName,
          PermissionTypes.ActionType.ACTION_GET_OBJECT,
          loginAccount,
        );
        if (res.effect !== PermissionTypes.Effect.EFFECT_ALLOW) {
          return onError(E_PERMISSION_DENIED);
        }
      }
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
            variant="ghost"
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
