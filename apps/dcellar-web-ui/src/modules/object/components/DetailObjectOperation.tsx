import {
  Divider,
  Flex,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
} from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import { CopyText } from '@/components/common/CopyText';
import { encodeObjectName, formatAddress, formatId, trimAddress } from '@/utils/string';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import React, { memo, useState } from 'react';
import { EMPTY_TX_HASH } from '@/modules/object/constant';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { formatFullTime } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import { ObjectActionType, setObjectOperation, setStatusDetail } from '@/store/slices/object';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { SharePermission } from '@/modules/object/components/SharePermission';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { AllBucketInfo, setReadQuota } from '@/store/slices/bucket';
import { TAccountDetail } from '@/store/slices/accounts';
import { SpItem } from '@/store/slices/sp';
import { last } from 'lodash-es';
import { formatBytes } from '@/utils/formatter';
import { IconFont } from '@/components/IconFont';

const renderPropRow = (key: string, value: React.ReactNode) => {
  return (
    <Flex alignItems="center" justifyContent="space-between" h={25}>
      <Text
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.tertiary'}
        width="200px"
        mr="16px"
      >
        {key}
      </Text>
      {value}
    </Flex>
  );
};

const renderAddressLink = (
  key: string,
  value: string,
  gaClickName?: string,
  gaCopyClickName?: string,
  type = 'account',
) => {
  return (
    <Flex alignItems="center" justifyContent="space-between" h={25}>
      <Text
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.tertiary'}
        width="200px"
        mr="16px"
      >
        {key}
      </Text>
      {renderAddressWithLink(value, type, gaClickName, gaCopyClickName)}
    </Flex>
  );
};

const renderAddressWithLink = (
  address: string,
  type: string,
  gaClickName?: string,
  gaCopyClickName?: string,
) => {
  return (
    <CopyText value={formatAddress(address)} gaClickName={gaCopyClickName}>
      <GAClick name={gaClickName}>
        <Link
          target="_blank"
          color="#1184EE"
          cursor={'pointer'}
          textDecoration={'underline'}
          _hover={{
            color: '#3C9AF1',
          }}
          href={`${GREENFIELD_CHAIN_EXPLORER_URL}/${type}/${address}`}
          fontSize={'14px'}
          lineHeight={'17px'}
          fontWeight={500}
        >
          {trimAddress(address, 28, 15, 13)}
        </Link>
      </GAClick>
    </CopyText>
  );
};

const renderUrlWithLink = (
  encodedText: string,
  needSlim = true,
  reservedNumber = 32,
  gaClickName?: string,
  gaCopyClickName?: string,
) => {
  const finalText = needSlim ? encodedText.substring(0, reservedNumber) + '...' : encodedText;
  return (
    <CopyText value={encodedText} justifyContent="flex-end" gaClickName={gaCopyClickName}>
      <GAClick name={gaClickName}>
        <Link
          target="_blank"
          color="#1184EE"
          cursor={'pointer'}
          textDecoration={'underline'}
          _hover={{
            color: '#1184EE',
          }}
          href={encodedText}
          fontSize={'14px'}
          lineHeight={'17px'}
          fontWeight={500}
        >
          {finalText}
        </Link>
      </GAClick>
    </CopyText>
  );
};

interface DetailObjectOperationProps {
  selectObjectInfo: ObjectMeta;
  selectBucket: AllBucketInfo;
  bucketAccountDetail: TAccountDetail;
  primarySp: SpItem;
}

