import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex,
  Checkbox,
  Box,
} from '@totejs/uikit';
import React, { useEffect, useMemo, useState } from 'react';
import { downloadFile } from '@bnb-chain/greenfield-storage-js-sdk';

import { useLogin } from '@/hooks/useLogin';
import { directylyDownload, formatBytes } from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_DOWNLOAD_ERROR,
  FILE_DOWNLOAD_URL,
  FILE_FAILED_URL,
  FILE_STATUS_DOWNLOADING,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DOWNLOADING,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  description?: string;
  buttonText?: string;
  buttonOnClick?: () => void;
  bucketName: string;
  fileInfo?: { name: string; size: number };
  endpoint?: string;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
  shareLink?: string;
  remainingQuota: number | null;
}

const renderProp = (key: string, value: string) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {key}
      </Text>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {value}
      </Text>
    </Flex>
  );
};

export const ConfirmDownloadModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState, loginDispatch } = loginData;
  const [currentAllowDirectDownload, setCurrentAllowDirectDownload] = useState(true);
  const [hasChangedDownload, setHasChangedDownload] = useState(false);

  const [loading, setLoading] = useState(false);
  const {
    title = 'Confirm Download',
    onClose,
    isOpen,
    bucketName,
    description = 'You are going to cost download quota. Download process cannot be interrupted.',
    fileInfo = { name: '', size: '' },
    endpoint = '',
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    setStatusModalErrorText,
    shareLink,
    remainingQuota,
  } = props;
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { name, size = '0' } = fileInfo;
  const setFailedStatusModal = (description: string, error: any) => {
    onStatusModalClose();
    setStatusModalIcon(FILE_FAILED_URL);
    setStatusModalTitle(FILE_TITLE_DOWNLOAD_FAILED);
    setStatusModalDescription(description);
    setStatusModalButtonText(BUTTON_GOT_IT);
    setStatusModalErrorText('Error message: ' + error?.message ?? '');
    onStatusModalOpen();
  };

  const transformedRemainingQuota = remainingQuota ? formatBytes(remainingQuota, true) : '--';
  const isAbleDownload = useMemo(() => {
    return !(remainingQuota && remainingQuota - Number(size) < 0);
  }, [size, remainingQuota]);
  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      p={'48px 24px'}
      w="568px"
      overflow="hidden"
      gaShowName="dc.file.download_confirm.0.show"
      gaClickCloseName="dc.file.download_confirm.close.click"
    >
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <Text
        fontSize="18px"
        lineHeight={'22px'}
        fontWeight={400}
        textAlign={'center'}
        marginTop="8px"
        color={'readable.secondary'}
        mb={'32px'}
      >
        {description}
      </Text>
      <Flex
        bg={'bg.secondary'}
        padding={'8px 16px'}
        width={'100%'}
        flexDirection={'column'}
        mb={'32px'}
        borderRadius="12px"
      >
        {renderProp('Required quota', formatBytes(size))}
        <Text
          fontSize={'12px'}
          lineHeight={'15px'}
          mt={'4px'}
          fontWeight={400}
          textAlign={'right'}
          width={'100%'}
          color={'readable.disabled'}
        >
          {`Remaining quota: ${transformedRemainingQuota}`}
        </Text>
      </Flex>
      <ModalFooter margin={0} flexDirection={'column'} gap={0}>
        <DCButton
          gaClickName="dc.file.download_confirm.confirm.click"
          w="100%"
          variant={'dcPrimary'}
          onClick={async () => {
            try {
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
              setLoading(true);
              onClose();
              if (!hasChangedDownload) {
                loginDispatch({
                  type: 'UPDATE_DOWNLOAD_OPTION',
                  payload: {
                    allowDirectDownload: true,
                  },
                });
              }
              if (shareLink) {
                directylyDownload(shareLink);
              } else {
                setStatusModalIcon(FILE_DOWNLOAD_URL);
                setStatusModalTitle(FILE_TITLE_DOWNLOADING);
                setStatusModalErrorText('');
                setStatusModalDescription(FILE_STATUS_DOWNLOADING);
                setStatusModalButtonText('');
                onStatusModalOpen();
                await downloadFile({ bucketName, objectName: name, endpoint });
                onStatusModalClose();
              }
              setLoading(false);
            } catch (error: any) {
              setLoading(false);
              onClose();
              setFailedStatusModal(FILE_DESCRIPTION_DOWNLOAD_ERROR, error);
              // eslint-disable-next-line no-console
              console.error('Download file error.', error);
            }
          }}
          isLoading={loading}
          isDisabled={buttonDisabled}
        >
          Confirm
        </DCButton>
        <Flex w={'100%'} alignItems={'center'} justifyContent={'center'} marginTop={'24px'}>
          <GAClick
            name={
              currentAllowDirectDownload
                ? 'dc.file.download_confirm.check_n.click'
                : 'dc.file.download_confirm.check_y.click'
            }
          >
            <Checkbox
              isChecked={currentAllowDirectDownload}
              color="readable.tertiary"
              fontWeight={400}
              fontSize={16}
              lineHeight="19px"
              onChange={(e) => {
                e.stopPropagation();

                if (!hasChangedDownload) {
                  setHasChangedDownload(true);
                }
                loginDispatch({
                  type: 'UPDATE_DOWNLOAD_OPTION',
                  payload: {
                    allowDirectDownload: !currentAllowDirectDownload,
                  },
                });
                setCurrentAllowDirectDownload(!currentAllowDirectDownload);
              }}
            >
              Don't show again.
            </Checkbox>
          </GAClick>
        </Flex>
      </ModalFooter>
    </DCModal>
  );
};
