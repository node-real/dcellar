import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import React, { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Grid, Text } from '@node-real/uikit';
import { DCButton } from '@/components/common/DCButton';
import { SHARE_ERROR_TYPES, ShareErrorType } from '@/modules/share/ShareError';
import {
  downloadObject,
  getCanObjectAccess,
  getObjectMeta,
  hasObjectPermission,
  previewObject,
} from '@/facade/object';
import { quotaRemains } from '@/facade/bucket';
import { E_NO_QUOTA, E_OFF_CHAIN_AUTH, E_PERMISSION_DENIED, E_UNKNOWN } from '@/facade/error';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { setupBucketQuota } from '@/store/slices/bucket';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { SpItem } from '@/store/slices/sp';
import { IQuotaProps, PermissionTypes } from '@bnb-chain/greenfield-js-sdk';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { setStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { reportEvent } from '@/utils/gtag';
import { formatBytes } from '@/utils/formatter';
import { IconFont } from '@/components/IconFont';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { useAsyncEffect } from 'ahooks';

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
  const [createHash, setCreateHash] = useState('');

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

  useAsyncEffect(async () => {
    if (!primarySp?.endpoint || !bucketName) return;
    const [res] = await getObjectMeta(bucketName, objectName, primarySp.endpoint);
    if (!res) return;
    setCreateHash(res.CreateTxHash);
  }, [primarySp?.endpoint, bucketName, objectName]);

  return (
    <Grid gap={16}>
      <Content>
        <Flex gap={24}>
          <IconFont w={120} type="detail-object" />
          <Flex flexDirection="column" gap={8}>
            <Text w={248} fontWeight={600} fontSize={16} lineHeight="19px" wordBreak="break-all">
              {fileName}
            </Text>
            <Text fontSize={12} lineHeight="15px">
              {formatBytes(size)}
            </Text>
          </Flex>
        </Flex>
        <Flex gap={16} mt={32} mb={16}>
          <DCButton
            size={'lg'}
            iconSpacing={6}
            leftIcon={action === 'view' ? <Loading iconSize={24} strokeWidth={2} /> : <></>}
            w={188}
            variant="ghost"
            onClick={() => onAction('view')}
          >
            View
          </DCButton>
          <DCButton
            size={'lg'}
            iconSpacing={6}
            leftIcon={
              action === 'download' ? (
                <Loading iconSize={24} strokeWidth={2} stroke="#fff" />
              ) : (
                <></>
              )
            }
            w={188}
            onClick={() => onAction('download')}
          >
            Download
          </DCButton>
        </Flex>
        <Text
          display="flex"
          alignSelf="center"
          flexWrap={'nowrap'}
          textDecoration="underline"
          fontSize={12}
          as="a"
          target="_blank"
          href={`${GREENFIELD_CHAIN_EXPLORER_URL}/tx/${createHash}`}
          color={'readable.secondary'}
          _hover={{ color: 'brand.brand7' }}
        >
          Check on Explorer <IconFont w={14} ml={2} type="out" />
        </Text>
      </Content>
      <Text as="div" color={'readable.tertiary'} textAlign={'center'}>
        By downloading the object, you agree to our{' '}
        <Text
          textDecoration={'underline'}
          as="a"
          target="_blank"
          href="/terms"
          color={'readable.normal'}
          _hover={{ color: 'brand.brand7' }}
        >
          Terms of Use
        </Text>
        .
      </Text>
    </Grid>
  );
});

const Content = styled.div`
  margin: auto;
  background: #ffffff;
  border: 1px solid #e6e8ea;
  border-radius: 4px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