export const DetailObjectOperation = memo<DetailObjectOperationProps>(function DetailOperation(
  props,
) {
  const { selectObjectInfo, selectBucket, bucketAccountDetail, primarySp } = props;
  const dispatch = useAppDispatch();
  const [action, setAction] = useState<ObjectActionType>('');
  const { accounts, loginAccount } = useAppSelector((root) => root.persist);
  const { directDownload: allowDirectDownload } = accounts?.[loginAccount] || {};
  const { setOpenAuthModal } = useOffChainAuth();
  const { bucketName } = useAppSelector((root) => root.object);
  const { owner } = useAppSelector((root) => root.bucket);
  const objectInfo = selectObjectInfo.ObjectInfo;
  const name = last(objectInfo.ObjectName.split('/'));

  const onError = (type: string) => {
    setAction('');
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const onAction = async (e: ObjectActionType) => {
    if (action === e) return;
    if (!allowDirectDownload && e === 'download') {
      return dispatch(
        setObjectOperation({
          level: 1,
          operation: [`${bucketName}/${objectInfo.ObjectName}`, 'download', { action: e }],
        }),
      );
    }
    const objectName = objectInfo.ObjectName;
    const endpoint = primarySp.endpoint;
    setAction(e);
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const [_, accessError, _objectInfo, quota] = await getCanObjectAccess(
      bucketName,
      objectName,
      endpoint,
      loginAccount,
      seedString,
    );
    if (quota) {
      dispatch(setReadQuota({ bucketName, quota }));
    }
    if (accessError) return onError(accessError);

    const params = {
      primarySp,
      objectInfo: _objectInfo!,
      address: loginAccount,
    };
    const [success, opsError] = await (e === 'download'
      ? downloadObject(params, seedString)
      : previewObject(params, seedString));
    if (opsError) return onError(opsError);
    setAction('');
    return success;
  };

  return (
    <>
      <QDrawerHeader>Object Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mb={24} flexDirection={'column'} alignItems={'center'} display={'flex'}>
          <Flex w="100%" overflow="hidden">
            <IconFont type="detail-object" w={48} mr={24} />
            <Flex flex={1} flexDirection={'column'}>
              <Text
                fontSize={18}
                fontWeight={600}
                lineHeight="normal"
                wordBreak={'break-all'}
                color={'readable.normal'}
                mb="8px"
                w={'100%'}
              >
                {name}
              </Text>
              <Text
                fontSize={14}
                lineHeight="normal"
                fontWeight={500}
                wordBreak={'break-all'}
                color={'readable.tertiary'}
                w={'100%'}
                as="div"
              >
                {formatBytes(objectInfo.PayloadSize)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Divider />
        <Flex my={8} w="100%" overflow="hidden" gap={8} flexDirection={'column'}>
          {renderPropRow('Date created', formatFullTime(+objectInfo.CreateAt * 1000))}
          {renderAddressLink(
            'Object ID',
            formatId(Number(objectInfo.Id)),
            'dc.file.f_detail_pop.id.click',
            'dc.file.f_detail_pop.copy_id.click',
            'object',
          )}
          {renderAddressLink(
            'Primary SP address',
            primarySp.operatorAddress,
            'dc.file.f_detail_pop.spadd.click',
            'dc.file.f_detail_pop.copy_spadd.click',
          )}
          {renderAddressLink(
            'Primary SP seal address',
            primarySp.operatorAddress,
            'dc.file.f_detail_pop.seal.click',
            'dc.file.f_detail_pop.copy_seal.click',
          )}
          {renderAddressLink(
            'Payment address',
            selectBucket.PaymentAddress,
            'dc.file.f_detail_pop.seal.click',
            'dc.file.f_detail_pop.copy_seal.click',
          )}
          {renderAddressLink(
            'Create transaction hash',
            selectObjectInfo.CreateTxHash,
            'dc.object.f_detail_pop.CreateTxHash.click',
            'dc.object.f_detail_pop.copy_create_tx_hash.click',
            'tx',
          )}
          {selectObjectInfo.SealTxHash !== EMPTY_TX_HASH &&
            renderAddressLink(
              'Seal transaction hash',
              selectObjectInfo.SealTxHash,
              'dc.object.f_detail_pop.SealTxHash.click',
              'dc.object.f_detail_pop.copy_seal_tx_hash.click',
              'tx',
            )}
          {objectInfo.Visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ &&
            renderPropRow(
              'Universal link',
              renderUrlWithLink(
                `${primarySp.endpoint}/view/${bucketName}/${encodeObjectName(
                  objectInfo.ObjectName,
                )}`,
                true,
                32,
                'dc.file.f_detail_pop.universal.click',
                'dc.file.f_detail_pop.copy_universal.click',
              ),
            )}
        </Flex>
        <Divider />
        <SharePermission selectObjectInfo={selectObjectInfo} />
      </QDrawerBody>
      {objectInfo.ObjectStatus === 1 && owner && (
        <QDrawerFooter flexDirection={'column'}>
          <Flex w={'100%'} gap={16}>
            <DCButton
              size={'lg'}
              variant="ghost"
              flex={1}
              gaClickName="dc.file.f_detail_pop.share.click"
              isDisabled={bucketAccountDetail.clientFrozen}
              onClick={() => onAction('view')}
            >
              Preview
            </DCButton>
            <DCButton
              size={'lg'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              isDisabled={bucketAccountDetail.clientFrozen}
              onClick={() => onAction('download')}
            >
              Download
            </DCButton>
          </Flex>
        </QDrawerFooter>
      )}
    </>
  );
});
