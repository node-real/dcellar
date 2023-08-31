import {
  Divider,
  Flex,
  Image,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
} from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import { formatBytes } from '@/modules/file/utils';
import { CopyText } from '@/components/common/CopyText';
import { encodeObjectName, formatAddress, formatId, trimAddress } from '@/utils/string';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import React, { useState } from 'react';
import { FILE_INFO_IMAGE_URL } from '@/modules/file/constant';
import { DCButton } from '@/components/common/DCButton';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { formatFullTime } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectActionType,
  ObjectItem,
  setEditDetail,
  setEditDownload,
  setStatusDetail,
} from '@/store/slices/object';
import { DCDrawer } from '@/components/common/DCDrawer';
import { downloadObject, getCanObjectAccess, previewObject } from '@/facade/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { SharePermission } from '@/modules/object/components/SharePermission';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';

interface modalProps {}

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
      <Text
        as="div"
        flex={1}
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.normal'}
        textAlign={'right'}
      >
        {value}
      </Text>
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
      <Text
        as="div"
        flex={1}
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.normal'}
        textAlign={'right'}
      >
        {renderAddressWithLink(value, type, gaClickName, gaCopyClickName)}
      </Text>
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
    <CopyText
      value={formatAddress(address)}
      justifyContent="flex-end"
      gaClickName={gaCopyClickName}
    >
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
  text: string,
  needSlim = true,
  reservedNumber = 32,
  gaClickName?: string,
  gaCopyClickName?: string,
) => {
  const encodedText = encodeURI(text);
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

const renderCopyAddress = (address: string, gaClickName?: string) => {
  return (
    <CopyText value={formatAddress(address)} justifyContent="flex-end" gaClickName={gaClickName}>
      <Text as="span" fontSize={14} lineHeight="17px" fontWeight={500}>
        {trimAddress(address, 28, 15, 13)}
      </Text>
    </CopyText>
  );
};

const renderVisibilityTag = (visibility: any) => {
  // public File
  if (visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ) {
    return (
      <Flex h={'24px'} alignItems={'center'}>
        <PublicFileIcon fillColor={'#009E2C'} w={14} h={14} />
        <Text
          color={'readable.primary'}
          fontWeight={400}
          fontSize={'14px'}
          lineHeight={'17px'}
          ml={'6px'}
        >
          Public
        </Text>
      </Flex>
    );
  }
  // private file
  if (visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE) {
    return (
      <Flex h={'24px'} alignItems={'center'}>
        <PrivateFileIcon fillColor={'#009E2C'} w={14} h={14} />
        <Text
          color={'readable.primary'}
          fontWeight={400}
          fontSize={'14px'}
          lineHeight={'17px'}
          ml={'6px'}
        >
          Private
        </Text>
      </Flex>
    );
  }
  return <></>;
};

export const DetailObject = (props: modalProps) => {
  const dispatch = useAppDispatch();
  const [action, setAction] = useState<ObjectActionType>('');
  const { accounts, loginAccount } = useAppSelector((root) => root.persist);
  const { directDownload: allowDirectDownload } = accounts?.[loginAccount] || {};
  const { setOpenAuthModal } = useOffChainAuth();
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { editDetail, bucketName, objectsInfo, path } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const key = `${path}/${editDetail.name}`;
  const objectInfo = objectsInfo[key];

  const isOpen = !!editDetail.name;
  const onClose = () => {
    dispatch(setEditDetail({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };

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
      return dispatch(setEditDownload({ ...editDetail, action: e }));
    }
    const objectName = editDetail.objectName;
    const endpoint = primarySp.endpoint;
    setAction(e);
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
    const [success, opsError] = await (e === 'download'
      ? downloadObject(params, seedString)
      : previewObject(params, seedString));
    if (opsError) return onError(opsError);
    setAction('');
    return success;
  };

  if (!primarySp || !objectInfo) {
    return <></>;
  }

  return (
    <>
      <DCDrawer
        isOpen={isOpen}
        onClose={onClose}
        gaShowName="dc.file.f_detail_pop.0.show"
        gaClickCloseName="dc.file.f_detail_pop.close.click"
      >
        <QDrawerHeader fontWeight={600} fontSize={24} lineHeight="32px">
          Object Detail
        </QDrawerHeader>
        <QDrawerBody>
          <Flex mt={8} mb={24} flexDirection={'column'} alignItems={'center'} display={'flex'}>
            <Flex w="100%" overflow="hidden">
              <Image src={FILE_INFO_IMAGE_URL} boxSize={48} mr={'24px'} alt="" />
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
                  {editDetail.name}
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
                  {formatBytes(editDetail.payloadSize)}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Divider />
          <Flex my={24} w="100%" overflow="hidden" gap={8} flexDirection={'column'}>
            {renderPropRow('Date Created', formatFullTime(+objectInfo.ObjectInfo.CreateAt * 1000))}
            {renderAddressLink(
              'Object ID',
              formatId(Number(objectInfo.ObjectInfo?.Id)),
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
              'Create transaction hash',
              objectInfo.CreateTxHash,
              'dc.object.f_detail_pop.CreateTxHash.click',
              'dc.object.f_detail_pop.copy_create_tx_hash.click',
              'tx',
            )}
            {renderAddressLink(
              'Seal transaction hash',
              objectInfo.SealTxHash,
              'dc.object.f_detail_pop.SealTxHash.click',
              'dc.object.f_detail_pop.copy_seal_tx_hash.click',
              'tx',
            )}
            {editDetail.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ &&
              renderPropRow(
                'Universal link',
                renderUrlWithLink(
                  `${primarySp.endpoint}/view/${bucketName}/${encodeObjectName(editDetail.name)}`,
                  true,
                  32,
                  'dc.file.f_detail_pop.universal.click',
                  'dc.file.f_detail_pop.copy_universal.click',
                ),
              )}
          </Flex>
          <Divider />
          <SharePermission />
        </QDrawerBody>
        {editDetail.objectStatus === 1 && (
          <QDrawerFooter flexDirection={'column'}>
            <Flex w={'100%'}>
              <DCButton
                variant={'dcGhost'}
                flex={1}
                mr={'16px'}
                borderColor={'readable.normal'}
                gaClickName="dc.file.f_detail_pop.share.click"
                onClick={() => onAction('view')}
              >
                Preview
              </DCButton>
              <DCButton
                variant={'dcPrimary'}
                flex={1}
                gaClickName="dc.file.f_detail_pop.download.click"
                onClick={() => onAction('download')}
              >
                Download
              </DCButton>
            </Flex>
          </QDrawerFooter>
        )}
      </DCDrawer>
    </>
  );
};
