import { ModalCloseButton, ModalHeader, ModalFooter, Text, Flex, Checkbox } from '@totejs/uikit';
import React, { useEffect, useMemo, useState } from 'react';

import { useLogin } from '@/hooks/useLogin';
import { downloadWithProgress, formatBytes, viewFileByAxiosResponse } from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_DOWNLOAD_ERROR,
  FILE_FAILED_URL,
  FILE_TITLE_DOWNLOAD_FAILED,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

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
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
  viewLink?: string;
  remainingQuota: number | null;
  visibility?: number;
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

export const ConfirmViewModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState, loginDispatch } = loginData;
  const [currentAllowDirectView, setCurrentAllowDirectView] = useState(true);
  const [hasChangedView, setHasChangedView] = useState(false);
  const {setOpenAuthModal} = useOffChainAuth();

  const [loading, setLoading] = useState(false);
  const {
    title = 'Confirm View',
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
    viewLink,
    remainingQuota,
    visibility = 0,
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
  const isAbleView = useMemo(() => {
    return !(remainingQuota && remainingQuota - Number(size) < 0);
  }, [size, remainingQuota]);
  return (
    <DCModal isOpen={isOpen} onClose={onClose}  w="568px" overflow="hidden">
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton mt={'4px'} />
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
          w="100%"
          variant={'dcPrimary'}
          onClick={async () => {
            try {
              if (!isAbleView) {
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
              if (!hasChangedView) {
                loginDispatch({
                  type: 'UPDATE_VIEW_OPTION',
                  payload: {
                    allowDirectView: true,
                  },
                });
              }
              setLoading(false);
              if (visibility === 1) {
                window.open(viewLink, '_blank');
              } else {
                // viewFile({ bucketName, objectName: object_name, endpoint });
                // preview file
                try {
                  const result = await downloadWithProgress(
                    bucketName,
                    name,
                    endpoint,
                    Number(size),
                    loginState.address,
                  );
                  viewFileByAxiosResponse(result);
                } catch (error: any) {
                  if (error?.response?.statusCode === 500) {
                    onClose();
                    onStatusModalClose();
                    setOpenAuthModal();
                  }
                  throw new Error(error);
                }
              }
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
          <Checkbox
            isChecked={currentAllowDirectView}
            color="readable.tertiary"
            fontWeight={400}
            fontSize={16}
            lineHeight="19px"
            onChange={() => {
              if (!hasChangedView) {
                setHasChangedView(true);
              }
              loginDispatch({
                type: 'UPDATE_VIEW_OPTION',
                payload: {
                  allowDirectView: !currentAllowDirectView,
                },
              });
              setCurrentAllowDirectView(!currentAllowDirectView);
            }}
          >
            Don't show again.
          </Checkbox>
        </Flex>
      </ModalFooter>
    </DCModal>
  );
};
