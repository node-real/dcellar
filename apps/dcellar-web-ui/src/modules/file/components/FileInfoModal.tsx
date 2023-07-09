import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Image,
  Text,
  Flex,
  Link,
  Divider,
} from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import {
  directlyDownload,
  downloadWithProgress,
  formatBytes,
  saveFileByAxiosResponse,
} from '@/modules/file/utils';
import { CopyText } from '@/components/common/CopyText';
import { encodeObjectName, formatAddress, trimAddress, formatId } from '@/utils/string';
import { DCModal } from '@/components/common/DCModal';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import React, { useMemo, useState } from 'react';
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
import { ChainVisibilityEnum } from '../type';
import { SpItem } from '@/store/slices/sp';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData, selectAccountConfig } from '@/store/slices/persist';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  buttonText?: string;
  buttonOnClick?: () => void;
  bucketName: string;
  folderName: string;
  fileInfo?: { name: string; size: number; id: string };
  createdDate?: number;
  primarySp: SpItem;
  hash?: string;
  onConfirmDownloadModalOpen: () => void;
  onShareModalOpen: () => void;
  shareLink?: string;
  visibility?: ChainVisibilityEnum;
  remainingQuota: number | null;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
}

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

const renderVisibilityTag = (visibility: ChainVisibilityEnum) => {
  // public File
  if (visibility === ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ) {
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
  if (visibility === ChainVisibilityEnum.VISIBILITY_TYPE_PRIVATE) {
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

export const FileInfoModal = (props: modalProps) => {
  const dispatch = useAppDispatch();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { directDownload: allowDirectDownload } = useAppSelector(selectAccountConfig(address));
  const { setOpenAuthModal } = useOffChainAuth();
  const {
    title = 'File Detail',
    onClose,
    isOpen,
    bucketName,
    fileInfo = { name: '', size: '', id: '' },
    createdDate = 0,
    primarySp,
    shareLink,
    remainingQuota,
    folderName = '',
    visibility = ChainVisibilityEnum.VISIBILITY_TYPE_UNSPECIFIED,
    onConfirmDownloadModalOpen,
    onShareModalOpen,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    setStatusModalButtonText,
    setStatusModalErrorText,
    hash = '',
  } = props;

  const { name = '', size = '0' } = fileInfo;
  const [downloadButtonDisabled, setDownloadButtonDisabled] = useState(false);
  const isAbleDownload = useMemo(() => {
    return !(remainingQuota && remainingQuota - Number(size) < 0);
  }, [size, remainingQuota]);
  const nameWithoutFolderPrefix = name.replace(folderName, '');

  return (
    <>
      <DCModal
        isOpen={isOpen}
        onClose={onClose}
        w="568px"
        gaShowName="dc.file.f_detail_pop.0.show"
        gaClickCloseName="dc.file.f_detail_pop.close.click"
      >
        <ModalHeader fontWeight={600} fontSize={24} lineHeight="32px">
          {title}
        </ModalHeader>
        <ModalCloseButton top={16} right={24} color="readable.tertiary" />

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
                {nameWithoutFolderPrefix}
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
                {formatBytes(size)}
              </Text>
              <Flex>
                <Flex
                  h={'24px'}
                  bg={'rgba(0, 186, 52, 0.1)'}
                  paddingX={'10px'}
                  borderRadius={'12px'}
                >
                  {renderVisibilityTag(visibility)}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Divider />
        <Flex mt={16} w="100%" overflow="hidden" gap={8} flexDirection={'column'}>
          {renderPropRow('Date uploaded', formatFullTime(createdDate * 1000))}
          {renderAddressLink(
            'Object ID',
            formatId(Number(fileInfo.id)),
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
          {/* {renderPropRow(
            'Object hash',
            renderCopyAddress(hash, 'dc.file.f_detail_pop.copy_hash.click'),
          )} */}
          {visibility === ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ &&
            renderPropRow(
              'Universal link',
              renderUrlWithLink(
                `${primarySp.endpoint}/view/${bucketName}/${encodeObjectName(name)}`,
                true,
                32,
                'dc.file.f_detail_pop.universal.click',
                'dc.file.f_detail_pop.copy_universal.click',
              ),
            )}
        </Flex>

        <ModalFooter flexDirection={'column'}>
          <Flex w={'100%'}>
            {visibility === ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ && (
              <DCButton
                variant={'dcGhost'}
                flex={1}
                mr={'16px'}
                borderColor={'readable.normal'}
                gaClickName="dc.file.f_detail_pop.share.click"
                onClick={() => {
                  onShareModalOpen();
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
                if (allowDirectDownload) {
                  onClose();
                  if (shareLink && visibility === ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ) {
                    if (!isAbleDownload) {
                      setStatusModalIcon(NOT_ENOUGH_QUOTA_URL);
                      setStatusModalTitle(NOT_ENOUGH_QUOTA);
                      setStatusModalErrorText('');
                      setStatusModalDescription(NOT_ENOUGH_QUOTA_ERROR);
                      setStatusModalButtonText(BUTTON_GOT_IT);
                      onClose();
                      onStatusModalOpen();
                      return;
                    }
                    directlyDownload(shareLink);
                  } else {
                    try {
                      const { seedString } = await dispatch(
                        getSpOffChainData(address, primarySp.operatorAddress),
                      );
                      if (!seedString) {
                        onClose();
                        setOpenAuthModal();
                        return;
                      }
                      const result = await downloadWithProgress({
                        bucketName,
                        objectName: name,
                        primarySp,
                        payloadSize: Number(size),
                        address,
                        seedString,
                      });
                      saveFileByAxiosResponse(result, name);
                    } catch (e: any) {
                      if (e?.response?.status === 500) {
                        onClose();
                        setOpenAuthModal();
                      }
                      throw e;
                    }
                  }
                } else {
                  onClose();
                  onConfirmDownloadModalOpen();
                }
              }}
            >
              Download
            </DCButton>
          </Flex>
        </ModalFooter>
      </DCModal>
    </>
  );
};
