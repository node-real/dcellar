import { Divider, Flex, QDrawerBody, QDrawerFooter, QDrawerHeader, Text } from '@node-real/uikit';
import { encodeObjectName, formatId } from '@/utils/string';
import React, { memo, useState } from 'react';
import { EMPTY_TX_HASH } from '@/modules/object/constant';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { formatFullTime } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectActionType,
  setEditObjectTagsData,
  setObjectOperation,
  setStatusDetail,
} from '@/store/slices/object';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { SharePermission } from '@/modules/object/components/SharePermission';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { TBucket, setReadQuota } from '@/store/slices/bucket';
import { TAccountInfo } from '@/store/slices/accounts';
import { SpItem } from '@/store/slices/sp';
import { last } from 'lodash-es';
import { formatBytes } from '@/utils/formatter';
import { IconFont } from '@/components/IconFont';
import {
  renderAddressLink,
  renderPropRow,
  renderTags,
  renderUrlWithLink,
} from '@/modules/object/components/renderRows';
import { convertObjectKey } from '@/utils/common';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useUnmount } from 'ahooks';
import { DEFAULT_TAG } from '@/components/common/ManageTags';

interface DetailObjectOperationProps {
  selectObjectInfo: ObjectMeta;
  selectBucket: TBucket;
  bucketAccountDetail: TAccountInfo;
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
  const onEditTags = () => {
    const lowerKeyTags = selectObjectInfo.ObjectInfo?.Tags?.Tags.map((item) =>
      convertObjectKey(item, 'lowercase'),
    );
    dispatch(setEditObjectTagsData(lowerKeyTags as ResourceTags_Tag[]));
    dispatch(
      setObjectOperation({
        level: 1,
        operation: [`${objectInfo.BucketName}/${objectInfo.ObjectName}`, 'update_tags'],
      }),
    );
  };

  useUnmount(() => dispatch(setEditObjectTagsData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader>Object Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mb={24}>
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
        <Divider />
        <Flex my={8} gap={8} flexDirection={'column'}>
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
          {renderTags({
            onClick: onEditTags,
            tagsCount: selectObjectInfo.ObjectInfo?.Tags.Tags.length || 0,
          })}
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
