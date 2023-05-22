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

import { useLogin } from '@/hooks/useLogin';
import {
  directlyDownload,
  downloadWithProgress,
  formatBytes,
  saveFileByAxiosResponse,
} from '@/modules/file/utils';
import { formatDateUTC } from '@/utils/time';
import { CopyText } from '@/components/common/CopyText';
import { formatAddress, trimAddress } from '@/utils/string';
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

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  buttonText?: string;
  buttonOnClick?: () => void;
  bucketName: string;
  fileInfo?: { name: string; size: number };
  createdDate?: number;
  primarySpUrl?: string;
  primarySpAddress?: string;
  primarySpSealAddress?: string;
  hash?: string;
  onConfirmDownloadModalOpen: () => void;
  onShareModalOpen: () => void;
  shareLink?: string;
  visibility?: number;
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

const renderAddressLink = (key: string, value: string, gaClickName?: string) => {
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
        {renderAddressWithLink(value, gaClickName)}
      </Text>
    </Flex>
  );
};

const renderAddressWithLink = (address: string, gaClickName?: string) => {
  return (
    <CopyText value={formatAddress(address)} justifyContent="flex-end" gaClickName={gaClickName}>
      <Link
        target="_blank"
        color="#1184EE"
        cursor={'pointer'}
        textDecoration={'underline'}
        _hover={{
          color: '#1184EE',
        }}
        href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`}
        fontSize={'14px'}
        lineHeight={'17px'}
        fontWeight={500}
      >
        {trimAddress(address, 28, 15, 13)}
      </Link>
    </CopyText>
  );
};

const renderUrlWithLink = (
  text: string,
  needSlim = true,
  reservedNumber = 32,
  gaClickName?: string,
) => {
  const finalText = needSlim ? text.substring(0, reservedNumber) + '...' : text;
  return (
    <CopyText value={text} justifyContent="flex-end" gaClickName={gaClickName}>
      <Link
        target="_blank"
        color="#1184EE"
        cursor={'pointer'}
        textDecoration={'underline'}
        _hover={{
          color: '#1184EE',
        }}
        href={text}
        fontSize={'14px'}
        lineHeight={'17px'}
        fontWeight={500}
      >
        {finalText}
      </Link>
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

const renderVisibilityTag = (visibility: number) => {
  // public File
  if (visibility === 1) {
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
          Everyone can access
        </Text>
      </Flex>
    );
  }
  // private file
  if (visibility === 2) {
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
  const loginData = useLogin();
  const { loginState } = loginData;
  const { allowDirectDownload } = loginState;
  const {setOpenAuthModal} = useOffChainAuth();
  const {
    title = 'File Detail',
    onClose,
    isOpen,
    bucketName,
    fileInfo = { name: '', size: '' },
    createdDate = 0,
    primarySpUrl = '',
    primarySpAddress = '',
    primarySpSealAddress = '',
    shareLink,
    remainingQuota,
    visibility = 0,
    onConfirmDownloadModalOpen,
    onShareModalOpen,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    setStatusModalErrorText,
    hash = '',
  } = props;

  const { name = '', size = '0' } = fileInfo;
  const [downloadButtonDisabled, setDownloadButtonDisabled] = useState(false);
  const isAbleDownload = useMemo(() => {
    return !(remainingQuota && remainingQuota - Number(size) < 0);
  }, [size, remainingQuota]);

  return (
    <>
      <DCModal
        isOpen={isOpen}
        onClose={onClose}
        py={48}
        px={24}
        w="568px"
        overflow="hidden"
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
                {name}
              </Text>
              <Text
                fontSize={'12px'}
                lineHeight={'15px'}
                fontWeight={400}
                wordBreak={'break-all'}
                color={'readable.tertiary'}
                mb="12px"
                w={'100%'}
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
          {renderPropRow('Date uploaded', formatDateUTC(createdDate * 1000))}
          {renderAddressLink(
            'Primary SP address',
            primarySpAddress,
            'dc.file.f_detail_pop.copy_spadd.click',
          )}
          {renderAddressLink(
            'Primary SP seal address',
            primarySpSealAddress,
            'dc.file.f_detail_pop.copy_seal.click',
          )}
          {renderPropRow(
            'Object hash',
            renderCopyAddress(hash, 'dc.file.f_detail_pop.copy_hash.click'),
          )}
          {visibility === 1 &&
            renderPropRow(
              'Universal link',
              renderUrlWithLink(
                `${primarySpUrl}/view/${bucketName}/${name}`,
                true,
                32,
                'dc.file.f_detail_pop.copy_universal.click',
              ),
            )}
        </Flex>

        <ModalFooter flexDirection={'column'}>
          <Flex w={'100%'}>
            {visibility === 1 && (
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
                  if (shareLink && visibility === 1) {
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
                    const result = await downloadWithProgress(
                      bucketName,
                      name,
                      primarySpUrl,
                      Number(size),
                      loginState.address,
                    );
                    saveFileByAxiosResponse(result, name);
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
