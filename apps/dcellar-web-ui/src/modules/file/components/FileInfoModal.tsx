import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Button,
  Image,
  Text,
  Flex,
  Link,
  Divider,
  toast,
} from '@totejs/uikit';
import { downloadFile } from '@bnb-chain/greenfield-storage-js-sdk';

import { useLogin } from '@/hooks/useLogin';
import { directylyDownload, formatBytes } from '@/modules/file/utils';
import { formatDateUTC } from '@/utils/time';
import { CopyText } from '@/components/common/CopyText';
import { formatAddress, trimAddress } from '@/utils/string';
import { DCModal } from '@/components/common/DCModal';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import React, { useMemo, useState } from 'react';
import { DCButton } from '@/components/common/DCButton';
import { FILE_INFO_IMAGE_URL } from '@/modules/file/constant';

const renderFileInfo = (key: string, value: string) => {
  return (
    <>
      <Text
        fontSize={'12px'}
        lineHeight={'16px'}
        fontWeight={400}
        wordBreak={'break-all'}
        color={'readable.tertiary'}
        mb="4px"
        w={'100%'}
      >
        {key}
      </Text>
      <Text
        fontSize={'14px'}
        lineHeight={'18px'}
        fontWeight={500}
        wordBreak={'break-all'}
        color={'readable.normal'}
        mb="8px"
        w={'100%'}
      >
        {value}
      </Text>
    </>
  );
};

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
  remainingQuota: number | null;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
  restriction?: boolean;
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

export const FileInfoModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState } = loginData;
  const { allowDirectDownload } = loginState;
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
    onConfirmDownloadModalOpen,
    onShareModalOpen,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    setStatusModalButtonText,
    setStatusModalErrorText,
    hash = '',
    restriction = false,
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
              {renderFileInfo('Name', name)}
              {renderFileInfo('Size', `${formatBytes(size)}`)}
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
          {renderPropRow(
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
            <DCButton
              variant={'dcPrimary'}
              flex={1}
              isDisabled={downloadButtonDisabled}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => {
                if (allowDirectDownload) {
                  onClose();
                  if (shareLink) {
                    // if (!isAbleDownload) {
                    //   setStatusModalIcon(NOT_ENOUGH_QUOTA_URL);
                    //   setStatusModalTitle(NOT_ENOUGH_QUOTA);
                    //   setStatusModalErrorText('');
                    //   setStatusModalDescription(NOT_ENOUGH_QUOTA_ERROR);
                    //   setStatusModalButtonText(BUTTON_GOT_IT);
                    //   onClose();
                    //   onStatusModalOpen();
                    //   return;
                    // }
                    directylyDownload(shareLink);
                  } else {
                    downloadFile({ bucketName, objectName: name, endpoint: primarySpUrl });
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
