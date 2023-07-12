import {
  Image,
  Text,
  Flex,
  Link,
  Divider,
  QDrawerHeader,
  QDrawerCloseButton,
  QDrawerFooter,
  QDrawerBody,
} from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import { directlyDownload, formatBytes } from '@/modules/file/utils';
import { CopyText } from '@/components/common/CopyText';
import { encodeObjectName, formatAddress, trimAddress, formatId } from '@/utils/string';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import React, { useState } from 'react';
import {
  BUTTON_GOT_IT,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
  FILE_INFO_IMAGE_URL,
} from '@/modules/file/constant';
import { DCButton } from '@/components/common/DCButton';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { formatFullTime } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  TStatusDetail,
  setEditDetail,
  setEditDownload,
  setEditShare,
  setStatusDetail,
} from '@/store/slices/object';
import { DCDrawer } from '@/components/common/DCDrawer';
import { VisibilityType } from '@/modules/file/type';
import { downloadObject, getDirectDownloadLink, getShareLink } from '@/facade/object';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { quotaRemains } from '@/facade/bucket';
import { getSpOffChainData } from '@/store/slices/persist';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_UNKNOWN } from '@/facade/error';

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

  const { accounts, loginAccount } = useAppSelector((root) => root.persist);
  const { directDownload: allowDirectDownload } = accounts?.[loginAccount];
  const { setOpenAuthModal } = useOffChainAuth();
  const { editDetail, bucketName, primarySp, objectsInfo, path } = useAppSelector(
    (root) => root.object,
  );
  const key = `${path}/${editDetail.name}`;
  const objectInfo = objectsInfo[key];
  const { spInfo } = useAppSelector((root) => root.sp);

  const {
    quotas: { consumedQuota, freeQuota, readQuota },
  } = useAppSelector((root) => root.bucket);
  const remainingQuota = Number(readQuota) - Number(freeQuota) - Number(consumedQuota);
  const isOpen = !!editDetail.name;
  const onClose = () => {
    dispatch(setEditDetail({} as ObjectItem));
  };

  const shareLink = getShareLink(bucketName, editDetail?.objectName);
  const directDownloadLink = getDirectDownloadLink({
    bucketName,
    objectName: editDetail?.objectName,
    primarySpEndpoint: primarySp?.endpoint,
  });
  const [downloadButtonDisabled, setDownloadButtonDisabled] = useState(false);
  const onError = (type: string) => {
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

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
        <QDrawerCloseButton top={16} right={24} color="readable.tertiary" />
        <QDrawerBody>
          <Flex my="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
            <Flex w="100%" overflow="hidden">
              <Image src={FILE_INFO_IMAGE_URL} boxSize={120} mr={'24px'} alt="" />
              <Flex flex={1} flexDirection={'column'}>
                <Text
                  fontSize={'14px'}
                  lineHeight={'17px'}
                  fontWeight={500}
                  wordBreak={'break-all'}
                  color={'readable.normal'}
                  mb="8px"
                  w={'100%'}
                >
                  {editDetail.name}
                </Text>
                <Text
                  fontSize={'12px'}
                  lineHeight={'15px'}
                  fontWeight={400}
                  wordBreak={'break-all'}
                  color={'readable.tertiary'}
                  mb="12px"
                  w={'100%'}
                  as="div"
                >
                  {formatBytes(editDetail.payloadSize)}
                </Text>
                <Flex>
                  <Flex
                    h={'24px'}
                    bg={'rgba(0, 186, 52, 0.1)'}
                    paddingX={'10px'}
                    borderRadius={'12px'}
                  >
                    {renderVisibilityTag(editDetail.visibility)}
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Divider />
          <Flex mt={16} w="100%" overflow="hidden" gap={8} flexDirection={'column'}>
            {renderPropRow(
              'Date uploaded',
              formatFullTime(+objectInfo.object_info.create_at * 1000),
            )}
            {renderAddressLink(
              'Object ID',
              formatId(Number(objectInfo.object_info?.id)),
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
              objectInfo.create_tx_hash,
              'dc.object.f_detail_pop.create_tx_hash.click',
              'dc.object.f_detail_pop.copy_create_tx_hash.click',
              'tx',
            )}
            {renderAddressLink(
              'Seal transaction hash',
              objectInfo.seal_tx_hash,
              'dc.object.f_detail_pop.seal_tx_hash.click',
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
        </QDrawerBody>
        {editDetail.objectStatus === 1 && (
          <QDrawerFooter flexDirection={'column'}>
            <Flex w={'100%'}>
              {editDetail.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ && (
                <DCButton
                  variant={'dcGhost'}
                  flex={1}
                  mr={'16px'}
                  borderColor={'readable.normal'}
                  gaClickName="dc.file.f_detail_pop.share.click"
                  onClick={() => {
                    dispatch(setEditShare(editDetail));
                    onClose();
                  }}
                >
                  Share
                </DCButton>
              )}
              <DCButton
                variant={'dcPrimary'}
                flex={1}
                isDisabled={downloadButtonDisabled}
                gaClickName="dc.file.f_detail_pop.download.click"
                onClick={async () => {
                  const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(
                    bucketName,
                    editDetail.objectName,
                    spInfo[primarySp.operatorAddress].endpoint,
                  );
                  const remainQuota = quotaRemains(quotaData!, editDetail.payloadSize + '');
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
                  if (allowDirectDownload) {
                    if (
                      directDownloadLink &&
                      editDetail.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
                    ) {
                      return directlyDownload(directDownloadLink);
                    } else {
                      const params = {
                        primarySp,
                        objectInfo: objectInfo!,
                        address: loginAccount,
                      };
                      const operator = primarySp.operatorAddress;
                      const { seedString } = await dispatch(
                        getSpOffChainData(loginAccount, operator),
                      );
                      const [success, opsError] = await downloadObject(params, seedString);
                      if (opsError) return onError(opsError);

                      return success;
                    }
                  }
                  return dispatch(setEditDownload(editDetail));
                }}
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
